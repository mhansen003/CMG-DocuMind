import { useState, useEffect } from 'react';
import { getLoans } from '../api/client';

function Dashboard({ onSelectLoan }) {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      {/* Loans Grid */}
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
    </div>
  );
}

export default Dashboard;
