import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSerialScale } from "@/hooks/useSerialScale";
import { cn } from "@/lib/utils";
import { Cable, CheckCircle, CircleDashed, XCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
export function QuickWeightPOS() {
  const { weight, status, connect } = useSerialScale();
  const handleConnect = () => {
    // In a real scenario, the connect function would be async
    // and might throw an error which we would catch here.
    toast.info("Attempting to connect to scale...");
    connect();
  };
  const handleCapture = () => {
    if (status !== 'connected' || weight <= 0) {
      toast.error("Cannot capture weight.", {
        description: "Please connect to a scale and ensure weight is greater than zero.",
      });
      return;
    }
    toast.success("Weight Captured!", {
      description: `${weight.toFixed(2)} kg has been recorded locally.`,
    });
    // Here you would queue the transaction to IndexedDB
  };
  const statusIndicator = {
    disconnected: <XCircle className="h-5 w-5 text-red-500" />,
    connecting: <CircleDashed className="h-5 w-5 text-yellow-500 animate-spin" />,
    connected: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
  };
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column: Weight Readout & Actions */}
          <div className="md:col-span-2">
            <Card className="bg-[#1a1a1a]/50 border-gray-700 backdrop-blur-sm shadow-2xl shadow-black/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium text-gray-300">Live Weight</CardTitle>
                <div className="flex items-center gap-2 text-sm capitalize text-gray-400">
                  {statusIndicator[status]}
                  {status}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="relative w-full text-center mb-6">
                  <span
                    className={cn(
                      "font-mono font-bold tabular-nums transition-colors duration-300",
                      "text-7xl sm:text-8xl md:text-9xl",
                      status === 'connected' ? "text-white" : "text-gray-600"
                    )}
                  >
                    {weight.toFixed(2)}
                  </span>
                  <span className="absolute bottom-1 right-0 text-2xl md:text-4xl font-medium text-gray-500">kg</span>
                </div>
                <div className="w-full flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-[#38761d] text-white hover:bg-[#2f6a1a] h-14 text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95 focus:ring-2 focus:ring-[#38761d]/40"
                    onClick={handleCapture}
                    disabled={status !== 'connected'}
                  >
                    Capture Weight
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 border-gray-600 hover:bg-gray-800 hover:text-white h-14 text-lg font-semibold transition-all"
                    onClick={handleConnect}
                  >
                    <Cable className="mr-2 h-5 w-5" />
                    Connect Device
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Right Column: Transaction Details */}
          <div className="md:col-span-1">
            <Card className="bg-[#1a1a1a]/50 border-gray-700 h-full">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-300">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="supplier" className="text-sm font-medium text-gray-400 mb-1 block">Supplier</label>
                  <Input id="supplier" placeholder="Search for a supplier..." className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-[#38761d]" />
                </div>
                <div>
                  <label htmlFor="material" className="text-sm font-medium text-gray-400 mb-1 block">Material Type</label>
                  <Input id="material" placeholder="e.g., Copper Wire" className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-[#38761d]" />
                </div>
                <div>
                  <label htmlFor="notes" className="text-sm font-medium text-gray-400 mb-1 block">Notes</label>
                  <Textarea id="notes" placeholder="Optional notes..." className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-[#38761d]" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster richColors theme="dark" />
    </div>
  );
}