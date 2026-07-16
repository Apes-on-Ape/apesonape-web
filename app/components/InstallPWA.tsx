'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed as PWA (running in standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // iOS Safari detection
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Dismissed in this session
    const wasDismissed = sessionStorage.getItem('pwa-banner-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Android/Chrome/Edge — capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  // Don't show if already installed or explicitly dismissed
  if (isInstalled || dismissed) return null;

  // Nothing to show on desktop non-iOS
  const showBanner = !!installPrompt || isIOS;
  if (!showBanner) return null;

  return (
    <>
      {/* Bottom install banner */}
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 3 }}
          className="fixed bottom-4 left-3 right-3 z-50 max-w-md mx-auto"
        >
          <div className="bg-[#0a0a0f] border border-hero-blue/30 rounded-2xl p-4 shadow-2xl shadow-black/60 flex items-center gap-3">
            {/* Icon */}
            <div className="w-11 h-11 rounded-xl bg-hero-blue flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white leading-tight">Add AOA Music</p>
              <p className="text-xs text-white/40 mt-0.5 leading-tight">
                {isIOS ? 'Tap share → Add to Home Screen' : 'Install for offline listening & lock screen controls'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isIOS ? (
                <button
                  onClick={() => setShowIOSGuide(true)}
                  className="text-xs font-bold text-hero-blue bg-hero-blue/10 px-3 py-1.5 rounded-lg hover:bg-hero-blue/20 transition-colors"
                >
                  How?
                </button>
              ) : (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-hero-blue px-3 py-1.5 rounded-lg hover:bg-hero-blue-light transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* iOS step-by-step guide modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#0d0d14] border border-white/10 rounded-2xl p-5 mb-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-white">Add to Home Screen</h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-3">
                {[
                  { step: '1', text: 'Tap the Share button', sub: 'The □↑ icon at the bottom of Safari' },
                  { step: '2', text: 'Scroll down in the menu', sub: 'Find "Add to Home Screen"' },
                  { step: '3', text: 'Tap "Add to Home Screen"', sub: 'Then tap Add in the top right' },
                  { step: '4', text: 'Done!', sub: 'The AOA icon will appear on your home screen' },
                ].map(({ step, text, sub }) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-hero-blue flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5">
                      {step}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">{text}</p>
                      <p className="text-xs text-white/40">{sub}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="text-[11px] text-white/25 mt-4 text-center">Safari only — Chrome on iOS cannot install PWAs</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
