import { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Package,
  BarChart3,
  LogOut,
  Menu,
  X,
  Store,
  UserCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useToast } from '../hooks/use-toast';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/pos', label: 'POS', icon: ShoppingCart },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout, updateProfile } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.displayName) setNewDisplayName(user.displayName);
  }, [user?.displayName]);

  const handleUpdateProfile = async () => {
    if (!newDisplayName.trim()) return;
    setIsUpdating(true);
    try {
      await updateProfile({ displayName: newDisplayName });
      toast({ title: 'Profile updated' });
      setShowProfile(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating profile',
        description: err.message
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col overflow-x-hidden relative w-full">
      {/* Top navbar */}
      <header className="bg-blue-700 text-white shadow-lg sticky top-0 z-40 pt-[var(--sat,0px)]">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <span className="font-bold text-lg">RG Store</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    active ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 hover:bg-blue-600 px-2 py-1 rounded-md transition-colors text-left"
            >
              <UserCircle className="h-5 w-5 text-blue-100" />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-medium leading-none">{user?.displayName || 'Set Display Name'}</span>
                <span className="text-[10px] text-blue-200 leading-tight">{user?.email}</span>
              </div>
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-blue-100 hover:text-white hover:bg-blue-600 ml-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:ml-1 sm:block">Logout</span>
            </Button>
            <button
              className="md:hidden text-blue-100 hover:text-white p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-blue-600 px-2 pb-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full',
                    active ? 'bg-blue-900 text-white' : 'text-blue-100 hover:bg-blue-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Bottom nav for mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg pb-[var(--sab,0px)]">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex-1 flex flex-col items-center py-2 text-xs transition-colors',
                  active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5 mb-0.5', active && 'text-blue-600')} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0 px-[var(--sal,0px)] pr-[var(--sar,0px)] overflow-x-hidden w-full">
        {children}
      </main>

      {/* Profile Modal */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <p className="text-[10px] text-gray-500">
                This name will be displayed in the application header.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfile(false)}>Cancel</Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
