import { useState } from 'react';
import '../styles/LoanSummary.css';

function LoanSummary({ documents, onClose }) {
  // Organize documents by type and collect all issues
  const generateSummary = () => {
    const summary = {};
    let totalIssues = 0;
    let totalWarnings = 0;
    let totalValid = 0;

    documents.forEach(doc => {
      const docType = doc.documentType || 'Unknown';

      if (!summary[docType]) {
        summary[docType] = {
          documentCount: 0,
          documents: [],
          issuesCount: 0,
          warningsCount: 0,
          validCount: 0
        };
      }

      const validation = doc.validationResults || {};
      const fieldValidations = validation.fieldValidations || {};
      const warnings = validation.warnings || [];
      const issues = validation.issues || [];

      // Count field-level issues
      const fieldIssues = [];
      const fieldWarnings = [];
      const validFields = [];

      Object.entries(fieldValidations).forEach(([fieldName, fieldData]) => {
        if (fieldData.isValid === false) {
          fieldIssues.push({
            field: fieldName,
            message: fieldData.message || 'Validation failed',
            rule: fieldData.rule
          });
        } else if (fieldData.isValid === true) {
          validFields.push({
            field: fieldName,
            message: fieldData.message || 'Validation passed',
            rule: fieldData.rule
          });
        }
      });

      // Add document-level warnings
      warnings.forEach(warning => {
        fieldWarnings.push({
          field: warning.rule || 'General',
          message: warning.message,
          severity: warning.severity
        });
      });

      summary[docType].documents.push({
        fileName: doc.fileName,
        uploadDate: doc.uploadDate,
        status: doc.status,
        isValid: validation.isValid,
        issues: fieldIssues,
        warnings: fieldWarnings,
        validFields: validFields
      });

      summary[docType].documentCount++;
      summary[docType].issuesCount += fieldIssues.length + issues.length;
      summary[docType].warningsCount += fieldWarnings.length;
      summary[docType].validCount += validFields.length;

      totalIssues += fieldIssues.length + issues.length;
      totalWarnings += fieldWarnings.length;
      totalValid += validFields.length;
    });

    return { summary, totalIssues, totalWarnings, totalValid };
  };

  const { summary, totalIssues, totalWarnings, totalValid } = generateSummary();
  const totalDocuments = documents.length;

  return (
    <div className="loan-summary-overlay" onClick={onClose}>
      <div className="loan-summary-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="loan-summary-header">
          <div>
            <h2>📊 Loan Document Summary</h2>
            <p>Comprehensive overview of all document validations</p>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Stats Overview */}
        <div className="summary-stats">
          <div className="summary-stat-card">
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <div className="stat-value">{totalDocuments}</div>
              <div className="stat-label">Total Documents</div>
            </div>
          </div>
          <div className="summary-stat-card error">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-value">{totalIssues}</div>
              <div className="stat-label">Critical Issues</div>
            </div>
          </div>
          <div className="summary-stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <div className="stat-value">{totalWarnings}</div>
              <div className="stat-label">Warnings</div>
            </div>
          </div>
          <div className="summary-stat-card success">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <div className="stat-value">{totalValid}</div>
              <div className="stat-label">Validated Fields</div>
            </div>
          </div>
        </div>

        {/* Document Type Breakdown */}
        <div className="loan-summary-content">
          <h3>Document Breakdown</h3>

          {Object.keys(summary).length === 0 ? (
            <div className="empty-summary">
              <p>No documents to summarize</p>
            </div>
          ) : (
            Object.entries(summary).map(([docType, data]) => (
              <div key={docType} className="doc-type-section">
                <div className="doc-type-header">
                  <div className="doc-type-title">
                    <h4>{docType.toUpperCase()}</h4>
                    <span className="doc-count">{data.documentCount} document(s)</span>
                  </div>
                  <div className="doc-type-stats">
                    {data.issuesCount > 0 && (
                      <span className="issue-badge error">
                        {data.issuesCount} issue{data.issuesCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {data.warningsCount > 0 && (
                      <span className="issue-badge warning">
                        {data.warningsCount} warning{data.warningsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {data.issuesCount === 0 && data.warningsCount === 0 && (
                      <span className="issue-badge success">✓ All Valid</span>
                    )}
                  </div>
                </div>

                {/* Individual Documents */}
                {data.documents.map((doc, idx) => (
                  <div key={idx} className="doc-summary-item">
                    <div className="doc-summary-header">
                      <div className="doc-summary-title">
                        <span className="doc-icon">📄</span>
                        <div>
                          <div className="doc-filename">{doc.fileName}</div>
                          <div className="doc-date">
                            Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className={`doc-status-badge ${doc.isValid ? 'valid' : 'invalid'}`}>
                        {doc.isValid ? '✓ Valid' : '✗ Issues Found'}
                      </span>
                    </div>

                    {/* Critical Issues */}
                    {doc.issues.length > 0 && (
                      <div className="issues-section">
                        <div className="issues-header error">
                          <span>❌ Critical Issues ({doc.issues.length})</span>
                        </div>
                        <ul className="issues-list">
                          {doc.issues.map((issue, issueIdx) => (
                            <li key={issueIdx} className="issue-item error">
                              <div className="issue-field">{issue.field}</div>
                              <div className="issue-message">{issue.message}</div>
                              {issue.rule && <div className="issue-rule">Rule: {issue.rule}</div>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Warnings */}
                    {doc.warnings.length > 0 && (
                      <div className="issues-section">
                        <div className="issues-header warning">
                          <span>⚠️ Warnings ({doc.warnings.length})</span>
                        </div>
                        <ul className="issues-list">
                          {doc.warnings.map((warning, warnIdx) => (
                            <li key={warnIdx} className="issue-item warning">
                              <div className="issue-field">{warning.field}</div>
                              <div className="issue-message">{warning.message}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Valid Fields Summary */}
                    {doc.validFields.length > 0 && doc.issues.length === 0 && doc.warnings.length === 0 && (
                      <div className="issues-section">
                        <div className="issues-header success">
                          <span>✓ All Fields Valid ({doc.validFields.length})</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="loan-summary-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            🖨️ Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoanSummary;
