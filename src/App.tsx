import Home from "@/pages/home";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router';
import NotFound from "@/pages/not-found";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster richColors position="top-center"/>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
