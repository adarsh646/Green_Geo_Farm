import React, { useState, useRef, useEffect } from 'react';
import './CowAnimation.css';

const ImageUploadCowAnimation = () => {
  const [cowImageUrl, setCowImageUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [positions, setPositions] = useState({
    waterDrinking: { left: 380, top: 180 },
    dehydrationRisk: { left: 310, top: 250 },
    medicineInjection: { left: 520, top: 320 },
    activeFeeding: { left: 360, top: 350 },
    feedingProblem: { left: 350, top: 340 },
    lowFeeding: { left: 430, top: 360 }
  });
  
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
  const [draggedElement, setDraggedElement] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCowImageUrl(e.target.result);
        setIsAutoDemo(false);
        resetAll();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (elementName) => {
    if (!isEditing) return;
    setDraggedElement(elementName);
  };

  const handleMouseMove = (event) => {
    if (!draggedElement || !isEditing) return;
    
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setPositions(prev => ({
      ...prev,
      [draggedElement]: { left: x, top: y }
    }));
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

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

  const exportPositions = () => {
    const positionsJson = JSON.stringify(positions, null, 2);
    const blob = new Blob([positionsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cow-animation-positions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPositions = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedPositions = JSON.parse(e.target.result);
          setPositions(importedPositions);
        } catch (error) {
          alert('Invalid positions file');
        }
      };
      reader.readAsText(file);
    }
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
        <h2 style={{ margin: '0 0 10px 0' }}>Cow Image Animation Setup</h2>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Upload Cow Image
          </button>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '8px 16px',
              background: isEditing ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {isEditing ? 'Stop Editing' : 'Edit Positions'}
          </button>
          
          <button
            onClick={exportPositions}
            disabled={!cowImageUrl}
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: cowImageUrl ? 'pointer' : 'not-allowed',
              opacity: cowImageUrl ? 1 : 0.5
            }}
          >
            Export Positions
          </button>
          
          <input
            type="file"
            accept=".json"
            onChange={importPositions}
            style={{ display: 'none' }}
            id="import-positions"
          />
          <button
            onClick={() => document.getElementById('import-positions').click()}
            style={{
              padding: '8px 16px',
              background: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Import Positions
          </button>
        </div>
        
        {isEditing && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#ffc107' }}>
            Drag the animation elements to position them correctly on your cow image.
          </div>
        )}
      </div>

      <div 
        className="cow-animation-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          position: 'relative', 
          width: '800px', 
          height: '600px', 
          margin: '0 auto',
          cursor: isEditing ? 'crosshair' : 'default'
        }}
      >
        {/* Cow Image Background */}
        <div className="cow-image" style={{ width: '100%', height: '100%' }}>
          {cowImageUrl ? (
            <img 
              src={cowImageUrl} 
              alt="Cow Anatomy" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#666',
              fontSize: '18px',
              border: '2px dashed #333',
              borderRadius: '10px'
            }}>
              Upload a cow image to see animations overlay
            </div>
          )}
        </div>

        {/* Animation Overlay */}
        <div className="animation-overlay" style={{ pointerEvents: 'none' }}>
          {/* Water Drinking Animation */}
          {cowStatus.waterDrinking && (
            <>
              <div 
                className="water-drinking"
                style={{ 
                  left: `${positions.waterDrinking.left}px`, 
                  top: `${positions.waterDrinking.top}px`,
                  pointerEvents: isEditing ? 'auto' : 'none',
                  cursor: isEditing ? 'move' : 'default'
                }}
                onMouseDown={() => handleMouseDown('waterDrinking')}
              />
              <div 
                className="water-drinking" 
                style={{ 
                  left: `${positions.waterDrinking.left}px`, 
                  top: `${positions.waterDrinking.top}px`,
                  animationDelay: '0.5s',
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="water-drinking" 
                style={{ 
                  left: `${positions.waterDrinking.left}px`, 
                  top: `${positions.waterDrinking.top}px`,
                  animationDelay: '1s',
                  pointerEvents: 'none'
                }}
              />
            </>
          )}

          {/* Dehydration Risk Animation */}
          {cowStatus.dehydrationRisk && (
            <div 
              className="dehydration-risk"
              style={{ 
                left: `${positions.dehydrationRisk.left}px`, 
                top: `${positions.dehydrationRisk.top}px`,
                pointerEvents: isEditing ? 'auto' : 'none',
                cursor: isEditing ? 'move' : 'default'
              }}
              onMouseDown={() => handleMouseDown('dehydrationRisk')}
            />
          )}

          {/* Medicine Injection Animation */}
          {cowStatus.medicineInjection && (
            <div 
              className="medicine-injection"
              style={{ 
                left: `${positions.medicineInjection.left}px`, 
                top: `${positions.medicineInjection.top}px`,
                pointerEvents: isEditing ? 'auto' : 'none',
                cursor: isEditing ? 'move' : 'default'
              }}
              onMouseDown={() => handleMouseDown('medicineInjection')}
            />
          )}

          {/* Active Feeding Animation */}
          {cowStatus.activeFeeding && (
            <div className="active-feeding">
              <div 
                className="feeding-particle mouth-particle"
                style={{ 
                  left: `${positions.activeFeeding.left - 20}px`, 
                  top: `${positions.activeFeeding.top - 190}px`,
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="feeding-particle stomach-particle-1"
                style={{ 
                  left: `${positions.activeFeeding.left}px`, 
                  top: `${positions.activeFeeding.top}px`,
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="feeding-particle stomach-particle-2"
                style={{ 
                  left: `${positions.activeFeeding.left + 20}px`, 
                  top: `${positions.activeFeeding.top + 20}px`,
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="feeding-particle stomach-particle-3"
                style={{ 
                  left: `${positions.activeFeeding.left + 40}px`, 
                  top: `${positions.activeFeeding.top}px`,
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="feeding-particle stomach-particle-4"
                style={{ 
                  left: `${positions.activeFeeding.left + 60}px`, 
                  top: `${positions.activeFeeding.top + 20}px`,
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="feeding-particle stomach-particle-1" 
                style={{ 
                  left: `${positions.activeFeeding.left}px`, 
                  top: `${positions.activeFeeding.top}px`,
                  animationDelay: '2.5s',
                  pointerEvents: 'none'
                }}
              />
              <div 
                className="feeding-particle stomach-particle-2" 
                style={{ 
                  left: `${positions.activeFeeding.left + 20}px`, 
                  top: `${positions.activeFeeding.top + 20}px`,
                  animationDelay: '3s',
                  pointerEvents: 'none'
                }}
              />
            </div>
          )}

          {/* Feeding Problem Animation */}
          {cowStatus.feedingProblem && (
            <div 
              className="feeding-problem"
              style={{ 
                left: `${positions.feedingProblem.left}px`, 
                top: `${positions.feedingProblem.top}px`,
                pointerEvents: isEditing ? 'auto' : 'none',
                cursor: isEditing ? 'move' : 'default'
              }}
              onMouseDown={() => handleMouseDown('feedingProblem')}
            />
          )}

          {/* Low Feeding Animation */}
          {cowStatus.lowFeeding && (
            <div 
              className="low-feeding"
              style={{ 
                left: `${positions.lowFeeding.left}px`, 
                top: `${positions.lowFeeding.top}px`,
                pointerEvents: isEditing ? 'auto' : 'none',
                cursor: isEditing ? 'move' : 'default'
              }}
              onMouseDown={() => handleMouseDown('lowFeeding')}
            />
          )}
        </div>

        {/* Position indicators in edit mode */}
        {isEditing && cowImageUrl && (
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            left: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            padding: '10px', 
            borderRadius: '5px',
            color: 'white',
            fontSize: '12px',
            zIndex: 10
          }}>
            <div>Water Drinking: ({positions.waterDrinking.left}, {positions.waterDrinking.top})</div>
            <div>Dehydration: ({positions.dehydrationRisk.left}, {positions.dehydrationRisk.top})</div>
            <div>Injection: ({positions.medicineInjection.left}, {positions.medicineInjection.top})</div>
            <div>Active Feeding: ({positions.activeFeeding.left}, {positions.activeFeeding.top})</div>
            <div>Feeding Problem: ({positions.feedingProblem.left}, {positions.feedingProblem.top})</div>
            <div>Low Feeding: ({positions.lowFeeding.left}, {positions.lowFeeding.top})</div>
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
          <button 
            className={`control-button ${isAutoDemo ? 'active' : ''}`}
            onClick={() => setIsAutoDemo(!isAutoDemo)}
          >
            {isAutoDemo ? 'Stop Demo' : 'Start Demo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadCowAnimation;
