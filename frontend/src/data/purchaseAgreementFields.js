// Purchase Agreement / Sales Contract field configuration with extraction prompts
export const purchaseAgreementFields = [
  {
    id: 'paBuyerName',
    fieldName: 'Buyer Name(s)',
    description: 'Full legal name(s) of the buyer(s)',
    extractionPrompt: 'Extract the complete name(s) of the buyer(s) from the purchase agreement. This is typically found near the beginning of the contract in a section labeled "Buyer", "Purchaser", or in the signature section. Include all buyers exactly as named on the contract.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'buyerMatchesBorrower',
        ruleName: 'Buyer Name Match',
        ruleType: 'comparison',
        description: 'Buyer name(s) must match borrower(s) on loan application',
        condition: 'contains',
        compareField: 'borrower.fullName',
        errorMessage: 'Buyer name on purchase agreement does not match borrower name on loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'paSellerName',
    fieldName: 'Seller Name(s)',
    description: 'Full legal name(s) of the seller(s)',
    extractionPrompt: 'Extract the complete name(s) of the seller(s) from the purchase agreement. This is typically found in a section labeled "Seller", "Vendor", or in the signature section. Include all sellers exactly as named on the contract.',
    byteLOSMapping: 'property.seller.name',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'sellerNotEmpty',
        ruleName: 'Seller Name Required',
        ruleType: 'format',
        description: 'Seller name must be present',
        condition: 'not_empty',
        errorMessage: 'Seller name is missing from purchase agreement',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'paPropertyAddress',
    fieldName: 'Property Address',
    description: 'Complete legal address of the property being purchased',
    extractionPrompt: 'Extract the complete property address from the purchase agreement, typically in a section labeled "Property", "Real Property", "Premises", or "Subject Property". Include street number, street name, unit number if applicable, city, state, and ZIP code. Extract exactly as written in the contract.',
    byteLOSMapping: 'property.address.fullAddress',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'propertyAddressMatch',
        ruleName: 'Property Address Match',
        ruleType: 'comparison',
        description: 'Property address must match subject property on loan application',
        condition: 'matches',
        compareField: 'property.address.fullAddress',
        errorMessage: 'Property address on purchase agreement does not match subject property on loan',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'paPurchasePrice',
    fieldName: 'Purchase Price',
    description: 'Total agreed purchase price for the property',
    extractionPrompt: 'Extract the total purchase price from the purchase agreement. This is typically prominently displayed in a section labeled "Purchase Price", "Sales Price", or "Price". Extract only the numerical amount without currency symbols or commas. This should be the total price before any adjustments or credits.',
    byteLOSMapping: 'property.purchasePrice',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'purchasePriceMatch',
        ruleName: 'Purchase Price Match',
        ruleType: 'comparison',
        description: 'Purchase price must match loan application',
        condition: 'equals',
        compareField: 'property.purchasePrice',
        errorMessage: 'Purchase price on contract does not match loan application',
        severity: 'critical'
      },
      {
        id: 'reasonablePrice',
        ruleName: 'Reasonable Purchase Price',
        ruleType: 'range',
        description: 'Purchase price must be reasonable positive amount',
        condition: 'greater_than',
        value: 10000,
        errorMessage: 'Purchase price appears unreasonably low',
        severity: 'critical'
      },
      {
        id: 'priceValueAlignment',
        ruleName: 'Price to Value Alignment',
        ruleType: 'calculation',
        description: 'Purchase price should be within reasonable range of estimated value',
        condition: 'within_percentage',
        value: 20,
        compareField: 'property.estimatedValue',
        errorMessage: 'Purchase price differs significantly from estimated property value',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'paEarnestMoneyDeposit',
    fieldName: 'Earnest Money Deposit',
    description: 'Amount of earnest money deposit',
    extractionPrompt: 'Extract the earnest money deposit amount from the purchase agreement, typically labeled "Earnest Money", "Deposit", "Good Faith Deposit", or "EMD". Extract only the numerical amount without currency symbols. This is the amount the buyer deposits to show serious intent to purchase.',
    byteLOSMapping: 'transaction.earnestMoneyDeposit',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'emdReasonable',
        ruleName: 'Reasonable EMD Amount',
        ruleType: 'percentage',
        description: 'Earnest money typically 1-5% of purchase price',
        condition: 'between_percent',
        minPercent: 0.5,
        maxPercent: 10,
        compareField: 'paPurchasePrice',
        errorMessage: 'Earnest money deposit is outside typical range (0.5-10% of purchase price)',
        severity: 'info'
      },
      {
        id: 'emdAssetVerification',
        ruleName: 'EMD Asset Verification',
        ruleType: 'comparison',
        description: 'Earnest money must be verified in borrower assets',
        condition: 'verified_in',
        compareField: 'borrower.assets.total',
        errorMessage: 'Earnest money deposit must be verified in borrower asset documentation',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'paContractDate',
    fieldName: 'Contract Date',
    description: 'Date the purchase agreement was executed/signed',
    extractionPrompt: 'Extract the contract date from the purchase agreement. This may be labeled "Contract Date", "Agreement Date", "Date of Agreement", or may be the date near the signatures. If multiple dates appear, use the date when both parties signed (effective date). Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.contractDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'contractDateLogic',
        ruleName: 'Contract Date Logic',
        ruleType: 'date_comparison',
        description: 'Contract date must be in the past',
        condition: 'before_or_equal',
        compareField: 'today',
        errorMessage: 'Contract date cannot be in the future',
        severity: 'critical'
      },
      {
        id: 'contractBeforeApplication',
        ruleName: 'Contract Before Application',
        ruleType: 'date_comparison',
        description: 'Contract date should typically be before or near loan application date',
        condition: 'within_days',
        value: 30,
        compareField: 'applicationDate',
        errorMessage: 'Contract date is significantly after loan application date',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'paClosingDate',
    fieldName: 'Closing Date',
    description: 'Scheduled closing date for the transaction',
    extractionPrompt: 'Extract the scheduled closing date from the purchase agreement, typically labeled "Closing Date", "Settlement Date", "Date of Closing", or "Possession Date". This is the date when the transaction is expected to be completed. Format as MM/DD/YYYY.',
    byteLOSMapping: 'loan.estimatedClosingDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'closingAfterContract',
        ruleName: 'Closing After Contract',
        ruleType: 'date_comparison',
        description: 'Closing date must be after contract date',
        condition: 'after',
        compareField: 'paContractDate',
        errorMessage: 'Closing date must be after contract date',
        severity: 'critical'
      },
      {
        id: 'closingDateMatch',
        ruleName: 'Closing Date Alignment',
        ruleType: 'date_comparison',
        description: 'Closing date should align with loan application',
        condition: 'within_days',
        value: 15,
        compareField: 'loan.estimatedClosingDate',
        errorMessage: 'Closing date on contract differs from loan application by more than 15 days',
        severity: 'warning'
      },
      {
        id: 'reasonableTimeframe',
        ruleName: 'Reasonable Closing Timeframe',
        ruleType: 'date_calculation',
        description: 'Closing should typically occur 30-60 days after contract',
        condition: 'days_between',
        minValue: 15,
        maxValue: 90,
        compareField: 'paContractDate',
        errorMessage: 'Closing date is outside typical timeframe (15-90 days from contract)',
        severity: 'info'
      }
    ]
  },
  {
    id: 'paFinancingContingency',
    fieldName: 'Financing Contingency',
    description: 'Whether contract includes financing contingency clause',
    extractionPrompt: 'Check if the purchase agreement includes a financing contingency clause. Look for sections labeled "Financing Contingency", "Loan Contingency", "Mortgage Contingency", or similar. Extract "Yes" if present, "No" if specifically waived or not included, or "Cash Sale" if indicated as all-cash purchase.',
    byteLOSMapping: 'property.contingencies.financing',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'financingContingencyCheck',
        ruleName: 'Financing Contingency Present',
        ruleType: 'comparison',
        description: 'For financed purchases, financing contingency protects buyer',
        condition: 'if_not_cash',
        errorMessage: 'No financing contingency found. This may put buyer at risk if loan is not approved.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'paInspectionContingency',
    fieldName: 'Inspection Contingency',
    description: 'Whether contract includes home inspection contingency',
    extractionPrompt: 'Check if the purchase agreement includes a home inspection contingency. Look for sections about "Home Inspection", "Inspection Contingency", "Due Diligence Period", or "Inspection Period". Extract "Yes" if present, "No" if waived, or the number of days allowed for inspection if specified.',
    byteLOSMapping: 'property.contingencies.inspection',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paAppraisalContingency',
    fieldName: 'Appraisal Contingency',
    description: 'Whether contract includes appraisal contingency clause',
    extractionPrompt: 'Check if the purchase agreement includes an appraisal contingency. Look for "Appraisal Contingency", "Appraisal Condition", or clauses allowing buyer to cancel if property does not appraise at purchase price. Extract "Yes" if present, "No" if waived.',
    byteLOSMapping: 'property.contingencies.appraisal',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'appraisalContingencyWarning',
        ruleName: 'Appraisal Contingency Recommendation',
        ruleType: 'comparison',
        description: 'Appraisal contingency protects buyer and lender',
        condition: 'equals',
        value: 'Yes',
        errorMessage: 'No appraisal contingency found. Buyer may be obligated to purchase even if appraisal is low.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'paSellerConcessions',
    fieldName: 'Seller Concessions',
    description: 'Amount of seller concessions or credits',
    extractionPrompt: 'Look for any seller concessions, seller credits, or seller-paid closing costs in the purchase agreement. This may be in sections labeled "Seller Concessions", "Seller Credits", "Closing Cost Credits", or in the financial terms section. Extract the total dollar amount of concessions. If none, extract 0.',
    byteLOSMapping: 'transaction.sellerConcessions',
    dataType: 'currency',
    required: false,
    rules: [
      {
        id: 'concessionsLimit',
        ruleName: 'Seller Concessions Limit',
        ruleType: 'percentage',
        description: 'Seller concessions typically limited to 3-6% of purchase price depending on loan type',
        condition: 'less_than_or_equal_percent',
        value: 6,
        compareField: 'paPurchasePrice',
        errorMessage: 'Seller concessions exceed typical maximum (6% of purchase price). May require review.',
        severity: 'warning'
      },
      {
        id: 'concessionsInLTV',
        ruleName: 'Concessions Impact LTV',
        ruleType: 'calculation',
        description: 'Seller concessions may affect net purchase price for LTV calculation',
        condition: 'impacts_ltv',
        errorMessage: 'Seller concessions must be factored into loan-to-value calculation',
        severity: 'info'
      }
    ]
  },
  {
    id: 'paIncludedItems',
    fieldName: 'Personal Property Included',
    description: 'List of personal property included in sale',
    extractionPrompt: 'Extract any personal property items specifically included in the sale, typically listed in a section labeled "Included Items", "Personal Property", "Fixtures", or "Inclusions". Common items include appliances, window treatments, fixtures. List all items mentioned, or "None specified" if not detailed.',
    byteLOSMapping: 'property.includedItems',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paExcludedItems',
    fieldName: 'Items Excluded from Sale',
    description: 'List of items explicitly excluded from sale',
    extractionPrompt: 'Extract any items explicitly excluded from the sale, typically in a section labeled "Excluded Items", "Exclusions", or "Items Not Included". List all excluded items, or "None specified" if not detailed.',
    byteLOSMapping: 'property.excludedItems',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paPropertyType',
    fieldName: 'Property Type',
    description: 'Type of property being purchased',
    extractionPrompt: 'Identify the property type from the purchase agreement. Look for terms like "single-family residence", "condominium", "townhouse", "multi-family", "mobile home", etc. This may be in a property description section. Extract the property type classification.',
    byteLOSMapping: 'property.propertyType',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'propertyTypeMatch',
        ruleName: 'Property Type Consistency',
        ruleType: 'comparison',
        description: 'Property type should match loan application',
        condition: 'matches',
        compareField: 'property.propertyType',
        errorMessage: 'Property type on purchase agreement does not match loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'paLegalDescription',
    fieldName: 'Legal Description',
    description: 'Legal description of the property',
    extractionPrompt: 'Extract the legal description of the property if provided in the purchase agreement. This may include lot number, block number, subdivision name, plat book references, or metes and bounds description. This is typically in a section labeled "Legal Description" or attached as an exhibit. Extract the complete description or indicate "See Exhibit" if referenced separately.',
    byteLOSMapping: 'property.legalDescription',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paParcelID',
    fieldName: 'Parcel ID / Tax ID',
    description: 'Property tax parcel identification number',
    extractionPrompt: 'Extract the parcel ID, tax ID, or assessor\'s parcel number (APN) if included in the purchase agreement. This may be labeled "Parcel ID", "Tax ID", "APN", "Tax Parcel Number", or similar. Extract exactly as shown.',
    byteLOSMapping: 'property.parcelID',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paOccupancy',
    fieldName: 'Occupancy/Possession Terms',
    description: 'Terms regarding property occupancy and possession',
    extractionPrompt: 'Extract information about when the buyer will take possession/occupancy of the property. Look for sections about "Possession", "Occupancy", or "Move-in Date". Common terms include "at closing", "within X days after closing", or specific date. Extract the occupancy terms as stated.',
    byteLOSMapping: 'property.occupancy',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paListingAgent',
    fieldName: 'Listing Agent/Broker',
    description: 'Name of seller\'s listing agent or broker',
    extractionPrompt: 'Extract the name of the listing agent or broker representing the seller, typically found in a section labeled "Listing Agent", "Seller\'s Agent", "Listing Broker", or in the signature/broker information area. Include company name if provided.',
    byteLOSMapping: 'property.listingAgent',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paBuyerAgent',
    fieldName: 'Buyer\'s Agent/Broker',
    description: 'Name of buyer\'s agent or broker',
    extractionPrompt: 'Extract the name of the buyer\'s agent or broker, typically found in a section labeled "Buyer\'s Agent", "Selling Agent", "Buyer\'s Broker", or in the signature/broker information area. Include company name if provided.',
    byteLOSMapping: 'property.buyerAgent',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'paAddenda',
    fieldName: 'Addenda/Amendments',
    description: 'Reference to any addenda or amendments',
    extractionPrompt: 'Check if there are any addenda, amendments, or additional terms referenced in the purchase agreement. Look for sections mentioning "Addenda", "Amendments", "Additional Terms", or "Exhibits". List any referenced addenda or indicate "None" if not mentioned.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'addendaReview',
        ruleName: 'Addenda Review Required',
        ruleType: 'conditional',
        description: 'If addenda are referenced, they must be reviewed',
        condition: 'if_not_empty',
        errorMessage: 'Purchase agreement references addenda. All addenda must be obtained and reviewed.',
        severity: 'warning'
      }
    ]
  }
];
