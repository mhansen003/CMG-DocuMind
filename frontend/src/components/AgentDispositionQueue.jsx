import { useState } from 'react';
import '../styles/AgentDispositionQueue.css';

function AgentDispositionQueue({ loanId, dispositions = [], onDisposition, documents = [] }) {
  const [filter, setFilter] = useState('all'); // all, open, resolved
  const [expandedItem, setExpandedItem] = useState(null);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [viewAgentDetails, setViewAgentDetails] = useState(null); // For agent details slideout
  const [actionModal, setActionModal] = useState(null); // { dispositionId, actionId, actionLabel, actionType }
  const [modalFormData, setModalFormData] = useState({}); // Form data for the modal

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

  const handleAction = (dispositionId, actionId, actionLabel, actionType) => {
    // Open modal instead of directly calling onDisposition
    setActionModal({ dispositionId, actionId, actionLabel, actionType });
    setModalFormData({});
  };

  const handleModalSubmit = () => {
    if (actionModal && onDisposition) {
      onDisposition(actionModal.dispositionId, actionModal.actionId, actionModal.actionLabel, modalFormData);
      setActionModal(null);
      setModalFormData({});
    }
  };

  const handleModalClose = () => {
    setActionModal(null);
    setModalFormData({});
  };

  const handleModalInputChange = (field, value) => {
    setModalFormData(prev => ({ ...prev, [field]: value }));
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
                                onClick={() => handleAction(disp.id, action.id, action.label, action.type)}
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

                  {/* Agent Details Button */}
                  {(disp.agentPrompt || (disp.agentSteps && disp.agentSteps.length > 0)) && (
                    <button
                      className="view-agent-details-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewAgentDetails(disp);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                      </svg>
                      View Agent Details
                      <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                      </svg>
                    </button>
                  )}

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
              {(() => {
                // Try multiple possible document URL properties
                const docUrl = previewDocument.filePath ||
                              previewDocument.s3Key && `/documents/${previewDocument.s3Key}` ||
                              previewDocument.url ||
                              previewDocument.documentUrl ||
                              previewDocument.htmlPath ||
                              previewDocument.previewUrl;

                if (docUrl) {
                  return (
                    <div className="document-iframe-container">
                      <iframe
                        src={docUrl}
                        title={previewDocument.fileName}
                        className="document-iframe"
                      />
                    </div>
                  );
                }

                // If we have HTML content directly
                if (previewDocument.htmlContent) {
                  return (
                    <div className="document-iframe-container">
                      <iframe
                        srcDoc={previewDocument.htmlContent}
                        title={previewDocument.fileName}
                        className="document-iframe"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  );
                }

                // Fallback placeholder
                return (
                  <div className="preview-placeholder">
                    <div className="placeholder-icon">📄</div>
                    <h4>Document Preview Not Available</h4>
                    <p>Unable to load document preview at this time.</p>
                    <div className="document-basic-info">
                      <p><strong>File Name:</strong> {previewDocument.fileName || 'Unknown'}</p>
                      <p><strong>Document Type:</strong> {previewDocument.documentType || 'Unknown'}</p>
                      {previewDocument.id && <p><strong>Document ID:</strong> {previewDocument.id}</p>}
                    </div>
                    <div style={{marginTop: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.75rem', textAlign: 'left'}}>
                      <strong>Debug Info:</strong>
                      <pre style={{marginTop: '0.5rem', fontSize: '0.7rem'}}>{JSON.stringify(Object.keys(previewDocument), null, 2)}</pre>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Agent Details Slide-out */}
      {viewAgentDetails && (
        <div className="document-slideout-overlay" onClick={() => setViewAgentDetails(null)}>
          <div className="document-slideout" onClick={(e) => e.stopPropagation()}>
            <div className="slideout-header">
              <div className="slideout-title">
                <h3>{viewAgentDetails.agentName}</h3>
                <span className="slideout-doc-type">{viewAgentDetails.agentType}</span>
              </div>
              <button className="slideout-close" onClick={() => setViewAgentDetails(null)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="slideout-content agent-details-slideout">
              {/* Agent Instructions */}
              {viewAgentDetails.agentPrompt && (
                <div className="agent-detail-section">
                  <h4>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M9 4v1.38c-.83-.33-1.72-.5-2.61-.5-1.79 0-3.58.68-4.95 2.05l3.33 3.33h1.11v1.11c.86.86 1.98 1.31 3.11 1.36V15H6v3c0 1.1.9 2 2 2h10c1.66 0 3-1.34 3-3V4H9zm-1.11 6.41V8.26H5.61L4.57 7.22C5.14 7.08 5.72 7 6.39 7c1.6 0 3.11.62 4.24 1.75l.03.03-2.77 2.63zM19 18c0 .55-.45 1-1 1s-1-.45-1-1v-2h-6v-2.59c.57-.23 1.10-.57 1.56-1.03l.2-.2L15.59 14H17v-1.41l-6-5.97V6h8v12z"/>
                    </svg>
                    Agent Instructions
                  </h4>
                  <div className="agent-detail-content">
                    <pre>{viewAgentDetails.agentPrompt}</pre>
                  </div>
                </div>
              )}

              {/* Processing Steps */}
              {viewAgentDetails.agentSteps && viewAgentDetails.agentSteps.length > 0 && (
                <div className="agent-detail-section">
                  <h4>
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Processing Steps ({viewAgentDetails.agentSteps.length})
                  </h4>
                  <div className="agent-steps-timeline-slideout">
                    {viewAgentDetails.agentSteps.map((step, index) => (
                      <div key={index} className={`step-item ${step.status}`}>
                        <div className="step-marker">
                          <div className="step-number">{step.step}</div>
                          {index < viewAgentDetails.agentSteps.length - 1 && <div className="step-line"></div>}
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
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="action-modal-overlay" onClick={handleModalClose}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header modal-header-${actionModal.actionType}`}>
              <div className="modal-title">
                <h3>{actionModal.actionLabel}</h3>
                <p>Provide details to complete this action</p>
              </div>
              <button className="modal-close" onClick={handleModalClose}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="modal-content">
              {/* Common fields for all actions */}
              <div className="modal-form-group">
                <label htmlFor="notes">Notes / Comments {actionModal.actionType === 'danger' && <span className="required">*</span>}</label>
                <textarea
                  id="notes"
                  className="modal-textarea"
                  rows="4"
                  placeholder={
                    actionModal.actionType === 'success'
                      ? 'Provide resolution details...'
                      : actionModal.actionType === 'warning'
                      ? 'Explain why this needs review...'
                      : actionModal.actionType === 'danger'
                      ? 'Provide justification for this action...'
                      : 'Add any additional notes...'
                  }
                  value={modalFormData.notes || ''}
                  onChange={(e) => handleModalInputChange('notes', e.target.value)}
                  required={actionModal.actionType === 'danger'}
                />
              </div>

              {/* Override reason field for warning/danger actions */}
              {(actionModal.actionType === 'warning' || actionModal.actionType === 'danger') && (
                <div className="modal-form-group">
                  <label htmlFor="reason">Reason <span className="required">*</span></label>
                  <select
                    id="reason"
                    className="modal-select"
                    value={modalFormData.reason || ''}
                    onChange={(e) => handleModalInputChange('reason', e.target.value)}
                    required
                  >
                    <option value="">Select a reason...</option>
                    <option value="agent_error">Agent Error - Incorrect Analysis</option>
                    <option value="acceptable_risk">Acceptable Risk - Documented Exception</option>
                    <option value="manual_verification">Manually Verified - Override Agent</option>
                    <option value="business_decision">Business Decision - Management Approval</option>
                    <option value="data_quality">Data Quality Issue - Document Problem</option>
                    <option value="other">Other - See Notes</option>
                  </select>
                </div>
              )}

              {/* Assignee field for review requests */}
              {actionModal.actionType === 'warning' && actionModal.actionLabel.toLowerCase().includes('review') && (
                <div className="modal-form-group">
                  <label htmlFor="assignee">Assign To</label>
                  <select
                    id="assignee"
                    className="modal-select"
                    value={modalFormData.assignee || ''}
                    onChange={(e) => handleModalInputChange('assignee', e.target.value)}
                  >
                    <option value="">Current User</option>
                    <option value="senior_underwriter">Senior Underwriter</option>
                    <option value="qa_team">QA Team</option>
                    <option value="compliance">Compliance</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              )}

              {/* Priority field for certain actions */}
              {actionModal.actionType === 'warning' && (
                <div className="modal-form-group">
                  <label htmlFor="priority">Priority</label>
                  <div className="modal-radio-group">
                    <label className="modal-radio-label">
                      <input
                        type="radio"
                        name="priority"
                        value="high"
                        checked={modalFormData.priority === 'high'}
                        onChange={(e) => handleModalInputChange('priority', e.target.value)}
                      />
                      <span>🔴 High</span>
                    </label>
                    <label className="modal-radio-label">
                      <input
                        type="radio"
                        name="priority"
                        value="medium"
                        checked={modalFormData.priority === 'medium' || !modalFormData.priority}
                        onChange={(e) => handleModalInputChange('priority', e.target.value)}
                      />
                      <span>🟡 Medium</span>
                    </label>
                    <label className="modal-radio-label">
                      <input
                        type="radio"
                        name="priority"
                        value="low"
                        checked={modalFormData.priority === 'low'}
                        onChange={(e) => handleModalInputChange('priority', e.target.value)}
                      />
                      <span>🟢 Low</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Acknowledgment checkbox for danger actions */}
              {actionModal.actionType === 'danger' && (
                <div className="modal-form-group">
                  <label className="modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={modalFormData.acknowledged || false}
                      onChange={(e) => handleModalInputChange('acknowledged', e.target.checked)}
                    />
                    <span>I acknowledge the risk and take full responsibility for this action</span>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={handleModalClose}>
                Cancel
              </button>
              <button
                className={`modal-btn modal-btn-submit modal-btn-${actionModal.actionType}`}
                onClick={handleModalSubmit}
                disabled={
                  (actionModal.actionType === 'danger' && (!modalFormData.notes || !modalFormData.acknowledged || !modalFormData.reason)) ||
                  ((actionModal.actionType === 'warning') && actionModal.actionLabel.toLowerCase().includes('override') && !modalFormData.reason)
                }
              >
                {actionModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentDispositionQueue;
