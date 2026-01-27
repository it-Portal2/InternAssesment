import { motion } from "framer-motion";
import { Eye, Play, Shield } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { videos } from "./data";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

export const VideoEvidenceSection = ({
  setActiveVideo,
}: {
  setActiveVideo: (url: string) => void;
}) => {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-8 md:mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-1.5 mb-3 sm:mb-4 text-[10px] sm:text-xs font-medium uppercase tracking-wider text-yellow-400 bg-yellow-500/10 rounded-full border border-yellow-500/20">
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          Video Evidence
        </div>
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
          See It <span className="text-yellow-400">For Yourself</span>
        </h3>
        <p className="text-white/50 max-w-xl mx-auto text-xs sm:text-sm md:text-base">
          Don't just take our word for it. See the evidence for yourself.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="h-full"
        >
          <FeatureCard
            className="rounded-none overflow-hidden cursor-pointer group h-full flex flex-col justify-between"
            onClick={() => setActiveVideo(videos[0].url)}
          >
            <div className="p-6 sm:p-8 flex-grow">
              <span className="text-white/50 flex items-center gap-2 text-sm">
                AI Voice Agent Detected
              </span>
              <TextGenerateEffect
                words="Candidate caught using voice agents which can talk on behalf of them answering of the question which our ai recruiter is asking and doing lipsing while the voice agent is answering in professional way."
                className="text-white text-xl sm:text-2xl font-semibold"
              />
            </div>

            <div className="relative border-t border-dashed border-white/10 mt-auto">
              <div
                aria-hidden
                className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(234,179,8,0.3),transparent_100%)]"
              />
              <div className="aspect-video relative">
                <video
                  src={videos[0].url}
                  muted
                  loop
                  playsInline
                  controlsList="nodownload"
                  onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/30">
                    <Play
                      className="w-5 h-5 sm:w-7 sm:h-7 text-black ml-0.5"
                      fill="black"
                    />
                  </div>
                </div>

                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/80 border border-yellow-500/20 w-fit">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-yellow-400 text-[10px] sm:text-xs font-medium">
                      RECORDED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="h-full"
        >
          <FeatureCard
            className="rounded-none overflow-hidden cursor-pointer group h-full flex flex-col justify-between"
            onClick={() => setActiveVideo(videos[1].url)}
          >
            <div className="p-6 sm:p-8 flex-grow">
              <span className="text-white/50 flex items-center gap-2 text-sm">
                Hidden Helper Detected
              </span>
              <TextGenerateEffect
                words="Second person visible behind camera, who turned of the camera and helping form behind the camera."
                className="text-white text-xl sm:text-2xl font-semibold"
              />
            </div>

            <div className="relative border-t border-dashed border-white/10 mt-auto">
              <div
                aria-hidden
                className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(234,179,8,0.3),transparent_100%)]"
              />
              <div className="aspect-video relative">
                <video
                  src={videos[1].url}
                  muted
                  loop
                  playsInline
                  controlsList="nodownload"
                  onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/30">
                    <Play
                      className="w-5 h-5 sm:w-7 sm:h-7 text-black ml-0.5"
                      fill="black"
                    />
                  </div>
                </div>

                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/80 border border-yellow-500/20 w-fit">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-yellow-400 text-[10px] sm:text-xs font-medium">
                      RECORDED
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <FeatureCard className="rounded-none overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div
                className="cursor-pointer group"
                onClick={() => setActiveVideo(videos[2].url)}
              >
                <div className="p-6 sm:p-8">
                  <span className="text-white/50 flex items-center gap-2 text-sm">
                    Script Reading Detected
                  </span>
                  <TextGenerateEffect
                    words="Candidate is reading answers from another device. We are looking for problem solvers, not teleprompter readers. Whatever our AI recruiter asks, the AI on the other device generates text-based answers, which the candidate then reads directly."
                    className="text-white text-xl sm:text-2xl font-semibold"
                  />
                </div>

                {/* Video Section */}
                <div className="relative border-t border-dashed border-white/10">
                  <div
                    aria-hidden
                    className="absolute inset-0 [background:radial-gradient(125%_125%_at_50%_0%,transparent_40%,rgba(234,179,8,0.3),transparent_100%)]"
                  />
                  <div className="aspect-video relative">
                    <video
                      src={videos[2].url}
                      muted
                      loop
                      playsInline
                      controlsList="nodownload"
                      onContextMenu={(e: React.MouseEvent) =>
                        e.preventDefault()
                      }
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-yellow-500/90 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-yellow-500/30">
                        <Play
                          className="w-5 h-5 sm:w-7 sm:h-7 text-black ml-0.5"
                          fill="black"
                        />
                      </div>
                    </div>

                    {/* Recording Badge */}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/80 border border-yellow-500/20 w-fit">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-yellow-400 text-[10px] sm:text-xs font-medium">
                          RECORDED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Statement */}
              <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
                <span className="text-white/50 flex items-center gap-2 text-sm mb-6">
                  <Shield className="w-4 h-4" />
                  Privacy First
                </span>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={{
                    visible: { transition: { staggerChildren: 0.01 } },
                  }}
                >
                  <div className="text-xl sm:text-2xl font-semibold text-white mb-4">
                    {["Recordings", "are", "stored", "securely", "and"].map(
                      (word, i) => (
                        <motion.span
                          key={`h1-${i}`}
                          variants={{
                            hidden: { opacity: 0, filter: "blur(10px)" },
                            visible: { opacity: 1, filter: "blur(0px)" },
                          }}
                        >
                          {word}{" "}
                        </motion.span>
                      ),
                    )}
                    <motion.span
                      variants={{
                        hidden: { opacity: 0, filter: "blur(10px)" },
                        visible: { opacity: 1, filter: "blur(0px)" },
                      }}
                      className="text-yellow-400"
                    >
                      never shared publicly.
                    </motion.span>
                  </div>

                  <div className="text-white/50 text-sm sm:text-base leading-relaxed mb-6">
                    {[
                      "But",
                      "when",
                      "rejected",
                      "candidates",
                      "spread",
                      "false",
                      "claims",
                      "about",
                      "us,",
                      "we",
                      "reserve",
                      "the",
                      "right",
                      "to",
                      "present",
                      "evidence.",
                    ].map((word, i) => (
                      <motion.span
                        key={`b-${i}`}
                        variants={{
                          hidden: { opacity: 0, filter: "blur(10px)" },
                          visible: { opacity: 1, filter: "blur(0px)" },
                        }}
                      >
                        {word}{" "}
                      </motion.span>
                    ))}
                  </div>

                  <div className="text-yellow-400 text-sm sm:text-base font-semibold">
                    {["Fair", "process.", "Fair", "response."].map(
                      (word, i) => (
                        <motion.span
                          key={`f-${i}`}
                          variants={{
                            hidden: { opacity: 0, filter: "blur(10px)" },
                            visible: { opacity: 1, filter: "blur(0px)" },
                          }}
                        >
                          {word}{" "}
                        </motion.span>
                      ),
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </FeatureCard>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-8 md:mt-12 text-center"
      >
        <p className="text-white/40 text-xs sm:text-sm max-w-xl mx-auto px-4">
          Names blurred for privacy. All recordings are stored securely and used
          solely for evaluation transparency.
        </p>
      </motion.div>
    </>
  );
};
