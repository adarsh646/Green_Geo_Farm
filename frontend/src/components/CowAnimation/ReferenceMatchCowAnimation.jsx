import React, { useEffect, useMemo, useRef, useState } from 'react';
import './ReferenceMatchCowAnimation.css';

const BASE_WIDTH = 1328;
const BASE_HEIGHT = 1022;

const HEALTH_FLAGS = {
  waterDrinking: false,
  dehydrationRisk: false,
  medicineInjection: false,
  activeFeeding: false,
  feedingProblem: false,
  lowFeeding: false
};

const STATUS_LABELS = {
  waterDrinking: 'Water Drinking',
  dehydrationRisk: 'Dehydration Risk',
  medicineInjection: 'Medicine Administered',
  activeFeeding: 'Active Feeding',
  feedingProblem: 'No Feeding / Feeding Problem',
  lowFeeding: 'Low Feeding / Monitor Feeding'
};

const WATER_PATH = [
  { x: 188, y: 486 },
  { x: 214, y: 468 },
  { x: 244, y: 453 },
  { x: 272, y: 440 },
  { x: 304, y: 435 },
  { x: 342, y: 449 },
  { x: 386, y: 472 },
  { x: 428, y: 494 },
  { x: 472, y: 519 },
  { x: 514, y: 546 }
];
const FEED_PATH = [
  { x: 188, y: 486 },
  { x: 214, y: 468 },
  { x: 244, y: 453 },
  { x: 272, y: 440 },
  { x: 304, y: 435 },
  { x: 342, y: 449 },
  { x: 386, y: 472 },
  { x: 428, y: 494 },
  { x: 472, y: 519 },
  { x: 514, y: 546 },
  { x: 556, y: 564 },
  { x: 596, y: 581 },
  { x: 633, y: 594 }
];

const LOW_POINTS = [
  { x: 642, y: 590, r: 6 },
  { x: 664, y: 568, r: 5 },
  { x: 692, y: 582, r: 4 },
  { x: 704, y: 606, r: 5 },
  { x: 674, y: 620, r: 4 }
];

const DEHYDRATION = { x: 774, y: 468, r: 138 };
const INJECTION = { x: 1114, y: 380, r: 42 };
const FEEDING_PROBLEM = { x: 582, y: 570, r: 82 };
const LOW_FEEDING = { x: 670, y: 600, r: 74 };

const DEMO_SEQUENCE = [
  { status: 'Water Drinking', flags: { waterDrinking: true }, duration: 3200 },
  { status: 'Active Feeding', flags: { activeFeeding: true }, duration: 3200 },
  { status: 'Dehydration Risk', flags: { dehydrationRisk: true }, duration: 3200 },
  { status: 'Medicine Administered', flags: { medicineInjection: true }, duration: 3200 },
  { status: 'No Feeding / Feeding Problem', flags: { feedingProblem: true }, duration: 3200 },
  { status: 'Low Feeding / Monitor Feeding', flags: { lowFeeding: true }, duration: 3200 },
  {
    status: 'Combined Alert',
    flags: { waterDrinking: true, dehydrationRisk: true, lowFeeding: true },
    duration: 3600
  },
  { status: 'Normal', flags: {}, duration: 2600 }
];

const buildPath = (points) => {
  const [start, ...rest] = points;
  if (!start || !rest.length) return '';

  return rest.reduce((path, point, index) => {
    if (index === 0) {
      return `${path} Q ${(start.x + point.x) / 2} ${(start.y + point.y) / 2} ${point.x} ${point.y}`;
    }

    const previous = rest[index - 1];
    const cx = (previous.x + point.x) / 2;
    const cy = (previous.y + point.y) / 2;
    return `${path} T ${cx} ${cy} T ${point.x} ${point.y}`;
  }, `M ${start.x} ${start.y}`);
};

