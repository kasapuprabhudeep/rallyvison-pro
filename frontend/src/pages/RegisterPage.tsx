import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { CrossedRacketsLogoIcon } from '../components/icons/BadmintonIcons';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PLAYER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState(() => localStorage.getItem('rallyvision_server_url') || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register(email, password, fullName, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md glass-panel bg-[#091129]/85 border border-cyan-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CrossedRacketsLogoIcon className="w-9 h-9" glow={false} />
          </div>
          <h2 className="text-2xl font-black text-white">Create Player Profile</h2>
          <p className="text-xs text-slate-300 mt-1">Start tracking your badminton strokes and court metrics</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Player Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-cyan-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Viktor / Sindhu"
                className="w-full pl-10 pr-4 py-2.5 bg-[#05091a] border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-2.5 bg-[#05091a] border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
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
                className="w-full pl-10 pr-4 py-2.5 bg-[#05091a] border border-cyan-500/30 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Badminton Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#05091a] border border-cyan-500/30 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="PLAYER">Casual / Club Player</option>
              <option value="COACH">Academy Badminton Coach</option>
              <option value="ANALYST">Sports Performance Analyst</option>
            </select>
          </div>

          <Button type="submit" loading={loading} icon={ArrowRight} className="mt-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20">
            Create Profile & Start Playing
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-cyan-500/20 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-300 font-bold hover:underline">
            Sign In Here
          </Link>
        </div>

        {/* Optional Server Configuration for Mobile / Laptop Network */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => setShowServerConfig(!showServerConfig)}
            className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            <span>⚙️ Server: {customServerUrl ? 'Custom Backend' : 'Auto / Mobile Standalone'}</span>
          </button>
          {showServerConfig && (
            <div className="mt-2.5 p-3 rounded-xl bg-[#05091a] border border-cyan-500/30 text-left flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Backend Server URL (Optional):
              </label>
              <input
                type="text"
                value={customServerUrl}
                onChange={(e) => setCustomServerUrl(e.target.value)}
                placeholder="e.g. http://192.168.31.114:8000/api"
                className="w-full px-3 py-1.5 bg-[#030612] border border-cyan-500/25 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (customServerUrl.trim()) {
                      localStorage.setItem('rallyvision_server_url', customServerUrl.trim());
                    } else {
                      localStorage.removeItem('rallyvision_server_url');
                    }
                    setShowServerConfig(false);
                  }}
                  className="px-3 py-1 bg-cyan-500 text-slate-950 rounded-lg text-[10px] font-bold hover:bg-cyan-400"
                >
                  Save URL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('rallyvision_server_url');
                    setCustomServerUrl('');
                    setShowServerConfig(false);
                  }}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] hover:text-white"
                >
                  Reset Default
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
