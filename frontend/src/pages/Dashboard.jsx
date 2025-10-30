import { useState, useEffect } from 'react';
import { getLoans } from '../api/client';

function Dashboard({ onSelectLoan }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await getLoans();
      setLoans(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError('Failed to load loans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'DocumentReview': 'document-review',
      'Processing': 'processing',
      'Approved': 'approved',
    };
    return statusMap[status] || 'processing';
  };

  const getStatusLabel = (status) => {
    const labelMap = {
      'DocumentReview': 'Doc Review',
      'Processing': 'Processing',
      'Approved': 'Approved',
    };
    return labelMap[status] || status;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <span>Loading loans...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error">{error}</div>
        <button className="btn btn-primary" onClick={fetchLoans}>
          Retry
        </button>
      </div>
    );
  }

  if (loans.length === 0) {
    return (
      <div className="empty-state">
        <h3>📋 No Loans Found</h3>
        <p>There are no loans in the system yet.</p>
      </div>
    );
  }

  // Calculate stats
  const totalLoans = loans.length;
  const totalAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
  const inReview = loans.filter(l => l.status === 'DocumentReview').length;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>📊 Loan Dashboard</h2>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Card View"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Cards</span>
          </button>
          <button
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Loans</h3>
          <div className="value">{totalLoans}</div>
        </div>
        <div className="stat-card">
          <h3>Total Volume</h3>
          <div className="value">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="stat-card">
          <h3>In Review</h3>
          <div className="value">{inReview}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Loan Size</h3>
          <div className="value">{formatCurrency(totalAmount / totalLoans)}</div>
        </div>
      </div>

      {/* Loans View - Cards or Table */}
      {viewMode === 'cards' ? (
        <div className="loans-grid">
          {loans.map((loan) => (
            <div
              key={loan.loanId}
              className="loan-card"
              onClick={() => onSelectLoan && onSelectLoan(loan.loanId)}
            >
              <div className="loan-card-header">
                <div>
                  <h3>{loan.borrowerName}</h3>
                  <div className="loan-number">Loan # {loan.loanNumber}</div>
                </div>
                <span className={`status-badge ${getStatusClass(loan.status)}`}>
                  {getStatusLabel(loan.status)}
                </span>
              </div>

              <div className="loan-card-body">
                <div className="loan-info">
                  <div className="loan-info-row">
                    <label>Loan Amount:</label>
                    <span className="value">{formatCurrency(loan.loanAmount)}</span>
                  </div>
                  <div className="loan-info-row">
                    <label>Property:</label>
                    <span className="value">{loan.propertyAddress}</span>
                  </div>
                </div>
              </div>

              <div className="loan-card-footer">
                <span>Last Updated: {formatDate(loan.lastUpdated)}</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="loans-table-container">
          <table className="loans-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Borrower</th>
                <th>Loan Amount</th>
                <th>Property Address</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.loanId}
                  className="loan-row"
                  onClick={() => onSelectLoan && onSelectLoan(loan.loanId)}
                >
                  <td className="loan-number-cell">{loan.loanNumber}</td>
                  <td className="borrower-cell">
                    <strong>{loan.borrowerName}</strong>
                  </td>
                  <td className="amount-cell">{formatCurrency(loan.loanAmount)}</td>
                  <td className="property-cell">{loan.propertyAddress}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${getStatusClass(loan.status)}`}>
                      {getStatusLabel(loan.status)}
                    </span>
                  </td>
                  <td className="date-cell">{formatDate(loan.lastUpdated)}</td>
                  <td className="action-cell">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
