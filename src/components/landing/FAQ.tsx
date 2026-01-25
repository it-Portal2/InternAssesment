import React, { useEffect, useState } from "react";

const INTRO_STYLE_ID = "faq-animations";

const faqs = [
  {
    question: "Is Cehpoint a scam?",
    answer: `Yes. Absolutely.
We scam people who expect:
• Guaranteed internships without performance
• Certificates without contribution
• Deadlines that magically don't matter
• Real-world roles without real-world pressure`,
    meta: "Transparency",
  },
  {
    question: "Why do people call Cehpoint a scam after the assessment?",
    answer: `Because rejection hurts more when:
• The task was real
• The deadline was clear
• Guidance was provided
• And excuses didn't work

Calling us a "scam" is easier than admitting "I wasn't ready for this level of responsibility."`,
    meta: "Reality",
  },
  {
    question: "But we enjoyed learning. Why weren't we selected?",
    answer: `We're glad you enjoyed learning.
Unfortunately, our clients enjoy delivery, not enjoyment.

At Cehpoint:
• Learning is encouraged
• Enjoyment is optional
• Delivery is mandatory`,
    meta: "Expectations",
  },
  {
    question: "Do you provide guidance during the assessment?",
    answer: `Yes. We guide. We explain. We clarify.

What we don't do:
• Finish the task for you
• Extend deadlines indefinitely
• Lower standards to avoid complaints

That part is on you.`,
    meta: "Support",
  },
  {
    question: "Is selection guaranteed after the assessment?",
    answer: `No.
If selection were guaranteed, that would actually be a scam.`,
    meta: "Selection",
  },
  {
    question: "Why doesn't Cehpoint just make the internship easier?",
    answer: `Because easy internships create:
• Fragile engineers
• Overconfident resumes
• Underprepared professionals

We prefer fewer candidates who can actually survive real work.`,
    meta: "Standards",
  },
  {
    question: "Who should NOT apply to Cehpoint?",
    answer: `Do not apply if you want:
• Guaranteed outcomes
• Zero-pressure environments
• Sympathy-based evaluation
• Certificates over competence
• Guaranteed payouts regardless of performance`,
    meta: "Warning",
  },
  {
    question: "Who should apply to Cehpoint internships?",
    answer: `Cehpoint internships are suitable for candidates who:
• Are serious about professional growth
• Can commit time and effort
• Accept real-world accountability
• Understand that performance matters more than certificates

This model is NOT suitable for candidates seeking casual learning-only exposure.`,
    meta: "Ideal Fit",
  },
  {
    question: "What is Cehpoint's stance on transparency?",
    answer: `Cehpoint believes in:
• Clear communication
• Documented processes
• Measurable outcomes
• Fair but strict evaluation

We encourage candidates to review all internship details carefully before applying.`,
    meta: "Values",
  },
  {
    question: "Why is my assessment session recorded?",
    answer: `Your assessment session is recorded exclusively for integrity verification purposes.

What the recording is used for:
• Detecting unauthorized assistance or cheating
• Verifying candidate identity throughout the assessment
• Ensuring a fair evaluation process for all participants

What we do NOT do with recordings:
• Share with third parties
• Use for any purpose other than assessment integrity
• Store beyond the evaluation period

This measure protects both you and other honest candidates from unfair practices.`,
    meta: "Privacy",
  },
];

const palette = {
  surface: "bg-black text-neutral-100",
  panel: "bg-white/5",
  border: "border-yellow-500/20",
  heading: "text-white",
  muted: "text-neutral-400",
  iconRing: "border-yellow-500/30",
  iconSurface: "bg-yellow-500/10",
  icon: "text-yellow-400",
  glow: "rgba(234, 179, 8, 0.15)",
  aurora:
    "radial-gradient(ellipse 50% 100% at 10% 0%, rgba(234, 179, 8, 0.1), transparent 65%), #000000",
  shadow: "shadow-[0_20px_60px_-30px_rgba(234,179,8,0.15)]",
  overlay: "linear-gradient(130deg, rgba(234,179,8,0.04) 0%, transparent 65%)",
};

