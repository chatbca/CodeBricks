import { Blocks } from 'lucide-react';

export function CodebricksLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Blocks className="text-primary" size={size} />
      <span className="text-xl font-bold text-foreground">CodeBricks AI</span>
    </div>
  );
}
