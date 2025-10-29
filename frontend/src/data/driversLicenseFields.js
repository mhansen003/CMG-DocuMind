// Driver's License / State ID field configuration with extraction prompts
export const driversLicenseFields = [
  {
    id: 'dlFullName',
    fieldName: 'Full Name',
    description: 'Complete legal name as shown on driver\'s license',
    extractionPrompt: 'Extract the full legal name from the driver\'s license. This is typically displayed prominently near the top of the card. Include first name, middle name (if shown), and last name exactly as printed. Do not include suffixes (Jr., Sr., III) unless they appear as part of the printed name field.',
    byteLOSMapping: 'borrower.firstName + borrower.middleName + borrower.lastName',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'nameMatchesBorrower',
        ruleName: 'Borrower Name Match',
        ruleType: 'comparison',
        description: 'Name on license must match borrower name on application',
        condition: 'matches',
        compareField: 'borrower.fullName',
        errorMessage: 'Name on driver\'s license does not match borrower name on loan application',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlNumber',
    fieldName: 'License Number',
    description: 'Unique driver\'s license or state ID number',
    extractionPrompt: 'Locate and extract the driver\'s license number from the ID card. This is typically labeled as "DL", "ID", "License Number", or similar. Extract the complete alphanumeric identifier exactly as shown, including any letters, numbers, dashes, or spaces.',
    byteLOSMapping: 'borrower.identification.driversLicenseNumber',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'dlNumberFormat',
        ruleName: 'License Number Format',
        ruleType: 'format',
        description: 'License number must be valid alphanumeric format',
        condition: 'not_empty',
        errorMessage: 'Driver\'s license number is missing or invalid',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlState',
    fieldName: 'Issuing State',
    description: 'State that issued the driver\'s license',
    extractionPrompt: 'Identify the state that issued this driver\'s license. This is usually prominently displayed on the card, either as the full state name or two-letter state code (e.g., "California" or "CA"). Extract the two-letter state abbreviation.',
    byteLOSMapping: 'borrower.identification.driversLicenseState',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'validStateCode',
        ruleName: 'Valid State Code',
        ruleType: 'format',
        description: 'Must be valid US state or territory code',
        condition: 'valid_state',
        errorMessage: 'Invalid state code on driver\'s license',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlDateOfBirth',
    fieldName: 'Date of Birth',
    description: 'Borrower\'s date of birth as shown on license',
    extractionPrompt: 'Extract the date of birth from the driver\'s license, typically labeled "DOB", "Date of Birth", or "Birth Date". Format as MM/DD/YYYY. This is a critical field for identity verification.',
    byteLOSMapping: 'borrower.dateOfBirth',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'dobMatchesApplication',
        ruleName: 'Date of Birth Match',
        ruleType: 'comparison',
        description: 'Date of birth must match loan application',
        condition: 'matches',
        compareField: 'borrower.dateOfBirth',
        errorMessage: 'Date of birth on license does not match loan application',
        severity: 'critical'
      },
      {
        id: 'ageRequirement',
        ruleName: 'Minimum Age Requirement',
        ruleType: 'date_calculation',
        description: 'Borrower must be at least 18 years old',
        condition: 'age_at_least',
        value: 18,
        errorMessage: 'Borrower must be at least 18 years old',
        severity: 'critical'
      },
      {
        id: 'reasonableDOB',
        ruleName: 'Reasonable Date of Birth',
        ruleType: 'date_range',
        description: 'Date of birth must be reasonable (not future, not > 120 years ago)',
        condition: 'between_years',
        minYears: 18,
        maxYears: 120,
        errorMessage: 'Date of birth is outside reasonable range',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlIssueDate',
    fieldName: 'Issue Date',
    description: 'Date the license was issued',
    extractionPrompt: 'Find the issue date on the driver\'s license, typically labeled "Issue Date", "ISS", or "Issued". This is the date when the license was originally issued or last renewed. Format as MM/DD/YYYY.',
    byteLOSMapping: 'borrower.identification.driversLicenseIssueDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'issueDateLogic',
        ruleName: 'Issue Date Logic',
        ruleType: 'date_comparison',
        description: 'Issue date must be in the past',
        condition: 'before',
        compareField: 'today',
        errorMessage: 'License issue date cannot be in the future',
        severity: 'critical'
      },
      {
        id: 'issueDateAfterDOB',
        ruleName: 'Issue Date After Birth',
        ruleType: 'date_comparison',
        description: 'Issue date must be after date of birth',
        condition: 'after',
        compareField: 'dlDateOfBirth',
        errorMessage: 'License issue date must be after date of birth',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlExpirationDate',
    fieldName: 'Expiration Date',
    description: 'Date the license expires',
    extractionPrompt: 'Extract the expiration date from the driver\'s license, typically labeled "Expiration Date", "EXP", "Expires", or "Valid Until". Format as MM/DD/YYYY. This is critical for ensuring the ID is currently valid.',
    byteLOSMapping: 'borrower.identification.driversLicenseExpirationDate',
    dataType: 'date',
    required: true,
    rules: [
      {
        id: 'notExpired',
        ruleName: 'License Not Expired',
        ruleType: 'date_comparison',
        description: 'License must not be expired at time of loan application',
        condition: 'after',
        compareField: 'applicationDate',
        errorMessage: 'Driver\'s license is expired. A valid, unexpired ID is required.',
        severity: 'critical'
      },
      {
        id: 'expirationLogic',
        ruleName: 'Expiration Date Logic',
        ruleType: 'date_comparison',
        description: 'Expiration date must be after issue date',
        condition: 'after',
        compareField: 'dlIssueDate',
        errorMessage: 'License expiration date must be after issue date',
        severity: 'critical'
      },
      {
        id: 'expiresBeforeClosing',
        ruleName: 'Valid Through Closing',
        ruleType: 'date_comparison',
        description: 'License should be valid through estimated closing date',
        condition: 'after',
        compareField: 'loan.estimatedClosingDate',
        errorMessage: 'Driver\'s license will expire before estimated loan closing date',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'dlAddress',
    fieldName: 'Address',
    description: 'Street address shown on license',
    extractionPrompt: 'Extract the complete street address from the driver\'s license, typically labeled "Address" or "Residence". Include street number, street name, and unit/apartment number if shown. Do not include city, state, or ZIP code.',
    byteLOSMapping: 'borrower.currentAddress.street',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'addressNotEmpty',
        ruleName: 'Address Present',
        ruleType: 'format',
        description: 'Address field must not be empty',
        condition: 'not_empty',
        errorMessage: 'Address is missing from driver\'s license',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlCity',
    fieldName: 'City',
    description: 'City shown on license',
    extractionPrompt: 'Extract the city name from the driver\'s license address section. This is typically shown on a separate line from the street address.',
    byteLOSMapping: 'borrower.currentAddress.city',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'cityNotEmpty',
        ruleName: 'City Present',
        ruleType: 'format',
        description: 'City field must not be empty',
        condition: 'not_empty',
        errorMessage: 'City is missing from driver\'s license',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlZipCode',
    fieldName: 'ZIP Code',
    description: 'ZIP code shown on license',
    extractionPrompt: 'Extract the ZIP code from the driver\'s license address section. This is typically a 5-digit number, though it may include a 4-digit extension (ZIP+4 format). Extract in the format shown.',
    byteLOSMapping: 'borrower.currentAddress.zipCode',
    dataType: 'string',
    required: true,
    rules: [
      {
        id: 'validZipFormat',
        ruleName: 'Valid ZIP Code Format',
        ruleType: 'format',
        description: 'ZIP code must be valid 5-digit or ZIP+4 format',
        condition: 'matches_pattern',
        pattern: '^\\d{5}(-\\d{4})?$',
        errorMessage: 'Invalid ZIP code format',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'dlHeight',
    fieldName: 'Height',
    description: 'Physical height shown on license',
    extractionPrompt: 'Extract the height from the driver\'s license, typically labeled "HGT", "Height", or "HT". This may be in feet and inches (e.g., 5-10) or in centimeters. Extract exactly as shown.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'heightFormat',
        ruleName: 'Valid Height Format',
        ruleType: 'format',
        description: 'Height should be in valid format if present',
        condition: 'valid_format',
        errorMessage: 'Height format is invalid',
        severity: 'info'
      }
    ]
  },
  {
    id: 'dlEyeColor',
    fieldName: 'Eye Color',
    description: 'Eye color shown on license',
    extractionPrompt: 'Extract the eye color from the driver\'s license, typically labeled "Eyes", "Eye", or "EYE". This is usually abbreviated (e.g., BRN for brown, BLU for blue, GRN for green). Extract as shown.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'dlSex',
    fieldName: 'Sex',
    description: 'Sex designation on license',
    extractionPrompt: 'Extract the sex designation from the driver\'s license, typically labeled "Sex", "Gender", or "S". This is usually shown as M (Male), F (Female), or X (Non-binary/Other). Extract the single letter code.',
    byteLOSMapping: 'borrower.sex',
    dataType: 'string',
    required: false,
    rules: [
      {
        id: 'validSexCode',
        ruleName: 'Valid Sex Code',
        ruleType: 'format',
        description: 'Sex code must be M, F, or X if present',
        condition: 'in_list',
        validValues: ['M', 'F', 'X'],
        errorMessage: 'Invalid sex designation on license',
        severity: 'warning'
      }
    ]
  },
  {
    id: 'dlClass',
    fieldName: 'License Class',
    description: 'Class or type of license',
    extractionPrompt: 'Extract the license class from the driver\'s license, typically labeled "Class", "Type", or "CL". Common values include C (standard passenger vehicle), A (commercial), B (heavy vehicles), M (motorcycle), etc. Extract exactly as shown.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'dlRestrictions',
    fieldName: 'Restrictions',
    description: 'Any restrictions noted on the license',
    extractionPrompt: 'Check if there are any restrictions listed on the driver\'s license, often labeled "Restrictions", "REST", or "R". Common restrictions include corrective lenses, daylight only, etc. Extract any restriction codes or descriptions. If none, leave blank.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  },
  {
    id: 'dlEndorsements',
    fieldName: 'Endorsements',
    description: 'Any endorsements noted on the license',
    extractionPrompt: 'Check if there are any endorsements listed on the driver\'s license, often labeled "Endorsements", "END", or "E". Extract any endorsement codes if present. If none, leave blank.',
    byteLOSMapping: null,
    dataType: 'string',
    required: false,
    rules: []
  }
];
