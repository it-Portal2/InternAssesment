import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SlideContent {
  type: 'fact' | 'quote' | 'failure' | 'success';
  title: string;
  content: string;
  author?: string;
  icon: any;
  bgColor: string;
}

const motivationalContent: SlideContent[] = [
  {
    type: 'fact',
    title: 'Importance of Internships in India',
    content: '85% of Indian IT companies prioritize candidates with internship experience. Companies like TCS, Infosys, and Wipro consider internships as the main foundation for career growth.',
    icon: TrendingUp,
    bgColor: 'from-orange-500 to-red-500'
  },
  {
    type: 'quote',
    title: 'Message from a Successful Entrepreneur',
    content: '"A degree alone doesn\'t guarantee success. Only practical experience helps you advance in the industry. I learned how the real world works from my very first internship."',
    author: '- Ritesh Agarwal, Founder of OYO',
    icon: BookOpen,
    bgColor: 'from-green-500 to-blue-500'
  },
  {
    type: 'failure',
    title: 'Career Failure Story',
    content: 'Ravi graduated in CSE with 90% marks but did no internships. He remained jobless for 2 years because he lacked practical skills. Now he says - "I wish I had done internships during college!"',
    icon: AlertTriangle,
    bgColor: 'from-red-500 to-pink-500'
  },
  {
    type: 'fact',
    title: 'Indian Job Market Reality',
    content: 'According to NASSCOM reports, 75% of fresh graduates in India don\'t get jobs because they lack industry exposure. Internships help you join the 25% successful graduates.',
    icon: TrendingUp,
    bgColor: 'from-purple-500 to-indigo-500'
  },
  {
    type: 'success',
    title: 'Internship Success Story',
    content: 'Priya did an internship at Flipkart in her 3rd year. Today she\'s a Senior Software Engineer there with a 15 LPA salary. She says - "Internship changed my life completely!"',
    icon: TrendingUp,
    bgColor: 'from-yellow-500 to-orange-500'
  },
  {
    type: 'quote',
    title: 'Industry Expert Advice',
    content: '"Indian students must understand that marks alone won\'t help. The industry needs practical knowledge. Internships are a bridge between education and career."',
    author: '- Anil Kumar, HR Director at Microsoft India',
    icon: BookOpen,
    bgColor: 'from-teal-500 to-cyan-500'
  }
];

export default function InternshipMotivationSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % motivationalContent.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % motivationalContent.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + motivationalContent.length) % motivationalContent.length);
    setIsAutoPlaying(false);
  };

  const current = motivationalContent[currentSlide];
  const IconComponent = current.icon;

  return (
    <div className="relative w-full max-w-4xl mx-auto my-8">
      <Card className="overflow-hidden shadow-2xl border-0">
        <CardContent className="p-0">
          <div className={`bg-gradient-to-r ${current.bgColor} p-8 text-white relative min-h-[300px] flex items-center`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 ">
              <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white rounded-full"></div>
              <div className="absolute bottom-8 right-8 w-16 h-16 border-2 border-white rounded-lg transform rotate-45"></div>
            </div>

            <div className="relative z-10 flex items-center space-x-6 w-full">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <IconComponent size={40} className="text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <h3 className="text-2xl font-bold">{current.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm`}>
                    {current.type === 'fact' ? 'FACT' : current.type === 'quote' ? 'INSPIRATION' : current.type === 'failure' ? 'LESSON' : 'SUCCESS'}
                  </span>
                </div>
                
                <p className="text-lg leading-relaxed mb-4 font-medium">
                  {current.content}
                </p>
                
                {current.author && (
                  <p className="text-sm font-semibold bg-white/20 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
                    {current.author}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center mt-6 space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          className="rounded-full w-10 h-10 p-0 border-2 hover:scale-105 transition-transform"
        >
          <ChevronLeft size={20} />
        </Button>

        {/* Slide Indicators */}
        <div className="flex space-x-2">
          {motivationalContent.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              onClick={() => {
                setCurrentSlide(index);
                setIsAutoPlaying(false);
              }}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          className="rounded-full w-10 h-10 p-0 border-2 hover:scale-105 transition-transform"
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Auto-play Toggle */}
      <div className="text-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="text-gray-600 hover:text-gray-800"
        >
          {isAutoPlaying ? '⏸️ Auto-play ON' : '▶️ Auto-play OFF'}
        </Button>
      </div>
    </div>
  );
}