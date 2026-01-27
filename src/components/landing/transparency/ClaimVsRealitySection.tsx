"use client";

import { motion } from "framer-motion";
import { FeatureCard } from "./FeatureCard";

export const ClaimVsRealitySection = () => {
  return (
    <div className="mb-16 md:mb-24">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h4 className="text-lg sm:text-xl font-bold text-white mb-2">
          The Truth <span className="text-yellow-400">Behind the Claims</span>
        </h4>
        <p className="text-white/50 text-sm max-w-lg mx-auto">
          When excuses meet evidence, only one side holds up. Here's what
          happens behind the scenes.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
        {/* WHAT THEY CLAIM */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <FeatureCard className="p-6 sm:p-8 rounded-xl sm:rounded-2xl h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span className="text-gray-400 text-xs sm:text-sm font-bold tracking-widest uppercase">
                What They Claim
              </span>
            </div>
            <div className="space-y-6">
              {[
                '"Cehpoint is a scam..."',
                '"They rejected me unfairly..."',
                '"The assessment was rigged..."',
              ].map((claim, idx) => (
                <p
                  key={idx}
                  className="text-white/60 text-lg sm:text-xl font-medium italic"
                >
                  {claim}
                </p>
              ))}
            </div>
          </FeatureCard>
        </motion.div>

        {/* WHAT OUR RECORDS SHOW */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <FeatureCard className="p-6 sm:p-8 rounded-xl sm:rounded-2xl h-full border-yellow-500/20 bg-yellow-500/[0.02]">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-yellow-400 text-xs sm:text-sm font-bold tracking-widest uppercase">
                What Our Records Show
              </span>
            </div>
            <div className="space-y-4">
              {[
                "Candidates switched tabs during the assessment",
                "External resources were accessed mid-test",
                "Copy-paste from unauthorized sources detected",
              ].map((record, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-white mt-1">✓</span>
                  <p className="text-white text-base sm:text-lg">{record}</p>
                </div>
              ))}
            </div>
          </FeatureCard>
        </motion.div>
      </div>
    </div>
  );
};
