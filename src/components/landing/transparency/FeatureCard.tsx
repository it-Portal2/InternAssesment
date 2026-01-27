import React from "react";

export const FeatureCard = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    className={`group relative bg-white/5 border border-white/10 hover:border-yellow-500/30 transition-all duration-300 ${className}`}
    onClick={onClick}
  >
    {/* Corner Decorators */}
    <span className="absolute -left-px -top-px block size-2 border-l-2 border-t-2 border-yellow-500" />
    <span className="absolute -right-px -top-px block size-2 border-r-2 border-t-2 border-yellow-500" />
    <span className="absolute -bottom-px -left-px block size-2 border-b-2 border-l-2 border-yellow-500" />
    <span className="absolute -bottom-px -right-px block size-2 border-b-2 border-r-2 border-yellow-500" />
    {children}
  </div>
);
