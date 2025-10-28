import { useState } from 'react';
import '../styles/Modal.css';

function AddFieldModal({ onClose, onSave, docType }) {
  const [formData, setFormData] = useState({
    fieldName: '',
    description: '',
    extractionPrompt: '',
    byteLOSMapping: '',
    dataType: 'string',
    required: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fieldName.trim()) {
      newErrors.fieldName = 'Field name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.extractionPrompt.trim()) {
      newErrors.extractionPrompt = 'Extraction prompt is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Generate ID from field name
    const id = formData.fieldName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');

    const newField = {
      id,
      ...formData,
      rules: []
    };

    onSave(newField);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>➕ Add New Field to {docType?.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="fieldName">
              Field Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="fieldName"
              name="fieldName"
              value={formData.fieldName}
              onChange={handleChange}
              placeholder="e.g., Employee Name"
              className={errors.fieldName ? 'error' : ''}
            />
            {errors.fieldName && <span className="error-message">{errors.fieldName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of what this field represents"
              rows="3"
              className={errors.description ? 'error' : ''}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="extractionPrompt">
              🤖 AI Extraction Prompt <span className="required">*</span>
            </label>
            <textarea
              id="extractionPrompt"
              name="extractionPrompt"
              value={formData.extractionPrompt}
              onChange={handleChange}
              placeholder="Detailed instructions for how AI should extract this field from documents..."
              rows="5"
              className={errors.extractionPrompt ? 'error' : ''}
            />
            {errors.extractionPrompt && <span className="error-message">{errors.extractionPrompt}</span>}
            <small className="field-hint">
              Provide clear instructions on where to find this data in the document and how to extract it accurately.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="byteLOSMapping">
              ByteLOS Mapping
            </label>
            <input
              type="text"
              id="byteLOSMapping"
              name="byteLOSMapping"
              value={formData.byteLOSMapping}
              onChange={handleChange}
              placeholder="e.g., borrower.firstName"
            />
            <small className="field-hint">
              Optional: Specify the ByteLOS field path this maps to
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataType">
                Data Type
              </label>
              <select
                id="dataType"
                name="dataType"
                value={formData.dataType}
                onChange={handleChange}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="date">Date</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="required"
                  checked={formData.required}
                  onChange={handleChange}
                />
                <span>Required Field</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              ✓ Add Field
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFieldModal;
