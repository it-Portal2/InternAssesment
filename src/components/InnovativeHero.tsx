import { Button } from "@/components/ui/button";

interface InnovativeHeroProps {
  onStartApplication: () => void;
}

export default function InnovativeHero({ onStartApplication }: InnovativeHeroProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 min-h-screen flex items-center">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('/hero-bg.svg')] opacity-10"></div>
        
        {/* Animated particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold text-white leading-tight drop-shadow-2xl">
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                Your Future
              </span>
              <br />
              <span className="text-white drop-shadow-lg">Starts Here</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
              Transform your career with AI-powered internship applications. Get personalized interviews and instant offer letters.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mx-auto max-w-3xl border border-white border-opacity-20 shadow-xl">
              <p className="text-lg font-semibold text-orange-300 mb-2">🇮🇳 Designed for Indian Students</p>
              <p className="text-gray-100">
                Education alone isn't enough! <span className="font-bold text-orange-300">Practical experience</span> is essential for career success. 
                Get your internship opportunity with India's top companies.
              </p>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={onStartApplication}
              className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg font-semibold rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-orange-500/25"
            >
              <span className="relative z-10 flex items-center">
                <i className="fas fa-rocket mr-2"></i>
                Start Your Application
              </span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
            </Button>
            
            <Button variant="ghost" className="px-8 py-4 text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300">
              <i className="fas fa-info-circle mr-2"></i>
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">95%</div>
              <div className="text-gray-300 text-sm">Match Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">24hrs</div>
              <div className="text-gray-300 text-sm">Average Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2 drop-shadow-lg">1000+</div>
              <div className="text-gray-300 text-sm">Success Stories</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 animate-bounce">
        <i className="fas fa-chevron-down text-2xl"></i>
      </div>
    </div>
  );
}