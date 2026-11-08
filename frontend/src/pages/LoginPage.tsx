import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { CrossedRacketsLogoIcon } from '../components/icons/BadmintonIcons';

export const LoginPage: React.FC = () => {
  const { login, verifyTwoFactor } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'CREDENTIALS' | 'TWO_FACTOR'>('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorHint, setTwoFactorHint] = useState<string | null>(null);
  const [stepMessage, setStepMessage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.requires_two_factor) {
        setStep('TWO_FACTOR');
        setTwoFactorHint(res.two_factor_code_hint || null);
        setStepMessage(res.message || 'Two-step verification active: enter your 6-digit code.');
        return;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await verifyTwoFactor(email, twoFactorCode);
      if (res.access_token) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired 2-step verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md glass-panel bg-[#091129]/90 border border-cyan-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            {step === 'TWO_FACTOR' ? (
              <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
            ) : (
              <CrossedRacketsLogoIcon className="w-9 h-9" glow={false} />
            )}
          </div>
          <h2 className="text-2xl font-black text-white">
            {step === 'TWO_FACTOR' ? 'Two-Step Verification' : 'Player Sign In'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {step === 'TWO_FACTOR'
              ? 'Multi-tenant security: Confirm your identity to unlock court telemetry'
              : 'Access your BWF court analytics and match history'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'CREDENTIALS' ? (
          <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@badminton.club"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#05091a] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cyan-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#05091a] border border-cyan-500/30 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              icon={ArrowRight}
              className="mt-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
            >
              Sign In to Court Center
            </Button>
          </form>
        ) : (
          <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-4">
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-700/40 text-xs text-cyan-200 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Step 2 of 2: Security Verification</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {stepMessage || 'A cryptographic 6-digit challenge code has been dispatched to your profile.'}
              </p>
              {twoFactorHint && (
                <div className="mt-1 pt-1.5 border-t border-cyan-800/40 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Security Test Dispatch Code:</span>
                  <button
                    type="button"
                    onClick={() => setTwoFactorCode(twoFactorHint)}
                    className="font-mono text-xs font-black text-cyan-300 bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-500/40 hover:bg-cyan-800/70 cursor-pointer"
                  >
                    {twoFactorHint} (Click to fill)
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                6-Digit Security / Recovery Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-cyan-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={12}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.trim())}
                  placeholder="e.g. 849201"
                  className="w-full pl-10 pr-4 py-3 bg-[#05091a] border border-cyan-500/40 rounded-xl text-cyan-300 font-mono tracking-widest text-center text-lg placeholder-slate-600 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              icon={CheckCircle2}
              className="mt-2 w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20"
            >
              Verify & Complete Sign In
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep('CREDENTIALS');
                setError(null);
                setTwoFactorCode('');
              }}
              className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to credentials</span>
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-cyan-500/20 text-center text-xs text-slate-400">
          New to RallyVision Pro?{' '}
          <Link to="/register" className="text-cyan-300 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
