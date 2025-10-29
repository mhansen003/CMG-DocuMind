import { useState, useEffect } from 'react';
import { getLoan, getLoanDocuments, getLoanScorecard, uploadDocument } from '../api/client';
import DocumentViewer from '../components/DocumentViewer';
import Scorecard from '../components/Scorecard';
import DocumentUpload from '../components/DocumentUpload';
import '../styles/LoanDetails.css';

function LoanDetails({ loanId, onBack }) {
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents'); // documents, scorecard, upload

  useEffect(() => {
    if (loanId) {
      fetchLoanData();
    }
  }, [loanId]);

  const fetchLoanData = async () => {
    try {
      setLoading(true);
      const [loanRes, docsRes, scorecardRes] = await Promise.all([
        getLoan(loanId),
        getLoanDocuments(loanId),
        getLoanScorecard(loanId)
      ]);

      setLoan(loanRes.data);
      setDocuments(docsRes.data);
      setScorecard(scorecardRes.data);
    } catch (error) {
      console.error('Error fetching loan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (file, documentType) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('loanId', loanId);
      formData.append('documentType', documentType);

      await uploadDocument(formData);

      // Refresh data
      await fetchLoanData();

      // Switch to documents tab
      setActiveTab('documents');
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  if (!loanId) {
    return (
      <div className="error">
        <p>No loan selected</p>
        <button className="btn btn-primary" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>Loading loan details...</span>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="error">
        <p>Loan not found</p>
        <button className="btn btn-primary" onClick={onBack}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="loan-details">
      {/* Header */}
      <div className="loan-details-header">
        <div className="header-top-row">
          <div>
            <button className="btn-back" onClick={() => onBack && onBack()}>
              ← Back to Dashboard
            </button>
            <h2>{loan.borrower.firstName} {loan.borrower.lastName}</h2>
            <p className="loan-number">Loan # {loan.loanNumber}</p>
          </div>
        </div>
        <div className="loan-quick-stats">
          <div className="quick-stat">
            <label>Loan Amount</label>
            <div className="stat-value">${loan.mismo.loanAmountRequested.toLocaleString()}</div>
          </div>
          <div className="quick-stat">
            <label>Property</label>
            <div className="stat-value">{loan.mismo.propertyAddress}, {loan.mismo.city}</div>
          </div>
          <div className="quick-stat">
            <label>Status</label>
            <div className="stat-value">{loan.processingStatus.stage}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          📄 Documents ({documents.length})
        </button>
        <button
          className={`tab ${activeTab === 'scorecard' ? 'active' : ''}`}
          onClick={() => setActiveTab('scorecard')}
        >
          📊 Scorecard
        </button>
        <button
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          ⬆️ Upload Document
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'documents' && (
          <div className="documents-section">
            {documents.length === 0 ? (
              <div className="empty-state">
                <h3>No Documents Uploaded Yet</h3>
                <p>Upload documents to begin processing</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload First Document
                </button>
              </div>
            ) : (
              <>
                <div className="documents-list">
                  <h3>Uploaded Documents</h3>
                  <div className="documents-grid">
                    {documents.map((doc) => {
                      // Calculate validation summary - only count real issues (mismatches, missing data)
                      const criticalCount = doc.validationResults?.issues?.length || 0;
                      const warningCount = doc.validationResults?.warnings?.length || 0;
                      const totalFields = Object.keys(doc.extractedData?.data || {}).length;

                      // Count only real field errors (not formatting issues)
                      let invalidFields = 0;
                      Object.entries(doc.extractedData?.data || {}).forEach(([fieldName, value]) => {
                        const validation = doc.validationResults?.fieldValidations?.[fieldName];

                        // Check for missing required fields
                        if ((!value || value === '' || value === null || value === undefined) && validation) {
                          invalidFields++;
                        }
                        // Check for backend validation errors that are NOT formatting-related
                        else if (validation?.message && validation?.isValid === false) {
                          const msg = validation.message.toLowerCase();
                          // Ignore formatting/pattern/length errors
                          if (!msg.includes('format') && !msg.includes('pattern') && !msg.includes('length') &&
                              !msg.includes('invalid') && !msg.includes('must match')) {
                            invalidFields++;
                          }
                        }
                        // Note: Loan data mismatches are handled by the DocumentViewer component
                        // We don't check them here to avoid redundant API calls
                      });

                      return (
                        <div
                          key={doc.id}
                          className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          {/* Header with document name and status */}
                          <div className="document-item-header">
                            <div className="document-name" title={doc.fileName}>{doc.fileName}</div>
                            <div className={`document-status ${doc.status}`}>
                              {doc.status}
                            </div>
                          </div>

                          {/* Body with icon and info */}
                          <div className="document-item-body">
                            <div className="document-icon-container">
                              <div className="document-icon">
                                <div className="doc-line"></div>
                                <div className="doc-line"></div>
                                <div className="doc-line"></div>
                                <div className="doc-line"></div>
                                <div className="doc-line"></div>
                              </div>
                            </div>
                            <div className="document-info">
                              <div className="document-meta">
                                <div className="document-meta-item">
                                  <span className="document-meta-icon">📋</span>
                                  <span>{doc.documentType}</span>
                                </div>
                                <div className="document-meta-item">
                                  <span className="document-meta-icon">📅</span>
                                  <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                                </div>
                                <div className="document-meta-item">
                                  <span className="document-meta-icon">📊</span>
                                  <span>{totalFields} fields</span>
                                </div>
                              </div>

                              {/* Validation Summary Badges */}
                              <div className="document-validation-summary">
                                {criticalCount > 0 && (
                                  <span className="validation-badge critical" title={`${criticalCount} critical issue(s)`}>
                                    🔴 {criticalCount} Critical
                                  </span>
                                )}
                                {warningCount > 0 && (
                                  <span className="validation-badge warning" title={`${warningCount} warning(s)`}>
                                    🟡 {warningCount} Warning{warningCount > 1 ? 's' : ''}
                                  </span>
                                )}
                                {invalidFields > 0 && (
                                  <span className="validation-badge invalid-field" title={`${invalidFields} field(s) failed validation`}>
                                    ✗ {invalidFields} Failed
                                  </span>
                                )}
                                {criticalCount === 0 && warningCount === 0 && invalidFields === 0 && (
                                  <span className="validation-badge success" title="All validations passed">
                                    ✓ All Valid
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedDocument && (
                  <DocumentViewer
                    document={selectedDocument}
                    loanData={loan}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'scorecard' && scorecard && (
          <Scorecard scorecard={scorecard} loan={loan} documents={documents} />
        )}

        {activeTab === 'upload' && (
          <DocumentUpload
            loanId={loanId}
            onUpload={handleDocumentUpload}
          />
        )}
      </div>
    </div>
  );
}

export default LoanDetails;
