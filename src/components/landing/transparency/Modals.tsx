"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export const VideoModal = ({
  isOpen,
  onClose,
  videoUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-5xl rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-yellow-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          <div className="aspect-video bg-black">
            <video
              src={videoUrl}
              controls
              autoPlay
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export const ImageModal = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative flex flex-col items-center max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute -top-2 -right-2 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] max-w-[90vw] sm:max-w-[400px] w-auto h-auto object-contain rounded-xl border border-yellow-500/20"
          />
          <div className="mt-3 px-4 py-2 bg-black/50 rounded-lg border border-white/10">
            <p className="text-white font-medium text-sm text-center">
              {title}
            </p>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
