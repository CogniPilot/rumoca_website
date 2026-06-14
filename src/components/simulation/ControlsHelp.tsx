import type { InputMode, InputProfile } from '../../lib/input-manager';

interface ControlsHelpProps {
  inputMode: InputMode;
  profile: InputProfile;
}

/** Tiny inline SVG gamepad diagram with labeled buttons/sticks. */
function GamepadDiagram({ profile }: { profile: InputProfile }) {
  const bg = 'rgba(30,20,10,0.6)';
  const outline = 'rgba(200,160,80,0.35)';
  const accent = '#70b8e0';
  const label = '#a89070';
  const btnFill = 'rgba(200,160,80,0.25)';
  const rover = profile === 'rover';

  const leftVert = rover ? 'Gas/Brake' : 'Throttle';
  const rightHoriz = rover ? 'Steer' : 'Roll';

  return (
    <svg viewBox="0 0 260 196" width="240" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      {/* Shoulder buttons */}
      <rect x="40" y="22" width="46" height="11" rx="5" fill={btnFill} stroke={accent} strokeWidth="0.8" />
      <text x="63" y="30" textAnchor="middle" fill={accent} fontSize="7" fontWeight="bold" fontFamily="monospace">LB</text>
      <rect x="174" y="22" width="46" height="11" rx="5" fill={btnFill} stroke={accent} strokeWidth="0.8" />
      <text x="197" y="30" textAnchor="middle" fill={accent} fontSize="7" fontWeight="bold" fontFamily="monospace">RB</text>
      {rover && (
        <text x="130" y="14" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">LB / RB — shift gear ↓ / ↑</text>
      )}

      {/* Controller body */}
      <rect x="30" y="44" width="200" height="92" rx="20" fill={bg} stroke={outline} strokeWidth="1.5" />
      <rect x="20" y="76" width="30" height="50" rx="12" fill={bg} stroke={outline} strokeWidth="1.2" />
      <rect x="210" y="76" width="30" height="50" rx="12" fill={bg} stroke={outline} strokeWidth="1.2" />

      {/* Left stick */}
      <circle cx="76" cy="78" r="17" fill="none" stroke={outline} strokeWidth="1" />
      <circle cx="76" cy="78" r="7" fill={btnFill} stroke={accent} strokeWidth="1.2" />
      <text x="76" y="56" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace">↑↓</text>
      <text x="76" y="103" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">{leftVert}</text>
      {!rover && (
        <>
          <text x="51" y="81" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace">←→</text>
          <text x="76" y="113" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">Yaw</text>
        </>
      )}

      {/* D-pad (camera view) */}
      <g fill={btnFill} stroke={accent} strokeWidth="0.7">
        <rect x="120" y="98" width="9" height="22" rx="1.5" />
        <rect x="113.5" y="104.5" width="22" height="9" rx="1.5" />
      </g>
      <text x="124.5" y="130" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">View (orbit)</text>

      {/* Right stick */}
      <circle cx="180" cy="78" r="17" fill="none" stroke={outline} strokeWidth="1" />
      <circle cx="180" cy="78" r="7" fill={btnFill} stroke={accent} strokeWidth="1.2" />
      <text x="205" y="81" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace">←→</text>
      <text x="180" y="103" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">{rightHoriz}</text>
      {!rover && (
        <>
          <text x="180" y="56" textAnchor="middle" fill={accent} fontSize="8" fontFamily="monospace">↑↓</text>
          <text x="180" y="113" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">Pitch</text>
        </>
      )}

      {/* Start button (Arm — flight only) */}
      {!rover && (
        <>
          <rect x="121" y="64" width="18" height="8" rx="3" fill={btnFill} stroke={accent} strokeWidth="0.8" />
          <text x="130" y="58" textAnchor="middle" fill={label} fontSize="7" fontFamily="monospace">Start · Arm</text>
        </>
      )}

      {/* Face-button legend */}
      <text x="130" y="152" textAnchor="middle" fill={label} fontSize="7.5" fontFamily="monospace">
        X = HUD · A = Reset · B = Zero
      </text>
      <text x="130" y="166" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="monospace">
        Scroll = zoom · Drag / D-pad = orbit
      </text>
    </svg>
  );
}

function KeyboardKeys({ profile }: { profile: InputProfile }) {
  const label = { color: '#a89070' } as const;
  const key = { color: '#70b8e0', display: 'inline-block', minWidth: '74px' } as const;
  if (profile === 'rover') {
    return (
      <>
        <span style={key}>↑ / ↓</span> <span style={label}>Gas / Brake</span>
        <br />
        <span style={key}>← / →</span> <span style={label}>Steering</span>
        <br />
        <span style={key}>E / Q</span> <span style={label}>Gear up / down (R N 1 2 3)</span>
        <br />
        <span style={key}>H</span> <span style={label}>Toggle cockpit HUD</span>
        <br />
        <span style={key}>R</span> <span style={label}>Reset</span>
      </>
    );
  }
  if (profile === 'fixedwing') {
    return (
      <>
        <span style={key}>W / S</span> <span style={label}>Throttle</span>
        <br />
        <span style={key}>↑ / ↓</span> <span style={label}>Pitch</span>
        <br />
        <span style={key}>← / →</span> <span style={label}>Roll</span>
        <br />
        <span style={key}>A / D</span> <span style={label}>Rudder</span>
        <br />
        <span style={key}>Space</span> <span style={label}>Arm / Disarm</span>
        <br />
        <span style={key}>H</span> <span style={label}>HUD view (chase)</span>
        <br />
        <span style={key}>R</span> <span style={label}>Reset</span>
      </>
    );
  }
  return (
    <>
      <span style={key}>W / S</span> <span style={label}>Throttle</span>
      <br />
      <span style={key}>A / D</span> <span style={label}>Yaw</span>
      <br />
      <span style={key}>↑ / ↓</span> <span style={label}>Roll</span>
      <br />
      <span style={key}>← / →</span> <span style={label}>Pitch</span>
      <br />
      <span style={key}>Space</span> <span style={label}>Arm / Disarm</span>
      <br />
      <span style={key}>H</span> <span style={label}>HUD view (chase)</span>
      <br />
      <span style={key}>R</span> <span style={label}>Reset</span>
    </>
  );
}

export default function ControlsHelp({ inputMode, profile }: ControlsHelpProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 10,
        background: 'rgba(30,20,10,0.75)',
        padding: '8px 14px',
        borderRadius: '6px',
        fontSize: '11px',
        lineHeight: 1.6,
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(200,160,80,0.2)',
        maxWidth: '260px',
        fontFamily: 'monospace',
        color: '#eee',
        pointerEvents: 'none',
      }}
    >
      <b style={{ color: '#e8c840' }}>
        Input: <span>{inputMode}</span>
      </b>
      <br />
      {inputMode === 'keyboard' ? <KeyboardKeys profile={profile} /> : <GamepadDiagram profile={profile} />}
    </div>
  );
}
