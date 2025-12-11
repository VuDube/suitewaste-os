import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { useOfflineStore } from '@/stores/useOfflineStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Send, Hash, Bell, Terminal, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
const channels = [
  { id: 'general', name: 'General', icon: Hash },
  { id: 'logistics', name: 'Logistics', icon: Terminal },
  { id: 'system', name: 'Notifications', icon: Bell, isSystem: true },
];
export function Chat() {
  const username = useAuthStore(s => s.user?.username);
  const hasChatAccess = useAuthStore(s => s.user?.features?.includes('chat-access'));
  const pendingLedgerCount = useOfflineStore(s => s.pendingLedgerEntries.length);
  const pendingTransactionCount = useOfflineStore(s => s.pendingTransactions.length);
  const totalPending = pendingLedgerCount + pendingTransactionCount;
  const [activeChannel, setActiveChannel] = useState('general');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([
    { id: 1, channel: 'general', user: 'Admin', text: 'SuiteWaste Chat Online.', timestamp: '08:00 AM', avatar: 'https://github.com/shadcn.png' },
  ]);
  useEffect(() => {
    if (totalPending > 0) {
      setChatHistory(prev => [...prev, {
        id: Date.now(),
        channel: 'system',
        user: 'SYNC',
        text: `${totalPending} items pending sync.`,
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);
    }
  }, [totalPending]);
  if (!hasChatAccess) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
          <ShieldAlert className="h-20 w-20 text-destructive mx-auto" />
          <h2 className="text-3xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">Chat access flag required.</p>
        </div>
      </PageLayout>
    );
  }
  const handleSend = () => {
    if (!message.trim()) return;
    setChatHistory(prev => [...prev, {
      id: Date.now(),
      channel: activeChannel,
      user: username || 'You',
      text: message,
      timestamp: new Date().toLocaleTimeString(),
      isSender: true
    }]);
    setMessage('');
  };
  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto h-[calc(100dvh-12rem)] border rounded-3xl overflow-hidden flex bg-card/60 backdrop-blur-xl">
        <div className="w-64 border-r hidden md:flex flex-col bg-secondary/20">
          <header className="p-6 border-b">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Channels</h2>
          </header>
          <ScrollArea className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {channels.map(chan => (
                <button
                  key={chan.id}
                  onClick={() => setActiveChannel(chan.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold truncate",
                    activeChannel === chan.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <chan.icon className="h-4 w-4" />
                  <span className="truncate">{chan.name}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
        <div className="flex-1 flex flex-col">
          <header className="h-16 px-6 border-b flex items-center justify-between">
            <span className="font-black uppercase tracking-tighter text-lg">#{activeChannel}</span>
            <Badge variant="outline">ENCRYPTED</Badge>
          </header>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {chatHistory.filter(m => m.channel === activeChannel || m.channel === 'system').map((msg) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className={cn("flex items-start gap-4", msg.isSender ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("space-y-1", msg.isSender ? "items-end text-right" : "items-start")}>
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase text-muted-foreground">
                      <span>{msg.user}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-2xl text-sm font-medium max-w-sm",
                      msg.isSender ? "bg-primary text-primary-foreground" : 
                      msg.isSystem ? "bg-emerald-500/5 text-emerald-500" : "bg-secondary/50"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
          <footer className="p-6 border-t bg-card/40">
            <div className="max-w-4xl mx-auto flex gap-4">
              <Input
                placeholder="Message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="h-14 rounded-2xl"
              />
              <Button onClick={handleSend} className="h-14 w-14 rounded-2xl" size="icon">
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </footer>
        </div>
      </div>
    </PageLayout>
  );
}