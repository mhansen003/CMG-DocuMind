// Property Tax Statement field configuration with extraction prompts
export const propertyTaxFields = [
  {
    id: 'ptPropertyAddress',
    fieldName: 'Property Address',
    description: 'Address of the property being taxed',
    extractionPrompt: 'Extract the complete property address from the tax statement. This is typically prominently displayed in a "Property Location", "Situs Address", or "Property Address" section. Include street number, street name, unit if applicable, city, state, and ZIP code.',
    byteLOSMapping: 'property.address.fullAddress',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'addressMatchesProperty',
        ruleName: 'Property Address Match',
        ruleType: 'comparison',
        description: 'Property address must match subject property on loan',
        condition: 'matches',
        compareField: 'property.address.fullAddress',
        errorMessage: 'Property address on tax statement does not match loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ptParcelNumber',
    fieldName: 'Parcel Number / APN',
    description: 'Tax parcel identification number',
    extractionPrompt: 'Extract the parcel number, also called Assessor\'s Parcel Number (APN), Tax ID, or Property ID. This is a unique identifier for the property used by the county assessor. Extract exactly as shown, including any dashes or formatting.',
    byteLOSMapping: 'property.parcelNumber',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'parcelNumberPresent',
        ruleName: 'Parcel Number Required',
        ruleType: 'format',
        description: 'Parcel number must be present',
        condition: 'not_empty',
        errorMessage: 'Parcel number is missing from tax statement',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ptOwnerName',
    fieldName: 'Property Owner Name',
    description: 'Name of property owner per tax records',
    extractionPrompt: 'Extract the property owner name from the tax statement, typically shown in an "Owner", "Taxpayer", or "Property Owner" section. Include all names exactly as they appear on the tax record.',
    byteLOSMapping: 'property.taxRecordOwner',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'ownerNameCheck',
        ruleName: 'Owner Name Verification',
        ruleType: 'comparison',
        description: 'For purchases, owner should match seller; for refinances, should match borrower',
        condition: 'matches_context',
        compareField: 'loan.type',
        errorMessage: 'Property owner on tax statement should match seller (purchase) or borrower (refinance)',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'ptMailingAddress',
    fieldName: 'Mailing Address',
    description: 'Mailing address for tax bills',
    extractionPrompt: 'Extract the mailing address where tax bills are sent, if different from property address. This is typically in a "Mail To" or "Tax Bill Address" section. Include complete address. If same as property address, note "Same as property address".',
    byteLOSMapping: 'property.taxMailingAddress',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptTaxYear',
    fieldName: 'Tax Year',
    description: 'Tax year for this statement',
    extractionPrompt: 'Extract the tax year that this statement covers. This is typically shown prominently, labeled "Tax Year", "Year", or in the heading (e.g., "2024 Property Tax Statement"). Extract as 4-digit year.',
    byteLOSMapping: 'property.taxes.taxYear',
    dataType: 'number',
    required: true,
    rules: [
      {
        id: 'taxYearRecent',
        ruleName: 'Recent Tax Year',
        ruleType: 'range',
        description: 'Tax statement should be for current or recent year',
        condition: 'between',
        minValue: 2020,
        maxValue: 2026,
        errorMessage: 'Tax year is not current or recent',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'ptStatementDate',
    fieldName: 'Statement Date',
    description: 'Date the tax statement was issued',
    extractionPrompt: 'Extract the date the tax statement was issued or printed, typically at the top or bottom of the statement. Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.taxes.statementDate',
    dataType: 'date',
    required: false,
    rules: []
  },
  {
    id: 'ptAnnualTaxAmount',
    fieldName: 'Annual Tax Amount',
    description: 'Total annual property tax',
    extractionPrompt: 'Extract the total annual property tax amount from the statement. This may be labeled "Total Tax", "Annual Tax", "Tax Amount", or "Total Due". If taxes are shown in installments, sum them to get the annual total. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.annualPropertyTax',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'taxAmountReasonable',
        ruleName: 'Reasonable Tax Amount',
        ruleType: 'range',
        description: 'Tax amount must be reasonable positive value',
        condition: 'greater_than',
        value: 0,
        errorMessage: 'Annual tax amount must be greater than zero',
        severity: 'critical'
      },
      {
        id: 'taxToValueRatio',
        ruleName: 'Tax to Value Ratio',
        ruleType: 'calculation',
        description: 'Tax amount should be reasonable percentage of property value',
        condition: 'between_percent',
        minPercent: 0.1,
        maxPercent: 5,
        compareField: 'property.estimatedValue',
        errorMessage: 'Property tax amount appears unusual relative to property value',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'ptMonthlyTaxEstimate',
    fieldName: 'Monthly Tax Estimate',
    description: 'Estimated monthly property tax (annual divided by 12)',
    extractionPrompt: 'If the tax statement provides a monthly tax estimate, extract it. Otherwise, this can be calculated by dividing the annual tax by 12. Extract only the numerical amount.',
    byteLOSMapping: 'property.monthlyPropertyTax',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'ptAssessedValue',
    fieldName: 'Assessed Value',
    description: 'Property value per tax assessor',
    extractionPrompt: 'Extract the assessed value of the property as determined by the county assessor. This may be labeled "Assessed Value", "Assessment", "Taxable Value", or "Tax Assessment". Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.assessedValue',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'assessedValueComparison',
        ruleName: 'Assessed Value Comparison',
        ruleType: 'calculation',
        description: 'Assessed value often differs from market value, review for reasonableness',
        condition: 'compare_to',
        compareField: 'property.estimatedValue',
        errorMessage: 'Assessed value differs significantly from estimated market value. This is common but note for file.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'ptLandValue',
    fieldName: 'Land Value',
    description: 'Assessed value of land only',
    extractionPrompt: 'If the tax statement separately shows the assessed value of the land, extract it. This is sometimes shown in a breakdown with "Land Value" or "Land Assessment". Extract only the numerical amount. If not separately shown, leave blank.',
    byteLOSMapping: 'property.landValue',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'ptImprovementValue',
    fieldName: 'Improvement Value',
    description: 'Assessed value of improvements/structures',
    extractionPrompt: 'If the tax statement separately shows the assessed value of improvements (buildings/structures), extract it. This may be labeled "Improvement Value", "Building Value", or "Structure Assessment". Extract only the numerical amount. If not shown, leave blank.',
    byteLOSMapping: 'property.improvementValue',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'ptTaxRate',
    fieldName: 'Tax Rate',
    description: 'Property tax rate (per $100 or $1000 of value, or percentage)',
    extractionPrompt: 'Extract the tax rate if shown on the statement. This is often expressed as a dollar amount per $100 or $1000 of assessed value, or as a percentage (mill rate). Include the format/unit (e.g., "$1.25 per $100", "1.25%", "12.5 mills"). Extract exactly as shown.',
    byteLOSMapping: 'property.taxRate',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptPaymentStatus',
    fieldName: 'Payment Status',
    description: 'Current payment status of taxes',
    extractionPrompt: 'Determine the payment status of the property taxes. Look for indicators like "PAID", "UNPAID", "DELINQUENT", "CURRENT", "PAST DUE", or payment history showing whether taxes have been paid. Extract the status as shown or "Status Not Shown" if not indicated.',
    byteLOSMapping: 'property.taxes.paymentStatus',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'taxesCurrent',
        ruleName: 'Taxes Must Be Current',
        ruleType: 'comparison',
        description: 'Property taxes must be current (not delinquent) for loan approval',
        condition: 'not_contains_any',
        invalidValues: ['DELINQUENT', 'PAST DUE', 'UNPAID', 'OVERDUE'],
        errorMessage: 'Property taxes are delinquent. Taxes must be brought current before or at closing.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ptInstallmentSchedule',
    fieldName: 'Installment Schedule',
    description: 'Tax payment installment schedule',
    extractionPrompt: 'Extract the payment installment schedule if shown. Many jurisdictions allow taxes to be paid in semi-annual installments. Look for installment dates and amounts (e.g., "1st Installment: $2,500 due 11/1/2024, 2nd Installment: $2,500 due 2/1/2025"). Extract complete schedule or summarize.',
    byteLOSMapping: 'property.taxes.installmentSchedule',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptFirstInstallmentDueDate',
    fieldName: 'First Installment Due Date',
    description: 'Due date for first tax installment',
    extractionPrompt: 'Extract the due date for the first tax installment or the first payment due date. Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.taxes.firstDueDate',
    dataType: 'date',
    required: false,
    rules: []
  },
  {
    id: 'ptSecondInstallmentDueDate',
    fieldName: 'Second Installment Due Date',
    description: 'Due date for second tax installment',
    extractionPrompt: 'If taxes are paid in installments, extract the due date for the second installment. Format as MM/DD/YYYY. If not applicable, leave blank.',
    byteLOSMapping: 'property.taxes.secondDueDate',
    dataType: 'date',
    required: false,
    rules: []
  },
  {
    id: 'ptPenaltiesOrInterest',
    fieldName: 'Penalties or Interest',
    description: 'Any penalties or interest charges shown',
    extractionPrompt: 'Check if the tax statement shows any penalties, interest, or late fees. Extract the amount if present or "None" if no penalties are shown. If delinquent taxes have penalties, include the amount.',
    byteLOSMapping: 'property.taxes.penalties',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'penaltiesFlag',
        ruleName: 'Penalties Indicate Delinquency',
        ruleType: 'comparison',
        description: 'Presence of penalties indicates tax delinquency',
        condition: 'not_equals',
        value: 'None',
        errorMessage: 'Penalties or interest present, indicating delinquent taxes. Must be resolved.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ptExemptions',
    fieldName: 'Tax Exemptions',
    description: 'Any tax exemptions applied',
    extractionPrompt: 'Check if the tax statement shows any exemptions such as homestead exemption, senior exemption, veteran exemption, disability exemption, etc. List any exemptions shown or "None" if no exemptions.',
    byteLOSMapping: 'property.taxes.exemptions',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'homesteadExemptionNote',
        ruleName: 'Homestead Exemption Note',
        ruleType: 'comparison',
        description: 'Homestead exemption indicates owner occupancy',
        condition: 'contains',
        value: 'Homestead',
        errorMessage: 'Homestead exemption present. For purchases, this will transfer to new owner; for refinance, confirms owner occupancy.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'ptSpecialAssessments',
    fieldName: 'Special Assessments',
    description: 'Any special assessments or additional charges',
    extractionPrompt: 'Check for any special assessments on the tax bill. These might include charges for street improvements, sewer assessments, municipal bonds, or other special district charges. List any special assessments with amounts, or "None" if not present.',
    byteLOSMapping: 'property.taxes.specialAssessments',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'specialAssessmentFlag',
        ruleName: 'Special Assessment Impact',
        ruleType: 'comparison',
        description: 'Special assessments increase total tax burden',
        condition: 'not_equals',
        value: 'None',
        errorMessage: 'Special assessments present. Include in total tax amount for monthly payment calculation.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'ptTaxingAuthority',
    fieldName: 'Taxing Authority',
    description: 'County or municipality issuing tax',
    extractionPrompt: 'Extract the name of the taxing authority - typically the county tax assessor or collector. This is usually shown in the header or footer (e.g., "Cook County Tax Assessor", "City of Los Angeles Tax Collector"). Extract the complete official name.',
    byteLOSMapping: 'property.taxes.authority',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptJurisdiction',
    fieldName: 'Tax Jurisdiction/District',
    description: 'Tax district or jurisdiction code',
    extractionPrompt: 'If the tax statement shows a jurisdiction code, tax district number, or district identifier, extract it. This identifies the specific tax district. If not shown, leave blank.',
    byteLOSMapping: 'property.taxes.jurisdiction',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptPropertyType',
    fieldName: 'Property Type/Classification',
    description: 'Property classification for tax purposes',
    extractionPrompt: 'Extract the property type or classification as shown on the tax statement. Common classifications include "Residential", "Single Family", "Condominium", "Multi-Family", "Commercial", "Vacant Land", etc. Extract exactly as shown.',
    byteLOSMapping: 'property.taxClassification',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptYearBuilt',
    fieldName: 'Year Built',
    description: 'Year property was built per tax records',
    extractionPrompt: 'If the tax statement shows the year the property was built, extract it as a 4-digit year. This information is sometimes included in the property characteristics section. If not shown, leave blank.',
    byteLOSMapping: 'property.yearBuilt',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'ptLotSize',
    fieldName: 'Lot Size',
    description: 'Lot size per tax records',
    extractionPrompt: 'If the tax statement shows lot size, extract it with units (e.g., "0.25 acres", "10,890 sq ft"). This may be in a property details section. If not shown, leave blank.',
    byteLOSMapping: 'property.lotSize',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptSquareFootage',
    fieldName: 'Building Square Footage',
    description: 'Square footage per tax records',
    extractionPrompt: 'If the tax statement shows the building square footage, extract it as a number. This may be labeled "Living Area", "Building Size", or "Square Feet". If not shown, leave blank.',
    byteLOSMapping: 'property.squareFeet',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'ptContactInfo',
    fieldName: 'Tax Office Contact Information',
    description: 'Contact information for tax assessor/collector',
    extractionPrompt: 'Extract contact information for the tax assessor or collector office, typically including phone number, website, or office address. This is usually at the bottom of the statement.',
    byteLOSMapping: 'property.taxes.contactInfo',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptPaymentMethod',
    fieldName: 'Accepted Payment Methods',
    description: 'How taxes can be paid',
    extractionPrompt: 'If the tax statement lists accepted payment methods (e.g., "online", "mail", "in person", "escrow"), extract the information. This helps determine if taxes are in escrow or paid directly.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptEscrowAccount',
    fieldName: 'Escrow Account Indicator',
    description: 'Whether taxes are paid through escrow',
    extractionPrompt: 'Check if the tax statement indicates that taxes are paid through a mortgage escrow account. Look for notations like "Paid by Escrow", "Mortgage Company", or escrow company name. Extract "Yes - Escrowed" if indicated, "No - Direct Pay" otherwise, or "Unknown".',
    byteLOSMapping: 'property.taxes.escrowed',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ptSupplementalTax',
    fieldName: 'Supplemental Tax Notice',
    description: 'Whether this is a supplemental tax bill',
    extractionPrompt: 'Check if this is a supplemental tax bill (common after property transfers or improvements). Look for "Supplemental", "Additional", or "Amended" in the document title. Extract "Yes - Supplemental" if indicated, "No - Regular Tax Bill" otherwise.',
    byteLOSMapping: 'property.taxes.supplemental',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'supplementalTaxNote',
        ruleName: 'Supplemental Tax Consideration',
        ruleType: 'comparison',
        description: 'Supplemental taxes may indicate recent reassessment',
        condition: 'contains',
        value: 'Supplemental',
        errorMessage: 'Supplemental tax bill present. Verify this is accounted for in total annual tax calculation.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'ptPriorYearComparison',
    fieldName: 'Prior Year Tax Amount',
    description: 'Previous year tax amount for comparison',
    extractionPrompt: 'If the tax statement shows the prior year\'s tax amount for comparison, extract it. This helps identify significant changes in taxes. Extract the amount or "Not Shown".',
    byteLOSMapping: 'property.taxes.priorYearAmount',
    dataType: 'currency',
    required: false,
    rules: []
  }
];
