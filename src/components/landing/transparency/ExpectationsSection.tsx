"use client";

import { motion } from "framer-motion";
import { Ban, CheckCircle } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

export const ExpectationsSection = () => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8 md:mb-12"
      >
        <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-yellow-400 bg-yellow-500/10 rounded-full border border-yellow-500/20">
          Transparency
        </span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
          We Hire <span className="text-yellow-400">Engineers</span>
          <br className="hidden sm:block" /> Not AI Proxies
        </h2>
        <p className="text-white/50 max-w-2xl mx-auto text-xs sm:text-sm md:text-base">
          We value genuine talent. Here's what we're looking for — and what we
          won't accept.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12 md:mb-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <FeatureCard className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl h-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-red-400 text-sm sm:text-base font-semibold">
                What We Don't Accept
              </span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <span className="text-red-400 mt-0.5">✕</span>
                Interns whose "backend" is an AI voice agent
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <span className="text-red-400 mt-0.5">✕</span>
                Candidates relying on real-time AI during interviews
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <span className="text-red-400 mt-0.5">✕</span>
                Profiles that can't explain their own submitted work
              </p>
            </div>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <FeatureCard className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl h-full">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-green-400 text-sm sm:text-base font-semibold">
                What We're Looking For
              </span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                Supabase, Firebase, Laravel expertise
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                REST APIs, databases, and authentication skills
              </p>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <span className="text-green-400 mt-0.5">✓</span>
                Real-world implementation experience
              </p>
            </div>
          </FeatureCard>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center mb-16 md:mb-24"
      >
        <p className="text-lg sm:text-xl md:text-2xl text-white/80 font-medium italic max-w-3xl mx-auto">
          "AI as your assistant?{" "}
          <span className="text-yellow-400">That's smart.</span> AI as your
          replacement? This isn't the place for you."
        </p>
      </motion.div>
    </>
  );
};
