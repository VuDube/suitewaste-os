import React, { useState } from 'react';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMultiScale } from '@/hooks/useMultiScale';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Cable, Camera, CheckCircle, CircleDashed, Loader2, XCircle, Activity, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
export function HardwareIntegrations() {
  const { weight, status, connect, disconnect, devices } = useMultiScale();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);
  const handleSnapshot = async () => {
    setIsFetchingImage(true);
    setImageUrl(null);
    try {
      const res = await api<{ imageUrl: string }>('/api/camera/snapshot');
      setImageUrl(res.imageUrl);
      toast.success("Industrial snapshot captured!");
    } catch (error) {
      toast.error("Camera proxy error", { description: error instanceof Error ? error.message : 'Connection failed' });
    } finally {
      setIsFetchingImage(false);
    }
  };
  const statusIndicator = {
    disconnected: <XCircle className="h-5 w-5 text-red-500" />,
    connecting: <CircleDashed className="h-5 w-5 text-yellow-500 animate-spin" />,
    connected: <CheckCircle className="h-5 w-5 text-green-500" />,
    parsing: <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    failover: <Activity className="h-5 w-5 text-orange-500 animate-bounce" />,
  };
  return (
    <PageLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight">Hardware Engine</h1>
          <p className="text-muted-foreground mt-1 text-lg">Device management and diagnostic center.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="shadow-glow shadow-primary/10 border-primary/20 bg-card/60">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-bold">Active Scale Interface</CardTitle>
                <div className="flex items-center gap-2 text-sm font-bold capitalize">
                  {statusIndicator[status]}
                  <span className={status === 'failover' ? 'text-orange-500' : ''}>{status}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-12 bg-black/40 border border-primary/5 rounded-2xl">
                  <span className={cn(
                    "font-mono font-bold tracking-tighter transition-all duration-300",
                    "text-[clamp(4rem,12vw,8rem)]",
                    status === 'connected' || status === 'parsing' ? 'text-primary' : 'text-muted-foreground/30'
                  )}>
                    {weight.toFixed(2)}
                  </span>
                  <span className="text-2xl font-bold ml-2 text-muted-foreground">kg</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button onClick={connect} disabled={status === 'connected' || status === 'connecting'} className="h-14 text-lg font-bold">
                    <Cable className="mr-2 h-5 w-5" /> Connect Scale
                  </Button>
                  <Button onClick={disconnect} disabled={status === 'disconnected'} variant="destructive" className="h-14 text-lg font-bold">
                    <XCircle className="mr-2 h-5 w-5" /> Disconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/40 border-border">
              <CardHeader><CardTitle className="text-lg font-bold">Device Health Inventory</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {devices.length > 0 ? devices.map(d => (
                    <div key={d.id} className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border border-border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{d.name}</span>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold">{d.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Last Ping: {format(d.lastSeen, 'HH:mm:ss')}</p>
                      </div>
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    </div>
                  )) : (
                    <p className="text-center py-4 text-muted-foreground italic text-sm">No devices paired to this terminal.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card className="bg-card/60 shadow-md">
            <CardHeader><CardTitle className="text-xl font-bold">Industrial IP Camera</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-black/60 rounded-2xl flex items-center justify-center relative overflow-hidden group border border-border">
                {isFetchingImage ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Fetching Frame...</span>
                  </div>
                ) : imageUrl ? (
                  <img src={imageUrl} alt="Camera Snapshot" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="text-center space-y-2">
                    <Camera className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">Camera Feed Standby</p>
                  </div>
                )}
                {imageUrl && <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-tighter">Live Still</div>}
              </div>
              <Button onClick={handleSnapshot} disabled={isFetchingImage} className="w-full h-14 text-lg font-bold shadow-glow shadow-primary/20">
                {isFetchingImage ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Camera className="mr-2 h-6 w-6" />}
                Capture Verification Snapshot
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}