import Home from "@/pages/home";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { BrowserRouter, Routes, Route } from "react-router";
import NotFound from "@/pages/not-found";
import { RecordingProvider } from "@/context/RecordingContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RecordingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster richColors position="top-center" expand={true} />
        </BrowserRouter>
      </RecordingProvider>
    </QueryClientProvider>
  );
}

export default App;
