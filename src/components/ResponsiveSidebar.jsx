import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Home,
  Users,
  Settings,
  CreditCard,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: Home },
  { name: 'Profil', href: 'Profile', icon: Users },
  { name: 'Analytics', href: 'Analytics', icon: BarChart3 },
  { name: 'Abrechnung', href: 'Billing', icon: CreditCard },
  { name: 'Einstellungen', href: 'Settings', icon: Settings }
];

function SidebarContent({ onNavigate, collapsed = false }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="flex flex-col gap-1 p-3">
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath.includes(item.href);

        return (
          <Link
            key={item.name}
            to={createPageUrl(item.href)}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'hover:bg-gray-100',
              isActive ? 'bg-blue-100 text-blue-900 font-medium' : 'text-gray-700',
              collapsed && 'justify-center'
            )}
          >
            <Icon className={cn('w-5 h-5', collapsed ? '' : 'flex-shrink-0')} />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function ResponsiveSidebar({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center px-4 z-30">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-lg">Navigation</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <h1 className="ml-3 font-bold text-lg">FinTuttO</h1>
      </div>

      {/* Desktop Sidebar - Full */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h2 className="font-bold text-xl">FinTuttO</h2>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}