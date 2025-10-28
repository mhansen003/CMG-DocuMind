import { useState } from 'react';
import '../styles/AgentOrchestration.css';

// Define orchestration workflows for each agent
const agentOrchestrations = {
  'agent-001': {
    name: 'Document Request Agent',
    icon: '📄',
    description: 'Drafts and sends document requests with automated follow-up',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Analyze Missing Documents',
        description: 'Reviews validation results to identify which documents are missing or need updates',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'decision',
        title: 'Check Document Priority',
        description: 'Determines urgency based on loan closing date and document type',
        duration: '1s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'action',
        title: 'Draft Email Content',
        description: 'Generates personalized email with specific requirements and deadline',
        duration: '3s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'agent-call',
        title: 'Call: Missing Document Predictor',
        description: 'Triggers Agent-010 to predict what other documents might be needed',
        targetAgent: 'agent-010',
        duration: '5s',
        status: 'in-progress'
      },
      {
        id: 'step-5',
        type: 'action',
        title: 'Send Email & Create Tracking',
        description: 'Sends email to borrower and creates follow-up task in system',
        duration: '2s',
        status: 'pending'
      },
      {
        id: 'step-6',
        type: 'agent-call',
        title: 'Call: Condition Generator Agent',
        description: 'Triggers Agent-005 to create formal condition if critical document',
        targetAgent: 'agent-005',
        duration: '4s',
        status: 'pending'
      }
    ]
  },
  'agent-002': {
    name: 'Income Verification Agent',
    icon: '💰',
    description: 'Cross-references income across multiple documents',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Extract Income Data',
        description: 'Pulls income figures from paystubs, W2s, tax returns, and application',
        duration: '3s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'agent-call',
        title: 'Call: Calculation Verifier Agent',
        description: 'Triggers Agent-011 to verify YTD income calculations are accurate',
        targetAgent: 'agent-011',
        duration: '4s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'action',
        title: 'Calculate Income Projections',
        description: 'Projects annual income based on current paystub YTD and pay frequency',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'decision',
        title: 'Check for Discrepancies',
        description: 'Compares all income sources and flags differences >5%',
        duration: '2s',
        status: 'in-progress'
      },
      {
        id: 'step-5',
        type: 'agent-call',
        title: 'Call: Cross-Document Consistency Checker',
        description: 'Triggers Agent-015 to verify employer information matches across documents',
        targetAgent: 'agent-015',
        duration: '5s',
        status: 'pending'
      },
      {
        id: 'step-6',
        type: 'action',
        title: 'Generate Verification Report',
        description: 'Creates summary of all income sources with discrepancy analysis',
        duration: '3s',
        status: 'pending'
      },
      {
        id: 'step-7',
        type: 'decision',
        title: 'Critical Issue?',
        description: 'Determines if discrepancies warrant condition or just warning',
        duration: '1s',
        status: 'pending'
      },
      {
        id: 'step-8',
        type: 'agent-call',
        title: 'Call: Condition Generator (if critical)',
        description: 'Triggers Agent-005 to create underwriting condition for income discrepancy',
        targetAgent: 'agent-005',
        duration: '4s',
        status: 'pending',
        conditional: true
      }
    ]
  },
  'agent-004': {
    name: 'Date Validation Agent',
    icon: '📅',
    description: 'Ensures document dates meet recency and logic requirements',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Extract All Dates',
        description: 'Identifies all date fields: pay period start/end, pay date, issue date',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'decision',
        title: 'Check Recency (60-day window)',
        description: 'Validates document is not older than 60 days from current date',
        duration: '1s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'decision',
        title: 'Validate Date Logic',
        description: 'Ensures pay period end > start, pay date >= period end, no future dates',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'agent-call',
        title: 'Call: Document Expiration Tracker',
        description: 'Triggers Agent-012 to monitor when document will need replacement',
        targetAgent: 'agent-012',
        duration: '3s',
        status: 'in-progress'
      },
      {
        id: 'step-5',
        type: 'action',
        title: 'Generate Date Validation Report',
        description: 'Creates report of all date checks with pass/fail/warning status',
        duration: '2s',
        status: 'pending'
      },
      {
        id: 'step-6',
        type: 'agent-call',
        title: 'Call: Document Request Agent (if expired)',
        description: 'Triggers Agent-001 to request updated document if dates are stale',
        targetAgent: 'agent-001',
        duration: '4s',
        status: 'pending',
        conditional: true
      }
    ]
  },
  'agent-005': {
    name: 'Condition Generator Agent',
    icon: '📋',
    description: 'Creates formal underwriting conditions from validation failures',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Analyze Validation Error',
        description: 'Reviews the triggering validation failure for context and severity',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'action',
        title: 'Determine Condition Type',
        description: 'Classifies as PTD (Prior to Docs), PTF (Prior to Funding), or Follow-Up',
        duration: '1s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'action',
        title: 'Draft Condition Language',
        description: 'Generates clear condition title and detailed explanation',
        duration: '4s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'action',
        title: 'Define Resolution Steps',
        description: 'Creates specific action items required to clear the condition',
        duration: '3s',
        status: 'in-progress'
      },
      {
        id: 'step-5',
        type: 'decision',
        title: 'Requires New Document?',
        description: 'Determines if condition needs borrower to provide new documentation',
        duration: '1s',
        status: 'pending'
      },
      {
        id: 'step-6',
        type: 'agent-call',
        title: 'Call: Document Request Agent',
        description: 'Triggers Agent-001 to send document request email if needed',
        targetAgent: 'agent-001',
        duration: '5s',
        status: 'pending',
        conditional: true
      },
      {
        id: 'step-7',
        type: 'action',
        title: 'Create Condition in LOS',
        description: 'Adds formal condition to loan file with all details',
        duration: '2s',
        status: 'pending'
      },
      {
        id: 'step-8',
        type: 'action',
        title: 'Notify Stakeholders',
        description: 'Sends notifications to loan officer and processor about new condition',
        duration: '2s',
        status: 'pending'
      }
    ]
  },
  'agent-009': {
    name: 'Fraud Detection Agent',
    icon: '🔍',
    description: 'Analyzes documents for signs of tampering or fraud',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Scan Document Metadata',
        description: 'Analyzes PDF metadata, creation date, software used, modification history',
        duration: '3s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'agent-call',
        title: 'Call: Format Inconsistency Detector',
        description: 'Triggers Agent-013 to check for font/formatting anomalies',
        targetAgent: 'agent-013',
        duration: '5s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'agent-call',
        title: 'Call: Calculation Verifier Agent',
        description: 'Triggers Agent-011 to verify all mathematical calculations are correct',
        targetAgent: 'agent-011',
        duration: '4s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'action',
        title: 'Pattern Analysis',
        description: 'Checks for suspicious patterns: rounded numbers, unusual employer names',
        duration: '4s',
        status: 'in-progress'
      },
      {
        id: 'step-5',
        type: 'action',
        title: 'Risk Scoring',
        description: 'Calculates fraud risk score (1-10) based on all indicators',
        duration: '2s',
        status: 'pending'
      },
      {
        id: 'step-6',
        type: 'decision',
        title: 'High Risk Score? (>7)',
        description: 'Determines if fraud indicators warrant escalation',
        duration: '1s',
        status: 'pending'
      },
      {
        id: 'step-7',
        type: 'agent-call',
        title: 'Call: Condition Generator (if high risk)',
        description: 'Triggers Agent-005 to create condition requiring manual review',
        targetAgent: 'agent-005',
        duration: '4s',
        status: 'pending',
        conditional: true
      },
      {
        id: 'step-8',
        type: 'action',
        title: 'Generate Fraud Report',
        description: 'Creates detailed report of all fraud indicators found',
        duration: '3s',
        status: 'pending'
      }
    ]
  },
  'agent-011': {
    name: 'Calculation Verifier Agent',
    icon: '🧮',
    description: 'Verifies mathematical accuracy in documents',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Extract Numeric Fields',
        description: 'Identifies all calculations: gross pay, deductions, net pay, YTD totals',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'action',
        title: 'Verify Pay Calculations',
        description: 'Checks: hours × rate, overtime calculations, bonus additions',
        duration: '3s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'action',
        title: 'Verify Deductions',
        description: 'Confirms: gross - deductions = net pay, tax percentages are reasonable',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'action',
        title: 'Verify YTD Totals',
        description: 'Validates year-to-date calculations add up correctly',
        duration: '3s',
        status: 'in-progress'
      },
      {
        id: 'step-5',
        type: 'decision',
        title: 'Calculation Errors Found?',
        description: 'Determines if any mathematical discrepancies were detected',
        duration: '1s',
        status: 'pending'
      },
      {
        id: 'step-6',
        type: 'agent-call',
        title: 'Call: Fraud Detection Agent (if errors)',
        description: 'Triggers Agent-009 to investigate if calculation errors indicate tampering',
        targetAgent: 'agent-009',
        duration: '6s',
        status: 'pending',
        conditional: true
      },
      {
        id: 'step-7',
        type: 'action',
        title: 'Generate Calculation Report',
        description: 'Creates report showing all calculations with expected vs actual values',
        duration: '2s',
        status: 'pending'
      }
    ]
  },
  'agent-015': {
    name: 'Cross-Document Consistency Checker',
    icon: '🔗',
    description: 'Validates data consistency across multiple documents',
    steps: [
      {
        id: 'step-1',
        type: 'action',
        title: 'Build Data Matrix',
        description: 'Creates matrix of key fields (SSN, DOB, addresses) across all documents',
        duration: '3s',
        status: 'completed'
      },
      {
        id: 'step-2',
        type: 'action',
        title: 'Normalize Values',
        description: 'Standardizes formats: addresses, phone numbers, names for comparison',
        duration: '2s',
        status: 'completed'
      },
      {
        id: 'step-3',
        type: 'action',
        title: 'Cross-Reference All Fields',
        description: 'Compares each field value across all document types',
        duration: '4s',
        status: 'completed'
      },
      {
        id: 'step-4',
        type: 'decision',
        title: 'Identify Mismatches',
        description: 'Flags any fields where values don\'t match across documents',
        duration: '2s',
        status: 'in_progress'
      },
      {
        id: 'step-5',
        type: 'agent-call',
        title: 'Call: Borrower Name Reconciliation',
        description: 'Triggers Agent-007 for advanced name matching (nicknames, maiden names)',
        targetAgent: 'agent-007',
        duration: '4s',
        status: 'pending',
        conditional: true
      },
      {
        id: 'step-6',
        type: 'agent-call',
        title: 'Call: Property Address Matcher',
        description: 'Triggers Agent-006 for property address normalization and matching',
        targetAgent: 'agent-006',
        duration: '4s',
        status: 'pending',
        conditional: true
      },
      {
        id: 'step-7',
        type: 'action',
        title: 'Generate Consistency Matrix',
        description: 'Creates visual matrix showing which fields match/mismatch across docs',
        duration: '3s',
        status: 'pending'
      },
      {
        id: 'step-8',
        type: 'agent-call',
        title: 'Call: Condition Generator (if critical mismatches)',
        description: 'Triggers Agent-005 to create conditions for critical inconsistencies',
        targetAgent: 'agent-005',
        duration: '4s',
        status: 'pending',
        conditional: true
      }
    ]
  }
};

