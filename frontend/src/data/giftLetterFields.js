// Gift Letter field configuration with extraction prompts
export const giftLetterFields = [
  {
    id: 'glDonorName',
    fieldName: 'Donor Name (Gift Giver)',
    description: 'Full legal name of person providing gift funds',
    extractionPrompt: 'Extract the complete name of the gift donor (person giving the gift funds) from the gift letter. This is typically in the opening section or stated as "I/We, [NAME]" or "Donor:". Extract the full legal name(s) exactly as written.',
    byteLOSMapping: 'transaction.giftFunds.donorName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'donorNamePresent',
        ruleName: 'Donor Name Required',
        ruleType: 'format',
        description: 'Donor name must be clearly stated',
        condition: 'not_empty',
        errorMessage: 'Gift donor name is missing from gift letter',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'glDonorRelationship',
    fieldName: 'Donor Relationship to Borrower',
    description: 'How donor is related to borrower',
    extractionPrompt: 'Extract the relationship between the gift donor and the borrower. Common relationships include "Parent", "Grandparent", "Child", "Sibling", "Spouse", "Fiancé/Fiancée", "Aunt/Uncle", "Domestic Partner". This must be explicitly stated in the gift letter. Extract exactly as stated.',
    byteLOSMapping: 'transaction.giftFunds.donorRelationship',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'acceptableRelationship',
        ruleName: 'Acceptable Donor Relationship',
        ruleType: 'comparison',
        description: 'Donor must be acceptable family relation or specified party',
        condition: 'in_list',
        validValues: ['Parent', 'Grandparent', 'Child', 'Sibling', 'Spouse', 'Fiancé', 'Fiancée', 'Aunt', 'Uncle', 'Niece', 'Nephew', 'Cousin', 'Domestic Partner', 'Employer', 'Union', 'Municipality', 'Non-Profit'],
        errorMessage: 'Donor relationship may not be acceptable. Most programs require family members or specific entities.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'glRecipientName',
    fieldName: 'Recipient Name (Borrower)',
    description: 'Name of borrower receiving gift funds',
    extractionPrompt: 'Extract the name of the gift recipient (borrower) from the gift letter. This may be stated as "to [NAME]" or "Recipient:". Extract the complete name exactly as written.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'recipientMatchesBorrower',
        ruleName: 'Recipient Name Match',
        ruleType: 'comparison',
        description: 'Recipient must match borrower on loan application',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Gift recipient name does not match borrower name on loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'glGiftAmount',
    fieldName: 'Gift Amount',
    description: 'Dollar amount of the gift',
    extractionPrompt: 'Extract the gift amount from the letter. This should be clearly stated as a dollar amount, typically written both numerically and spelled out (e.g., "$25,000" and "twenty-five thousand dollars"). Extract the numerical amount without currency symbols or commas.',
    byteLOSMapping: 'transaction.giftFunds.amount',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'giftAmountPositive',
        ruleName: 'Valid Gift Amount',
        ruleType: 'range',
        description: 'Gift amount must be positive',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Gift amount must be greater than zero',
        severity: 'critical'
      },
      {
        id: 'giftAmountReasonable',
        ruleName: 'Reasonable Gift Amount',
        ruleType: 'calculation',
        description: 'Gift amount should be reasonable relative to purchase price',
        condition: 'less_than_or_equal',
        compareField: 'property.purchasePrice',
        errorMessage: 'Gift amount exceeds purchase price. Verify amount is correct.',
        severity: 'warning'
      },
      {
        id: 'giftDocumentation',
        ruleName: 'Large Gift Documentation',
        ruleType: 'range',
        description: 'Large gifts require extensive documentation',
        condition: 'greater_than',
        value: 50000,
        errorMessage: 'Gift exceeds $50,000. Ensure complete paper trail and donor financial capacity documentation.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'glPropertyAddress',
    fieldName: 'Property Address',
    description: 'Address of property being purchased',
    extractionPrompt: 'Extract the address of the property for which the gift is being provided. The gift letter should reference the specific property. Include complete address with city, state, and ZIP code. If not stated, extract "Not specified".',
    byteLOSMapping: 'property.address.fullAddress',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'propertyAddressMatch',
        ruleName: 'Property Address Match',
        ruleType: 'comparison',
        description: 'Property address should match loan application',
        condition: 'matches',
        compareField: 'property.address.fullAddress',
        errorMessage: 'Property address on gift letter does not match loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'glLetterDate',
    fieldName: 'Letter Date',
    description: 'Date the gift letter was signed',
    extractionPrompt: 'Extract the date of the gift letter, typically shown at the top of the letter or near the signature. Format as MM/DD/YYYY.',
    byteLOSMapping: 'transaction.giftFunds.letterDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'letterDateRecent',
        ruleName: 'Gift Letter Recency',
        ruleType: 'date_range',
        description: 'Gift letter should be recent and dated near loan application',
        condition: 'within_days',
        value: 90,
        compareField: 'applicationDate',
        errorMessage: 'Gift letter is dated more than 90 days from loan application',
        severity: 'warning'
      },
      {
        id: 'letterDateNotFuture',
        ruleName: 'Letter Date Logic',
        ruleType: 'date_comparison',
        description: 'Letter date cannot be in the future',
        condition: 'before_or_equal',
        compareField: 'today',
        errorMessage: 'Gift letter date cannot be in the future',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'glNoRepaymentStatement',
    fieldName: 'No Repayment Required Statement',
    description: 'Explicit statement that gift does not require repayment',
    extractionPrompt: 'Check for an explicit statement that the gift does not need to be repaid. Look for language such as "no repayment is expected or required", "this is a bona fide gift", "there is no obligation to repay", etc. Extract "Yes - Statement Present" if clear no-repayment language exists, or "No - Statement Missing" if not found.',
    byteLOSMapping: 'transaction.giftFunds.noRepaymentConfirmed',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'repaymentStatementRequired',
        ruleName: 'No Repayment Statement Required',
        ruleType: 'comparison',
        description: 'Gift letter must explicitly state no repayment is required',
        condition: 'contains',
        value: 'Yes',
        errorMessage: 'Gift letter must explicitly state that no repayment is expected or required',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'glFundsSource',
    fieldName: 'Source of Gift Funds',
    description: 'Where donor is obtaining the gift funds',
    extractionPrompt: 'Extract information about the source of the gift funds if stated in the letter. Common sources include "savings account", "checking account", "investment account", "sale of assets", etc. If not specified, extract "Not specified".',
    byteLOSMapping: 'transaction.giftFunds.fundsSource',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'fundsSourceDocumentation',
        ruleName: 'Funds Source Documentation',
        ruleType: 'conditional',
        description: 'Source of gift funds must be documented with bank statements',
        condition: 'requires_documentation',
        errorMessage: 'Donor must provide bank statements or asset documentation showing source of gift funds',
        severity: 'info'
      }
    ]
  },
  {
    id: 'glFundsTransferred',
    fieldName: 'Funds Transfer Status',
    description: 'Whether funds have been transferred or will be transferred',
    extractionPrompt: 'Determine if the gift funds have already been transferred or will be transferred. Look for language like "have been deposited", "will be transferred", "hereby provided", "to be deposited". Extract "Already Transferred", "To Be Transferred", or "Not Specified".',
    byteLOSMapping: 'transaction.giftFunds.transferStatus',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'transferVerification',
        ruleName: 'Transfer Verification Required',
        ruleType: 'conditional',
        description: 'If funds already transferred, deposit must be verified in borrower bank statements',
        condition: 'if_equals',
        compareValue: 'Already Transferred',
        errorMessage: 'Gift funds transfer must be verified with bank statements showing deposit',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'glDonorAddress',
    fieldName: 'Donor Address',
    description: 'Address of the gift donor',
    extractionPrompt: 'Extract the complete address of the gift donor if provided in the letter. This is often in the signature block or letterhead. Include street, city, state, and ZIP code. If not provided, extract "Not provided".',
    byteLOSMapping: 'transaction.giftFunds.donorAddress',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'glDonorPhone',
    fieldName: 'Donor Phone Number',
    description: 'Contact phone number for donor',
    extractionPrompt: 'Extract the donor\'s phone number if provided in the letter. Include area code. If not provided, extract "Not provided".',
    byteLOSMapping: 'transaction.giftFunds.donorPhone',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'glDonorSignature',
    fieldName: 'Donor Signature Present',
    description: 'Whether donor has signed the letter',
    extractionPrompt: 'Check if the gift letter includes the donor\'s signature. Look for a signature line at the bottom of the letter. Extract "Yes - Signed", "No - Not Signed", or "Electronic Signature" if electronically signed.',
    byteLOSMapping: 'transaction.giftFunds.donorSigned',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'signatureRequired',
        ruleName: 'Donor Signature Required',
        ruleType: 'comparison',
        description: 'Donor must sign the gift letter',
        condition: 'contains_any',
        validValues: ['Yes - Signed', 'Electronic Signature'],
        errorMessage: 'Gift letter must be signed by the donor',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'glPurposeStatement',
    fieldName: 'Gift Purpose Statement',
    description: 'Statement of what gift will be used for',
    extractionPrompt: 'Extract the statement describing the purpose of the gift. This typically says the gift is for "down payment", "closing costs", "down payment and closing costs", or "purchase of property". Extract the purpose statement exactly as written.',
    byteLOSMapping: 'transaction.giftFunds.purpose',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'acceptablePurpose',
        ruleName: 'Acceptable Gift Purpose',
        ruleType: 'comparison',
        description: 'Gift purpose should be for down payment and/or closing costs',
        condition: 'contains_any',
        validValues: ['down payment', 'closing costs', 'purchase'],
        errorMessage: 'Gift purpose should specify down payment and/or closing costs',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'glDonorFinancialCapacity',
    fieldName: 'Donor Financial Capacity Statement',
    description: 'Whether donor affirms financial ability to provide gift',
    extractionPrompt: 'Check if the letter includes a statement about the donor\'s financial capacity or ability to provide the gift. Look for language like "I have sufficient funds", "I am financially able", or similar affirmation. Extract "Yes - Affirmed" if present, "No - Not Stated" if absent.',
    byteLOSMapping: 'transaction.giftFunds.capacityAffirmed',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'capacityDocumentation',
        ruleName: 'Donor Capacity Documentation',
        ruleType: 'conditional',
        description: 'Donor financial capacity must be verified with asset documentation',
        condition: 'requires_verification',
        errorMessage: 'Donor must provide bank statements or asset documentation proving financial capacity to provide gift',
        severity: 'info'
      }
    ]
  },
  {
    id: 'glNotLoan',
    fieldName: 'Explicit Statement Gift Is Not a Loan',
    description: 'Statement confirming gift is not a loan',
    extractionPrompt: 'Check for explicit language stating that the gift is not a loan and does not create a debt. Look for phrases like "This is not a loan", "This is a gift and not a loan", etc. Extract "Yes - Stated" if present, "No - Not Stated" if absent.',
    byteLOSMapping: 'transaction.giftFunds.notLoanConfirmed',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'notLoanStatement',
        ruleName: 'Not a Loan Statement',
        ruleType: 'comparison',
        description: 'Letter should explicitly state gift is not a loan',
        condition: 'equals',
        value: 'Yes - Stated',
        errorMessage: 'Gift letter should explicitly state that the gift is not a loan',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'glEligibleUnderProgram',
    fieldName: 'Gift Eligibility Assessment',
    description: 'Assessment of whether gift meets program requirements',
    extractionPrompt: 'Based on the donor relationship and gift structure, assess whether the gift appears to meet typical loan program requirements. Extract "Eligible - Family Member Gift", "Eligible - Approved Entity", "May Require Review", or "Not Eligible". This is a preliminary assessment.',
    byteLOSMapping: 'transaction.giftFunds.eligibilityStatus',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'programEligibility',
        ruleName: 'Program Eligibility Check',
        ruleType: 'comparison',
        description: 'Gift must meet loan program eligibility requirements',
        condition: 'not_equals',
        value: 'Not Eligible',
        errorMessage: 'Gift may not meet program requirements. Verify gift is from acceptable source per program guidelines.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'glDepositDate',
    fieldName: 'Deposit Date (if transferred)',
    description: 'Date funds were deposited to borrower account',
    extractionPrompt: 'If the letter states the funds have been transferred, extract the date they were deposited or transferred. Format as MM/DD/YYYY. If not transferred yet or date not stated, leave blank.',
    byteLOSMapping: 'transaction.giftFunds.depositDate',
    dataType: 'date',
    required: false,
    rules: [
      {
        id: 'depositDateVerification',
        ruleName: 'Deposit Date Verification',
        ruleType: 'conditional',
        description: 'If deposit date provided, must match bank statement',
        condition: 'if_not_empty',
        errorMessage: 'Verify deposit date matches borrower bank statement',
        severity: 'info'
      }
    ]
  },
  {
    id: 'glBankAccountInfo',
    fieldName: 'Donor Bank Account Information',
    description: 'Bank account from which gift funds are being transferred',
    extractionPrompt: 'Extract any bank account information provided about where the gift funds are coming from. This might include bank name, partial account number, or account type. Extract what is provided or "Not specified" if not included.',
    byteLOSMapping: 'transaction.giftFunds.donorBankInfo',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'glAdditionalDonors',
    fieldName: 'Additional Donors',
    description: 'Whether there are additional donors contributing to gift',
    extractionPrompt: 'Check if the gift letter mentions additional donors or co-signers providing gift funds jointly. Look for multiple names or phrases like "we" or "jointly". Extract names of additional donors or "None - Single Donor".',
    byteLOSMapping: 'transaction.giftFunds.additionalDonors',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'glSpecialConditions',
    fieldName: 'Special Conditions or Notes',
    description: 'Any special conditions, notes, or unusual provisions',
    extractionPrompt: 'Extract any special conditions, notes, or unusual provisions mentioned in the gift letter. This might include timing conditions, specific usage restrictions, or other relevant details. If none, extract "None".',
    byteLOSMapping: 'transaction.giftFunds.specialConditions',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'noUnusualConditions',
        ruleName: 'No Unusual Conditions',
        ruleType: 'comparison',
        description: 'Gift should not have conditions that make it like a loan',
        condition: 'not_contains_any',
        invalidValues: ['repay if', 'repayment when', 'must return', 'loan until', 'conditional'],
        errorMessage: 'Gift letter contains conditions that may make it appear as a loan rather than true gift',
        severity: 'critical'
      }
    ]
  }
];
