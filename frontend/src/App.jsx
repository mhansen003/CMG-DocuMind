import { useState, useEffect } from 'react'
import './App.css'
import Dashboard from './pages/Dashboard'
import LoanDetails from './pages/LoanDetails'
import Admin from './pages/Admin'
import Agents from './pages/Agents'
import WelcomeSplash from './components/WelcomeSplash'

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, loanDetails, or admin
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  const [showSplash, setShowSplash] = useState(false);

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

      <div className="app-container">
        <header className="app-header">
          <div className="header-content">
            <div>
              <h1 style={{cursor: 'pointer'}} onClick={handleBackToDashboard}>
                🏠 CMG DocuMind
              </h1>
              <p>Mortgage Document Intelligence System</p>
            </div>
            <nav className="header-nav">
              <button
                className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={handleBackToDashboard}
              >
                📊 Dashboard
              </button>
              <button
                className={`nav-button ${currentView === 'agents' ? 'active' : ''}`}
                onClick={() => setCurrentView('agents')}
              >
                🤖 Agents
              </button>
              <button
                className={`nav-button ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => setCurrentView('admin')}
              >
                ⚙️ Doc Extraction Admin
              </button>
            </nav>
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
      </div>
    </>
  )
}

export default App
