// Homeowner's Insurance Policy field configuration with extraction prompts
export const insuranceFields = [
  {
    id: 'insInsuranceCompany',
    fieldName: 'Insurance Company Name',
    description: 'Name of the insurance company providing coverage',
    extractionPrompt: 'Extract the name of the insurance company from the policy documents. This is typically displayed prominently at the top of the policy or declarations page. Include the full legal name of the insurer (e.g., "State Farm Fire and Casualty Company", "Allstate Insurance Company").',
    byteLOSMapping: 'property.insurance.provider.name',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'insurerNotEmpty',
        ruleName: 'Insurance Company Required',
        ruleType: 'format',
        description: 'Insurance company name must be provided',
        condition: 'not_empty',
        errorMessage: 'Insurance company name is missing',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'insPolicyNumber',
    fieldName: 'Policy Number',
    description: 'Unique policy identification number',
    extractionPrompt: 'Locate and extract the policy number from the insurance document. This is typically labeled "Policy Number", "Policy #", or "Policy ID" and appears near the top of the declarations page. Extract the complete alphanumeric identifier exactly as shown.',
    byteLOSMapping: 'property.insurance.policyNumber',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'policyNumberFormat',
        ruleName: 'Valid Policy Number',
        ruleType: 'format',
        description: 'Policy number must be valid format',
        condition: 'not_empty',
        errorMessage: 'Policy number is missing or invalid',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'insNamedInsured',
    fieldName: 'Named Insured',
    description: 'Name(s) of the insured party or parties',
    extractionPrompt: 'Extract the name(s) of the insured from the policy, typically labeled "Named Insured", "Insured", or "Policyholder". This may include one or more names. Extract all names exactly as shown on the policy.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'insuredMatchesBorrower',
        ruleName: 'Named Insured Match',
        ruleType: 'comparison',
        description: 'Named insured must include borrower name',
        condition: 'contains',
        compareField: 'borrower.fullName',
        errorMessage: 'Named insured does not match borrower name on loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'insPropertyAddress',
    fieldName: 'Property Address',
    description: 'Address of the insured property',
    extractionPrompt: 'Extract the complete property address from the insurance policy, typically shown in a "Property Location", "Insured Location", or "Property Address" section. Include street number, street name, unit number if applicable, city, state, and ZIP code.',
    byteLOSMapping: 'property.address.fullAddress',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'propertyAddressMatch',
        ruleName: 'Property Address Match',
        ruleType: 'comparison',
        description: 'Insured property address must match subject property on loan application',
        condition: 'matches',
        compareField: 'property.address.fullAddress',
        errorMessage: 'Property address on insurance policy does not match subject property',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'insPolicyEffectiveDate',
    fieldName: 'Policy Effective Date',
    description: 'Date when insurance coverage begins',
    extractionPrompt: 'Find the policy effective date or coverage start date on the insurance document, typically labeled "Effective Date", "Policy Period From", or "Coverage Begins". Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.insurance.effectiveDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'effectiveDateBeforeClosing',
        ruleName: 'Coverage at Closing',
        ruleType: 'date_comparison',
        description: 'Insurance must be effective at or before loan closing date',
        condition: 'on_or_before',
        compareField: 'loan.estimatedClosingDate',
        errorMessage: 'Insurance effective date is after estimated closing date. Coverage must begin at or before closing.',
        severity: 'critical'
      },
      {
        id: 'effectiveDateNotFuture',
        ruleName: 'Effective Date Reasonability',
        ruleType: 'date_range',
        description: 'Effective date should not be too far in the future',
        condition: 'within_days',
        value: 90,
        compareField: 'today',
        errorMessage: 'Policy effective date is more than 90 days in the future',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'insPolicyExpirationDate',
    fieldName: 'Policy Expiration Date',
    description: 'Date when insurance coverage ends',
    extractionPrompt: 'Extract the policy expiration date from the insurance document, typically labeled "Expiration Date", "Policy Period To", or "Coverage Ends". Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.insurance.expirationDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'policyNotExpired',
        ruleName: 'Policy Not Expired',
        ruleType: 'date_comparison',
        description: 'Policy must not be expired at closing',
        condition: 'after',
        compareField: 'loan.estimatedClosingDate',
        errorMessage: 'Insurance policy expires before loan closing date',
        severity: 'critical'
      },
      {
        id: 'expirationAfterEffective',
        ruleName: 'Expiration Logic',
        ruleType: 'date_comparison',
        description: 'Expiration date must be after effective date',
        condition: 'after',
        compareField: 'insPolicyEffectiveDate',
        errorMessage: 'Policy expiration date must be after effective date',
        severity: 'critical'
      },
      {
        id: 'minimumCoveragePeriod',
        ruleName: 'Minimum Coverage Period',
        ruleType: 'date_calculation',
        description: 'Policy should provide at least 11 months of coverage',
        condition: 'months_between',
        minValue: 11,
        compareField: 'insPolicyEffectiveDate',
        errorMessage: 'Insurance policy term is less than 11 months',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'insDwellingCoverage',
    fieldName: 'Dwelling Coverage Amount',
    description: 'Coverage limit for the dwelling/structure',
    extractionPrompt: 'Extract the dwelling coverage amount from the policy, typically labeled "Coverage A - Dwelling", "Dwelling Coverage", or "Building Coverage". This represents the amount of insurance coverage for the physical structure. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.insurance.dwellingCoverage',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'adequateCoverage',
        ruleName: 'Adequate Dwelling Coverage',
        ruleType: 'calculation',
        description: 'Dwelling coverage must be at least 80% of property value or loan amount',
        condition: 'greater_than_or_equal',
        compareField: 'property.estimatedValue * 0.8',
        errorMessage: 'Dwelling coverage is less than 80% of property value. Lender may require higher coverage.',
        severity: 'critical'
      },
      {
        id: 'coverageReasonable',
        ruleName: 'Reasonable Coverage Amount',
        ruleType: 'range',
        description: 'Dwelling coverage must be reasonable positive amount',
        condition: 'greater_than',
        value: 10000,
        errorMessage: 'Dwelling coverage amount appears unreasonably low',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'insLiabilityCoverage',
    fieldName: 'Liability Coverage Amount',
    description: 'Personal liability coverage limit',
    extractionPrompt: 'Find the liability coverage amount on the policy, typically labeled "Coverage E - Personal Liability", "Liability Coverage", or "Personal Liability Protection". Extract only the numerical amount.',
    byteLOSMapping: 'property.insurance.liabilityCoverage',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'minimumLiability',
        ruleName: 'Minimum Liability Coverage',
        ruleType: 'range',
        description: 'Liability coverage should be at least $100,000',
        condition: 'greater_than_or_equal',
        value: 100000,
        errorMessage: 'Liability coverage is below recommended minimum of $100,000',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'insDeductible',
    fieldName: 'Deductible Amount',
    description: 'Policy deductible amount',
    extractionPrompt: 'Extract the deductible amount from the policy declarations page, typically labeled "Deductible", "All Other Perils Deductible", or "Policy Deductible". If there are multiple deductibles (wind/hail, hurricane, etc.), extract the general/all perils deductible. Extract only the numerical amount.',
    byteLOSMapping: 'property.insurance.deductible',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'reasonableDeductible',
        ruleName: 'Reasonable Deductible',
        ruleType: 'percentage',
        description: 'Deductible should typically be less than 5% of dwelling coverage',
        condition: 'less_than_percent',
        value: 5,
        compareField: 'insDwellingCoverage',
        errorMessage: 'Deductible exceeds 5% of dwelling coverage, which may indicate high risk',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'insMortgageeClause',
    fieldName: 'Mortgagee/Lender Information',
    description: 'Lender information in mortgagee clause',
    extractionPrompt: 'Look for the mortgagee clause or lender information section on the policy, typically labeled "Mortgagee", "Loss Payee", "Lender", or "Additional Interests". Extract the name and address of the mortgagee/lender. If none listed, indicate "None" or leave blank.',
    byteLOSMapping: 'property.insurance.mortgagee',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'mortgageeRequired',
        ruleName: 'Mortgagee Clause Required',
        ruleType: 'format',
        description: 'For purchase loans, mortgagee clause with lender info is typically required',
        condition: 'not_empty_if',
        compareField: 'loan.type',
        compareValue: 'purchase',
        errorMessage: 'Mortgagee clause is missing. Lender must be named on the policy.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'insFloodCoverageRequired',
    fieldName: 'Flood Coverage Indicator',
    description: 'Whether flood insurance is required or included',
    extractionPrompt: 'Check if the policy includes flood insurance coverage or if there is a statement about flood coverage. Look for "Flood Coverage", "NFIP", "National Flood Insurance Program", or statements indicating flood insurance is required but separate. Extract "Yes" if included, "Required - Separate Policy" if noted as required separately, or "Not Required" if in non-flood zone.',
    byteLOSMapping: 'property.insurance.floodRequired',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'floodZoneCheck',
        ruleName: 'Flood Zone Compliance',
        ruleType: 'conditional',
        description: 'If property is in flood zone, separate flood insurance is required',
        condition: 'if_equals',
        compareField: 'property.floodZone',
        compareValue: 'A,AE,AH,AO,AR,V,VE',
        errorMessage: 'Property is in flood zone. Separate flood insurance documentation required.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'insWindHailDeductible',
    fieldName: 'Wind/Hail Deductible',
    description: 'Separate wind/hail deductible if applicable',
    extractionPrompt: 'Check if there is a separate wind/hail deductible listed on the policy, common in coastal areas. Look for "Wind/Hail Deductible", "Hurricane Deductible", or "Named Storm Deductible". Extract the amount or percentage. If none, leave blank.',
    byteLOSMapping: 'property.insurance.windHailDeductible',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'insAnnualPremium',
    fieldName: 'Annual Premium',
    description: 'Total annual insurance premium amount',
    extractionPrompt: 'Extract the annual premium amount from the policy, typically labeled "Annual Premium", "Total Premium", or "Policy Premium". This is the total cost for one year of coverage. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.insurance.annualPremium',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'premiumReasonable',
        ruleName: 'Premium Reasonability',
        ruleType: 'calculation',
        description: 'Premium should typically be 0.3% to 2% of property value annually',
        condition: 'between_percent',
        minPercent: 0.3,
        maxPercent: 2.5,
        compareField: 'property.estimatedValue',
        errorMessage: 'Insurance premium appears outside typical range for property value',
        severity: 'info'
      }
    ]
  },
  {
    id: 'insReplacementCost',
    fieldName: 'Replacement Cost Indicator',
    description: 'Whether policy provides replacement cost coverage',
    extractionPrompt: 'Check if the policy provides replacement cost coverage (as opposed to actual cash value). Look for terms like "Replacement Cost", "RCV", "Replacement Cost Coverage", or "Full Replacement Cost". Extract "Yes" if replacement cost coverage is provided, "No" if actual cash value, or "Unknown" if not clearly stated.',
    byteLOSMapping: 'property.insurance.replacementCost',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'replacementCostPreferred',
        ruleName: 'Replacement Cost Preferred',
        ruleType: 'comparison',
        description: 'Replacement cost coverage is preferred over actual cash value',
        condition: 'equals',
        value: 'Yes',
        errorMessage: 'Policy should provide replacement cost coverage rather than actual cash value',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'insAgentContact',
    fieldName: 'Insurance Agent Contact',
    description: 'Name and contact information for insurance agent',
    extractionPrompt: 'Extract the insurance agent or agency contact information from the policy, typically shown near the top or bottom of the declarations page. Include agent name, agency name, and phone number if available.',
    byteLOSMapping: 'property.insurance.agentContact',
    dataType: 'string',
    required: false,
    rules: []
  }
];
