import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSigningIn(true);
    setTimeout(() => {
      onLogin(email, password);
      setIsSigningIn(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-80 pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto space-y-8 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2.5 bg-red-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-red-500/20">
            <Shield className="w-6 h-6 fill-white text-white" />
            <span className="font-black tracking-wider text-base uppercase">GARANKA ADMIN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Administrator Sign In
          </h1>
          <p className="text-sm text-slate-600">
            Enter your credentials to access the security operations workspace.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aegissec.co.za"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <Lock className="w-4 h-4" />
              {isSigningIn ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
