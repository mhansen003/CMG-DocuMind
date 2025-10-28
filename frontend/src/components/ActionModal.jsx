import { useState } from 'react';
import '../styles/ActionModal.css';

function ActionModal({ isOpen, onClose, action, documentData, loanData }) {
  const [formData, setFormData] = useState({
    notes: '',
    priority: 'normal',
    assignTo: '',
    dueDate: '',
    requestedDocType: '',
    conditionType: 'prior-to-docs',
    conditionTitle: '',
    conditionDescription: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Action submitted:', {
      action,
      formData,
      documentData,
      loanData,
    });
    alert(`${action.title} submitted successfully!`);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  const renderFormFields = () => {
    switch (action.type) {
      case 'request-document':
        return (
          <>
            <div className="form-group">
              <label htmlFor="requestedDocType">Document Type *</label>
              <select
                id="requestedDocType"
                name="requestedDocType"
                value={formData.requestedDocType}
                onChange={handleChange}
                required
              >
                <option value="">Select document type...</option>
                <option value="paystub">Paystub</option>
                <option value="bank-statement">Bank Statement</option>
                <option value="w2">W-2</option>
                <option value="tax-return">Tax Return</option>
                <option value="drivers-license">Driver's License</option>
                <option value="employment-verification">Employment Verification</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Request Notes *</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Explain why this document is needed..."
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </>
        );

      case 'create-condition':
        return (
          <>
            <div className="form-group">
              <label htmlFor="conditionType">Condition Type *</label>
              <select
                id="conditionType"
                name="conditionType"
                value={formData.conditionType}
                onChange={handleChange}
                required
              >
                <option value="prior-to-docs">Prior to Docs</option>
                <option value="prior-to-funding">Prior to Funding</option>
                <option value="post-closing">Post Closing</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="conditionTitle">Condition Title *</label>
              <input
                type="text"
                id="conditionTitle"
                name="conditionTitle"
                value={formData.conditionTitle}
                onChange={handleChange}
                placeholder="Brief title for the condition"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="conditionDescription">Description *</label>
              <textarea
                id="conditionDescription"
                name="conditionDescription"
                value={formData.conditionDescription}
                onChange={handleChange}
                placeholder="Detailed description of the condition and what's needed to clear it..."
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </>
        );

      case 'override':
        return (
          <>
            <div className="warning-box">
              <span className="warning-icon">⚠️</span>
              <div>
                <div className="warning-title">Validation Override</div>
                <div className="warning-message">
                  You are about to override a validation rule. This action requires supervisor approval
                  and will be logged in the audit trail.
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Override Justification *</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Provide a detailed explanation for overriding this validation..."
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="assignTo">Supervisor Approval Required *</label>
              <select
                id="assignTo"
                name="assignTo"
                value={formData.assignTo}
                onChange={handleChange}
                required
              >
                <option value="">Select supervisor...</option>
                <option value="sarah-williams">Sarah Williams - Senior Underwriter</option>
                <option value="mike-johnson">Mike Johnson - Loan Processor</option>
                <option value="david-chen">David Chen - Loan Officer</option>
              </select>
            </div>
          </>
        );

      case 'mark-reviewed':
        return (
          <>
            <div className="form-group">
              <label htmlFor="notes">Review Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes about this review..."
                rows="3"
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{action.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {action.context && (
            <div className="context-box">
              <div className="context-title">Context</div>
              <div className="context-details">
                {action.context.field && (
                  <div className="context-item">
                    <strong>Field:</strong> {action.context.field}
                  </div>
                )}
                {action.context.currentValue && (
                  <div className="context-item">
                    <strong>Current Value:</strong> {action.context.currentValue}
                  </div>
                )}
                {action.context.issue && (
                  <div className="context-item">
                    <strong>Issue:</strong> {action.context.issue}
                  </div>
                )}
                {action.context.rule && (
                  <div className="context-item">
                    <strong>Rule:</strong> <code>{action.context.rule}</code>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="modal-actions">
              <button type="button" className="btn btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit">
                {action.submitLabel || 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ActionModal;
