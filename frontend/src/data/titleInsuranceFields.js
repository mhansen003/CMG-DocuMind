// Title Insurance Document field configuration with extraction prompts
export const titleInsuranceFields = [
  {
    id: 'tiTitleCompany',
    fieldName: 'Title Company Name',
    description: 'Name of the title insurance company',
    extractionPrompt: 'Extract the name of the title insurance company issuing the policy or commitment. This is typically displayed prominently at the top of the document. Include the full legal name of the title company (e.g., "First American Title Insurance Company", "Chicago Title Insurance Company").',
    byteLOSMapping: 'property.title.companyName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'titleCompanyPresent',
        ruleName: 'Title Company Required',
        ruleType: 'format',
        description: 'Title company name must be present',
        condition: 'not_empty',
        errorMessage: 'Title company name is missing',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiDocumentType',
    fieldName: 'Document Type',
    description: 'Type of title document (commitment, policy, etc.)',
    extractionPrompt: 'Identify the type of title document. Common types include "Title Commitment", "Preliminary Title Report", "Title Insurance Policy", "Title Binder", or "Pro Forma Policy". Extract the document type exactly as labeled.',
    byteLOSMapping: 'property.title.documentType',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'appropriateDocType',
        ruleName: 'Appropriate Document Type',
        ruleType: 'comparison',
        description: 'Document type should be appropriate for transaction stage',
        condition: 'in_list',
        validValues: ['Title Commitment', 'Preliminary Title Report', 'Title Policy', 'Title Binder', 'Pro Forma'],
        errorMessage: 'Document type may not be appropriate for current transaction stage',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'tiCommitmentNumber',
    fieldName: 'Commitment/Policy Number',
    description: 'Title commitment or policy number',
    extractionPrompt: 'Extract the title commitment number, policy number, or order number from the document. This is typically labeled "Commitment Number", "Policy Number", "File Number", or "Order Number" near the top of the document. Extract exactly as shown.',
    byteLOSMapping: 'property.title.policyNumber',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'policyNumberFormat',
        ruleName: 'Valid Policy Number',
        ruleType: 'format',
        description: 'Policy/commitment number must be present',
        condition: 'not_empty',
        errorMessage: 'Title commitment/policy number is missing',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiEffectiveDate',
    fieldName: 'Effective Date',
    description: 'Effective date of the title search/commitment',
    extractionPrompt: 'Extract the effective date of the title commitment or search. This is typically labeled "Effective Date", "Date of Title Search", or "Commitment Date". This represents the date through which the title has been searched. Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.title.effectiveDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'effectiveDateRecent',
        ruleName: 'Title Search Recency',
        ruleType: 'date_range',
        description: 'Title search should be recent (within 90 days of closing)',
        condition: 'within_days',
        value: 90,
        compareField: 'loan.estimatedClosingDate',
        errorMessage: 'Title search effective date is more than 90 days before closing. Updated search may be required.',
        severity: 'warning'
      },
      {
        id: 'effectiveDateNotFuture',
        ruleName: 'Effective Date Logic',
        ruleType: 'date_comparison',
        description: 'Effective date must not be in the future',
        condition: 'before_or_equal',
        compareField: 'today',
        errorMessage: 'Title effective date cannot be in the future',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiPropertyAddress',
    fieldName: 'Property Address',
    description: 'Address of the property covered by title insurance',
    extractionPrompt: 'Extract the complete property address from the title document, typically in a section labeled "Property", "Premises", or "Land". Include street address, city, state, and ZIP code.',
    byteLOSMapping: 'property.address.fullAddress',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'propertyAddressMatch',
        ruleName: 'Property Address Match',
        ruleType: 'comparison',
        description: 'Property address must match subject property on loan',
        condition: 'matches',
        compareField: 'property.address.fullAddress',
        errorMessage: 'Property address on title document does not match loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiLegalDescription',
    fieldName: 'Legal Description',
    description: 'Legal description of the property',
    extractionPrompt: 'Extract the complete legal description of the property from the title document. This typically includes lot number, block number, subdivision name, plat references, or metes and bounds description. This may be several lines of text. Extract the complete legal description or indicate "See Schedule A/Exhibit" if referenced separately.',
    byteLOSMapping: 'property.legalDescription',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'legalDescriptionPresent',
        ruleName: 'Legal Description Required',
        ruleType: 'format',
        description: 'Legal description must be present',
        condition: 'not_empty',
        errorMessage: 'Legal description is missing or incomplete',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiVestingOwner',
    fieldName: 'Current Owner/Vesting',
    description: 'Current owner(s) of record',
    extractionPrompt: 'Extract the name of the current owner(s) of the property as shown on title, typically in Schedule A or in a "Current Vesting" section. This shows who currently holds title to the property. Include all names exactly as they appear on title.',
    byteLOSMapping: 'property.currentOwner',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'currentOwnerCheck',
        ruleName: 'Current Owner Verification',
        ruleType: 'comparison',
        description: 'Current owner should match seller on purchase agreement',
        condition: 'matches',
        compareField: 'property.seller.name',
        errorMessage: 'Current owner on title does not match seller on purchase agreement',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiProposedInsured',
    fieldName: 'Proposed Insured/Buyer',
    description: 'Proposed insured party (buyer)',
    extractionPrompt: 'Extract the name of the proposed insured party or buyer who will take title. This is typically in Schedule A or B showing who will be the new owner. Extract all names as they will appear on the new deed.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'proposedInsuredMatch',
        ruleName: 'Proposed Insured Match',
        ruleType: 'comparison',
        description: 'Proposed insured must match borrower(s) on loan application',
        condition: 'contains',
        compareField: 'borrower.fullName',
        errorMessage: 'Proposed insured on title does not match borrower on loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiPolicyAmount',
    fieldName: 'Policy Amount',
    description: 'Amount of title insurance coverage',
    extractionPrompt: 'Extract the title insurance policy amount or coverage amount from Schedule A or the policy declarations. This is typically the purchase price or loan amount. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.title.coverageAmount',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'policyAmountAdequate',
        ruleName: 'Adequate Coverage Amount',
        ruleType: 'comparison',
        description: 'Policy amount should equal or exceed loan amount',
        condition: 'greater_than_or_equal',
        compareField: 'loan.amount',
        errorMessage: 'Title insurance coverage is less than loan amount',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiExceptions',
    fieldName: 'Schedule B Exceptions',
    description: 'List of exceptions to title coverage',
    extractionPrompt: 'Extract a summary of the Schedule B exceptions - items that are not covered by the title insurance policy. Common exceptions include easements, covenants, conditions, restrictions (CC&Rs), liens, encumbrances. List the major exceptions or indicate "See Schedule B" if extensive. Note if any appear problematic.',
    byteLOSMapping: 'property.title.exceptions',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'reviewExceptions',
        ruleName: 'Review Required Exceptions',
        ruleType: 'conditional',
        description: 'All exceptions must be reviewed for acceptability',
        condition: 'requires_review',
        errorMessage: 'Schedule B exceptions must be reviewed to ensure they do not adversely affect the property',
        severity: 'info'
      }
    ]
  },
  {
    id: 'tiRequirements',
    fieldName: 'Schedule B Requirements',
    description: 'Requirements that must be met to issue policy',
    extractionPrompt: 'Extract a summary of Schedule B requirements - conditions that must be satisfied before the title policy can be issued. Common requirements include paying off existing liens, obtaining releases, recording documents, etc. List the major requirements or count of items.',
    byteLOSMapping: 'property.title.requirements',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'requirementsFlag',
        ruleName: 'Requirements Must Be Cleared',
        ruleType: 'conditional',
        description: 'All Schedule B requirements must be satisfied before closing',
        condition: 'if_not_empty',
        errorMessage: 'Schedule B requirements must be satisfied before policy can be issued',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'tiLienCount',
    fieldName: 'Number of Liens',
    description: 'Count of liens or encumbrances on property',
    extractionPrompt: 'Count the number of liens or monetary encumbrances shown in the title report. This includes mortgages, deeds of trust, tax liens, judgment liens, mechanic liens, etc. Extract the numerical count. If none, extract 0.',
    byteLOSMapping: 'property.title.lienCount',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'existingLiens',
        ruleName: 'Existing Liens Review',
        ruleType: 'range',
        description: 'Existing liens must be addressed at closing',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Property has existing liens. These must be paid off or subordinated at closing.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'tiMortgageLien',
    fieldName: 'Existing Mortgage/Deed of Trust',
    description: 'Details of existing mortgage or deed of trust',
    extractionPrompt: 'If there is an existing mortgage or deed of trust on the property, extract the details including lender name and amount if shown. This would be listed in Schedule B or in the liens section. If none, indicate "None".',
    byteLOSMapping: 'property.existingMortgage',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'existingMortgagePayoff',
        ruleName: 'Existing Mortgage Payoff',
        ruleType: 'conditional',
        description: 'Existing mortgage must be paid off at closing unless subordinating',
        condition: 'if_not_none',
        errorMessage: 'Existing mortgage must be paid off at closing or subordination agreement obtained',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'tiTaxLiens',
    fieldName: 'Tax Liens',
    description: 'Property tax liens or delinquent taxes',
    extractionPrompt: 'Check if there are any property tax liens or delinquent taxes shown in the title report. Look in Schedule B exceptions or liens section for "tax liens", "delinquent taxes", or "unpaid taxes". Extract details if present, or "None" if taxes are current.',
    byteLOSMapping: 'property.title.taxLiens',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'taxLienFlag',
        ruleName: 'Tax Lien Must Be Resolved',
        ruleType: 'comparison',
        description: 'Tax liens must be paid before closing',
        condition: 'not_equals',
        value: 'None',
        errorMessage: 'Property has tax liens. These must be paid and released before or at closing.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiJudgmentLiens',
    fieldName: 'Judgment Liens',
    description: 'Judgment liens against property or owner',
    extractionPrompt: 'Check for any judgment liens against the property or property owner. Look in the title report for "judgment", "abstract of judgment", or "lien" related to court judgments. Extract details if present, or "None" if no judgments.',
    byteLOSMapping: 'property.title.judgmentLiens',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'judgmentLienFlag',
        ruleName: 'Judgment Lien Resolution',
        ruleType: 'comparison',
        description: 'Judgment liens must be resolved',
        condition: 'not_equals',
        value: 'None',
        errorMessage: 'Judgment liens exist. These must be paid, released, or bonded before closing.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiEasements',
    fieldName: 'Easements',
    description: 'Easements affecting the property',
    extractionPrompt: 'Check for easements affecting the property in Schedule B. Common easements include utility easements, access easements, drainage easements, or right-of-way easements. Summarize the types of easements present or indicate "Standard utility easements" if only typical easements are shown.',
    byteLOSMapping: 'property.title.easements',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'easementReview',
        ruleName: 'Easement Impact Review',
        ruleType: 'conditional',
        description: 'Easements should be reviewed for impact on property use',
        condition: 'requires_review',
        errorMessage: 'Easements should be reviewed to ensure they do not negatively impact property use or value',
        severity: 'info'
      }
    ]
  },
  {
    id: 'tiCCRs',
    fieldName: 'Covenants, Conditions & Restrictions',
    description: 'CC&Rs or deed restrictions',
    extractionPrompt: 'Check if there are Covenants, Conditions, and Restrictions (CC&Rs) or deed restrictions listed. Look for references to "CC&Rs", "Declaration of Covenants", "Restrictions", or "Homeowners Association". Extract the recording information or summarize, or indicate "None" if not applicable.',
    byteLOSMapping: 'property.title.ccrs',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'tiHOA',
    fieldName: 'Homeowners Association',
    description: 'HOA or property association information',
    extractionPrompt: 'Check if the property is subject to a Homeowners Association (HOA), Property Owners Association (POA), or Condominium Association. This may be mentioned in Schedule B or in CC&Rs. Extract the association name if present, or "None" if not applicable.',
    byteLOSMapping: 'property.hoaName',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'hoaDocumentation',
        ruleName: 'HOA Documentation Required',
        ruleType: 'conditional',
        description: 'If HOA exists, additional HOA documentation required',
        condition: 'if_not_none',
        errorMessage: 'Property is subject to HOA. HOA documentation, budget, and dues information required.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'tiSurveyException',
    fieldName: 'Survey Exception',
    description: 'Whether policy has survey exception',
    extractionPrompt: 'Check Schedule B for a survey exception - typically stated as "matters that would be disclosed by a current survey" or "survey exception". Extract "Yes" if survey exception is present, "No" if it has been removed or survey is not required.',
    byteLOSMapping: 'property.title.surveyException',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'surveyRecommended',
        ruleName: 'Survey Recommendation',
        ruleType: 'comparison',
        description: 'Survey may be required to remove exception',
        condition: 'equals',
        value: 'Yes',
        errorMessage: 'Survey exception is present. Lender may require current survey to remove this exception.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'tiAccessRights',
    fieldName: 'Legal Access Rights',
    description: 'Verification of legal access to property',
    extractionPrompt: 'Check if the title report confirms legal access to the property. Look for statements about "legal access", "access rights", or "access via public road". Extract confirmation statement or any issues noted regarding access.',
    byteLOSMapping: 'property.title.legalAccess',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'legalAccessRequired',
        ruleName: 'Legal Access Required',
        ruleType: 'conditional',
        description: 'Property must have legal access',
        condition: 'must_confirm_access',
        errorMessage: 'Legal access to property must be confirmed. Landlocked properties are generally not financeable.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'tiVestingType',
    fieldName: 'Vesting Type',
    description: 'How title will be held (joint tenants, tenants in common, etc.)',
    extractionPrompt: 'Extract how title will be vested or held, typically shown in Schedule A or the proposed vesting section. Common types include "joint tenants", "tenants in common", "community property", "sole owner", "trust", etc. Extract exactly as stated.',
    byteLOSMapping: 'property.title.vestingType',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'tiTitleOfficer',
    fieldName: 'Title Officer Name',
    description: 'Name of title officer handling transaction',
    extractionPrompt: 'Extract the name of the title officer or escrow officer handling this transaction, typically shown at the bottom of the commitment or in contact information. Include full name.',
    byteLOSMapping: 'property.title.officerName',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'tiTitleOfficerContact',
    fieldName: 'Title Officer Contact',
    description: 'Contact information for title officer',
    extractionPrompt: 'Extract the contact information for the title officer, including phone number and email if provided. This is typically near the officer name or in a contact section.',
    byteLOSMapping: 'property.title.officerContact',
    dataType: 'string',
    required: false,
    rules: []
  }
];
