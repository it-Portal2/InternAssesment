"use client";

import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Award,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MotivationContent {
  type: "fact" | "quote" | "failure" | "success";
  title: string;
  content: string;
  author?: string;
  icon: any;
  bgGradient: string;
  accentColor: string;
}

const motivationalContent: MotivationContent[] = [
  {
    type: "fact",
    title: "Importance of Internships in India",
    content:
      "85% of Indian IT companies prioritize candidates with internship experience. Companies like TCS, Infosys, and Wipro consider internships as the main foundation for career growth.",
    icon: TrendingUp,
    bgGradient: "from-orange-500/10 via-red-500/5 to-pink-500/10",
    accentColor: "from-orange-500 to-red-500",
  },
  {
    type: "quote",
    title: "Message from a Successful Entrepreneur",
    content:
      '"A degree alone doesn\'t guarantee success. Only practical experience helps you advance in the industry. I learned how the real world works from my very first internship."',
    author: "- Ritesh Agarwal, Founder of OYO",
    icon: BookOpen,
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    accentColor: "from-emerald-500 to-teal-500",
  },
  {
    type: "failure",
    title: "Career Failure Story",
    content:
      'Ravi graduated in CSE with 90% marks but did no internships. He remained jobless for 2 years because he lacked practical skills. Now he says - "I wish I had done internships during college!"',
    icon: AlertTriangle,
    bgGradient: "from-red-500/10 via-rose-500/5 to-pink-500/10",
    accentColor: "from-red-500 to-rose-500",
  },
  {
    type: "fact",
    title: "Indian Job Market Reality",
    content:
      "According to NASSCOM reports, 75% of fresh graduates in India don't get jobs because they lack industry exposure. Internships help you join the 25% successful graduates.",
    icon: Target,
    bgGradient: "from-purple-500/10 via-violet-500/5 to-indigo-500/10",
    accentColor: "from-purple-500 to-indigo-500",
  },
  {
    type: "success",
    title: "Internship Success Story",
    content:
      'Priya did an internship at Flipkart in her 3rd year. Today she\'s a Senior Software Engineer there with a 15 LPA salary. She says - "Internship changed my life completely!"',
    icon: Award,
    bgGradient: "from-amber-500/10 via-yellow-500/5 to-orange-500/10",
    accentColor: "from-amber-500 to-orange-500",
  },
  {
    type: "quote",
    title: "Industry Expert Advice",
    content:
      '"Indian students must understand that marks alone won\'t help. The industry needs practical knowledge. Internships are a bridge between education and career."',
    author: "- Anil Kumar, HR Director at Microsoft India",
    icon: Sparkles,
    bgGradient: "from-blue-500/10 via-cyan-500/5 to-teal-500/10",
    accentColor: "from-blue-500 to-cyan-500",
  },
];

const typeLabels = {
  fact: "INSIGHT",
  quote: "WISDOM",
  failure: "LESSON",
  success: "VICTORY",
};

const InternshipMotivationSlider = ({
  direction = "left",
  speed = "slow",
  pauseOnHover = true,
  className,
}: {
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    addAnimation();
  }, []);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);
      
      // Create complete sets of duplicates - not individual item duplicates
      for (let i = 0; i < 2; i++) {
        scrollerContent.forEach((item) => {
          const duplicatedItem = item.cloneNode(true);
          if (scrollerRef.current) {
            scrollerRef.current.appendChild(duplicatedItem);
          }
        });
      }

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "30s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "60s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "120s");
      }
    }
  };

  return (
    <>
      <div className={cn("w-full py-12", className)}>
        <div
          ref={containerRef}
          className={cn(
            "scroller relative z-20 max-w-7xl mx-auto overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]"
          )}
        >
          <ul
            ref={scrollerRef}
            className={cn(
              "flex w-max min-w-full shrink-0 flex-nowrap gap-6 py-4 px-4",
              start && "animate-scroll",
              pauseOnHover && "hover:[animation-play-state:paused]"
            )}
          >
            {motivationalContent.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <li
                  className="relative w-[400px] max-w-full shrink-0"
                  key={`original-${item.title}-${idx}`}
                >
                  <div className="group relative">
                    {/* Glow Effect */}
                    <div
                      className={`absolute -inset-0.5 bg-gradient-to-r ${item.accentColor} rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200`}
                    ></div>

                    {/* Main Card - Dynamic Height */}
                    <div
                      className={`relative bg-gradient-to-br ${item.bgGradient} backdrop-blur-xl border border-white/20 dark:border-gray-800/20 rounded-2xl p-6 min-h-[320px] flex flex-col shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.02]`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 shrink-0">
                        <div
                          className={`w-12 h-12 bg-gradient-to-r ${item.accentColor} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div
                          className={`px-3 py-1 bg-gradient-to-r ${item.accentColor} rounded-full`}
                        >
                          <span className="text-xs font-bold text-white tracking-wide">
                            {typeLabels[item.type]}
                          </span>
                        </div>
                      </div>

                      {/* Content - Flexible Height */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm mb-4">
                            {item.content}
                          </p>
                        </div>

                        {/* Author - Always at bottom */}
                        {item.author && (
                          <div className="mt-auto pt-4 border-t border-gray-200/20 dark:border-gray-700/20 shrink-0">
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 italic">
                              {item.author}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-xl"></div>
                      <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-tr from-white/5 to-white/10 rounded-lg rotate-45 blur-lg"></div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 px-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <span>Stories update in real-time</span>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InternshipMotivationSlider;