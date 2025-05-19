
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart,
  Users,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  CalendarCheck,
  Gamepad,
  Calculator,
  Settings
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isActive }: SidebarItemProps) => (
  <Link
    to={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
      isActive 
        ? "bg-primary text-primary-foreground" 
        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState<string>("");
  
  useEffect(() => {
    if (user?.user_metadata?.username) {
      setUsername(user.user_metadata.username);
    }
  }, [user]);

  const navItems = [
    {
      icon: <LayoutDashboard size={18} />,
      label: "Tableau de bord",
      href: "/dashboard"
    },
    {
      icon: <Users size={18} />,
      label: "Joueurs",
      href: "/players"
    },
    {
      icon: <BarChart size={18} />,
      label: "Statistiques",
      href: "/statistics"
    },
    {
      icon: <CalendarCheck size={18} />,
      label: "Présences",
      href: "/attendance"
    },
    {
      icon: <Gamepad size={18} />,
      label: "Matchs",
      href: "/games"
    },
    {
      icon: <Calculator size={18} />,
      label: "Moyennes",
      href: "/averages"
    },
    {
      icon: <Settings size={18} />,
      label: "Paramètres",
      href: "/settings"
    }
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 md:translate-x-0 md:static md:z-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full py-6">
          <div className="px-6 mb-8">
            <Link to="/dashboard" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <BarChart size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold">Basketball Stats</h1>
            </Link>
          </div>

          <div className="px-3 space-y-1 flex-1">
            {navItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isActive={location.pathname === item.href}
              />
            ))}
          </div>

          <div className="px-3 mt-6 border-t pt-4 dark:border-gray-700">
            <div className="px-3 mb-2 text-sm text-muted-foreground">
              Connecté en tant que <span className="font-semibold">{username}</span>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => signOut()}
            >
              <LogOut size={18} className="mr-3" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content area with scroll */}
        <main 
          className="flex-1 overflow-y-auto p-6 md:p-8" 
          onClick={closeMobileMenu}
        >
          <div className="container mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
