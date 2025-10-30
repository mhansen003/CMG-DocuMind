import { useState, useEffect } from 'react';
import { getLoan, getLoanDocuments, getLoanScorecard, uploadDocument } from '../api/client';
import DocumentViewer from '../components/DocumentViewer';
import Scorecard from '../components/Scorecard';
import DocumentUpload from '../components/DocumentUpload';
import '../styles/LoanDetails.css';

function LoanDetails({ loanId, onBack, viewMode, setViewMode }) {
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
      {/* Compact Header */}
      <div className="loan-details-header-compact">
        <div className="header-main-row">
          <button className="btn-back" onClick={() => onBack && onBack()}>
            ← Back to Dashboard
          </button>
          <div className="header-info">
            <h2>{loan.borrower.firstName} {loan.borrower.lastName}</h2>
            <span className="separator">•</span>
            <span className="loan-number">Loan # {loan.loanNumber}</span>
            <span className="separator">•</span>
            <span className="stat-inline">${loan.mismo.loanAmountRequested.toLocaleString()}</span>
            <span className="separator">•</span>
            <span className="stat-inline">{loan.mismo.propertyAddress}, {loan.mismo.city}</span>
            <span className="separator">•</span>
            <span className={`status-badge-inline ${loan.processingStatus.stage.toLowerCase().replace(/\s+/g, '-')}`}>
              {loan.processingStatus.stage}
            </span>
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
          <div className="documents-section-split">
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
                {/* Left Sidebar - Documents Menu */}
                <div className="documents-nav">
                  <div className="documents-nav-header">
                    <h3>Documents</h3>
                    <span className="document-count">{documents.length}</span>
                  </div>

                  <div className="documents-menu">
                    {documents.map((doc) => {
                      // Calculate validation summary
                      const criticalCount = doc.validationResults?.issues?.length || 0;
                      const warningCount = doc.validationResults?.warnings?.length || 0;

                      let invalidFields = 0;
                      Object.entries(doc.extractedData?.data || {}).forEach(([fieldName, value]) => {
                        const validation = doc.validationResults?.fieldValidations?.[fieldName];
                        if ((!value || value === '' || value === null || value === undefined) && validation) {
                          invalidFields++;
                        } else if (validation?.message && validation?.isValid === false) {
                          const msg = validation.message.toLowerCase();
                          if (!msg.includes('format') && !msg.includes('pattern') && !msg.includes('length') &&
                              !msg.includes('invalid') && !msg.includes('must match')) {
                            invalidFields++;
                          }
                        }
                      });

                      const hasIssues = criticalCount > 0 || warningCount > 0 || invalidFields > 0;

                      return (
                        <div
                          key={doc.id}
                          className={`document-menu-item ${selectedDocument?.id === doc.id ? 'active' : ''}`}
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <div className="doc-icon">📄</div>
                          <div className="doc-info">
                            <div className="doc-name" title={doc.fileName}>{doc.fileName}</div>
                            <div className="doc-type">{doc.documentType}</div>
                          </div>
                          <div className="doc-status">
                            {criticalCount > 0 && (
                              <span className="status-indicator critical" title={`${criticalCount} critical issues`}>
                                {criticalCount}
                              </span>
                            )}
                            {warningCount > 0 && (
                              <span className="status-indicator warning" title={`${warningCount} warnings`}>
                                {warningCount}
                              </span>
                            )}
                            {invalidFields > 0 && (
                              <span className="status-indicator invalid" title={`${invalidFields} invalid fields`}>
                                {invalidFields}
                              </span>
                            )}
                            {!hasIssues && (
                              <span className="status-indicator success" title="All valid">✓</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Area - Document Viewer */}
                <div className="document-viewer-area">
                  {selectedDocument ? (
                    <DocumentViewer
                      document={selectedDocument}
                      loanData={loan}
                    />
                  ) : (
                    <div className="no-document-selected">
                      <div className="no-document-icon">📄</div>
                      <h3>Select a Document</h3>
                      <p>Choose a document from the list to view its details and validation results</p>
                    </div>
                  )}
                </div>
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
