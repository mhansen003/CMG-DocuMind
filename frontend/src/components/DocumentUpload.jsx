import { useState, useEffect } from 'react';
import { getDocumentTypes } from '../api/client';
import '../styles/DocumentUpload.css';

function DocumentUpload({ loanId, onUpload }) {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const response = await getDocumentTypes();
      setDocumentTypes(response.data);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a PDF file');
      setSelectedFile(null);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!selectedType) {
      setError('Please select a document type');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(false);

      await onUpload(selectedFile, selectedType);

      setSuccess(true);
      setSelectedFile(null);
      setSelectedType('');

      // Reset form
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">
      <div className="upload-container">
        <h2>Upload Document</h2>
        <p className="upload-description">
          Upload a mortgage document to extract and validate data automatically.
        </p>

        {error && <div className="error">{error}</div>}
        {success && (
          <div className="success">
            ✓ Document uploaded and processed successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Document Type Selector */}
          <div className="form-group">
            <label htmlFor="documentType">Document Type *</label>
            <select
              id="documentType"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              required
            >
              <option value="">Select document type...</option>
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.required && '*'}
                </option>
              ))}
            </select>
          </div>

          {/* File Drop Zone */}
          <div
            className={`drop-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="file-selected">
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => {
                    setSelectedFile(null);
                    document.getElementById('file-input').value = '';
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="drop-icon">📁</div>
                <p className="drop-text">
                  Drag and drop your PDF here, or
                </p>
                <label htmlFor="file-input" className="btn btn-secondary">
                  Browse Files
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                <p className="drop-note">PDF files only, max 10MB</p>
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-upload"
            disabled={!selectedFile || !selectedType || uploading}
          >
            {uploading ? (
              <>
                <div className="loading-spinner-small"></div>
                Processing...
              </>
            ) : (
              <>⬆️ Upload &amp; Process Document</>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="upload-info-box">
          <h4>What happens next?</h4>
          <ul>
            <li>✓ Document is uploaded securely</li>
            <li>✓ AI extracts key data automatically</li>
            <li>✓ Data is validated against loan application</li>
            <li>✓ Conditions are generated if needed</li>
            <li>✓ Results appear instantly in the viewer</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DocumentUpload;
