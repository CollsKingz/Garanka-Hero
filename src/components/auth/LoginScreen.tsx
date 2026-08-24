import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Phone, KeyRound, CheckCircle2, AlertCircle, Smartphone } from 'lucide-react';
import { auth } from '../../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getIdToken,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

export const LoginScreen: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [role, setRole] = useState('community');
  const [companyId, setCompanyId] = useState('comp-aegis');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  // Phone OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const initRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please resend SMS code.');
          },
        }
      );
    }
    return (window as any).recaptchaVerifier;
  };

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number in international format (e.g. +27825551204 or +16505553434).');
      return;
    }
    setError('');
    setStatusMessage('Initiating Phone Verification & sending SMS OTP...');
    setIsSigningIn(true);
    try {
      const appVerifier = initRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber.trim(), appVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setStatusMessage('SMS OTP sent successfully! Check your phone for the 6-digit code.');
    } catch (err: any) {
      console.error('Phone SMS OTP error:', err);
      if (err.code === 'auth/auth-domain-config-required' || err.message?.includes('admin-restricted-operation')) {
        setError('Firebase Phone Auth must be enabled in Firebase Console → Authentication → Sign-in method.');
      } else {
        setError(err.message || 'Failed to send SMS OTP. Ensure number is in +[country code][number] format.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !confirmationResult) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setError('');
    setIsSigningIn(true);
    setStatusMessage('Verifying Phone OTP...');
    try {
      await confirmationResult.confirm(otpCode);
      setIsPhoneVerified(true);
      setStatusMessage('Phone number verified successfully! You can now complete registration.');
    } catch (err: any) {
      console.error('OTP Verification error:', err);
      setError('Invalid SMS verification code. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsSigningIn(true);
    setError('');
    setStatusMessage('');

    try {
      if (isRegistering) {
        // Enforce phone OTP verification for new real users
        if (!isPhoneVerified && phoneNumber.trim()) {
          if (!otpSent) {
            await handleSendOtp();
            return;
          } else {
            await handleVerifyOtp();
            return;
          }
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const idToken = await getIdToken(userCred.user);

        // Set role via backend
        const res = await fetch('/api/admin/set-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ role, companyId, phoneNumber }),
        });

        if (!res.ok) {
          throw new Error('Account created, but failed to set security role on backend.');
        }

        // Force token refresh so the new claims take effect immediately
        await userCred.user.getIdToken(true);
        window.location.reload();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Failed to authenticate');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-50 rounded-full blur-3xl opacity-80 pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto space-y-6 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center gap-2.5 bg-red-600 text-white px-5 py-2 rounded-2xl shadow-lg shadow-red-500/20">
            <Shield className="w-6 h-6 fill-white text-white" />
            <span className="font-black tracking-wider text-base uppercase">GARANKA ADMIN</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRegistering ? 'Real Person Verification' : 'Sign In'}
          </h1>
          <p className="text-sm text-slate-600">
            {isRegistering
              ? 'Register with mandatory Phone SMS OTP verification + Email & Password'
              : 'Enter your credentials to access the security operations workspace.'}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-5"
        >
          {error && (
            <div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {statusMessage && !error && (
            <div className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>{statusMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
              />
            </div>

            {isRegistering && (
              <>
                {/* Real Person Phone Verification Block */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-red-600" />
                      <span>Phone OTP (Real Person Check)</span>
                    </span>
                    {isPhoneVerified && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-600">Mobile Phone Number (E.164)</label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        disabled={isPhoneVerified || otpSent}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+27825551204 or +16505553434"
                        className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 outline-none focus:border-red-500 text-xs font-mono disabled:bg-slate-100"
                      />
                      {!isPhoneVerified && !otpSent && (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSigningIn}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Send OTP</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {otpSent && !isPhoneVerified && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[11px] font-semibold text-slate-600">Enter 6-Digit SMS Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="flex-1 bg-white border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 outline-none focus:border-red-500 text-xs font-mono tracking-widest text-center"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isSigningIn}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-60"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                  >
                    <option value="community">Community / Resident</option>
                    <option value="guard">Security Guard</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Company Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Company ID</label>
                  <input
                    type="text"
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="comp-aegis"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              <Lock className="w-4 h-4" />
              {isSigningIn ? 'Processing...' : isRegistering ? 'Complete Registration' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200 text-center space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              ⚡ Enter Demo Preview Sandbox Mode
            </button>
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setStatusMessage('');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors cursor-pointer block w-full"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register with Phone Verification'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
