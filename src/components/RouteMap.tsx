import React from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
interface RouteMapProps {
  stops: string[];
  status: 'pending' | 'in-progress' | 'completed';
}
export function RouteMap({ stops, status }: RouteMapProps) {
  // Static coordinates for the industrial zone representation
  const stopCoords = [
    { x: 100, y: 100 },
    { x: 300, y: 150 },
    { x: 450, y: 350 },
    { x: 200, y: 400 },
    { x: 50, y: 250 },
  ];
  const currentStops = stops.slice(0, stopCoords.length);
  return (
    <div className="relative w-full aspect-square md:aspect-video bg-secondary/20 rounded-2xl border border-border overflow-hidden p-8 flex items-center justify-center">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #38761d 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <svg viewBox="0 0 500 500" className="w-full h-full max-w-full">
        {/* Route Path */}
        <motion.path
          d={`M ${stopCoords.map(c => `${c.x},${c.y}`).join(' L ')}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          className="text-primary/20"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: status === 'completed' ? 1 : 0.6 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        {/* Dynamic Route Path (In-Progress) */}
        {status === 'in-progress' && (
          <motion.path
            d={`M ${stopCoords.map(c => `${c.x},${c.y}`).join(' L ')}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 0.6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        )}
        {/* Stop Nodes */}
        {currentStops.map((stop, i) => (
          <g key={i}>
            <motion.circle
              cx={stopCoords[i].x}
              cy={stopCoords[i].y}
              r="12"
              className={cn("fill-card stroke-primary stroke-2", status === 'in-progress' && i === 2 && "fill-primary/20")}
            />
            {status === 'in-progress' && i === 2 && (
              <motion.circle
                cx={stopCoords[i].x}
                cy={stopCoords[i].y}
                r="20"
                className="stroke-primary fill-none"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <text x={stopCoords[i].x} y={stopCoords[i].y + 25} textAnchor="middle" className="fill-muted-foreground text-[10px] font-bold uppercase tracking-tighter">
              {stop}
            </text>
          </g>
        ))}
        {/* Vehicle Icon */}
        {status === 'in-progress' && (
          <motion.g
            animate={{ x: [stopCoords[1].x, stopCoords[2].x], y: [stopCoords[1].y, stopCoords[2].y] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          >
            <circle r="15" className="fill-primary" />
            <foreignObject x="-8" y="-8" width="16" height="16">
              <Truck className="w-4 h-4 text-white" />
            </foreignObject>
          </motion.g>
        )}
      </svg>
      <div className="absolute bottom-6 left-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border shadow-sm">
          <Navigation className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Command Center</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground ml-2">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> Active Stop</div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-muted" /> Scheduled</div>
        </div>
      </div>
    </div>
  );
}