export default function FAQ() {
  // Use a Set to track which FAQs are open - allows multiple to be open independently
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(INTRO_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = INTRO_STYLE_ID;
    style.innerHTML = `
      @keyframes faq-fade-up {
        0% { transform: translate3d(0, 20px, 0); opacity: 0; filter: blur(6px); }
        60% { filter: blur(0); }
        100% { transform: translate3d(0, 0, 0); opacity: 1; filter: blur(0); }
      }
      .faq-fade {
        opacity: 0;
        transform: translate3d(0, 24px, 0);
        filter: blur(12px);
        transition: opacity 700ms ease, transform 700ms ease, filter 700ms ease;
      }
      .faq-fade--ready {
        animation: faq-fade-up 860ms cubic-bezier(0.22, 0.68, 0, 1) forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setHasEntered(true);
      return;
    }
    let timeout: number;
    const onLoad = () => {
      timeout = window.setTimeout(() => setHasEntered(true), 120);
    };
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(timeout);
    };
  }, []);

  const toggleQuestion = (index: number) => {
    setOpenFaqs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const setCardGlow = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--faq-x", `${event.clientX - rect.left}px`);
    target.style.setProperty("--faq-y", `${event.clientY - rect.top}px`);
  };

  const clearCardGlow = (event: React.MouseEvent<HTMLLIElement>) => {
    const target = event.currentTarget;
    target.style.removeProperty("--faq-x");
    target.style.removeProperty("--faq-y");
  };

  return (
    <div
      className={`relative w-full overflow-hidden transition-colors duration-700 ${palette.surface}`}
    >
      <div
        className="absolute inset-0 z-0"
        style={{ background: palette.aurora }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{ background: palette.overlay, mixBlendMode: "screen" }}
      />

      <section
        className={`relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-12 ${
          hasEntered ? "faq-fade--ready" : "faq-fade"
        }`}
      >
        <header className="mb-12 flex items-end justify-between border-b border-white/20 pb-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
              FAQ
            </h1>
            <p className="mt-2 text-sm md:text-base text-white/70">
              Real questions. Real answers. No sugar-coating.
            </p>
          </div>
        </header>

        {/* CSS columns for masonry layout - no row-based gaps */}
        <ul className="columns-1 md:columns-2 gap-4 space-y-4">
          {faqs.map((item, index) => {
            const open = openFaqs.has(index);
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-trigger-${index}`;

            return (
              <li
                key={item.question}
                className={`break-inside-avoid group relative overflow-hidden rounded-2xl border backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 ${palette.border} ${palette.panel} ${palette.shadow}`}
                onMouseMove={setCardGlow}
                onMouseLeave={clearCardGlow}
              >
                <div
                  className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                    open ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{
                    background: `radial-gradient(200px circle at var(--faq-x, 50%) var(--faq-y, 50%), ${palette.glow}, transparent 70%)`,
                  }}
                />

                <button
                  type="button"
                  id={buttonId}
                  aria-controls={panelId}
                  aria-expanded={open}
                  onClick={() => toggleQuestion(index)}
                  className="relative flex w-full items-center gap-4 px-5 py-5 text-left transition-colors duration-300"
                >
                  {/* Icon - vertically centered */}
                  <span
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500 group-hover:scale-105 ${palette.iconRing} ${palette.iconSurface}`}
                  >
                    <svg
                      className={`relative h-4 w-4 transition-transform duration-500 ${palette.icon} ${open ? "rotate-45" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5v14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M5 12h14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>

                  {/* Question text */}
                  <h2
                    className={`flex-1 text-sm md:text-base font-medium leading-snug ${palette.heading}`}
                  >
                    {item.question}
                  </h2>

                  {/* Meta tag */}
                  {item.meta && (
                    <span
                      className={`hidden sm:inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] ${palette.border} ${palette.muted}`}
                    >
                      {item.meta}
                    </span>
                  )}
                </button>

                {/* Answer panel */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`overflow-hidden transition-[max-height,padding] duration-500 ease-out ${
                    open ? "max-h-96 px-5 pb-5" : "max-h-0"
                  }`}
                >
                  <div
                    className={`pl-14 text-sm leading-relaxed whitespace-pre-line ${palette.muted}`}
                  >
                    {item.answer}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
