import { useState } from 'react';
import '../styles/AgentRelationshipMap.css';

function AgentRelationshipMap({ onClose }) {
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Define all agents with their relationships
  const agents = [
    {
      id: 'agent-001',
      name: 'Document Request Agent',
      icon: '📄',
      category: 'intake',
      description: 'Generates document requests and stipulation letters',
      triggers: ['missing-document', 'incomplete-data'],
      handoffs: ['agent-005', 'agent-006'],
      color: '#3b82f6'
    },
    {
      id: 'agent-002',
      name: 'Income Verification Agent',
      icon: '💰',
      category: 'verification',
      description: 'Verifies income from paystubs, W-2s, and tax returns',
      triggers: ['income-mismatch', 'income-verification'],
      handoffs: ['agent-003', 'agent-007'],
      color: '#10b981'
    },
    {
      id: 'agent-003',
      name: 'Employment Verification Agent',
      icon: '💼',
      category: 'verification',
      description: 'Validates employment history and current employment status',
      triggers: ['employment-gap', 'employment-verification'],
      handoffs: ['agent-002', 'agent-007'],
      color: '#8b5cf6'
    },
    {
      id: 'agent-004',
      name: 'Fraud Detection Agent',
      icon: '🔍',
      category: 'compliance',
      description: 'Analyzes documents for signs of tampering or fraud',
      triggers: ['inconsistent-data', 'suspicious-pattern'],
      handoffs: ['agent-006', 'agent-001'],
      color: '#ef4444'
    },
    {
      id: 'agent-005',
      name: 'Condition Generator Agent',
      icon: '📋',
      category: 'processing',
      description: 'Creates loan conditions based on findings',
      triggers: ['validation-failure', 'missing-data'],
      handoffs: ['agent-001', 'agent-006'],
      color: '#f59e0b'
    },
    {
      id: 'agent-006',
      name: 'LOS Sync Agent',
      icon: '🔄',
      category: 'processing',
      description: 'Synchronizes data with ByteLOS system',
      triggers: ['data-ready', 'sync-required'],
      handoffs: ['agent-005'],
      color: '#06b6d4'
    },
    {
      id: 'agent-007',
      name: 'Name Reconciliation Agent',
      icon: '👤',
      category: 'verification',
      description: 'Resolves name variations across documents',
      triggers: ['name-mismatch', 'name-variation'],
      handoffs: ['agent-002', 'agent-003'],
      color: '#ec4899'
    },
    {
      id: 'agent-008',
      name: 'Data Consistency Agent',
      icon: '📊',
      category: 'verification',
      description: 'Validates data consistency across multiple documents',
      triggers: ['data-conflict', 'cross-document-mismatch'],
      handoffs: ['agent-007', 'agent-005'],
      color: '#14b8a6'
    }
  ];

  // Define workflow stages
  const stages = [
    { id: 'intake', name: 'Document Intake', color: '#3b82f6' },
    { id: 'verification', name: 'Verification', color: '#10b981' },
    { id: 'compliance', name: 'Compliance', color: '#ef4444' },
    { id: 'processing', name: 'Processing', color: '#f59e0b' }
  ];

  // Group agents by category
  const agentsByCategory = stages.map(stage => ({
    ...stage,
    agents: agents.filter(a => a.category === stage.id)
  }));

  return (
    <div className="agent-map-overlay">
      <div className="agent-map-container">
        {/* Header */}
        <div className="agent-map-header">
          <div className="agent-map-title">
            <span className="map-icon">🗺️</span>
            <h2>Agent Relationship Map</h2>
            <span className="map-subtitle">Complete Agent Ecosystem & Workflow</span>
          </div>
          <button className="close-map-btn" onClick={onClose} title="Close map">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Map Content */}
        <div className="agent-map-content">
          {/* Legend */}
          <div className="map-legend">
            <h3>Workflow Stages</h3>
            <div className="legend-items">
              {stages.map(stage => (
                <div key={stage.id} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: stage.color }}></div>
                  <span>{stage.name}</span>
                </div>
              ))}
            </div>
            <div className="legend-note">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span>Click an agent to see details and connections</span>
            </div>
          </div>

          {/* Visual Map */}
          <div className="agent-workflow-map">
            {agentsByCategory.map((stage, stageIndex) => (
              <div key={stage.id} className="workflow-stage">
                <div className="stage-header" style={{ borderColor: stage.color }}>
                  <span className="stage-number">{stageIndex + 1}</span>
                  <span className="stage-name">{stage.name}</span>
                  <span className="stage-count">{stage.agents.length} agents</span>
                </div>

                <div className="stage-agents">
                  {stage.agents.map(agent => (
                    <div
                      key={agent.id}
                      className={`map-agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                      style={{
                        borderColor: agent.color,
                        backgroundColor: selectedAgent?.id === agent.id ? `${agent.color}15` : 'white'
                      }}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <div className="agent-card-icon" style={{ backgroundColor: agent.color }}>
                        {agent.icon}
                      </div>
                      <div className="agent-card-info">
                        <h4>{agent.name}</h4>
                        <p>{agent.description}</p>
                      </div>
                      {selectedAgent?.id === agent.id && (
                        <div className="agent-selected-indicator">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Stage connector arrow */}
                {stageIndex < agentsByCategory.length - 1 && (
                  <div className="stage-connector">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Agent Details Panel */}
          {selectedAgent && (
            <div className="agent-details-panel" style={{ borderTopColor: selectedAgent.color }}>
              <div className="panel-header">
                <div className="panel-icon" style={{ backgroundColor: selectedAgent.color }}>
                  {selectedAgent.icon}
                </div>
                <div className="panel-title">
                  <h3>{selectedAgent.name}</h3>
                  <p>{selectedAgent.description}</p>
                </div>
              </div>

              <div className="panel-body">
                <div className="detail-section">
                  <h4>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                    Triggers
                  </h4>
                  <div className="detail-tags">
                    {selectedAgent.triggers.map((trigger, idx) => (
                      <span key={idx} className="detail-tag trigger">{trigger}</span>
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Hands Off To
                  </h4>
                  <div className="detail-tags">
                    {selectedAgent.handoffs.map((handoffId, idx) => {
                      const handoffAgent = agents.find(a => a.id === handoffId);
                      return (
                        <span
                          key={idx}
                          className="detail-tag handoff"
                          style={{ borderColor: handoffAgent?.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(handoffAgent);
                          }}
                        >
                          {handoffAgent?.icon} {handoffAgent?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"/>
                    </svg>
                    Workflow Stage
                  </h4>
                  <div className="detail-stage" style={{ borderColor: selectedAgent.color }}>
                    <span className="stage-dot" style={{ backgroundColor: selectedAgent.color }}></span>
                    {stages.find(s => s.id === selectedAgent.category)?.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AgentRelationshipMap;