const ReferenceMatchCowAnimation = () => {
  const [flags, setFlags] = useState(HEALTH_FLAGS);
  const [currentStatus, setCurrentStatus] = useState('Normal');
  const [isAutoDemo, setIsAutoDemo] = useState(true);
  const [isStatusDragEnabled, setIsStatusDragEnabled] = useState(false);
  const [isDraggingStatus, setIsDraggingStatus] = useState(false);
  const [statusPosition, setStatusPosition] = useState({ x: 16, y: 16 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);
  const statusChipRef = useRef(null);

  const waterPathD = useMemo(() => buildPath(WATER_PATH), []);
  const feedPathD = useMemo(() => buildPath(FEED_PATH), []);

  useEffect(() => {
    if (!isAutoDemo) return undefined;

    let timeoutId;
    let index = 0;

    const runStep = () => {
      const step = DEMO_SEQUENCE[index];
      setFlags({ ...HEALTH_FLAGS, ...step.flags });
      setCurrentStatus(step.status);

      index = (index + 1) % DEMO_SEQUENCE.length;
      timeoutId = window.setTimeout(runStep, step.duration);
    };

    runStep();

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isAutoDemo]);

  const toggleFlag = (name) => {
    setFlags((prev) => {
      const next = {
        ...prev,
        [name]: !prev[name]
      };

      const active = Object.entries(next)
        .filter(([, value]) => value)
        .map(([key]) => STATUS_LABELS[key]);

      setCurrentStatus(active.length ? active.join(' + ') : 'Normal');
      return next;
    });

    if (isAutoDemo) {
      setIsAutoDemo(false);
    }
  };

  const resetAll = () => {
    setFlags(HEALTH_FLAGS);
    setCurrentStatus('Normal');
  };

  useEffect(() => {
    if (!isDraggingStatus) return undefined;

    const handleMouseMove = (event) => {
      if (!canvasRef.current || !statusChipRef.current) return;

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const chipRect = statusChipRef.current.getBoundingClientRect();
      const padding = 8;
      const maxX = Math.max(padding, canvasRect.width - chipRect.width - padding);
      const maxY = Math.max(padding, canvasRect.height - chipRect.height - padding);

      const nextX = event.clientX - canvasRect.left - dragOffset.x;
      const nextY = event.clientY - canvasRect.top - dragOffset.y;

      setStatusPosition({
        x: Math.min(Math.max(padding, nextX), maxX),
        y: Math.min(Math.max(padding, nextY), maxY)
      });
    };

    const handleMouseUp = () => {
      setIsDraggingStatus(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragOffset.x, dragOffset.y, isDraggingStatus]);

  const handleStatusMouseDown = (event) => {
    if (!isStatusDragEnabled || !statusChipRef.current) return;

    const chipRect = statusChipRef.current.getBoundingClientRect();
    setDragOffset({
      x: event.clientX - chipRect.left,
      y: event.clientY - chipRect.top
    });
    setIsDraggingStatus(true);
    event.preventDefault();
  };

  return (
    <div className="reference-page">
      <div className="reference-toolbar">
        <h2>Reference-Matched Cow Health Overlay</h2>
        <p>Animation geometry aligned to your provided veterinary reference layout.</p>
        <button
          type="button"
          className="reference-demo-toggle"
          onClick={() => setIsAutoDemo((value) => !value)}
        >
          {isAutoDemo ? 'Stop Auto Demo' : 'Start Auto Demo'}
        </button>
        <button
          type="button"
          className="reference-demo-toggle"
          onClick={() => {
            setIsStatusDragEnabled((value) => !value);
            setIsDraggingStatus(false);
          }}
        >
          {isStatusDragEnabled ? 'Fix Status Position' : 'Enable Status Drag'}
        </button>
      </div>

      <div className="reference-canvas-shell">
        <div className="reference-canvas" ref={canvasRef}>
          <svg
            className="reference-image"
            viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
            aria-hidden="true"
          >
            <g
              fill="rgba(255, 255, 255, 0.16)"
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="8"
              strokeLinejoin="round"
            >
              <ellipse cx="520" cy="580" rx="360" ry="220" />
              <ellipse cx="300" cy="370" rx="150" ry="120" />
              <rect x="300" y="740" width="48" height="180" rx="18" />
              <rect x="380" y="740" width="48" height="180" rx="18" />
              <rect x="560" y="740" width="48" height="180" rx="18" />
              <rect x="640" y="740" width="48" height="180" rx="18" />
            </g>
          </svg>

          <svg
            className="reference-overlay"
            viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8ee9ff" />
                <stop offset="60%" stopColor="#1aa2ff" />
                <stop offset="100%" stopColor="#5fe0ff" />
              </linearGradient>
              <filter id="waterGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <radialGradient id="dehydrationFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(129,214,255,0.5)" />
                <stop offset="60%" stopColor="rgba(112,186,255,0.28)" />
                <stop offset="100%" stopColor="rgba(70,145,255,0.06)" />
              </radialGradient>

              <radialGradient id="injPulseFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(103,215,255,0.95)" />
                <stop offset="100%" stopColor="rgba(29,101,255,0.18)" />
              </radialGradient>
            </defs>

            {flags.waterDrinking && (
              <g className="water-layer">
                <path d={waterPathD} className="water-internal-track" />
                <path d={waterPathD} className="water-main-flow" />
                <path d={waterPathD} className="water-secondary-flow" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <circle key={`water-particle-${i}`} r="4" className="water-particle">
                    <animateMotion
                      dur="2.4s"
                      repeatCount="indefinite"
                      begin={`${i * 0.24}s`}
                      path={waterPathD}
                    />
                  </circle>
                ))}
              </g>
            )}

            {flags.activeFeeding && (
              <g className="feeding-layer">
                <path d={feedPathD} className="feed-internal-track" />
                <path d={feedPathD} className="feed-main-flow" />
                {Array.from({ length: 9 }).map((_, i) => (
                  <circle key={`feed-flow-${i}`} r="4" className="feed-flow-particle">
                    <animateMotion
                      dur="2.9s"
                      repeatCount="indefinite"
                      begin={`${i * 0.2}s`}
                      path={feedPathD}
                    />
                  </circle>
                ))}
              </g>
            )}

            {flags.dehydrationRisk && (
              <g className="dehydration-layer">
                <circle cx={DEHYDRATION.x} cy={DEHYDRATION.y} r={DEHYDRATION.r} className="dehydration-dome" />
                <circle
                  cx={DEHYDRATION.x}
                  cy={DEHYDRATION.y}
                  r={DEHYDRATION.r - 20}
                  className="dehydration-inner-ring"
                />
              </g>
            )}

            {flags.medicineInjection && (
              <g className="injection-layer">
                <circle cx={INJECTION.x} cy={INJECTION.y} r={INJECTION.r} className="injection-core" />
                <circle cx={INJECTION.x} cy={INJECTION.y} r="9" className="injection-center-dot" />

                <g className="injection-icon" transform={`translate(${INJECTION.x + 38} ${INJECTION.y - 6}) rotate(24)`}>
                  <image
                    href="/medical.png"
                    x="-30"
                    y="-30"
                    width="60"
                    height="60"
                    preserveAspectRatio="xMidYMid meet"
                    className="injection-icon-image"
                  />
                </g>
              </g>
            )}

            {flags.feedingProblem && (
              <g className="problem-layer">
                <circle
                  cx={FEEDING_PROBLEM.x}
                  cy={FEEDING_PROBLEM.y}
                  r={FEEDING_PROBLEM.r}
                  className="feeding-problem-ring"
                />
              </g>
            )}

            {flags.lowFeeding && (
              <g className="low-layer">
                <circle cx={LOW_FEEDING.x} cy={LOW_FEEDING.y} r={LOW_FEEDING.r} className="low-feeding-ring" />
                {LOW_POINTS.map((point, i) => (
                  <circle
                    key={`low-dot-${point.x}-${point.y}`}
                    cx={point.x}
                    cy={point.y}
                    r={point.r}
                    className="low-dot"
                    style={{ animationDelay: `${i * 0.18}s` }}
                  />
                ))}
              </g>
            )}

          </svg>

          <div
            ref={statusChipRef}
            className={`reference-status-chip ${isStatusDragEnabled ? 'draggable' : ''}`}
            onMouseDown={handleStatusMouseDown}
            style={{ left: `${statusPosition.x}px`, top: `${statusPosition.y}px` }}
          >
            <strong>Status:</strong> {currentStatus}
          </div>

        </div>

        <div className="reference-controls">
          {Object.keys(STATUS_LABELS).map((key) => (
            <button
              key={key}
              type="button"
              className={`reference-control-btn ${flags[key] ? 'active' : ''}`}
              onClick={() => toggleFlag(key)}
            >
              {STATUS_LABELS[key]}
            </button>
          ))}
          <button type="button" className="reference-control-btn" onClick={resetAll}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReferenceMatchCowAnimation;
