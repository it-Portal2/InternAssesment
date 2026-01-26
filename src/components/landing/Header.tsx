"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface HeaderProps {
  onStartApplication: () => void;
}

export default function Header({ onStartApplication }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <motion.nav
        initial={false}
        animate={isScrolled ? "scrolled" : "top"}
        variants={{
          top: {
            width: "100%",
            marginTop: 0,
            borderRadius: 0,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            borderBottomColor: "rgba(255, 255, 255, 0.1)",
            borderColor: "transparent",
          },
          scrolled: {
            width: "90%",
            maxWidth: "56rem",
            marginTop: 16,
            borderRadius: 16,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            borderBottomColor: "rgba(255, 255, 255, 0.1)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="backdrop-blur-md border border-transparent border-b-white/10"
        style={{ maxWidth: isScrolled ? "56rem" : "100%" }}
      >
        <div
          className={`mx-auto px-6 py-3 lg:py-4 flex items-center justify-between transition-all duration-500 ${
            isScrolled ? "px-5 max-w-6xl" : "max-w-6xl"
          }`}
        >
          <a href="/" className="flex items-center gap-3">
            <img src="/favicon.png" alt="cehpoint-logo" className="w-9 h-9" />
            <div>
              <h2 className="text-sm sm:text-xl font-semibold text-white tracking-tight">
                InternAssessment
              </h2>
              <p className="text-[9px] sm:text-[12px] text-white/50 -mt-0.5">
                By <span className="text-yellow-400">Cehpoint</span>
              </p>
            </div>
          </a>

          <Button
            onClick={onStartApplication}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-md px-3 sm:px-4 py-2 text-xs sm:text-sm"
          >
            Get Started
          </Button>
        </div>
      </motion.nav>
    </header>
  );
}
