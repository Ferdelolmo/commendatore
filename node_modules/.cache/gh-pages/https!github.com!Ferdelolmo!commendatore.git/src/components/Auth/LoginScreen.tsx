import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Shield, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function LoginScreen() {
  const { login, loginAsGuest } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'coordinator' | 'admin' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole) return;

    if (selectedRole === 'admin') {
      setIsLoading(true);
      const success = await login(email, password);
      setIsLoading(false);
      if (!success) {
        setError('Invalid credentials. Please try again.');
        return;
      }
    } else {
      // Coordinator Login - Secure RPC Check
      setIsLoading(true);
      try {
        const { data, error: rpcError } = await supabase.rpc('verify_coordinator_code', {
          code_attempt: password
        });

        if (rpcError) {
          console.error('RPC Error:', rpcError);
          setError('Error verifying code. Please try again.');
        } else if (data === true) {
          loginAsGuest();
        } else {
          setError('Incorrect access code. Please try again.');
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRoleSelect = (role: 'coordinator' | 'admin') => {
    setSelectedRole(role);
    setError('');
    setPassword('');
    setEmail('');
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Header Content */}
      <div className="relative z-10 py-12 px-4 text-center">
        <div className="flex flex-col items-center justify-center gap-4 mb-4">
          <img
            src="https://i.imgur.com/72sI6FA.jpeg"
            alt="Logo"
            className="h-28 w-28 rounded-full border-4 border-white/30 object-cover shadow-2xl mb-2"
          />
          <h1 className="text-4xl md:text-5xl font-serif text-white font-bold drop-shadow-md tracking-wide">
            Commendatore
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light tracking-wider">
            Your Wedding Day Coordinator
          </p>
        </div>
        <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
          <p className="text-white text-lg font-medium">
            June 19-21, 2026 • Chiara e Fer
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8 animate-fade-in">
            <h2 className="text-2xl font-serif text-white mb-2 drop-shadow-md">Welcome</h2>
            <p className="text-white/80 text-lg">
              Select your role to access the wedding coordination system
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Coordinator Card */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl animate-slide-up backdrop-blur-sm bg-white/95 border-white/20 ${selectedRole === 'coordinator'
                ? 'ring-4 ring-primary/50 border-primary shadow-xl scale-[1.02]'
                : 'hover:scale-[1.02] hover:bg-white'
                }`}
              style={{ animationDelay: '0.1s' }}
              onClick={() => handleRoleSelect('coordinator')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-serif text-xl">Coordinator View</CardTitle>
                <CardDescription>
                  For on-site staff and volunteers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>• View all scheduled tasks</li>
                  <li>• Update task status in real-time</li>
                  <li>• Track progress throughout the day</li>
                </ul>
                <p className="text-xs text-primary font-medium">Access code required</p>
              </CardContent>
            </Card>

            {/* Admin Card */}
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-2xl animate-slide-up backdrop-blur-sm bg-white/95 border-white/20 ${selectedRole === 'admin'
                ? 'ring-4 ring-primary/50 border-primary shadow-xl scale-[1.02]'
                : 'hover:scale-[1.02] hover:bg-white'
                }`}
              style={{ animationDelay: '0.2s' }}
              onClick={() => handleRoleSelect('admin')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-serif text-xl">Admin Panel</CardTitle>
                <CardDescription>
                  For wedding organizers
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>• Full task management (CRUD)</li>
                  <li>• View completion statistics</li>
                  <li>• Add and edit tasks on-the-fly</li>
                </ul>
                <p className="text-xs text-warning font-medium">Password protected</p>
              </CardContent>
            </Card>
          </div>

          {/* Login Action */}
          {selectedRole && (
            <div className="mt-8 max-w-md mx-auto animate-fade-in">
              <Card>
                <CardContent className="pt-6">
                  {selectedRole === 'admin' ? (
                    <div className="space-y-4 mb-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                          }}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter admin password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          className="mt-2"
                        />
                      </div>
                      {error && (
                        <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 mb-4">
                      <div>
                        <Label htmlFor="secretCode">Secret Access Code</Label>
                        <Input
                          id="secretCode"
                          type="password"
                          placeholder="Enter current year to access"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          Enter the code shared by the couple (Hint: 2026)
                        </p>
                      </div>
                      {error && (
                        <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4" />
                          {error}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    disabled={
                      (selectedRole === 'admin' && (!password || !email || isLoading)) ||
                      (selectedRole === 'coordinator' && !password)
                    }
                  >
                    {isLoading ? 'Loading...' : (selectedRole === 'admin' ? 'Access Admin Panel' : 'Unlock Coordinator View')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 py-6 text-center text-sm text-white/60">
        <p>Your source of truth for wedding day execution</p>
      </div>
    </div>
  );
}
