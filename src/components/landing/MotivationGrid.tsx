"use client";

import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Users,
  Trophy,
  TrendingUp,
  Briefcase,
  GraduationCap,
  Code,
  Heart,
} from "lucide-react";
import React, { useState } from "react";
import { motion } from "framer-motion";

type FeatureType = {
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
};

const features: FeatureType[] = [
  {
    title: "Kickstart Your Career",
    icon: Rocket,
    description:
      "Get your foot in the door at top companies before graduating. The tech industry values experience over degrees.",
  },
  {
    title: "Build a Powerful Network",
    icon: Users,
    description:
      "Connect with industry leaders, mentors, and peers who will shape your entire career trajectory.",
  },
  {
    title: "Stand Out from the Crowd",
    icon: Trophy,
    description:
      "In India's competitive job market with lakhs of applicants, practical experience makes you visible.",
  },
  {
    title: "Learn What Matters",
    icon: TrendingUp,
    description:
      "Textbooks teach theory. Internships teach you how real companies build, ship, and scale products.",
  },
  {
    title: "Pre-Placement Offers",
    icon: Briefcase,
    description:
      "80% of our exceptional interns receive PPOs. Your internship could become your first job.",
  },
  {
    title: "Bridge the Skills Gap",
    icon: GraduationCap,
    description:
      "Bridge the gap between college curriculum and industry needs. Become job-ready immediately.",
  },
  {
    title: "Build a Real Portfolio",
    icon: Code,
    description:
      "Work on products used by thousands. Build a portfolio that speaks louder than any resume.",
  },
  {
    title: "Discover Your Passion",
    icon: Heart,
    description:
      "Explore different roles and domains. Find what truly excites you before committing to a career path.",
  },
];

function FeatureCard({
  feature,
  className,
  index,
}: {
  feature: FeatureType;
  className?: string;
  index: number;
}) {
  const Icon = feature.icon;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpacity(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        "group relative overflow-hidden bg-black p-6 md:p-8 transition-colors",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(234, 179, 8, 0.15), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 border border-yellow-500/20"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(234, 179, 8, 0.1), transparent 40%)`,
        }}
      />
      <div className="-mt-2 -ml-20 mask-[radial-gradient(farthest-side_at_top,white,transparent)] pointer-events-none absolute top-0 left-1/2 size-full">
        <GridPattern
          className="absolute inset-0 size-full stroke-yellow-500/20 fill-yellow-500/5 group-hover:stroke-yellow-500/40 transition-colors duration-500"
          height={40}
          width={40}
          x={-1}
          y={-1}
        />
      </div>
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-yellow-500/20 transition-colors duration-300">
        <Icon
          aria-hidden
          className="size-5 md:size-6 text-yellow-400"
          strokeWidth={1.5}
        />
      </div>
      <h3 className="text-base md:text-lg font-medium text-white">
        {feature.title}
      </h3>
      <p className="mt-2 text-xs md:text-sm text-gray-400 font-light leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
}

export default function MotivationGrid() {
  return (
    <section className="py-16 md:py-32 bg-black">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-12 space-y-8 md:space-y-12">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 mb-4 md:mb-6 rounded-full border border-yellow-500/30 bg-yellow-500/10"
          >
            <span className="text-xs md:text-sm text-yellow-400">
              Why Internships Matter
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
          >
            Power. Speed. <span className="text-yellow-400">Career.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto px-4"
          >
            Everything you need to build a fast, secure, and scalable career
            trajectory.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="overflow-hidden rounded-xl md:rounded-2xl border border-white/10 relative"
        >
          <div className="grid grid-cols-1 gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
