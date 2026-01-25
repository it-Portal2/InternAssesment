import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import TransparencySection from "@/components/landing/TransparencySection";
import ReviewsMarquee from "@/components/landing/ReviewsMarquee";
import MotivationGrid from "@/components/landing/MotivationGrid";
import FAQ from "@/components/landing/FAQ";
import Footer from "@/components/landing/Footer";
import ModalApplicationForm from "@/components/steps/ModalApplicationForm";
import { useState } from "react";

const Home = () => {
  const [showApplication, setShowApplication] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <Header onStartApplication={() => setShowApplication(true)} />

      {/* Hero Section */}
      <Hero onStartApplication={() => setShowApplication(true)} />

      {/* Transparency Section - Addresses "scam" narrative */}
      <TransparencySection />

      {/* Motivation Grid - Why Internships Matter */}
      <MotivationGrid />

      {/* Feedback/Testimonials */}
      <ReviewsMarquee />

      {/* FAQ Section */}
      <FAQ />

      {/* Footer with CTA */}
      <Footer onStartApplication={() => setShowApplication(true)} />

      {/* Application Modal */}
      <ModalApplicationForm
        open={showApplication}
        onOpenChange={setShowApplication}
      />
    </div>
  );
};

export default Home;
