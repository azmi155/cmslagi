import * as React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { 
  Monitor, 
  Users, 
  Settings, 
  LogOut, 
  Activity,
  Wifi,
  BarChart3,
  Palette,
  FolderOpen,
  Network,
  Globe
} from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/', icon: BarChart3 },
    { name: 'Devices', href: '/devices', icon: Monitor },
    { name: 'Topology', href: '/topology', icon: Network },
    { name: 'WAN Monitoring', href: '/wan-monitoring', icon: Globe },
    { name: 'Hotspot Users', href: '/hotspot-users', icon: Wifi },
    { name: 'PPPoE Users', href: '/pppoe-users', icon: Users },
    { name: 'Profile Management', href: '/profile-management', icon: FolderOpen },
    { name: 'Monitoring', href: '/monitoring', icon: Activity },
    { name: 'Branding', href: '/branding', icon: Palette },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="hidden md:flex md:w-64 md:flex-col">
          <div className="flex flex-col flex-grow pt-5 bg-card border-r overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-foreground">
                Network Manager
              </h1>
            </div>
            <div className="mt-8 flex-grow flex flex-col">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-sm font-medium rounded-md
                        ${isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex-shrink-0 p-4">
                <div className="flex items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="ml-2"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
