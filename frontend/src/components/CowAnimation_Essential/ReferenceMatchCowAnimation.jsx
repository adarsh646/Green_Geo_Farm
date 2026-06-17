import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CAMERA_CONFIG } from '../../config/cameraConfig';
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

/* ── Anatomical coordinates mapped to cow-image.png (4096 × 4096) ── */

// Mouth → esophagus → rumen path
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

/**
 * Maps live telemetry from the Python CV microservice into health animation flags.
 *
 * Expected telemetry shape (per cow from ws://localhost:8000/ws):
 *   { cow_id, state, rumination, risk, status, jaw_bpm, tail_spm, mood, ... }
 */
const mapTelemetryToFlags = (telemetry) => {
  if (!telemetry) return HEALTH_FLAGS;

  const state = (telemetry.state || '').toLowerCase();
  const rumination = (telemetry.rumination || '').toLowerCase();
  const risk = (telemetry.risk || '').toLowerCase();
  const status = (telemetry.status || '').toLowerCase();

  return {
    waterDrinking: state === 'drinking' || state.includes('water'),
    activeFeeding: state === 'eating' || rumination === 'active',
    feedingProblem: state === 'not eating' || status === 'warning' || state.includes('no feed'),
    lowFeeding: rumination === 'low' || rumination === 'idle',
    dehydrationRisk: risk === 'high' || state.includes('dehydrat'),
    medicineInjection: state.includes('medic') || state.includes('inject')
  };
};

const ReferenceMatchCowAnimation = ({ cowId }) => {
  const [flags, setFlags] = useState(HEALTH_FLAGS);
  const canvasRef = useRef(null);

  const waterPathD = useMemo(() => buildPath(WATER_PATH), []);
  const feedPathD = useMemo(() => buildPath(FEED_PATH), []);

  /* ── WebSocket: listen for live telemetry and map it to overlay flags ── */
  useEffect(() => {
    const ws = new WebSocket(CAMERA_CONFIG.WS_URL);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const dataArr = (payload.data && Array.isArray(payload.data))
          ? payload.data
          : (Array.isArray(payload) ? payload : []);

        if (cowId && dataArr.length > 0) {
          const cow = dataArr.find(c => c.cow_id === cowId);
          if (cow) {
            setFlags(mapTelemetryToFlags(cow));
          }
        } else if (dataArr.length > 0) {
          // If no cowId is provided, use the first cow in the array
          setFlags(mapTelemetryToFlags(dataArr[0]));
        }
      } catch (error) {
        console.error('CowAnimation WS parse error:', error);
      }
    };

    return () => ws.close();
  }, [cowId]);

  return (
    <div className="reference-page">
      <div className="reference-canvas-shell">
        <div className="reference-canvas" ref={canvasRef}>
          <img className="reference-image" src="/cow-image.png" alt="Cow anatomy reference" />

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

              <radialGradient id="feedingProblemFill" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,60,60,0.65)" />
                <stop offset="50%" stopColor="rgba(255,80,40,0.35)" />
                <stop offset="100%" stopColor="rgba(255,30,30,0.05)" />
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
                  r={FEEDING_PROBLEM.r + 30}
                  fill="url(#feedingProblemFill)"
                  className="feeding-problem-glow"
                />
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
        </div>
      </div>
    </div>
  );
};

export default ReferenceMatchCowAnimation;
