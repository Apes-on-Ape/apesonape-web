'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { MagicEdenNFT } from '@/lib/magic-eden';

interface NFTCardProps {
  nft: MagicEdenNFT;
  onClick: () => void;
  index?: number;
  animationsPaused?: boolean;
}

export default function NFTCard({ 
  nft, 
  onClick, 
  index = 0,
  animationsPaused = false 
}: NFTCardProps) {
  const getRarityColor = (rarity: number) => {
    if (rarity <= 10) return 'text-red-400';
    if (rarity <= 50) return 'text-orange-400';
    if (rarity <= 100) return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getRarityLabel = (rarity: number) => {
    if (rarity <= 10) return 'Legendary';
    if (rarity <= 50) return 'Epic';
    if (rarity <= 100) return 'Rare';
    return 'Common';
  };

  const motionProps = animationsPaused
    ? {}
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { delay: index * 0.02, duration: 0.4 },
        whileHover: {
          scale: 1.05,
          rotate: Math.random() > 0.5 ? 2 : -2,
          transition: { duration: 0.3 },
        },
      };

  return (
    <motion.div
      className="relative aspect-square cursor-pointer group"
      {...motionProps}
      onClick={onClick}
    >
      {/* Premium Card Container */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden border group-hover:border-hero-blue/50 transition-all duration-500 bg-background-surface" style={{ borderColor: 'var(--border-color)' }}>
        {/* NFT Image */}
        <div className="relative w-full h-full">
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        </div>

        {/* Premium Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Info Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            whileHover={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="glass rounded-xl p-3 backdrop-blur-md"
          >
            <h3 className="text-white font-semibold text-sm md:text-base truncate mb-2">
              {nft.name}
            </h3>
            <div className="flex items-center justify-between gap-2">
              <span className="text-hero-blue font-bold text-xs md:text-sm">
                {nft.price.toFixed(2)} {nft.currency}
              </span>
              <span className={`badge text-xs ${getRarityColor(nft.rarity)}`}>
                {getRarityLabel(nft.rarity)}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Premium Rarity Badge (Top Right) */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className={`badge-primary text-xs font-semibold ${getRarityColor(nft.rarity)}`}>
            #{nft.rarity}
          </span>
        </div>
      </div>

      {/* Premium Glow Effect on Hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-hero-blue via-accent-cyan to-accent-purple rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10" />
    </motion.div>
  );
}

