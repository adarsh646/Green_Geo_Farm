import React, { useState, useEffect, useRef } from 'react';
import './VeterinaryCowAnimation.css';

const VeterinaryCowAnimation = () => {
  const [healthStatus, setHealthStatus] = useState({
    waterDrinking: false,
    activeFeeding: false,
    noFeedingAlert: false,
    lowFeeding: false,
    dehydrationRisk: false,
    medicineAdministered: false
  });

  const [isAutoDemo, setIsAutoDemo] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('Normal');

  // Anatomical positioning using percentage-based coordinates
  const anatomicalPositions = {
    waterDrinking: {
      path: [
        { x: 35, y: 25 },  // Mouth
        { x: 37, y: 30 },  // Throat start
        { x: 40, y: 35 },  // Throat middle
        { x: 42, y: 42 },  // Esophagus
        { x: 45, y: 48 },  // Chest entrance
        { x: 48, y: 55 }   // Stomach entrance
      ],
      anatomicalNote: "Mouth to throat to esophagus path"
    },
    activeFeeding: {
      mouth: { x: 35, y: 25 },
      jaw: { x: 38, y: 28 },
      anatomicalNote: "Mouth and jaw area"
    },
    noFeedingAlert: {
      center: { x: 42, y: 52 },
      radius: 8,
      anatomicalNote: "Front stomach (rumen area under front ribs)"
    },
    lowFeeding: {
      center: { x: 50, y: 55 },
      radius: 7,
      anatomicalNote: "Mid stomach digestive chambers"
    },
    dehydrationRisk: {
      center: { x: 45, y: 40 },
      radius: 12,
      anatomicalNote: "Center rib cage"
    },
    medicineAdministered: {
      center: { x: 65, y: 60 },
      radius: 6,
      anatomicalNote: "Upper rear thigh muscle"
    }
  };

  // Auto-demo mode
  useEffect(() => {
    if (isAutoDemo) {
      const demoSequence = [
        { status: 'Water Drinking', config: { waterDrinking: true }, duration: 4000 },
        { status: 'Active Feeding', config: { activeFeeding: true }, duration: 4000 },
        { status: 'Dehydration Risk', config: { dehydrationRisk: true }, duration: 4000 },
        { status: 'Medicine Administered', config: { medicineAdministered: true }, duration: 4000 },
        { status: 'No Feeding Alert', config: { noFeedingAlert: true }, duration: 4000 },
        { status: 'Low Feeding', config: { lowFeeding: true }, duration: 4000 },
        { status: 'Normal', config: {}, duration: 3000 }
      ];

      let currentIndex = 0;
      
      const runDemo = () => {
        const currentDemo = demoSequence[currentIndex];
        setHealthStatus(currentDemo.config);
        setCurrentStatus(currentDemo.status);
        currentIndex = (currentIndex + 1) % demoSequence.length;
      };

      const interval = setInterval(runDemo, demoSequence[0].duration);
      runDemo();

      return () => clearInterval(interval);
    }
  }, [isAutoDemo]);

  const toggleHealthIndicator = (indicator) => {
    const newStatus = {
      ...healthStatus,
      [indicator]: !healthStatus[indicator]
    };
    setHealthStatus(newStatus);
    
    const activeIndicators = Object.entries(newStatus)
      .filter(([key, value]) => value)
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

    if (activeIndicators.length === 0) {
      setCurrentStatus('Normal');
    } else {
      setCurrentStatus(activeIndicators.join(', '));
    }
    
    if (isAutoDemo) {
      setIsAutoDemo(false);
    }
  };

  const resetAll = () => {
    setHealthStatus({
      waterDrinking: false,
      activeFeeding: false,
      noFeedingAlert: false,
      lowFeeding: false,
      dehydrationRisk: false,
      medicineAdministered: false
    });
    setCurrentStatus('Normal');
  };

  return (
    <div className="veterinary-dashboard">
      <div className="dashboard-header">
        <h1>Veterinary Health Animation System</h1>
        <p>Professional Cow Health Monitoring Dashboard</p>
        <div className="demo-controls">
          <button
            onClick={() => setIsAutoDemo(!isAutoDemo)}
            className={`demo-button ${isAutoDemo ? 'active' : ''}`}
          >
            {isAutoDemo ? 'Stop Demo' : 'Start Demo'}
          </button>
        </div>
      </div>

      <div className="animation-container">
        {/* Layer 1: Base cow anatomy */}
        <div className="layer layer-1">
          <svg viewBox="0 0 100 100" className="cow-anatomy">
            {/* Cow body outline */}
            <path
              d="M 25 20 Q 30 15, 35 20 L 40 18 L 45 20 L 50 22 L 55 25 L 60 30 L 65 35 L 70 40 L 72 50 L 70 60 L 65 65 L 60 68 L 55 70 L 50 72 L 45 70 L 40 68 L 35 65 L 30 60 L 28 50 L 30 40 L 32 30 Z"
              fill="#f5f5f5"
              stroke="#333"
              strokeWidth="0.5"
            />
            
            {/* Head */}
            <ellipse cx="35" cy="25" rx="8" ry="6" fill="#f5f5f5" stroke="#333" strokeWidth="0.5" />
            
            {/* Legs */}
            <rect x="30" y="65" width="3" height="15" fill="#f5f5f5" stroke="#333" strokeWidth="0.5" />
            <rect x="40" y="65" width="3" height="15" fill="#f5f5f5" stroke="#333" strokeWidth="0.5" />
            <rect x="50" y="65" width="3" height="15" fill="#f5f5f5" stroke="#333" strokeWidth="0.5" />
            <rect x="60" y="65" width="3" height="15" fill="#f5f5f5" stroke="#333" strokeWidth="0.5" />
            
            {/* Tail */}
            <path d="M 70 40 Q 75 35, 80 40 L 78 45 Q 75 48, 72 45 Z" fill="#f5f5f5" stroke="#333" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Layer 2: Organ highlight zones */}
        <div className="layer layer-2">
          <svg viewBox="0 0 100 100" className="organ-zones">
            {/* Stomach chambers */}
            <ellipse cx="42" cy="52" rx="8" ry="6" fill="rgba(255,0,0,0.1)" className="organ-zone" />
            <ellipse cx="50" cy="55" rx="7" ry="5" fill="rgba(255,255,0,0.1)" className="organ-zone" />
            
            {/* Rib cage area */}
            <ellipse cx="45" cy="40" rx="12" ry="8" fill="rgba(0,0,255,0.1)" className="organ-zone" />
            
            {/* Thigh muscle */}
            <ellipse cx="65" cy="60" rx="6" ry="8" fill="rgba(0,0,255,0.1)" className="organ-zone" />
          </svg>
        </div>

        {/* Layer 3: Animation effects */}
        <div className="layer layer-3">
          <svg viewBox="0 0 100 100" className="animation-effects">
            {/* 1. WATER DRINKING - Blue flowing particles */}
            {healthStatus.waterDrinking && (
              <g className="water-drinking-animation">
                <defs>
                  <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00bfff" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#0080ff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#00bfff" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="waterGlow">
                    <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Flow path */}
                <path
                  d={`M ${anatomicalPositions.waterDrinking.path[0].x} ${anatomicalPositions.waterDrinking.path[0].y} 
                      Q ${anatomicalPositions.waterDrinking.path[1].x} ${anatomicalPositions.waterDrinking.path[1].y}
                      T ${anatomicalPositions.waterDrinking.path[2].x} ${anatomicalPositions.waterDrinking.path[2].y}
                      Q ${anatomicalPositions.waterDrinking.path[3].x} ${anatomicalPositions.waterDrinking.path[3].y}
                      T ${anatomicalPositions.waterDrinking.path[4].x} ${anatomicalPositions.waterDrinking.path[4].y}
                      L ${anatomicalPositions.waterDrinking.path[5].x} ${anatomicalPositions.waterDrinking.path[5].y}`}
                  stroke="url(#waterGradient)"
                  strokeWidth="1.5"
                  fill="none"
                  filter="url(#waterGlow)"
                  className="water-flow-path"
                />
                
                {/* Water particles */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <circle
                    key={`water-particle-${i}`}
                    r="0.8"
                    fill="#00bfff"
                    filter="url(#waterGlow)"
                    className="water-particle"
                  >
                    <animateMotion
                      dur="3s"
                      repeatCount="indefinite"
                      begin={`${i * 0.6}s`}
                      path={`M ${anatomicalPositions.waterDrinking.path[0].x} ${anatomicalPositions.waterDrinking.path[0].y} 
                          Q ${anatomicalPositions.waterDrinking.path[1].x} ${anatomicalPositions.waterDrinking.path[1].y}
                          T ${anatomicalPositions.waterDrinking.path[2].x} ${anatomicalPositions.waterDrinking.path[2].y}
                          Q ${anatomicalPositions.waterDrinking.path[3].x} ${anatomicalPositions.waterDrinking.path[3].y}
                          T ${anatomicalPositions.waterDrinking.path[4].x} ${anatomicalPositions.waterDrinking.path[4].y}
                          L ${anatomicalPositions.waterDrinking.path[5].x} ${anatomicalPositions.waterDrinking.path[5].y}`}
                    />
                  </circle>
                ))}
              </g>
            )}

            {/* 2. ACTIVE FEEDING - Green particle emission */}
            {healthStatus.activeFeeding && (
              <g className="active-feeding-animation">
                <defs>
                  <radialGradient id="feedingGradient">
                    <stop offset="0%" stopColor="#00ff00" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#00aa00" stopOpacity="0.3" />
                  </radialGradient>
                  <filter id="feedingGlow">
                    <feGaussianBlur stdDeviation="0.2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Mouth entry indicator */}
                <circle
                  cx={anatomicalPositions.activeFeeding.mouth.x}
                  cy={anatomicalPositions.activeFeeding.mouth.y}
                  r="2"
                  fill="url(#feedingGradient)"
                  filter="url(#feedingGlow)"
                  className="mouth-entry-glow"
                />
                
                {/* Burst particles */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <circle
                    key={`feeding-particle-${i}`}
                    r="0.6"
                    fill="#00ff00"
                    filter="url(#feedingGlow)"
                    className="feeding-burst-particle"
                    style={{
                      animationDelay: `${i * 0.2}s`
                    }}
                  >
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      begin={`${i * 0.3}s`}
                      path={`M ${anatomicalPositions.activeFeeding.mouth.x} ${anatomicalPositions.activeFeeding.mouth.y} 
                          L ${anatomicalPositions.activeFeeding.mouth.x + 2} ${anatomicalPositions.activeFeeding.mouth.y - 1}`}
                    />
                  </circle>
                ))}
              </g>
            )}

            {/* 3. NO FEEDING ALERT - Red warning pulse */}
            {healthStatus.noFeedingAlert && (
              <g className="no-feeding-alert-animation">
                <defs>
                  <radialGradient id="alertGradient">
                    <stop offset="0%" stopColor="#ff0000" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ff0000" stopOpacity="0.1" />
                  </radialGradient>
                  <filter id="alertGlow">
                    <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Warning pulse circle */}
                <circle
                  cx={anatomicalPositions.noFeedingAlert.center.x}
                  cy={anatomicalPositions.noFeedingAlert.center.y}
                  r={anatomicalPositions.noFeedingAlert.radius}
                  fill="url(#alertGradient)"
                  filter="url(#alertGlow)"
                  className="warning-pulse-circle"
                />
              </g>
            )}

            {/* 4. LOW FEEDING - Yellow soft pulse */}
            {healthStatus.lowFeeding && (
              <g className="low-feeding-animation">
                <defs>
                  <radialGradient id="lowFeedingGradient">
                    <stop offset="0%" stopColor="#ffff00" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#ffff00" stopOpacity="0.1" />
                  </radialGradient>
                  <filter id="lowFeedingGlow">
                    <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Soft pulse circle */}
                <circle
                  cx={anatomicalPositions.lowFeeding.center.x}
                  cy={anatomicalPositions.lowFeeding.center.y}
                  r={anatomicalPositions.lowFeeding.radius}
                  fill="url(#lowFeedingGradient)"
                  filter="url(#lowFeedingGlow)"
                  className="low-feeding-pulse"
                />
                
                {/* Slow floating particles */}
                {[0, 1, 2].map((i) => (
                  <circle
                    key={`low-particle-${i}`}
                    r="0.5"
                    fill="#ffff00"
                    opacity="0.6"
                    className="low-feeding-particle"
                    style={{
                      animationDelay: `${i * 0.5}s`
                    }}
                  >
                    <animateMotion
                      dur="4s"
                      repeatCount="indefinite"
                      begin={`${i * 0.7}s`}
                      values={`M ${anatomicalPositions.lowFeeding.center.x - 1} ${anatomicalPositions.lowFeeding.center.y};
                              M ${anatomicalPositions.lowFeeding.center.x + 1} ${anatomicalPositions.lowFeeding.center.y - 1};
                              M ${anatomicalPositions.lowFeeding.center.x - 1} ${anatomicalPositions.lowFeeding.center.y + 1};
                              M ${anatomicalPositions.lowFeeding.center.x} ${anatomicalPositions.lowFeeding.center.y}`}
                    />
                  </circle>
                ))}
              </g>
            )}

            {/* 5. DEHYDRATION RISK - Blue breathing circle */}
            {healthStatus.dehydrationRisk && (
              <g className="dehydration-risk-animation">
                <defs>
                  <radialGradient id="dehydrationGradient">
                    <stop offset="0%" stopColor="#0080ff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0080ff" stopOpacity="0.1" />
                  </radialGradient>
                  <filter id="dehydrationGlow">
                    <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Large breathing circle */}
                <circle
                  cx={anatomicalPositions.dehydrationRisk.center.x}
                  cy={anatomicalPositions.dehydrationRisk.center.y}
                  r={anatomicalPositions.dehydrationRisk.radius}
                  fill="url(#dehydrationGradient)"
                  filter="url(#dehydrationGlow)"
                  className="dehydration-breathing-circle"
                />
              </g>
            )}

            {/* 6. MEDICINE ADMINISTERED - Radial pulse rings */}
            {healthStatus.medicineAdministered && (
              <g className="medicine-administered-animation">
                <defs>
                  <radialGradient id="medicineGradient">
                    <stop offset="0%" stopColor="#0080ff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0080ff" stopOpacity="0.2" />
                  </radialGradient>
                  <filter id="medicineGlow">
                    <feGaussianBlur stdDeviation="0.4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Center glow point */}
                <circle
                  cx={anatomicalPositions.medicineAdministered.center.x}
                  cy={anatomicalPositions.medicineAdministered.center.y}
                  r="1"
                  fill="url(#medicineGradient)"
                  filter="url(#medicineGlow)"
                  className="medicine-center-glow"
                />
                
                {/* Expanding shockwave circles */}
                {[0, 1, 2].map((i) => (
                  <circle
                    key={`medicine-ring-${i}`}
                    cx={anatomicalPositions.medicineAdministered.center.x}
                    cy={anatomicalPositions.medicineAdministered.center.y}
                    r="2"
                    fill="none"
                    stroke="#0080ff"
                    strokeWidth="0.5"
                    opacity="0.8"
                    className="medicine-shockwave-ring"
                    style={{
                      animationDelay: `${i * 1}s`
                    }}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>

        {/* Layer 4: Labels */}
        <div className="layer layer-4">
          <div className="status-display">
            <strong>Current Status:</strong> {currentStatus}
          </div>
        </div>
      </div>

      <div className="control-panel">
        <h3>Health Indicators</h3>
        <div className="indicator-controls">
          <button
            className={`indicator-button ${healthStatus.waterDrinking ? 'active' : ''}`}
            onClick={() => toggleHealthIndicator('waterDrinking')}
          >
            Water Drinking
          </button>
          <button
            className={`indicator-button ${healthStatus.activeFeeding ? 'active' : ''}`}
            onClick={() => toggleHealthIndicator('activeFeeding')}
          >
            Active Feeding
          </button>
          <button
            className={`indicator-button ${healthStatus.noFeedingAlert ? 'active' : ''}`}
            onClick={() => toggleHealthIndicator('noFeedingAlert')}
          >
            No Feeding Alert
          </button>
          <button
            className={`indicator-button ${healthStatus.lowFeeding ? 'active' : ''}`}
            onClick={() => toggleHealthIndicator('lowFeeding')}
          >
            Low Feeding
          </button>
          <button
            className={`indicator-button ${healthStatus.dehydrationRisk ? 'active' : ''}`}
            onClick={() => toggleHealthIndicator('dehydrationRisk')}
          >
            Dehydration Risk
          </button>
          <button
            className={`indicator-button ${healthStatus.medicineAdministered ? 'active' : ''}`}
            onClick={() => toggleHealthIndicator('medicineAdministered')}
          >
            Medicine Administered
          </button>
          <button
            className="reset-button"
            onClick={resetAll}
          >
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
};

export default VeterinaryCowAnimation;
