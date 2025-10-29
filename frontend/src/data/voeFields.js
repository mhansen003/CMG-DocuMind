// Employment Verification Letter (VOE) field configuration with extraction prompts
export const voeFields = [
  {
    id: 'voeEmployeeName',
    fieldName: 'Employee Name',
    description: 'Full legal name of the employee',
    extractionPrompt: 'Extract the full legal name of the employee from the verification of employment letter. This is typically shown near the beginning of the letter in a section like "Re:", "Regarding:", "Employee:", or "Subject:". Extract the complete name including first, middle (if present), and last name.',
    byteLOSMapping: 'borrower.firstName + borrower.middleName + borrower.lastName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'employeeNameMatch',
        ruleName: 'Employee Name Match',
        ruleType: 'comparison',
        description: 'Employee name must match borrower name on loan application',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Employee name on VOE does not match borrower name on application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'voeEmployerName',
    fieldName: 'Employer Name',
    description: 'Official name of the employing company',
    extractionPrompt: 'Extract the employer or company name from the VOE letter. This is usually on the letterhead at the top of the document or in the body text. Use the complete legal business name including any Inc., LLC, Corp., or other business designations.',
    byteLOSMapping: 'borrower.employment.current.employerName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'employerNameMatch',
        ruleName: 'Employer Name Match',
        ruleType: 'comparison',
        description: 'Employer name must match employment information on loan application',
        condition: 'matches',
        compareField: 'borrower.employment.current.employerName',
        errorMessage: 'Employer name on VOE does not match loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'voeEmployerAddress',
    fieldName: 'Employer Address',
    description: 'Business address of the employer',
    extractionPrompt: 'Extract the complete business address of the employer from the VOE letterhead or signature block. Include street address, city, state, and ZIP code.',
    byteLOSMapping: 'borrower.employment.current.employerAddress',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'voeLetterDate',
    fieldName: 'Letter Date',
    description: 'Date the VOE letter was written',
    extractionPrompt: 'Extract the date of the verification letter, typically shown near the top of the letter after the letterhead or in the opening section. Format as MM/DD/YYYY.',
    byteLOSMapping: 'borrower.employment.current.verificationDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'letterRecency',
        ruleName: 'VOE Letter Recency',
        ruleType: 'date_range',
        description: 'VOE letter should be within 120 days of loan application',
        condition: 'within_days',
        value: 120,
        compareField: 'applicationDate',
        errorMessage: 'VOE letter is more than 120 days old. Updated verification may be required.',
        severity: 'warning'
      },
      {
        id: 'letterDateNotFuture',
        ruleName: 'Letter Date Logic',
        ruleType: 'date_comparison',
        description: 'Letter date must not be in the future',
        condition: 'before_or_equal',
        compareField: 'today',
        errorMessage: 'VOE letter date cannot be in the future',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'voeJobTitle',
    fieldName: 'Job Title/Position',
    description: 'Employee\'s current job title or position',
    extractionPrompt: 'Extract the employee\'s job title or position from the VOE letter. This is typically stated as "Position:", "Title:", "Job Title:", or within the body text describing the employee\'s role. Extract the complete title exactly as stated.',
    byteLOSMapping: 'borrower.employment.current.position',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'jobTitleConsistency',
        ruleName: 'Job Title Consistency',
        ruleType: 'comparison',
        description: 'Job title should match employment information on application',
        condition: 'similar_to',
        compareField: 'borrower.employment.current.position',
        errorMessage: 'Job title on VOE differs from loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeHireDate',
    fieldName: 'Date of Hire',
    description: 'Date employee was hired',
    extractionPrompt: 'Extract the date the employee was hired or started employment, typically labeled "Date of Hire:", "Hire Date:", "Start Date:", or "Employment Start Date:". Format as MM/DD/YYYY.',
    byteLOSMapping: 'borrower.employment.current.startDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'hireDateLogic',
        ruleName: 'Hire Date Logic',
        ruleType: 'date_comparison',
        description: 'Hire date must be in the past',
        condition: 'before',
        compareField: 'today',
        errorMessage: 'Hire date cannot be in the future',
        severity: 'critical'
      },
      {
        id: 'hireDateConsistency',
        ruleName: 'Hire Date Consistency',
        ruleType: 'date_comparison',
        description: 'Hire date should match employment start date on application',
        condition: 'within_days',
        value: 30,
        compareField: 'borrower.employment.current.startDate',
        errorMessage: 'Hire date on VOE differs from employment start date on application',
        severity: 'warning'
      },
      {
        id: 'employmentLength',
        ruleName: 'Employment Length Calculation',
        ruleType: 'date_calculation',
        description: 'Calculate years/months of employment',
        condition: 'calculate_tenure',
        errorMessage: 'Verify employment length meets program requirements (typically 2 years)',
        severity: 'info'
      }
    ]
  },
  {
    id: 'voeEmploymentStatus',
    fieldName: 'Employment Status',
    description: 'Current employment status (active, full-time, etc.)',
    extractionPrompt: 'Extract the employment status from the VOE letter. Look for terms like "Full-Time", "Part-Time", "Active", "Currently Employed", "Permanent", "Probationary", "Contract", etc. Extract the status exactly as stated.',
    byteLOSMapping: 'borrower.employment.current.employmentStatus',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'activeEmployment',
        ruleName: 'Active Employment Required',
        ruleType: 'comparison',
        description: 'Employee must be currently employed and active',
        condition: 'contains_any',
        validValues: ['Active', 'Currently Employed', 'Full-Time', 'Part-Time', 'Employed'],
        errorMessage: 'Employment status does not confirm active employment',
        severity: 'critical'
      },
      {
        id: 'fullTimePreferred',
        ruleName: 'Full-Time Employment',
        ruleType: 'comparison',
        description: 'Full-time employment is typically preferred',
        condition: 'contains',
        value: 'Full-Time',
        errorMessage: 'Employment is not full-time. Part-time or contract employment may require additional documentation.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeBaseSalary',
    fieldName: 'Base Salary/Hourly Rate',
    description: 'Current base salary or hourly wage',
    extractionPrompt: 'Extract the employee\'s base salary or hourly rate from the VOE letter. This may be stated as annual salary (e.g., "$75,000 per year"), monthly salary, or hourly rate (e.g., "$35.00 per hour"). Extract the numerical amount and indicate the period (annual, monthly, hourly). Do not include currency symbols.',
    byteLOSMapping: 'borrower.employment.current.baseIncome',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'salaryConsistency',
        ruleName: 'Salary Consistency Check',
        ruleType: 'calculation',
        description: 'Base salary should align with stated income on application',
        condition: 'within_percentage',
        value: 10,
        compareField: 'borrower.employment.current.baseIncome',
        errorMessage: 'Base salary on VOE differs from stated income on application by more than 10%',
        severity: 'warning'
      },
      {
        id: 'salaryReasonable',
        ruleName: 'Reasonable Salary Amount',
        ruleType: 'range',
        description: 'Salary must be a reasonable positive amount',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Base salary must be greater than zero',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'voeOvertimeBonusCommission',
    fieldName: 'Overtime/Bonus/Commission Income',
    description: 'Additional compensation beyond base salary',
    extractionPrompt: 'Check if the VOE letter mentions any additional compensation such as overtime pay, bonuses, commissions, or other variable income. Extract the amount and type if stated, or "None" if not mentioned. If amounts are provided, include them (e.g., "Overtime: $5,000 annually, Bonus: $10,000 annually").',
    byteLOSMapping: 'borrower.employment.current.otherIncome',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'additionalIncomeVerification',
        ruleName: 'Additional Income Documentation',
        ruleType: 'conditional',
        description: 'Additional income may require 2-year history documentation',
        condition: 'if_not_none',
        errorMessage: 'Additional income (overtime/bonus/commission) typically requires 2-year history and tax return verification',
        severity: 'info'
      }
    ]
  },
  {
    id: 'voeHoursPerWeek',
    fieldName: 'Hours Per Week',
    description: 'Typical number of hours worked per week',
    extractionPrompt: 'Extract the number of hours per week the employee typically works, if stated in the VOE letter. This may be labeled "Hours Per Week:", "Weekly Hours:", or stated in the employment details. Extract only the numerical value. If not stated, leave blank.',
    byteLOSMapping: 'borrower.employment.current.hoursPerWeek',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'fullTimeHours',
        ruleName: 'Full-Time Hours Verification',
        ruleType: 'range',
        description: 'Full-time typically means 30+ hours per week',
        condition: 'greater_than_or_equal',
        value: 30,
        errorMessage: 'Hours per week is less than typical full-time threshold (30 hours)',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeProbabilityOfContinuance',
    fieldName: 'Probability of Continued Employment',
    description: 'Statement about likelihood of continued employment',
    extractionPrompt: 'Check if the VOE letter includes a statement about the probability or likelihood of continued employment. Look for phrases like "good standing", "expected to continue", "no plans for termination", "stable employment", etc. Extract the relevant statement or "Not stated" if not included.',
    byteLOSMapping: 'borrower.employment.current.stabilityIndicator',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'employmentStability',
        ruleName: 'Employment Stability Indicator',
        ruleType: 'comparison',
        description: 'Positive stability indicator preferred',
        condition: 'not_contains_any',
        invalidValues: ['termination', 'layoff', 'reduction', 'downsizing', 'probation'],
        errorMessage: 'VOE contains concerning language about employment stability',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeYearToDateEarnings',
    fieldName: 'Year-to-Date Earnings',
    description: 'Total earnings year-to-date',
    extractionPrompt: 'Extract the year-to-date (YTD) earnings amount if provided in the VOE letter. This may be labeled "YTD Earnings:", "Year-to-Date Income:", or similar. Extract only the numerical amount without currency symbols. If not provided, leave blank.',
    byteLOSMapping: 'borrower.employment.current.ytdIncome',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'ytdProjection',
        ruleName: 'YTD Income Projection',
        ruleType: 'calculation',
        description: 'YTD earnings should project to stated annual income',
        condition: 'projects_to',
        compareField: 'borrower.employment.current.baseIncome',
        tolerance: 20,
        errorMessage: 'YTD earnings do not project to stated annual income',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voePriorYearIncome',
    fieldName: 'Prior Year Income',
    description: 'Total income for previous year',
    extractionPrompt: 'Extract the previous year\'s total income if provided in the VOE letter. This may be labeled "Prior Year Income:", "Last Year Earnings:", or "[YEAR] Income:". Extract only the numerical amount without currency symbols. If not provided, leave blank.',
    byteLOSMapping: 'borrower.employment.current.priorYearIncome',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'incomeStability',
        ruleName: 'Income Stability Check',
        ruleType: 'calculation',
        description: 'Current income should be comparable to prior year',
        condition: 'within_percentage',
        value: 25,
        compareField: 'borrower.employment.current.baseIncome',
        errorMessage: 'Significant variance between prior year and current income',
        severity: 'info'
      }
    ]
  },
  {
    id: 'voeSignerName',
    fieldName: 'Signer Name',
    description: 'Name of person signing the VOE letter',
    extractionPrompt: 'Extract the name of the person who signed the verification letter, typically found in the signature block at the bottom of the letter. This should be a company representative such as HR manager, supervisor, or company officer.',
    byteLOSMapping: 'borrower.employment.current.verifierName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'signerPresent',
        ruleName: 'Signature Required',
        ruleType: 'format',
        description: 'VOE must be signed by authorized company representative',
        condition: 'not_empty',
        errorMessage: 'VOE letter signer name is missing',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'voeSignerTitle',
    fieldName: 'Signer Title',
    description: 'Job title of person signing the VOE',
    extractionPrompt: 'Extract the job title or position of the person who signed the VOE letter, typically shown below their name in the signature block (e.g., "HR Manager", "Director of Human Resources", "Supervisor", "President").',
    byteLOSMapping: 'borrower.employment.current.verifierTitle',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'authorizedSigner',
        ruleName: 'Authorized Signer',
        ruleType: 'comparison',
        description: 'Signer should be authorized company representative',
        condition: 'contains_any',
        validValues: ['HR', 'Human Resources', 'Manager', 'Director', 'President', 'CEO', 'CFO', 'Owner', 'Supervisor', 'Administrator'],
        errorMessage: 'Verify signer is authorized to provide employment verification',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeContactPhone',
    fieldName: 'Contact Phone Number',
    description: 'Phone number to verify employment',
    extractionPrompt: 'Extract the contact phone number for the employer or the person who signed the letter. This is typically in the letterhead, signature block, or contact information section. Include area code and format as shown.',
    byteLOSMapping: 'borrower.employment.current.employerPhone',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'phoneNumberMatch',
        ruleName: 'Phone Number Verification',
        ruleType: 'comparison',
        description: 'Phone number should match known employer contact',
        condition: 'matches',
        compareField: 'borrower.employment.current.employerPhone',
        errorMessage: 'Phone number on VOE differs from employer contact on application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeCompanyEmail',
    fieldName: 'Company Email',
    description: 'Email address for verification contact',
    extractionPrompt: 'Extract the email address of the signer or general company contact if provided in the VOE letter. This is typically in the letterhead or signature block.',
    byteLOSMapping: 'borrower.employment.current.verifierEmail',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'businessEmailDomain',
        ruleName: 'Business Email Domain',
        ruleType: 'format',
        description: 'Email should use company domain (not personal email)',
        condition: 'not_contains_any',
        invalidValues: ['gmail.com', 'yahoo.com', 'hotmail.com', 'aol.com', 'outlook.com'],
        errorMessage: 'VOE uses personal email domain. Business email preferred for verification.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'voeAdditionalComments',
    fieldName: 'Additional Comments',
    description: 'Any additional comments or notes in the letter',
    extractionPrompt: 'Extract any additional comments, notes, or special information provided in the VOE letter that may be relevant to the employment verification. This might include information about promotions, salary increases, performance, or any other pertinent details. If none, indicate "None".',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'voeSignatureDate',
    fieldName: 'Signature Date',
    description: 'Date the letter was signed',
    extractionPrompt: 'If the signature date is different from the letter date, extract the date when the letter was signed, typically handwritten or printed near the signature. Format as MM/DD/YYYY. If only one date appears, this may be the same as the letter date.',
    byteLOSMapping: null,
    dataType: 'date',
    required: false,
    rules: [
      {
        id: 'signatureDateLogic',
        ruleName: 'Signature Date Consistency',
        ruleType: 'date_comparison',
        description: 'Signature date should match or follow letter date',
        condition: 'on_or_after',
        compareField: 'voeLetterDate',
        errorMessage: 'Signature date is before letter date',
        severity: 'warning'
      }
    ]
  }
];
