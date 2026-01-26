"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BackgroundRippleEffect } from "@/components/ui/BackgroundRippleEffect";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowRight } from "lucide-react";
import {
  animate,
  useInView,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { User } from "lucide-react";

interface HeroProps {
  onStartApplication: () => void;
}

// Animated Counter Component with improved visibility
const AnimatedCounter = ({
  from = 0,
  to,
  duration = 3.5,
}: {
  from?: number;
  to: number;
  duration?: number;
}) => {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (inView) {
      setIsAnimating(true);
      const controls = animate(count, to, {
        duration,
        ease: [0.16, 1, 0.3, 1], // Custom spring-like easing
      });
      setTimeout(() => setIsAnimating(false), duration * 1000);
      return controls.stop;
    }
  }, [count, to, duration, inView]);

  return (
    <motion.span
      ref={ref}
      className={`transition-all duration-300 ${isAnimating ? "drop-shadow-[0_0_20px_rgba(234,179,8,0.8)]" : ""}`}
    >
      {rounded}
    </motion.span>
  );
};

// Animation Styles (injected as CSS)
const heroAnimationStyles = `
  @keyframes word-appear {
    0% { opacity: 0; transform: translateY(30px) scale(0.9); filter: blur(8px); }
    60% { opacity: 0.8; transform: translateY(8px) scale(0.98); filter: blur(2px); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }
  @keyframes float-particle {
    0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
    25% { transform: translateY(-15px) translateX(8px); opacity: 0.7; }
    50% { transform: translateY(-8px) translateX(-5px); opacity: 0.5; }
    75% { transform: translateY(-20px) translateX(10px); opacity: 0.9; }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.2; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.2); }
  }
  @keyframes ripple-expand {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
    100% { transform: translate(-50%, -50%) scale(40); opacity: 0; }
  }
  .hero-word-animate {
    display: inline-block;
    opacity: 0;
    animation: word-appear 0.9s ease-out forwards;
  }
  .hero-floating-particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: rgba(234, 179, 8, 0.6);
    border-radius: 50%;
    animation: float-particle 5s ease-in-out infinite;
    pointer-events: none;
  }
  .hero-click-ripple {
    position: fixed;
    width: 10px;
    height: 10px;
    background: rgba(234, 179, 8, 0.4);
    border-radius: 50%;
    pointer-events: none;
    animation: ripple-expand 0.8s ease-out forwards;
    z-index: 9999;
  }
  .hero-mouse-gradient {
    position: fixed;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(234, 179, 8, 0.08), rgba(251, 191, 36, 0.04), transparent 70%);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition: left 80ms linear, top 80ms linear, opacity 300ms ease-out;
    filter: blur(60px);
    z-index: 1;
  }
`;

