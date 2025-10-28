const fs = require('fs').promises;
const path = require('path');

const RULES_PATH = path.join(__dirname, '../../data/rules/document-extraction-rules.json');

/**
 * Load rules from JSON file
 * @returns {Promise<Object>} Rules configuration
 */
async function getRules() {
  try {
    const rulesData = await fs.readFile(RULES_PATH, 'utf8');
    return JSON.parse(rulesData);
  } catch (error) {
    console.error('Error loading rules:', error);
    throw error;
  }
}

/**
 * Update rules configuration
 * @param {Object} newRules - Updated rules configuration
 * @returns {Promise<void>}
 */
async function updateRules(newRules) {
  try {
    await fs.writeFile(RULES_PATH, JSON.stringify(newRules, null, 2));
    console.log('✅ Rules updated successfully');
  } catch (error) {
    console.error('Error updating rules:', error);
    throw error;
  }
}

/**
 * Get all document types
 * @returns {Promise<Array>} Array of document types
 */
async function getDocumentTypes() {
  const rules = await getRules();
  return rules.documentTypes.map(dt => ({
    id: dt.id,
    name: dt.name,
    category: dt.category,
    required: dt.required,
    conditions: dt.conditions || []
  }));
}

/**
 * Validate extracted document data against rules
 * @param {Object} extractedData - Extracted data from document
 * @param {string} documentType - Type of document
 * @param {Object} loanData - Loan application data
 * @returns {Promise<Object>} Validation results
 */
