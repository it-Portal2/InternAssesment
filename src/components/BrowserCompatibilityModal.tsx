"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Monitor, Chrome } from "lucide-react";
import { getRecommendedBrowsers } from "@/utils/browserSupport";

interface BrowserCompatibilityModalProps {
  isOpen: boolean;
  reason: string;
  browserName: string;
}

export function BrowserCompatibilityModal({
  isOpen,
  reason,
  browserName,
}: BrowserCompatibilityModalProps) {
  const recommendedBrowsers = getRecommendedBrowsers();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-black border border-red-500/30"
          >
            {/* Header */}
            <div className="p-6 sm:p-8 text-center border-b border-red-500/20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Browser Not Supported
              </h2>
              <p className="text-white/60 text-sm">
                Current browser:{" "}
                <span className="text-red-400 font-medium">{browserName}</span>
              </p>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                <p className="text-white/80 text-sm leading-relaxed">
                  {reason}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-white/60 text-sm font-medium flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Please use one of these browsers:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {recommendedBrowsers.map((browser) => (
                    <div
                      key={browser}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                    >
                      <Chrome className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm">{browser}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400 text-sm font-medium mb-1">
                  ⚠️ Important
                </p>
                <p className="text-white/60 text-xs">
                  This interview requires screen recording for proctoring
                  purposes. You cannot proceed without a compatible browser.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 sm:p-8 pt-0">
              <a
                href="https://www.google.com/chrome/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors"
              >
                <Chrome className="w-5 h-5" />
                Download Google Chrome
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
