// Complete W-2 Form field configuration with extraction prompts
export const w2Fields = [
  {
    id: 'employeeName',
    fieldName: 'Employee Name',
    description: 'Full legal name of the employee from Box e',
    extractionPrompt: 'Extract the employee name from Box e of the W-2 form. This is located in the upper left section of the form. Include first, middle initial (if present), and last name exactly as shown. Do not include suffixes unless they appear on the form.',
    byteLOSMapping: 'borrower.firstName + borrower.middleName + borrower.lastName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'matchesBorrowerName',
        ruleName: 'Borrower Name Match',
        ruleType: 'comparison',
        description: 'Employee name must match borrower name on loan application',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'W-2 employee name does not match borrower name',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'employeeSSN',
    fieldName: 'Employee Social Security Number',
    description: 'Employee SSN from Box a',
    extractionPrompt: 'Extract the Social Security Number from Box a of the W-2. Format as XXX-XX-XXXX. This is located at the top of the form in the employee information section.',
    byteLOSMapping: 'borrower.ssn',
    dataType: 'ssn',
    required: true,
    rules: [
      {
        id: 'ssnMatch',
        ruleName: 'SSN Verification',
        ruleType: 'comparison',
        description: 'SSN must match borrower SSN on application',
        condition: 'matches',
        compareField: 'borrower.ssn',
        errorMessage: 'W-2 SSN does not match borrower SSN on application',
        severity: 'critical'
      },
      {
        id: 'ssnFormat',
        ruleName: 'Valid SSN Format',
        ruleType: 'format',
        description: 'SSN must be in valid format XXX-XX-XXXX',
        condition: 'matches_pattern',
        pattern: '^[0-9]{3}-[0-9]{2}-[0-9]{4}$',
        errorMessage: 'Invalid SSN format',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'employerName',
    fieldName: 'Employer Name',
    description: 'Legal name of employer from Box c',
    extractionPrompt: 'Extract the employer name from Box c of the W-2 form. This is the legal business name and should include any business designations like Inc., LLC, Corp., etc. Located in the employer information section.',
    byteLOSMapping: 'borrower.employment.current.employerName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'employerMatch',
        ruleName: 'Employer Name Match',
        ruleType: 'comparison',
        description: 'Employer name must match employment info on application',
        condition: 'matches',
        compareField: 'borrower.employment.current.employerName',
        errorMessage: 'W-2 employer does not match stated employer',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'employerEIN',
    fieldName: 'Employer Identification Number',
    description: 'Federal EIN from Box b',
    extractionPrompt: 'Extract the Employer Identification Number (EIN) from Box b. Format as XX-XXXXXXX. This is the federal tax ID for the employer.',
    byteLOSMapping: 'borrower.employment.current.ein',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'einFormat',
        ruleName: 'Valid EIN Format',
        ruleType: 'format',
        description: 'EIN must be in valid format XX-XXXXXXX',
        condition: 'matches_pattern',
        pattern: '^[0-9]{2}-[0-9]{7}$',
        errorMessage: 'Invalid EIN format',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'taxYear',
    fieldName: 'Tax Year',
    description: 'Tax year for this W-2',
    extractionPrompt: 'Extract the tax year from the W-2 form. This is prominently displayed at the top of the form, typically in a box labeled "Tax Year" or just the 4-digit year (e.g., 2024).',
    byteLOSMapping: null,
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'recentYear',
        ruleName: 'Recent Tax Year',
        ruleType: 'date_range',
        description: 'W-2 must be from current or previous tax year',
        condition: 'within_years',
        value: 1,
        errorMessage: 'W-2 is from more than 1 year ago',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'box1Wages',
    fieldName: 'Box 1 - Wages, Tips, Other Compensation',
    description: 'Total taxable wages from Box 1',
    extractionPrompt: 'Extract the dollar amount from Box 1 labeled "Wages, tips, other compensation". This is the total taxable income and should be the largest income figure on the W-2. Extract only the numerical amount without currency symbols or commas.',
    byteLOSMapping: 'borrower.employment.current.totalIncome',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'incomeMatch',
        ruleName: 'Annual Income Verification',
        ruleType: 'calculation',
        description: 'Box 1 wages should match stated annual income',
        condition: 'within_percentage',
        value: 10,
        compareField: 'borrower.employment.current.totalIncome',
        errorMessage: 'W-2 wages do not match stated income (variance > 10%)',
        severity: 'critical'
      },
      {
        id: 'reasonableIncome',
        ruleName: 'Reasonable Income Amount',
        ruleType: 'range',
        description: 'Wages must be a positive amount',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Box 1 wages must be greater than zero',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'box2FederalTax',
    fieldName: 'Box 2 - Federal Income Tax Withheld',
    description: 'Total federal tax withheld from Box 2',
    extractionPrompt: 'Extract the amount from Box 2 labeled "Federal income tax withheld". This represents the total federal taxes withheld throughout the year. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'reasonableTaxRate',
        ruleName: 'Tax Withholding Reasonability',
        ruleType: 'percentage',
        description: 'Federal tax should be 0-40% of Box 1 wages',
        condition: 'percentage_range',
        minPercent: 0,
        maxPercent: 40,
        compareField: 'box1Wages',
        errorMessage: 'Federal tax withholding percentage is outside normal range',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'box3SocialSecurityWages',
    fieldName: 'Box 3 - Social Security Wages',
    description: 'Wages subject to Social Security tax from Box 3',
    extractionPrompt: 'Extract the amount from Box 3 labeled "Social security wages". This amount may differ from Box 1 due to pre-tax deductions. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'ssWageLimit',
        ruleName: 'Social Security Wage Base',
        ruleType: 'range',
        description: 'SS wages should not exceed annual wage base limit',
        condition: 'less_than_or_equal',
        value: 168600,
        errorMessage: 'Social Security wages exceed annual wage base',
        severity: 'info'
      },
      {
        id: 'ssWagesConsistency',
        ruleName: 'SS Wages vs Total Wages',
        ruleType: 'calculation',
        description: 'Box 3 should be close to Box 1 unless significant pre-tax deductions',
        condition: 'within_percentage',
        value: 30,
        compareField: 'box1Wages',
        errorMessage: 'Large discrepancy between Box 1 and Box 3',
        severity: 'info'
      }
    ]
  },
  {
    id: 'box4SocialSecurityTax',
    fieldName: 'Box 4 - Social Security Tax Withheld',
    description: 'Social Security tax withheld from Box 4',
    extractionPrompt: 'Extract the amount from Box 4 labeled "Social security tax withheld". This should be 6.2% of Box 3. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'ssTaxCalculation',
        ruleName: 'SS Tax Calculation Check',
        ruleType: 'calculation',
        description: 'Box 4 should be 6.2% of Box 3',
        condition: 'equals_percentage',
        percentage: 6.2,
        compareField: 'box3SocialSecurityWages',
        tolerance: 1,
        errorMessage: 'Social Security tax calculation incorrect',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'box5MedicareWages',
    fieldName: 'Box 5 - Medicare Wages and Tips',
    description: 'Wages subject to Medicare tax from Box 5',
    extractionPrompt: 'Extract the amount from Box 5 labeled "Medicare wages and tips". This is typically equal to Box 1. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'medicareWagesConsistency',
        ruleName: 'Medicare Wages Consistency',
        ruleType: 'calculation',
        description: 'Box 5 typically matches Box 1',
        condition: 'within_percentage',
        value: 5,
        compareField: 'box1Wages',
        errorMessage: 'Medicare wages significantly differ from total wages',
        severity: 'info'
      }
    ]
  },
  {
    id: 'box6MedicareTax',
    fieldName: 'Box 6 - Medicare Tax Withheld',
    description: 'Medicare tax withheld from Box 6',
    extractionPrompt: 'Extract the amount from Box 6 labeled "Medicare tax withheld". This should be 1.45% of Box 5. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'medicareTaxCalculation',
        ruleName: 'Medicare Tax Calculation Check',
        ruleType: 'calculation',
        description: 'Box 6 should be 1.45% of Box 5',
        condition: 'equals_percentage',
        percentage: 1.45,
        compareField: 'box5MedicareWages',
        tolerance: 1,
        errorMessage: 'Medicare tax calculation incorrect',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'box12aCode',
    fieldName: 'Box 12a - Code',
    description: 'Code for Box 12a (e.g., D for 401k)',
    extractionPrompt: 'Extract the single letter code from Box 12a. Common codes include D (401k contributions), DD (employer health coverage cost). If Box 12a is empty, extract "none" or leave blank.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'box12aAmount',
    fieldName: 'Box 12a - Amount',
    description: 'Dollar amount for Box 12a',
    extractionPrompt: 'Extract the dollar amount corresponding to Box 12a code. This represents items like retirement contributions or other special compensation. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'box16StateWages',
    fieldName: 'Box 16 - State Wages, Tips, etc.',
    description: 'State wages from Box 16',
    extractionPrompt: 'Extract the amount from Box 16 labeled "State wages, tips, etc." This is typically the same as Box 1 but may vary by state rules. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'stateWagesConsistency',
        ruleName: 'State Wages Consistency',
        ruleType: 'calculation',
        description: 'State wages typically match federal wages',
        condition: 'within_percentage',
        value: 10,
        compareField: 'box1Wages',
        errorMessage: 'State wages differ significantly from federal wages',
        severity: 'info'
      }
    ]
  },
  {
    id: 'box17StateIncomeTax',
    fieldName: 'Box 17 - State Income Tax',
    description: 'State income tax withheld from Box 17',
    extractionPrompt: 'Extract the amount from Box 17 labeled "State income tax". This is the total state tax withheld. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'stateTaxReasonability',
        ruleName: 'State Tax Reasonability',
        ruleType: 'percentage',
        description: 'State tax should be 0-15% of state wages',
        condition: 'percentage_range',
        minPercent: 0,
        maxPercent: 15,
        compareField: 'box16StateWages',
        errorMessage: 'State tax withholding percentage unusual',
        severity: 'info'
      }
    ]
  }
];
