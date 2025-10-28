const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import services
const documentExtractor = require('./services/documentExtractor');
const rulesEngine = require('./services/rulesEngine');
const loanDataService = require('./services/loanDataService');
const conditionsService = require('./services/conditionsService');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));
app.use('/sample-documents', express.static(path.join(__dirname, '../data/sample-documents')));

// Debug endpoint to verify server config
app.get('/api/debug/paths', (req, res) => {
  res.json({
    uploadsPath: path.join(__dirname, '../data/uploads'),
    sampleDocsPath: path.join(__dirname, '../data/sample-documents'),
    serverRestarted: new Date().toISOString()
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../data/sample-documents');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ============================================
// LOAN ENDPOINTS
// ============================================

// Get loan data
app.get('/api/loans/:loanId', async (req, res) => {
  try {
    const loanData = await loanDataService.getLoanData(req.params.loanId);
    res.json(loanData);
  } catch (error) {
    console.error('Error fetching loan data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all loans
app.get('/api/loans', async (req, res) => {
  try {
    const loans = await loanDataService.getAllLoans();
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DOCUMENT ENDPOINTS
// ============================================

// Upload and process document
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    const { loanId, documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!loanId || !documentType) {
      return res.status(400).json({ error: 'loanId and documentType are required' });
    }

    // Extract data from document using AI
    const extractedData = await documentExtractor.extractDocumentData(
      req.file.path,
      documentType
    );

    // Get loan data for comparison
    const loanData = await loanDataService.getLoanData(loanId);

    // Validate extracted data against rules
    const validationResults = await rulesEngine.validateDocument(
      extractedData,
      documentType,
      loanData
    );

    // Generate conditions if needed
    const conditions = await conditionsService.generateConditions(
      validationResults,
      documentType,
      loanData
    );

    // Save document metadata
    const documentRecord = {
      id: Date.now().toString(),
      loanId,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      uploadDate: new Date().toISOString(),
      extractedData,
      validationResults,
      conditions,
      status: validationResults.isValid ? 'approved' : 'needs-review'
    };

    await loanDataService.saveDocumentRecord(loanId, documentRecord);

    res.json({
      success: true,
      document: documentRecord
    });
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all documents for a loan
app.get('/api/loans/:loanId/documents', async (req, res) => {
  try {
    const documents = await loanDataService.getDocumentsForLoan(req.params.loanId);
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get specific document
app.get('/api/documents/:documentId', async (req, res) => {
  try {
    const document = await loanDataService.getDocument(req.params.documentId);
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// RULES ENDPOINTS
// ============================================

// Get all extraction rules
app.get('/api/rules', async (req, res) => {
  try {
    const rules = await rulesEngine.getRules();
    res.json(rules);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update rules
app.put('/api/rules', async (req, res) => {
  try {
    await rulesEngine.updateRules(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating rules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get document types
app.get('/api/document-types', async (req, res) => {
  try {
    const documentTypes = await rulesEngine.getDocumentTypes();
    res.json(documentTypes);
  } catch (error) {
    console.error('Error fetching document types:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// CONDITIONS ENDPOINTS
// ============================================

// Get conditions for a loan
app.get('/api/loans/:loanId/conditions', async (req, res) => {
  try {
    const conditions = await conditionsService.getConditionsForLoan(req.params.loanId);
    res.json(conditions);
  } catch (error) {
    console.error('Error fetching conditions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear/resolve a condition
app.put('/api/conditions/:conditionId/clear', async (req, res) => {
  try {
    const { notes } = req.body;
    await conditionsService.clearCondition(req.params.conditionId, notes);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing condition:', error);
    res.status(500).json({ error: error.message });
  }
});

// Request additional document
app.post('/api/conditions/:conditionId/request-document', async (req, res) => {
  try {
    const { documentType, notes } = req.body;
    await conditionsService.requestDocument(req.params.conditionId, documentType, notes);
    res.json({ success: true });
  } catch (error) {
    console.error('Error requesting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// SCORECARD ENDPOINTS
// ============================================

// Get loan scorecard
app.get('/api/loans/:loanId/scorecard', async (req, res) => {
  try {
    const loanData = await loanDataService.getLoanData(req.params.loanId);
    const documents = await loanDataService.getDocumentsForLoan(req.params.loanId);
    const conditions = await conditionsService.getConditionsForLoan(req.params.loanId);

    const scorecard = await rulesEngine.generateScorecard(loanData, documents, conditions);
    res.json(scorecard);
  } catch (error) {
    console.error('Error generating scorecard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CMG DocuMind API'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ CMG DocuMind API running on http://localhost:${PORT}`);
  console.log(`📄 API Documentation: http://localhost:${PORT}/api/health`);
});

module.exports = app;
