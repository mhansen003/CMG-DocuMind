const fs = require('fs').promises;
const path = require('path');

const CONDITIONS_FILE = path.join(__dirname, '../../data/conditions.json');

/**
 * Generate conditions based on validation results
 * @param {Object} validationResults - Document validation results
 * @param {string} documentType - Type of document
 * @param {Object} loanData - Loan data
 * @returns {Promise<Array>} Generated conditions
 */
async function generateConditions(validationResults, documentType, loanData) {
  const conditions = [];

  // Create conditions from critical issues
  for (const issue of validationResults.issues || []) {
    conditions.push({
      id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      loanId: loanData.loanId,
      documentType,
      type: 'critical',
      category: 'document-issue',
      title: issue.message,
      description: `Critical issue found in ${documentType}: ${issue.message}`,
      field: issue.field,
      severity: issue.severity,
      status: 'open',
      createdAt: new Date().toISOString(),
      suggestedAction: getSuggestedAction(issue, documentType),
      requiresNewDocument: requiresNewDocument(issue.rule)
    });
  }

  // Create conditions from warnings
  for (const warning of validationResults.warnings || []) {
    conditions.push({
      id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      loanId: loanData.loanId,
      documentType,
      type: 'warning',
      category: 'needs-clarification',
      title: warning.message,
      description: `Warning found in ${documentType}: ${warning.message}`,
      rule: warning.rule,
      severity: warning.severity,
      status: 'open',
      createdAt: new Date().toISOString(),
      suggestedAction: getSuggestedAction(warning, documentType),
      requiresNewDocument: false
    });
  }

  // Save conditions
  if (conditions.length > 0) {
    await saveConditions(conditions);
  }

  return conditions;
}

/**
 * Get suggested action for a condition
 * @param {Object} issue - Issue or warning
 * @param {string} documentType - Document type
 * @returns {string} Suggested action
 */
function getSuggestedAction(issue, documentType) {
  const actions = {
    'documentNotExpired': 'Request updated document that is not expired',
    'nameMatches': 'Verify borrower name matches loan application or obtain corrected document',
    'statementNotTooOld': 'Request more recent bank statement (within 60 days)',
    'largeDepositsNeedSourcing': 'Request documentation for large deposits (gift letter, transfer confirmation, etc.)',
    'nsfFeesPresent': 'Request letter of explanation for NSF/overdraft fees',
    'twoYearsRequired': `Request additional ${documentType} to meet 2-year requirement`,
    'coverageAdequate': 'Request insurance quote with adequate coverage amount',
    'valueSupportsLoan': 'Loan amount exceeds maximum LTV - reduce loan amount or request higher appraisal',
    'employmentActive': 'Verify current employment status with employer',
    'verificationRecent': 'Request updated verification of employment',
    'ytdIncomeConsistent': 'Request explanation for income variance',
    'incomeDecline': 'Request explanation for income decline year-over-year',
    'mustBeSigned': 'Request signed copy of document',
    'publicRecordsFound': 'Request explanation for public records found on credit report',
    'collectionsFound': 'Provide proof of payment or explanation for collection accounts',
    'licenseActive': 'Request current/renewed business license',
    'seasoningPeriodMet': 'Verify bankruptcy seasoning period meets program guidelines'
  };

  return actions[issue.rule] || 'Please review and address this issue';
}

/**
 * Check if issue requires a new document
 * @param {string} rule - Rule that was violated
 * @returns {boolean} Whether new document is required
 */
function requiresNewDocument(rule) {
  const requiresNew = [
    'documentNotExpired',
    'statementNotTooOld',
    'paystubRecent',
    'twoYearsRequired',
    'verificationRecent',
    'mustBeSigned',
    'licenseActive'
  ];

  return requiresNew.includes(rule);
}

/**
 * Save conditions to file
 * @param {Array} newConditions - Conditions to save
 * @returns {Promise<void>}
 */
async function saveConditions(newConditions) {
  try {
    let allConditions = [];

    // Load existing conditions
    try {
      const data = await fs.readFile(CONDITIONS_FILE, 'utf8');
      allConditions = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start fresh
      allConditions = [];
    }

    // Add new conditions
    allConditions.push(...newConditions);

    // Save back to file
    await fs.writeFile(CONDITIONS_FILE, JSON.stringify(allConditions, null, 2));
    console.log(`✅ Saved ${newConditions.length} conditions`);
  } catch (error) {
    console.error('Error saving conditions:', error);
    throw error;
  }
}

/**
 * Get all conditions for a loan
 * @param {string} loanId - Loan ID
 * @returns {Promise<Array>} Conditions
 */
async function getConditionsForLoan(loanId) {
  try {
    const data = await fs.readFile(CONDITIONS_FILE, 'utf8');
    const allConditions = JSON.parse(data);
    return allConditions.filter(c => c.loanId === loanId);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // No conditions file yet
    }
    console.error('Error loading conditions:', error);
    throw error;
  }
}

/**
 * Clear/resolve a condition
 * @param {string} conditionId - Condition ID
 * @param {string} notes - Resolution notes
 * @returns {Promise<void>}
 */
async function clearCondition(conditionId, notes) {
  try {
    const data = await fs.readFile(CONDITIONS_FILE, 'utf8');
    const allConditions = JSON.parse(data);

    const condition = allConditions.find(c => c.id === conditionId);
    if (!condition) {
      throw new Error(`Condition not found: ${conditionId}`);
    }

    condition.status = 'cleared';
    condition.clearedAt = new Date().toISOString();
    condition.resolutionNotes = notes;

    await fs.writeFile(CONDITIONS_FILE, JSON.stringify(allConditions, null, 2));
    console.log(`✅ Condition ${conditionId} cleared`);
  } catch (error) {
    console.error('Error clearing condition:', error);
    throw error;
  }
}

/**
 * Request additional document for a condition
 * @param {string} conditionId - Condition ID
 * @param {string} documentType - Type of document to request
 * @param {string} notes - Request notes
 * @returns {Promise<void>}
 */
async function requestDocument(conditionId, documentType, notes) {
  try {
    const data = await fs.readFile(CONDITIONS_FILE, 'utf8');
    const allConditions = JSON.parse(data);

    const condition = allConditions.find(c => c.id === conditionId);
    if (!condition) {
      throw new Error(`Condition not found: ${conditionId}`);
    }

    condition.status = 'pending-document';
    condition.requestedDocument = documentType;
    condition.requestNotes = notes;
    condition.requestedAt = new Date().toISOString();

    await fs.writeFile(CONDITIONS_FILE, JSON.stringify(allConditions, null, 2));
    console.log(`✅ Document requested for condition ${conditionId}`);
  } catch (error) {
    console.error('Error requesting document:', error);
    throw error;
  }
}

/**
 * Get condition statistics for a loan
 * @param {string} loanId - Loan ID
 * @returns {Promise<Object>} Condition statistics
 */
async function getConditionStats(loanId) {
  const conditions = await getConditionsForLoan(loanId);

  return {
    total: conditions.length,
    open: conditions.filter(c => c.status === 'open').length,
    cleared: conditions.filter(c => c.status === 'cleared').length,
    pendingDocument: conditions.filter(c => c.status === 'pending-document').length,
    critical: conditions.filter(c => c.type === 'critical').length,
    warnings: conditions.filter(c => c.type === 'warning').length
  };
}

module.exports = {
  generateConditions,
  getConditionsForLoan,
  clearCondition,
  requestDocument,
  getConditionStats
};
