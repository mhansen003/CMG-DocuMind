import { useState } from 'react';
import AgentOrchestration from '../components/AgentOrchestration';
import AgentFlowDiagram from '../components/AgentFlowDiagram';
import '../styles/Agents.css';

// Sample execution logs for agents
const sampleLogs = {
  'agent-001': [
    {
      id: 'log-001-1',
      timestamp: '2024-10-27T14:23:00Z',
      trigger: 'Manual',
      context: { document_type: 'W-2 Form', deadline: 'Nov 5, 2024', loan_id: 'CMG-2024-001' },
      result: 'Email drafted and sent to michael.thompson@email.com requesting 2023 W-2. Deadline: Nov 5, 2024. Tracking ID: REQ-10234',
      success: true
    },
    {
      id: 'log-001-2',
      timestamp: '2024-10-26T09:15:00Z',
      trigger: 'Validation Error',
      context: { document_type: 'Bank Statement', deadline: 'Nov 1, 2024', loan_id: 'CMG-2024-001' },
      result: 'Email sent requesting most recent 2 months bank statements. Follow-up scheduled for Oct 29.',
      success: true
    }
  ],
  'agent-002': [
    {
      id: 'log-002-1',
      timestamp: '2024-10-27T10:45:00Z',
      trigger: 'Document Upload',
      context: { loan_id: 'CMG-2024-001', paystub_ytd: 126634, w2_wages: 145000, stated_income: 165000 },
      result: 'Discrepancy found: Paystub YTD ($126,634) trending 8% below stated income ($165,000). This appears consistent with reduced overtime in recent periods. Recommend verifying with additional paystubs.',
      success: true
    }
  ],
  'agent-004': [
    {
      id: 'log-004-1',
      timestamp: '2024-10-27T15:30:00Z',
      trigger: 'Document Upload',
      context: { loan_id: 'CMG-2024-001', document: 'paystub-001', current_date: '2024-10-27' },
      result: 'Date validation complete: Pay period end (Oct 15) within 60-day window ✓. Pay date logic issue detected: Pay date (Oct 20) is 5 days after period end - flagged as WARNING.',
      success: false
    }
  ]
};

