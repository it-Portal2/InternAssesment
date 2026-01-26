"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Eye } from "lucide-react";

const VideoModal = ({
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
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function TransparencySection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  const videos = [
    {
      url: "https://res.cloudinary.com/dvparynza/video/upload/so_30,eo_60/v1765466317/interview-recordings/interview-recordings/interview_Jagan_Mohan_Reddy_1765466308026.webm",
      featured: true,
    },
    {
      url: "https://res.cloudinary.com/dvparynza/video/upload/so_0,eo_10/v1765459989/interview-recordings/interview-recordings/interview_Giridhar_J_1765459978225.webm",
      featured: false,
    },
    {
      url: "https://res.cloudinary.com/dvparynza/video/upload/so_60,eo_100/v1767710314/interview-recordings/interview-recordings/interview_adviti_gangwar_1767710267342.webm",
      featured: false,
    },
  ];

  return (
    <section className="relative py-16 md:py-32 bg-black overflow-hidden">
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-yellow-500/5 rounded-full blur-[100px] sm:blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-52 sm:w-80 h-52 sm:h-80 bg-amber-500/5 rounded-full blur-[80px] sm:blur-[120px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-yellow-400 bg-yellow-500/10 rounded-full border border-yellow-500/20">
            The Real Story
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4">
            "They Call Us <span className="text-yellow-400">Scam</span>"
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto text-xs sm:text-sm md:text-base">
            Let the recordings speak for themselves.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10 md:mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gray-500" />
              <span className="text-gray-400 text-xs sm:text-sm font-medium uppercase tracking-wider">
                What They Claim
              </span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed italic">
                "Cehpoint is a scam..."
              </p>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed italic">
                "They rejected me unfairly..."
              </p>
              <p className="text-gray-300 text-base sm:text-lg leading-relaxed italic">
                "The assessment was rigged..."
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl bg-yellow-500/5 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
              <span className="text-yellow-400 text-xs sm:text-sm font-medium uppercase tracking-wider">
                What Our Records Show
              </span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                ✓ Candidates switched tabs during the assessment
              </p>
              <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                ✓ External resources were accessed mid-test
              </p>
              <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                ✓ Copy-paste from unauthorized sources detected
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <p className="text-lg sm:text-xl md:text-2xl text-white font-medium">
            We don't claim.{" "}
            <span className="text-yellow-400">We document.</span>
          </p>
          <p className="text-white/50 text-xs sm:text-sm mt-2">
            Every session is recorded. Here's the evidence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:row-span-2 group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-yellow-500/30 transition-all duration-500"
            onClick={() => setActiveVideo(videos[0].url)}
          >
            <div className="aspect-[4/3] md:aspect-auto md:h-full bg-gradient-to-br from-gray-900 to-black relative">
              <video
                src={videos[0].url}
                muted
                loop
                playsInline
                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/30">
                  <Play
                    className="w-6 h-6 sm:w-8 sm:h-8 text-black ml-1"
                    fill="black"
                  />
                </div>
              </div>
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/80 border border-yellow-500/20">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-yellow-400 text-[10px] sm:text-xs font-medium">
                  RECORDED SESSION
                </span>
              </div>
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-1.5 text-gray-400 text-xs sm:text-sm">
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Click to view</span>
              </div>
            </div>
          </motion.div>

          {videos.slice(1).map((video, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className="group relative rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-yellow-500/30 transition-all duration-500"
              onClick={() => setActiveVideo(video.url)}
            >
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-black relative">
                <video
                  src={video.url}
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/30">
                    <Play
                      className="w-5 h-5 sm:w-6 sm:h-6 text-black ml-0.5"
                      fill="black"
                    />
                  </div>
                </div>
                <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-full bg-black/80 border border-yellow-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-yellow-400 text-[9px] sm:text-[10px] font-medium uppercase">
                    Recorded
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-8 md:mt-12 text-center"
        >
          <p className="text-white/50 text-xs sm:text-sm max-w-xl mx-auto px-4">
            All recordings are stored securely and used solely for evaluation
            transparency. When someone calls us a "scam" — we show the evidence.
          </p>
        </motion.div>
      </div>

      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo || ""}
      />
    </section>
  );
}
