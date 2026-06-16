import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNavigation } from '../context/NavigationContext.js';
import { GlassCard } from '../components/GlassCard.js';
import { UserCheck, Mail, KeyRound, Loader2, Sparkles, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const { navigate } = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all requested fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        navigate('dashboard');
      } else {
        setError(data.error || 'Registration failed. Please attempt again.');
      }
    } catch (err) {
      console.error('Registration link failed', err);
      setError('Network communication failure. Please verify server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] w-full text-white bg-slate-950 flex items-center justify-center py-12 px-4 sm:px-6 relative">
      {/* Background Decorative Glares */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="max-w-md w-full space-y-6">
        <GlassCard className="p-8 border-slate-900/60 shadow-3xl">
          
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-cyan-950/20 text-cyan-400 border border-cyan-800/20 mb-2">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Create your SaaS Account
            </h2>
            <p className="text-xs text-slate-400">
              Set up your profile to start parsing travel booking receipts.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start space-x-2.5 bg-red-950/20 border border-red-900/40 p-3.5 rounded-xl text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-slate-950/60 border border-slate-900 focus:border-cyan-550/40 text-slate-200 placeholder-slate-650 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/60 border border-slate-900 focus:border-cyan-550/40 text-slate-200 placeholder-slate-650 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-950/60 border border-slate-900 focus:border-cyan-550/40 text-slate-200 placeholder-slate-650 text-sm pl-10 pr-4 py-2.5 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold py-2.5 rounded-xl shadow-lg shadow-cyan-950/25 transition-all duration-200 disabled:opacity-50 focus:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </form>

          {/* Login reference */}
          <div className="mt-6 pt-5 border-t border-slate-900/60 text-center">
            <span className="text-xs text-slate-500">Already have an active account? </span>
            <button
              onClick={() => navigate('login')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Log in instead
            </button>
          </div>

        </GlassCard>
      </div>
    </div>
  );
}
