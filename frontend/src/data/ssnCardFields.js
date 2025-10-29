// Social Security Card field configuration with extraction prompts
export const ssnCardFields = [
  {
    id: 'ssnFullName',
    fieldName: 'Name on Card',
    description: 'Full legal name as shown on Social Security card',
    extractionPrompt: 'Extract the complete name printed on the Social Security card. This appears prominently on the card. Include the full name exactly as printed, maintaining the order and spelling. Do not include any handwritten additions.',
    byteLOSMapping: 'borrower.firstName + borrower.middleName + borrower.lastName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'nameMatchesBorrower',
        ruleName: 'Name Match Validation',
        ruleType: 'comparison',
        description: 'Name on SSN card must match borrower name on application',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Name on Social Security card does not match borrower name on loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ssnNumber',
    fieldName: 'Social Security Number',
    description: 'Nine-digit Social Security number',
    extractionPrompt: 'Extract the Social Security number from the card. This is the nine-digit number in XXX-XX-XXXX format. Extract all nine digits exactly as shown, including dashes if present.',
    byteLOSMapping: 'borrower.ssn',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'ssnFormat',
        ruleName: 'Valid SSN Format',
        ruleType: 'format',
        description: 'SSN must be valid 9-digit format',
        condition: 'matches_pattern',
        pattern: '^\\d{3}-?\\d{2}-?\\d{4}$',
        errorMessage: 'Social Security number format is invalid',
        severity: 'critical'
      },
      {
        id: 'ssnMatchesApplication',
        ruleName: 'SSN Match',
        ruleType: 'comparison',
        description: 'SSN must match loan application',
        condition: 'matches',
        compareField: 'borrower.ssn',
        errorMessage: 'Social Security number does not match loan application',
        severity: 'critical'
      },
      {
        id: 'ssnNotInvalid',
        ruleName: 'Invalid SSN Check',
        ruleType: 'format',
        description: 'SSN must not be known invalid number',
        condition: 'not_in_list',
        invalidValues: ['000-00-0000', '111-11-1111', '222-22-2222', '333-33-3333', '444-44-4444', '555-55-5555', '666-66-6666', '777-77-7777', '888-88-8888', '999-99-9999', '123-45-6789'],
        errorMessage: 'SSN appears to be invalid or test number',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ssnCardType',
    fieldName: 'Card Type',
    description: 'Type of Social Security card (unrestricted, work authorized, etc.)',
    extractionPrompt: 'Identify the type of Social Security card based on text printed on it. Standard cards have no restrictions. Some cards include text like "VALID FOR WORK ONLY WITH DHS AUTHORIZATION" or "NOT VALID FOR EMPLOYMENT". Extract: "Unrestricted" for standard cards with no work restrictions, "DHS Authorization Required" if work authorization text is present, or "Not Valid for Employment" if that text appears.',
    byteLOSMapping: 'borrower.ssnCardType',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'cardTypeAcceptable',
        ruleName: 'Acceptable Card Type',
        ruleType: 'comparison',
        description: 'Card type must be acceptable for employment verification',
        condition: 'equals',
        value: 'Unrestricted',
        errorMessage: 'Social Security card has work restrictions. Additional documentation may be required to verify employment eligibility.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'ssnCardCondition',
    fieldName: 'Card Condition',
    description: 'Physical condition and legibility of the card',
    extractionPrompt: 'Assess the physical condition of the Social Security card document/image. Evaluate if all text is clearly legible, if the card appears authentic (proper formatting, fonts, colors), and if there are any signs of alteration or damage. Extract: "Good - Fully Legible" if card is clear and readable, "Fair - Some Wear" if slightly worn but readable, "Poor - Difficult to Read" if significantly damaged or unclear, or "Questionable - Possible Alteration" if authenticity concerns exist.',
    byteLOSMapping: 'borrower.ssnCardCondition',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'cardLegibility',
        ruleName: 'Card Must Be Legible',
        ruleType: 'comparison',
        description: 'Card must be legible for verification',
        condition: 'not_contains',
        value: 'Poor',
        errorMessage: 'Social Security card is difficult to read. May require clearer copy or replacement card.',
        severity: 'warning'
      },
      {
        id: 'authenticityCheck',
        ruleName: 'Authenticity Verification',
        ruleType: 'comparison',
        description: 'Card should not show signs of alteration',
        condition: 'not_contains',
        value: 'Questionable',
        errorMessage: 'Social Security card may show signs of alteration. Verify authenticity with SSA if needed.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ssnIssuedBy',
    fieldName: 'Issuing Agency',
    description: 'Verification that card was issued by Social Security Administration',
    extractionPrompt: 'Verify that the card displays "SOCIAL SECURITY" prominently at the top and is clearly issued by the U.S. Social Security Administration. The card should have the official SSA format and design. Extract "Social Security Administration" if confirmed, or note any discrepancies.',
    byteLOSMapping: null,
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'officialCard',
        ruleName: 'Official SSA Card',
        ruleType: 'comparison',
        description: 'Must be official SSA-issued card',
        condition: 'contains',
        value: 'Social Security',
        errorMessage: 'Card does not appear to be official Social Security Administration document',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ssnCardVersion',
    fieldName: 'Card Version/Design',
    description: 'Version or design of the Social Security card',
    extractionPrompt: 'Identify the version or design of the Social Security card. Older cards may have different layouts, colors, and security features. Modern cards (post-2007) have enhanced security features. Note key characteristics: "Modern (Blue gradient, security features)", "Older (Tan/beige color)", or describe the observed design.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ssnSecurityFeatures',
    fieldName: 'Security Features Visible',
    description: 'Presence of security features on card',
    extractionPrompt: 'Check for visible security features on the Social Security card. Modern cards have security features like latent images, color-shifting ink, or background patterns. Extract "Yes - Security features visible" if present, "No - Older card design" if not visible, or "Unable to Verify" if image quality prevents assessment.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'securityFeaturesInfo',
        ruleName: 'Security Features Check',
        ruleType: 'comparison',
        description: 'Modern cards should have security features',
        condition: 'informational',
        errorMessage: 'Older card design without modern security features. This is acceptable but note for file.',
        severity: 'info'
      }
    ]
  },
  {
    id: 'ssnNameOrder',
    fieldName: 'Name Order Format',
    description: 'Format in which name appears (First Last or Last, First)',
    extractionPrompt: 'Note the order in which the name appears on the Social Security card. Most cards show "FIRST MIDDLE LAST" format. Extract the format pattern observed (e.g., "First Middle Last", "First Last", "Last, First Middle").',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ssnSignature',
    fieldName: 'Signature on Card',
    description: 'Whether card includes cardholder signature',
    extractionPrompt: 'Check if there is a signature line on the Social Security card and if it has been signed. Older cards have signature lines; newer cards may not. Extract "Yes - Signed", "No - Not Signed", or "N/A - No signature line on card".',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'ssnDocumentQuality',
    fieldName: 'Document/Image Quality',
    description: 'Quality of the submitted document or image',
    extractionPrompt: 'Assess the quality of the submitted Social Security card image or document. Consider resolution, lighting, clarity, whether entire card is visible, and if all details can be read. Extract: "Excellent - High resolution, clear", "Good - Adequate for verification", "Fair - Some quality issues", or "Poor - May need resubmission".',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'adequateQuality',
        ruleName: 'Adequate Image Quality',
        ruleType: 'comparison',
        description: 'Image quality must be adequate for verification',
        condition: 'not_equals',
        value: 'Poor',
        errorMessage: 'Document/image quality is insufficient. Request higher quality image or clearer copy.',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'ssnVerificationDate',
    fieldName: 'Verification Date',
    description: 'Date when SSN card was verified',
    extractionPrompt: 'Record the date when this Social Security card verification was performed. Use today\'s date. Format as MM/DD/YYYY.',
    byteLOSMapping: 'borrower.ssnVerificationDate',
    dataType: 'date',
    required: false,
    rules: []
  },
  {
    id: 'ssnMatchesCreditReport',
    fieldName: 'SSN Matches Credit Report',
    description: 'Whether SSN on card matches credit report',
    extractionPrompt: 'Indicate whether the Social Security number on this card matches the SSN on the borrower\'s credit report. This field is typically completed by the loan processor after comparing documents. Extract "Yes", "No", or "Not Yet Verified".',
    byteLOSMapping: 'borrower.ssnCreditMatch',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'creditReportMatch',
        ruleName: 'Credit Report SSN Match',
        ruleType: 'comparison',
        description: 'SSN should match credit report',
        condition: 'equals',
        value: 'Yes',
        errorMessage: 'SSN on card does not match credit report. Verify correct SSN and resolve discrepancy.',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'ssnAdditionalNotes',
    fieldName: 'Additional Notes',
    description: 'Any additional observations or notes about the card',
    extractionPrompt: 'Extract or note any additional relevant information about the Social Security card that doesn\'t fit into other fields. This might include observations about card condition, special markings, replacement card indicators, or any other pertinent details. If none, indicate "None".',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  }
];
