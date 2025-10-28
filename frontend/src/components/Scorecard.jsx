import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import '../styles/Scorecard.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function Scorecard({ scorecard, loan, documents }) {
  const [selectedCell, setSelectedCell] = useState(null); // { fieldName, documentId }
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);
  const [useTestPdf, setUseTestPdf] = useState(false);

  // Document selection state - initialize with all documents selected
  const [selectedDocIds, setSelectedDocIds] = useState(() =>
    documents ? documents.map(doc => doc.id) : []
  );

  // Sample PDF URL for testing
  const TEST_PDF_URL = 'https://pdfobject.com/pdf/sample.pdf';

  // Debug logging
  console.log('Scorecard - loan:', loan);
  console.log('Scorecard - documents:', documents);
  console.log('Scorecard - documents.length:', documents?.length);
  if (documents?.length > 0) {
    console.log('Scorecard - First document extractedData:', documents[0].extractedData);
  }

  if (!scorecard || !loan || !documents) {
    return (
      <div className="scorecard-empty">
        <div className="empty-icon">📊</div>
        <p>No scorecard data available</p>
      </div>
    );
  }

  // Define all fields we want to track (rows in the matrix)
  const dataFields = [
    { name: 'employeeName', label: 'Employee Name', byteLOSPath: 'borrower', category: 'Identity' },
    { name: 'employerName', label: 'Employer Name', byteLOSPath: 'borrower.employment.current.employerName', category: 'Employment' },
    { name: 'jobTitle', label: 'Job Title', byteLOSPath: 'borrower.employment.current.jobTitle', category: 'Employment' },
    { name: 'payPeriodStart', label: 'Pay Period Start', byteLOSPath: null, category: 'Income' },
    { name: 'payPeriodEnd', label: 'Pay Period End', byteLOSPath: null, category: 'Income' },
    { name: 'payDate', label: 'Pay Date', byteLOSPath: null, category: 'Income' },
    { name: 'grossPay', label: 'Gross Pay', byteLOSPath: 'mismo.income', category: 'Income' },
    { name: 'grossPayCurrent', label: 'Gross Pay Current', byteLOSPath: 'mismo.income', category: 'Income' },
    { name: 'netPay', label: 'Net Pay', byteLOSPath: null, category: 'Income' },
    { name: 'ytdGross', label: 'YTD Gross', byteLOSPath: null, category: 'Income' },
    { name: 'grossPayYTD', label: 'YTD Gross', byteLOSPath: null, category: 'Income' },
    { name: 'ytdNet', label: 'YTD Net', byteLOSPath: null, category: 'Income' },
    { name: 'regularHours', label: 'Regular Hours', byteLOSPath: null, category: 'Income' },
    { name: 'overtimeHours', label: 'Overtime Hours', byteLOSPath: null, category: 'Income' },
    { name: 'federalTax', label: 'Federal Tax', byteLOSPath: null, category: 'Deductions' },
    { name: 'stateTax', label: 'State Tax', byteLOSPath: null, category: 'Deductions' },
    { name: 'socialSecurity', label: 'Social Security', byteLOSPath: null, category: 'Deductions' },
    { name: 'medicare', label: 'Medicare', byteLOSPath: null, category: 'Deductions' },
    { name: 'propertyAddress', label: 'Property Address', byteLOSPath: 'mismo.propertyAddress', category: 'Property' },
    { name: 'propertyCity', label: 'Property City', byteLOSPath: 'mismo.propertyCity', category: 'Property' },
    { name: 'propertyState', label: 'Property State', byteLOSPath: 'mismo.propertyState', category: 'Property' },
    { name: 'propertyZip', label: 'Property ZIP', byteLOSPath: 'mismo.propertyZip', category: 'Property' },
    { name: 'accountNumber', label: 'Account Number', byteLOSPath: 'borrower.assets.bankAccounts[0].accountNumber', category: 'Banking' },
    { name: 'accountType', label: 'Account Type', byteLOSPath: 'borrower.assets.bankAccounts[0].accountType', category: 'Banking' },
    { name: 'bankName', label: 'Bank Name', byteLOSPath: 'borrower.assets.bankAccounts[0].bankName', category: 'Banking' },
    { name: 'institutionName', label: 'Bank Name', byteLOSPath: 'borrower.assets.bankAccounts[0].institutionName', category: 'Banking' },
    { name: 'balance', label: 'Account Balance', byteLOSPath: 'borrower.assets.bankAccounts[0].balance', category: 'Banking' },
    { name: 'endingBalance', label: 'Ending Balance', byteLOSPath: 'borrower.assets.bankAccounts[0].balance', category: 'Banking' },
    { name: 'accountHolderName', label: 'Account Holder', byteLOSPath: 'borrower.assets.bankAccounts[0].accountHolderName', category: 'Banking' },
  ];

  // Get ByteLOS value for a field
  const getByteLOSValue = (field) => {
    if (!field.byteLOSPath) return null;

    const paths = field.byteLOSPath.split('.');
    let value = loan;

    for (const path of paths) {
      if (value === null || value === undefined) return null;

      // Handle array indexing like "bankAccounts[0]"
      const arrayMatch = path.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        if (value[arrayName] && Array.isArray(value[arrayName])) {
          value = value[arrayName][parseInt(index)];
        } else {
          return null;
        }
      } else if (value[path] !== undefined) {
        value = value[path];
      } else {
        return null;
      }
    }

    // Special handling for employee name
    if (field.name === 'employeeName' && value && value.firstName && value.lastName) {
      return `${value.firstName} ${value.middleName ? value.middleName + ' ' : ''}${value.lastName}`;
    }

    return value;
  };

  // Get document value for a field
  const getDocumentValue = (doc, fieldName) => {
    if (!doc.extractedData || !doc.extractedData.data) return null;
    return doc.extractedData.data[fieldName];
  };

  // Normalize values for comparison
  const normalizeValue = (val) => {
    if (val === null || val === undefined) return '';
    return String(val).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  };

  // Compare document value with ByteLOS value
  const compareValues = (docValue, losValue) => {
    if (!docValue && !losValue) return 'na'; // Both empty - treat as N/A
    if (!docValue) return 'na'; // No data in document
    if (!losValue) return 'no-los'; // No ByteLOS data to compare

    const docNorm = normalizeValue(docValue);
    const losNorm = normalizeValue(losValue);

    return docNorm === losNorm ? 'match' : 'mismatch';
  };

  // Get cell status for a field/document combination
  const getCellStatus = (field, doc) => {
    const docValue = getDocumentValue(doc, field.name);
    const losValue = getByteLOSValue(field);
    return {
      status: compareValues(docValue, losValue),
      docValue,
      losValue
    };
  };

  // Handle cell click
  const handleCellClick = (field, doc) => {
    console.log('Cell clicked - document:', doc);
    console.log('Document s3Url:', doc.s3Url);
    setSelectedCell({ fieldName: field.name, documentId: doc.id, fieldLabel: field.label });
    setSelectedDocument(doc);
    setPageNumber(1);
    setPdfError(null);
  };

  // Handle PDF load success
  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('PDF loaded successfully! Pages:', numPages);
    setNumPages(numPages);
    setPdfError(null);
  };

  // Handle PDF load error
  const onDocumentLoadError = (error) => {
    console.error('PDF Load Error:', error);
    console.error('Error details:', error.message, error.name);
    setPdfError(`Failed to load PDF: ${error.message || 'Unknown error'}`);
  };

  // Get icon for cell status
  const getCellIcon = (status) => {
    switch (status) {
      case 'match':
        return '✓';
      case 'mismatch':
        return '✗';
      case 'na':
      case 'no-los':
        return '—';
      default:
        return '—';
    }
  };

  // State for action modals
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [selectedFieldForAction, setSelectedFieldForAction] = useState(null);

  // State for toasts and agent results
  const [toasts, setToasts] = useState([]);
  const [agentResults, setAgentResults] = useState({}); // Track agent results after they complete

  // Handle action button clicks
  const handleAssignAgent = (field) => {
    const suggestedAgent = getSuggestedAgent(field);
    setSelectedFieldForAction({ field, agent: suggestedAgent });
    setShowAgentPanel(true);
  };

  const handleCreateCondition = (field) => {
    setSelectedFieldForAction({ field });
    setShowConditionModal(true);
  };

  const handleIgnoreMismatch = (field) => {
    if (window.confirm(`🚫 Ignore Mismatch for ${field.label}?\n\nThis will mark the discrepancy as acceptable and remove it from the review list.\n\nAre you sure?`)) {
      alert(`✓ Mismatch for ${field.label} has been marked as ignored.`);
      console.log(`Mismatch ignored for field: ${field.label}`);
    }
  };

  // Generate agent result based on agent type and field
  const generateAgentResult = (agent, field) => {
    const fieldName = field.label.toLowerCase();

    // Define outcomes based on agent types
    const outcomes = {
      'agent-007': { // Name Reconciliation
        type: 'analysis',
        title: '👤 Name Reconciliation Complete',
        findings: [
          `Analyzed name variations across documents`,
          `Cross-referenced with social security records`,
          `Verified identity through multiple sources`,
          `Match confidence: ${Math.floor(Math.random() * 15 + 85)}%`
        ],
        recommendation: 'Name discrepancy resolved. Identity verified across all documents.'
      },
      'agent-003': { // Employment Verification
        type: 'rectified',
        title: '💼 Employment Verification Complete',
        findings: [
          `Verified employment status with employer`,
          `Confirmed job title and employment dates`,
          `Validated employer information`,
          `Employment verification completed successfully`
        ],
        recommendation: '✓ Employment details confirmed. No action required.'
      },
      'agent-002': { // Income Verification
        type: 'analysis',
        title: '💰 Income Verification Complete',
        findings: [
          `Calculated YTD income from paystub data`,
          `Cross-referenced with tax documents`,
          `Validated income consistency across sources`,
          `Annual income projection: $${Math.floor(Math.random() * 30000 + 120000).toLocaleString()}`
        ],
        recommendation: 'Income verified and consistent. Meets loan requirements.'
      },
      'agent-006': { // Property Matcher
        type: 'rectified',
        title: '🏠 Property Match Complete',
        findings: [
          `Matched property address across all documents`,
          `Verified property details with public records`,
          `Confirmed address format consistency`,
          `Property information validated`
        ],
        recommendation: '✓ Property details match across all sources. Verified.'
      },
      'agent-015': { // Consistency Checker
        type: 'analysis',
        title: '🔗 Consistency Check Complete',
        findings: [
          `Compared data across ${documents.length} documents`,
          `Identified minor formatting variations`,
          `Cross-validated all available data points`,
          `Overall consistency: ${Math.floor(Math.random() * 10 + 90)}%`
        ],
        recommendation: 'Data is consistent across documents. Minor variations are acceptable.'
      }
    };

    // Return the agent-specific result or a generic one
    return outcomes[agent.id] || {
      type: 'analysis',
      title: `${agent.icon} ${agent.name} Complete`,
      findings: [
        `Analyzed ${fieldName} for discrepancies`,
        `Reviewed validation rules and requirements`,
        `Compared data across available documents`,
        `Verification completed successfully`
      ],
      recommendation: 'Analysis complete. Review findings and proceed accordingly.'
    };
  };

  // Assign agent and create toast
  const assignAgent = (agent, field, fieldKey) => {
    // Mark agent as assigned
    setShowAgentPanel(false);
    setSelectedFieldForAction(null);

    // Create toast notification
    const toastId = Date.now();
    const newToast = {
      id: toastId,
      agent: agent,
      field: field,
      timestamp: new Date().toISOString()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 5000);

    // Simulate agent working and generate results after 5 seconds
    setTimeout(() => {
      const result = generateAgentResult(agent, field);
      setAgentResults(prev => ({
        ...prev,
        [fieldKey]: {
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

  // Confirm agent assignment
  const confirmAgentAssignment = () => {
    if (selectedFieldForAction) {
      const fieldKey = `field-${selectedFieldForAction.field.name}`;
      assignAgent(selectedFieldForAction.agent, selectedFieldForAction.field, fieldKey);
    }
  };

  // Save condition
  const saveCondition = (notes) => {
    if (selectedFieldForAction) {
      const condition = {
        field: selectedFieldForAction.field.label,
        description: `Verify ${selectedFieldForAction.field.label} - Resolve data discrepancy`,
        notes: notes || '',
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      console.log('Condition created:', condition);
      alert(`✓ Condition created for ${selectedFieldForAction.field.label}`);
      setShowConditionModal(false);
      setSelectedFieldForAction(null);
    }
  };

  // Group fields by category
  const fieldsByCategory = dataFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {});

  // Get suggested agent for a mismatch
  const getSuggestedAgent = (field) => {
    if (field.category === 'Identity') return { id: 'agent-007', name: 'Name Reconciliation', icon: '👤' };
    if (field.category === 'Employment') return { id: 'agent-003', name: 'Employment Verification', icon: '💼' };
    if (field.category === 'Income') return { id: 'agent-002', name: 'Income Verification', icon: '💰' };
    if (field.category === 'Property') return { id: 'agent-006', name: 'Property Matcher', icon: '🏠' };
    if (field.category === 'Banking') return { id: 'agent-015', name: 'Consistency Checker', icon: '🔗' };
    return { id: 'agent-015', name: 'Consistency Checker', icon: '🔗' };
  };

  // Calculate complexity score for a field with mismatches (1-10 scale)
  const getComplexityScore = (field, docs) => {
    // Count number of mismatches
    const mismatchCount = docs.filter(doc =>
      getCellStatus(field, doc).status === 'mismatch'
    ).length;

    if (mismatchCount === 0) return 0; // No mismatches

    // Base complexity by category
    const categoryComplexity = {
      'Identity': 8, // High complexity - critical field, requires verification
      'Employment': 7, // High - needs employer verification
      'Income': 9, // Very high - financial calculations, YTD tracking
      'Property': 6, // Medium-high - address matching
      'Banking': 7, // High - financial data, account verification
      'Deductions': 5, // Medium - tax calculations
      'Default': 5
    };

    const baseScore = categoryComplexity[field.category] || categoryComplexity['Default'];

    // Adjust based on number of mismatches
    // More mismatches = higher complexity
    const mismatchFactor = Math.min(mismatchCount * 0.5, 2); // Cap at +2

    // Final score (1-10 scale)
    const finalScore = Math.min(Math.max(Math.round(baseScore + mismatchFactor), 1), 10);

    return finalScore;
  };

  // Get color for complexity score
  const getComplexityColor = (score) => {
    if (score <= 3) return '#10b981'; // Green - Easy
    if (score <= 6) return '#f59e0b'; // Orange - Medium
    return '#ef4444'; // Red - Hard
  };

  // Get label for complexity score
  const getComplexityLabel = (score) => {
    if (score <= 3) return 'Easy';
    if (score <= 6) return 'Medium';
    if (score <= 8) return 'Hard';
    return 'Very Hard';
  };

  // Document selection handlers
  const toggleDocumentSelection = (docId) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocIds(documents.map(doc => doc.id));
  };

  const deselectAllDocuments = () => {
    setSelectedDocIds([]);
  };

  // Filter documents based on selection
  const filteredDocuments = documents.filter(doc => selectedDocIds.includes(doc.id));

  // Calculate statistics (based on filtered documents)
  const stats = {
    totalCells: dataFields.length * filteredDocuments.length,
    matches: 0,
    mismatches: 0,
    na: 0
  };

  filteredDocuments.forEach(doc => {
    dataFields.forEach(field => {
      const cellStatus = getCellStatus(field, doc);
      if (cellStatus.status === 'match') stats.matches++;
      if (cellStatus.status === 'mismatch') stats.mismatches++;
      if (cellStatus.status === 'na' || cellStatus.status === 'no-los') stats.na++;
    });
  });

  return (
    <div className="scorecard-matrix">
      {/* Header with Stats */}
      <div className="scorecard-header">
        <div className="scorecard-title">
          <h2>📊 Data Validation Matrix</h2>
          <p>Cross-reference of all extracted data vs ByteLOS</p>
        </div>
        <div className="scorecard-stats">
          <div className="stat-box match">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-value">{stats.matches}</div>
              <div className="stat-label">Matches</div>
            </div>
          </div>
          <div className="stat-box mismatch">
            <div className="stat-icon">✗</div>
            <div className="stat-content">
              <div className="stat-value">{stats.mismatches}</div>
              <div className="stat-label">Mismatches</div>
            </div>
          </div>
          <div className="stat-box na">
            <div className="stat-icon">—</div>
            <div className="stat-content">
              <div className="stat-value">{stats.na}</div>
              <div className="stat-label">N/A</div>
            </div>
          </div>
          <div className="stat-box total">
            <div className="stat-icon">∑</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalCells}</div>
              <div className="stat-label">Total Cells</div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Selector */}
      <div className="document-selector">
        <div className="selector-header">
          <h3>📄 Document Selector</h3>
          <p>Select which documents to compare in the grid</p>
        </div>
        <div className="selector-controls">
          <button
            className="selector-btn"
            onClick={selectAllDocuments}
            disabled={selectedDocIds.length === documents.length}
          >
            ✓ Select All
          </button>
          <button
            className="selector-btn"
            onClick={deselectAllDocuments}
            disabled={selectedDocIds.length === 0}
          >
            ✗ Deselect All
          </button>
          <div className="selection-count">
            {selectedDocIds.length} of {documents.length} selected
          </div>
        </div>
        <div className="document-checkboxes">
          {documents.map((doc, idx) => (
            <label key={doc.id} className="document-checkbox-item">
              <input
                type="checkbox"
                checked={selectedDocIds.includes(doc.id)}
                onChange={() => toggleDocumentSelection(doc.id)}
                className="document-checkbox"
              />
              <div className="document-checkbox-content">
                <div className="document-checkbox-icon">📄</div>
                <div className="document-checkbox-info">
                  <div className="document-checkbox-name" title={doc.fileName}>
                    {doc.fileName}
                  </div>
                  <div className="document-checkbox-type">{doc.documentType}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Main Matrix Layout */}
      <div className="matrix-layout">
        {/* Matrix Table */}
        <div className="matrix-container">
          <div className="matrix-table-wrapper">
            <table className="data-matrix">
              <thead>
                <tr>
                  <th className="field-header sticky-header">
                    <div className="header-content">
                      <div>Data Field</div>
                      <div className="header-subtitle">ByteLOS Value</div>
                    </div>
                  </th>
                  {filteredDocuments.map((doc, idx) => (
                    <th
                      key={doc.id}
                      className={`doc-header ${selectedCell?.documentId === doc.id ? 'selected-column' : ''}`}
                      title={`${doc.fileName}\n${doc.documentType}`}
                    >
                      <div className="doc-header-content">
                        <div className="doc-number">#{idx + 1}</div>
                      </div>
                    </th>
                  ))}
                  <th className="complexity-header">
                    <div className="header-content">
                      <div>Complexity</div>
                      <div className="header-subtitle">1-10 Scale</div>
                    </div>
                  </th>
                  <th className={`actions-header sticky-header-right ${selectedCell?.documentId ? 'selected-column' : ''}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(fieldsByCategory).map(([category, fields]) => (
                  <>
                    <tr key={`category-${category}`} className="category-row">
                      <td className="category-cell" colSpan={filteredDocuments.length + 3}>
                        <div className="category-label">{category}</div>
                      </td>
                    </tr>
                    {fields.map(field => {
                      const losValue = getByteLOSValue(field);
                      const hasAnyMismatch = filteredDocuments.some(doc =>
                        getCellStatus(field, doc).status === 'mismatch'
                      );
                      const suggestedAgent = getSuggestedAgent(field);

                      return (
                        <tr key={field.name} className={`data-row ${selectedCell?.fieldName === field.name ? 'selected-row' : ''}`}>
                          <td className={`field-cell sticky-column`}>
                            <div className="field-content">
                              <div className="field-label">{field.label}</div>
                              <div className="field-bytelos-value" title={losValue || 'No ByteLOS data'}>
                                {losValue ? (
                                  <span className="bytelos-value">{String(losValue)}</span>
                                ) : (
                                  <span className="bytelos-empty">—</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {filteredDocuments.map(doc => {
                            const cellData = getCellStatus(field, doc);
                            const isSelected = selectedCell?.fieldName === field.name &&
                                             selectedCell?.documentId === doc.id;

                            return (
                              <td
                                key={`${field.name}-${doc.id}`}
                                className={`data-cell ${cellData.status} ${isSelected ? 'selected' : ''} ${selectedCell?.documentId === doc.id ? 'selected-column' : ''}`}
                                onClick={() => handleCellClick(field, doc)}
                                title={cellData.status === 'match'
                                  ? `✓ ${cellData.docValue}`
                                  : cellData.status === 'mismatch'
                                  ? `Doc: ${cellData.docValue}\nBytelOS: ${cellData.losValue}`
                                  : `${field.label}: ${cellData.docValue || 'No data'}`
                                }
                              >
                                <div className="cell-content">
                                  <div className="cell-icon">
                                    {getCellIcon(cellData.status)}
                                  </div>
                                  {cellData.docValue && (
                                    <div className="cell-value" title={String(cellData.docValue)}>
                                      {String(cellData.docValue).length > 30
                                        ? String(cellData.docValue).substring(0, 27) + '...'
                                        : String(cellData.docValue)
                                      }
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                          <td className="complexity-cell">
                            {hasAnyMismatch && (() => {
                              const complexityScore = getComplexityScore(field, filteredDocuments);
                              const complexityColor = getComplexityColor(complexityScore);
                              const complexityLabel = getComplexityLabel(complexityScore);

                              return (
                                <div className="complexity-indicator" title={`${complexityLabel} - Score: ${complexityScore}/10`}>
                                  <div className="complexity-score" style={{ color: complexityColor }}>
                                    {complexityScore}
                                  </div>
                                  <div className="complexity-bar">
                                    <div
                                      className="complexity-bar-fill"
                                      style={{
                                        width: `${complexityScore * 10}%`,
                                        background: complexityColor
                                      }}
                                    ></div>
                                  </div>
                                  <div className="complexity-label" style={{ color: complexityColor }}>
                                    {complexityLabel}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className={`actions-cell sticky-column-right`}>
                            {hasAnyMismatch && (
                              <>
                                <div className="action-buttons">
                                  <button
                                    className="action-btn agent-btn"
                                    title={`Assign to ${suggestedAgent.name}`}
                                    onClick={() => handleAssignAgent(field)}
                                  >
                                    {suggestedAgent.icon} Agent
                                  </button>
                                  <button
                                    className="action-btn condition-btn"
                                    title="Create Condition"
                                    onClick={() => handleCreateCondition(field)}
                                  >
                                    📋 Condition
                                  </button>
                                  <button
                                    className="action-btn ignore-btn"
                                    title="Ignore Mismatch"
                                    onClick={() => handleIgnoreMismatch(field)}
                                  >
                                    🚫 Ignore
                                  </button>
                                </div>

                                {/* Agent Results Section */}
                                {(() => {
                                  const fieldKey = `field-${field.name}`;
                                  const agentResult = agentResults[fieldKey];

                                  if (!agentResult) return null;

                                  const resultTypeClass = agentResult.result.type === 'rectified' ? 'success' :
                                                         agentResult.result.type === 'alert' ? 'alert' : 'info';

                                  return (
                                    <div className={`agent-result ${resultTypeClass}`}>
                                      <div className="agent-result-header">
                                        <span className="agent-result-icon">{agentResult.agent.icon}</span>
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
                                })()}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Viewer Panel */}
        {selectedDocument && (
          <div className="document-viewer-panel">
            <div className="viewer-header">
              <h3>📄 {selectedDocument.fileName}</h3>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  style={{
                    padding: '0.35rem 0.6rem',
                    background: useTestPdf ? '#10b981' : '#667eea',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                  onClick={() => {
                    setUseTestPdf(!useTestPdf);
                    setPdfError(null);
                    setPageNumber(1);
                  }}
                  title={useTestPdf ? 'Switch to actual document' : 'Test with sample PDF'}
                >
                  {useTestPdf ? '✓ Test Mode' : '🧪 Test PDF'}
                </button>
                <button
                  className="close-viewer-btn"
                  onClick={() => {
                    setSelectedDocument(null);
                    setSelectedCell(null);
                    setUseTestPdf(false);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="viewer-body">
              {(selectedDocument.s3Url || useTestPdf) ? (
                (() => {
                  const docUrl = useTestPdf ? TEST_PDF_URL : selectedDocument.s3Url;
                  const isHtml = docUrl && docUrl.toLowerCase().endsWith('.html');

                  // If it's an HTML document, use iframe
                  if (isHtml && !useTestPdf) {
                    return (
                      <div className="html-viewer-container" style={{ width: '100%', height: '100%' }}>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', wordBreak: 'break-all', background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                          <strong>Document URL:</strong> {docUrl}
                        </div>
                        <iframe
                          src={docUrl}
                          style={{
                            width: '100%',
                            height: 'calc(100% - 3rem)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            background: 'white'
                          }}
                          title={selectedDocument.fileName}
                        />
                      </div>
                    );
                  }

                  // Otherwise use PDF viewer
                  return (
                    <div className="pdf-viewer-container">
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem', wordBreak: 'break-all', background: useTestPdf ? '#d1fae5' : '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                        {useTestPdf ? (
                          <><strong>Test Mode:</strong> {TEST_PDF_URL}</>
                        ) : (
                          <><strong>Document URL:</strong> {selectedDocument.s3Url}</>
                        )}
                      </div>
                      {pdfError ? (
                        <div className="pdf-error">
                          <div className="error-icon">⚠️</div>
                          <p>{pdfError}</p>
                          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            URL: {selectedDocument.s3Url}
                          </p>
                          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                            Please check the document URL or contact support.
                          </p>
                        </div>
                      ) : (
                        <>
                          <Document
                            file={useTestPdf ? TEST_PDF_URL : selectedDocument.s3Url}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                              <div className="pdf-loading">
                                <div className="loading-spinner"></div>
                                <p>Loading PDF...</p>
                                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#667eea' }}>
                                  {useTestPdf ? TEST_PDF_URL : selectedDocument.s3Url}
                                </p>
                              </div>
                            }
                            options={{
                              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                              cMapPacked: true,
                            }}
                          >
                            <Page
                              pageNumber={pageNumber}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              width={420}
                            />
                          </Document>

                          {numPages && numPages > 1 && (
                            <div className="pdf-controls">
                              <button
                                className="btn-control"
                                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                disabled={pageNumber <= 1}
                              >
                                ← Previous
                              </button>
                              <span className="page-info">
                                Page {pageNumber} of {numPages}
                              </span>
                              <button
                                className="btn-control"
                                onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                                disabled={pageNumber >= numPages}
                              >
                                Next →
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="pdf-placeholder">
                  <div className="pdf-icon">📄</div>
                  <p className="pdf-filename">{selectedDocument.fileName}</p>
                  <p className="pdf-note">No document URL available</p>
                  <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '1rem' }}>
                    This document may need to be uploaded or the URL is missing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="matrix-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-icon match">✓</div>
            <span>Match with ByteLOS</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon mismatch">✗</div>
            <span>Mismatch with ByteLOS</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon na">—</div>
            <span>Field not in document</span>
          </div>
          <div className="legend-item">
            <div className="legend-icon no-los">?</div>
            <span>No ByteLOS data to compare</span>
          </div>
        </div>
      </div>

      {/* Agent Assignment Panel */}
      {showAgentPanel && selectedFieldForAction && (
        <div className="modal-overlay" onClick={() => setShowAgentPanel(false)}>
          <div className="modal-content agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedFieldForAction.agent.icon} Assign Agent</h3>
              <button className="close-btn" onClick={() => setShowAgentPanel(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="agent-info">
                <div className="agent-icon-large">{selectedFieldForAction.agent.icon}</div>
                <div>
                  <h4>{selectedFieldForAction.agent.name}</h4>
                  <p className="agent-id">{selectedFieldForAction.agent.id}</p>
                </div>
              </div>
              <div className="field-info">
                <label>Field:</label>
                <p><strong>{selectedFieldForAction.field.label}</strong></p>
                <label>Issue:</label>
                <p>Data mismatch detected between document and ByteLOS</p>
                <label>Action:</label>
                <p>This agent will analyze the discrepancy and provide recommendations for resolution.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAgentPanel(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmAgentAssignment}>
                {selectedFieldForAction.agent.icon} Assign Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Condition Modal */}
      {showConditionModal && selectedFieldForAction && (
        <div className="modal-overlay" onClick={() => setShowConditionModal(false)}>
          <div className="modal-content condition-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 Create Condition</h3>
              <button className="close-btn" onClick={() => setShowConditionModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Field:</label>
                <input type="text" value={selectedFieldForAction.field.label} disabled className="form-input" />
              </div>
              <div className="form-group">
                <label>Condition Description:</label>
                <input
                  type="text"
                  value={`Verify ${selectedFieldForAction.field.label} - Resolve data discrepancy`}
                  disabled
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Notes (Optional):</label>
                <textarea
                  id="condition-notes"
                  className="form-textarea"
                  rows="4"
                  placeholder="Add any additional notes or instructions..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConditionModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const notes = document.getElementById('condition-notes')?.value;
                  saveCondition(notes);
                }}
              >
                📋 Create Condition
              </button>
            </div>
          </div>
        </div>
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
                Working on: {toast.field.label}
              </div>
            </div>
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Scorecard;
