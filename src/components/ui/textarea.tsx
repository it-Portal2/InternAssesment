import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-lg border bg-gray-900/50 border-gray-700 px-3 py-2 text-base text-white shadow-sm transition-all outline-none",
        "placeholder:text-gray-500",
        "focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