export default function Hero({ onStartApplication }: HeroProps) {
  // Mouse gradient state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, opacity: 0 });

  // Click ripples state
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  // Mouse gradient effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY, opacity: 1 });
    };
    const handleMouseLeave = () => {
      setMousePos((prev) => ({ ...prev, opacity: 0 }));
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Click ripple effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 800);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Floating particles data
  const floatingParticles = [
    { top: "15%", left: "10%", delay: "0s" },
    { top: "25%", left: "85%", delay: "0.5s" },
    { top: "45%", left: "5%", delay: "1s" },
    { top: "60%", left: "92%", delay: "1.5s" },
    { top: "75%", left: "8%", delay: "2s" },
    { top: "80%", left: "88%", delay: "2.5s" },
    { top: "35%", left: "95%", delay: "3s" },
    { top: "55%", left: "3%", delay: "3.5s" },
  ];

  return (
    <>
      <style>{heroAnimationStyles}</style>
      <section className="relative min-h-screen bg-black overflow-hidden">
        {/* Animated Spotlight Effect */}
        <Spotlight />

        {/* Ripple Grid Background */}
        <BackgroundRippleEffect rows={12} cols={30} cellSize={50} />

        {/* Yellow Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-500/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]" />

        {/* Floating Particles */}
        {floatingParticles.map((particle, i) => (
          <div
            key={i}
            className="hero-floating-particle"
            style={{
              top: particle.top,
              left: particle.left,
              animationDelay: particle.delay,
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-32 pb-20 text-center">
          {/* Clean Avatar Badge - No Pill Container */}
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Avatar Stack */}
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="relative w-8 h-8 rounded-full bg-white/5 backdrop-blur-md border border-yellow-500/50 flex items-center justify-center overflow-hidden"
                >
                  <User className="w-4 h-4 text-yellow-400" />
                </div>
              ))}
            </div>

            {/* Text */}
            <div className="text-left">
              <p className="text-gray-300 text-sm font-medium">
                Join{" "}
                <span className="text-yellow-400 font-bold">
                  100+ Applicants
                </span>
              </p>
              <p className="text-white/50 text-xs">
                who completed the assessment in the last month
              </p>
            </div>
          </div>

          {/* Main Headline with Word Animations */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight">
            <span
              className="hero-word-animate text-white"
              style={{ animationDelay: "0.2s" }}
            >
              Launch
            </span>{" "}
            <span
              className="hero-word-animate text-white"
              style={{ animationDelay: "0.4s" }}
            >
              Your
            </span>
            <br />
            <span
              className="hero-word-animate text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              style={{ animationDelay: "0.6s" }}
            >
              Dream
            </span>{" "}
            <span
              className="hero-word-animate text-yellow-400 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              style={{ animationDelay: "0.8s" }}
            >
              Career
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-sm md:text-base text-white/50 max-w-3xl mb-10 leading-relaxed mx-auto hero-word-animate"
            style={{ animationDelay: "1s" }}
          >
            Cehpoint's performance-driven model evaluates practical skills for
            real-world demands. Participation implies acceptance of timelines
            and outcome-based evaluation.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 mb-20 hero-word-animate"
            style={{ animationDelay: "1.2s" }}
          >
            <Button
              onClick={onStartApplication}
              size="lg"
              className="px-8 py-6 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black rounded-md shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.6)]"
            >
              Apply Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Animated Stats Grid - No word-animate so counter is visible */}
          <div className="w-full max-w-6xl mx-auto border-t border-white/10 pt-8 mt-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Stat 1: Served Clients */}
              <div className="text-center px-4">
                <div className="text-3xl lg:text-4xl font-bold text-white flex justify-center items-center gap-1">
                  <AnimatedCounter to={100} />
                  <span>+</span>
                </div>
                <div className="text-sm text-white/50 mt-1 uppercase tracking-wider text-[10px] md:text-sm">
                  Served Clients
                </div>
              </div>

              {/* Stat 2: Assessments */}
              <div className="text-center px-4 border-l border-white/10">
                <div className="text-3xl lg:text-4xl font-bold text-white flex justify-center items-center gap-1">
                  <AnimatedCounter to={200} />
                  <span>+</span>
                </div>
                <div className="text-sm text-white/50 mt-1 uppercase tracking-wider text-[10px] md:text-sm">
                  Assessments
                </div>
              </div>

              {/* Stat 3: Avg Stipend */}
              <div className="text-center px-4 border-l border-white/10">
                <div className="text-3xl lg:text-4xl font-bold text-white flex justify-center items-center gap-1">
                  <span>₹</span>
                  <AnimatedCounter to={15} />
                  <span>k+</span>
                </div>
                <div className="text-sm text-white/50 mt-1 uppercase tracking-wider text-[10px] md:text-sm">
                  Minimum Stipend
                </div>
              </div>

              {/* Stat 4: Selection Rate */}
              <div className="text-center px-4 border-l border-white/10">
                <div className="text-3xl lg:text-4xl font-bold text-white flex justify-center items-center gap-1">
                  <AnimatedCounter to={20} />
                  <span>%</span>
                </div>
                <div className="text-sm text-white/50 mt-1 uppercase tracking-wider text-[10px] md:text-sm">
                  Selection Rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mouse-following gradient */}
        <div
          className="hero-mouse-gradient"
          style={{
            left: `${mousePos.x}px`,
            top: `${mousePos.y}px`,
            opacity: mousePos.opacity,
          }}
        />

        {/* Click Ripples */}
        {ripples.map((ripple) => (
          <div
            key={ripple.id}
            className="hero-click-ripple"
            style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
          />
        ))}
      </section>
    </>
  );
}