// Sample agent definitions with triggers and logs
const initialAgents = [
  {
    id: 'agent-001',
    name: 'Document Request Agent',
    icon: '📄',
    category: 'Communication',
    description: 'Automatically drafts and sends document request emails to borrowers with specific items needed and deadline',
    prompt: 'Draft a professional email requesting the following document: {document_type}. Include: 1) Specific requirements, 2) Deadline of {deadline}, 3) Upload instructions, 4) Contact information for questions. Tone should be friendly but clear about urgency.',
    triggers: ['Manual', 'Validation Error', 'Condition Created'],
    enabled: true,
    usageCount: 143,
    executionLogs: sampleLogs['agent-001'] || []
  },
  {
    id: 'agent-002',
    name: 'Income Verification Agent',
    icon: '💰',
    category: 'Analysis',
    description: 'Cross-references paystub data with W2s, tax returns, and stated income to identify discrepancies',
    prompt: 'Analyze the following income documents and compare: 1) Current paystub YTD income, 2) W2 total wages, 3) Tax return AGI, 4) Stated income on application. Flag any discrepancies >5% and explain the variance. Calculate projected annual income.',
    triggers: ['Document Upload', 'Manual', 'Loan Status Change'],
    enabled: true,
    usageCount: 289,
    executionLogs: sampleLogs['agent-002'] || []
  },
  {
    id: 'agent-003',
    name: 'Employment Verification Agent',
    icon: '💼',
    category: 'Verification',
    description: 'Verifies employer information matches across paystubs, VOE forms, and application data',
    prompt: 'Verify employment consistency across documents: 1) Employer name spelling and variations, 2) Job title matches, 3) Start date consistency, 4) Income amounts align, 5) Contact information valid. Create verification checklist with pass/fail for each item.',
    triggers: ['Document Upload', 'Manual'],
    enabled: true,
    usageCount: 201,
    executionLogs: []
  },
  {
    id: 'agent-004',
    name: 'Date Validation Agent',
    icon: '📅',
    category: 'Compliance',
    description: 'Ensures all document dates are within required recency windows and logical sequence',
    prompt: 'Check document dates for compliance: 1) Documents must be dated within 60 days of {current_date}, 2) Pay period dates must be logical (end after start), 3) Pay date must be on/after period end, 4) No future dates. List all date violations with severity (critical/warning).',
    triggers: ['Document Upload', 'Scheduled Daily'],
    enabled: true,
    usageCount: 456,
    executionLogs: sampleLogs['agent-004'] || []
  },
  {
    id: 'agent-005',
    name: 'Condition Generator Agent',
    icon: '📋',
    category: 'Workflow',
    description: 'Creates formal underwriting conditions from validation errors with specific resolution steps',
    prompt: 'Convert this validation error into an underwriting condition: {error_message}. Include: 1) Clear condition title, 2) Detailed explanation of issue, 3) Specific steps to resolve, 4) Required documentation, 5) Expected timeline, 6) Impact on loan if unresolved.',
    triggers: ['Validation Error', 'Manual'],
    enabled: true,
    usageCount: 178,
    executionLogs: []
  },
  {
    id: 'agent-006',
    name: 'Property Address Matcher',
    icon: '🏠',
    category: 'Verification',
    description: 'Normalizes and matches property addresses across all loan documents and public records',
    prompt: 'Compare property addresses from: 1) Loan application, 2) Appraisal, 3) Title report, 4) Purchase agreement, 5) HOA documents. Normalize street abbreviations (St, Street, Ave, Avenue). Flag mismatches and suggest canonical address format.',
    triggers: ['Document Upload', 'Manual'],
    enabled: true,
    usageCount: 134,
    executionLogs: []
  },
  {
    id: 'agent-007',
    name: 'Borrower Name Reconciliation',
    icon: '👤',
    category: 'Verification',
    description: 'Matches borrower names across documents accounting for middle names, suffixes, and legal variations',
    prompt: 'Verify borrower name consistency across documents: 1) Full legal name from application, 2) Paystub name, 3) W2 name, 4) Tax return name, 5) ID/DL name. Account for: middle names, nicknames, maiden names, suffixes (Jr, Sr, II). Flag significant mismatches.',
    triggers: ['Document Upload', 'Manual'],
    enabled: false,
    usageCount: 89,
    executionLogs: []
  },
  {
    id: 'agent-008',
    name: 'Document Stip List Generator',
    icon: '📝',
    category: 'Workflow',
    description: 'Analyzes all validation issues to create prioritized outstanding items list',
    prompt: 'Review all validation results and generate prioritized stip list: 1) Critical items blocking approval, 2) Standard conditions, 3) Nice-to-have items. For each: document needed, reason required, deadline, assigned party (borrower/processor/LO). Sort by urgency.',
    triggers: ['Loan Status Change', 'Manual', 'Scheduled Daily'],
    enabled: true,
    usageCount: 267,
    executionLogs: []
  },
  {
    id: 'agent-009',
    name: 'Fraud Detection Agent',
    icon: '🔍',
    category: 'Risk',
    description: 'Scans for common fraud indicators like altered fonts, inconsistent formatting, or suspicious patterns',
    prompt: 'Analyze document for fraud indicators: 1) Font inconsistencies within document, 2) Alignment irregularities, 3) Mathematical errors in calculations, 4) Unusual employer names or addresses, 5) Income amounts that seem inflated, 6) Rounded numbers when specific amounts expected. Score risk 1-10.',
    triggers: ['Document Upload', 'Manual'],
    enabled: true,
    usageCount: 92,
    executionLogs: []
  },
  {
    id: 'agent-010',
    name: 'Missing Document Predictor',
    icon: '🎯',
    category: 'Analysis',
    description: 'Predicts which documents will be needed next based on loan type, validation results, and current status',
    prompt: 'Based on: 1) Loan type: {loan_type}, 2) Current document set, 3) Validation results, 4) Loan amount and LTV, predict next 5 most likely documents to be requested. For each, explain why it will be needed and probability (high/medium/low).',
    triggers: ['Loan Status Change', 'Document Upload', 'Manual'],
    enabled: true,
    usageCount: 156,
    executionLogs: []
  },
  // NEW: 5 Additional Agents for Document Issue Handling
  {
    id: 'agent-011',
    name: 'Calculation Verifier Agent',
    icon: '🧮',
    category: 'Analysis',
    description: 'Verifies mathematical accuracy in documents - paystub calculations, loan amounts, DTI ratios, etc.',
    prompt: 'Verify calculations in document: 1) Gross pay = (hours × rate) + overtime + bonuses, 2) Net pay = gross - deductions, 3) YTD totals add up correctly, 4) Tax withholdings reasonable (15-35% range), 5) Retirement deductions match stated percentage. Flag any calculation errors with expected vs actual values.',
    triggers: ['Document Upload', 'Validation Error', 'Manual'],
    enabled: true,
    usageCount: 78,
    executionLogs: []
  },
  {
    id: 'agent-012',
    name: 'Document Expiration Tracker',
    icon: '⏰',
    category: 'Compliance',
    description: 'Monitors document expiration dates and triggers re-requests before documents become stale',
    prompt: 'Track document ages and flag expiring documents: 1) Documents >45 days old = WARNING, 2) Documents >60 days old = CRITICAL, 3) Calculate days until expiration, 4) Prioritize by loan closing date proximity, 5) Generate re-request list with urgency levels. Consider: paystubs (60 days), bank statements (60 days), credit reports (120 days).',
    triggers: ['Scheduled Daily', 'Manual', 'Loan Status Change'],
    enabled: true,
    usageCount: 234,
    executionLogs: []
  },
  {
    id: 'agent-013',
    name: 'Format Inconsistency Detector',
    icon: '🎨',
    category: 'Risk',
    description: 'Identifies formatting anomalies that might indicate document tampering or errors',
    prompt: 'Analyze document formatting for inconsistencies: 1) Multiple fonts used (should be 1-2 max), 2) Font size variations within same section, 3) Misaligned columns or tables, 4) Inconsistent spacing or margins, 5) White-out or overlay artifacts, 6) Image resolution differences. Score each issue (minor/moderate/severe) and provide overall risk assessment.',
    triggers: ['Document Upload', 'Manual'],
    enabled: true,
    usageCount: 45,
    executionLogs: []
  },
  {
    id: 'agent-014',
    name: 'Missing Field Completion Agent',
    icon: '✍️',
    category: 'Workflow',
    description: 'Identifies required fields that are blank or incomplete and suggests data sources to complete them',
    prompt: 'Scan for incomplete fields: 1) Required fields that are blank, 2) Fields with partial data (e.g., partial SSN, incomplete address), 3) Look for this data in other uploaded documents, 4) Suggest which document likely contains the missing data, 5) If not found, recommend document to request. Create action plan with: field name, current value, suggested source, priority (critical/standard).',
    triggers: ['Document Upload', 'Validation Error', 'Manual'],
    enabled: true,
    usageCount: 167,
    executionLogs: []
  },
  {
    id: 'agent-015',
    name: 'Cross-Document Consistency Checker',
    icon: '🔗',
    category: 'Verification',
    description: 'Validates that key data points match across multiple documents (SSN, DOB, addresses, names, etc.)',
    prompt: 'Cross-reference critical data across all documents: 1) SSN consistency (application, W2, paystub, tax return), 2) Date of birth matches everywhere, 3) Current address consistent, 4) Property address matches across all property docs, 5) Phone numbers and email addresses consistent, 6) Employment dates align. Create matrix showing each field and which documents contain it, flag any mismatches with severity level.',
    triggers: ['Document Upload', 'Manual', 'Validation Error'],
    enabled: true,
    usageCount: 201,
    executionLogs: []
  }
];