function AgentOrchestration({ agentId }) {
  const [expandedSteps, setExpandedSteps] = useState({});

  const orchestration = agentOrchestrations[agentId];

  if (!orchestration) {
    return (
      <div className="orchestration-empty">
        <div className="empty-icon">📋</div>
        <p>No orchestration workflow defined for this agent yet.</p>
        <p className="empty-hint">Orchestration workflows show the step-by-step process and agent daisy chains.</p>
      </div>
    );
  }

  const toggleStepExpansion = (stepId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const getStepIcon = (type) => {
    const icons = {
      'action': '⚙️',
      'decision': '🔀',
      'agent-call': '🤖',
      'api-call': '🌐'
    };
    return icons[type] || '•';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': { icon: '✓', label: 'Completed', class: 'completed' },
      'in-progress': { icon: '⟳', label: 'In Progress', class: 'in-progress' },
      'pending': { icon: '○', label: 'Pending', class: 'pending' },
      'failed': { icon: '✗', label: 'Failed', class: 'failed' }
    };
    return badges[status] || badges['pending'];
  };

  return (
    <div className="agent-orchestration">
      <div className="orchestration-header">
        <div className="orchestration-title">
          <span className="orchestration-icon">{orchestration.icon}</span>
          <div>
            <h3>{orchestration.name}</h3>
            <p className="orchestration-description">{orchestration.description}</p>
          </div>
        </div>
        <div className="orchestration-summary">
          <div className="summary-stat">
            <span className="stat-value">{orchestration.steps.length}</span>
            <span className="stat-label">Total Steps</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {orchestration.steps.filter(s => s.type === 'agent-call').length}
            </span>
            <span className="stat-label">Agent Calls</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">
              {orchestration.steps.reduce((total, step) => {
                const seconds = parseInt(step.duration);
                return total + seconds;
              }, 0)}s
            </span>
            <span className="stat-label">Est. Duration</span>
          </div>
        </div>
      </div>

      <div className="orchestration-flow">
        <div className="flow-timeline">
          {orchestration.steps.map((step, index) => {
            const statusBadge = getStatusBadge(step.status);
            const isExpanded = expandedSteps[step.id];
            const isAgentCall = step.type === 'agent-call';

            return (
              <div key={step.id} className={`flow-step ${step.type} ${step.status} ${step.conditional ? 'conditional' : ''}`}>
                {/* Connection Line */}
                {index > 0 && (
                  <div className="step-connector">
                    {step.conditional && <span className="conditional-label">if condition met</span>}
                  </div>
                )}

                {/* Step Card */}
                <div className="step-card" onClick={() => toggleStepExpansion(step.id)}>
                  <div className="step-header">
                    <div className="step-title-row">
                      <span className="step-icon">{getStepIcon(step.type)}</span>
                      <span className="step-number">Step {index + 1}</span>
                      <span className={`step-status-badge ${statusBadge.class}`}>
                        {statusBadge.icon} {statusBadge.label}
                      </span>
                      {step.conditional && (
                        <span className="conditional-badge">Conditional</span>
                      )}
                    </div>
                    <h4 className="step-title">{step.title}</h4>
                  </div>

                  <div className="step-body">
                    <p className="step-description">{step.description}</p>

                    {isAgentCall && step.targetAgent && (
                      <div className="agent-call-info">
                        <span className="agent-call-icon">🔗</span>
                        <span className="agent-call-text">
                          Daisy chains to: <strong>{agentOrchestrations[step.targetAgent]?.name || step.targetAgent}</strong>
                        </span>
                      </div>
                    )}

                    <div className="step-meta">
                      <span className="step-duration">⏱️ {step.duration}</span>
                      <span className="step-type-label">{step.type.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {isAgentCall && isExpanded && step.targetAgent && agentOrchestrations[step.targetAgent] && (
                    <div className="nested-agent-flow">
                      <div className="nested-agent-header">
                        <span className="nested-agent-label">↳ Nested Agent Workflow:</span>
                        <span className="nested-agent-name">
                          {agentOrchestrations[step.targetAgent].icon} {agentOrchestrations[step.targetAgent].name}
                        </span>
                      </div>
                      <div className="nested-steps">
                        {agentOrchestrations[step.targetAgent].steps.slice(0, 3).map((nestedStep, nestedIndex) => (
                          <div key={nestedStep.id} className="nested-step">
                            <span className="nested-step-icon">{getStepIcon(nestedStep.type)}</span>
                            <span className="nested-step-title">{nestedStep.title}</span>
                          </div>
                        ))}
                        {agentOrchestrations[step.targetAgent].steps.length > 3 && (
                          <div className="nested-step-more">
                            + {agentOrchestrations[step.targetAgent].steps.length - 3} more steps...
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button className="step-expand-btn">
                    {isExpanded ? '▼ Collapse' : '▶ Expand'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* End of Flow */}
        <div className="flow-end">
          <div className="flow-end-icon">✓</div>
          <div className="flow-end-text">Orchestration Complete</div>
        </div>
      </div>

      {/* Agent Daisy Chain Summary */}
      {orchestration.steps.some(s => s.type === 'agent-call') && (
        <div className="daisy-chain-summary">
          <h4>🔗 Agent Daisy Chain Network</h4>
          <p className="daisy-chain-description">
            This agent calls other agents during its workflow. Here's the complete network:
          </p>
          <div className="daisy-chain-list">
            {orchestration.steps
              .filter(s => s.type === 'agent-call' && s.targetAgent)
              .map((step, index) => {
                const targetOrch = agentOrchestrations[step.targetAgent];
                return (
                  <div key={index} className="daisy-chain-item">
                    <div className="daisy-chain-arrow">→</div>
                    <div className="daisy-chain-agent">
                      <span className="daisy-chain-agent-icon">{targetOrch?.icon || '🤖'}</span>
                      <div className="daisy-chain-agent-info">
                        <span className="daisy-chain-agent-name">{targetOrch?.name || step.targetAgent}</span>
                        <span className="daisy-chain-agent-desc">{targetOrch?.description}</span>
                      </div>
                      {step.conditional && (
                        <span className="daisy-chain-conditional">Conditional</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentOrchestration;
