import React from "react";
import { Monitor, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ScreenCheckModalProps {
  isOpen: boolean;
  onCheckAgain: () => void;
}

export const ScreenCheckModal: React.FC<ScreenCheckModalProps> = ({
  isOpen,
  onCheckAgain,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/80 p-6 shadow-2xl backdrop-blur-xl"
          >
            {/* Glossy overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

            <div className="relative flex flex-col items-center text-center">
              {/* Icon with glowing effect */}
              <div className="mb-6 relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-500/20 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-yellow-500/30 bg-yellow-500/10">
                  <Monitor className="h-10 w-10 text-yellow-500" />
                </div>
              </div>

              <h2 className="mb-2 text-2xl font-bold text-white">
                Multiple Screens Detected
              </h2>

              <p className="mb-8 text-white/70 leading-relaxed">
                To ensure a fair and secure assessment environment, please
                disconnect any external monitors.{" "}
                <strong className="text-yellow-400">
                  Only a single screen is allowed.
                </strong>
              </p>

              <Button
                onClick={onCheckAgain}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold h-12 text-lg rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)]"
              >
                <RefreshCcw className="mr-2 h-5 w-5" />
                Check Again
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