async function validateDocument(extractedData, documentType, loanData) {
  try {
    const rules = await getRules();
    const docTypeConfig = rules.documentTypes.find(dt => dt.id === documentType);

    if (!docTypeConfig) {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    const validationResults = {
      documentType,
      isValid: true,
      issues: [],
      warnings: [],
      info: [],
      fieldValidations: {}
    };

    // Validate each field
    for (const fieldRule of docTypeConfig.extractionRules.fields) {
      const fieldValue = extractedData.data[fieldRule.name];
      const fieldValidation = validateField(fieldRule, fieldValue, loanData);

      validationResults.fieldValidations[fieldRule.name] = fieldValidation;

      if (!fieldValidation.isValid) {
        validationResults.isValid = false;
        validationResults.issues.push({
          field: fieldRule.name,
          severity: 'critical',
          message: fieldValidation.message
        });
      }
    }

    // Apply document-level validations
    for (const validation of docTypeConfig.extractionRules.documentValidations) {
      const validationResult = applyDocumentValidation(
        validation,
        extractedData.data,
        loanData,
        documentType
      );

      if (!validationResult.passed) {
        const issue = {
          rule: validation.rule,
          severity: validation.severity,
          message: validation.message
        };

        if (validation.severity === 'critical') {
          validationResults.isValid = false;
          validationResults.issues.push(issue);
        } else if (validation.severity === 'warning') {
          validationResults.warnings.push(issue);
        } else {
          validationResults.info.push(issue);
        }
      }
    }

    // Add additional validation checks to showcase different agents
    if (documentType === 'paystub' && extractedData.data) {
      // Income calculation check
      if (extractedData.data.grossPay && extractedData.data.ytdGrossIncome) {
        const expectedYTD = parseFloat(extractedData.data.grossPay) * 26; // Bi-weekly assumption
        const actualYTD = parseFloat(extractedData.data.ytdGrossIncome);
        if (Math.abs(expectedYTD - actualYTD) / actualYTD > 0.1) { // 10% variance
          validationResults.warnings.push({
            rule: 'incomeCalculationCheck',
            severity: 'warning',
            field: 'grossPayYTD',
            message: `YTD income calculation appears inconsistent with stated gross pay. Expected ~$${expectedYTD.toFixed(2)} but found $${actualYTD.toFixed(2)}`
          });
        }
      }

      // Format consistency check - WARNING
      validationResults.warnings.push({
        rule: 'formatConsistencyCheck',
        severity: 'warning',
        field: 'document',
        message: 'Document contains mixed font styles which may indicate alterations - requires format analysis'
      });

      // Cross-document consistency - WARNING
      validationResults.warnings.push({
        rule: 'crossDocumentConsistency',
        severity: 'warning',
        field: 'employerName',
        message: 'Employer name formatting differs from previous paystubs - requires consistency verification'
      });

      // CRITICAL ISSUE 1: Missing required federal tax withholding
      if (!extractedData.data.federalTaxWithheld || parseFloat(extractedData.data.federalTaxWithheld) === 0) {
        validationResults.issues.push({
          rule: 'federalTaxRequired',
          severity: 'critical',
          field: 'federalTaxWithheld',
          message: 'Federal tax withholding is missing or zero - this is required for all W2 employees and may indicate fraudulent documentation'
        });
        validationResults.isValid = false;
      }

      // CRITICAL ISSUE 2: Net pay suspiciously high (possible fraud)
      if (extractedData.data.netPay && extractedData.data.grossPayCurrent) {
        const netPay = parseFloat(extractedData.data.netPay);
        const grossPay = parseFloat(extractedData.data.grossPayCurrent);
        const takeHomePercentage = (netPay / grossPay) * 100;

        // If take-home is more than 85%, it's suspicious (normal is 55-75%)
        if (takeHomePercentage > 85) {
          validationResults.issues.push({
            rule: 'netPaySuspicious',
            severity: 'critical',
            field: 'netPay',
            message: `Net pay is ${takeHomePercentage.toFixed(1)}% of gross pay (${netPay.toFixed(2)} / ${grossPay.toFixed(2)}), which is unusually high. Normal deductions should reduce net pay to 55-75% of gross. This may indicate document tampering or missing tax withholdings.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 3: Employer name mismatch
      if (extractedData.data.employerName && loanData.borrower?.employment?.current?.employerName) {
        const extractedEmployer = extractedData.data.employerName.toLowerCase().trim();
        const applicationEmployer = loanData.borrower.employment.current.employerName.toLowerCase().trim();

        // Simple check: if they don't contain similar text, flag as critical
        if (!extractedEmployer.includes(applicationEmployer.split(' ')[0]) &&
            !applicationEmployer.includes(extractedEmployer.split(' ')[0])) {
          validationResults.issues.push({
            rule: 'employerNameMismatch',
            severity: 'critical',
            field: 'employerName',
            message: `Employer name on paystub "${extractedData.data.employerName}" does not match loan application employer "${loanData.borrower.employment.current.employerName}". This requires immediate verification.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 4: YTD income significantly lower than expected for this time of year
      if (extractedData.data.grossPayYTD && extractedData.data.payPeriodEnd && loanData.borrower?.employment?.current?.baseIncome) {
        const ytdActual = parseFloat(extractedData.data.grossPayYTD);
        const annualIncome = loanData.borrower.employment.current.baseIncome;
        const payPeriodEnd = new Date(extractedData.data.payPeriodEnd);
        const dayOfYear = Math.floor((payPeriodEnd - new Date(payPeriodEnd.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const expectedYTD = (annualIncome / 365) * dayOfYear;
        const variance = ((expectedYTD - ytdActual) / expectedYTD) * 100;

        // If YTD is more than 20% lower than expected, flag it
        if (variance > 20) {
          validationResults.issues.push({
            rule: 'ytdIncomeLow',
            severity: 'critical',
            field: 'grossPayYTD',
            message: `Year-to-date income of $${ytdActual.toFixed(2)} is ${variance.toFixed(1)}% lower than expected based on stated annual income of $${annualIncome.toFixed(2)}. Expected YTD: ~$${expectedYTD.toFixed(2)}. This significant discrepancy requires immediate income re-verification.`
          });
          validationResults.isValid = false;
        }
      }
    }

    // Date recency critical check for bank statements
    if (documentType === 'bankStatement' && extractedData.data.statementDate) {
      const statementDate = new Date(extractedData.data.statementDate);
      const fourtyFiveDaysAgo = new Date();
      fourtyFiveDaysAgo.setDate(fourtyFiveDaysAgo.getDate() - 45);

      if (statementDate < fourtyFiveDaysAgo) {
        validationResults.issues.push({
          rule: 'statementRecencyRequired',
          severity: 'critical',
          message: `Bank statement dated ${extractedData.data.statementDate} is older than 45 days - current statement required`
        });
        validationResults.isValid = false;
      }
    }

    // W2 validation checks
    if (documentType === 'w2' && extractedData.data) {
      // CRITICAL ISSUE 1: SSN mismatch with loan application
      if (extractedData.data.employeeSSN && loanData.borrower?.ssn) {
        const w2SSN = extractedData.data.employeeSSN.replace(/[^0-9]/g, '');
        const appSSN = loanData.borrower.ssn.replace(/[^0-9]/g, '');

        if (w2SSN !== appSSN) {
          validationResults.issues.push({
            rule: 'ssnMismatch',
            severity: 'critical',
            field: 'employeeSSN',
            message: `SSN on W2 (***-**-${w2SSN.slice(-4)}) does not match loan application SSN (***-**-${appSSN.slice(-4)}). This is a critical identity verification failure that must be resolved immediately.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 2: W2 wages significantly different from stated income
      if (extractedData.data.wages && loanData.borrower?.employment?.current?.baseIncome) {
        const w2Wages = parseFloat(extractedData.data.wages);
        const statedIncome = loanData.borrower.employment.current.baseIncome;
        const variance = Math.abs((w2Wages - statedIncome) / statedIncome) * 100;

        // If variance is more than 15%, flag as critical
        if (variance > 15) {
          validationResults.issues.push({
            rule: 'incomeVariance',
            severity: 'critical',
            field: 'wages',
            message: `W2 reported wages of $${w2Wages.toLocaleString()} differ by ${variance.toFixed(1)}% from stated annual income of $${statedIncome.toLocaleString()} on loan application. Variance exceeds acceptable 15% threshold and requires income re-verification.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 3: Employer name mismatch
      if (extractedData.data.employerName && loanData.borrower?.employment?.current?.employerName) {
        const w2Employer = extractedData.data.employerName.toLowerCase().trim();
        const appEmployer = loanData.borrower.employment.current.employerName.toLowerCase().trim();

        // Check if they don't contain similar text
        if (!w2Employer.includes(appEmployer.split(' ')[0]) &&
            !appEmployer.includes(w2Employer.split(' ')[0])) {
          validationResults.issues.push({
            rule: 'employerMismatch',
            severity: 'critical',
            field: 'employerName',
            message: `Employer name on W2 "${extractedData.data.employerName}" does not match loan application employer "${loanData.borrower.employment.current.employerName}". This discrepancy requires immediate employment verification.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 4: Wrong tax year (not most recent)
      if (extractedData.data.taxYear) {
        const currentYear = new Date().getFullYear();
        const w2Year = parseInt(extractedData.data.taxYear);
        const currentMonth = new Date().getMonth() + 1; // 1-12

        // If it's before April and W2 is 2 years old, or after April and W2 is not last year
        let isWrongYear = false;
        let expectedYear = currentYear - 1;

        if (currentMonth < 4) { // Before April
          if (w2Year < currentYear - 2) {
            isWrongYear = true;
            expectedYear = currentYear - 2;
          }
        } else { // April or later
          if (w2Year < currentYear - 1) {
            isWrongYear = true;
          }
        }

        if (isWrongYear) {
          validationResults.issues.push({
            rule: 'outdatedTaxYear',
            severity: 'critical',
            field: 'taxYear',
            message: `W2 is from tax year ${w2Year}, but most recent W2 (year ${expectedYear}) is required for income verification. Outdated tax documents cannot be used for current loan qualification.`
          });
          validationResults.isValid = false;
        }
      }

      // WARNING 1: Missing Box 12 retirement contributions
      if (!extractedData.data.box12Codes || extractedData.data.box12Codes.length === 0) {
        validationResults.warnings.push({
          rule: 'missingRetirementInfo',
          severity: 'warning',
          field: 'box12Codes',
          message: 'Box 12 is empty - no retirement plan contributions reported. If borrower has 401k or retirement deductions, this may indicate incomplete W2 or data extraction error.'
        });
      }

      // WARNING 2: Suspiciously low federal tax withholding
      if (extractedData.data.federalTaxWithheld && extractedData.data.wages) {
        const federalTax = parseFloat(extractedData.data.federalTaxWithheld);
        const wages = parseFloat(extractedData.data.wages);
        const taxRate = (federalTax / wages) * 100;

        // Normal effective rate is 10-25% for most income levels
        if (taxRate < 5) {
          validationResults.warnings.push({
            rule: 'lowTaxWithholding',
            severity: 'warning',
            field: 'federalTaxWithheld',
            message: `Federal tax withholding of $${federalTax.toLocaleString()} represents only ${taxRate.toFixed(1)}% of wages ($${wages.toLocaleString()}). This is unusually low and may indicate incorrect withholding elections or potential W2 data issues.`
          });
        }
      }

      // WARNING 3: State tax withholding mismatch
      if (extractedData.data.state && extractedData.data.state !== loanData.mismo?.state) {
        validationResults.warnings.push({
          rule: 'stateMismatch',
          severity: 'warning',
          field: 'state',
          message: `W2 shows state as ${extractedData.data.state}, but property is in ${loanData.mismo.state}. Verify borrower's employment location and residency status for proper income documentation.`
        });
      }
    }

    // Bank Statement validation checks
    if (documentType === 'bankStatement' && extractedData.data) {
      // CRITICAL ISSUE 1: Large unverified deposits
      if (extractedData.data.largeDeposits && extractedData.data.largeDeposits.length > 0) {
        const totalLargeDeposits = extractedData.data.largeDeposits.reduce((sum, dep) => sum + parseFloat(dep.amount), 0);
        const monthlyIncome = loanData.ratios?.grossMonthlyIncome || 0;

        validationResults.issues.push({
          rule: 'largeDepositSourcing',
          severity: 'critical',
          field: 'largeDeposits',
          message: `Found ${extractedData.data.largeDeposits.length} large deposit(s) totaling $${totalLargeDeposits.toLocaleString()}. Deposits exceeding 50% of monthly income ($${(monthlyIncome * 0.5).toLocaleString()}) require sourcing documentation. Provide deposit letters or documentation explaining origin of funds.`
        });
        validationResults.isValid = false;
      }

      // CRITICAL ISSUE 2: NSF/Overdraft fees indicating financial instability
      if (extractedData.data.nsfFees && extractedData.data.nsfFees.length > 0) {
        const totalNSFFees = extractedData.data.nsfFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

        validationResults.issues.push({
          rule: 'nsfFeesPresent',
          severity: 'critical',
          field: 'nsfFees',
          message: `Account shows ${extractedData.data.nsfFees.length} NSF/overdraft fee(s) totaling $${totalNSFFees.toFixed(2)} during statement period. This indicates insufficient funds management and may affect loan qualification. Underwriter review required.`
        });
        validationResults.isValid = false;
      }

      // CRITICAL ISSUE 3: Insufficient funds for closing costs + reserves
      if (extractedData.data.endingBalance && loanData.transactions?.cashToClose) {
        const endingBalance = parseFloat(extractedData.data.endingBalance);
        const cashToClose = loanData.transactions.cashToClose;
        const reservesRequired = loanData.mismo?.monthlyPayment * 2 || 0; // 2 months reserves
        const totalRequired = cashToClose + reservesRequired;

        if (endingBalance < totalRequired) {
          validationResults.issues.push({
            rule: 'insufficientFunds',
            severity: 'critical',
            field: 'endingBalance',
            message: `Ending balance of $${endingBalance.toLocaleString()} is insufficient for cash to close ($${cashToClose.toLocaleString()}) plus required reserves ($${reservesRequired.toLocaleString()}). Total needed: $${totalRequired.toLocaleString()}. Shortfall: $${(totalRequired - endingBalance).toLocaleString()}.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 4: Statement too old (beyond 60 days)
      if (extractedData.data.statementEndDate) {
        const statementEnd = new Date(extractedData.data.statementEndDate);
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        if (statementEnd < sixtyDaysAgo) {
          validationResults.issues.push({
            rule: 'statementTooOld',
            severity: 'critical',
            field: 'statementEndDate',
            message: `Statement ending ${extractedData.data.statementEndDate} is older than 60 days. Most recent bank statements (within 60 days) are required for asset verification. Request updated statement.`
          });
          validationResults.isValid = false;
        }
      }

      // CRITICAL ISSUE 5: Negative balance events
      if (extractedData.data.negativeBalanceEvents && extractedData.data.negativeBalanceEvents > 0) {
        validationResults.issues.push({
          rule: 'negativeBalance',
          severity: 'critical',
          field: 'negativeBalanceEvents',
          message: `Account went negative ${extractedData.data.negativeBalanceEvents} time(s) during statement period. Negative balances indicate cash flow problems and financial instability that may disqualify borrower.`
        });
        validationResults.isValid = false;
      }

      // WARNING 1: Account holder name mismatch
      if (extractedData.data.accountHolderName && loanData.borrower) {
        const statementName = extractedData.data.accountHolderName.toLowerCase().trim();
        const borrowerFirst = (loanData.borrower.firstName || '').toLowerCase();
        const borrowerLast = (loanData.borrower.lastName || '').toLowerCase();

        if (!statementName.includes(borrowerFirst) || !statementName.includes(borrowerLast)) {
          validationResults.warnings.push({
            rule: 'nameDiscrepancy',
            severity: 'warning',
            field: 'accountHolderName',
            message: `Account holder name "${extractedData.data.accountHolderName}" may not match borrower "${loanData.borrower.firstName} ${loanData.borrower.lastName}". Verify account ownership or provide documentation if joint account.`
          });
        }
      }

      // WARNING 2: Low average balance relative to income
      if (extractedData.data.averageBalance && loanData.ratios?.grossMonthlyIncome) {
        const avgBalance = parseFloat(extractedData.data.averageBalance);
        const monthlyIncome = loanData.ratios.grossMonthlyIncome;
        const ratio = (avgBalance / monthlyIncome) * 100;

        if (ratio < 10) { // Less than 10% of monthly income
          validationResults.warnings.push({
            rule: 'lowAverageBalance',
            severity: 'warning',
            field: 'averageBalance',
            message: `Average balance of $${avgBalance.toLocaleString()} represents only ${ratio.toFixed(1)}% of monthly income ($${monthlyIncome.toLocaleString()}). Low balance relative to income may indicate tight cash flow situation.`
          });
        }
      }

      // WARNING 3: High number of transactions (potential business use)
      if (extractedData.data.transactionCount && extractedData.data.transactionCount > 100) {
        validationResults.warnings.push({
          rule: 'highTransactionVolume',
          severity: 'warning',
          field: 'transactionCount',
          message: `Account shows ${extractedData.data.transactionCount} transactions during statement period. High transaction volume may indicate business use of personal account. Verify account is for personal use only.`
        });
      }

      // WARNING 4: Inconsistent deposit patterns (may indicate gig economy income)
      if (extractedData.data.irregularDeposits === true) {
        validationResults.warnings.push({
          rule: 'irregularDeposits',
          severity: 'warning',
          field: 'deposits',
          message: 'Deposit pattern shows irregular timing and amounts, which may indicate variable income from gig economy or commission-based work. Additional income documentation may be required for qualification.'
        });
      }
    }

    return validationResults;

  } catch (error) {
    console.error('Error validating document:', error);
    throw error;
  }
}

/**
 * Validate individual field
 * @param {Object} fieldRule - Field validation rule
 * @param {*} fieldValue - Extracted field value
 * @param {Object} loanData - Loan application data
 * @returns {Object} Field validation result
 */
function validateField(fieldRule, fieldValue, loanData) {
  const result = {
    isValid: true,
    message: null
  };

  // Check if required field is missing
  if (fieldRule.required && (fieldValue === null || fieldValue === undefined)) {
    result.isValid = false;
    result.message = `Required field '${fieldRule.name}' is missing`;
    return result;
  }

  // Apply validation rules
  if (fieldRule.validationRule && fieldValue) {
    switch (fieldRule.validationRule) {
      case 'mustMatchBorrowerName':
        if (!nameMatches(fieldValue, loanData.borrower.firstName, loanData.borrower.lastName)) {
          result.isValid = false;
          result.message = `Name does not match borrower: ${loanData.borrower.firstName} ${loanData.borrower.lastName}`;
        }
        break;

      case 'mustMatchBorrowerDOB':
        if (fieldValue !== loanData.borrower.dateOfBirth) {
          result.isValid = false;
          result.message = `Date of birth does not match loan application`;
        }
        break;

      case 'mustNotBeExpired':
        if (new Date(fieldValue) < new Date()) {
          result.isValid = false;
          result.message = `Document is expired`;
        }
        break;

      case 'within60Days':
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        if (new Date(fieldValue) < sixtyDaysAgo) {
          result.isValid = false;
          result.message = `Date is older than 60 days`;
        }
        break;

      case 'within30Days':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (new Date(fieldValue) < thirtyDaysAgo) {
          result.isValid = false;
          result.message = `Date is older than 30 days`;
        }
        break;

      case 'mustMatchSubjectProperty':
        if (!addressMatches(fieldValue, loanData.propertyDetails.address)) {
          result.isValid = false;
          result.message = `Address does not match subject property`;
        }
        break;

      case 'mustMatchLoanApplication':
        // Generic comparison - implement specific logic as needed
        break;
    }
  }

  return result;
}

/**
 * Apply document-level validation
 * @param {Object} validation - Validation rule
 * @param {Object} extractedData - Extracted document data
 * @param {Object} loanData - Loan application data
 * @param {string} documentType - Document type
 * @returns {Object} Validation result
 */
function applyDocumentValidation(validation, extractedData, loanData, documentType) {
  const result = { passed: true };

  switch (validation.rule) {
    case 'documentNotExpired':
      if (extractedData.expirationDate && new Date(extractedData.expirationDate) < new Date()) {
        result.passed = false;
      }
      break;

    case 'nameMatches':
      if (extractedData.fullName || extractedData.employeeName || extractedData.taxpayerName) {
        const name = extractedData.fullName || extractedData.employeeName || extractedData.taxpayerName;
        if (!nameMatches(name, loanData.borrower.firstName, loanData.borrower.lastName)) {
          result.passed = false;
        }
      }
      break;

    case 'statementNotTooOld':
      if (extractedData.statementDate) {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        if (new Date(extractedData.statementDate) < sixtyDaysAgo) {
          result.passed = false;
        }
      }
      break;

    case 'largeDepositsNeedSourcing':
      if (extractedData.largeDeposits && extractedData.largeDeposits.length > 0) {
        result.passed = false; // Triggers warning
      }
      break;

    case 'nsfFeesPresent':
      if (extractedData.nsfOrOverdrafts === true) {
        result.passed = false; // Triggers warning
      }
      break;

    case 'twoYearsRequired':
      // This would be checked at loan level with multiple documents
      result.passed = true;
      break;

    case 'coverageAdequate':
      if (extractedData.coverageAmount < loanData.mismo.loanAmountRequested) {
        result.passed = false;
      }
      break;

    case 'valueSupportsLoan':
      if (extractedData.appraisedValue) {
        const ltv = (loanData.mismo.loanAmountRequested / extractedData.appraisedValue) * 100;
        const rules = require('../../data/rules/document-extraction-rules.json');
        const maxLTV = rules.conditionalLogic.loanTypeRules[loanData.mismo.productType]?.maxLTV || 97;
        if (ltv > maxLTV) {
          result.passed = false;
        }
      }
      break;

    default:
      result.passed = true;
  }

  return result;
}

/**
 * Generate scorecard for loan
 * @param {Object} loanData - Loan data
 * @param {Array} documents - Uploaded documents
 * @param {Array} conditions - Active conditions
 * @returns {Promise<Object>} Scorecard
 */
async function generateScorecard(loanData, documents, conditions) {
  const rules = await getRules();

  // Determine required documents based on loan characteristics
  const requiredDocuments = getRequiredDocuments(loanData, rules);

  // Calculate document completeness
  const receivedDocTypes = documents.map(d => d.documentType);
  const missingDocuments = requiredDocuments.filter(rd => !receivedDocTypes.includes(rd.id));

  const documentCompleteness = Math.round(
    ((requiredDocuments.length - missingDocuments.length) / requiredDocuments.length) * 100
  );

  // Calculate data accuracy
  const validDocuments = documents.filter(d => d.validationResults?.isValid);
  const dataAccuracy = documents.length > 0
    ? Math.round((validDocuments.length / documents.length) * 100)
    : 0;

  // Count compliance issues
  const criticalIssues = documents.reduce((sum, d) =>
    sum + (d.validationResults?.issues?.length || 0), 0
  );
  const warningIssues = documents.reduce((sum, d) =>
    sum + (d.validationResults?.warnings?.length || 0), 0
  );

  // Calculate compliance score
  const complianceScore = Math.max(0, 100 - (criticalIssues * 10) - (warningIssues * 5));

  // Check if ready to close
  const unresolvedConditions = conditions.filter(c => c.status !== 'cleared');
  const readyToClose = missingDocuments.length === 0 &&
    criticalIssues === 0 &&
    unresolvedConditions.length === 0;

  // Calculate overall score
  const scoringRules = rules.scoringRules;
  const overallScore = Math.round(
    (documentCompleteness * scoringRules.documentCompleteness.weight / 100) +
    (dataAccuracy * scoringRules.dataAccuracy.weight / 100) +
    (complianceScore * scoringRules.complianceIssues.weight / 100) +
    (readyToClose ? 25 : 0)
  );

  return {
    loanId: loanData.loanId,
    overallScore,
    readyToClose,
    scores: {
      documentCompleteness: {
        score: documentCompleteness,
        weight: scoringRules.documentCompleteness.weight,
        details: {
          total: requiredDocuments.length,
          received: requiredDocuments.length - missingDocuments.length,
          missing: missingDocuments.length
        }
      },
      dataAccuracy: {
        score: dataAccuracy,
        weight: scoringRules.dataAccuracy.weight,
        details: {
          total: documents.length,
          valid: validDocuments.length,
          invalid: documents.length - validDocuments.length
        }
      },
      compliance: {
        score: complianceScore,
        weight: scoringRules.complianceIssues.weight,
        details: {
          criticalIssues,
          warningIssues,
          totalIssues: criticalIssues + warningIssues
        }
      }
    },
    missingDocuments,
    conditions: unresolvedConditions,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Get required documents based on loan characteristics
 * @param {Object} loanData - Loan data
 * @param {Object} rules - Rules configuration
 * @returns {Array} Required document types
 */
function getRequiredDocuments(loanData, rules) {
  const required = [];

  for (const docType of rules.documentTypes) {
    // Always required
    if (docType.required && (!docType.conditions || docType.conditions.length === 0)) {
      required.push(docType);
      continue;
    }

    // Conditionally required
    if (docType.conditions && docType.conditions.length > 0) {
      const conditionsMet = docType.conditions.every(condition =>
        evaluateCondition(condition, loanData)
      );

      if (conditionsMet) {
        required.push(docType);
      }
    }
  }

  return required;
}

/**
 * Evaluate a condition
 * @param {Object} condition - Condition rule
 * @param {Object} loanData - Loan data
 * @returns {boolean} Whether condition is met
 */
function evaluateCondition(condition, loanData) {
  const fieldValue = getNestedValue(loanData, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'greaterThan':
      return fieldValue > condition.value;
    case 'lessThan':
      return fieldValue < condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue);
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    default:
      return false;
  }
}

/**
 * Get nested object value by path
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-notation path
 * @returns {*} Value at path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Check if names match (fuzzy matching)
 * @param {string} name1 - First name
 * @param {string} firstName - First name to compare
 * @param {string} lastName - Last name to compare
 * @returns {boolean} Whether names match
 */
function nameMatches(name1, firstName, lastName) {
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  const name1Lower = String(name1).toLowerCase();

  // Check if it's a close match (allowing for middle names, initials, etc.)
  return name1Lower.includes(firstName.toLowerCase()) &&
    name1Lower.includes(lastName.toLowerCase());
}

/**
 * Check if addresses match (fuzzy matching)
 * @param {string} address1 - First address
 * @param {string} address2 - Second address
 * @returns {boolean} Whether addresses match
 */
function addressMatches(address1, address2) {
  const addr1 = String(address1).toLowerCase().replace(/[.,\s]/g, '');
  const addr2 = String(address2).toLowerCase().replace(/[.,\s]/g, '');

  // Simple fuzzy match - check if main components are present
  return addr1.includes(addr2.split(' ')[0]) || addr2.includes(addr1.split(' ')[0]);
}

module.exports = {
  getRules,
  updateRules,
  getDocumentTypes,
  validateDocument,
  generateScorecard,
  getRequiredDocuments
};
