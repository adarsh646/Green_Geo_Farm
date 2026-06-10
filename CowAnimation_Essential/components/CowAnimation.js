import React, { useState, useEffect, useRef } from 'react';
import './CowAnimation.css';

const CowAnimation = ({ cowImageUrl = '/cow-image.png', autoDemo = true }) => {
  const [cowStatus, setCowStatus] = useState({
    waterDrinking: false,
    dehydrationRisk: false,
    medicineInjection: false,
    activeFeeding: false,
    feedingProblem: false,
    lowFeeding: false
  });

  const [currentStatus, setCurrentStatus] = useState('Normal');
  const [isAutoDemo, setIsAutoDemo] = useState(autoDemo);
  const intervalRef = useRef(null);

  // Auto-demo mode - cycle through different states
  useEffect(() => {
    if (isAutoDemo) {
      const demoSequence = [
        { status: 'Water Drinking', config: { waterDrinking: true }, duration: 4000 },
        { status: 'Dehydration Risk', config: { dehydrationRisk: true }, duration: 4000 },
        { status: 'Medicine Administered', config: { medicineInjection: true }, duration: 4000 },
        { status: 'Active Feeding', config: { activeFeeding: true }, duration: 4000 },
        { status: 'Feeding Problem', config: { feedingProblem: true }, duration: 4000 },
        { status: 'Low Feeding', config: { lowFeeding: true }, duration: 4000 },
        { status: 'Multiple Indicators', config: { waterDrinking: true, activeFeeding: true }, duration: 4000 },
        { status: 'Critical Alert', config: { dehydrationRisk: true, feedingProblem: true }, duration: 4000 },
        { status: 'Normal', config: {}, duration: 3000 }
      ];

      let currentIndex = 0;
      
      const runDemo = () => {
        const currentDemo = demoSequence[currentIndex];
        setCowStatus(currentDemo.config);
        setCurrentStatus(currentDemo.status);
        currentIndex = (currentIndex + 1) % demoSequence.length;
      };

      intervalRef.current = setInterval(runDemo, demoSequence[0].duration);
      runDemo(); // Run immediately

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isAutoDemo]);

  // External API for setting cow status
  const setCowHealthStatus = (status) => {
    setCowStatus(status);
    updateStatusIndicator(status);
  };

  const updateStatusIndicator = (status) => {
    const activeIndicators = Object.entries(status)
      .filter(([key, value]) => value)
      .map(([key]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim();
        return label.charAt(0).toUpperCase() + label.slice(1);
      });

    if (activeIndicators.length === 0) {
      setCurrentStatus('Normal');
    } else if (activeIndicators.length === 1) {
      setCurrentStatus(activeIndicators[0]);
    } else {
      setCurrentStatus(`Multiple: ${activeIndicators.join(', ')}`);
    }
  };

  const toggleStatus = (status) => {
    const newStatus = {
      ...cowStatus,
      [status]: !cowStatus[status]
    };
    setCowStatus(newStatus);
    updateStatusIndicator(newStatus);
    
    // Stop auto demo when manually controlling
    if (isAutoDemo) {
      setIsAutoDemo(false);
    }
  };

  const resetAll = () => {
    setCowStatus({
      waterDrinking: false,
      dehydrationRisk: false,
      medicineInjection: false,
      activeFeeding: false,
      feedingProblem: false,
      lowFeeding: false
    });
    setCurrentStatus('Normal');
  };

  const toggleAutoDemo = () => {
    setIsAutoDemo(!isAutoDemo);
    if (!isAutoDemo) {
      resetAll();
    }
  };

  return (
    <div className="cow-animation-container">
      {/* Cow Image Background */}
      <div className="cow-image">
        {cowImageUrl ? (
          <img 
            src={cowImageUrl} 
            alt="Cow Anatomy" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <svg width="800" height="600" viewBox="0 0 800 600">
            {/* Cow silhouette placeholder */}
            <defs>
              <radialGradient id="cowGradient">
                <stop offset="0%" stopColor="#2a2a2a" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.6"/>
              </radialGradient>
            </defs>
            
            {/* Cow body outline */}
            <ellipse cx="400" cy="350" rx="150" ry="100" fill="url(#cowGradient)" opacity="0.3"/>
            
            {/* Cow head */}
            <ellipse cx="320" cy="200" rx="60" ry="50" fill="url(#cowGradient)" opacity="0.3"/>
            
            {/* Cow legs */}
            <rect x="300" y="400" width="20" height="80" fill="url(#cowGradient)" opacity="0.3"/>
            <rect x="340" y="400" width="20" height="80" fill="url(#cowGradient)" opacity="0.3"/>
            <rect x="440" y="400" width="20" height="80" fill="url(#cowGradient)" opacity="0.3"/>
            <rect x="480" y="400" width="20" height="80" fill="url(#cowGradient)" opacity="0.3"/>
            
            {/* Internal organs representation */}
            <ellipse cx="380" cy="350" rx="40" ry="30" fill="#4a5568" opacity="0.2"/> {/* Stomach */}
            <ellipse cx="420" cy="340" rx="35" ry="25" fill="#4a5568" opacity="0.2"/> {/* Another stomach section */}
            <ellipse cx="350" cy="250" rx="30" ry="40" fill="#718096" opacity="0.2"/> {/* Lungs */}
          </svg>
        )}
      </div>

      {/* Animation Overlay */}
      <div className="animation-overlay">
        {/* Water Drinking Animation */}
        {cowStatus.waterDrinking && (
          <>
            <div className="water-drinking"></div>
            <div className="water-drinking" style={{ animationDelay: '0.5s' }}></div>
            <div className="water-drinking" style={{ animationDelay: '1s' }}></div>
          </>
        )}

        {/* Dehydration Risk Animation */}
        {cowStatus.dehydrationRisk && (
          <div className="dehydration-risk"></div>
        )}

        {/* Medicine Injection Animation */}
        {cowStatus.medicineInjection && (
          <div className="medicine-injection"></div>
        )}

        {/* Active Feeding Animation */}
        {cowStatus.activeFeeding && (
          <div className="active-feeding">
            <div className="feeding-particle mouth-particle"></div>
            <div className="feeding-particle stomach-particle-1"></div>
            <div className="feeding-particle stomach-particle-2"></div>
            <div className="feeding-particle stomach-particle-3"></div>
            <div className="feeding-particle stomach-particle-4"></div>
            <div className="feeding-particle stomach-particle-1" style={{ animationDelay: '2.5s' }}></div>
            <div className="feeding-particle stomach-particle-2" style={{ animationDelay: '3s' }}></div>
          </div>
        )}

        {/* Feeding Problem Animation */}
        {cowStatus.feedingProblem && (
          <div className="feeding-problem"></div>
        )}

        {/* Low Feeding Animation */}
        {cowStatus.lowFeeding && (
          <div className="low-feeding"></div>
        )}
      </div>

      {/* Status Indicator */}
      <div className="status-indicator">
        <strong>Cow Status:</strong> {currentStatus}
      </div>

      {/* Control Panel */}
      <div className="control-panel">
        <button 
          className={`control-button ${cowStatus.waterDrinking ? 'active' : ''}`}
          onClick={() => toggleStatus('waterDrinking')}
        >
          Water Drinking
        </button>
        <button 
          className={`control-button ${cowStatus.dehydrationRisk ? 'active' : ''}`}
          onClick={() => toggleStatus('dehydrationRisk')}
        >
          Dehydration Risk
        </button>
        <button 
          className={`control-button ${cowStatus.medicineInjection ? 'active' : ''}`}
          onClick={() => toggleStatus('medicineInjection')}
        >
          Medicine Injection
        </button>
        <button 
          className={`control-button ${cowStatus.activeFeeding ? 'active' : ''}`}
          onClick={() => toggleStatus('activeFeeding')}
        >
          Active Feeding
        </button>
        <button 
          className={`control-button ${cowStatus.feedingProblem ? 'active' : ''}`}
          onClick={() => toggleStatus('feedingProblem')}
        >
          Feeding Problem
        </button>
        <button 
          className={`control-button ${cowStatus.lowFeeding ? 'active' : ''}`}
          onClick={() => toggleStatus('lowFeeding')}
        >
          Low Feeding
        </button>
        <button 
          className="control-button"
          onClick={resetAll}
        >
          Reset All
        </button>
        <button 
          className={`control-button ${isAutoDemo ? 'active' : ''}`}
          onClick={toggleAutoDemo}
        >
          {isAutoDemo ? 'Stop Demo' : 'Start Demo'}
        </button>
      </div>
    </div>
  );
};

export default CowAnimation;
