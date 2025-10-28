const fs = require('fs').promises;
const path = require('path');

const LOAN_FILES_DIR = path.join(__dirname, '../../data/loan-files');
const DOCUMENTS_DIR = path.join(__dirname, '../../data/sample-documents');

/**
 * Get loan data by ID
 * @param {string} loanId - Loan ID
 * @returns {Promise<Object>} Loan data
 */
async function getLoanData(loanId) {
  try {
    const loanFilePath = path.join(LOAN_FILES_DIR, `${loanId}.json`);
    const loanData = await fs.readFile(loanFilePath, 'utf8');
    return JSON.parse(loanData);
  } catch (error) {
    console.error(`Error loading loan ${loanId}:`, error);
    throw new Error(`Loan not found: ${loanId}`);
  }
}

/**
 * Get all loans
 * @returns {Promise<Array>} Array of loan summary objects
 */
async function getAllLoans() {
  try {
    const files = await fs.readdir(LOAN_FILES_DIR);
    const loanFiles = files.filter(f => f.endsWith('.json'));

    const loans = [];
    for (const file of loanFiles) {
      const loanData = await fs.readFile(path.join(LOAN_FILES_DIR, file), 'utf8');
      const loan = JSON.parse(loanData);

      loans.push({
        loanId: loan.loanId,
        loanNumber: loan.loanNumber,
        borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
        loanAmount: loan.mismo.loanAmountRequested,
        propertyAddress: loan.mismo.propertyAddress,
        status: loan.processingStatus.stage,
        lastUpdated: loan.processingStatus.lastUpdated
      });
    }

    return loans;
  } catch (error) {
    console.error('Error loading loans:', error);
    throw error;
  }
}

/**
 * Save document record to loan file
 * @param {string} loanId - Loan ID
 * @param {Object} documentRecord - Document record to save
 * @returns {Promise<void>}
 */
async function saveDocumentRecord(loanId, documentRecord) {
  try {
    const loanFilePath = path.join(LOAN_FILES_DIR, `${loanId}.json`);
    const loanData = await getLoanData(loanId);

    // Initialize documents array if it doesn't exist
    if (!loanData.documents) {
      loanData.documents = [];
    }

    // Add the new document
    loanData.documents.push(documentRecord);

    // Update the loan file
    await fs.writeFile(loanFilePath, JSON.stringify(loanData, null, 2));
    console.log(`✅ Document saved to loan ${loanId}`);
  } catch (error) {
    console.error('Error saving document record:', error);
    throw error;
  }
}

/**
 * Get all documents for a loan
 * @param {string} loanId - Loan ID
 * @returns {Promise<Array>} Array of document records
 */
async function getDocumentsForLoan(loanId) {
  try {
    const loanData = await getLoanData(loanId);
    return loanData.documents || [];
  } catch (error) {
    console.error(`Error loading documents for loan ${loanId}:`, error);
    throw error;
  }
}

/**
 * Get specific document
 * @param {string} documentId - Document ID
 * @returns {Promise<Object>} Document record
 */
async function getDocument(documentId) {
  try {
    // Search through all loan files to find the document
    const files = await fs.readdir(LOAN_FILES_DIR);
    const loanFiles = files.filter(f => f.endsWith('.json'));

    for (const file of loanFiles) {
      const loanData = await fs.readFile(path.join(LOAN_FILES_DIR, file), 'utf8');
      const loan = JSON.parse(loanData);

      if (loan.documents) {
        const document = loan.documents.find(d => d.id === documentId);
        if (document) {
          return document;
        }
      }
    }

    throw new Error(`Document not found: ${documentId}`);
  } catch (error) {
    console.error(`Error loading document ${documentId}:`, error);
    throw error;
  }
}

/**
 * Update document status
 * @param {string} loanId - Loan ID
 * @param {string} documentId - Document ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
async function updateDocumentStatus(loanId, documentId, status) {
  try {
    const loanData = await getLoanData(loanId);

    if (!loanData.documents) {
      throw new Error('No documents found for loan');
    }

    const docIndex = loanData.documents.findIndex(d => d.id === documentId);
    if (docIndex === -1) {
      throw new Error(`Document not found: ${documentId}`);
    }

    loanData.documents[docIndex].status = status;
    loanData.documents[docIndex].lastUpdated = new Date().toISOString();

    const loanFilePath = path.join(LOAN_FILES_DIR, `${loanId}.json`);
    await fs.writeFile(loanFilePath, JSON.stringify(loanData, null, 2));

    console.log(`✅ Document ${documentId} status updated to ${status}`);
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}

module.exports = {
  getLoanData,
  getAllLoans,
  saveDocumentRecord,
  getDocumentsForLoan,
  getDocument,
  updateDocumentStatus
};
