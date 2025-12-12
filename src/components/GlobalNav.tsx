import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { HardHat, Menu, X, LayoutDashboard, Weight, Users, BookOpen, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/quick-weight', label: 'Quick-Weight', icon: Weight },
  { href: '/suppliers', label: 'Suppliers', icon: Users },
  { href: '/ledger', label: 'Ledger', icon: BookOpen },
  { href: '/transactions', label: 'Transactions', icon: BookOpen },
  { href: '/hardware', label: 'Hardware', icon: Settings2 },
];
export function GlobalNav() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const NavLinks = ({ className }: { className?: string }) => (
    navItems.map((item) => (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            className
          )
        }
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </NavLink>
    ))
  );
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <HardHat className="h-7 w-7 text-primary" />
              <span className="text-lg font-bold tracking-tighter">SuiteWaste OS</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <NavLinks />
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="relative top-0 right-0" />
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full max-w-xs">
                  <div className="flex justify-between items-center mb-6">
                    <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                      <HardHat className="h-7 w-7 text-primary" />
                      <span className="text-lg font-bold tracking-tighter">SuiteWaste OS</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                      <X className="h-6 w-6" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </div>
                  <nav className="flex flex-col gap-2">
                    <NavLinks className="text-base" />
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}