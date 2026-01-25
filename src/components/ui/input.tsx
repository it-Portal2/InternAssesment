import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-lg border bg-gray-900/50 border-gray-700 px-3 py-2 text-base text-white shadow-sm transition-all outline-none",
        "placeholder:text-gray-500",
        "focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
