'use client';

import React, { useState, useEffect } from 'react';

const THUMBS_BASE =
  'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

interface Tile {
  id: number;
  top: number;   // percentage
  left: number;  // percentage
  size: number;  // px
  opacity: number;
  rotate: number; // degrees
}

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];
  const cols = 6;
  const rows = 4;
  const used = new Set<number>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Pick a unique token ID
      let id: number;
      do {
        id = Math.floor(Math.random() * 10000);
      } while (used.has(id));
      used.add(id);

      const cellW = 100 / cols;
      const cellH = 100 / rows;

      // Scatter randomly within the cell (with 15% padding so tiles stay inside)
      const left = c * cellW + cellW * 0.1 + Math.random() * cellW * 0.75;
      const top  = r * cellH + cellH * 0.1 + Math.random() * cellH * 0.75;

      tiles.push({
        id,
        top,
        left,
        size: 80 + Math.floor(Math.random() * 50),  // 80–130 px
        opacity: 0.05 + Math.random() * 0.05,        // 0.05–0.10
        rotate: (Math.random() - 0.5) * 12,          // −6° to +6°
      });
    }
  }
  return tiles;
}

export default function ApeBackground() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTiles(buildTiles());
    // Fade in after tiles are placed
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  if (tiles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none select-none"
      style={{
        zIndex: -1,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease',
      }}
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="absolute rounded-2xl overflow-hidden"
          style={{
            top: `${tile.top}%`,
            left: `${tile.left}%`,
            width: tile.size,
            height: tile.size,
            opacity: tile.opacity,
            transform: `rotate(${tile.rotate}deg)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${THUMBS_BASE}/${tile.id}.webp`}
            alt=""
            width={tile.size}
            height={tile.size}
            loading="lazy"
            decoding="async"
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ))}
    </div>
  );
}
