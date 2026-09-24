'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const THUMBS_BASE =
  'https://bqcrbcpmimfojnjdhvrz.supabase.co/storage/v1/object/public/collection/collection-thumbs';

const STRIP_IDS = [42, 188, 337, 512, 701, 888, 1024, 1337, 1500, 1776, 2048, 2222, 3001, 3456];
const STRIP2_IDS = [3999, 4200, 4567, 4800, 5050, 5500, 6000, 6543, 7000, 7391, 7777, 8001, 8500, 8888];

function ApeStrip({ ids, reverse = false }: { ids: number[]; reverse?: boolean }) {
  const doubled = [...ids, ...ids];
  return (
    <div className="overflow-hidden" aria-hidden="true">
      <motion.div
        className="flex gap-3"
        animate={{ x: reverse ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        style={{ width: 'max-content' }}
      >
        {doubled.map((id, i) => (
          <div
            key={`${id}-${i}`}
            className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/8"
          >
            <Image
              src={`${THUMBS_BASE}/${id}.webp`}
              alt={`Ape #${id}`}
              fill
              sizes="128px"
              className="object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export default function HomeApesSection() {
  return (
    <section
      aria-labelledby="apes-heading"
      className="border-t border-white/8 py-24 md:py-32 overflow-hidden"
    >
      <div className="container-premium text-center mb-14">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="type-label text-white/40 mb-6">The original 10,000</p>
          <h2
            id="apes-heading"
            className="font-black text-white leading-[0.9] tracking-tight mb-6"
            style={{ fontSize: 'var(--text-display)' }}
          >
            Before the music.
            <br />
            There were 10,000.
          </h2>
          <p className="type-body-lg max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            These are the characters the whole thing started with.
          </p>
        </motion.div>
      </div>

      {/* Scroll strips */}
      <div className="space-y-4 mb-14">
        <ApeStrip ids={STRIP_IDS} />
        <ApeStrip ids={STRIP2_IDS} reverse />
      </div>

      <div className="container-premium text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/collection" className="btn-secondary group inline-flex">
            See them
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
