# CMG DocuMind 🏠📄

**Mortgage Document Intelligence System** - AI-powered document extraction, validation, and underwriting assistance.

## 🎯 Project Overview

CMG DocuMind analyzes mortgage documents using AI (OpenAI GPT-4o), extracts key data, validates it against loan applications and underwriting rules, and generates intelligent conditions and scorecards to streamline the mortgage underwriting process.

## ✨ Features

- **AI Document Extraction**: Uses OpenAI GPT-4o to intelligently extract data from 20+ mortgage document types
- **Rules-Based Validation**: Configurable rules engine with conditional logic based on loan type, state, employment, etc.
- **Smart Conditions**: Automatically generates conditions with suggested actions when issues are detected
- **Loan Scorecard**: Comprehensive scoring system for document completeness, data accuracy, and compliance
- **Side-by-Side Viewer**: View documents alongside extracted data and loan information
- **Admin Interface**: Manage extraction rules without touching code
- **MISMO 3.5 Support**: Full support for MISMO 3.5 loan data standard

## 🏗️ Architecture

```
CMG-DocuMind/
├── backend/              # Node.js + Express API
│   ├── server.js         # Main API server
│   └── services/
│       ├── documentExtractor.js    # AI extraction service
│       ├── rulesEngine.js          # Validation & scoring
│       ├── loanDataService.js      # Loan data management
│       └── conditionsService.js    # Conditions management
├── frontend/             # React + Vite application
├── data/
│   ├── loan-files/       # Sample MISMO loan data (JSON)
│   ├── rules/            # Extraction rules configuration
│   └── sample-documents/ # Sample mortgage documents
└── README.md
```

## 🚀 Tech Stack

**Backend:**
- Node.js + Express
- OpenAI GPT-4o API (document extraction)
- PDF parsing (pdf-parse)
- JSON-based storage (prototype)

**Frontend:**
- React 18
- Vite (build tool)
- React Router (navigation)
- React-PDF (PDF viewer)
- Axios (API client)

## 📋 Supported Document Types

The system can extract data from 20+ mortgage document types:

### Identification
- Driver's License
- Passport

### Income Documentation
- W-2 Forms (2 years)
- Pay Stubs
- 1099 Forms
- Tax Returns (1040)
- Profit & Loss Statements
- Verification of Employment (VOE)
- Business License

### Asset Documentation
- Bank Statements (checking/savings)
- Retirement Accounts (401k, IRA)
- Investment Statements
- Gift Letters

### Property Documentation
- Purchase Agreement
- Appraisal Report
- Homeowners Insurance Quote
- HOA Documents

### Credit Documentation
- Credit Report
- Letter of Explanation

### Legal Documentation
- Divorce Decree
- Bankruptcy Discharge

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- OpenAI API key
- Git

### 1. Clone & Install

```bash
cd C:\GitHub\CMG-DocuMind

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd C:\GitHub\CMG-DocuMind\backend
npm start
```

