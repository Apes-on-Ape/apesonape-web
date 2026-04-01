'use client';

import { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseVx: number;
  baseVy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  colorIdx: number;
  glow: boolean;
  phase: number; // for subtle sine-wave drift
}

// Apechain blue palette — dots, lines, and occasional white highlights
const COLORS = [
  '#0054F9', // Apechain blue
  '#0054F9',
  '#0054F9',
  '#1a6aff',
  '#3377FF', // blue-light
  '#00D9FF', // cyan accent
  'rgba(255,255,255,0.85)', // occasional white
];

const N = 145;
const LINK_DIST = 125;
const MOUSE_RADIUS = 220;
const PUSH_STRENGTH = 6.5;
const BASE_SPEED = 0.38;
const DAMPING = 0.978;

export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; inside: boolean }>({ x: -9999, y: -9999, inside: false });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Setup ─────────────────────────────────────────────────────────────
    function resize() {
      if (!canvas) return;
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function randBetween(a: number, b: number) {
      return a + Math.random() * (b - a);
    }

    function makeParticle(): Particle {
      const glow = Math.random() < 0.22;
      const spd = BASE_SPEED * randBetween(0.5, 1.5);
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * spd;
      const vy = Math.sin(angle) * spd;
      const base = glow ? randBetween(0.45, 0.85) : randBetween(0.18, 0.55);
      return {
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        size: glow ? randBetween(2.4, 4.2) : randBetween(0.9, 2.2),
        opacity: base,
        baseOpacity: base,
        colorIdx: Math.floor(Math.random() * COLORS.length),
        glow,
        phase: Math.random() * Math.PI * 2,
      };
    }

    function init() {
      if (!canvas) return;
      particlesRef.current = Array.from({ length: N }, makeParticle);
    }

    // ── Draw loop ─────────────────────────────────────────────────────────
    function frame(ts: number) {
      if (!canvas || !ctx) return;
      const dt = Math.min((ts - timeRef.current) / 16, 3);
      timeRef.current = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const inside = mouseRef.current.inside;
      const pts = particlesRef.current;
      const t = ts * 0.0003;

      // ── Update particles ────────────────────────────────────────────────
      for (const p of pts) {
        // Gentle sine drift
        const drift = Math.sin(t * 0.8 + p.phase) * 0.012;
        p.vx += drift;
        p.vy += Math.cos(t * 0.6 + p.phase) * 0.008;

        // Mouse repulsion
        if (inside) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < MOUSE_RADIUS * MOUSE_RADIUS && d2 > 1) {
            const d = Math.sqrt(d2);
            const force = ((MOUSE_RADIUS - d) / MOUSE_RADIUS);
            const forceStrength = force * force * PUSH_STRENGTH;
            p.vx += (dx / d) * forceStrength * 0.08 * dt;
            p.vy += (dy / d) * forceStrength * 0.08 * dt;
            p.opacity = Math.min(1, p.baseOpacity + force * 0.65);
          } else {
            p.opacity += (p.baseOpacity - p.opacity) * 0.05 * dt;
          }
        } else {
          p.opacity += (p.baseOpacity - p.opacity) * 0.04 * dt;
        }

        // Speed clamp
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        const maxSpd = BASE_SPEED * 6;
        if (spd > maxSpd) {
          p.vx = (p.vx / spd) * maxSpd;
          p.vy = (p.vy / spd) * maxSpd;
        }

        // Damping + nudge back toward base velocity when slow
        p.vx *= Math.pow(DAMPING, dt);
        p.vy *= Math.pow(DAMPING, dt);
        if (spd < BASE_SPEED * 0.35) {
          p.vx += (p.baseVx - p.vx) * 0.01 * dt;
          p.vy += (p.baseVy - p.vy) * 0.01 * dt;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Soft wrap
        if (p.x < -12) p.x = canvas.width + 12;
        else if (p.x > canvas.width + 12) p.x = -12;
        if (p.y < -12) p.y = canvas.height + 12;
        else if (p.y > canvas.height + 12) p.y = -12;
      }

      // ── Connection lines ────────────────────────────────────────────────
      ctx.save();
      ctx.lineWidth = 0.7;
      for (let i = 0; i < pts.length - 1; i++) {
        const pi = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const pj = pts[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK_DIST * LINK_DIST) {
            const d = Math.sqrt(d2);
            const base = (1 - d / LINK_DIST);
            // Boost lines near cursor
            let boost = 1;
            if (inside) {
              const mdx = (pi.x + pj.x) / 2 - mx;
              const mdy = (pi.y + pj.y) / 2 - my;
              const md = Math.sqrt(mdx * mdx + mdy * mdy);
              if (md < MOUSE_RADIUS) boost = 1 + (1 - md / MOUSE_RADIUS) * 2.5;
            }
            const alpha = Math.min(0.55, base * 0.22 * boost);
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#0054F9';
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // ── Draw particles ──────────────────────────────────────────────────
      for (const p of pts) {
        ctx.save();
        ctx.globalAlpha = Math.max(0.01, Math.min(1, p.opacity));
        ctx.fillStyle = COLORS[p.colorIdx];
        if (p.glow) {
          ctx.shadowBlur = 14;
          ctx.shadowColor = COLORS[p.colorIdx];
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ── Cursor glow ring ────────────────────────────────────────────────
      if (inside) {
        const grd = ctx.createRadialGradient(mx, my, 0, mx, my, MOUSE_RADIUS * 0.6);
        grd.addColorStop(0, 'rgba(0,84,249,0.06)');
        grd.addColorStop(0.5, 'rgba(0,84,249,0.025)');
        grd.addColorStop(1, 'rgba(0,84,249,0)');
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(mx, my, MOUSE_RADIUS * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    // ── Mouse tracking ────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;
      mouseRef.current = { x, y, inside };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999, inside: false };
    };
    const onResize = () => { resize(); init(); };

    // ── Boot ──────────────────────────────────────────────────────────────
    resize();
    init();
    timeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
}
