"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { emailAlerts } from "./data";

export const EmailAlertsSection = ({
  setActiveImage,
}: {
  setActiveImage: (image: { url: string; title: string } | null) => void;
}) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!carouselApi) return;

    const updateSelection = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateSelection();
    carouselApi.on("select", updateSelection);
    carouselApi.on("reInit", updateSelection);

    return () => {
      carouselApi.off("select", updateSelection);
      carouselApi.off("reInit", updateSelection);
    };
  }, [carouselApi]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-16 md:mb-24"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
        {/* Left: Title & Description */}
        <div className="max-w-2xl">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Cheaters Get <span className="text-yellow-400">Caught.</span>
          </h3>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              visible: { transition: { staggerChildren: 0.01 } },
            }}
            className="text-white/70 text-sm sm:text-base leading-relaxed mb-6"
          >
            {[
              "Our",
              "AI",
              "proctoring",
              "system",
              "automatically",
              "detects",
              "and",
              "flags",
              "dishonest",
              "behavior",
              "during",
              "interviews.",
              "Candidates",
              "who",
              "attempt",
              "shortcuts",
              "like",
            ].map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, filter: "blur(10px)" },
                  visible: { opacity: 1, filter: "blur(0px)" },
                }}
              >
                {word}{" "}
              </motion.span>
            ))}

            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
              className="text-yellow-400 font-medium"
            >
              tab switching
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
            >
              ,{" "}
            </motion.span>

            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
              className="text-yellow-400 font-medium"
            >
              using AI assistants
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
            >
              ,{" "}
            </motion.span>

            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
              className="text-yellow-400 font-medium"
            >
              reading from external scripts
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
            >
              , or{" "}
            </motion.span>

            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
              className="text-yellow-400 font-medium"
            >
              having someone else answer
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, filter: "blur(10px)" },
                visible: { opacity: 1, filter: "blur(0px)" },
              }}
            >
              {" "}
            </motion.span>

            {["receive", "immediate", "rejection", "emails."].map((word, i) => (
              <motion.span
                key={`end-${i}`}
                variants={{
                  hidden: { opacity: 0, filter: "blur(10px)" },
                  visible: { opacity: 1, filter: "blur(0px)" },
                }}
              >
                {word}{" "}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* Right: Navigation Arrows */}
        <div className="hidden sm:flex shrink-0 gap-2">
          <button
            onClick={() => carouselApi?.scrollPrev()}
            disabled={!canScrollPrev}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-yellow-500/10 hover:border-yellow-500/30 hover:text-yellow-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => carouselApi?.scrollNext()}
            disabled={!canScrollNext}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white hover:bg-yellow-500/10 hover:border-yellow-500/30 hover:text-yellow-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setCarouselApi}
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {emailAlerts.map((alert, index) => (
            <CarouselItem
              key={index}
              className="pl-4 basis-[260px] sm:basis-[300px] lg:basis-[340px]"
            >
              <div
                className="group relative h-full min-h-[380px] sm:min-h-[420px] overflow-hidden rounded-xl cursor-pointer border border-white/10 hover:border-yellow-500/30 transition-all shadow-2xl"
                onClick={() =>
                  setActiveImage({ url: alert.image, title: alert.title })
                }
              >
                <img
                  src={alert.image}
                  alt={alert.title}
                  className="absolute h-full w-full object-cover object-bottom transition-transform duration-300 group-hover:scale-105"
                />
                {/* Top blur shadow */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
                {/* Bottom blur shadow */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white bg-black/60 px-4 py-2 rounded-full">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">View</span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Mobile Dots */}
      <div className="flex sm:hidden justify-center gap-2 mt-6">
        {emailAlerts.map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index ? "w-6 bg-yellow-400" : "w-2 bg-white/20"
            }`}
            onClick={() => carouselApi?.scrollTo(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Quote */}
      <p className="text-center text-white/70 text-base sm:text-lg md:text-xl font-medium mt-10 max-w-2xl mx-auto italic">
        "We're looking for{" "}
        <span className="text-yellow-400">real problem solvers</span> — not
        trick performers. Show us your authentic skills, and you'll stand out
        from the crowd."
      </p>
    </motion.div>
  );
};
