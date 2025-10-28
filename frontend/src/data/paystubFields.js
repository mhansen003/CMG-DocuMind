// Complete Paystub field configuration with extraction prompts
export const paystubFields = [
  {
    id: 'employeeName',
    fieldName: 'Employee Name',
    description: 'Full legal name of the employee as shown on the paystub',
    extractionPrompt: 'Extract the full name of the employee from the paystub. This is typically shown near the top of the document in a section labeled "Employee Information" or "Employee Name". Include first, middle (if present), and last name. Do not include suffixes unless they are part of the legal name.',
    byteLOSMapping: 'borrower.firstName + borrower.middleName + borrower.lastName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'matchesBorrowerName',
        ruleName: 'Name Match Validation',
        ruleType: 'comparison',
        description: 'Employee name must match borrower name on loan application',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Employee name does not match borrower name on application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'employerName',
    fieldName: 'Employer Name',
    description: 'Legal name of the employing company',
    extractionPrompt: 'Extract the employer or company name from the paystub. This is usually displayed prominently at the top of the document or in the "Employer Information" section. Use the exact legal name as shown, including any Inc., LLC, Corp., or other business designations.',
    byteLOSMapping: 'borrower.employment.current.employerName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'matchesApplication',
        ruleName: 'Employer Match Validation',
        ruleType: 'comparison',
        description: 'Employer name must match employment information on loan application',
        condition: 'matches',
        compareField: 'borrower.employment.current.employerName',
        errorMessage: 'Employer name does not match employment records',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'payPeriodStart',
    fieldName: 'Pay Period Start Date',
    description: 'First day of the pay period covered by this paystub',
    extractionPrompt: 'Locate the pay period dates section on the paystub, often labeled "Pay Period", "Period Covered", or "For Period". Extract the start date (the first date in the range). Format as MM/DD/YYYY. This date represents when the pay period began.',
    byteLOSMapping: null,
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'documentRecency',
        ruleName: 'Document Recency Requirement',
        ruleType: 'date_range',
        description: 'Pay period must be within 60 days of loan application date',
        condition: 'within_days',
        value: 60,
        compareField: 'applicationDate',
        errorMessage: 'Paystub is too old. Documents must be dated within the last 60 days of loan application.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'payPeriodEnd',
    fieldName: 'Pay Period End Date',
    description: 'Last day of the pay period covered by this paystub',
    extractionPrompt: 'Locate the pay period dates section on the paystub. Extract the end date (the second date in the range, often shown as "through" or "to"). Format as MM/DD/YYYY. This is the last day covered by this pay period.',
    byteLOSMapping: null,
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'documentRecency',
        ruleName: 'Document Recency Requirement',
        ruleType: 'date_range',
        description: 'Pay period end must be within 60 days of loan application',
        condition: 'within_days',
        value: 60,
        compareField: 'applicationDate',
        errorMessage: 'Paystub is too old. Pay period must be recent.',
        severity: 'critical'
      },
      {
        id: 'periodLogic',
        ruleName: 'Pay Period Logic Check',
        ruleType: 'date_comparison',
        description: 'Pay period end date must be after start date',
        condition: 'after',
        compareField: 'payPeriodStart',
        errorMessage: 'Pay period end date must be after start date',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'payDate',
    fieldName: 'Pay Date',
    description: 'Date the employee was paid',
    extractionPrompt: 'Find the pay date or check date on the paystub, typically labeled "Pay Date", "Check Date", or "Date Paid". This is different from the pay period dates - it is the actual date when payment was issued. Format as MM/DD/YYYY.',
    byteLOSMapping: null,
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'payDateLogic',
        ruleName: 'Pay Date Logic Validation',
        ruleType: 'date_comparison',
        description: 'Pay date must be on or after the pay period end date',
        condition: 'on_or_after',
        compareField: 'payPeriodEnd',
        errorMessage: 'Pay date must be on or after the pay period end date',
        severity: 'critical'
      },
      {
        id: 'futurePayDate',
        ruleName: 'Future Date Check',
        ruleType: 'date_range',
        description: 'Pay date cannot be in the future',
        condition: 'not_after',
        compareField: 'today',
        errorMessage: 'Pay date cannot be in the future',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'grossPayCurrent',
    fieldName: 'Current Gross Pay',
    description: 'Total gross earnings for this pay period before deductions',
    extractionPrompt: 'Find the current period gross pay amount on the paystub, usually in the earnings section labeled "Gross Pay", "Total Gross", or "Gross Earnings" for THIS pay period (not YTD). Extract only the numerical amount without currency symbols. Include cents (e.g., 5995.20).',
    byteLOSMapping: 'borrower.employment.current.baseIncome / payPeriodsPerYear',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'incomeConsistency',
        ruleName: 'Income Consistency Check',
        ruleType: 'calculation',
        description: 'Gross pay should align with stated annual income on application',
        condition: 'within_percentage',
        value: 15,
        compareField: 'borrower.employment.current.totalIncome',
        errorMessage: 'Current gross pay does not align with stated annual income (variance > 15%)',
        severity: 'warning'
      },
      {
        id: 'reasonableAmount',
        ruleName: 'Reasonable Amount Check',
        ruleType: 'range',
        description: 'Gross pay must be a reasonable positive amount',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Gross pay must be greater than zero',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'grossPayYTD',
    fieldName: 'Year-to-Date Gross Pay',
    description: 'Total gross earnings from January 1 through current pay period',
    extractionPrompt: 'Locate the Year-to-Date (YTD) gross pay amount on the paystub, typically in a YTD column or section labeled "YTD Gross", "Year to Date Gross", or similar. This represents cumulative gross earnings from January 1 through the current pay period. Extract the numerical amount without currency symbols.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'ytdCalculation',
        ruleName: 'YTD Calculation Verification',
        ruleType: 'calculation',
        description: 'YTD amount should be consistent with current gross pay and pay periods completed',
        condition: 'calculated_match',
        errorMessage: 'YTD gross pay does not match expected calculation based on current pay',
        severity: 'warning'
      },
      {
        id: 'ytdIncomeConsistent',
        ruleName: 'YTD Income Projection',
        ruleType: 'calculation',
        description: 'YTD income should project to stated annual income',
        condition: 'projects_to',
        compareField: 'borrower.employment.current.totalIncome',
        tolerance: 20,
        errorMessage: 'YTD income projection does not align with stated annual income',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'netPay',
    fieldName: 'Net Pay',
    description: 'Take-home pay after all deductions',
    extractionPrompt: 'Find the net pay amount on the paystub, typically labeled "Net Pay", "Take Home Pay", or "Total Net" for the current pay period. This is the amount actually paid to the employee after all taxes and deductions. Extract the numerical amount without currency symbols.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'netPayCalculation',
        ruleName: 'Net Pay Reasonability',
        ruleType: 'calculation',
        description: 'Net pay should be less than gross pay with reasonable deduction percentage',
        condition: 'less_than',
        compareField: 'grossPayCurrent',
        errorMessage: 'Net pay exceeds gross pay or deductions appear unreasonable',
        severity: 'critical'
      },
      {
        id: 'deductionRange',
        ruleName: 'Deduction Percentage Range',
        ruleType: 'percentage',
        description: 'Deductions should typically be 20-50% of gross pay',
        condition: 'percentage_range',
        minPercent: 20,
        maxPercent: 50,
        compareField: 'grossPayCurrent',
        errorMessage: 'Deduction percentage is outside normal range (20-50%)',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'regularHours',
    fieldName: 'Regular Hours',
    description: 'Number of regular hours worked during pay period',
    extractionPrompt: 'Look for the hours worked section on the paystub, often in an earnings breakdown table. Find the row labeled "Regular Hours", "Base Hours", or "Regular" and extract the hours value (not the dollar amount). If hours are shown in decimal format (e.g., 80.00), include decimals.',
    byteLOSMapping: null,
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'reasonableHours',
        ruleName: 'Reasonable Hours Check',
        ruleType: 'range',
        description: 'Regular hours should be within reasonable range for pay period',
        condition: 'between',
        minValue: 0,
        maxValue: 200,
        errorMessage: 'Regular hours outside reasonable range (0-200)',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'overtimeHours',
    fieldName: 'Overtime Hours',
    description: 'Number of overtime hours worked during pay period',
    extractionPrompt: 'In the earnings breakdown section, locate any overtime hours, typically labeled "Overtime Hours", "OT Hours", "Overtime", or "Time and a Half". Extract only the hours value, not the dollar amount. If no overtime was worked, extract 0 or leave blank if the field is not present on the paystub.',
    byteLOSMapping: 'borrower.employment.current.overtimeIncome',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'overtimeConsistency',
        ruleName: 'Overtime Income Consistency',
        ruleType: 'calculation',
        description: 'Overtime hours should align with stated overtime income on application',
        condition: 'consistent_with',
        compareField: 'borrower.employment.current.overtimeIncome',
        errorMessage: 'Overtime hours/income not consistent with application',
        severity: 'info'
      }
    ]
  }
];
