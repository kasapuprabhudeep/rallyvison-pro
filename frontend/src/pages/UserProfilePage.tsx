import React, { useState } from 'react';
import {
  User,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Lock,
  ShieldCheck,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export const UserProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const profile = user?.profile;
  const [dominantHand, setDominantHand] = useState(profile?.dominant_hand || 'RIGHT');
  const [courtPos, setCourtPos] = useState(profile?.preferred_court_position || 'ALL_ROUND');
  const [playLevel, setPlayLevel] = useState(profile?.play_level || 'INTERMEDIATE');
  const [bio, setBio] = useState(profile?.bio || '');
  const [heightCm, setHeightCm] = useState<number | ''>(profile?.height_cm || '');
  const [weightKg, setWeightKg] = useState<number | ''>(profile?.weight_kg || '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      await updateProfile({
        dominant_hand: dominantHand,
        preferred_court_position: courtPos,
        play_level: playLevel,
        bio: bio.trim() || undefined,
        height_cm: heightCm !== '' ? Number(heightCm) : undefined,
        weight_kg: weightKg !== '' ? Number(weightKg) : undefined
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordSaving(false);
      return;
    }

    try {
      const res = await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword
      });
      setPasswordSuccess(res.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Player Profile & Account Security
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Customize your player specifications, manage password security, and protect your match data
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Profile updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Info Card */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-extrabold text-2xl flex items-center justify-center shadow-inner">
            {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.full_name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-cyan-400 border border-slate-700">
                <Shield className="w-3 h-3" />
                <span>Role: {user?.role}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-[11px] font-mono text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="w-3 h-3" />
                <span>Private by Default</span>
              </span>
            </div>
          </div>
        </div>

        <Link
          to="/privacy"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
        >
          <EyeOff className="w-3.5 h-3.5 text-cyan-400" />
          <span>Privacy Settings</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </Link>
      </div>

      {/* Player Attributes Form */}
      <form onSubmit={handleSubmit} className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 flex flex-col gap-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Player Attributes & Style
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Dominant Hand
            </label>
            <select
              value={dominantHand}
              onChange={(e) => setDominantHand(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="RIGHT">Right-Handed</option>
              <option value="LEFT">Left-Handed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Competitive Level
            </label>
            <select
              value={playLevel}
              onChange={(e) => setPlayLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="BEGINNER">Beginner / Recreational</option>
              <option value="INTERMEDIATE">Intermediate Club Player</option>
              <option value="ADVANCED">Advanced League Athlete</option>
              <option value="COMPETITIVE">Competitive Tournament Pro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Court Specialization
            </label>
            <select
              value={courtPos}
              onChange={(e) => setCourtPos(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL_ROUND">All-Rounder</option>
              <option value="FORECOURT">Forecourt / Net Play Specialist</option>
              <option value="REARCOURT">Rearcourt / Power Attacker</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Height (cm)
            </label>
            <input
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 178"
              className="w-full px-4 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Player Bio / Training Goals
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Focusing on rapid recovery after baseline clears and steep jump smash consistency..."
              className="w-full px-4 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <Button type="submit" icon={Save} loading={saving} className="self-end mt-2">
          Save Profile Changes
        </Button>
      </form>

      {/* Account Security & Password Update Section */}
      <form onSubmit={handlePasswordChange} className="bg-[#0f172a] border border-[#1e293b] rounded-3xl p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Account Password & Security
          </h3>
        </div>

        <p className="text-xs text-slate-400">
          Passwords must be at least 8 characters long and contain both letters and numbers for secure protection.
        </p>

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              New Password (8+ chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#080d1a] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500"
              required
              minLength={8}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="secondary"
          icon={Lock}
          loading={passwordSaving}
          className="self-end mt-2"
        >
          Update Password
        </Button>
      </form>
    </div>
  );
};
