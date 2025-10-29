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
  const [validationFilter, setValidationFilter] = useState('all'); // 'all', 'issues', 'passed', 'critical', 'warnings'
  const [expandedItems, setExpandedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

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
    if (typeof value === 'object') {
      // Handle arrays
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'N/A';
      }
      // Handle objects - try to show a meaningful representation
      return JSON.stringify(value, null, 2);
    }
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

  // Auto-assign agents disabled - agents are now only assigned manually by user clicks

  // Toggle expansion of validation items
  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Expand all visible items (after filtering)
  const expandAll = () => {
    const items = getFilteredValidationItems();
    const allExpanded = {};
    items.forEach(item => {
      if (item.type !== 'valid') {
        allExpanded[item.id] = true;
      }
    });
    setExpandedItems(allExpanded);
  };

  // Collapse all items
  const collapseAll = () => {
    setExpandedItems({});
  };

  // Combine all validation items into a single unified list
  const getAllValidationItems = () => {
    const items = [];

    // Add field validations - only show real issues (mismatches, missing data)
    Object.entries(document.extractedData?.data || {}).forEach(([fieldName, value]) => {
      const validation = getFieldValidation(fieldName);
      const loanDataComparison = checkLoanDataMatch(fieldName, value);

      // Determine if this is a real issue (not just formatting)
      let errorMessage = null;
      let actualStatus = 'valid';

      // Priority 1: Check for loan data mismatch (most important)
      if (loanDataComparison.hasLoanData && !loanDataComparison.matches) {
        errorMessage = `Does not match loan application (expected: ${loanDataComparison.loanValue})`;
        actualStatus = 'field-error';
      }
      // Priority 2: Check for missing required fields
      else if ((!value || value === '' || value === null || value === undefined) && validation) {
        errorMessage = 'Required field is missing or empty';
        actualStatus = 'field-error';
      }
      // Priority 3: Only use backend validation message if it's NOT about formatting
      else if (validation?.message && validation?.isValid === false) {
        const msg = validation.message.toLowerCase();
        // Ignore formatting/pattern/length errors - user doesn't care about these
        if (!msg.includes('format') && !msg.includes('pattern') && !msg.includes('length') &&
            !msg.includes('invalid') && !msg.includes('must match')) {
          errorMessage = validation.message;
          actualStatus = 'field-error';
        }
      }

      items.push({
        id: `field-${fieldName}`,
        type: actualStatus === 'valid' ? 'valid' : 'field-error',
        severity: actualStatus === 'valid' ? 0 : 2, // 0=passed, 1=warning, 2=field-error, 3=critical
        icon: actualStatus === 'valid' ? '✓' : '✗',
        title: fieldName,
        value: formatFieldValue(value),
        message: errorMessage,
        field: fieldName,
        rule: validation?.rule,
        validation,
        loanDataComparison,
        issue: errorMessage ? {
          message: errorMessage,
          field: fieldName,
          rule: validation?.rule
        } : null
      });
    });

    // Add critical issues
    document.validationResults?.issues?.forEach((issue, index) => {
      items.push({
        id: `critical-${index}`,
        type: 'critical',
        severity: 3,
        icon: '🔴',
        title: issue.field || 'Critical Issue',
        message: issue.message,
        field: issue.field,
        rule: issue.rule,
        impactLevel: issue.severity,
        issue,
        issueIndex: index
      });
    });

    // Add warnings
    document.validationResults?.warnings?.forEach((warning, index) => {
      items.push({
        id: `warning-${index}`,
        type: 'warning',
        severity: 1,
        icon: '🟡',
        title: warning.field || 'Warning',
        message: warning.message,
        field: warning.field,
        rule: warning.rule,
        issue: warning,
        issueIndex: `warning-${index}`
      });
    });

    return items;
  };

  // Filter validation items based on selected filter and search query
  const getFilteredValidationItems = () => {
    let allItems = getAllValidationItems();

    // Apply filter
    switch(validationFilter) {
      case 'issues':
        allItems = allItems.filter(item => item.type !== 'valid');
        break;
      case 'passed':
        allItems = allItems.filter(item => item.type === 'valid');
        break;
      case 'critical':
        allItems = allItems.filter(item => item.type === 'critical');
        break;
      case 'warnings':
        allItems = allItems.filter(item => item.type === 'warning');
        break;
      case 'field-errors':
        allItems = allItems.filter(item => item.type === 'field-error');
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allItems = allItems.filter(item => {
        return (
          item.title?.toLowerCase().includes(query) ||
          item.message?.toLowerCase().includes(query) ||
          item.field?.toLowerCase().includes(query) ||
          item.value?.toString().toLowerCase().includes(query) ||
          item.rule?.toLowerCase().includes(query)
        );
      });
    }

    return allItems;
  };

  // Sort by severity (critical > field-error > warning > passed)
  const filteredItems = getFilteredValidationItems().sort((a, b) => b.severity - a.severity);

  // Get counts for filter badges
  const allItems = getAllValidationItems();
  const counts = {
    all: allItems.length,
    issues: allItems.filter(item => item.type !== 'valid').length,
    passed: allItems.filter(item => item.type === 'valid').length,
    critical: allItems.filter(item => item.type === 'critical').length,
    warnings: allItems.filter(item => item.type === 'warning').length,
    fieldErrors: allItems.filter(item => item.type === 'field-error').length
  };

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
                      href={document.s3Url || document.filePath}
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
                      file={document.s3Url || document.filePath}
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
                  src={document.s3Url || document.filePath}
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
            <div className="validation-summary-badges">
              {counts.critical > 0 && (
                <span className="summary-badge critical">
                  🔴 {counts.critical} Critical
                </span>
              )}
              {counts.fieldErrors > 0 && (
                <span className="summary-badge error">
                  ✗ {counts.fieldErrors} Errors
                </span>
              )}
              {counts.warnings > 0 && (
                <span className="summary-badge warning">
                  🟡 {counts.warnings} Warnings
                </span>
              )}
              {counts.passed > 0 && (
                <span className="summary-badge success">
                  ✓ {counts.passed} Passed
                </span>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="validation-filter-bar">
            {/* Search Bar */}
            <div className="validation-search-bar">
              <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search validations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="validation-search-input"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="validation-filter-buttons">
              <button
                className={`filter-button ${validationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setValidationFilter('all')}
              >
                All ({counts.all})
              </button>
              <button
                className={`filter-button ${validationFilter === 'issues' ? 'active' : ''}`}
                onClick={() => setValidationFilter('issues')}
              >
                Issues Only ({counts.issues})
              </button>
              <button
                className={`filter-button ${validationFilter === 'critical' ? 'active' : ''}`}
                onClick={() => setValidationFilter('critical')}
              >
                Critical ({counts.critical})
              </button>
              <button
                className={`filter-button ${validationFilter === 'warnings' ? 'active' : ''}`}
                onClick={() => setValidationFilter('warnings')}
              >
                Warnings ({counts.warnings})
              </button>
              <button
                className={`filter-button ${validationFilter === 'passed' ? 'active' : ''}`}
                onClick={() => setValidationFilter('passed')}
              >
                Passed ({counts.passed})
              </button>
            </div>

            {/* Expand/Collapse All Buttons */}
            <div className="validation-expand-controls">
              <button
                className="expand-control-btn"
                onClick={expandAll}
                title="Expand all filtered items"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
                </svg>
                Expand All
              </button>
              <button
                className="expand-control-btn"
                onClick={collapseAll}
                title="Collapse all items"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/>
                </svg>
                Collapse All
              </button>
            </div>
          </div>

          {/* Unified Validation List */}
          <div className="unified-validation-list">
            {filteredItems.length === 0 ? (
              <div className="validation-empty-state">
                {searchQuery ? (
                  // Empty state for search
                  <>
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      <path d="M7 9h5v1H7z" fill="#ef4444"/>
                    </svg>
                    <div className="empty-state-title">No Results Found</div>
                    <div className="empty-state-message">
                      No validation items match "{searchQuery}"
                    </div>
                    <button
                      className="empty-state-action"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear Search
                    </button>
                  </>
                ) : validationFilter === 'passed' ? (
                  // Empty state for "Passed" filter
                  <>
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div className="empty-state-title">No Passed Validations</div>
                    <div className="empty-state-message">
                      No validation checks have passed yet
                    </div>
                  </>
                ) : validationFilter === 'critical' ? (
                  // Empty state for "Critical" filter
                  <>
                    <svg className="empty-state-icon success" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div className="empty-state-title">No Critical Issues</div>
                    <div className="empty-state-message">
                      Great! No critical issues found in this document
                    </div>
                  </>
                ) : validationFilter === 'warnings' ? (
                  // Empty state for "Warnings" filter
                  <>
                    <svg className="empty-state-icon success" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div className="empty-state-title">No Warnings</div>
                    <div className="empty-state-message">
                      Excellent! No warnings found in this document
                    </div>
                  </>
                ) : validationFilter === 'issues' ? (
                  // Empty state for "Issues Only" filter
                  <>
                    <svg className="empty-state-icon success" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div className="empty-state-title">All Clear!</div>
                    <div className="empty-state-message">
                      No validation issues found - everything looks good
                    </div>
                  </>
                ) : (
                  // Empty state for "All" filter
                  <>
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                    </svg>
                    <div className="empty-state-title">No Validation Data</div>
                    <div className="empty-state-message">
                      No validation information available for this document
                    </div>
                  </>
                )}
              </div>
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedItems[item.id];
                const recommendedAgents = item.issue ? getRecommendedAgents(item.issue) : [];

                return (
                  <div key={item.id} className={`validation-item ${item.type} ${isExpanded ? 'expanded' : ''}`}>
                    {/* Compact Header - Always Visible */}
                    <div
                      className="validation-item-header"
                      onClick={() => item.type !== 'valid' && toggleExpanded(item.id)}
                      style={{ cursor: item.type !== 'valid' ? 'pointer' : 'default' }}
                    >
                      <div className="item-icon-section">
                        <span className={`item-icon ${item.type}`}>{item.icon}</span>
                        <span className={`item-type-label ${item.type}`}>
                          {item.type === 'valid' ? 'Passed' :
                           item.type === 'critical' ? 'CRITICAL' :
                           item.type === 'warning' ? 'WARNING' :
                           item.rule || 'FIELD ERROR'}
                        </span>
                      </div>
                      <div className="item-main-info">
                        <div className="item-title">
                          {item.title}
                          {item.message && !isExpanded && (
                            <span className="item-reason"> - {item.message}</span>
                          )}
                        </div>
                        {item.value && (
                          <div className="item-value">Value: {item.value}</div>
                        )}
                      </div>
                      {item.type !== 'valid' && (
                        <div className="item-expand-icon">
                          {isExpanded ? '▼' : '▶'}
                        </div>
                      )}
                    </div>

                    {/* Expanded Details - Only for issues */}
                    {isExpanded && item.type !== 'valid' && (
                      <div className="validation-item-details">
                        {/* Issue Details */}
                        <div className="details-section">
                          <div className="details-header">
                            <span className="details-icon">ℹ️</span>
                            <span className="details-label">Issue Details</span>
                          </div>
                          <div className="details-content">
                            <div className="detail-row">
                              <strong>Message:</strong> {item.message}
                            </div>
                            {item.field && (
                              <div className="detail-row">
                                <strong>Field:</strong> {item.field}
                              </div>
                            )}
                            {item.rule && (
                              <div className="detail-row">
                                <strong>Rule:</strong> {item.rule}
                              </div>
                            )}
                            {item.impactLevel && (
                              <div className="detail-row">
                                <strong>Impact:</strong> {item.impactLevel}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ByteLOS Comparison for field errors */}
                        {item.loanDataComparison?.hasLoanData && (
                          <div className={`details-section bytelos-section ${item.loanDataComparison.matches ? 'match' : 'mismatch'}`}>
                            <div className="details-header">
                              <span className="details-icon">🔗</span>
                              <span className="details-label">ByteLOS Application Data</span>
                              <span className={`match-indicator ${item.loanDataComparison.matches ? 'match' : 'mismatch'}`}>
                                {item.loanDataComparison.matches ? '✓ Match' : '⚠️ Mismatch'}
                              </span>
                            </div>
                            <div className="details-content">
                              <div className="bytelos-value">
                                {formatFieldValue(item.loanDataComparison.loanValue)}
                              </div>
                              {!item.loanDataComparison.matches && (
                                <div className="bytelos-warning-text">
                                  Document data doesn't match loan application
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Agents & Actions - Consolidated Side-by-Side Layout */}
                        <div className="details-section agents-actions-consolidated">
                          <div className="consolidated-layout">
                            {/* Left Column - Agents */}
                            {recommendedAgents.length > 0 && (
                              <div className="agents-column">
                                <div className="details-header">
                                  <span className="details-icon">🤖</span>
                                  <span className="details-label">Recommended Agents</span>
                                </div>
                                <div className="agent-buttons-compact">
                                  {recommendedAgents.map(agent => {
                                    const issueKey = `${item.id}-${agent.id}`;
                                    const isAssigned = assignedAgents[issueKey];
                                    const agentResult = agentResults[issueKey];

                                    return (
                                      <div key={agent.id} className="agent-button-wrapper">
                                        <button
                                          className={`btn-assign-agent-compact ${isAssigned ? 'assigned' : ''}`}
                                          onClick={() => assignAgent(agent, item.issue, item.issueIndex || item.id)}
                                          title={agent.description}
                                        >
                                          <span className="agent-icon">{agent.icon}</span>
                                          <span className="agent-name">{agent.name}</span>
                                          {isAssigned && <span className="assigned-indicator">✓</span>}
                                        </button>

                                        {/* Agent Result - shown inline below button */}
                                        {agentResult && (
                                          <div className={`agent-result-compact ${agentResult.result.type}`}>
                                            <div className="result-header-compact">
                                              <span className="result-icon">{agent.icon}</span>
                                              <span className="result-title">{agentResult.result.title}</span>
                                            </div>
                                            <div className="result-findings-compact">
                                              <ul>
                                                {agentResult.result.findings.map((finding, idx) => (
                                                  <li key={idx}>{finding}</li>
                                                ))}
                                              </ul>
                                            </div>
                                            <div className="result-recommendation-compact">
                                              <strong>
                                                {agentResult.result.type === 'rectified' ? '✅' :
                                                 agentResult.result.type === 'alert' ? '⚠️' : '💡'}
                                              </strong>
                                              <span>{agentResult.result.recommendation}</span>
                                            </div>

                                            {/* Action Buttons for Agent Result */}
                                            <div className="result-actions">
                                              {agentResult.result.type === 'rectified' && (
                                                <>
                                                  <button
                                                    className="result-action-btn apply"
                                                    onClick={() => {
                                                      addToast(`✅ Applied fix from ${agent.name}`, 'success');
                                                    }}
                                                    title="Apply the suggested fix"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                    </svg>
                                                    Apply Fix
                                                  </button>
                                                  <button
                                                    className="result-action-btn secondary"
                                                    onClick={() => {
                                                      addToast('Added notes to loan file', 'info');
                                                    }}
                                                    title="Add to loan notes"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                                    </svg>
                                                    Add to Notes
                                                  </button>
                                                </>
                                              )}
                                              {agentResult.result.type === 'alert' && (
                                                <>
                                                  <button
                                                    className="result-action-btn warning"
                                                    onClick={() => {
                                                      addToast('Document flagged for underwriter review', 'warning');
                                                    }}
                                                    title="Flag for manual review"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                                                    </svg>
                                                    Flag for Review
                                                  </button>
                                                  <button
                                                    className="result-action-btn secondary"
                                                    onClick={() => {
                                                      addToast('Document request generated', 'success');
                                                    }}
                                                    title="Request additional documents"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                                    </svg>
                                                    Request Documents
                                                  </button>
                                                </>
                                              )}
                                              {agentResult.result.type === 'analysis' && (
                                                <>
                                                  <button
                                                    className="result-action-btn success"
                                                    onClick={() => {
                                                      addToast('Issue marked as resolved', 'success');
                                                    }}
                                                    title="Accept findings and close"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                    </svg>
                                                    Accept
                                                  </button>
                                                  <button
                                                    className="result-action-btn secondary"
                                                    onClick={() => {
                                                      addToast('Document request generated', 'success');
                                                    }}
                                                    title="Request clarification"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M19 2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 16h-2v-2h2v2zm0-4h-2V6h2v8z"/>
                                                    </svg>
                                                    Request Clarification
                                                  </button>
                                                  <button
                                                    className="result-action-btn tertiary"
                                                    onClick={() => {
                                                      addToast('Override applied with justification', 'info');
                                                    }}
                                                    title="Override with justification"
                                                  >
                                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                                    </svg>
                                                    Override
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Right Column - Actions */}
                            <div className="actions-column">
                              <div className="details-header">
                                <span className="details-icon">⚡</span>
                                <span className="details-label">Quick Actions</span>
                              </div>
                              <div className="action-buttons-compact">
                                {item.type === 'critical' && (
                                  <>
                                    <button
                                      className="btn-action-compact btn-danger"
                                      onClick={() => handleCreateCondition(item.issue)}
                                    >
                                      📋 Create Condition
                                    </button>
                                    <button
                                      className="btn-action-compact btn-primary"
                                      onClick={() => handleRequestDocument(item.field, item.issue)}
                                    >
                                      📄 Request Document
                                    </button>
                                  </>
                                )}
                                {item.type === 'warning' && (
                                  <>
                                    <button
                                      className="btn-action-compact btn-warning"
                                      onClick={() => handleCreateCondition(item.issue)}
                                    >
                                      📋 Create Condition
                                    </button>
                                    <button
                                      className="btn-action-compact btn-secondary"
                                      onClick={() => handleMarkReviewed(item.issue)}
                                    >
                                      ✓ Mark Reviewed
                                    </button>
                                  </>
                                )}
                                {item.type === 'field-error' && (
                                  <>
                                    <button
                                      className="btn-action-compact btn-primary"
                                      onClick={() => handleRequestDocument(item.field, item.issue)}
                                    >
                                      📄 Request New Document
                                    </button>
                                    <button
                                      className="btn-action-compact btn-secondary"
                                      onClick={() => handleOverride(item.field, item.validation)}
                                    >
                                      ✓ Override
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
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
