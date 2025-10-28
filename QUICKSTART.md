# 🚀 Quick Start Guide - CMG DocuMind

## What's Been Built So Far ✅

### Backend (COMPLETE)
✅ Full Express API server with RESTful endpoints
✅ OpenAI GPT-4o document extraction service
✅ Rules engine with conditional logic (20+ document types)
✅ Loan data management service
✅ Conditions generator with suggested actions
✅ Scorecard calculator (4 scoring dimensions)
✅ Sample MISMO 3.5 loan data (comprehensive 1003)

### Frontend (PENDING)
⏳ React application structure
⏳ Document viewer
⏳ Scorecard dashboard
⏳ Admin interface

## 🎯 Next Session - What to Build

When you return, here's the priority order:

### 1. **Basic React App Structure** (30 min)
Create the main app layout, routing, and navigation

### 2. **Loan Dashboard** (1 hour)
Display list of loans with basic info, clickable to details

### 3. **Document Upload Interface** (1 hour)
Simple form to upload PDFs and select document type

### 4. **PDF Viewer + Extracted Data** (2 hours)
Side-by-side view showing PDF and extracted fields

### 5. **Scorecard Display** (1 hour)
Visual representation of the loan scorecard with progress bars

### 6. **Conditions Management** (1 hour)
List conditions with ability to clear or request documents

## 🔧 Before You Start

1. **Get OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create new key
   - Copy to `backend/.env`

2. **Install Dependencies** (if not done)
```bash
cd C:\GitHub\CMG-DocuMind\backend
npm install

cd C:\GitHub\CMG-DocuMind\frontend
npm install
```

3. **Create .env file**
```bash
cd C:\GitHub\CMG-DocuMind\backend
copy .env.example .env
# Edit .env and add your OpenAI API key
```

## 🏃 Running the App

**Terminal 1 - Backend:**
```bash
cd C:\GitHub\CMG-DocuMind\backend
npm start
```
Opens at: http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd C:\GitHub\CMG-DocuMind\frontend
npm run dev
```
Opens at: http://localhost:5173

## 🧪 Testing the Backend

Once the backend is running, test these endpoints:

```bash
# Check health
curl http://localhost:3001/api/health

# Get the sample loan
curl http://localhost:3001/api/loans/sample-loan-001

# Get all document types
curl http://localhost:3001/api/document-types

# Get extraction rules
curl http://localhost:3001/api/rules
```

## 📁 Key Files to Know

### Backend
- `backend/server.js` - Main API server
- `backend/services/documentExtractor.js` - AI extraction
- `backend/services/rulesEngine.js` - Validation & scoring
- `data/rules/document-extraction-rules.json` - All rules (EDIT THIS!)
- `data/loan-files/sample-loan-001.json` - Sample loan data

### Frontend (To Create)
- `frontend/src/App.jsx` - Main app component
- `frontend/src/pages/` - Page components
- `frontend/src/components/` - Reusable components

## 🎨 Suggested Component Structure

```
frontend/src/
├── App.jsx                      # Main app with routing
├── pages/
│   ├── Dashboard.jsx            # Loan list
│   ├── LoanDetails.jsx          # Loan details page
│   ├── DocumentViewer.jsx       # Side-by-side view
│   ├── Scorecard.jsx            # Scorecard display
│   └── Admin.jsx                # Rules editor
├── components/
│   ├── LoanCard.jsx             # Loan summary card
│   ├── DocumentUpload.jsx       # Upload form
│   ├── PDFViewer.jsx            # PDF display
│   ├── ExtractedData.jsx        # Data table
│   ├── ConditionsList.jsx       # Conditions
│   └── ScoreCircle.jsx          # Score visualization
└── api/
    └── client.js                # Axios API client
```

## 💡 Implementation Tips

### PDF Viewing
Use `react-pdf` library (already installed):
```javascript
import { Document, Page } from 'react-pdf';
```

### API Calls
Create an axios instance:
```javascript
import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:3001/api'
});
```

### State Management
Start simple with `useState` and `useEffect`. Add Context or Redux later if needed.

## 🎯 Suggested First Component

**Create `frontend/src/pages/Dashboard.jsx`:**

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/api/loans')
      .then(res => {
        setLoans(res.data);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>CMG DocuMind - Loans</h1>
      {loans.map(loan => (
        <div key={loan.loanId}>
          <h2>{loan.borrowerName}</h2>
          <p>{loan.propertyAddress}</p>
          <p>${loan.loanAmount.toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
```

## 📚 Documentation

- Full documentation in `README.md`
- API endpoints documented in backend code
- Rules schema in `document-extraction-rules.json`

## 🤔 Questions to Consider

Before building the frontend, decide:
1. **Styling**: Tailwind CSS? Material-UI? Plain CSS?
2. **Layout**: Single page with tabs, or multi-page with routing?
3. **Upload flow**: Drag-drop? Traditional file input?
4. **Data refresh**: Manual refresh button, or auto-refresh?

## 🎬 When You're Ready

1. Start both servers (backend + frontend)
2. Test the backend endpoints work
3. Begin building React components
4. Start with the Dashboard → then Document Upload → then Viewer
5. Ask me questions as you go!

**Let's build this! 🚀**
