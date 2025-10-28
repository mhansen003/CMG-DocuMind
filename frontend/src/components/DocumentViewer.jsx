import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import ActionModal from './ActionModal';
import '../styles/DocumentViewer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Agent definitions - matching from Agents.jsx
const AGENTS = [
  {
    id: 'agent-001',
    name: 'Document Request Agent',
    icon: '📄',
    category: 'Communication',
    description: 'Automatically sends requests to borrowers for missing or updated documents via email or portal',
    autoAssign: false
  },
  {
    id: 'agent-002',
    name: 'Income Verification Agent',
    icon: '💰',
    category: 'Analysis',
    description: 'Validates income amounts, calculates YTD earnings, and cross-references with tax documents and bank statements',
    autoAssign: true // Auto-assign for critical income issues
  },
  {
    id: 'agent-004',
    name: 'Date Validation Agent',
    icon: '📅',
    category: 'Compliance',
    description: 'Checks document recency requirements, validates date formats, and ensures documents are within acceptable timeframes',
    autoAssign: true // Auto-assign for date-related critical issues
  },
  {
    id: 'agent-005',
    name: 'Condition Generator Agent',
    icon: '📋',
    category: 'Workflow',
    description: 'Creates formal loan conditions based on validation failures, with suggested remediation actions',
    autoAssign: false
  },
  {
    id: 'agent-009',
    name: 'Fraud Detection Agent',
    icon: '🔍',
    category: 'Risk',
    description: 'Analyzes documents for signs of tampering, altered fonts, inconsistent formatting, or suspicious patterns',
    autoAssign: true // Auto-assign for fraud concerns
  },
  {
    id: 'agent-011',
    name: 'Calculation Verifier Agent',
    icon: '🧮',
    category: 'Analysis',
    description: 'Validates mathematical calculations, pay period totals, deductions, and ensures arithmetic accuracy',
    autoAssign: false
  },
  {
    id: 'agent-012',
    name: 'Document Expiration Tracker',
    icon: '⏰',
    category: 'Compliance',
    description: 'Monitors document age and alerts when documents are approaching or past expiration dates',
    autoAssign: false
  },
  {
    id: 'agent-013',
    name: 'Format Inconsistency Detector',
    icon: '🎨',
    category: 'Risk',
    description: 'Identifies unusual formatting, font mismatches, alignment issues, or other visual anomalies in documents',
    autoAssign: false
  },
  {
    id: 'agent-014',
    name: 'Missing Field Completion Agent',
    icon: '✍️',
    category: 'Workflow',
    description: 'Attempts to extract missing data from other document sections or requests clarification from appropriate parties',
    autoAssign: false
  },
  {
    id: 'agent-015',
    name: 'Cross-Document Consistency Checker',
    icon: '🔗',
    category: 'Verification',
    description: 'Compares data across multiple documents to ensure consistency and flags discrepancies between sources',
    autoAssign: true // Auto-assign for consistency issues
  }
];

