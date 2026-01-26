"use client";

import { motion } from "framer-motion";

interface Testimonial {
  id: number;
  name: string;
  avatar: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Priya Sharma",
    avatar: "https://i.pravatar.cc/100?img=10",
    text: "The internship at Cehpoint completely transformed my career. I got placed at Google within 3 months of completing the program!",
  },
  {
    id: 2,
    name: "Rahul Verma",
    avatar: "https://i.pravatar.cc/100?img=11",
    text: "Best decision I ever made. The mentorship and real-world projects prepared me perfectly for the tech industry.",
  },
  {
    id: 3,
    name: "Ananya Patel",
    avatar: "https://i.pravatar.cc/100?img=12",
    text: "From zero coding experience to Amazon - that's my journey with Cehpoint. The structured learning path is unmatched.",
  },
  {
    id: 4,
    name: "Arjun Singh",
    avatar: "https://i.pravatar.cc/100?img=13",
    text: "The hands-on projects and weekly mentorship sessions gave me confidence to crack any interview. Highly recommended!",
  },
  {
    id: 5,
    name: "Sneha Gupta",
    avatar: "https://i.pravatar.cc/100?img=14",
    text: "Cehpoint doesn't just teach you to code - they teach you to think like an engineer. That's the real value.",
  },
  {
    id: 6,
    name: "Vikram Reddy",
    avatar: "https://i.pravatar.cc/100?img=15",
    text: "The AI/ML track was incredibly well-designed. I'm now working on cutting-edge ML systems at Swiggy.",
  },
];

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex-shrink-0 w-72 sm:w-80 mx-3 sm:mx-4">
      <div className="h-full p-5 sm:p-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:border-yellow-500/30">
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
          "{testimonial.text}"
        </p>
        <div className="flex items-center gap-3">
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-yellow-500/30"
          />
          <span className="text-white font-medium text-xs sm:text-sm">
            {testimonial.name}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ReviewsMarquee() {
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="py-16 md:py-20 bg-black overflow-hidden">
      <div className="text-center mb-8 md:mb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 mb-4 md:mb-6 rounded-full border border-yellow-500/30 bg-yellow-500/10"
        >
          <span className="text-xs md:text-sm text-yellow-400">Feedback</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4"
        >
          What Our <span className="text-yellow-400">Applicants</span> Say
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/50 max-w-2xl mx-auto text-sm md:text-base"
        >
          Real feedback from candidates who went through our assessment process.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative mb-4"
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10" />
        <div className="flex animate-marquee">
          {duplicatedTestimonials.map((testimonial, i) => (
            <TestimonialCard
              key={`row1-${testimonial.id}-${i}`}
              testimonial={testimonial}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-black to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-black to-transparent z-10" />
        <div className="flex animate-marquee-reverse">
          {[...duplicatedTestimonials].reverse().map((testimonial, i) => (
            <TestimonialCard
              key={`row2-${testimonial.id}-${i}`}
              testimonial={testimonial}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
