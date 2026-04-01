'use client';

import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function ApeModel({ selectedAnimation, onAnimationsLoaded }: { selectedAnimation: string; onAnimationsLoaded: (names: string[]) => void }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/avatar.glb');
  const { actions, names } = useAnimations(animations, group);

  // Notify parent of available animations
  useEffect(() => {
    if (names && names.length > 0) {
      onAnimationsLoaded(names);
    }
  }, [names, onAnimationsLoaded]);

  useEffect(() => {
    if (selectedAnimation && actions[selectedAnimation]) {
      // Stop all animations
      Object.values(actions).forEach(action => action?.stop());
      
      // Play selected animation
      const action = actions[selectedAnimation];
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
    }
  }, [selectedAnimation, actions]);

  return (
    <group ref={group}>
      <primitive 
        object={scene} 
        scale={2.5}
        position={[0, -1, 0]}
      />
    </group>
  );
}

export default function ApeUnlocksSection() {
  const [selectedAnimation, setSelectedAnimation] = useState<string>('');
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);

  const handleAnimationsLoaded = (names: string[]) => {
    setAvailableAnimations(names);
    if (names.length > 0 && !selectedAnimation) {
      setSelectedAnimation(names[0]);
    }
  };

  const benefits = [
    {
      title: 'Access to an amazing community & network',
      description: ''
    },
    {
      title: 'Upload access to our SoundCloud',
      description: 'with opportunities to be featured and showcased'
    },
    {
      title: 'Access to AI Creator Studio',
      description: ''
    },
    {
      title: 'Exclusive AOA 3D Avatar',
      description: 'compatible with Otherside'
    },
    {
      title: 'Full access to the AOA Arcade',
      description: ''
    },
    {
      title: 'Creative tools to build content with your Ape',
      description: ''
    },
    {
      title: 'And more perks coming soon',
      description: ''
    }
  ];

  return (
    <section className="relative py-4 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080F] via-[#07090F] to-[#080808]" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-hero-blue/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-cyan/4 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '2s' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side - 3D Model */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative h-[500px] lg:h-[600px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-hero-blue/20 to-accent-cyan/10 rounded-3xl blur-xl" />
            <div className="relative h-full bg-gradient-to-br from-hero-blue/10 via-black/40 to-black/40 backdrop-blur-sm rounded-3xl border-2 border-hero-blue/30 overflow-hidden shadow-2xl">
              <Suspense fallback={
                <div className="h-full flex items-center justify-center">
                  <div className="text-hero-blue text-lg animate-pulse">Loading 3D Avatar...</div>
                </div>
              }>
                <Canvas>
                  <PerspectiveCamera makeDefault position={[0, 0, 5]} />
                  {/* Enhanced lighting for brightness */}
                  <ambientLight intensity={1.2} />
                  <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
                  <directionalLight position={[-5, 5, 5]} intensity={1.2} color="#3377FF" />
                  <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} color="#ffffff" />
                  <pointLight position={[-10, -10, -10]} intensity={1} color="#0054F9" />
                  <pointLight position={[0, 10, 0]} intensity={1.5} color="#ffffff" />
                  <hemisphereLight intensity={0.8} groundColor="#0a1a3a" />
                  <ApeModel selectedAnimation={selectedAnimation} onAnimationsLoaded={handleAnimationsLoaded} />
                  <OrbitControls 
                    enableZoom={false}
                    autoRotate
                    autoRotateSpeed={2}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={Math.PI / 2}
                  />
                </Canvas>
              </Suspense>
            </div>

            {/* Animation Controls */}
            {availableAnimations.length > 0 && (
              <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-hero-blue text-center uppercase tracking-wider">
                  Select Animation
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableAnimations.map((animName) => (
                    <motion.button
                      key={animName}
                      onClick={() => setSelectedAnimation(animName)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                        selectedAnimation === animName
                          ? 'bg-hero-blue text-white shadow-lg shadow-hero-blue/40 scale-105'
                          : 'bg-black/40 text-hero-blue border border-hero-blue/30 hover:border-hero-blue/60 hover:bg-hero-blue/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {animName}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Title */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              <span className="bg-gradient-to-r from-white via-hero-blue-light to-white bg-clip-text text-transparent">
                What Your Ape Unlocks
              </span>
            </h2>

            {/* Benefits List */}
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 group"
                >
                  {/* Bullet Point */}
                  <div className="flex-shrink-0 mt-1.5">
                    <div className="w-2 h-2 rounded-full bg-hero-blue group-hover:scale-150 transition-transform duration-300" />
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-hero-blue transition-colors duration-300">
                      {benefit.title}
                      {benefit.description && (
                        <span className="text-lg md:text-xl font-normal text-white/50 ml-1">
                          {benefit.description}
                        </span>
                      )}
                    </h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

// Preload the GLB model
useGLTF.preload('/avatar.glb');
