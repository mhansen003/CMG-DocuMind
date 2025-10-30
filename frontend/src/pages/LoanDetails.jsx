import { useState, useEffect } from 'react';
import { getLoan, getLoanDocuments, getLoanScorecard, uploadDocument, getLoanDispositions, updateDisposition } from '../api/client';
import DocumentViewer from '../components/DocumentViewer';
import Scorecard from '../components/Scorecard';
import AgentDispositionQueue from '../components/AgentDispositionQueue';
import '../styles/LoanDetails.css';

function LoanDetails({ loanId, onBack, viewMode, setViewMode }) {
  const [loan, setLoan] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [scorecard, setScorecard] = useState(null);
  const [dispositions, setDispositions] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents'); // documents, scorecard, dispositions

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

      // Fetch dispositions (with fallback to mock data if API not ready)
      try {
        const dispositionsRes = await getLoanDispositions(loanId);
        setDispositions(dispositionsRes.data);
      } catch (dispError) {
        // Use mock data for demo if API endpoint not available
        console.log('Using mock disposition data');
        setDispositions(getMockDispositions(loanId));
      }
    } catch (error) {
      console.error('Error fetching loan data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockDispositions = (loanId) => {
    return [
      {
        id: 'disp-001',
        agentName: 'Income Verification Agent',
        agentType: 'IncomeVerification',
        priority: 'high',
        status: 'open',
        title: 'Income discrepancy detected',
        description: 'Monthly income from pay stub ($5,000) does not match calculated monthly income from W2 ($4,000). This represents a 25% variance that exceeds acceptable tolerance levels.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        documentIds: ['doc-1', 'doc-2'],
        agentPrompt: `You are an Income Verification Agent for mortgage underwriting. Your task is to:

1. Extract monthly income figures from all pay stubs provided
2. Extract annual income from W2 forms and calculate monthly average
3. Compare the two income sources and identify discrepancies
4. Flag any variance exceeding 10% threshold for underwriter review
5. Provide clear reasoning for any flagged issues

Guidelines:
- Use conservative estimates when income varies
- Account for bonuses, overtime, and commissions separately
- Consider year-to-date figures for accuracy
- Flag missing documentation that could clarify discrepancies`,
        agentSteps: [
          {
            step: 1,
            action: 'Document Analysis',
            description: 'Scanned and identified 2 relevant documents: Pay Stub (October 2024) and W2 Form (2023)',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 1000).toISOString(),
            status: 'completed'
          },
          {
            step: 2,
            action: 'Pay Stub Extraction',
            description: 'Extracted monthly gross income from pay stub: $5,000. This represents regular salary without bonuses or overtime.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5000).toISOString(),
            status: 'completed'
          },
          {
            step: 3,
            action: 'W2 Analysis',
            description: 'Extracted annual income from W2: $48,000. Calculated monthly average: $48,000 ÷ 12 = $4,000',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 8000).toISOString(),
            status: 'completed'
          },
          {
            step: 4,
            action: 'Variance Calculation',
            description: 'Computed variance: ($5,000 - $4,000) ÷ $4,000 = 25% difference. This exceeds the 10% tolerance threshold.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10000).toISOString(),
            status: 'completed'
          },
          {
            step: 5,
            action: 'Risk Assessment',
            description: 'Flagged as HIGH priority due to significant income discrepancy. Possible causes: salary increase, bonus income not reflected in W2, or data entry error.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 12000).toISOString(),
            status: 'completed'
          },
          {
            step: 6,
            action: 'Disposition Created',
            description: 'Created disposition for underwriter review with multiple resolution options.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 15000).toISOString(),
            status: 'completed'
          }
        ],
        possibleActions: [
          { id: 'accept', label: 'Accept as Valid', type: 'success' },
          { id: 'request_docs', label: 'Request Additional Pay Stubs', type: 'warning' },
          { id: 'escalate', label: 'Escalate to Senior Underwriter', type: 'danger' },
          { id: 'dismiss', label: 'Dismiss Issue', type: 'neutral' }
        ],
        metadata: {
          'Pay Stub Monthly Income': '$5,000',
          'W2 Calculated Monthly': '$4,000',
          'Variance': '25%',
          'Tolerance Threshold': '10%'
        }
      },
      {
        id: 'disp-002',
        agentName: 'Employment Verification Agent',
        agentType: 'EmploymentVerification',
        priority: 'medium',
        status: 'open',
        title: 'Employment tenure verification needed',
        description: 'Current employer listed as "Acme Corp" with start date of Jan 2024. Pay stub shows only 3 months of history. Recommend verification of employment letter or additional documentation.',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        documentIds: ['doc-1'],
        agentPrompt: `You are an Employment Verification Agent. Your responsibilities include:

1. Verify current employment status from pay stubs and documentation
2. Confirm employment tenure meets minimum guideline requirements (typically 6+ months)
3. Cross-reference employer information across multiple documents
4. Identify gaps in employment history
5. Recommend Verification of Employment (VOE) when needed

Requirements:
- Minimum 6 months current employment for conventional loans
- 2 years employment history (can include multiple employers)
- Self-employment requires 2 years of tax returns
- Flag any inconsistencies in employer name or dates`,
        agentSteps: [
          {
            step: 1,
            action: 'Pay Stub Review',
            description: 'Analyzed pay stub showing employer "Acme Corp" with YTD earnings starting January 2024',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 2000).toISOString(),
            status: 'completed'
          },
          {
            step: 2,
            action: 'Tenure Calculation',
            description: 'Calculated employment tenure: January 2024 to present = 3 months of employment history',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 4000).toISOString(),
            status: 'completed'
          },
          {
            step: 3,
            action: 'Guideline Check',
            description: 'Compared to minimum requirement of 6 months. Current tenure (3 months) is below threshold.',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 6000).toISOString(),
            status: 'completed'
          },
          {
            step: 4,
            action: 'Documentation Assessment',
            description: 'Checked for Verification of Employment (VOE) letter - not found in loan documents',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 8000).toISOString(),
            status: 'completed'
          },
          {
            step: 5,
            action: 'Recommendation Generated',
            description: 'Flagged as MEDIUM priority. Recommend obtaining VOE letter to confirm employment status and future employment stability.',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000 + 10000).toISOString(),
            status: 'completed'
          }
        ],
        possibleActions: [
          { id: 'request_voe', label: 'Request VOE Letter', type: 'warning' },
          { id: 'accept', label: 'Accept Current Documentation', type: 'success' },
          { id: 'contact_employer', label: 'Contact Employer Directly', type: 'warning' },
          { id: 'dismiss', label: 'Dismiss', type: 'neutral' }
        ],
        metadata: {
          'Employer': 'Acme Corp',
          'Start Date': 'January 2024',
          'Tenure': '3 months',
          'Required Tenure': '6 months'
        }
      },
      {
        id: 'disp-003',
        agentName: 'Asset Verification Agent',
        agentType: 'AssetVerification',
        priority: 'low',
        status: 'in_progress',
        title: 'Bank statement formatting issue',
        description: 'Bank statement for Chase account ending in 4567 has unusual formatting that may require manual review. Automated extraction confidence is 78% (below 85% threshold).',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        documentIds: ['doc-3'],
        possibleActions: [
          { id: 'manual_review', label: 'Perform Manual Review', type: 'warning' },
          { id: 'request_new', label: 'Request New Statement', type: 'warning' },
          { id: 'accept', label: 'Accept Current Data', type: 'success' },
          { id: 'dismiss', label: 'Dismiss', type: 'neutral' }
        ],
        metadata: {
          'Bank': 'Chase',
          'Account': '****4567',
          'Extraction Confidence': '78%',
          'Threshold': '85%'
        }
      },
      {
        id: 'disp-004',
        agentName: 'Credit Report Agent',
        agentType: 'CreditReview',
        priority: 'high',
        status: 'resolved',
        title: 'Credit score below guideline threshold',
        description: 'Credit score of 620 is below the standard threshold of 640 for conventional loans. Borrower may qualify for alternative programs.',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        documentIds: ['doc-4'],
        possibleActions: [],
        resolution: {
          action: 'Escalate to Senior Underwriter',
          note: 'Approved for FHA program. Compensating factors documented.',
          user: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
        },
        metadata: {
          'Credit Score': '620',
          'Guideline Minimum': '640',
          'Alternative Program': 'FHA Available'
        }
      },
      {
        id: 'disp-005',
        agentName: 'Property Appraisal Agent',
        agentType: 'PropertyReview',
        priority: 'medium',
        status: 'resolved',
        title: 'Appraisal value review complete',
        description: 'Property appraised at $425,000, which is $10,000 above purchase price. LTV ratio verified at 78%.',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        documentIds: ['doc-5'],
        possibleActions: [],
        resolution: {
          action: 'Accept as Valid',
          note: 'Appraisal meets all guidelines. No issues identified.',
          user: 'Michael Chen',
          timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString()
        },
        metadata: {
          'Appraised Value': '$425,000',
          'Purchase Price': '$415,000',
          'LTV Ratio': '78%'
        }
      }
    ];
  };

  const handleDisposition = async (dispositionId, actionId, actionLabel) => {
    try {
      // Update via API
      await updateDisposition(dispositionId, actionId, actionLabel);

      // Refresh dispositions
      await fetchLoanData();

      // Show success message (could use a toast notification here)
      console.log(`Disposition ${dispositionId} updated with action: ${actionLabel}`);
    } catch (error) {
      console.error('Error updating disposition:', error);
      // For demo purposes, update locally
      setDispositions(prev => prev.map(disp => {
        if (disp.id === dispositionId) {
          return {
            ...disp,
            status: 'resolved',
            resolution: {
              action: actionLabel,
              note: '',
              user: 'Current User',
              timestamp: new Date().toISOString()
            }
          };
        }
        return disp;
      }));
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
          ⚖️ Side-by-Side Compare
        </button>
        <button
          className={`tab ${activeTab === 'dispositions' ? 'active' : ''} ${dispositions.filter(d => d.status === 'open' || d.status === 'in_progress').length > 0 ? 'tab-alert' : ''}`}
          onClick={() => setActiveTab('dispositions')}
        >
          🔔 Dispositions ({dispositions.filter(d => d.status === 'open' || d.status === 'in_progress').length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'documents' && (
          <div className="documents-section-split">
            {documents.length === 0 ? (
              <div className="empty-state">
                <h3>No Documents Uploaded Yet</h3>
                <p>Documents will appear here once uploaded to the loan</p>
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

        {activeTab === 'dispositions' && (
          <AgentDispositionQueue
            loanId={loanId}
            dispositions={dispositions}
            documents={documents}
            onDisposition={handleDisposition}
          />
        )}
      </div>
    </div>
  );
}

export default LoanDetails;
