
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, ArrowRight, Loader2, Shield, Users, ArrowLeft, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type LoginStep = 'PROJECT' | 'ROLE' | 'AUTH';
type Role = 'admin' | 'coordinator';

export default function Login() {
    const { login, loginAsGuest } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [step, setStep] = useState<LoginStep>('PROJECT');
    const [projectSlug, setProjectSlug] = useState('');
    const [projectName, setProjectName] = useState('');
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Auth Inputs
    const [adminEmail, setAdminEmail] = useState('');
    const [authPayload, setAuthPayload] = useState(''); // Password or Code

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 1: Verify Project Exists
    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectSlug.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const { data, error } = await supabase
                .from('projects')
                .select('name')
                .eq('slug', projectSlug.trim())
                .single();

            if (error || !data) {
                setError(t('login.invalidUser', 'Access denied. Unknown project.'));
            } else {
                setProjectName(data.name);
                setStep('ROLE');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Role Selection
    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
        setStep('AUTH');
        setError('');
        setAuthPayload('');
    };

    // Step 3: Final Authentication
    const handleAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (selectedRole === 'admin') {
                const success = await login(adminEmail, authPayload);
                if (success) {
                    navigate('/app');
                } else {
                    setError('Invalid credentials');
                }
            } else {
                // Verify Coordinator Code via RPC
                const { data, error } = await supabase.rpc('verify_project_coordinator_code', {
                    project_slug: projectSlug,
                    code_attempt: authPayload
                });

                if (error) {
                    console.error('RPC Error:', error);
                    setError('Verification failed');
                } else if (data === true) {
                    loginAsGuest(); // Log in as coordinator
                    navigate('/app');
                } else {
                    setError(t('login.invalidCode', 'Invalid access code'));
                }
            }
        } catch (err) {
            console.error(err);
            setError('Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        if (step === 'AUTH') setStep('ROLE');
        if (step === 'ROLE') setStep('PROJECT');
        setError('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative px-4">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary/40 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-scale-in">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-primary mb-2">Commendatore</h1>
                    <p className="text-muted-foreground font-light">{t('login.welcome', 'Welcome back')}</p>
                </div>

                <Card className="border-border/50 shadow-elevated bg-white/80 backdrop-blur-xl transition-all duration-500">
                    <CardHeader className="relative">
                        {step !== 'PROJECT' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-4 top-4 h-8 w-8 hover:bg-slate-100/50"
                                onClick={handleBack}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        )}
                        <CardTitle className="text-center text-xl font-serif">
                            {step === 'PROJECT' && t('login.portalAccess', 'Portal Access')}
                            {step === 'ROLE' && projectName}
                            {step === 'AUTH' && (selectedRole === 'admin' ? 'Admin Login' : 'Coordinator Access')}
                        </CardTitle>
                        <CardDescription className="text-center">
                            {step === 'PROJECT' && t('login.enterUsername', 'Enter your unique username to continue')}
                            {step === 'ROLE' && 'Select your role to continue'}
                            {step === 'AUTH' && 'Verify your credentials'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* STEP 1: PROJECT ID */}
                        {step === 'PROJECT' && (
                            <form onSubmit={handleProjectSubmit} className="space-y-4 animate-fade-in">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Username (e.g. chiaraefer)"
                                            className="pl-9 bg-white/50 border-input/60 focus:bg-white transition-colors py-5"
                                            value={projectSlug}
                                            onChange={(e) => {
                                                setProjectSlug(e.target.value);
                                                setError('');
                                            }}
                                            autoFocus
                                        />
                                    </div>
                                    {error && <p className="text-xs text-destructive text-center font-medium animate-pulse">{error}</p>}
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full py-6 text-base shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium rounded-lg"
                                    disabled={isLoading || !projectSlug}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">{t('login.continue', 'Continue')} <ArrowRight className="w-4 h-4 ml-1" /></span>}
                                </Button>
                            </form>
                        )}

                        {/* STEP 2: ROLE SELECTION */}
                        {step === 'ROLE' && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div
                                    onClick={() => handleRoleSelect('coordinator')}
                                    className="cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Coordinator</h3>
                                        <p className="text-xs text-muted-foreground">Team Access</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => handleRoleSelect('admin')}
                                    className="cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all text-center group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Shield className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm">Admin</h3>
                                        <p className="text-xs text-muted-foreground">Full Control</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: AUTH */}
                        {step === 'AUTH' && (
                            <form onSubmit={handleAuthSubmit} className="space-y-4 animate-fade-in">
                                {selectedRole === 'admin' ? (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Email"
                                                type="email"
                                                className="pl-9"
                                                value={adminEmail}
                                                onChange={(e) => setAdminEmail(e.target.value)}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Password"
                                                type="password"
                                                className="pl-9"
                                                value={authPayload}
                                                onChange={(e) => setAuthPayload(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Enter Access Code"
                                                type="password"
                                                className="pl-9 py-5 text-center tracking-widest text-lg font-serif"
                                                value={authPayload}
                                                onChange={(e) => setAuthPayload(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground">Enter the code provided by the couple.</p>
                                    </div>
                                )}

                                {error && <p className="text-xs text-destructive text-center font-medium animate-pulse">{error}</p>}

                                <Button
                                    type="submit"
                                    className="w-full py-6 text-base shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium rounded-lg"
                                    disabled={isLoading || !authPayload || (selectedRole === 'admin' && !adminEmail)}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Login</span>}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-xs text-muted-foreground/60">
                    <p>{t('login.secureConnection', 'Secured via SSL')}</p>
                </div>
            </div>
        </div>
    );
}
