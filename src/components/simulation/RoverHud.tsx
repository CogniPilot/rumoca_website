import { useEffect, useRef } from 'react';
import type { SimulationSource } from '../../lib/simulation-source';
import type { InputManager } from '../../lib/input-manager';

interface RoverHudProps {
  visible: boolean;
  compact?: boolean;
  sourceRef: React.MutableRefObject<SimulationSource | null>;
  inputRef: React.MutableRefObject<InputManager | null>;
}

const AMBER = 'rgba(232, 200, 64, 0.95)';
const AMBER_DIM = 'rgba(232, 200, 64, 0.30)';
const GREEN = 'rgba(94, 255, 190, 0.95)';
const RED = 'rgba(255, 110, 90, 0.95)';
const SHADOW = 'rgba(0, 0, 0, 0.75)';

const SPEED_MAX_MPH = 90;
const RPM_MAX = 7000;
const RPM_REDLINE = 6000;

interface RoverReading {
  speedMs: number;  // signed longitudinal speed
  rpm: number;      // engine rpm
  gear: number;     // -1 R, 0 N, 1/2/3
  slipDeg: number;  // sideslip angle (drift)
  steer: number;    // front wheel angle [rad]
}

function gearLabel(gear: number): string {
  if (gear <= -1) return 'R';
  if (gear === 0) return 'N';
  return String(gear);
}

/** Semicircular gauge sweeping 180° over the top, left→right. */
function drawGauge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  frac: number,
  color: string,
  redFrac = 1.1,
): void {
  const a0 = Math.PI;
  const f = Math.max(0, Math.min(1, frac));
  ctx.lineWidth = 6;
  ctx.strokeStyle = AMBER_DIM;
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, 2 * Math.PI);
  ctx.stroke();
  // redline band
  if (redFrac <= 1) {
    ctx.strokeStyle = 'rgba(255,110,90,0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, R, a0 + redFrac * Math.PI, 2 * Math.PI);
    ctx.stroke();
  }
  // filled portion
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, R, a0, a0 + f * Math.PI);
  ctx.stroke();
  // ticks
  ctx.strokeStyle = AMBER_DIM;
  ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) {
    const a = a0 + (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * (R - 9), cy + Math.sin(a) * (R - 9));
    ctx.lineTo(cx + Math.cos(a) * (R + 2), cy + Math.sin(a) * (R + 2));
    ctx.stroke();
  }
  // needle
  const na = a0 + f * Math.PI;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(na) * (R - 12), cy + Math.sin(na) * (R - 12));
  ctx.stroke();
}

