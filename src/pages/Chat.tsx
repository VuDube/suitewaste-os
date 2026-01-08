import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, Send, Hash, Bell, Terminal, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
const channels = [
  { id: 'general', name: 'General', icon: Hash },
  { id: 'logistics', name: 'Logistics', icon: Terminal },
  { id: 'finance', name: 'Finance', icon: Hash },
  { id: 'system', name: 'System Notifications', icon: Bell, isSystem: true },
];
export function Chat() {
  const user = useAuthStore(s => s.user);
  const totalPending = useOfflineStore(s => s.totalPending());
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { id: 1, channel: 'general', user: 'Admin', text: 'Welcome to SuiteWaste OS Chat.', timestamp: '08:00 AM', avatar: 'https://github.com/shadcn.png' },
    { id: 2, channel: 'system', user: 'SYSTEM', text: 'Daily database backup finalized.', timestamp: '04:00 AM', isSystem: true },
  ]);
  const hasChatAccess = user?.features?.includes('chat-access');
  useEffect(() => {
    if (totalPending > 0) {
      const sysMsg = { id: Date.now(), channel: 'system', user: 'SYNC', text: `Local queue: ${totalPending} items pending synchronization.`, timestamp: new Date().toLocaleTimeString(), isSystem: true };
      setChatHistory(prev => [...prev, sysMsg]);
    }
  }, [totalPending]);
  if (!hasChatAccess) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
          <ShieldAlert className="h-20 w-20 text-destructive mx-auto" />
          <h2 className="text-3xl font-bold">Communication Restricted</h2>
          <p className="text-muted-foreground">Industrial communication channels require "chat-access" feature flags.</p>
        </div>
      </PageLayout>
    );
  }
  const handleSend = () => {
    if (!message.trim()) return;
    const newMsg = { id: Date.now(), channel: activeChannel, user: user?.username || 'You', text: message, timestamp: new Date().toLocaleTimeString(), isSender: true };
    setChatHistory(prev => [...prev, newMsg]);
    setMessage('');
  };
  const filteredMessages = chatHistory.filter(m => m.channel === activeChannel);
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto h-[calc(100dvh-12rem)] border border-border rounded-3xl overflow-hidden flex bg-card/60 backdrop-blur-xl shadow-2xl">
        {/* Sidebar */}
        <div className="w-64 border-r border-border/50 bg-secondary/20 hidden md:flex flex-col">
          <header className="p-6 border-b border-border/50">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Channels</h2>
          </header>
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {channels.map(chan => (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannel(chan.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all",
                    activeChannel === chan.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <chan.icon className="h-4 w-4" />
                  {chan.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <header className="h-16 px-6 border-b border-border/50 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-3">
              <span className="font-black uppercase tracking-tighter text-lg">{activeChannel}</span>
              <Badge variant="outline" className="text-[10px] font-bold">ENCRYPTED</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
              <Users className="h-4 w-4" /> 12 Online
            </div>
          </header>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {filteredMessages.map((msg) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("flex items-start gap-4", msg.isSender ? "flex-row-reverse" : "flex-row")}>
                  {!msg.isSender && !msg.isSystem && (
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={msg.avatar} />
                      <AvatarFallback className="bg-primary text-white font-black">{msg.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  {msg.isSystem && <div className="p-2 rounded-lg bg-secondary/50"><Bell className="h-4 w-4 text-primary" /></div>}
                  <div className={cn("space-y-1", msg.isSender ? "items-end text-right" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{msg.user}</span>
                      <span className="text-[10px] text-muted-foreground/50">{msg.timestamp}</span>
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm font-medium max-w-sm md:max-w-md",
                      msg.isSender ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10 rounded-tr-none" : 
                      msg.isSystem ? "bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 font-bold" : "bg-secondary/50 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          <footer className="p-6 border-t border-border/50 bg-card/40">
            <div className="max-w-4xl mx-auto flex items-center gap-4">
              <div className="flex-1 relative">
                <Input
                  placeholder={`Message #${activeChannel}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="h-14 bg-secondary/30 border-none rounded-2xl px-6 focus-visible:ring-primary/40 font-medium"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground/40">
                  <span className="text-[10px] font-black uppercase tracking-tighter">Enter to send</span>
                </div>
              </div>
              <Button onClick={handleSend} className="h-14 w-14 rounded-2xl shadow-lg shadow-primary/20" size="icon">
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </PageLayout>
  );
}