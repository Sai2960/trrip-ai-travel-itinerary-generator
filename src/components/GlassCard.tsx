import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  id?: string;
  className?: string;
  hoverEffect?: boolean;
  key?: React.Key;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export function GlassCard({ children, id, className = '', hoverEffect = false, ...props }: GlassCardProps) {
  return (
    <div
      id={id}
      className={`
        bg-slate-900/40 
        backdrop-blur-xl 
        border border-slate-800/60 
        rounded-2xl 
        shadow-2xl 
        shadow-slate-950/20 
        transition-all 
        duration-300
        ${hoverEffect ? 'hover:border-slate-700/80 hover:bg-slate-900/50 hover:shadow-cyan-950/5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