function drawRoverHud(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: RoverReading,
  rc: { throttle: number; roll: number },
  compact: boolean,
): void {
  ctx.clearRect(0, 0, w, h);

  const text = (s: string, x: number, y: number, color: string, font = '15px monospace', align: CanvasTextAlign = 'center') => {
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = SHADOW;
    ctx.fillText(s, x + 1, y + 1);
    ctx.fillStyle = color;
    ctx.fillText(s, x, y);
  };

  const cx = w / 2;
  // On mobile the joysticks own the bottom corners, so anchor the gauges at the
  // top and drop the redundant steering wheel + throttle bar (the sticks show
  // those). On desktop the cluster sits at the bottom like a dashboard.
  const cy = compact ? 92 : h - 52;
  const R = compact ? 54 : 70;
  const dx = compact ? 102 : 135;
  const mph = Math.abs(r.speedMs) * 2.23694;
  const kmh = Math.abs(r.speedMs) * 3.6;
  const drifting = Math.abs(r.slipDeg) > 10;

  const bigFont = compact ? 'bold 22px monospace' : 'bold 26px monospace';
  const spdFont = compact ? 'bold 24px monospace' : 'bold 30px monospace';

  // ── Tachometer (left) ────────────────────────────────────────────────────
  const tachCx = cx - dx;
  drawGauge(ctx, tachCx, cy, R, r.rpm / RPM_MAX, r.rpm >= RPM_REDLINE ? RED : AMBER, RPM_REDLINE / RPM_MAX);
  text(`${(r.rpm / 1000).toFixed(1)}`, tachCx, cy - 22, r.rpm >= RPM_REDLINE ? RED : AMBER, bigFont);
  text('x1000 rpm', tachCx, cy - 2, AMBER_DIM, '11px monospace');

  // ── Speedometer (right) — mph primary, km/h secondary ────────────────────
  const spdCx = cx + dx;
  drawGauge(ctx, spdCx, cy, R, mph / SPEED_MAX_MPH, drifting ? RED : AMBER);
  text(`${Math.round(mph)}`, spdCx, cy - 24, AMBER, spdFont);
  text('mph', spdCx, cy - 4, AMBER_DIM, '11px monospace');
  text(`${Math.round(kmh)} km/h`, spdCx, cy + 16, AMBER_DIM, '12px monospace');

  // ── Gear (center) ────────────────────────────────────────────────────────
  const gy = cy - 8;
  ctx.strokeStyle = AMBER_DIM;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 22, gy - 26, 44, 52);
  const gc = r.gear <= -1 ? RED : r.gear === 0 ? AMBER_DIM : GREEN;
  text(gearLabel(r.gear), cx, gy, gc, 'bold 34px monospace');
  text('R N 1 2 3', cx, gy + 36, AMBER_DIM, '11px monospace');

  if (!compact) {
    // Steering wheel + throttle bar — desktop only; on touch the sticks show
    // these, and they'd overlap the on-screen controls.
    const sy = cy - 86;
    const sr = 22;
    ctx.save();
    ctx.translate(cx, sy);
    ctx.rotate(r.steer * 3.0);
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, sr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-sr, 0); ctx.lineTo(sr, 0);
    ctx.moveTo(0, 0); ctx.lineTo(0, sr);
    ctx.stroke();
    ctx.restore();

    const barW = 180;
    const barX = cx - barW / 2;
    const barY = h - 16;
    ctx.fillStyle = AMBER_DIM;
    ctx.fillRect(barX, barY, barW, 7);
    const mid = barX + barW / 2;
    if (rc.throttle >= 0) {
      ctx.fillStyle = GREEN;
      ctx.fillRect(mid, barY, (barW / 2) * rc.throttle, 7);
    } else {
      ctx.fillStyle = RED;
      ctx.fillRect(mid + (barW / 2) * rc.throttle, barY, (barW / 2) * -rc.throttle, 7);
    }
    ctx.fillStyle = AMBER;
    ctx.fillRect(mid - 1, barY - 2, 2, 11);
    text('BRAKE', barX - 8, barY + 3, AMBER_DIM, '10px monospace', 'right');
    text('GAS', barX + barW + 8, barY + 3, AMBER_DIM, '10px monospace', 'left');
  }

  // ── Drift indicator ──────────────────────────────────────────────────────
  text(`SLIP ${r.slipDeg.toFixed(0)}°`, cx, cy + R + 14, drifting ? RED : AMBER_DIM, '12px monospace');
  if (drifting) text('◄ DRIFT ►', cx, compact ? cy + R + 32 : cy - 120, RED, 'bold 16px monospace');
}

export default function RoverHud({ visible, compact = false, sourceRef, inputRef }: RoverHudProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const sourceProp = useRef(sourceRef);
  const inputProp = useRef(inputRef);
  const compactRef = useRef(compact);
  sourceProp.current = sourceRef;
  inputProp.current = inputRef;
  compactRef.current = compact;

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const source = sourceProp.current.current;
      const input = inputProp.current.current;
      if (!source) {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        return;
      }
      const reading: RoverReading = {
        speedMs: source.get('speed') ?? 0,
        rpm: source.get('engine_rpm') ?? 0,
        gear: Math.round(source.get('gear_out') ?? 0),
        slipDeg: source.get('slip_deg') ?? 0,
        steer: source.get('front_wheel_yaw') ?? 0,
      };
      const rc = input?.rc ?? { throttle: 0, roll: 0, pitch: 0, yaw: 0 };
      drawRoverHud(ctx, canvas.clientWidth, canvas.clientHeight, reading, rc, compactRef.current);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 11,
      }}
    />
  );
}
