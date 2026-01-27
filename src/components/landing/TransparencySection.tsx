"use client";

import { useState } from "react";
import { VideoModal, ImageModal } from "./transparency/Modals";
import { ExpectationsSection } from "./transparency/ExpectationsSection";
import { EmailAlertsSection } from "./transparency/EmailAlertsSection";
import { VideoEvidenceSection } from "./transparency/VideoEvidenceSection";
import { ClaimVsRealitySection } from "./transparency/ClaimVsRealitySection";

export default function TransparencySection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  return (
    <section className="relative py-16 md:py-32 bg-black overflow-hidden">
      <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-yellow-500/5 rounded-full blur-[100px] sm:blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-52 sm:w-80 h-52 sm:h-80 bg-amber-500/5 rounded-full blur-[80px] sm:blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ExpectationsSection />
        <EmailAlertsSection setActiveImage={setActiveImage} />
        <ClaimVsRealitySection />
        <VideoEvidenceSection setActiveVideo={setActiveVideo} />
      </div>

      <VideoModal
        isOpen={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        videoUrl={activeVideo || ""}
      />
      <ImageModal
        isOpen={!!activeImage}
        onClose={() => setActiveImage(null)}
        imageUrl={activeImage?.url || ""}
        title={activeImage?.title || ""}
      />
    </section>
  );
}
