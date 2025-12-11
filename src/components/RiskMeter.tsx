import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
interface RiskMeterProps {
  score: number; // 0-100
  factors?: string[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
export function RiskMeter({ score, factors = [], className, size = 'md' }: RiskMeterProps) {
  const getColor = () => {
    if (score < 20) return 'text-emerald-500';
    if (score < 40) return 'text-amber-500';
    if (score < 70) return 'text-orange-500';
    return 'text-red-500';
  };
  const getBgColor = () => {
    if (score < 20) return 'bg-emerald-500/10';
    if (score < 40) return 'bg-amber-500/10';
    if (score < 70) return 'bg-orange-500/10';
    return 'bg-red-500/10';
  };
  const getIcon = () => {
    if (score < 20) return <ShieldCheck className="h-4 w-4" />;
    if (score < 40) return <ShieldAlert className="h-4 w-4" />;
    if (score < 70) return <AlertTriangle className="h-4 w-4" />;
    return <AlertOctagon className="h-4 w-4" />;
  };
  const getLabel = () => {
    if (score < 20) return 'Low Risk';
    if (score < 40) return 'Elevated';
    if (score < 70) return 'High Risk';
    return 'Critical';
  };
  return (
    <div className={cn("space-y-3", className)}>
      <div className={cn("flex items-center justify-between p-3 rounded-2xl border transition-colors", getBgColor(), "border-white/5")}>
        <div className="flex items-center gap-2">
          <div className={getColor()}>{getIcon()}</div>
          <span className={cn("text-[10px] font-black uppercase tracking-widest", getColor())}>
            {getLabel()}
          </span>
        </div>
        <div className="text-sm font-black tabular-nums">{score}%</div>
      </div>
      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className={cn("h-full transition-colors", 
            score < 20 ? 'bg-emerald-500' : 
            score < 40 ? 'bg-amber-500' : 
            score < 70 ? 'bg-orange-500' : 'bg-red-500'
          )}
        />
      </div>
      {factors.length > 0 && (
        <div className="space-y-1">
          {factors.map((f, i) => (
            <div key={i} className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
              <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
              {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}