import InnovativeHero from "@/components/InnovativeHero";
import InternshipMotivationSlider from "@/components/InternshipMotivationSlider";
import ModalApplicationForm from "@/components/steps/ModalApplicationForm";
import { useState } from "react";

const Home = () => {
  const [showApplication, setShowApplication] = useState(false);

  return (
    <div className="min-h-screen">
      <InnovativeHero onStartApplication={() => setShowApplication(true)} />

      {/* Motivational Slider Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Are <span className="text-orange-600">Internships</span>{" "}
              Essential?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              For building a successful career in India, internships are
              absolutely vital. Discover why!
            </p>
          </div>
        <InternshipMotivationSlider direction="left" speed="slow" pauseOnHover={true} />
          <ModalApplicationForm
            open={showApplication}
            onOpenChange={setShowApplication}
          />          
        </div>
      </section>
    </div>
  );
};

export default Home;
