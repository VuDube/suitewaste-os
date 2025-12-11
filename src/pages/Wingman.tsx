import React from 'react';
import { PageLayout } from '@/components/PageLayout';
import { useAI_Wingman } from '@/hooks/useAI_Wingman';
import { Button } from '@/components/ui/button';
import { Mic, Volume2, Bot, Sparkles, Activity, ShieldCheck, Zap, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
export function Wingman() {
  const { isListening, isSpeaking, listen } = useAI_Wingman();
  return (
    <PageLayout fullBleed>
      <div className="h-full flex flex-col items-center justify-center space-y-12 bg-background relative overflow-hidden px-6 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
        {/* Vision SOP Overlay Simulation */}
        <div className="absolute top-10 left-10 z-20 space-y-4">
          <motion.div 
            initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl border border-primary/20 max-w-[280px]"
          >
            <div className="flex items-center gap-2 mb-2 text-primary font-black uppercase tracking-widest text-[10px]">
              <Sparkles className="h-4 w-4" /> Grade-A SOP Active
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border border-primary flex items-center justify-center text-[10px] font-black">1</div>
                <p className="text-[11px] font-bold">Validate material cleanliness</p>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="h-5 w-5 rounded-full border border-muted flex items-center justify-center text-[10px] font-black">2</div>
                <p className="text-[11px] font-bold">Verify empty container tare</p>
              </div>
            </div>
          </motion.div>
        </div>
        <header className="text-center space-y-2 z-10">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="h-20 w-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-elevation-3"
          >
            <Bot className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="text-5xl font-black uppercase tracking-tighter">Wingman</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
            <Zap className="h-3 w-3 text-primary animate-pulse" /> Industrial Multimodal Engine
          </p>
        </header>
        <div className="relative flex items-center justify-center h-64 w-64">
           <AnimatePresence>
            {(isListening || isSpeaking) && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-primary/20"
                />
              </>
            )}
           </AnimatePresence>
           <Button
            size="lg"
            onClick={listen}
            className={cn(
              "h-32 w-32 rounded-full shadow-elevation-12 transition-all duration-500 z-10",
              isListening ? "bg-red-600 scale-110" : "bg-primary"
            )}
           >
             {isListening ? <Activity className="h-12 w-12 animate-pulse" /> : <Mic className="h-12 w-12" />}
           </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl z-10">
          <Card className="glass-panel border-none p-6 text-center space-y-2">
            <Zap className="h-5 w-5 mx-auto text-primary" />
            <h3 className="font-black text-[9px] uppercase tracking-widest">Active Yield</h3>
            <p className="text-2xl font-black tracking-tighter">1.2t Cu</p>
          </Card>
          <Card className="glass-panel border-none p-6 text-center space-y-2">
            <ShieldCheck className="h-5 w-5 mx-auto text-emerald-500" />
            <h3 className="font-black text-[9px] uppercase tracking-widest">Compliance</h3>
            <p className="text-2xl font-black tracking-tighter">Secure</p>
          </Card>
          <Card className="glass-panel border-none p-6 text-center space-y-2">
            <Volume2 className="h-5 w-5 mx-auto text-primary" />
            <h3 className="font-black text-[9px] uppercase tracking-widest">Engine</h3>
            <p className="text-2xl font-black tracking-tighter">ZA-L4</p>
          </Card>
        </div>
        <footer className="z-10 text-center max-w-md">
          <p className="text-sm text-muted-foreground font-black italic">"Confirming 450kg of Copper Grade A. Compliance audit sequence initiated."</p>
        </footer>
      </div>
    </PageLayout>
  );
}
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl", className)}>
      {children}
    </div>
  );
}