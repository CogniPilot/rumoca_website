import { useRef, useState, useCallback } from 'react';
import type { InputManager, InputProfile } from '../../lib/input-manager';

interface TouchControlsProps {
  profile: InputProfile;
  inputRef: React.MutableRefObject<InputManager | null>;
}

const BASE = 128; // joystick base diameter (px)
const KNOB = 56;
const R = (BASE - KNOB) / 2; // max knob travel

interface JoystickProps {
  side: 'left' | 'right';
  selfCenterX: boolean;
  selfCenterY: boolean;
  label: string;
  onChange: (x: number, y: number) => void;
}

/** A virtual analog stick. x/y reported in [-1,1], up = +1. Axes can be set to
 *  hold (no self-center) — used for the flight throttle lever. */
function Joystick({ side, selfCenterX, selfCenterY, label, onChange }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: selfCenterY ? 0 : -1 });
  const activeId = useRef<number | null>(null);

  const compute = useCallback((e: React.PointerEvent) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    const x = dx / R;
    const y = -dy / R;
    setKnob({ x, y });
    onChange(x, y);
  }, [onChange]);

  const onDown = (e: React.PointerEvent) => {
    activeId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    compute(e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    compute(e);
  };
  const onUp = (e: React.PointerEvent) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    setKnob((k) => {
      const nx = selfCenterX ? 0 : k.x;
      const ny = selfCenterY ? 0 : k.y;
      onChange(nx, ny);
      return { x: nx, y: ny };
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 22,
        [side]: 22,
        width: BASE,
        height: BASE,
        touchAction: 'none',
        pointerEvents: 'auto',
      } as React.CSSProperties}
    >
      <div style={{
        position: 'absolute', bottom: BASE + 4, width: BASE, textAlign: 'center',
        color: 'rgba(232,200,64,0.7)', font: '10px monospace', pointerEvents: 'none',
      }}>{label}</div>
      <div
        ref={baseRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          width: BASE, height: BASE, borderRadius: '50%',
          background: 'rgba(30,20,10,0.45)',
          border: '1.5px solid rgba(200,160,80,0.35)',
          touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute',
          left: BASE / 2 - KNOB / 2 + knob.x * R,
          top: BASE / 2 - KNOB / 2 - knob.y * R,
          width: KNOB, height: KNOB, borderRadius: '50%',
          background: 'rgba(112,184,224,0.35)',
          border: '2px solid rgba(112,184,224,0.9)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

function TouchButton({ label, onPress, accent }: { label: string; onPress: () => void; accent?: boolean }) {
  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); onPress(); }}
      style={{
        minWidth: 58, height: 48, padding: '0 12px',
        borderRadius: 10,
        background: accent ? 'rgba(94,255,190,0.16)' : 'rgba(30,20,10,0.7)',
        color: accent ? 'rgba(94,255,190,0.92)' : '#d8c08a',
        border: `1.5px solid ${accent ? 'rgba(94,255,190,0.5)' : 'rgba(200,160,80,0.35)'}`,
        font: 'bold 13px monospace',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
    >
      {label}
    </button>
  );
}

export default function TouchControls({ profile, inputRef }: TouchControlsProps) {
  const set = (side: 'L' | 'R') => (x: number, y: number) =>
    inputRef.current?.setTouchStick(side, x, y);
  const rover = profile === 'rover';

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 13, pointerEvents: 'none' }}>
      {/* Left stick */}
      <Joystick
        side="left"
        selfCenterX
        selfCenterY={rover}
        label={rover ? 'STEER' : 'THR / YAW'}
        onChange={set('L')}
      />
      {/* Right stick */}
      <Joystick
        side="right"
        selfCenterX
        selfCenterY
        label={rover ? 'GAS / BRAKE' : 'ROLL / PITCH'}
        onChange={set('R')}
      />

      {/* Action buttons, bottom-center */}
      <div style={{
        position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, pointerEvents: 'none',
      }}>
        {rover ? (
          <>
            <TouchButton label="GEAR ▼" onPress={() => inputRef.current?.touchShiftDown()} />
            <TouchButton label="GEAR ▲" onPress={() => inputRef.current?.touchShiftUp()} />
          </>
        ) : (
          <TouchButton label="ARM" onPress={() => inputRef.current?.touchToggleArmed()} />
        )}
        <TouchButton label="RESET" onPress={() => inputRef.current?.touchReset()} />
      </div>
    </div>
  );
}
