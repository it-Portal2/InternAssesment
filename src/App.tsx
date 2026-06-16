import Home from "@/pages/home";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router";
import NotFound from "@/pages/not-found";
import { RecordingProvider } from "@/context/RecordingContext";
import { ProctoringProvider } from "@/context/ProctoringContext";

import Lenis from "lenis";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <RecordingProvider>
        <ProctoringProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster
              richColors
              position="top-center"
              expand={true}
              toastOptions={{
                style: {
                  background: "rgba(0, 0, 0, 0.9)",
                  border: "1px solid rgba(75, 75, 75, 0.8)",
                  color: "#ffffff",
                  backdropFilter: "blur(12px)",
                },
                className: "dark-toast",
                classNames: {
                  success:
                    "!bg-green-500/20 !border-green-500/50 !text-green-400",
                  error: "!bg-red-500/20 !border-red-500/50 !text-red-400",
                  warning:
                    "!bg-yellow-500/20 !border-yellow-500/50 !text-yellow-400",
                  info: "!bg-blue-500/20 !border-blue-500/50 !text-blue-400",
                },
              }}
            />
          </BrowserRouter>
        </ProctoringProvider>
      </RecordingProvider>
    </QueryClientProvider>
  );
}

export default App;