Backend runs at: `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd C:\GitHub\CMG-DocuMind\frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 📊 Sample Data

The project includes a comprehensive sample loan:

- **Loan ID**: CMG-2024-001
- **Borrowers**: Michael & Jennifer Thompson
- **Loan Amount**: $450,000
- **Property**: Conventional purchase in Irvine, CA
- **Complete MISMO 3.5 data** with borrower, co-borrower, employment, assets, liabilities

Location: `data/loan-files/sample-loan-001.json`

## 🎛️ API Endpoints

### Loans
- `GET /api/loans` - Get all loans
- `GET /api/loans/:loanId` - Get loan details
- `GET /api/loans/:loanId/documents` - Get loan documents
- `GET /api/loans/:loanId/conditions` - Get loan conditions
- `GET /api/loans/:loanId/scorecard` - Get loan scorecard

### Documents
- `POST /api/documents/upload` - Upload & process document
- `GET /api/documents/:documentId` - Get document details

### Rules
- `GET /api/rules` - Get all extraction rules
- `PUT /api/rules` - Update rules
- `GET /api/document-types` - Get document types

### Conditions
- `PUT /api/conditions/:conditionId/clear` - Clear condition
- `POST /api/conditions/:conditionId/request-document` - Request document

## 📐 Rules Configuration

Rules are stored in JSON format at: `data/rules/document-extraction-rules.json`

### Conditional Logic Examples

Rules automatically adapt based on:
- **Loan Type** (Conventional, FHA, VA, USDA)
- **Employment Type** (W2, 1099, Self-Employed)
- **Loan Purpose** (Purchase, Refinance)
- **State** (CA, TX, NY, etc.)
- **Loan Amount** (different requirements for jumbo loans)

Example:
```json
{
  "id": "w2",
  "required": true,
  "conditions": [
    {
      "field": "employment.employmentType",
      "operator": "equals",
      "value": "W2"
    }
  ]
}
```

## 🎯 Scoring System

The scorecard evaluates loans on 4 dimensions:

1. **Document Completeness** (30%) - Are all required documents received?
2. **Data Accuracy** (25%) - Does extracted data match the loan application?
3. **Compliance** (20%) - Any critical issues or warnings?
4. **Ready to Close** (25%) - All conditions cleared?

## 🔄 Workflow

1. **Upload Document** → AI extracts data using GPT-4o
2. **Validate** → Rules engine checks against loan data
3. **Generate Conditions** → System suggests required actions
4. **Review** → Underwriter views side-by-side comparison
5. **Clear Conditions** → Mark as resolved or request new documents
6. **Score** → System calculates readiness score

## 🎨 Frontend Components (To Be Built)

- [ ] Loan Dashboard - View all loans
- [ ] Document Viewer - Side-by-side PDF and extracted data
- [ ] Scorecard Display - Visual scorecard with charts
- [ ] Conditions Manager - Clear/request documents
- [ ] Admin Panel - Edit extraction rules
- [ ] Underwriter Interface - Review and approve

## ⚙️ Configuration Files

### Rules (`data/rules/document-extraction-rules.json`)
- Document types and extraction rules
- Field definitions and validation
- Conditional logic
- Scoring weights

### Sample Loan (`data/loan-files/sample-loan-001.json`)
- Complete MISMO 3.5 loan data
- Borrower & co-borrower information
- Employment, assets, liabilities
- Property details

## 🔮 Next Steps

### Phase 1: Complete Backend ✅
- [x] API server with all endpoints
- [x] Document extraction service (OpenAI)
- [x] Rules engine with validation
- [x] Conditions generator
- [x] Loan data service
- [x] Scorecard generator

### Phase 2: Frontend Development (Next)
- [ ] React app structure and routing
- [ ] Loan dashboard and list
- [ ] Document upload interface
- [ ] PDF viewer component
- [ ] Side-by-side comparison view
- [ ] Scorecard visualization
- [ ] Conditions management UI
- [ ] Admin rules editor

### Phase 3: Sample Documents
- [ ] Generate 20 sample PDF documents
- [ ] Realistic data matching loan application
- [ ] Various quality levels for testing

### Phase 4: Testing & Refinement
- [ ] Test all document types
- [ ] Refine extraction prompts
- [ ] Tune validation rules
- [ ] Improve scorecard weights

## 🧪 Testing the API

You can test the API using curl or Postman:

```bash
# Health check
curl http://localhost:3001/api/health

# Get loan data
curl http://localhost:3001/api/loans/sample-loan-001

# Get document types
curl http://localhost:3001/api/document-types

# Get rules
curl http://localhost:3001/api/rules
```

## 📝 Notes

- This is a **prototype** - uses local JSON files instead of a database
- Designed to demonstrate AI document extraction capabilities
- OpenAI API key required for document processing
- Rules are fully configurable without code changes
- Built for easy expansion and customization

## 🤝 Contributing

This is a prototype project for CMG Financial. To extend:

1. Add new document types to `document-extraction-rules.json`
2. Implement new validation rules in `rulesEngine.js`
3. Create frontend components in `frontend/src/`
4. Add sample documents to `data/sample-documents/`

## 📄 License

Proprietary - CMG Financial

---

**Status**: Backend Complete ✅ | Frontend In Progress 🚧 | Sample Docs Pending ⏳

Built with ❤️ for mortgage professionals
