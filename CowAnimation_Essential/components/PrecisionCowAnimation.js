import React, { useState, useEffect } from 'react';
import './CowAnimation.css';

const PrecisionCowAnimation = () => {
  const [cowStatus, setCowStatus] = useState({
    waterDrinking: false,
    dehydrationRisk: false,
    medicineInjection: false,
    activeFeeding: false,
    feedingProblem: false,
    lowFeeding: false
  });

  const [currentStatus, setCurrentStatus] = useState('Normal');
  const [isAutoDemo, setIsAutoDemo] = useState(true);
  const [showPositionGuides, setShowPositionGuides] = useState(false);

  // Precision positioning based on exact cow anatomy analysis
  const precisionPositions = {
    waterDrinking: {
      left: 122,
      top: 239,
      width: 8,
      height: 214,
      rotation: 72,
      labelLeft: 178,
      labelTop: 206,
      anatomicalNote: "Mouth-to-esophagus-to-stomach route"
    },
    dehydrationRisk: {
      left: 372,
      top: 176,
      width: 178,
      height: 156,
      anatomicalNote: "Central body cavity/rib cage area"
    },
    medicineInjection: {
      left: 650,
      top: 180,
      width: 56,
      height: 56,
      anatomicalNote: "Neck/shoulder injection site"
    },
    activeFeeding: {
      mouth: { left: 121, top: 236 },
      tract: { left: 121, top: 236, width: 9, height: 304, rotation: 70 },
      stomach1: { left: 334, top: 331 },
      stomach2: { left: 359, top: 341 },
      stomach3: { left: 381, top: 349 },
      stomach4: { left: 347, top: 358 },
      anatomicalNote: "Mouth and multi-chamber stomach"
    },
    feedingProblem: {
      left: 318,
      top: 310,
      width: 92,
      height: 92,
      anatomicalNote: "Primary stomach chamber (rumen)"
    },
    lowFeeding: {
      left: 366,
      top: 332,
      width: 80,
      height: 80,
      anatomicalNote: "Secondary stomach chamber"
    }
  };

  // Auto-demo mode
  useEffect(() => {
    if (isAutoDemo) {
      const demoSequence = [
        { status: 'Water Drinking', config: { waterDrinking: true }, duration: 4000 },
        { status: 'Dehydration Risk', config: { dehydrationRisk: true }, duration: 4000 },
        { status: 'Medicine Administered', config: { medicineInjection: true }, duration: 4000 },
        { status: 'Active Feeding', config: { activeFeeding: true }, duration: 4000 },
        { status: 'Feeding Problem', config: { feedingProblem: true }, duration: 4000 },
        { status: 'Low Feeding', config: { lowFeeding: true }, duration: 4000 },
        { status: 'Normal', config: {}, duration: 3000 }
      ];

      let currentIndex = 0;
      
      const runDemo = () => {
        const currentDemo = demoSequence[currentIndex];
        setCowStatus(currentDemo.config);
        setCurrentStatus(currentDemo.status);
        currentIndex = (currentIndex + 1) % demoSequence.length;
      };

      const interval = setInterval(runDemo, demoSequence[0].duration);
      runDemo();

      return () => clearInterval(interval);
    }
  }, [isAutoDemo]);

  const toggleStatus = (status) => {
    const newStatus = {
      ...cowStatus,
      [status]: !cowStatus[status]
    };
    setCowStatus(newStatus);
    
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

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '20px' }}>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '15px', 
        borderRadius: '10px', 
        marginBottom: '20px',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Precision Cow Animation - Perfectly Aligned</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowPositionGuides(!showPositionGuides)}
            style={{
              padding: '8px 16px',
              background: showPositionGuides ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {showPositionGuides ? 'Hide Guides' : 'Show Position Guides'}
          </button>
          <button
            onClick={() => setIsAutoDemo(!isAutoDemo)}
            style={{
              padding: '8px 16px',
              background: isAutoDemo ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {isAutoDemo ? 'Stop Demo' : 'Start Demo'}
          </button>
        </div>
      </div>

      <div 
        className="cow-animation-container"
        style={{ 
          position: 'relative', 
          width: '800px', 
          height: '600px', 
          margin: '0 auto'
        }}
      >
        {/* Cow Image Background */}
        <div className="cow-image" style={{ width: '100%', height: '100%' }}>
          <img 
            src="/cow-image.png"
            alt="Cow Anatomy" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Position Guides (for alignment verification) */}
        {showPositionGuides && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3
          }}>
            {/* Water Drinking Guide */}
            <div style={{
              position: 'absolute',
              left: precisionPositions.waterDrinking.left,
              top: precisionPositions.waterDrinking.top,
              width: precisionPositions.waterDrinking.width,
              height: precisionPositions.waterDrinking.height,
              border: '2px solid rgba(0, 255, 255, 0.8)',
              transform: `rotate(${precisionPositions.waterDrinking.rotation}deg)`,
              transformOrigin: 'top center',
              pointerEvents: 'none'
            }} />

            {/* Dehydration Risk Guide */}
            <div style={{
              position: 'absolute',
              left: precisionPositions.dehydrationRisk.left,
              top: precisionPositions.dehydrationRisk.top,
              width: precisionPositions.dehydrationRisk.width,
              height: precisionPositions.dehydrationRisk.height,
              border: '2px solid rgba(173, 216, 230, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* Medicine Injection Guide */}
            <div style={{
              position: 'absolute',
              left: precisionPositions.medicineInjection.left,
              top: precisionPositions.medicineInjection.top,
              width: precisionPositions.medicineInjection.width,
              height: precisionPositions.medicineInjection.height,
              border: '2px solid rgba(0, 123, 255, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* Active Feeding Guides */}
            <div style={{
              position: 'absolute',
              left: precisionPositions.activeFeeding.tract.left,
              top: precisionPositions.activeFeeding.tract.top,
              width: precisionPositions.activeFeeding.tract.width,
              height: precisionPositions.activeFeeding.tract.height,
              border: '2px solid rgba(76, 175, 80, 0.8)',
              transform: `rotate(${precisionPositions.activeFeeding.tract.rotation}deg)`,
              transformOrigin: 'top center',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: precisionPositions.activeFeeding.mouth.left,
              top: precisionPositions.activeFeeding.mouth.top,
              width: 8,
              height: 8,
              border: '2px solid rgba(76, 175, 80, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: precisionPositions.activeFeeding.stomach1.left,
              top: precisionPositions.activeFeeding.stomach1.top,
              width: 8,
              height: 8,
              border: '2px solid rgba(76, 175, 80, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: precisionPositions.activeFeeding.stomach2.left,
              top: precisionPositions.activeFeeding.stomach2.top,
              width: 8,
              height: 8,
              border: '2px solid rgba(76, 175, 80, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: precisionPositions.activeFeeding.stomach3.left,
              top: precisionPositions.activeFeeding.stomach3.top,
              width: 8,
              height: 8,
              border: '2px solid rgba(76, 175, 80, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              left: precisionPositions.activeFeeding.stomach4.left,
              top: precisionPositions.activeFeeding.stomach4.top,
              width: 8,
              height: 8,
              border: '2px solid rgba(76, 175, 80, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* Feeding Problem Guide */}
            <div style={{
              position: 'absolute',
              left: precisionPositions.feedingProblem.left,
              top: precisionPositions.feedingProblem.top,
              width: precisionPositions.feedingProblem.width,
              height: precisionPositions.feedingProblem.height,
              border: '2px solid rgba(244, 67, 54, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />

            {/* Low Feeding Guide */}
            <div style={{
              position: 'absolute',
              left: precisionPositions.lowFeeding.left,
              top: precisionPositions.lowFeeding.top,
              width: precisionPositions.lowFeeding.width,
              height: precisionPositions.lowFeeding.height,
              border: '2px solid rgba(255, 193, 7, 0.8)',
              borderRadius: '50%',
              pointerEvents: 'none'
            }} />
          </div>
        )}

        {/* Animation Overlay */}
        <div className="animation-overlay">
          {/* Water Drinking Animation */}
          {cowStatus.waterDrinking && (
            <>
              <div 
                className="water-drinking"
                style={{ 
                  left: `${precisionPositions.waterDrinking.left}px`, 
                  top: `${precisionPositions.waterDrinking.top}px`,
                  width: `${precisionPositions.waterDrinking.width}px`,
                  height: `${precisionPositions.waterDrinking.height}px`,
                  transform: `rotate(${precisionPositions.waterDrinking.rotation}deg)`
                }}
              />
              <div
                className="water-label-internal"
                style={{
                  left: `${precisionPositions.waterDrinking.labelLeft}px`,
                  top: `${precisionPositions.waterDrinking.labelTop}px`
                }}
              >
                Water Drinking
              </div>
              <div 
                className="water-drinking" 
                style={{ 
                  left: `${precisionPositions.waterDrinking.left}px`, 
                  top: `${precisionPositions.waterDrinking.top}px`,
                  width: `${precisionPositions.waterDrinking.width}px`,
                  height: `${precisionPositions.waterDrinking.height}px`,
                  transform: `rotate(${precisionPositions.waterDrinking.rotation}deg)`,
                  animationDelay: '0.5s'
                }}
              />
              <div 
                className="water-drinking" 
                style={{ 
                  left: `${precisionPositions.waterDrinking.left}px`, 
                  top: `${precisionPositions.waterDrinking.top}px`,
                  width: `${precisionPositions.waterDrinking.width}px`,
                  height: `${precisionPositions.waterDrinking.height}px`,
                  transform: `rotate(${precisionPositions.waterDrinking.rotation}deg)`,
                  animationDelay: '1s'
                }}
              />
            </>
          )}

          {/* Dehydration Risk Animation */}
          {cowStatus.dehydrationRisk && (
            <div 
              className="dehydration-risk"
              style={{ 
                left: `${precisionPositions.dehydrationRisk.left}px`, 
                top: `${precisionPositions.dehydrationRisk.top}px`,
                width: `${precisionPositions.dehydrationRisk.width}px`,
                height: `${precisionPositions.dehydrationRisk.height}px`
              }}
            />
          )}

          {/* Medicine Injection Animation */}
          {cowStatus.medicineInjection && (
            <div 
              className="medicine-injection"
              style={{ 
                left: `${precisionPositions.medicineInjection.left}px`, 
                top: `${precisionPositions.medicineInjection.top}px`,
                width: `${precisionPositions.medicineInjection.width}px`,
                height: `${precisionPositions.medicineInjection.height}px`
              }}
            >
              <div className="medicine-syringe-symbol" aria-hidden="true">
                <div className="medicine-syringe-plunger" />
                <div className="medicine-syringe-body" />
                <div className="medicine-syringe-fluid" />
                <div className="medicine-syringe-needle" />
                <div className="medicine-syringe-tip" />
              </div>
            </div>
          )}

          {/* Active Feeding Animation */}
          {cowStatus.activeFeeding && (
            <div className="active-feeding">
              <div
                className="feeding-tract-line"
                style={{
                  left: `${precisionPositions.activeFeeding.tract.left}px`,
                  top: `${precisionPositions.activeFeeding.tract.top}px`,
                  width: `${precisionPositions.activeFeeding.tract.width}px`,
                  height: `${precisionPositions.activeFeeding.tract.height}px`,
                  transform: `rotate(${precisionPositions.activeFeeding.tract.rotation}deg)`
                }}
              />
            </div>
          )}

          {/* Feeding Problem Animation */}
          {cowStatus.feedingProblem && (
            <div 
              className="feeding-problem"
              style={{ 
                left: `${precisionPositions.feedingProblem.left}px`, 
                top: `${precisionPositions.feedingProblem.top}px`,
                width: `${precisionPositions.feedingProblem.width}px`,
                height: `${precisionPositions.feedingProblem.height}px`
              }}
            />
          )}

          {/* Low Feeding Animation */}
          {cowStatus.lowFeeding && (
            <div 
              className="low-feeding"
              style={{ 
                left: `${precisionPositions.lowFeeding.left}px`, 
                top: `${precisionPositions.lowFeeding.top}px`,
                width: `${precisionPositions.lowFeeding.width}px`,
                height: `${precisionPositions.lowFeeding.height}px`
              }}
            />
          )}
        </div>

        {/* Position Information Panel */}
        {showPositionGuides && (
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            background: 'rgba(0,0,0,0.9)', 
            padding: '15px', 
            borderRadius: '10px',
            color: 'white',
            fontSize: '11px',
            zIndex: 10,
            maxWidth: '250px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#00d4ff' }}>Precision Positions</h4>
            <div style={{ marginBottom: '8px' }}>
              <strong>Water Drinking:</strong><br/>
              Esophagus: ({precisionPositions.waterDrinking.left}, {precisionPositions.waterDrinking.top})<br/>
              <small>{precisionPositions.waterDrinking.anatomicalNote}</small>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Dehydration:</strong><br/>
              Body: ({precisionPositions.dehydrationRisk.left}, {precisionPositions.dehydrationRisk.top})<br/>
              <small>{precisionPositions.dehydrationRisk.anatomicalNote}</small>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Injection:</strong><br/>
              Neck: ({precisionPositions.medicineInjection.left}, {precisionPositions.medicineInjection.top})<br/>
              <small>{precisionPositions.medicineInjection.anatomicalNote}</small>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Feeding:</strong><br/>
              Mouth: ({precisionPositions.activeFeeding.mouth.left}, {precisionPositions.activeFeeding.mouth.top})<br/>
              <small>{precisionPositions.activeFeeding.anatomicalNote}</small>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Problem:</strong><br/>
              Stomach: ({precisionPositions.feedingProblem.left}, {precisionPositions.feedingProblem.top})<br/>
              <small>{precisionPositions.feedingProblem.anatomicalNote}</small>
            </div>
            <div>
              <strong>Low Feeding:</strong><br/>
              Monitor: ({precisionPositions.lowFeeding.left}, {precisionPositions.lowFeeding.top})<br/>
              <small>{precisionPositions.lowFeeding.anatomicalNote}</small>
            </div>
          </div>
        )}

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
        </div>
      </div>
    </div>
  );
};

export default PrecisionCowAnimation;
