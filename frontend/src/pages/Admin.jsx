import { useState, useEffect } from 'react';
import { paystubFields } from '../data/paystubFields';
import { w2Fields } from '../data/w2Fields';
import { bankStatementFields } from '../data/bankStatementFields';
import { taxReturnFields } from '../data/taxReturnFields';
import AddFieldModal from '../components/AddFieldModal';
import '../styles/Admin.css';

function Admin({ onBack }) {
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [showAddField, setShowAddField] = useState(false);

  useEffect(() => {
    // In production, this would fetch from an API
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = () => {
    // Sample document type configurations
    const types = [
      {
        id: 'paystub',
        name: 'Paystub',
        description: 'Employee pay statement showing income and deductions',
        icon: '💰',
        fields: paystubFields
      },
      {
        id: 'w2',
        name: 'W-2 Form',
        description: 'IRS Form W-2 - Annual wage and tax statement',
        icon: '📋',
        fields: w2Fields
      },
      {
        id: 'bank-statement',
        name: 'Bank Statement',
        description: 'Monthly bank account statement showing transactions and balances',
        icon: '🏦',
        fields: bankStatementFields
      },
      {
        id: 'tax-return',
        name: 'Tax Return (1040)',
        description: 'IRS Form 1040 - Individual income tax return with supporting schedules',
        icon: '📊',
        fields: taxReturnFields
      }
    ];

    setDocumentTypes(types);
    if (types.length > 0) {
      setSelectedDocType(types[0]);
    }
  };

  const handleSaveField = (field) => {
    // In production, save to API
    console.log('Saving field:', field);

    // Add field to the current document type
    setDocumentTypes(prevTypes =>
      prevTypes.map(type =>
        type.id === selectedDocType.id
          ? { ...type, fields: [...type.fields, field] }
          : type
      )
    );

    // Update the selected doc type to reflect the new field
    setSelectedDocType(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    setShowAddField(false);
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      // In production, call API to delete
      console.log('Deleting field:', fieldId);
    }
  };

  const getRuleSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <button className="btn-back" onClick={() => onBack && onBack()}>
            ← Back to Dashboard
          </button>
          <h1>⚙️ Document Rules Administration</h1>
          <p>Configure document types, field mappings, and validation rules</p>
        </div>
      </div>

      <div className="admin-content">
        {/* Sidebar - Document Types */}
        <div className="admin-sidebar">
          <h3>Document Types</h3>
          <div className="doc-types-list">
            {documentTypes.map(docType => (
              <div
                key={docType.id}
                className={`doc-type-item ${selectedDocType?.id === docType.id ? 'active' : ''}`}
                onClick={() => setSelectedDocType(docType)}
              >
                <span className="doc-type-icon">{docType.icon}</span>
                <div className="doc-type-info">
                  <div className="doc-type-name">{docType.name}</div>
                  <div className="doc-type-fields-count">
                    {docType.fields.length} field{docType.fields.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content - Document Type Details */}
        <div className="admin-main">
          {selectedDocType ? (
            <>
              <div className="doc-type-header">
                <div className="doc-type-header-left">
                  <span className="doc-type-header-icon">{selectedDocType.icon}</span>
                  <div>
                    <h2>{selectedDocType.name}</h2>
                    <p>{selectedDocType.description}</p>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddField(true)}
                >
                  ➕ Add Field
                </button>
              </div>

              {/* Fields List */}
              <div className="fields-section">
                <h3>Field Configuration</h3>
                {selectedDocType.fields.length === 0 ? (
                  <div className="empty-state">
                    <p>No fields configured yet</p>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowAddField(true)}
                    >
                      Add First Field
                    </button>
                  </div>
                ) : (
                  <div className="fields-list">
                    {selectedDocType.fields.map(field => (
                      <div key={field.id} className="field-card">
                        <div className="field-card-header">
                          <div className="field-card-title">
                            <h4>{field.fieldName}</h4>
                            {field.required && <span className="required-badge">Required</span>}
                            <span className="datatype-badge">{field.dataType}</span>
                          </div>
                          <div className="field-card-actions">
                            <button
                              className="btn-icon"
                              onClick={() => setEditingField(field)}
                              title="Edit field"
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => handleDeleteField(field.id)}
                              title="Delete field"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        <div className="field-card-body">
                          <div className="field-detail">
                            <label>Description:</label>
                            <div>{field.description}</div>
                          </div>

                          {field.extractionPrompt && (
                            <div className="field-detail">
                              <label>🤖 AI Extraction Prompt:</label>
                              <div className="extraction-prompt">
                                {field.extractionPrompt}
                              </div>
                            </div>
                          )}

                          <div className="field-detail">
                            <label>ByteLOS Mapping:</label>
                            <div className="bytelos-mapping">
                              {field.byteLOSMapping || <em>No mapping defined</em>}
                            </div>
                          </div>

                          {/* Validation Rules */}
                          {field.rules && field.rules.length > 0 && (
                            <div className="field-rules">
                              <label>Validation Rules ({field.rules.length}):</label>
                              <div className="rules-list">
                                {field.rules.map(rule => (
                                  <div key={rule.id} className="rule-item">
                                    <div className="rule-header">
                                      <span
                                        className="rule-severity"
                                        style={{ backgroundColor: getRuleSeverityColor(rule.severity) }}
                                      >
                                        {rule.severity}
                                      </span>
                                      <span className="rule-name">{rule.ruleName}</span>
                                      <span className="rule-type">{rule.ruleType}</span>
                                    </div>
                                    <div className="rule-description">{rule.description}</div>
                                    <div className="rule-condition">
                                      <strong>Condition:</strong> {rule.condition}
                                      {rule.value && ` (${rule.value})`}
                                      {rule.compareField && ` → compare with: ${rule.compareField}`}
                                    </div>
                                    <div className="rule-error">
                                      <strong>Error Message:</strong> {rule.errorMessage}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h3>Select a document type to configure</h3>
            </div>
          )}
        </div>
      </div>

      {/* Add Field Modal */}
      {showAddField && (
        <AddFieldModal
          onClose={() => setShowAddField(false)}
          onSave={handleSaveField}
          docType={selectedDocType}
        />
      )}
    </div>
  );
}

export default Admin;
