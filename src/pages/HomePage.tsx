import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, BarChart, HardHat, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Toaster } from "sonner";
export function HomePage() {
  return (
    <div className="min-h-screen w-full bg-[#0B0B0B] text-white overflow-hidden">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      <div className="absolute left-0 top-0 h-96 w-96 bg-[#38761d]/20 blur-[120px] -z-20"></div>
      <div className="absolute right-0 bottom-0 h-96 w-96 bg-[#38761d]/20 blur-[120px] -z-20"></div>
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <HardHat className="text-[#38761d] h-8 w-8" />
          <h1 className="text-xl font-bold tracking-tighter">SuiteWaste OS</h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="relative top-0 right-0" />
          <Button asChild className="hidden sm:flex bg-[#38761d] text-white hover:bg-[#2f6a1a] transition-colors">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-24 md:py-32 lg:py-40 text-center">
          <div className="animate-fade-in space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-balance">
              Edge Weighing & Compliance <br /> for Modern Waste Management
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-400 text-balance">
              An offline-first PWA for industrial weight capture, inventory ledger, and EPR-compliant transactions, built on the Cloudflare stack.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild className="bg-[#38761d] text-white hover:bg-[#2f6a1a] h-12 px-8 text-base font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-[#38761d]/20">
                <Link to="/quick-weight">
                  Go to Quick-Weight POS <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-gray-700 hover:bg-gray-900 h-12 px-8 text-base font-semibold transition-colors">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
        <section id="features" className="py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<LinkIcon className="h-8 w-8 text-[#38761d]" />}
              title="Offline-First Reliability"
              description="Capture data even during load-shedding. All transactions are queued locally and synced automatically when connectivity returns."
            />
            <FeatureCard
              icon={<HardHat className="h-8 w-8 text-[#38761d]" />}
              title="Hardware Agnostic"
              description="Connect to any industrial scale with a serial output via the Web Serial API. No drivers, no fuss. Just plug and play."
            />
            <FeatureCard
              icon={<BarChart className="h-8 w-8 text-[#38761d]" />}
              title="Compliance Built-in"
              description="Embed South African EPR/WEEE compliance metadata directly into your inventory ledger and transaction records for audit-ready reporting."
            />
          </div>
        </section>
      </main>
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">
        <p>Built with ❤��� at Cloudflare</p>
      </footer>
      <Toaster richColors theme="dark" />
    </div>
  );
}
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}
function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 text-center flex flex-col items-center transform hover:-translate-y-2 transition-transform duration-300 ease-in-out">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}