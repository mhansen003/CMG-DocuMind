import { useState } from 'react';
import '../styles/AgentDispositionQueue.css';

function AgentDispositionQueue({ loanId, dispositions = [], onDisposition, documents = [] }) {
  const [filter, setFilter] = useState('all'); // all, open, resolved
  const [expandedItem, setExpandedItem] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [expandedAgentSections, setExpandedAgentSections] = useState({}); // Track which agent sections are expanded

  const toggleAgentSection = (dispId, section) => {
    setExpandedAgentSections(prev => ({
      ...prev,
      [dispId]: {
        ...(prev[dispId] || {}),
        [section]: !(prev[dispId]?.[section])
      }
    }));
  };

  const filteredDispositions = dispositions.filter(disp => {
    if (filter === 'all') return true;
    if (filter === 'open') return disp.status === 'open' || disp.status === 'in_progress';
    if (filter === 'resolved') return disp.status === 'resolved' || disp.status === 'dismissed';
    return true;
  });

  const getPriorityClass = (priority) => {
    const map = {
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low'
    };
    return map[priority] || 'priority-medium';
  };

  const getStatusClass = (status) => {
    const map = {
      'open': 'status-open',
      'in_progress': 'status-in-progress',
      'resolved': 'status-resolved',
      'dismissed': 'status-dismissed'
    };
    return map[status] || 'status-open';
  };

  const getStatusLabel = (status) => {
    const map = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'dismissed': 'Dismissed'
    };
    return map[status] || status;
  };

  const getPriorityIcon = (priority) => {
    if (priority === 'high') return '🔴';
    if (priority === 'medium') return '🟡';
    return '🟢';
  };

  const handleAction = (dispositionId, actionId, actionLabel) => {
    if (onDisposition) {
      onDisposition(dispositionId, actionId, actionLabel);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const stats = {
    total: dispositions.length,
    open: dispositions.filter(d => d.status === 'open' || d.status === 'in_progress').length,
    resolved: dispositions.filter(d => d.status === 'resolved' || d.status === 'dismissed').length,
    high: dispositions.filter(d => d.priority === 'high' && (d.status === 'open' || d.status === 'in_progress')).length
  };

  return (
    <div className="agent-disposition-queue">
      {/* Header with Stats */}
      <div className="queue-header">
        <div className="queue-title">
          <h3>Agent Disposition Queue</h3>
          <p className="queue-subtitle">Review and action items requiring your attention</p>
        </div>

        <div className="queue-stats">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-item stat-open">
            <div className="stat-value">{stats.open}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-item stat-high">
            <div className="stat-value">{stats.high}</div>
            <div className="stat-label">High Priority</div>
          </div>
          <div className="stat-item stat-resolved">
            <div className="stat-value">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="queue-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({dispositions.length})
        </button>
        <button
          className={`filter-btn ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Open ({stats.open})
        </button>
        <button
          className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
          onClick={() => setFilter('resolved')}
        >
          Resolved ({stats.resolved})
        </button>
      </div>

      {/* Disposition List */}
      <div className="disposition-list">
        {filteredDispositions.length === 0 ? (
          <div className="empty-queue">
            <div className="empty-icon">✓</div>
            <h3>No Items to Review</h3>
            <p>
              {filter === 'open'
                ? 'All disposition items have been addressed'
                : filter === 'resolved'
                ? 'No resolved items yet'
                : 'No agent dispositions for this loan'}
            </p>
          </div>
        ) : (
          filteredDispositions.map((disp) => (
            <div
              key={disp.id}
              className={`disposition-item ${expandedItem === disp.id ? 'expanded' : ''} ${getStatusClass(disp.status)}`}
            >
              {/* Item Header */}
              <div
                className="disposition-header"
                onClick={() => setExpandedItem(expandedItem === disp.id ? null : disp.id)}
              >
                <div className="disposition-priority">
                  <span className={`priority-badge ${getPriorityClass(disp.priority)}`}>
                    {getPriorityIcon(disp.priority)}
                  </span>
                </div>

                <div className="disposition-main">
                  <div className="disposition-title-row">
                    <h4>{disp.title}</h4>
                    <span className={`status-badge ${getStatusClass(disp.status)}`}>
                      {getStatusLabel(disp.status)}
                    </span>
                  </div>
                  <div className="disposition-meta">
                    <span className="agent-name">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                      {disp.agentName}
                    </span>
                    <span className="separator">•</span>
                    <span className="created-time">{formatDate(disp.createdAt)}</span>
                    {disp.documentIds && disp.documentIds.length > 0 && (
                      <>
                        <span className="separator">•</span>
                        <span className="doc-count">
                          📄 {disp.documentIds.length} doc{disp.documentIds.length !== 1 ? 's' : ''}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="expand-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M7 10l5 5 5-5z"/>
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedItem === disp.id && (
                <div className="disposition-content">
                  <div className="disposition-layout">
                    {/* Left Column - Actions */}
                    <div className="disposition-actions-column">
                      {(disp.status === 'open' || disp.status === 'in_progress') && disp.possibleActions && (
                        <>
                          <h5>Available Actions</h5>
                          <div className="action-buttons-vertical">
                            {disp.possibleActions.map((action) => (
                              <button
                                key={action.id}
                                className={`action-btn action-${action.type}`}
                                onClick={() => handleAction(disp.id, action.id, action.label)}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Column - Information */}
                    <div className="disposition-info-column">
                      <div className="disposition-description-compact">
                        <p>{disp.description}</p>
                      </div>

                      {/* Related Documents */}
                  {disp.documentIds && disp.documentIds.length > 0 && (
                    <div className="related-documents-section">
                      <h5>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        Related Documents
                      </h5>
                      <div className="document-links">
                        {disp.documentIds.map((docId, index) => {
                          const doc = documents.find(d => d.id === docId) || { fileName: `Document ${index + 1}`, documentType: 'Unknown' };
                          return (
                            <button
                              key={docId}
                              className="document-link-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewDocument(doc);
                              }}
                            >
                              <span className="doc-link-icon">📄</span>
                              <div className="doc-link-info">
                                <span className="doc-link-name">{doc.fileName}</span>
                                <span className="doc-link-type">{doc.documentType}</span>
                              </div>
                              <svg className="preview-icon" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Agent Configuration - Collapsible Boxes */}
                  <div className="agent-config-boxes">
                    {/* Agent Prompt Box */}
                    {disp.agentPrompt && (
                      <div className="agent-config-box">
                        <button
                          className="agent-config-header"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAgentSection(disp.id, 'prompt');
                          }}
                        >
                          <span className="config-icon">🤖</span>
                          <span className="config-label">Agent Instructions</span>
                          <svg className={`config-expand-icon ${expandedAgentSections[disp.id]?.prompt ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M7 10l5 5 5-5z"/>
                          </svg>
                        </button>
                        {expandedAgentSections[disp.id]?.prompt && (
                          <div className="agent-config-content">
                            <pre>{disp.agentPrompt}</pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Agent Processing Steps Box */}
                    {disp.agentSteps && disp.agentSteps.length > 0 && (
                      <div className="agent-config-box">
                        <button
                          className="agent-config-header"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAgentSection(disp.id, 'steps');
                          }}
                        >
                          <span className="config-icon">⚙️</span>
                          <span className="config-label">Processing Steps ({disp.agentSteps.length})</span>
                          <svg className={`config-expand-icon ${expandedAgentSections[disp.id]?.steps ? 'expanded' : ''}`} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M7 10l5 5 5-5z"/>
                          </svg>
                        </button>
                        {expandedAgentSections[disp.id]?.steps && (
                          <div className="agent-config-content">
                            <div className="agent-steps-timeline">
                              {disp.agentSteps.map((step, index) => (
                                <div key={index} className={`step-item ${step.status}`}>
                                  <div className="step-marker">
                                    <div className="step-number">{step.step}</div>
                                    {index < disp.agentSteps.length - 1 && <div className="step-line"></div>}
                                  </div>
                                  <div className="step-content">
                                    <div className="step-header">
                                      <h6>{step.action}</h6>
                                      <span className="step-time">
                                        {formatDate(step.timestamp)}
                                      </span>
                                    </div>
                                    <p className="step-description">{step.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                      {disp.metadata && Object.keys(disp.metadata).length > 0 && (
                        <div className="disposition-metadata-compact">
                          <h5>Key Details</h5>
                          <div className="metadata-grid-compact">
                            {Object.entries(disp.metadata).map(([key, value]) => (
                              <div key={key} className="metadata-item-compact">
                                <span className="metadata-key">{key}:</span>
                                <span className="metadata-value">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {disp.status === 'resolved' && disp.resolution && (
                        <div className="disposition-resolution-compact">
                          <h5>Resolution</h5>
                          <p><strong>Action:</strong> {disp.resolution.action}</p>
                          {disp.resolution.note && <p><strong>Note:</strong> {disp.resolution.note}</p>}
                          <p className="resolved-by">
                            By {disp.resolution.user} on {new Date(disp.resolution.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {disp.status === 'resolved' && disp.resolution && false && (
                    <div className="disposition-resolution">
                      <h5>Resolution</h5>
                      <p><strong>Action Taken:</strong> {disp.resolution.action}</p>
                      {disp.resolution.note && <p><strong>Note:</strong> {disp.resolution.note}</p>}
                      <p className="resolved-by">
                        Resolved by {disp.resolution.user} on {new Date(disp.resolution.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Document Preview Slide-out */}
      {previewDocument && (
        <div className="document-slideout-overlay" onClick={() => setPreviewDocument(null)}>
          <div className="document-slideout" onClick={(e) => e.stopPropagation()}>
            <div className="slideout-header">
              <div className="slideout-title">
                <h3>{previewDocument.fileName}</h3>
                <span className="slideout-doc-type">{previewDocument.documentType}</span>
              </div>
              <button className="slideout-close" onClick={() => setPreviewDocument(null)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="slideout-content">
              {previewDocument.extractedData && previewDocument.extractedData.data && Object.keys(previewDocument.extractedData.data).length > 0 ? (
                <div className="preview-data">
                  <h4>Extracted Data</h4>
                  {Object.entries(previewDocument.extractedData.data).map(([key, value]) => (
                    <div key={key} className="preview-data-item">
                      <span className="preview-data-key">{key}:</span>
                      <span className="preview-data-value">{value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <div className="placeholder-icon">📄</div>
                  <h4>No Extracted Data Available</h4>
                  <p>This document has not been processed yet or the extracted data is not available.</p>
                  <div className="document-basic-info">
                    <p><strong>File Name:</strong> {previewDocument.fileName}</p>
                    <p><strong>Document Type:</strong> {previewDocument.documentType}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentDispositionQueue;
