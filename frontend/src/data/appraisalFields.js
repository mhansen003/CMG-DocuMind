// Appraisal Report field configuration with extraction prompts
export const appraisalFields = [
  {
    id: 'appPropertyAddress',
    fieldName: 'Subject Property Address',
    description: 'Address of the property being appraised',
    extractionPrompt: 'Extract the complete address of the subject property from the appraisal report. This is typically prominently displayed on the first page in a section labeled "Subject Property", "Property Address", or similar. Include street address, city, state, and ZIP code.',
    byteLOSMapping: 'property.address.fullAddress',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'addressMatchesLoan',
        ruleName: 'Property Address Match',
        ruleType: 'comparison',
        description: 'Appraisal property address must match loan application',
        condition: 'matches',
        compareField: 'property.address.fullAddress',
        errorMessage: 'Property address on appraisal does not match subject property on loan',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'appBorrowerName',
    fieldName: 'Borrower Name',
    description: 'Name of borrower as shown on appraisal',
    extractionPrompt: 'Extract the borrower name from the appraisal report, typically shown near the top of the form in a "Borrower" or "Client" field. This may be one or more names. Extract exactly as shown.',
    byteLOSMapping: 'borrower.fullName',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'borrowerNameCheck',
        ruleName: 'Borrower Name Verification',
        ruleType: 'comparison',
        description: 'Borrower name should match loan application',
        condition: 'contains',
        compareField: 'borrower.fullName',
        errorMessage: 'Borrower name on appraisal does not match loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'appLenderClient',
    fieldName: 'Lender/Client Name',
    description: 'Name of lender or client who ordered appraisal',
    extractionPrompt: 'Extract the lender or client name from the appraisal, typically in a field labeled "Lender/Client", "Client", or "Intended User". This is the entity that ordered the appraisal. Extract exactly as shown.',
    byteLOSMapping: 'loan.lenderName',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appAppraisedValue',
    fieldName: 'Appraised Value / Market Value',
    description: 'Final opinion of market value',
    extractionPrompt: 'Extract the final appraised value or market value opinion from the appraisal report. This is typically prominently displayed and labeled "Market Value", "As-Is Value", "Opinion of Value", or "Indicated Value". This should be in the reconciliation or final value section. Extract only the numerical amount without currency symbols or commas.',
    byteLOSMapping: 'property.appraisedValue',
    dataType: 'currency',
    required: true,
    rules: [
      {
        id: 'valueReasonable',
        ruleName: 'Reasonable Value',
        ruleType: 'range',
        description: 'Appraised value must be reasonable positive amount',
        condition: 'greater_than',
        value: 10000,
        errorMessage: 'Appraised value appears unreasonably low',
        severity: 'critical'
      },
      {
        id: 'valueSupportsPurchase',
        ruleName: 'Value Supports Purchase Price',
        ruleType: 'comparison',
        description: 'Appraised value should meet or exceed purchase price',
        condition: 'greater_than_or_equal',
        compareField: 'property.purchasePrice',
        errorMessage: 'Appraised value is less than purchase price. This may affect loan approval or require increased down payment.',
        severity: 'critical'
      },
      {
        id: 'ltvCalculation',
        ruleName: 'LTV Calculation Impact',
        ruleType: 'calculation',
        description: 'Appraised value determines loan-to-value ratio',
        condition: 'calculate_ltv',
        compareField: 'loan.amount',
        errorMessage: 'Verify loan-to-value ratio based on appraised value meets program requirements',
        severity: 'info'
      }
    ]
  },
  {
    id: 'appEffectiveDate',
    fieldName: 'Effective Date of Appraisal',
    description: 'Date of the property inspection/valuation',
    extractionPrompt: 'Extract the effective date of the appraisal, typically labeled "Effective Date of Appraisal", "Date of Inspection", or "Appraisal Date". This is the date the appraiser physically inspected the property. Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.appraisal.effectiveDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'appraisalRecency',
        ruleName: 'Appraisal Recency Requirement',
        ruleType: 'date_range',
        description: 'Appraisal must typically be within 120 days of loan closing',
        condition: 'within_days',
        value: 120,
        compareField: 'loan.estimatedClosingDate',
        errorMessage: 'Appraisal may be too old. Most loans require appraisal within 120 days of closing.',
        severity: 'warning'
      },
      {
        id: 'inspectionDateLogic',
        ruleName: 'Inspection Date Logic',
        ruleType: 'date_comparison',
        description: 'Inspection date must be in the past',
        condition: 'before_or_equal',
        compareField: 'today',
        errorMessage: 'Appraisal effective date cannot be in the future',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'appReportDate',
    fieldName: 'Report Date',
    description: 'Date the appraisal report was completed',
    extractionPrompt: 'Extract the date the appraisal report was completed or signed, typically labeled "Report Date", "Date of Report", or the date near the appraiser signature. Format as MM/DD/YYYY.',
    byteLOSMapping: 'property.appraisal.reportDate',
    dataType: 'date',
    required: false,
    rules: [
      {
        id: 'reportAfterInspection',
        ruleName: 'Report After Inspection',
        ruleType: 'date_comparison',
        description: 'Report date must be on or after inspection date',
        condition: 'on_or_after',
        compareField: 'appEffectiveDate',
        errorMessage: 'Report date is before inspection date',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'appAppraiserName',
    fieldName: 'Appraiser Name',
    description: 'Name of the licensed appraiser',
    extractionPrompt: 'Extract the name of the appraiser who completed the report, typically found in the appraiser certification section or signature area. Extract the full name of the primary appraiser.',
    byteLOSMapping: 'property.appraisal.appraiserName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'appraiserNamePresent',
        ruleName: 'Appraiser Name Required',
        ruleType: 'format',
        description: 'Appraiser name must be present',
        condition: 'not_empty',
        errorMessage: 'Appraiser name is missing from report',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'appLicenseNumber',
    fieldName: 'Appraiser License Number',
    description: 'State license number of the appraiser',
    extractionPrompt: 'Extract the appraiser\'s state license or certification number from the report, typically in the appraiser certification section labeled "State Certification Number", "License Number", or similar. Extract exactly as shown.',
    byteLOSMapping: 'property.appraisal.appraiserLicense',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'licenseNumberPresent',
        ruleName: 'License Number Required',
        ruleType: 'format',
        description: 'Appraiser license number must be present',
        condition: 'not_empty',
        errorMessage: 'Appraiser license number is missing',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'appLicenseState',
    fieldName: 'License State',
    description: 'State that issued appraiser license',
    extractionPrompt: 'Extract the state that issued the appraiser\'s license, typically shown with the license number. This should be the two-letter state code.',
    byteLOSMapping: 'property.appraisal.appraiserState',
    dataType: 'string',
    required: true,
    rules: []
  },
  {
    id: 'appPropertyType',
    fieldName: 'Property Type',
    description: 'Type/classification of property',
    extractionPrompt: 'Extract the property type from the appraisal report. Look for checkboxes or fields indicating "One-Unit Property", "Single Family", "Condominium", "2-4 Unit", "Multi-Family", etc. This is typically in the property description section.',
    byteLOSMapping: 'property.propertyType',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'propertyTypeMatch',
        ruleName: 'Property Type Consistency',
        ruleType: 'comparison',
        description: 'Property type should match loan application',
        condition: 'matches',
        compareField: 'property.propertyType',
        errorMessage: 'Property type on appraisal does not match loan application',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'appYearBuilt',
    fieldName: 'Year Built',
    description: 'Year the property was originally constructed',
    extractionPrompt: 'Extract the year the property was built from the appraisal report, typically in a property description section labeled "Year Built", "Yr. Built", or "Age". Extract as a 4-digit year.',
    byteLOSMapping: 'property.yearBuilt',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'yearBuiltReasonable',
        ruleName: 'Reasonable Year Built',
        ruleType: 'range',
        description: 'Year built must be reasonable (1700-current year)',
        condition: 'between',
        minValue: 1700,
        maxValue: 2026,
        errorMessage: 'Year built is outside reasonable range',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'appGrossLivingArea',
    fieldName: 'Gross Living Area (Square Feet)',
    description: 'Total above-grade living area in square feet',
    extractionPrompt: 'Extract the gross living area (GLA) from the appraisal report, typically labeled "Gross Living Area", "GLA", "Living Area", or "Sq. Ft." in the property description section. This represents above-grade finished living space. Extract only the numerical value.',
    byteLOSMapping: 'property.squareFeet',
    dataType: 'number',
    required: false,
    rules: [
      {
        id: 'glaReasonable',
        ruleName: 'Reasonable Living Area',
        ruleType: 'range',
        description: 'Living area should be reasonable for property type',
        condition: 'greater_than',
        value: 400,
        errorMessage: 'Gross living area appears unreasonably small',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'appLotSize',
    fieldName: 'Lot Size',
    description: 'Size of the property lot',
    extractionPrompt: 'Extract the lot size from the appraisal, typically in the property description section labeled "Site", "Lot Size", or "Site Area". This may be in square feet, acres, or other units. Extract the value and unit (e.g., "0.25 acres" or "10,890 sq ft").',
    byteLOSMapping: 'property.lotSize',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appBedrooms',
    fieldName: 'Number of Bedrooms',
    description: 'Total number of bedrooms',
    extractionPrompt: 'Extract the number of bedrooms from the appraisal report, typically in the property description section. Look for "Bedrooms", "Beds", "# of Bedrooms", or "BR". Extract only the numerical value.',
    byteLOSMapping: 'property.bedrooms',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'appBathrooms',
    fieldName: 'Number of Bathrooms',
    description: 'Total number of bathrooms (including partial baths)',
    extractionPrompt: 'Extract the total number of bathrooms from the appraisal. This is often shown as full baths and half baths separately (e.g., "2.1" meaning 2 full and 1 half). Extract the total count as shown.',
    byteLOSMapping: 'property.bathrooms',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'appRooms',
    fieldName: 'Total Number of Rooms',
    description: 'Total count of rooms in the property',
    extractionPrompt: 'Extract the total number of rooms from the appraisal, typically shown in the property description. This usually includes bedrooms, living rooms, dining rooms, etc., but not bathrooms. Extract only the numerical value.',
    byteLOSMapping: 'property.totalRooms',
    dataType: 'number',
    required: false,
    rules: []
  },
  {
    id: 'appCondition',
    fieldName: 'Property Condition Rating',
    description: 'Overall condition rating of the property',
    extractionPrompt: 'Extract the property condition rating from the appraisal. Look for checkboxes or ratings such as "Excellent", "Good", "Average", "Fair", "Poor" in the property condition section. Extract the rating exactly as indicated.',
    byteLOSMapping: 'property.condition',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'conditionAcceptable',
        ruleName: 'Acceptable Property Condition',
        ruleType: 'comparison',
        description: 'Property condition should be acceptable for lending',
        condition: 'not_in_list',
        invalidValues: ['Poor', 'Unsatisfactory'],
        errorMessage: 'Property condition rating may not meet lending guidelines. Further review required.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'appQuality',
    fieldName: 'Quality of Construction',
    description: 'Quality rating of construction/materials',
    extractionPrompt: 'Extract the quality of construction rating from the appraisal, typically checkboxes or ratings such as "Excellent", "Good", "Average", "Fair", "Poor". This refers to the quality of materials and workmanship.',
    byteLOSMapping: 'property.quality',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appNeighborhoodCondition',
    fieldName: 'Neighborhood Condition',
    description: 'Condition rating of the neighborhood',
    extractionPrompt: 'Extract the neighborhood condition rating from the neighborhood section, typically shown as checkboxes for "Increasing", "Stable", "Declining". Extract exactly as indicated.',
    byteLOSMapping: 'property.neighborhoodCondition',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'neighborhoodStability',
        ruleName: 'Neighborhood Stability',
        ruleType: 'comparison',
        description: 'Neighborhood condition affects marketability',
        condition: 'equals',
        value: 'Declining',
        errorMessage: 'Neighborhood condition is noted as declining. This may impact property marketability and value stability.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'appSalesComparison1',
    fieldName: 'Comparable Sale 1 Address',
    description: 'Address of first comparable sale',
    extractionPrompt: 'Extract the address of the first comparable sale from the Sales Comparison Approach section. This is typically labeled "Comparable Sale 1", "Sale 1", or "Comp 1". Extract the street address.',
    byteLOSMapping: 'property.appraisal.comp1.address',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appSalesComparison1Price',
    fieldName: 'Comparable Sale 1 Price',
    description: 'Sale price of first comparable',
    extractionPrompt: 'Extract the sale price of comparable sale 1 from the sales comparison grid. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.appraisal.comp1.salePrice',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'appSalesComparison2',
    fieldName: 'Comparable Sale 2 Address',
    description: 'Address of second comparable sale',
    extractionPrompt: 'Extract the address of the second comparable sale from the Sales Comparison Approach section. Extract the street address.',
    byteLOSMapping: 'property.appraisal.comp2.address',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appSalesComparison2Price',
    fieldName: 'Comparable Sale 2 Price',
    description: 'Sale price of second comparable',
    extractionPrompt: 'Extract the sale price of comparable sale 2. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.appraisal.comp2.salePrice',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'appSalesComparison3',
    fieldName: 'Comparable Sale 3 Address',
    description: 'Address of third comparable sale',
    extractionPrompt: 'Extract the address of the third comparable sale from the Sales Comparison Approach section. Extract the street address.',
    byteLOSMapping: 'property.appraisal.comp3.address',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appSalesComparison3Price',
    fieldName: 'Comparable Sale 3 Price',
    description: 'Sale price of third comparable',
    extractionPrompt: 'Extract the sale price of comparable sale 3. Extract only the numerical amount without currency symbols.',
    byteLOSMapping: 'property.appraisal.comp3.salePrice',
    dataType: 'currency',
    required: false,
    rules: []
  },
  {
    id: 'appMarketabilityComments',
    fieldName: 'Marketability Comments',
    description: 'Appraiser comments on property marketability',
    extractionPrompt: 'Extract any comments the appraiser made about the property\'s marketability, typically in a section asking about adverse conditions or market acceptance. Look for comments about exposure time, typical buyers, market acceptance, or special considerations.',
    byteLOSMapping: 'property.appraisal.marketabilityComments',
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'appRepairsRequired',
    fieldName: 'Repairs Required',
    description: 'Whether repairs are required',
    extractionPrompt: 'Check if the appraisal indicates any required repairs or conditions that must be addressed. Look for sections about "Repairs", "Conditions", "Required Repairs", or "Subject To" conditions. Extract "Yes" if repairs are required with description, or "No" if property is approved as-is.',
    byteLOSMapping: 'property.appraisal.repairsRequired',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'repairsFlag',
        ruleName: 'Required Repairs Flag',
        ruleType: 'comparison',
        description: 'Required repairs must be addressed before closing',
        condition: 'contains',
        value: 'Yes',
        errorMessage: 'Appraisal indicates repairs are required. These must be completed and verified before loan closing.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'appFormType',
    fieldName: 'Appraisal Form Type',
    description: 'Type/form number of appraisal report',
    extractionPrompt: 'Identify the appraisal form type used for this report. Common forms include "1004" (Uniform Residential Appraisal Report), "1073" (Condominium), "1025" (Small Residential Income Property), "2055" (Exterior-only), etc. This is typically shown at the top or bottom of the form.',
    byteLOSMapping: 'property.appraisal.formType',
    dataType: 'string',
    required: false,
    rules: []
  }
];
