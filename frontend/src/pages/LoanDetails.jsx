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
                {/* Left Sidebar - Documents List */}
                <div className="documents-sidebar">
                  <div className="documents-list-header">
                    <h3>Uploaded Documents</h3>
                    <div className="view-toggle">
                      <button
                        className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                        onClick={() => setViewMode('cards')}
                        title="Card View"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1"/>
                          <rect x="14" y="3" width="7" height="7" rx="1"/>
                          <rect x="3" y="14" width="7" height="7" rx="1"/>
                          <rect x="14" y="14" width="7" height="7" rx="1"/>
                        </svg>
                        <span>Cards</span>
                      </button>
                      <button
                        className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table View"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <line x1="3" y1="12" x2="21" y2="12"/>
                          <line x1="3" y1="18" x2="21" y2="18"/>
                        </svg>
                        <span>Table</span>
                      </button>
                    </div>
                  </div>

                  {viewMode === 'cards' ? (
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
                  ) : (
                    <div className="documents-table-container">
                      <table className="documents-table">
                        <thead>
                          <tr>
                            <th>Document Name</th>
                            <th>Type</th>
                            <th>Upload Date</th>
                            <th>Fields</th>
                            <th>Validation</th>
                            <th>Status</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => {
                            const criticalCount = doc.validationResults?.issues?.length || 0;
                            const warningCount = doc.validationResults?.warnings?.length || 0;
                            const totalFields = Object.keys(doc.extractedData?.data || {}).length;

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

                            return (
                              <tr
                                key={doc.id}
                                className={`document-row ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                                onClick={() => setSelectedDocument(doc)}
                              >
                                <td className="document-name-cell" title={doc.fileName}>
                                  {doc.fileName}
                                </td>
                                <td className="document-type-cell">
                                  <span className="document-type-badge">
                                    📋 {doc.documentType}
                                  </span>
                                </td>
                                <td className="date-cell">
                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                </td>
                                <td className="fields-cell">
                                  {totalFields} fields
                                </td>
                                <td className="validation-cell">
                                  {criticalCount > 0 && (
                                    <span className="validation-badge critical">
                                      🔴 {criticalCount}
                                    </span>
                                  )}
                                  {warningCount > 0 && (
                                    <span className="validation-badge warning">
                                      🟡 {warningCount}
                                    </span>
                                  )}
                                  {invalidFields > 0 && (
                                    <span className="validation-badge invalid-field">
                                      ✗ {invalidFields}
                                    </span>
                                  )}
                                  {criticalCount === 0 && warningCount === 0 && invalidFields === 0 && (
                                    <span className="validation-badge success">
                                      ✓ Valid
                                    </span>
                                  )}
                                </td>
                                <td className="status-cell">
                                  <span className={`document-status ${doc.status}`}>
                                    {doc.status}
                                  </span>
                                </td>
                                <td className="action-cell">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                  </svg>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Right Main Area - Document Viewer */}
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
