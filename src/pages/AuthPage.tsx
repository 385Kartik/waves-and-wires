import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'forgot' | 'verify';

export default function AuthPage() {
  const { signIn, signUp, resetPassword, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle email verification redirect from Supabase
  useEffect(() => {
    const verified = searchParams.get('verified');
    const reset = searchParams.get('reset');
    if (verified === 'true') {
      setMode('signin');
      // Toast is shown by supabase auth state change
    }
    if (reset === 'true') {
      setMode('signin');
    }
  }, [searchParams]);

  const [mode, setMode] = useState<AuthMode>(user && !user.email_verified ? 'verify' : 'signin');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let success = false;

    switch (mode) {
      case 'signin':
        success = await signIn(email, password);
        if (success) navigate('/');
        break;
      case 'signup':
        success = await signUp(email, password, fullName);
        if (success) setMode('verify');
        break;
      case 'forgot':
        await resetPassword(email);
        setMode('signin');
        break;
      case 'verify':
        // With Supabase, email verification is handled via the email link
        // This mode just shows a "check your email" message
        success = true;
        if (success) navigate('/');
        break;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-card p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-extrabold text-primary-foreground">W&W</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'verify' && 'Verify Email'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'signin' && 'Welcome back to Waves & Wires'}
              {mode === 'signup' && 'Join us for exclusive deals'}
              {mode === 'forgot' && "We'll send you a reset link"}
              {mode === 'verify' && 'Enter the verification token from your email'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-md border border-input bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {mode !== 'verify' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-input bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {(mode === 'signin' || mode === 'signup') && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-input bg-secondary py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'verify' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Verification Token</label>
                <div className="relative">
                  <CheckCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="Enter 6-character token"
                    className="w-full rounded-md border border-input bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            )}

            {mode === 'signin' && (
              <div className="text-right">
                <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-fast hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Please wait...' : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  {mode === 'verify' && 'Verify Email'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signin' && (
              <>Don't have an account?{' '}<button onClick={() => setMode('signup')} className="text-primary hover:underline">Sign up</button></>
            )}
            {mode === 'signup' && (
              <>Already have an account?{' '}<button onClick={() => setMode('signin')} className="text-primary hover:underline">Sign in</button></>
            )}
            {(mode === 'forgot' || mode === 'verify') && (
              <button onClick={() => setMode('signin')} className="text-primary hover:underline">Back to Sign In</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
