import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const login = useAppStore(s => s.login);
  const register = useAppStore(s => s.register);
  const [isSignUp, setIsSignUp] = useState(false);

  // Login inputs
  const [email, setEmail] = useState('admin@school.edu');
  const [password, setPassword] = useState('admin123');

  // Signup inputs
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [role, setRole] = useState('admin');

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const ok = await register(name, signupEmail, signupPassword, role);
      setLoading(false);
      if (ok) {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Registration failed. Make sure the email is unique.');
      }
    } else {
      const ok = await login(email, password);
      setLoading(false);
      if (ok) {
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials. Try admin@school.edu / admin123');
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg shadow-primary/20">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">EduCore ERP</h1>
          <p className="text-sm text-muted-foreground mt-1">Intelligent School Administration</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">{isSignUp ? 'Create an account' : 'Sign in'}</h2>
          <p className="text-sm text-muted-foreground mb-5">
            {isSignUp ? 'Register to access the school panel' : 'Access your school admin panel'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Rathish Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                placeholder="e.g. rathish@school.edu"
                value={isSignUp ? signupEmail : email}
                onChange={e => isSignUp ? setSignupEmail(e.target.value) : setEmail(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={isSignUp ? signupPassword : password}
                  onChange={e => isSignUp ? setSignupPassword(e.target.value) : setPassword(e.target.value)}
                  className="w-full h-9 px-3 pr-9 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="role">Role</label>
                <select
                  id="role"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="admin">Administrator</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? (isSignUp ? 'Registering...' : 'Signing in…') : (isSignUp ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-primary hover:underline font-medium cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {!isSignUp && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground font-medium mb-1">Demo credentials</p>
              <p className="text-xs text-muted-foreground">admin@school.edu / admin123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
