import { useState, useEffect, useRef } from 'react';
import '../styles/WelcomeSplash.css';

function WelcomeSplash({ onClose }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Handle video loaded
    const handleLoadedData = async () => {
      setIsLoading(false);

      // Try to play with sound
      try {
        await video.play();
        // If it works, great! Sound is on
      } catch (error) {
        // Browser blocked autoplay with sound
        // Show "Click to Play" button
        setNeedsUserInteraction(true);
      }
    };

    // Handle video error
    const handleError = () => {
      setIsLoading(false);
      setVideoError(true);
    };

    // Auto-close when video ends
    const handleVideoEnd = () => {
      setTimeout(() => {
        handleClose();
      }, 2000); // 2 second delay after video ends
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);
    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
      video.removeEventListener('ended', handleVideoEnd);
    };
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 500); // Match the fade-out animation duration
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlayClick = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.play();
        setNeedsUserInteraction(false);
      } catch (error) {
        console.error('Failed to play video:', error);
      }
    }
  };

  return (
    <div className={`splash-overlay ${isClosing ? 'closing' : ''}`}>
      <div className={`splash-content ${isClosing ? 'closing' : ''}`}>
        <div className="splash-header">
          <h1>🏠 Welcome to CMG DocuMind</h1>
          <p>AI-Powered Mortgage Document Intelligence</p>
        </div>

        <div className="splash-video-container">
          {isLoading && !videoError && (
            <div className="video-loading">
              <div className="loading-spinner"></div>
              <p>Loading video...</p>
            </div>
          )}

          {videoError && (
            <div className="video-error">
              <p>⚠️ Unable to load video</p>
              <button className="btn-skip" onClick={handleClose}>
                Continue to Dashboard
              </button>
            </div>
          )}

          {/* Click to Play Overlay */}
          {needsUserInteraction && !isLoading && (
            <div className="video-play-overlay">
              <button className="btn-play" onClick={handlePlayClick}>
                <div className="play-icon">▶</div>
                <div className="play-text">Click to Play</div>
              </button>
            </div>
          )}

          <video
            ref={videoRef}
            className="splash-video"
            muted={isMuted}
            playsInline
            preload="metadata"
            style={{ display: isLoading ? 'none' : 'block' }}
          >
            <source src="/intro-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Unmute Button (only show if video is playing and not waiting for interaction) */}
          {!isLoading && !videoError && !needsUserInteraction && (
            <button className="btn-unmute" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}
        </div>

        <div className="splash-actions">
          <button className="btn-skip" onClick={handleClose}>
            Skip Introduction
          </button>
        </div>

        <div className="splash-footer">
          <p>Transform your underwriting workflow with intelligent automation</p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeSplash;
