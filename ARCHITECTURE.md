# 🏛️ CMG DocuMind - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Dashboard  │  │  Doc Viewer  │  │  Admin Interface   │   │
│  │              │  │              │  │                    │   │
│  │  - Loan List │  │  - PDF View  │  │  - Edit Rules      │   │
│  │  - Scorecard │  │  - Extract   │  │  - Manage Docs     │   │
│  │  - Status    │  │  - Validate  │  │  - Configure       │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│                                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP/REST API
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Backend API (Express)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  API Endpoints                           │   │
│  │  /api/loans  /api/documents  /api/rules  /api/conditions│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Document   │  │    Rules     │  │  Conditions  │        │
│  │  Extractor   │  │    Engine    │  │   Service    │        │
│  │              │  │              │  │              │        │
│  │ - Parse PDF  │  │ - Validate   │  │ - Generate   │        │
│  │ - Call AI    │  │ - Score      │  │ - Track      │        │
│  │ - Structure  │  │ - Check      │  │ - Clear      │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────┐
│                       External Services                           │
│                                                                   │
│  ┌──────────────────┐    ┌────────────────────────────────┐    │
│  │   OpenAI GPT-4o  │    │      Local Storage (JSON)      │    │
│  │                  │    │                                │    │
│  │  - Extract Data  │    │  /data/loan-files/*.json       │    │
│  │  - Understand    │    │  /data/rules/*.json            │    │
│  │  - Structure     │    │  /data/conditions.json         │    │
│  └──────────────────┘    │  /data/sample-documents/*.pdf  │    │
│                          └────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Document Upload & Processing

```
1. User uploads PDF
        ↓
2. Frontend sends to /api/documents/upload
        ↓
3. Backend receives file + document type
        ↓
4. Document Extractor Service:
   - Reads PDF
   - Extracts text
   - Builds AI prompt from rules
   - Calls OpenAI GPT-4o
   - Gets structured JSON back
        ↓
5. Rules Engine Service:
   - Gets loan data
   - Validates extracted data
   - Checks field-level rules
   - Checks document-level rules
   - Returns validation results
        ↓
6. Conditions Service:
   - Analyzes validation issues
   - Generates conditions
   - Suggests corrective actions
   - Saves conditions
        ↓
7. Backend saves document record to loan file
        ↓
8. Returns response to frontend:
   - Extracted data
   - Validation results
   - Conditions
   - Status
        ↓
9. Frontend displays results
```

### Scorecard Generation

```
1. User requests loan scorecard
        ↓
2. Frontend calls /api/loans/:loanId/scorecard
        ↓
3. Backend collects:
   - Loan data
   - All uploaded documents
   - All conditions
        ↓
4. Rules Engine calculates:
   - Document Completeness (30%)
     → Required vs Received
   - Data Accuracy (25%)
     → Valid vs Invalid docs
   - Compliance (20%)
     → Issues count
   - Ready to Close (25%)
     → All conditions cleared?
        ↓
5. Returns scorecard with:
   - Overall score (0-100)
   - Component scores
   - Missing documents
   - Active conditions
        ↓
6. Frontend visualizes scorecard
```

## Component Details

### Document Extractor Service

**Responsibilities:**
- Parse PDF files
- Extract text content
- Build dynamic prompts
- Call OpenAI API
- Structure responses
- Calculate confidence

**Technologies:**
- pdf-parse (PDF reading)
- OpenAI Node.js SDK
- JSON structured output

**Key Functions:**
```javascript
extractDocumentData(filePath, documentType)
extractMultipleDocuments(documents)
buildExtractionPrompt(docConfig, text)
calculateConfidence(data, rules)
```

### Rules Engine Service

**Responsibilities:**
- Load/update rules from JSON
- Validate extracted data
- Apply conditional logic
- Generate scorecards
- Determine requirements

**Key Functions:**
```javascript
getRules()
validateDocument(extracted, type, loan)
generateScorecard(loan, docs, conditions)
getRequiredDocuments(loan)
evaluateCondition(condition, loanData)
```

**Conditional Logic:**
- Loan Type (Conv, FHA, VA, USDA)
- Employment Type (W2, 1099, Self-Employed)
- Loan Purpose (Purchase, Refi)
- State-specific rules
- Loan amount thresholds

### Conditions Service

**Responsibilities:**
- Auto-generate conditions
- Suggest actions
- Track status
- Handle document requests
- Statistics

**Condition Types:**
- Critical (stops closing)
- Warning (needs review)
- Info (FYI)

**Condition Status:**
- Open
- Cleared
- Pending Document

### Loan Data Service

**Responsibilities:**
- CRUD operations
- Document management
- File-based storage
- Status tracking

**Data Structure:**
```
Loan File:
├── Loan Info (MISMO 3.5)
├── Borrower(s)
├── Employment
├── Assets & Liabilities
├── Property Details
└── Documents Array
    ├── Document 1
    │   ├── Metadata
    │   ├── Extracted Data
    │   ├── Validation Results
    │   └── Conditions
    └── Document 2
        └── ...
```

## API Endpoints

### Loans
```
GET    /api/loans                    → Get all loans
GET    /api/loans/:id                → Get loan details
GET    /api/loans/:id/documents      → Get loan documents
GET    /api/loans/:id/conditions     → Get loan conditions
GET    /api/loans/:id/scorecard      → Get loan scorecard
```

### Documents
```
POST   /api/documents/upload         → Upload & process
GET    /api/documents/:id            → Get document
GET    /api/document-types           → Get types list
```

### Rules
```
GET    /api/rules                    → Get all rules
PUT    /api/rules                    → Update rules
```

### Conditions
```
PUT    /api/conditions/:id/clear           → Clear condition
POST   /api/conditions/:id/request-document → Request doc
```

## Security Considerations (Future)

### Current State (Prototype)
- ✅ CORS enabled
- ❌ No authentication
- ❌ No authorization
- ❌ No rate limiting
- ❌ No input sanitization
- ❌ No file size limits

### Production Requirements
- 🔒 JWT authentication
- 🔒 Role-based access control
- 🔒 Rate limiting
- 🔒 Input validation
- 🔒 File size/type restrictions
- 🔒 SQL injection prevention
- 🔒 XSS protection
- 🔒 HTTPS only
- 🔒 Audit logging

## Scalability Considerations

### Current Limitations
- Single server
- No load balancing
- File-based storage
- Synchronous processing
- No caching

### Production Scaling
- Multiple API servers
- Load balancer
- Database (PostgreSQL)
- Message queue (RabbitMQ)
- Redis caching
- CDN for documents
- Horizontal scaling
- Container orchestration

## Technology Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite | Fast, modern, good DX |
| Backend | Node.js + Express | JavaScript everywhere, async |
| AI | OpenAI GPT-4o | Best document understanding |
| PDF | pdf-parse | Simple, reliable |
| Storage | JSON files | Prototype simplicity |
| Future DB | PostgreSQL | Robust, JSONB support |

## Deployment Architecture (Future)

```
┌────────────────────────────────────────────┐
│              Load Balancer                 │
│           (nginx / AWS ALB)                │
└───────────┬────────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
┌───▼───┐       ┌───▼───┐
│ API 1 │       │ API 2 │  (Horizontal scaling)
└───┬───┘       └───┬───┘
    │               │
    └───────┬───────┘
            │
    ┌───────▼────────┐
    │   PostgreSQL   │  (Primary + Replica)
    └────────────────┘
            │
    ┌───────▼────────┐
    │  S3 / Storage  │  (Document files)
    └────────────────┘
```

## Error Handling

### Current Approach
- Try-catch blocks
- Console logging
- HTTP status codes
- Error messages in response

### Production Needs
- Structured logging (Winston)
- Error tracking (Sentry)
- Detailed error codes
- User-friendly messages
- Retry logic
- Circuit breakers

## Monitoring & Observability (Future)

- Request logging
- Performance metrics
- Error rates
- API latency
- Document processing times
- OpenAI API costs
- Success rates by document type
- User analytics

## Testing Strategy (Future)

```
Unit Tests:
├── Rules Engine logic
├── Validation functions
├── Scoring calculations
└── Utility functions

Integration Tests:
├── API endpoints
├── Document upload flow
├── Extraction pipeline
└── Database operations

E2E Tests:
├── Complete workflows
├── UI interactions
└── Document processing
```

---

**Architecture Status**: Foundation Complete, Ready for Frontend & Enhancement
