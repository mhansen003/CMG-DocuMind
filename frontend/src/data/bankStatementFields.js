// Complete Bank Statement field configuration with extraction prompts
export const bankStatementFields = [
  {
    id: 'accountHolderName',
    fieldName: 'Account Holder Name',
    description: 'Name of the primary account holder',
    extractionPrompt: 'Extract the account holder name from the bank statement. This is typically shown at the top of the statement in the account information section or address block. Include the full name exactly as shown.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'nameMatch',
        ruleName: 'Borrower Name Match',
        ruleType: 'comparison',
        description: 'Account holder must match borrower name',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Bank account holder does not match borrower name',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'bankName',
    fieldName: 'Bank Name',
    description: 'Name of the financial institution',
    extractionPrompt: 'Extract the bank name from the statement header. This is usually prominently displayed at the top of the first page with the bank logo. Include the full legal name (e.g., "Wells Fargo Bank, N.A." or "Bank of America").',
    byteLOSMapping: 'borrower.assets.bankAccounts[].bankName',
    dataType: 'string',
    required: true,
    rules: []
  },
  {
    id: 'accountNumber',
    fieldName: 'Account Number',
    description: 'Bank account number',
    extractionPrompt: 'Extract the full account number from the statement. This is typically shown in the account information section, often partially masked (e.g., XXXX1234). Extract the visible digits. If fully visible, extract the complete number.',
    byteLOSMapping: 'borrower.assets.bankAccounts[].accountNumber',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'accountNumberFormat',
        ruleName: 'Valid Account Number',
        ruleType: 'format',
        description: 'Account number should contain digits',
        condition: 'contains_digits',
        errorMessage: 'Invalid account number format',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'accountType',
    fieldName: 'Account Type',
    description: 'Type of bank account (checking, savings, etc.)',
    extractionPrompt: 'Identify the account type from the statement. Look for labels like "Checking Account", "Savings Account", "Money Market Account", etc. Extract just the type (e.g., "Checking", "Savings", "Money Market").',
    byteLOSMapping: 'borrower.assets.bankAccounts[].accountType',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'validAccountType',
        ruleName: 'Recognized Account Type',
        ruleType: 'enum',
        description: 'Must be a valid account type',
        validValues: ['Checking', 'Savings', 'Money Market', 'Certificate of Deposit', 'Other'],
        errorMessage: 'Unrecognized account type',
        severity: 'info'
      }
    ]
  },
  {
    id: 'statementPeriodStart',
    fieldName: 'Statement Period Start Date',
    description: 'First day of statement period',
    extractionPrompt: 'Extract the statement period start date. This is usually shown near the top of the statement as "Statement Period:", "For the period:", or "From [date]". Format as MM/DD/YYYY.',
    byteLOSMapping: null,
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'statementRecency',
        ruleName: 'Statement Recency',
        ruleType: 'date_range',
        description: 'Statement must be from within last 90 days',
        condition: 'within_days',
        value: 90,
        compareField: 'applicationDate',
        errorMessage: 'Bank statement is too old (must be within 90 days)',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'statementPeriodEnd',
    fieldName: 'Statement Period End Date',
    description: 'Last day of statement period',
    extractionPrompt: 'Extract the statement period end date. This is shown with the start date as "To [date]" or "Through [date]". Format as MM/DD/YYYY.',
    byteLOSMapping: null,
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'periodLogic',
        ruleName: 'Period Logic Check',
        ruleType: 'date_comparison',
        description: 'End date must be after start date',
        condition: 'after',
        compareField: 'statementPeriodStart',
        errorMessage: 'Statement period end must be after start date',
        severity: 'critical'
      },
      {
        id: 'typicalPeriod',
        ruleName: 'Typical Statement Period',
        ruleType: 'date_range',
        description: 'Statement period typically 28-31 days',
        condition: 'days_between',
        minDays: 28,
        maxDays: 35,
        compareField: 'statementPeriodStart',
        errorMessage: 'Unusual statement period length',
        severity: 'info'
      }
    ]
  },
  {
    id: 'beginningBalance',
    fieldName: 'Beginning Balance',
    description: 'Account balance at start of statement period',
    extractionPrompt: 'Extract the beginning balance from the statement. Look for "Beginning Balance", "Opening Balance", or "Previous Balance" typically shown in a summary section. Extract numerical amount only, include negative sign if overdrawn.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'negativeBalance',
        ruleName: 'Overdrawn Account Check',
        ruleType: 'range',
        description: 'Beginning balance should not be negative',
        condition: 'greater_than_or_equal',
        value: 0,
        errorMessage: 'Account was overdrawn at beginning of period',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'endingBalance',
    fieldName: 'Ending Balance',
    description: 'Account balance at end of statement period',
    extractionPrompt: 'Extract the ending balance from the statement. Look for "Ending Balance", "Closing Balance", or "Current Balance" in the summary section. This is typically the most prominent balance figure. Extract numerical amount only.',
    byteLOSMapping: 'borrower.assets.bankAccounts[].currentBalance',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'balanceMatch',
        ruleName: 'Balance Verification',
        ruleType: 'comparison',
        description: 'Ending balance should match stated account balance',
        condition: 'within_percentage',
        value: 5,
        compareField: 'borrower.assets.bankAccounts[].currentBalance',
        errorMessage: 'Ending balance does not match stated balance on application',
        severity: 'critical'
      },
      {
        id: 'sufficientFunds',
        ruleName: 'Sufficient Funds Check',
        ruleType: 'range',
        description: 'Ending balance should be positive',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Account is overdrawn at end of period',
        severity: 'critical'
      },
      {
        id: 'balanceConsistency',
        ruleName: 'Balance Calculation',
        ruleType: 'calculation',
        description: 'Ending balance should equal beginning balance plus deposits minus withdrawals',
        condition: 'calculated_balance',
        errorMessage: 'Balance calculation does not reconcile',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'totalDeposits',
    fieldName: 'Total Deposits',
    description: 'Sum of all deposits during statement period',
    extractionPrompt: 'Extract the total deposits amount from the statement summary. Look for "Total Deposits", "Deposits and Credits", or similar label. This is the sum of all money added to the account. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'reasonableDeposits',
        ruleName: 'Reasonable Deposit Activity',
        ruleType: 'range',
        description: 'Total deposits should be greater than or equal to zero',
        condition: 'greater_than_or_equal',
        value: 0,
        errorMessage: 'Total deposits cannot be negative',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'totalWithdrawals',
    fieldName: 'Total Withdrawals',
    description: 'Sum of all withdrawals during statement period',
    extractionPrompt: 'Extract the total withdrawals amount from the statement summary. Look for "Total Withdrawals", "Checks and Debits", "Total Debits", or similar. This is the sum of all money removed from the account. Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'reasonableWithdrawals',
        ruleName: 'Reasonable Withdrawal Activity',
        ruleType: 'range',
        description: 'Total withdrawals should be greater than or equal to zero',
        condition: 'greater_than_or_equal',
        value: 0,
        errorMessage: 'Total withdrawals cannot be negative',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'averageDailyBalance',
    fieldName: 'Average Daily Balance',
    description: 'Average balance maintained during period',
    extractionPrompt: 'Extract the average daily balance if shown on the statement. This is typically displayed in the account summary section labeled "Average Daily Balance" or "Avg Balance". Extract numerical amount only.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'averageReasonability',
        ruleName: 'Average Balance Reasonability',
        ruleType: 'range',
        description: 'Average balance should be between beginning and ending balances or reasonable given deposits/withdrawals',
        condition: 'reasonable_average',
        errorMessage: 'Average daily balance seems inconsistent',
        severity: 'info'
      }
    ]
  },
  {
    id: 'numberOfDeposits',
    fieldName: 'Number of Deposits',
    description: 'Count of deposit transactions',
    extractionPrompt: 'Count or extract the total number of deposit transactions during the statement period. This may be shown in the summary or you may need to count individual deposit entries in the transaction list.',
    byteLOSMapping: null,
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'regularDepositActivity',
        ruleName: 'Regular Deposit Pattern',
        ruleType: 'range',
        description: 'Should show regular deposit activity',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'No deposit activity detected',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'numberOfWithdrawals',
    fieldName: 'Number of Withdrawals',
    description: 'Count of withdrawal transactions',
    extractionPrompt: 'Count or extract the total number of withdrawal transactions during the statement period. This includes checks, debit card transactions, ATM withdrawals, and electronic debits.',
    byteLOSMapping: null,
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'nsfFees',
    fieldName: 'NSF/Overdraft Fees',
    description: 'Total non-sufficient funds or overdraft fees charged',
    extractionPrompt: 'Look through the statement for any NSF fees, overdraft fees, or insufficient funds charges. Sum all such fees. If none, extract 0. These are typically labeled "NSF Fee", "Overdraft Fee", "Insufficient Funds", or similar.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'nsfFeesConcern',
        ruleName: 'NSF Fees Flag',
        ruleType: 'range',
        description: 'NSF fees indicate cash flow problems',
        condition: 'equals',
        value: 0,
        errorMessage: 'NSF or overdraft fees detected - potential cash flow concern',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'largeDepositsCount',
    fieldName: 'Large Deposits Count',
    description: 'Number of deposits over $1,000',
    extractionPrompt: 'Count the number of individual deposits that exceed $1,000 during the statement period. Review the transaction list and count deposits above this threshold.',
    byteLOSMapping: null,
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'largeDepositPattern',
        ruleName: 'Large Deposit Pattern Analysis',
        ruleType: 'pattern',
        description: 'Large deposits may require source documentation',
        condition: 'requires_review_if_greater_than',
        value: 3,
        errorMessage: 'Multiple large deposits detected - may require additional documentation',
        severity: 'info'
      }
    ]
  },
  {
    id: 'returnedItemsFees',
    fieldName: 'Returned Items/Check Fees',
    description: 'Fees for returned checks or items',
    extractionPrompt: 'Look for any returned check fees, returned item fees, or bounced check charges. Sum all such fees. If none, extract 0.',
    byteLOSMapping: null,
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'returnedItemsConcern',
        ruleName: 'Returned Items Flag',
        ruleType: 'range',
        description: 'Returned items indicate financial issues',
        condition: 'equals',
        value: 0,
        errorMessage: 'Returned item fees detected - potential financial concern',
        severity: 'warning'
      }
    ]
  }
];