function Agents({ onBack }) {
  const [agents, setAgents] = useState(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState({});
  const [activeDetailTab, setActiveDetailTab] = useState('details'); // 'details', 'orchestration', 'visual'
  const [viewMode, setViewMode] = useState('expanded'); // 'compact' or 'expanded'

  const categories = ['all', ...new Set(agents.map(a => a.category))];

  const filteredAgents = filterCategory === 'all'
    ? agents
    : agents.filter(a => a.category === filterCategory);

  const handleEditAgent = (agent) => {
    setEditingAgent({...agent});
    setShowModal(true);
  };

  const handleAddNewAgent = () => {
    setEditingAgent({
      id: `agent-${Date.now()}`,
      name: '',
      icon: '🤖',
      category: 'Analysis',
      description: '',
      prompt: '',
      triggers: ['Manual'],
      enabled: true,
      usageCount: 0,
      executionLogs: []
    });
    setShowModal(true);
  };

  const handleSaveAgent = () => {
    if (!editingAgent.name || !editingAgent.prompt) {
      alert('Please fill in agent name and prompt');
      return;
    }

    if (agents.find(a => a.id === editingAgent.id)) {
      // Update existing
      setAgents(agents.map(a => a.id === editingAgent.id ? editingAgent : a));
    } else {
      // Add new
      setAgents([...agents, editingAgent]);
    }
    setShowModal(false);
    setEditingAgent(null);
  };

  const handleToggleAgent = (agentId) => {
    setAgents(agents.map(a =>
      a.id === agentId ? { ...a, enabled: !a.enabled } : a
    ));
  };

  const handleDeleteAgent = (agentId) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      setAgents(agents.filter(a => a.id !== agentId));
    }
  };

  const toggleLogExpansion = (agentId) => {
    setExpandedLogs(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const getTriggerIcon = (trigger) => {
    const icons = {
      'Manual': '👆',
      'Document Upload': '📤',
      'Validation Error': '⚠️',
      'Condition Created': '📋',
      'Loan Status Change': '🔄',
      'Scheduled Daily': '⏰'
    };
    return icons[trigger] || '🔔';
  };

  const handleToggleTrigger = (trigger) => {
    const triggers = editingAgent.triggers || [];
    if (triggers.includes(trigger)) {
      setEditingAgent({
        ...editingAgent,
        triggers: triggers.filter(t => t !== trigger)
      });
    } else {
      setEditingAgent({
        ...editingAgent,
        triggers: [...triggers, trigger]
      });
    }
  };

  return (
    <div className="agents-container">
      {/* Header */}
      <div className="agents-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => onBack && onBack()}>
            ← Back to Dashboard
          </button>
          <h1>🤖 Intelligent Agents</h1>
          <p>Micro-task automation agents for document processing and validation</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => setViewMode('compact')}
              title="Compact View"
            >
              ☰ Compact
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'expanded' ? 'active' : ''}`}
              onClick={() => setViewMode('expanded')}
              title="Expanded View"
            >
              ⊞ Expanded
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleAddNewAgent}>
            ➕ Add New Agent
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-bar">
        <div className="filter-label">Filter by Category:</div>
        <div className="filter-buttons">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? 'All Agents' : cat}
            </button>
          ))}
        </div>
        <div className="agents-stats">
          <span>{filteredAgents.length} agents</span>
          <span>•</span>
          <span>{filteredAgents.filter(a => a.enabled).length} enabled</span>
        </div>
      </div>

      {/* Agents Grid */}
      <div className={`agents-grid ${viewMode === 'compact' ? 'compact-view' : 'expanded-view'}`}>
        {filteredAgents.map(agent => (
          <div key={agent.id} className={`agent-card ${!agent.enabled ? 'disabled' : ''} ${viewMode === 'compact' ? 'compact' : 'expanded'}`}>
            <div className="agent-card-header">
              <div className="agent-icon">{agent.icon}</div>
              <div className="agent-header-content">
                <h3>{agent.name}</h3>
                <span className="agent-category">{agent.category}</span>
              </div>
              <div className="agent-status">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={agent.enabled}
                    onChange={() => handleToggleAgent(agent.id)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="agent-card-body">
              <p className="agent-description">{agent.description}</p>

              {/* Triggers Section */}
              <div className="agent-triggers-section">
                <label className="agent-section-label">🔔 Triggers:</label>
                <div className="agent-triggers">
                  {agent.triggers && agent.triggers.map(trigger => (
                    <span key={trigger} className="trigger-badge">
                      {getTriggerIcon(trigger)} {trigger}
                    </span>
                  ))}
                </div>
              </div>

              {viewMode === 'expanded' && (
                <>
                  <div className="agent-prompt-section">
                    <label className="agent-prompt-label">🎯 Agent Prompt:</label>
                    <div className="agent-prompt">
                      {agent.prompt}
                    </div>
                  </div>

                  {/* Execution Logs */}
                  {agent.executionLogs && agent.executionLogs.length > 0 && (
                    <div className="agent-logs-section">
                      <div className="logs-header">
                        <label className="agent-section-label">📜 Recent Executions ({agent.executionLogs.length})</label>
                        <button
                          className="btn-expand-logs"
                          onClick={() => toggleLogExpansion(agent.id)}
                        >
                          {expandedLogs[agent.id] ? '▼ Collapse' : '▶ Expand'}
                        </button>
                      </div>

                      {expandedLogs[agent.id] && (
                        <div className="execution-logs">
                          {agent.executionLogs.map(log => (
                            <div key={log.id} className={`log-entry ${log.success ? 'success' : 'failure'}`}>
                              <div className="log-header">
                                <span className="log-timestamp">
                                  {new Date(log.timestamp).toLocaleString()}
                                </span>
                                <span className={`log-trigger ${log.trigger.toLowerCase().replace(' ', '-')}`}>
                                  {getTriggerIcon(log.trigger)} {log.trigger}
                                </span>
                                <span className={`log-status ${log.success ? 'success' : 'failure'}`}>
                                  {log.success ? '✓ Success' : '✗ Failed'}
                                </span>
                              </div>
                              <div className="log-result">{log.result}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="agent-stats-row">
                <div className="agent-stat">
                  <span className="stat-icon">📊</span>
                  <span className="stat-value">{agent.usageCount}</span>
                  <span className="stat-label">times used</span>
                </div>
                {agent.executionLogs && agent.executionLogs.length > 0 && viewMode === 'compact' && (
                  <div className="agent-stat">
                    <span className="stat-icon">📜</span>
                    <span className="stat-value">{agent.executionLogs.length}</span>
                    <span className="stat-label">executions</span>
                  </div>
                )}
              </div>
            </div>

            <div className={`agent-card-footer ${viewMode === 'compact' ? 'compact' : 'expanded'}`}>
              <button
                className="btn-agent-action"
                onClick={() => {
                  setSelectedAgent(agent);
                  setActiveDetailTab('details');
                }}
              >
                👁️ {viewMode === 'compact' ? '' : 'Details'}
              </button>
              {viewMode === 'expanded' && (
                <>
                  <button
                    className="btn-agent-action"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setActiveDetailTab('orchestration');
                    }}
                  >
                    🔄 Flow
                  </button>
                  <button
                    className="btn-agent-action"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setActiveDetailTab('visual');
                    }}
                  >
                    🎨 Network
                  </button>
                </>
              )}
              <button
                className="btn-agent-action"
                onClick={() => handleEditAgent(agent)}
              >
                ✏️ {viewMode === 'compact' ? '' : 'Edit'}
              </button>
              <button
                className="btn-agent-action btn-danger"
                onClick={() => handleDeleteAgent(agent.id)}
              >
                🗑️ {viewMode === 'compact' ? '' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {showModal && editingAgent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{agents.find(a => a.id === editingAgent.id) ? 'Edit Agent' : 'Add New Agent'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Agent Name <span className="required">*</span></label>
                  <input
                    type="text"
                    value={editingAgent.name}
                    onChange={(e) => setEditingAgent({...editingAgent, name: e.target.value})}
                    placeholder="e.g., Document Request Agent"
                  />
                </div>

                <div className="form-group">
                  <label>Icon</label>
                  <input
                    type="text"
                    value={editingAgent.icon}
                    onChange={(e) => setEditingAgent({...editingAgent, icon: e.target.value})}
                    placeholder="🤖"
                    maxLength="2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={editingAgent.category}
                  onChange={(e) => setEditingAgent({...editingAgent, category: e.target.value})}
                >
                  <option value="Analysis">Analysis</option>
                  <option value="Verification">Verification</option>
                  <option value="Communication">Communication</option>
                  <option value="Workflow">Workflow</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Risk">Risk</option>
                </select>
              </div>

              <div className="form-group">
                <label>Triggers <span className="required">*</span></label>
                <div className="trigger-selection">
                  {['Manual', 'Document Upload', 'Validation Error', 'Condition Created', 'Loan Status Change', 'Scheduled Daily'].map(trigger => (
                    <label key={trigger} className="trigger-checkbox">
                      <input
                        type="checkbox"
                        checked={editingAgent.triggers && editingAgent.triggers.includes(trigger)}
                        onChange={() => handleToggleTrigger(trigger)}
                      />
                      <span>{getTriggerIcon(trigger)} {trigger}</span>
                    </label>
                  ))}
                </div>
                <span className="field-hint">Select at least one trigger type</span>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editingAgent.description}
                  onChange={(e) => setEditingAgent({...editingAgent, description: e.target.value})}
                  placeholder="Brief description of what this agent does..."
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Agent Prompt <span className="required">*</span></label>
                <textarea
                  value={editingAgent.prompt}
                  onChange={(e) => setEditingAgent({...editingAgent, prompt: e.target.value})}
                  placeholder="Detailed instructions for what the agent should do. Use {variable} for dynamic values..."
                  rows="8"
                />
                <span className="field-hint">
                  Use {`{curly_braces}`} for variables like {`{document_type}`}, {`{deadline}`}, {`{loan_amount}`}, etc.
                </span>
              </div>

              <div className="checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editingAgent.enabled}
                    onChange={(e) => setEditingAgent({...editingAgent, enabled: e.target.checked})}
                  />
                  <span>Enable agent</span>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveAgent}>
                Save Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Modal */}
      {selectedAgent && (
        <div className="modal-overlay" onClick={() => setSelectedAgent(null)}>
          <div className={`modal-content agent-detail-modal ${activeDetailTab === 'visual' ? 'fullscreen-modal' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAgent.icon} {selectedAgent.name}</h2>
              <button className="modal-close" onClick={() => setSelectedAgent(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Tabs for different sections */}
              <div className="agent-detail-tabs">
                <button
                  className={`agent-detail-tab ${activeDetailTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('details')}
                >
                  📋 Details & History
                </button>
                <button
                  className={`agent-detail-tab ${activeDetailTab === 'orchestration' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('orchestration')}
                >
                  🔄 Orchestration Flow
                </button>
                <button
                  className={`agent-detail-tab ${activeDetailTab === 'visual' ? 'active' : ''}`}
                  onClick={() => setActiveDetailTab('visual')}
                >
                  🎨 Visual Network
                </button>
              </div>

              {activeDetailTab === 'details' ? (
                <>
                  <div className="agent-detail-section">
                    <label>Category</label>
                    <div className="agent-detail-value">{selectedAgent.category}</div>
                  </div>

                  <div className="agent-detail-section">
                    <label>Description</label>
                    <div className="agent-detail-value">{selectedAgent.description}</div>
                  </div>

                  <div className="agent-detail-section">
                    <label>Triggers</label>
                    <div className="agent-triggers">
                      {selectedAgent.triggers && selectedAgent.triggers.map(trigger => (
                        <span key={trigger} className="trigger-badge">
                          {getTriggerIcon(trigger)} {trigger}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="agent-detail-section">
                    <label>Agent Prompt</label>
                    <div className="agent-detail-prompt">{selectedAgent.prompt}</div>
                  </div>

                  <div className="agent-detail-section">
                    <label>Statistics</label>
                    <div className="agent-detail-stats">
                      <div className="stat-item">
                        <span className="stat-label">Usage Count:</span>
                        <span className="stat-value">{selectedAgent.usageCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Status:</span>
                        <span className={`stat-value ${selectedAgent.enabled ? 'enabled' : 'disabled'}`}>
                          {selectedAgent.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Execution History */}
                  {selectedAgent.executionLogs && selectedAgent.executionLogs.length > 0 && (
                    <div className="agent-detail-section">
                      <label>Execution History ({selectedAgent.executionLogs.length} runs)</label>
                      <div className="execution-logs">
                        {selectedAgent.executionLogs.map(log => (
                          <div key={log.id} className={`log-entry ${log.success ? 'success' : 'failure'}`}>
                            <div className="log-header">
                              <span className="log-timestamp">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                              <span className={`log-trigger ${log.trigger.toLowerCase().replace(' ', '-')}`}>
                                {getTriggerIcon(log.trigger)} {log.trigger}
                              </span>
                              <span className={`log-status ${log.success ? 'success' : 'failure'}`}>
                                {log.success ? '✓ Success' : '✗ Failed'}
                              </span>
                            </div>
                            <div className="log-result">{log.result}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : activeDetailTab === 'orchestration' ? (
                <AgentOrchestration agentId={selectedAgent.id} />
              ) : (
                <AgentFlowDiagram agentId={selectedAgent.id} />
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedAgent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agents;
