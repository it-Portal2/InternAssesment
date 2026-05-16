import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/Firebase";

export type Provider = "gemini" | "openrouter";

async function fetchActiveProvider(): Promise<Provider> {
  try {
    const snap = await getDoc(doc(db, "aiConfig", "active"));
    const p = snap.data()?.provider;
    return p === "openrouter" ? "openrouter" : "gemini";
  } catch {
    // Never push the user onto the slow OpenRouter path because of a Firestore blip.
    return "gemini";
  }
}

export function useActiveProvider() {
  return useQuery({
    queryKey: ["aiConfig", "active"],
    queryFn: fetchActiveProvider,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
}
