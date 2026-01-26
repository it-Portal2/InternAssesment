"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Globe, Linkedin } from "lucide-react";
import { motion } from "framer-motion";

interface FooterProps {
  onStartApplication: () => void;
}

export default function Footer({ onStartApplication }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black border-t border-white/10 py-5 overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #0F0F1166 50%, #eab30833 100%)",
        }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6"
          >
            <div className="flex items-center gap-3">
              <img
                src="/favicon.png"
                alt="cehpoint-logo"
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
              <div>
                <h2 className="text-lg sm:text-2xl font-semibold text-white tracking-tight">
                  InternAssessment
                </h2>
                <p className="text-[10px] sm:text-xs text-white/50">
                  By <span className="text-yellow-400">Cehpoint</span>
                </p>
              </div>
            </div>
            <Button
              onClick={onStartApplication}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/50 text-xs sm:text-sm max-w-sm leading-relaxed"
          >
            Performance-driven hiring aligned with real-world business needs.
            Assessments evaluate practical skills under realistic conditions.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            href="https://www.cehpoint.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-4 sm:py-6 border-t border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <span className="text-xs sm:text-sm">Website</span>
            <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.a>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            href="mailto:internship@cehpoint.co.in"
            className="flex items-center justify-between py-4 sm:py-6 border-t border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <span className="text-xs sm:text-sm">Email</span>
            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.a>

          <motion.a
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            href="https://www.linkedin.com/company/cehpoint"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-4 sm:py-6 border-t border-white/10 text-white/50 hover:text-white transition-colors"
          >
            <span className="text-xs sm:text-sm">LinkedIn</span>
            <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.a>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="py-4 sm:py-6"
        >
          <p className="text-xs sm:text-sm text-white/50 text-center">
            © {currentYear} — All rights reserved by Cehpoint
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
