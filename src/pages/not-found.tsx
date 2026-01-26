"use client";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden px-4">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* 404 Number */}
        <h1 className="text-[150px] sm:text-[200px] md:text-[250px] font-bold text-white/5 leading-none select-none">
          404
        </h1>

        {/* Overlay Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-yellow-400 text-lg sm:text-xl font-medium uppercase tracking-widest mb-2">
            Page Not Found
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Oops! Lost in Space
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link to="/">
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black rounded-md shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(234,179,8,0.6)]"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
