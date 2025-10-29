import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import LoanDetails from './pages/LoanDetails'
import Admin from './pages/Admin'
import Agents from './pages/Agents'
import WelcomeSplash from './components/WelcomeSplash'
import AgentRelationshipMap from './components/AgentRelationshipMap'

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, loanDetails, or admin
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showAgentMap, setShowAgentMap] = useState(false);

  // Check if user has seen the splash screen in this session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (!hasSeenSplash) {
      setShowSplash(true);
    }
  }, []);

  const handleCloseSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  const handleLaunchSplash = () => {
    setShowSplash(true);
  };

  const handleSelectLoan = (loanId) => {
    setSelectedLoanId(loanId);
    setCurrentView('loanDetails');
  };

  const handleBackToDashboard = () => {
    setSelectedLoanId(null);
    setCurrentView('dashboard');
  };

  return (
    <>
      {/* Welcome Splash Screen */}
      {showSplash && <WelcomeSplash onClose={handleCloseSplash} />}

      {/* Agent Relationship Map */}
      {showAgentMap && <AgentRelationshipMap onClose={() => setShowAgentMap(false)} />}

      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div className="header-left">
              <div className="header-brand" onClick={handleBackToDashboard}>
                <div className="brand-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                  </svg>
                </div>
                <div className="brand-text">
                  <h1>CMG DocuMind</h1>
                  <p>Mortgage Document Intelligence</p>
                </div>
              </div>
              <nav className="header-nav">
                <button
                  className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
                  onClick={handleBackToDashboard}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                  </svg>
                  Dashboard
                </button>
                <button
                  className={`nav-button ${currentView === 'agents' ? 'active' : ''}`}
                  onClick={() => setCurrentView('agents')}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  Agents
                </button>
              </nav>
            </div>
            <div className="header-right">
              <button
                className={`nav-button ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin')}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
                Admin
              </button>
              <button className="btn-intro" onClick={() => setShowAgentMap(true)} title="View Agent Relationship Map">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l-5.5 9h11z"/>
                  <circle cx="17.5" cy="17.5" r="4.5"/>
                  <circle cx="6.5" cy="17.5" r="4.5"/>
                </svg>
                Agent Map
              </button>
              <button className="btn-intro" onClick={handleLaunchSplash} title="Watch Introduction">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Intro
              </button>
              <div className="user-profile">
                <div className="user-avatar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="user-info">
                  <span className="user-name">Admin User</span>
                  <span className="user-role">Underwriter</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          {currentView === 'dashboard' && (
            <Dashboard onSelectLoan={handleSelectLoan} />
          )}
          {currentView === 'loanDetails' && (
            <LoanDetails
              loanId={selectedLoanId}
              onBack={handleBackToDashboard}
            />
          )}
          {currentView === 'agents' && (
            <Agents onBack={handleBackToDashboard} />
          )}
          {currentView === 'admin' && (
            <Admin onBack={handleBackToDashboard} />
          )}
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h4>CMG Financial</h4>
              <p>America's Most Recommended Mortgage Company</p>
              <p className="footer-tagline">Powered by Innovation, Driven by Excellence</p>
            </div>
            <div className="footer-section">
              <h4>DocuMind Platform</h4>
              <ul className="footer-links">
                <li>Intelligent Document Processing</li>
                <li>AI-Powered Validation</li>
                <li>Real-time LOS Sync</li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p>CMG Financial Services</p>
              <p>San Ramon, CA</p>
              <p><a href="https://www.cmgfi.com" target="_blank" rel="noopener noreferrer">www.cmgfi.com</a></p>
            </div>
            <div className="footer-section footer-legal">
              <p>&copy; {new Date().getFullYear()} CMG Financial. All rights reserved.</p>
              <p className="footer-license">NMLS #1820 | Equal Housing Lender</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default App
