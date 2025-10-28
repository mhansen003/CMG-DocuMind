// Complete Tax Return (Form 1040) field configuration with extraction prompts
export const taxReturnFields = [
  {
    id: 'taxpayerName',
    fieldName: 'Taxpayer Name',
    description: 'Primary taxpayer full name',
    extractionPrompt: 'Extract the taxpayer name from the top of Form 1040. This is labeled "Your first name and middle initial" and "Last name". Combine to form the full name exactly as shown.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'nameMatch',
        ruleName: 'Borrower Name Match',
        ruleType: 'comparison',
        description: 'Taxpayer name must match borrower name',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Tax return taxpayer name does not match borrower',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'taxpayerSSN',
    fieldName: 'Taxpayer Social Security Number',
    description: 'Primary taxpayer SSN',
    extractionPrompt: 'Extract the Social Security Number from the top right of Form 1040 where it says "Your social security number". Format as XXX-XX-XXXX.',
    byteLOSMapping: 'borrower.ssn',
    dataType: 'ssn',
    required: true,
    rules: [
      {
        id: 'ssnMatch',
        ruleName: 'SSN Verification',
        ruleType: 'comparison',
        description: 'SSN must match borrower SSN',
        condition: 'matches',
        compareField: 'borrower.ssn',
        errorMessage: 'Tax return SSN does not match borrower SSN',
        severity: 'critical'
      },
      {
        id: 'ssnFormat',
        ruleName: 'Valid SSN Format',
        ruleType: 'format',
        description: 'SSN must be in valid format',
        condition: 'matches_pattern',
        pattern: '^[0-9]{3}-[0-9]{2}-[0-9]{4}$',
        errorMessage: 'Invalid SSN format',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'spouseName',
    fieldName: 'Spouse Name',
    description: 'Spouse full name (if filing jointly)',
    extractionPrompt: 'If filing status is "Married filing jointly", extract the spouse name from the top of Form 1040 where it says "Spouse\'s first name and middle initial" and "Last name". If not applicable, extract "N/A" or leave blank.',
    byteLOSMapping: 'borrower.maritalStatus == "Married" ? borrower.spouse.fullName : null',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'taxYear',
    fieldName: 'Tax Year',
    description: 'Tax year for this return',
    extractionPrompt: 'Extract the tax year from the top of Form 1040. This is prominently displayed, typically as a 4-digit year (e.g., "2023").',
    byteLOSMapping: null,
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'recentYear',
        ruleName: 'Recent Tax Year',
        ruleType: 'date_range',
        description: 'Tax return should be from last 2 years',
        condition: 'within_years',
        value: 2,
        errorMessage: 'Tax return is more than 2 years old',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'filingStatus',
    fieldName: 'Filing Status',
    description: 'Tax filing status (Single, Married, etc.)',
    extractionPrompt: 'Identify which filing status box is checked on Form 1040. Options are: Single, Married filing jointly, Married filing separately, Head of household, or Qualifying surviving spouse. Extract the exact text of the checked box.',
    byteLOSMapping: 'borrower.maritalStatus',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'validFilingStatus',
        ruleName: 'Valid Filing Status',
        ruleType: 'enum',
        description: 'Must be a valid IRS filing status',
        validValues: ['Single', 'Married filing jointly', 'Married filing separately', 'Head of household', 'Qualifying surviving spouse'],
        errorMessage: 'Invalid filing status',
        severity: 'critical'
      },
      {
        id: 'filingStatusConsistency',
        ruleName: 'Filing Status Consistency',
        ruleType: 'comparison',
        description: 'Filing status should match marital status on application',
        condition: 'consistent_with',
        compareField: 'borrower.maritalStatus',
        errorMessage: 'Filing status inconsistent with stated marital status',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'line1zWages',
    fieldName: 'Line 1z - Total Wages',
    description: 'Total wages from all W-2s (Line 1z)',
    extractionPrompt: 'Extract the amount from Line 1z of Form 1040, labeled "Total amount from Form(s) W-2, box 1". This is the sum of all W-2 wages. Extract numerical amount only.',
    byteLOSMapping: 'borrower.employment.current.totalIncome',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'wagesMatch',
        ruleName: 'W-2 Wages Match',
        ruleType: 'calculation',
        description: 'Line 1z should match sum of all W-2 Box 1 amounts',
        condition: 'matches_w2_total',
        errorMessage: 'Total wages do not match sum of W-2 forms',
        severity: 'critical'
      },
      {
        id: 'incomeConsistency',
        ruleName: 'Income Consistency',
        ruleType: 'calculation',
        description: 'Wages should align with stated income',
        condition: 'within_percentage',
        value: 15,
        compareField: 'borrower.employment.current.totalIncome',
        errorMessage: 'Reported wages differ significantly from stated income',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'line9TotalIncome',
    fieldName: 'Line 9 - Total Income',
    description: 'Total income from all sources (Line 9)',
    extractionPrompt: 'Extract the amount from Line 9 of Form 1040, labeled "Total income". This is the sum of all income sources including wages, interest, dividends, business income, etc. Extract numerical amount only.',
    byteLOSMapping: 'borrower.totalIncome',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'totalIncomeReasonability',
        ruleName: 'Total Income Reasonability',
        ruleType: 'range',
        description: 'Total income must be positive',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Total income must be greater than zero',
        severity: 'critical'
      },
      {
        id: 'incomeConsistency',
        ruleName: 'Income Consistency Check',
        ruleType: 'calculation',
        description: 'Total income should align with application',
        condition: 'within_percentage',
        value: 20,
        compareField: 'borrower.totalIncome',
        errorMessage: 'Total income differs significantly from application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'line11AdjustedGrossIncome',
    fieldName: 'Line 11 - Adjusted Gross Income (AGI)',
    description: 'Adjusted Gross Income after adjustments (Line 11)',
    extractionPrompt: 'Extract the amount from Line 11 of Form 1040, labeled "Adjusted gross income". This is total income minus adjustments to income. Extract numerical amount only.',
    byteLOSMapping: 'borrower.adjustedGrossIncome',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'agiCalculation',
        ruleName: 'AGI Calculation Check',
        ruleType: 'calculation',
        description: 'AGI should equal total income minus adjustments',
        condition: 'calculated_correctly',
        errorMessage: 'AGI calculation appears incorrect',
        severity: 'warning'
      },
      {
        id: 'agiReasonability',
        ruleName: 'AGI Reasonability',
        ruleType: 'comparison',
        description: 'AGI should be close to total income',
        condition: 'within_percentage',
        value: 30,
        compareField: 'line9TotalIncome',
        errorMessage: 'Large discrepancy between total income and AGI',
        severity: 'info'
      }
    ]
  },
  {
    id: 'line15TaxableIncome',
    fieldName: 'Line 15 - Taxable Income',
    description: 'Taxable income after deductions (Line 15)',
    extractionPrompt: 'Extract the amount from Line 15 of Form 1040, labeled "Taxable income". This is AGI minus standard or itemized deductions. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'taxableIncomeReasonability',
        ruleName: 'Taxable Income Reasonability',
        ruleType: 'range',
        description: 'Taxable income should be non-negative',
        condition: 'greater_than_or_equal',
        value: 0,
        errorMessage: 'Taxable income is negative',
        severity: 'info'
      }
    ]
  },
  {
    id: 'line24TotalTax',
    fieldName: 'Line 24 - Total Tax',
    description: 'Total tax liability (Line 24)',
    extractionPrompt: 'Extract the amount from Line 24 of Form 1040, labeled "Total tax". This is the total federal income tax owed. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'taxReasonability',
        ruleName: 'Tax Amount Reasonability',
        ruleType: 'percentage',
        description: 'Total tax should be reasonable percentage of taxable income',
        condition: 'percentage_range',
        minPercent: 0,
        maxPercent: 40,
        compareField: 'line15TaxableIncome',
        errorMessage: 'Tax amount seems unusual relative to taxable income',
        severity: 'info'
      }
    ]
  },
  {
    id: 'line33TotalPayments',
    fieldName: 'Line 33 - Total Payments',
    description: 'Total payments and credits (Line 33)',
    extractionPrompt: 'Extract the amount from Line 33 of Form 1040, labeled "Total payments". This includes withholding, estimated tax payments, and credits. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'paymentsReasonability',
        ruleName: 'Payments Reasonability',
        ruleType: 'range',
        description: 'Total payments should be non-negative',
        condition: 'greater_than_or_equal',
        value: 0,
        errorMessage: 'Total payments cannot be negative',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'line34Refund',
    fieldName: 'Line 34 - Refund Amount',
    description: 'Amount to be refunded (Line 34)',
    extractionPrompt: 'If Line 34 has an amount, extract it. This line is labeled "Refund" or "Amount you overpaid". If this line is blank or zero, check Line 37 instead (amount owed). Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'line37AmountOwed',
    fieldName: 'Line 37 - Amount You Owe',
    description: 'Amount owed to IRS (Line 37)',
    extractionPrompt: 'If Line 37 has an amount, extract it. This line is labeled "Amount you owe". If this line is blank or zero, the taxpayer received a refund (Line 34). Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'owedAmountConcern',
        ruleName: 'Large Tax Debt Flag',
        ruleType: 'range',
        description: 'Large amount owed may indicate financial issues',
        condition: 'less_than',
        value: 10000,
        errorMessage: 'Large tax debt detected - may require explanation',
        severity: 'info'
      }
    ]
  },
  {
    id: 'scheduleC',
    fieldName: 'Schedule C - Business Income',
    description: 'Net profit/loss from Schedule C (if self-employed)',
    extractionPrompt: 'If Schedule C is attached, extract the net profit or loss from Line 31 of Schedule C. This represents income from self-employment or business. If no Schedule C, extract 0 or leave blank.',
    byteLOSMapping: 'borrower.employment.selfEmployed ? borrower.employment.businessIncome : null',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'scheduleCMatch',
        ruleName: 'Schedule C Income Verification',
        ruleType: 'calculation',
        description: 'Schedule C income should match stated business income',
        condition: 'matches_if_self_employed',
        compareField: 'borrower.employment.businessIncome',
        errorMessage: 'Schedule C income does not match stated business income',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'scheduleE',
    fieldName: 'Schedule E - Rental Income',
    description: 'Net rental income from Schedule E',
    extractionPrompt: 'If Schedule E is attached, extract the total rental real estate and royalty income from Line 26 of Schedule E. If no Schedule E, extract 0 or leave blank.',
    byteLOSMapping: 'borrower.rentalIncome',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'rentalIncomeMatch',
        ruleName: 'Rental Income Verification',
        ruleType: 'comparison',
        description: 'Schedule E income should match stated rental income',
        condition: 'matches',
        compareField: 'borrower.rentalIncome',
        errorMessage: 'Rental income does not match application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'schedule1AdditionalIncome',
    fieldName: 'Schedule 1 - Additional Income',
    description: 'Total additional income from Schedule 1',
    extractionPrompt: 'If Schedule 1 is attached, extract the total additional income from Line 10 of Schedule 1. This includes income like unemployment, alimony, business income, etc. If no Schedule 1, extract 0 or leave blank.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: []
  }
];
