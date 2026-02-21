import { useState, FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Store, Lock, User as UserIcon, Github, Linkedin, Coffee, Heart } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/pos" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(identifier, password);
      navigate('/pos');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#1e40af 1px, transparent 1px), radial-gradient(#1e40af 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px'
        }}
      />

      <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in duration-500">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">RG Store</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">Inventory & POS System</p>
        </div>

        <Card className="shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6 pt-8">
            <CardTitle className="text-xl font-bold text-center text-gray-900">Sign In</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Welcome back! Please enter your details.
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8 px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-0.5">
                  Username or Email
                </Label>
                <div className="relative group">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="name@company.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-0.5">
                    Password
                  </Label>
                  <button type="button" className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-3 py-2.5 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-1">
                  <div className="h-1 w-1 rounded-full bg-red-600" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>

          {/* Developer Credit Footer */}
          <div className="bg-gray-50/80 border-t border-gray-100 py-5 px-8">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 flex items-center gap-2">
                Built with <Coffee className="h-3 w-3 text-amber-700" /> and <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by
              </span>
              <div className="flex items-center gap-5">
                <a
                  href="https://louie.mendezdev.online/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Portfolio"
                >
                  <Store className="h-5 w-5" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all" />
                </a>
                <a
                  href="https://github.com/SimplyLouie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 text-gray-400 hover:text-gray-900 transition-colors"
                  title="GitHub"
                >
                  <Github className="h-5 w-5" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all" />
                </a>
                <a
                  href="https://www.linkedin.com/in/louie-mendez/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative p-2 text-gray-400 hover:text-[#0A66C2] transition-colors"
                  title="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#0A66C2] group-hover:w-full transition-all" />
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* System Info */}
        <p className="text-center text-[11px] text-gray-400 mt-8 font-medium">
          &copy; {new Date().getFullYear()} RG Store v1.0. All rights reserved.
        </p>
      </div>
    </div>
  );
}
