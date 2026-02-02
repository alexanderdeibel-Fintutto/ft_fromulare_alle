import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { LogOut, Settings, User, CreditCard, Building2, Scale, Calculator, LayoutDashboard } from 'lucide-react';
import useAuth from './useAuth';
import useSubscription from './useSubscription';
import OrgSwitcher from './OrgSwitcher';
import DarkModeToggle from './DarkModeToggle';
import { Badge } from '@/components/ui/badge';

export default function NavBar() {
    const { user, logout } = useAuth();
    const { tier } = useSubscription();

    const tierColors = {
        free: 'bg-gray-100 text-gray-800',
        starter: 'bg-blue-100 text-blue-800',
        basic: 'bg-green-100 text-green-800',
        pro: 'bg-purple-100 text-purple-800',
        business: 'bg-yellow-100 text-yellow-800'
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
        { name: 'Rechner', icon: Calculator, page: 'Tool' },
        { name: 'Mietrecht', icon: Scale, page: 'MietrechtAssistent' },
    ];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-8">
                        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">FinTuttO</span>
                        </Link>
                        
                        {user && (
                            <div className="hidden md:flex items-center gap-1">
                                {navItems.map((item) => (
                                    <Link key={item.page} to={createPageUrl(item.page)}>
                                        <Button variant="ghost" size="sm" className="gap-2 text-gray-600 hover:text-gray-900">
                                            <item.icon className="w-4 h-4" />
                                            {item.name}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="flex items-center gap-4">
                            <OrgSwitcher />
                            
                            <Badge className={tierColors[tier] || tierColors.free}>
                                {tier.toUpperCase()}
                            </Badge>
                            
                            <Link to={createPageUrl('Profile')}>
                                <Button variant="ghost" size="icon">
                                    <User className="w-5 h-5" />
                                </Button>
                            </Link>

                            <Link to={createPageUrl('Billing')}>
                                <Button variant="ghost" size="icon">
                                    <CreditCard className="w-5 h-5" />
                                </Button>
                            </Link>

                            <Link to={createPageUrl('Settings')}>
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </Link>

                            <DarkModeToggle />

                            <Button variant="ghost" size="icon" onClick={logout}>
                                <LogOut className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}