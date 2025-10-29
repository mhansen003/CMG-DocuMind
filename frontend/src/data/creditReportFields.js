// Credit Report field configuration with extraction prompts
export const creditReportFields = [
  {
    id: 'crBorrowerName',
    fieldName: 'Borrower Name',
    description: 'Borrower name as shown on credit report',
    extractionPrompt: 'Extract the primary borrower name from the credit report. This is typically shown prominently at the top of the report in the identifying information section. Include full name as shown.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'nameMatchesBorrower',
        ruleName: 'Borrower Name Match',
        ruleType: 'comparison',
        description: 'Name on credit report should match loan application',
        condition: 'similar_to',
        compareField: 'borrower.fullName',
        errorMessage: 'Name on credit report differs from loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crSSN',
    fieldName: 'Social Security Number',
    description: 'SSN shown on credit report',
    extractionPrompt: 'Extract the Social Security number from the credit report. This appears in the identifying information section, typically formatted as XXX-XX-XXXX. Extract exactly as shown.',
    byteLOSMapping: 'borrower.ssn',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'ssnMatchesBorrower',
        ruleName: 'SSN Match',
        ruleType: 'comparison',
        description: 'SSN must match loan application',
        condition: 'matches',
        compareField: 'borrower.ssn',
        errorMessage: 'SSN on credit report does not match loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'crDateOfBirth',
    fieldName: 'Date of Birth',
    description: 'Borrower date of birth on credit report',
    extractionPrompt: 'Extract the date of birth from the credit report identifying information section. Format as MM/DD/YYYY.',
    byteLOSMapping: 'borrower.dateOfBirth',
    dataType: 'date',
    required: false,
    rules: [
      {
        id: 'dobMatchesBorrower',
        ruleName: 'Date of Birth Match',
        ruleType: 'comparison',
        description: 'DOB should match loan application',
        condition: 'matches',
        compareField: 'borrower.dateOfBirth',
        errorMessage: 'Date of birth on credit report does not match loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crCurrentAddress',
    fieldName: 'Current Address',
    description: 'Current address shown on credit report',
    extractionPrompt: 'Extract the current address from the credit report. This is typically the most recent address in the address history section. Include street, city, state, and ZIP code.',
    byteLOSMapping: 'borrower.currentAddress.fullAddress',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'addressConsistency',
        ruleName: 'Address Consistency Check',
        ruleType: 'comparison',
        description: 'Address should match loan application',
        condition: 'similar_to',
        compareField: 'borrower.currentAddress.fullAddress',
        errorMessage: 'Current address on credit report differs from loan application',
        severity: 'info'
      }
    ]
  },
  {
    id: 'crReportDate',
    fieldName: 'Credit Report Date',
    description: 'Date the credit report was generated',
    extractionPrompt: 'Extract the date the credit report was generated or pulled, typically shown at the top of the report labeled "Report Date", "Date Ordered", or "Credit Report Date". Format as MM/DD/YYYY.',
    byteLOSMapping: 'borrower.creditReport.reportDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'reportRecency',
        ruleName: 'Credit Report Recency',
        ruleType: 'date_range',
        description: 'Credit report must be within 120 days of application',
        condition: 'within_days',
        value: 120,
        compareField: 'applicationDate',
        errorMessage: 'Credit report is more than 120 days old. Most lenders require report within 90-120 days.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'crCreditScore',
    fieldName: 'Credit Score (FICO/VantageScore)',
    description: 'Primary credit score',
    extractionPrompt: 'Extract the primary credit score from the report. For tri-merge reports, this is typically the middle score or the representative score used for qualification. Look for "FICO Score", "Credit Score", or similar. Extract only the numerical value.',
    byteLOSMapping: 'borrower.creditScore',
    dataType: 'number',
    required: true,
    rules: [
      {
        id: 'scoreInRange',
        ruleName: 'Valid Score Range',
        ruleType: 'range',
        description: 'Credit score must be in valid range (300-850)',
        condition: 'between',
        minValue: 300,
        maxValue: 850,
        errorMessage: 'Credit score is outside valid range',
        severity: 'critical'
      },
      {
        id: 'minimumScoreWarning',
        ruleName: 'Minimum Score Threshold',
        ruleType: 'range',
        description: 'Check if score meets minimum program requirements',
        condition: 'greater_than_or_equal',
        value: 620,
        errorMessage: 'Credit score is below typical conventional loan minimum (620). May require FHA or alternative programs.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crScoreModel',
    fieldName: 'Credit Score Model',
    description: 'Credit scoring model used (FICO 2, FICO 8, VantageScore, etc.)',
    extractionPrompt: 'Identify the credit scoring model used for the report. Common models include "FICO Score 2", "FICO Score 5", "FICO Score 8", "VantageScore 3.0", "VantageScore 4.0". This is typically specified near the credit score. Extract exactly as labeled.',
    byteLOSMapping: 'borrower.creditReport.scoreModel',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'crEquifaxScore',
    fieldName: 'Equifax Credit Score',
    description: 'Credit score from Equifax bureau',
    extractionPrompt: 'If this is a tri-merge report, extract the credit score from Equifax specifically. This is typically shown in a bureau comparison section. Extract only the numerical value. If not a tri-merge or not shown, leave blank.',
    byteLOSMapping: 'borrower.creditReport.equifaxScore',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'crExperianScore',
    fieldName: 'Experian Credit Score',
    description: 'Credit score from Experian bureau',
    extractionPrompt: 'If this is a tri-merge report, extract the credit score from Experian specifically. Extract only the numerical value. If not shown, leave blank.',
    byteLOSMapping: 'borrower.creditReport.experianScore',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'crTransUnionScore',
    fieldName: 'TransUnion Credit Score',
    description: 'Credit score from TransUnion bureau',
    extractionPrompt: 'If this is a tri-merge report, extract the credit score from TransUnion specifically. Extract only the numerical value. If not shown, leave blank.',
    byteLOSMapping: 'borrower.creditReport.transUnionScore',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'crTotalOpenAccounts',
    fieldName: 'Total Open Accounts',
    description: 'Number of currently open credit accounts',
    extractionPrompt: 'Extract the total number of open credit accounts from the credit summary section. This includes all active credit cards, installment loans, mortgages, etc. Extract only the numerical count.',
    byteLOSMapping: 'borrower.creditReport.openAccounts',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'crTotalClosedAccounts',
    fieldName: 'Total Closed Accounts',
    description: 'Number of closed credit accounts',
    extractionPrompt: 'Extract the total number of closed accounts from the credit summary. Extract only the numerical count.',
    byteLOSMapping: 'borrower.creditReport.closedAccounts',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'crDerogatory',
    fieldName: 'Derogatory Accounts Count',
    description: 'Number of derogatory accounts or negative items',
    extractionPrompt: 'Extract the number of derogatory accounts, negative items, or accounts with adverse history from the credit summary. This includes late payments, collections, charge-offs, judgments, etc. Extract the numerical count. If none, extract 0.',
    byteLOSMapping: 'borrower.creditReport.derogatoryCount',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'derogatoryFlag',
        ruleName: 'Derogatory Items Flag',
        ruleType: 'range',
        description: 'Derogatory items may affect loan approval',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Credit report shows derogatory accounts. Review for impact on loan eligibility.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crPublicRecords',
    fieldName: 'Public Records Count',
    description: 'Number of public records (bankruptcies, judgments, liens)',
    extractionPrompt: 'Extract the number of public records from the credit report. This includes bankruptcies, tax liens, judgments, foreclosures. Look in the public records section. Extract numerical count. If none, extract 0.',
    byteLOSMapping: 'borrower.creditReport.publicRecords',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'publicRecordsFlag',
        ruleName: 'Public Records Alert',
        ruleType: 'range',
        description: 'Public records may disqualify or require waiting period',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Credit report shows public records. Review for bankruptcy, foreclosure, or judgment waiting periods.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'crBankruptcy',
    fieldName: 'Bankruptcy',
    description: 'Presence and details of bankruptcy',
    extractionPrompt: 'Check for any bankruptcy filings in the public records section. If present, extract the bankruptcy type (Chapter 7, Chapter 13), status (Discharged, Active), and discharge/filing date. If no bankruptcy, extract "None".',
    byteLOSMapping: 'borrower.creditReport.bankruptcy',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'bankruptcyWaitingPeriod',
        ruleName: 'Bankruptcy Waiting Period',
        ruleType: 'conditional',
        description: 'Bankruptcy requires waiting period (2-4 years depending on chapter and loan type)',
        condition: 'if_not_none',
        errorMessage: 'Bankruptcy found. Verify waiting period requirements met (typically 2-4 years from discharge).',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'crForeclosure',
    fieldName: 'Foreclosure',
    description: 'Presence and details of foreclosure',
    extractionPrompt: 'Check for any foreclosure history in the public records or mortgage accounts section. If present, extract details including date and status. If no foreclosure, extract "None".',
    byteLOSMapping: 'borrower.creditReport.foreclosure',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'foreclosureWaitingPeriod',
        ruleName: 'Foreclosure Waiting Period',
        ruleType: 'conditional',
        description: 'Foreclosure requires waiting period (typically 3-7 years)',
        condition: 'if_not_none',
        errorMessage: 'Foreclosure found. Verify waiting period requirements met (typically 3-7 years).',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'crCollections',
    fieldName: 'Collection Accounts',
    description: 'Number and total amount of collection accounts',
    extractionPrompt: 'Extract information about collection accounts from the credit report. Include the number of collections and total dollar amount if shown. Format as "X accounts, $Y total" or "None" if no collections.',
    byteLOSMapping: 'borrower.creditReport.collections',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'collectionsReview',
        ruleName: 'Collections Review Required',
        ruleType: 'conditional',
        description: 'Collection accounts may require explanation or payment',
        condition: 'if_not_none',
        errorMessage: 'Collection accounts present. Large collections may need to be paid or explained.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crLatePayments',
    fieldName: 'Late Payments (Last 12 Months)',
    description: 'Number of late payments in past 12 months',
    extractionPrompt: 'Count the number of late payments (30, 60, 90+ days late) in the past 12 months across all accounts. Look in the payment history section. Extract the count. If none, extract 0.',
    byteLOSMapping: 'borrower.creditReport.latePayments12mo',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'recentLatePayments',
        ruleName: 'Recent Late Payments Warning',
        ruleType: 'range',
        description: 'Recent late payments may affect approval',
        condition: 'greater_than',
        value: 2,
        errorMessage: 'Multiple late payments in past 12 months. May impact loan approval or require explanation.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crMortgageLatePayments',
    fieldName: 'Mortgage Late Payments (Last 12 Months)',
    description: 'Late payments on mortgage accounts in past year',
    extractionPrompt: 'Specifically count late payments on mortgage accounts (if any) in the past 12 months. Mortgage late payments are viewed more seriously than other late payments. Extract count. If no mortgage accounts or no late payments, extract 0.',
    byteLOSMapping: 'borrower.creditReport.mortgageLates12mo',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'mortgageLatePaymentsCritical',
        ruleName: 'Mortgage Late Payments Critical',
        ruleType: 'range',
        description: 'Late mortgage payments are serious derogatory',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Mortgage late payments in past 12 months. This is a serious derogatory that may disqualify borrower.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'crTotalDebt',
    fieldName: 'Total Outstanding Debt',
    description: 'Total amount of outstanding debt across all accounts',
    extractionPrompt: 'Extract the total outstanding debt balance from the credit summary. This includes all credit cards, auto loans, student loans, mortgages, etc. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'borrower.creditReport.totalDebt',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'crTotalMonthlyPayments',
    fieldName: 'Total Monthly Payments',
    description: 'Sum of all monthly debt payments',
    extractionPrompt: 'Extract the total of all monthly payments from the credit summary. This is the sum of minimum payments on credit cards plus installment loan payments. Extract only the numerical amount.',
    byteLOSMapping: 'borrower.monthlyDebtPayments',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'dtiCalculation',
        ruleName: 'DTI Calculation Input',
        ruleType: 'calculation',
        description: 'Monthly payments used to calculate debt-to-income ratio',
        condition: 'calculate_dti',
        compareField: 'borrower.monthlyIncome',
        errorMessage: 'Verify monthly payment amounts for accurate DTI calculation',
        severity: 'info'
      }
    ]
  },
  {
    id: 'crRevolvingCredit',
    fieldName: 'Total Revolving Credit',
    description: 'Total revolving credit limit across all accounts',
    extractionPrompt: 'Extract the total revolving credit limit from the credit summary. This is the sum of all credit card limits and lines of credit. Extract only the numerical amount.',
    byteLOSMapping: 'borrower.creditReport.totalRevolvingCredit',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'crRevolvingBalance',
    fieldName: 'Total Revolving Balance',
    description: 'Total current balance on revolving accounts',
    extractionPrompt: 'Extract the total current balance on all revolving accounts (credit cards and lines of credit). Extract only the numerical amount.',
    byteLOSMapping: 'borrower.creditReport.totalRevolvingBalance',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'crCreditUtilization',
    fieldName: 'Credit Utilization Ratio',
    description: 'Percentage of available credit being used',
    extractionPrompt: 'Extract the credit utilization ratio from the credit summary, typically shown as a percentage. This is the revolving balance divided by revolving credit limit. If not directly shown, it can be calculated. Extract as percentage (e.g., 35 for 35%).',
    byteLOSMapping: 'borrower.creditReport.utilizationRatio',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'utilizationPreferred',
        ruleName: 'Preferred Utilization Ratio',
        ruleType: 'range',
        description: 'Credit utilization under 30% is preferred',
        condition: 'less_than_or_equal',
        value: 30,
        errorMessage: 'Credit utilization exceeds 30%. High utilization may negatively impact credit score.',
        severity: 'info'
      },
      {
        id: 'utilizationHigh',
        ruleName: 'High Utilization Warning',
        ruleType: 'range',
        description: 'Very high utilization may indicate financial stress',
        condition: 'less_than',
        value: 90,
        errorMessage: 'Credit utilization is very high (over 90%). This may indicate financial stress.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'crInquiries',
    fieldName: 'Credit Inquiries (Last 6 Months)',
    description: 'Number of hard inquiries in past 6 months',
    extractionPrompt: 'Count the number of hard credit inquiries in the past 6 months from the inquiries section. Do not count soft inquiries. Extract only the numerical count.',
    byteLOSMapping: 'borrower.creditReport.inquiries6mo',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'excessiveInquiries',
        ruleName: 'Excessive Inquiries Warning',
        ruleType: 'range',
        description: 'Many recent inquiries may indicate credit seeking behavior',
        condition: 'less_than_or_equal',
        value: 6,
        errorMessage: 'More than 6 inquiries in past 6 months. May indicate credit seeking behavior.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'crOldestAccount',
    fieldName: 'Age of Oldest Account',
    description: 'How long oldest account has been open',
    extractionPrompt: 'Extract the age of the oldest credit account from the credit summary or calculate from the oldest account open date. This may be shown as years and months. Extract as text (e.g., "15 years 3 months").',
    byteLOSMapping: 'borrower.creditReport.oldestAccountAge',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'crAverageAccountAge',
    fieldName: 'Average Account Age',
    description: 'Average age of all credit accounts',
    extractionPrompt: 'Extract the average age of all accounts from the credit summary if shown. This may be presented as years and months. Extract as text.',
    byteLOSMapping: 'borrower.creditReport.avgAccountAge',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'crStudentLoans',
    fieldName: 'Student Loan Balance',
    description: 'Total outstanding student loan debt',
    extractionPrompt: 'If student loans are present on the credit report, extract the total balance of all student loan accounts. This may be federal and/or private student loans. Extract only numerical amount. If none, extract 0.',
    byteLOSMapping: 'borrower.studentLoanBalance',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'crAutoLoans',
    fieldName: 'Auto Loan Balance',
    description: 'Total outstanding auto loan debt',
    extractionPrompt: 'Extract the total balance of all auto loan accounts from the credit report. Extract only numerical amount. If none, extract 0.',
    byteLOSMapping: 'borrower.autoLoanBalance',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'crCreditProvider',
    fieldName: 'Credit Report Provider',
    description: 'Company that provided the credit report',
    extractionPrompt: 'Identify the credit reporting company or service that generated this report. Common providers include Experian, Equifax, TransUnion, or services like CoreLogic, Credit Plus, Factual Data. Extract the provider name from the report header or footer.',
    byteLOSMapping: 'borrower.creditReport.provider',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'crReportType',
    fieldName: 'Report Type',
    description: 'Type of credit report (tri-merge, single bureau, etc.)',
    extractionPrompt: 'Identify the type of credit report. Common types: "Tri-Merge" (combines all 3 bureaus), "Single Bureau", "Soft Pull", "Residential Mortgage Credit Report (RMCR)". Extract the report type as labeled.',
    byteLOSMapping: 'borrower.creditReport.reportType',
    dataType: 'string',
    required: false,
    rules: []
  }
];