function DocumentViewer({ document, loanData }) {
  const [showValidation, setShowValidation] = useState(true);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [assignedAgents, setAssignedAgents] = useState({}); // Track which agents are assigned to which issues
  const [agentResults, setAgentResults] = useState({}); // Track agent results after they complete
  const [activeTab, setActiveTab] = useState('fields'); // 'fields', 'critical', 'warnings', or 'summary'

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setPdfError('Unable to load PDF. The file may not be in PDF format.');
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return value.toString();
  };

  const getFieldStatus = (fieldName) => {
    if (!document.validationResults?.fieldValidations) return 'unknown';
    const validation = document.validationResults.fieldValidations[fieldName];
    return validation?.isValid ? 'valid' : 'invalid';
  };

  const getFieldValidation = (fieldName) => {
    if (!document.validationResults?.fieldValidations) return null;
    return document.validationResults.fieldValidations[fieldName];
  };

  // Helper function to get ByteLOS (loan application) value for comparison
  const getLoanDataValue = (fieldName) => {
    if (!loanData) return null;

    // Map document field names to loan data paths
    const fieldMappings = {
      // Common borrower fields
      'employeeName': loanData.borrower?.firstName && loanData.borrower?.lastName
        ? `${loanData.borrower.firstName} ${loanData.borrower.lastName}`
        : null,
      'borrowerName': loanData.borrower?.firstName && loanData.borrower?.lastName
        ? `${loanData.borrower.firstName} ${loanData.borrower.lastName}`
        : null,
      'firstName': loanData.borrower?.firstName,
      'lastName': loanData.borrower?.lastName,

      // Income fields
      'grossPay': loanData.mismo?.income,
      'annualIncome': loanData.mismo?.income,
      'monthlyIncome': loanData.mismo?.monthlyIncome,

      // Property/Address fields
      'propertyAddress': loanData.mismo?.propertyAddress,
      'city': loanData.mismo?.city,
      'state': loanData.mismo?.state,
      'zipCode': loanData.mismo?.zipCode,

      // Loan fields
      'loanAmount': loanData.mismo?.loanAmountRequested,
      'loanNumber': loanData.loanNumber,

      // Employment fields
      'employer': loanData.borrower?.employer,
      'employerName': loanData.borrower?.employer,
    };

    return fieldMappings[fieldName] || null;
  };

  // Check if document value matches loan data
  const checkLoanDataMatch = (fieldName, documentValue) => {
    const loanValue = getLoanDataValue(fieldName);

    if (!loanValue) return { hasLoanData: false };

    // Normalize values for comparison
    const normalizeValue = (val) => {
      if (val === null || val === undefined) return '';
      return String(val).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    };

    const normalizedDoc = normalizeValue(documentValue);
    const normalizedLoan = normalizeValue(loanValue);

    const matches = normalizedDoc === normalizedLoan;

    return {
      hasLoanData: true,
      loanValue,
      matches
    };
  };

  const openModal = (action) => {
    setCurrentAction(action);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentAction(null);
  };

  const handleRequestDocument = (field = null, issue = null) => {
    openModal({
      type: 'request-document',
      title: '📄 Request Document',
      submitLabel: 'Send Request',
      context: {
        field: field,
        issue: issue?.message,
        rule: issue?.rule,
      },
    });
  };

  const handleCreateCondition = (issue) => {
    openModal({
      type: 'create-condition',
      title: '📋 Create Condition',
      submitLabel: 'Create Condition',
      context: {
        issue: issue.message,
        field: issue.field,
        rule: issue.rule,
      },
    });
  };

  const handleOverride = (fieldName, validation) => {
    openModal({
      type: 'override',
      title: '⚠️ Override Validation',
      submitLabel: 'Request Override',
      context: {
        field: fieldName,
        currentValue: document.extractedData?.data?.[fieldName],
        issue: validation?.message,
        rule: validation?.rule,
      },
    });
  };

  const handleMarkReviewed = (item) => {
    openModal({
      type: 'mark-reviewed',
      title: '✓ Mark as Reviewed',
      submitLabel: 'Mark Reviewed',
      context: {
        issue: item.message,
        field: item.field,
        rule: item.rule,
      },
    });
  };

  // Agent Assignment Logic
  const getRecommendedAgents = (issue) => {
    const issueText = (issue.message || '').toLowerCase();
    const field = (issue.field || '').toLowerCase();
    const rule = (issue.rule || '').toLowerCase();

    const recommended = [];

    // Income-related issues
    if (issueText.includes('income') || issueText.includes('ytd') || issueText.includes('wage') || field.includes('income')) {
      recommended.push(AGENTS.find(a => a.id === 'agent-002')); // Income Verification Agent
      recommended.push(AGENTS.find(a => a.id === 'agent-011')); // Calculation Verifier Agent
    }

    // Date-related issues
    if (issueText.includes('date') || issueText.includes('recency') || issueText.includes('expired') || rule.includes('date')) {
      recommended.push(AGENTS.find(a => a.id === 'agent-004')); // Date Validation Agent
      recommended.push(AGENTS.find(a => a.id === 'agent-012')); // Document Expiration Tracker
    }

    // Missing fields or data
    if (issueText.includes('missing') || issueText.includes('blank') || issueText.includes('required') || issueText.includes('not found')) {
      recommended.push(AGENTS.find(a => a.id === 'agent-014')); // Missing Field Completion Agent
      recommended.push(AGENTS.find(a => a.id === 'agent-001')); // Document Request Agent
    }

    // Mismatch or inconsistency issues
    if (issueText.includes('mismatch') || issueText.includes('inconsistent') || issueText.includes('does not match')) {
      recommended.push(AGENTS.find(a => a.id === 'agent-015')); // Cross-Document Consistency Checker
    }

    // Format or tampering concerns
    if (issueText.includes('format') || issueText.includes('altered') || issueText.includes('font') || issueText.includes('suspicious')) {
      recommended.push(AGENTS.find(a => a.id === 'agent-013')); // Format Inconsistency Detector
      recommended.push(AGENTS.find(a => a.id === 'agent-009')); // Fraud Detection Agent
    }

    // Calculation errors
    if (issueText.includes('calculation') || issueText.includes('math') || issueText.includes('sum') || issueText.includes('total')) {
      recommended.push(AGENTS.find(a => a.id === 'agent-011')); // Calculation Verifier Agent
    }

    // Default fallback agents if nothing matched
    if (recommended.length === 0) {
      recommended.push(AGENTS.find(a => a.id === 'agent-005')); // Condition Generator Agent
      recommended.push(AGENTS.find(a => a.id === 'agent-001')); // Document Request Agent
    }

    // Remove duplicates and nulls
    return [...new Set(recommended.filter(Boolean))].slice(0, 3); // Max 3 recommendations
  };

  // Generate agent result based on agent type and issue
  const generateAgentResult = (agent, issue) => {
    const issueText = (issue.message || '').toLowerCase();
    const field = issue.field || '';

    // Define possible outcomes
    const outcomes = {
      'agent-002': { // Income Verification Agent
        type: 'analysis',
        title: '💰 Income Verification Complete',
        findings: [
          `Verified borrower's YTD income with employer payroll system`,
          `Cross-referenced with W2 and tax documents - income confirmed`,
          `Calculated annual income projection: ${Math.round(Math.random() * 20000 + 140000).toLocaleString()}`,
        ],
        recommendation: 'Income verified and consistent with loan application. Acceptable for underwriting.'
      },
      'agent-004': { // Date Validation Agent
        type: 'rectified',
        title: '📅 Date Validation Complete',
        findings: [
          `Verified document timestamp is within acceptable range`,
          `Confirmed pay period dates are sequential and logical`,
          `Document recency meets underwriting guidelines`
        ],
        recommendation: 'All date validations passed. Document is current and acceptable.'
      },
      'agent-009': { // Fraud Detection Agent
        type: 'alert',
        title: '🔍 Fraud Analysis Complete',
        findings: [
          `Analyzed document metadata and visual characteristics`,
          issueText.includes('suspicious') || issueText.includes('tampering')
            ? `⚠️ ALERT: Found indicators of potential document manipulation`
            : `No signs of tampering or alteration detected`,
          `Font analysis: ${issueText.includes('font') ? 'Inconsistencies detected' : 'Consistent throughout document'}`,
          `Verified document against known fraud patterns`
        ],
        recommendation: issueText.includes('suspicious') || issueText.includes('tampering')
          ? '⚠️ ESCALATE: Manual review required. Consider requesting original document.'
          : 'Document appears authentic. No fraud indicators detected.'
      },
      'agent-011': { // Calculation Verifier Agent
        type: 'rectified',
        title: '🧮 Calculation Verification Complete',
        findings: [
          `Verified all mathematical calculations in document`,
          `YTD totals match sum of pay periods`,
          `Tax withholding calculations are accurate`,
          `Net pay equals gross pay minus deductions`
        ],
        recommendation: 'All calculations verified. No mathematical errors detected.'
      },
      'agent-015': { // Cross-Document Consistency Checker
        type: 'analysis',
        title: '🔗 Cross-Document Analysis Complete',
        findings: [
          `Compared data across ${Math.floor(Math.random() * 3 + 2)} related documents`,
          issueText.includes('mismatch') || issueText.includes('inconsist')
            ? `⚠️ Found discrepancies in ${field} field`
            : `All ${field} references are consistent`,
          `Verified employer information matches across all paystubs`,
          `Income figures align with W2 and tax documents`
        ],
        recommendation: issueText.includes('mismatch')
          ? '⚠️ SUGGEST: Request clarification from borrower regarding discrepancies.'
          : 'Document data is consistent with other submissions.'
      },
      'agent-001': { // Document Request Agent
        type: 'action',
        title: '📄 Document Request Sent',
        findings: [
          `Generated formal document request for missing ${field} data`,
          `Email sent to borrower (michael.thompson@email.com)`,
          `Set follow-up reminder for 48 hours`,
          `Added to loan conditions tracking system`
        ],
        recommendation: 'Awaiting borrower response. Loan processing paused pending document receipt.'
      },
      'agent-014': { // Missing Field Completion Agent
        type: 'rectified',
        title: '✍️ Field Completion Attempted',
        findings: [
          `Searched document for ${field} in alternate locations`,
          `Checked other uploaded documents for this information`,
          Math.random() > 0.5
            ? `✓ Successfully extracted ${field} from alternate source`
            : `❌ Unable to locate ${field} - manual entry required`,
          `Updated extraction confidence score`
        ],
        recommendation: Math.random() > 0.5
          ? '✓ Field completed automatically. Review and confirm accuracy.'
          : '⚠️ Manual intervention required. Request updated document.'
      },
      'agent-013': { // Format Inconsistency Detector
        type: 'alert',
        title: '🎨 Format Analysis Complete',
        findings: [
          `Analyzed document formatting and visual structure`,
          `Detected ${Math.floor(Math.random() * 3 + 1)} font style(s) in document`,
          issueText.includes('format') || issueText.includes('mixed')
            ? `⚠️ Found unusual formatting patterns`
            : `Format is consistent with standard paystub templates`,
          `Compared against ${Math.floor(Math.random() * 50 + 100)} known legitimate document templates`
        ],
        recommendation: issueText.includes('format') || issueText.includes('mixed')
          ? '⚠️ SUGGEST: Request explanation for format inconsistencies.'
          : 'Document format is acceptable and matches standard templates.'
      }
    };

    // Return the agent-specific result or a generic one
    return outcomes[agent.id] || {
      type: 'analysis',
      title: `${agent.icon} ${agent.name} Complete`,
      findings: [
        `Analyzed ${field || 'document'} for potential issues`,
        `Reviewed validation rules and compliance requirements`,
        `Compared data against loan application information`
      ],
      recommendation: 'Analysis complete. Review findings and take appropriate action.'
    };
  };

  const assignAgent = (agent, issue, issueIndex) => {
    // Create unique key for this issue-agent combination
    const issueKey = `${issueIndex}-${agent.id}`;

    // Mark agent as assigned to this issue
    setAssignedAgents(prev => ({
      ...prev,
      [issueKey]: true
    }));

    // Create toast notification
    const toastId = Date.now();
    const newToast = {
      id: toastId,
      agent: agent,
      issue: issue,
      timestamp: new Date().toISOString()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 5000);

    // Simulate agent working and generate results after 5 seconds
    setTimeout(() => {
      const result = generateAgentResult(agent, issue);
      setAgentResults(prev => ({
        ...prev,
        [issueKey]: {
          agent,
          result,
          completedAt: new Date().toISOString()
        }
      }));
    }, 5000);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
  };

  // Auto-assign agents for critical issues on document load
  useEffect(() => {
    if (!document.validationResults) return;

    const autoAssignments = [];

    // Process critical issues
    document.validationResults.issues?.forEach((issue, index) => {
      const recommendedAgents = getRecommendedAgents(issue);
      recommendedAgents.forEach(agent => {
        if (agent.autoAssign) {
          const issueKey = `${index}-${agent.id}`;
          // Only auto-assign if not already assigned
          if (!assignedAgents[issueKey]) {
            autoAssignments.push({ agent, issue, issueIndex: index });
          }
        }
      });
    });

    // Assign all auto-agents with a slight delay for visual effect
    if (autoAssignments.length > 0) {
      autoAssignments.forEach((assignment, idx) => {
        setTimeout(() => {
          assignAgent(assignment.agent, assignment.issue, assignment.issueIndex);
        }, idx * 300); // Stagger by 300ms each
      });
    }
  }, [document.id]); // Only run when document changes

  return (
    <div className="document-viewer-container">
      {/* Rules Toggle Button */}
      <button
        className="rules-toggle-btn"
        onClick={() => setShowRulesPanel(!showRulesPanel)}
        title="View Document Rules"
      >
        {showRulesPanel ? '→ Hide Rules' : '← View Rules'}
      </button>

      <div className="document-viewer">
        {/* Left Side - Document Viewer */}
        <div className="pdf-panel">
          <div className="panel-header">
            <h3>📄 Document</h3>
            <div className="document-info-bar">
              <span>Type: {document.documentType}</span>
              <span>Uploaded: {new Date(document.uploadDate).toLocaleString()}</span>
              {document.extractedData?.confidence && (
                <span className={`confidence-badge ${document.extractedData.confidence > 80 ? 'high' : 'medium'}`}>
                  Confidence: {document.extractedData.confidence}%
                </span>
              )}
            </div>
          </div>

          <div className="pdf-viewer">
            {document.fileName.endsWith('.pdf') ? (
              // PDF files - use React-PDF
              <>
                {pdfError ? (
                  <div className="pdf-error">
                    <div className="error-icon">⚠️</div>
                    <p>{pdfError}</p>
                    <a
                      href={`http://localhost:3001${document.filePath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      Open in New Tab
                    </a>
                  </div>
                ) : (
                  <>
                    <Document
                      file={`http://localhost:3001${document.filePath}`}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="pdf-loading">
                          <div className="loading-spinner"></div>
                          <p>Loading PDF...</p>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={850}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>
                    {numPages && numPages > 1 && (
                      <div className="pdf-controls">
                        <button
                          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                          disabled={pageNumber <= 1}
                          className="btn-control"
                        >
                          ← Previous
                        </button>
                        <span className="page-info">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button
                          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                          disabled={pageNumber >= numPages}
                          className="btn-control"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              // HTML and text files - use iframe
              <div className="document-frame-viewer">
                <iframe
                  src={`http://localhost:3001${document.filePath}`}
                  title={document.fileName}
                  className="document-frame"
                />
              </div>
            )}
          </div>
        </div>

        {/* Middle - Validation Results & Extracted Data */}
        <div className="data-panel">
          <div className="panel-header">
            <h3>📊 Validation Results</h3>
          </div>

          {/* All Validation Tabs - Flat Structure */}
          <div className="validation-main-tabs">
            <button
              className={`validation-main-tab ${activeTab === 'fields' ? 'active' : ''}`}
              onClick={() => setActiveTab('fields')}
            >
              📋 Field Validation
              <span className="tab-count">
                {Object.keys(document.extractedData?.data || {}).length}
              </span>
            </button>
            <button
              className={`validation-main-tab ${activeTab === 'critical' ? 'active' : ''}`}
              onClick={() => setActiveTab('critical')}
            >
              🔴 Critical Issues
              <span className="tab-count">
                {document.validationResults?.issues?.length || 0}
              </span>
            </button>
            <button
              className={`validation-main-tab ${activeTab === 'warnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('warnings')}
            >
              🟡 Warnings
              <span className="tab-count">
                {document.validationResults?.warnings?.length || 0}
              </span>
            </button>
          </div>

          {/* Tab Content Container */}
          <div className="tab-content-container">
            {/* Field Validation Tab Content */}
            {activeTab === 'fields' && (
            <div className="extracted-data">
            {Object.entries(document.extractedData?.data || {}).map(([key, value]) => {
              const status = getFieldStatus(key);
              const validation = getFieldValidation(key);
              const loanDataComparison = checkLoanDataMatch(key, value);

              return (
                <div key={key} className={`data-field ${status}`}>
                  <div className="field-header">
                    <div className="field-header-content">
                      <div className="field-header-left">
                        <label className="field-name">{key}</label>
                        {showValidation && (
                          <span className={`field-status-badge ${status}`}>
                            {status === 'valid' ? '✓' : status === 'invalid' ? '✗' : '?'}
                          </span>
                        )}
                      </div>
                      {showValidation && validation?.message && status === 'invalid' && (
                        <div className="field-inline-error">
                          {validation.message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="field-value">{formatFieldValue(value)}</div>

                  {/* ByteLOS Comparison Section - ALWAYS show if ByteLOS data exists */}
                  {loanDataComparison.hasLoanData && (
                    <div className={`bytelos-comparison ${loanDataComparison.matches ? 'match' : 'mismatch'}`}>
                      <div className="bytelos-comparison-header">
                        <span className="bytelos-icon">🔗</span>
                        <span className="bytelos-label">ByteLOS Application Data:</span>
                        <span className={`bytelos-match-indicator ${loanDataComparison.matches ? 'match' : 'mismatch'}`}>
                          {loanDataComparison.matches ? '✓ Match' : '⚠️ Mismatch'}
                        </span>
                      </div>
                      <div className="bytelos-value">
                        {formatFieldValue(loanDataComparison.loanValue)}
                      </div>

                      {/* Show confirmation message for matches */}
                      {loanDataComparison.matches && (
                        <div className="bytelos-match-confirmation">
                          <span className="confirmation-icon">✓</span>
                          <span className="confirmation-text">
                            Document data matches loan application
                          </span>
                        </div>
                      )}

                      {/* Show agent recommendation for mismatches */}
                      {!loanDataComparison.matches && (
                        <div className="bytelos-mismatch-actions">
                          <div className="bytelos-warning">
                            <span className="warning-icon">⚠️</span>
                            <span className="warning-text">
                              Document data doesn't match loan application. Consider agent review.
                            </span>
                          </div>
                          <button
                            className="btn-assign-agent recommended"
                            onClick={() => {
                              const agent = AGENTS.find(a => a.id === 'agent-015');
                              const issue = {
                                message: `${key} mismatch: Document shows "${value}" but loan application shows "${loanDataComparison.loanValue}"`,
                                field: key,
                                rule: 'ByteLOS Data Consistency'
                              };
                              assignAgent(agent, issue, `bytelos-${key}`);
                            }}
                            title="Cross-Document Consistency Checker - Compares data across multiple documents"
                          >
                            🔗 Assign Consistency Agent
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {showValidation && validation && (
                    <>
                      {status === 'invalid' && (
                        <div className="field-actions">
                          <button
                            className="btn-action btn-primary"
                            onClick={() => handleRequestDocument(key, { message: validation?.message, rule: validation?.rule })}
                          >
                            📄 Request New Document
                          </button>
                          <button
                            className="btn-action btn-secondary"
                            onClick={() => handleOverride(key, validation)}
                          >
                            ✓ Override
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            </div>
          )}

          {/* Critical Issues Tab Content */}
          {activeTab === 'critical' && document.validationResults && (
            <div className="validation-summary">
              {document.validationResults.issues?.length > 0 ? (
                <div className="issues-section">
                  {document.validationResults.issues.map((issue, index) => {
                    const recommendedAgents = getRecommendedAgents(issue);
                    return (
                      <div key={index} className="issue-item critical">
                        <div className="issue-content">
                          <div className="issue-header">
                            <span className="issue-icon">🔴</span>
                            <span className="issue-severity">CRITICAL</span>
                          </div>
                          <div className="issue-message">{issue.message}</div>
                          {issue.field && (
                            <div className="issue-field">
                              <strong>Field:</strong> {issue.field}
                            </div>
                          )}
                          {issue.rule && (
                            <div className="issue-rule">
                              <strong>Rule:</strong> {issue.rule}
                            </div>
                          )}
                          {issue.severity && (
                            <div className="issue-severity-level">
                              <strong>Impact:</strong> {issue.severity}
                            </div>
                          )}
                        </div>

                        {/* Recommended Agents Section */}
                        {recommendedAgents.length > 0 && (
                          <div className="recommended-agents">
                            <div className="recommended-agents-header">
                              <span className="recommended-icon">🤖</span>
                              <span className="recommended-label">Recommended Agents:</span>
                            </div>
                            <div className="agent-buttons">
                              {recommendedAgents.map(agent => {
                                const issueKey = `${index}-${agent.id}`;
                                const isAssigned = assignedAgents[issueKey];
                                return (
                                  <button
                                    key={agent.id}
                                    className={`btn-assign-agent ${isAssigned ? 'assigned' : ''} ${agent.autoAssign ? 'auto-assigned' : ''}`}
                                    onClick={() => assignAgent(agent, issue, index)}
                                    title={agent.description}
                                    data-tooltip={agent.description}
                                  >
                                    {agent.icon} {agent.name}
                                    {isAssigned && <span className="assigned-badge">✓ Assigned</span>}
                                    {agent.autoAssign && !isAssigned && <span className="auto-badge">⚡ Auto</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Agent Results Section */}
                            {recommendedAgents.map(agent => {
                              const issueKey = `${index}-${agent.id}`;
                              const agentResult = agentResults[issueKey];

                              if (!agentResult) return null;

                              const resultTypeClass = agentResult.result.type === 'rectified' ? 'success' :
                                                     agentResult.result.type === 'alert' ? 'alert' : 'info';

                              return (
                                <div key={`result-${agent.id}`} className={`agent-result ${resultTypeClass}`}>
                                  <div className="agent-result-header">
                                    <span className="agent-result-icon">{agent.icon}</span>
                                    <span className="agent-result-title">{agentResult.result.title}</span>
                                    <span className="agent-result-timestamp">
                                      {new Date(agentResult.completedAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <div className="agent-result-body">
                                    <div className="agent-result-section">
                                      <strong>Findings:</strong>
                                      <ul className="agent-findings">
                                        {agentResult.result.findings.map((finding, idx) => (
                                          <li key={idx}>{finding}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="agent-result-section agent-recommendation">
                                      <strong>
                                        {agentResult.result.type === 'rectified' ? '✅ Resolution:' :
                                         agentResult.result.type === 'alert' ? '⚠️ Recommendation:' :
                                         '💡 Suggestion:'}
                                      </strong>
                                      <p>{agentResult.result.recommendation}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="issue-actions">
                          <button
                            className="btn-action btn-danger"
                            onClick={() => handleCreateCondition(issue)}
                          >
                            📋 Create Condition
                          </button>
                          <button
                            className="btn-action btn-primary"
                            onClick={() => handleRequestDocument()}
                          >
                            📄 Request Document
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="validation-status success">
                  ✓ No critical issues found
                </div>
              )}
            </div>
          )}

          {/* Warnings Tab Content */}
          {activeTab === 'warnings' && document.validationResults && (
            <div className="validation-summary">
              {document.validationResults.warnings?.length > 0 ? (
                <div className="issues-section">
                  {document.validationResults.warnings.map((warning, index) => {
                    const recommendedAgents = getRecommendedAgents(warning);
                    return (
                      <div key={index} className="issue-item warning">
                        <div className="issue-content">
                          <div className="issue-header">
                            <span className="issue-icon">🟡</span>
                            <span className="issue-severity">WARNING</span>
                          </div>
                          <div className="issue-message">{warning.message}</div>
                          {warning.field && (
                            <div className="issue-field">
                              <strong>Field:</strong> {warning.field}
                            </div>
                          )}
                          {warning.rule && (
                            <div className="issue-rule">
                              <strong>Rule:</strong> {warning.rule}
                            </div>
                          )}
                        </div>

                        {/* Recommended Agents Section */}
                        {recommendedAgents.length > 0 && (
                          <div className="recommended-agents">
                            <div className="recommended-agents-header">
                              <span className="recommended-icon">🤖</span>
                              <span className="recommended-label">Recommended Agents:</span>
                            </div>
                            <div className="agent-buttons">
                              {recommendedAgents.map(agent => {
                                const issueKey = `warning-${index}-${agent.id}`;
                                const isAssigned = assignedAgents[issueKey];
                                return (
                                  <button
                                    key={agent.id}
                                    className={`btn-assign-agent ${isAssigned ? 'assigned' : ''} ${agent.autoAssign ? 'auto-assigned' : ''}`}
                                    onClick={() => assignAgent(agent, warning, `warning-${index}`)}
                                    title={agent.description}
                                    data-tooltip={agent.description}
                                  >
                                    {agent.icon} {agent.name}
                                    {isAssigned && <span className="assigned-badge">✓ Assigned</span>}
                                    {agent.autoAssign && !isAssigned && <span className="auto-badge">⚡ Auto</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Agent Results Section */}
                            {recommendedAgents.map(agent => {
                              const issueKey = `warning-${index}-${agent.id}`;
                              const agentResult = agentResults[issueKey];

                              if (!agentResult) return null;

                              const resultTypeClass = agentResult.result.type === 'rectified' ? 'success' :
                                                     agentResult.result.type === 'alert' ? 'alert' : 'info';

                              return (
                                <div key={`result-${agent.id}`} className={`agent-result ${resultTypeClass}`}>
                                  <div className="agent-result-header">
                                    <span className="agent-result-icon">{agent.icon}</span>
                                    <span className="agent-result-title">{agentResult.result.title}</span>
                                    <span className="agent-result-timestamp">
                                      {new Date(agentResult.completedAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  <div className="agent-result-body">
                                    <div className="agent-result-section">
                                      <strong>Findings:</strong>
                                      <ul className="agent-findings">
                                        {agentResult.result.findings.map((finding, idx) => (
                                          <li key={idx}>{finding}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div className="agent-result-section agent-recommendation">
                                      <strong>
                                        {agentResult.result.type === 'rectified' ? '✅ Resolution:' :
                                         agentResult.result.type === 'alert' ? '⚠️ Recommendation:' :
                                         '💡 Suggestion:'}
                                      </strong>
                                      <p>{agentResult.result.recommendation}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="issue-actions">
                          <button
                            className="btn-action btn-warning"
                            onClick={() => handleCreateCondition(warning)}
                          >
                            📋 Create Condition
                          </button>
                          <button
                            className="btn-action btn-secondary"
                            onClick={() => handleMarkReviewed(warning)}
                          >
                            ✓ Mark Reviewed
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="validation-status success">
                  ✓ No warnings found
                </div>
              )}
            </div>
          )}
          </div>

          {/* Conditions - Only show if conditions have meaningful data */}
          {document.conditions?.filter(c => c.title && c.title !== 'Untitled Condition').length > 0 && (
            <div className="conditions-section">
              <h4>Generated Conditions</h4>
              {document.conditions
                .filter(c => c.title && c.title !== 'Untitled Condition')
                .map((condition) => (
                <div key={condition.id} className={`condition-item ${condition.type || ''}`}>
                  <div className="condition-header">
                    <span className="condition-type">{condition.type?.toUpperCase() || 'CONDITION'}</span>
                    <span className="condition-status">{condition.status || 'pending'}</span>
                  </div>
                  <div className="condition-title">{condition.title}</div>
                  <div className="condition-action">
                    Suggested: {condition.suggestedAction || 'No action specified'}
                  </div>
                  {condition.requiresNewDocument && (
                    <div className="condition-badge">📄 Requires New Document</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Rules Panel */}
      <div className={`rules-slideout ${showRulesPanel ? 'open' : ''}`}>
        <div className="rules-panel">
          <div className="rules-card">
            <div className="rules-card-header">
              <div className="header-left">
                <div className="header-title-row">
                  <h4>📋 Document Rules</h4>
                  <span className={`rules-status-badge ${document.validationResults?.isValid ? 'valid' : 'invalid'}`}>
                    {document.validationResults?.isValid ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>
              </div>
              <div className="header-right">
                <button className="btn-admin" onClick={() => alert('Navigate to Admin - Rules Management')}>
                  ⚙️ Manage
                </button>
              </div>
            </div>
            <div className="rules-card-body">
              <div className="rule-category">
                <div className="rule-category-header">
                  <span className="rule-category-icon">📄</span>
                  <span className="rule-category-title">Document Type</span>
                </div>
                <div className="rule-category-value">{document.documentType}</div>
              </div>

              <div className="rule-category">
                <div className="rule-category-header">
                  <span className="rule-category-icon">✓</span>
                  <span className="rule-category-title">Required Fields</span>
                </div>
                <div className="rule-items">
                  {Object.keys(document.extractedData?.data || {}).map((fieldName) => (
                    <div key={fieldName} className="rule-item">
                      <span className="rule-field-name">{fieldName}</span>
                      <span className={`rule-status ${getFieldStatus(fieldName)}`}>
                        {getFieldStatus(fieldName) === 'valid' ? '✓' : '✗'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rule-category">
                <div className="rule-category-header">
                  <span className="rule-category-icon">🔍</span>
                  <span className="rule-category-title">Validation Rules</span>
                </div>
                <div className="rule-items">
                  {Object.entries(document.validationResults?.fieldValidations || {}).map(([fieldName, validation]) => (
                    validation?.rule && (
                      <div key={fieldName} className="rule-item validation-rule">
                        <div className="rule-details">
                          <span className="rule-name">{validation.rule}</span>
                          <span className="rule-applies-to">on {fieldName}</span>
                        </div>
                        <button
                          className="btn-edit-rule"
                          onClick={() => alert(`Edit rule: ${validation.rule}`)}
                        >
                          ✏️
                        </button>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="rule-category">
                <div className="rule-category-header">
                  <span className="rule-category-icon">⚖️</span>
                  <span className="rule-category-title">Business Rules</span>
                </div>
                <div className="rule-items">
                  <div className="rule-item business-rule">
                    <div className="rule-details">
                      <span className="rule-name">Data Accuracy</span>
                      <span className="rule-description">All fields must match borrower data</span>
                    </div>
                    <button
                      className="btn-edit-rule"
                      onClick={() => alert('Edit business rule')}
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="rule-item business-rule">
                    <div className="rule-details">
                      <span className="rule-name">Income Verification</span>
                      <span className="rule-description">YTD income must align with stated income</span>
                    </div>
                    <button
                      className="btn-edit-rule"
                      onClick={() => alert('Edit business rule')}
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="rule-item business-rule">
                    <div className="rule-details">
                      <span className="rule-name">Document Recency</span>
                      <span className="rule-description">Document must be within 60 days</span>
                    </div>
                    <button
                      className="btn-edit-rule"
                      onClick={() => alert('Edit business rule')}
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              </div>

              <div className="rule-stats">
                <div className="rule-stat">
                  <div className="rule-stat-value">
                    {Object.values(document.validationResults?.fieldValidations || {}).filter(v => v?.isValid).length}
                  </div>
                  <div className="rule-stat-label">Rules Passed</div>
                </div>
                <div className="rule-stat">
                  <div className="rule-stat-value">
                    {Object.values(document.validationResults?.fieldValidations || {}).filter(v => !v?.isValid).length}
                  </div>
                  <div className="rule-stat-label">Rules Failed</div>
                </div>
                <div className="rule-stat">
                  <div className="rule-stat-value">{document.extractedData?.confidence || 0}%</div>
                  <div className="rule-stat-label">Confidence</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {showRulesPanel && (
        <div
          className="rules-backdrop"
          onClick={() => setShowRulesPanel(false)}
        />
      )}

      {/* Action Modal */}
      {modalOpen && currentAction && (
        <ActionModal
          isOpen={modalOpen}
          onClose={closeModal}
          action={currentAction}
          documentData={document}
          loanData={loanData}
        />
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast toast-agent-assigned">
            <div className="toast-header">
              <span className="toast-icon">🤖</span>
              <span className="toast-title">Agent Assigned</span>
              <button
                className="toast-close"
                onClick={() => removeToast(toast.id)}
              >
                ✕
              </button>
            </div>
            <div className="toast-body">
              <div className="toast-agent">
                <span className="agent-icon">{toast.agent.icon}</span>
                <span className="agent-name">{toast.agent.name}</span>
              </div>
              <div className="toast-issue">
                Working on: {toast.issue.message?.substring(0, 60)}
                {toast.issue.message?.length > 60 && '...'}
              </div>
            </div>
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentViewer;
