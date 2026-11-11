import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Trash2,
  EyeOff,
  Database,
  CheckCircle2,
  AlertTriangle,
  Download,
  KeyRound,
  FileText,
  UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';

export const PrivacyPage: React.FC = () => {
  const [isProfilePrivate, setIsProfilePrivate] = useState(true);
  const [shareTelemetry, setShareTelemetry] = useState(false);
  const [modelTrainingConsent, setModelTrainingConsent] = useState(false);
  const [retentionDays, setRetentionDays] = useState(90);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCode, setBackupCode] = useState<string | null>(null);
  const [encryptionStandard, setEncryptionStandard] = useState('AES-256-GCM');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Account Purge state
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState<string | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await api.getPrivacySettings();
      setIsProfilePrivate(settings.is_profile_private);
      setShareTelemetry(settings.share_anonymous_telemetry);
      setModelTrainingConsent(settings.allow_ai_model_training);
      setRetentionDays(settings.video_retention_days);
      setTwoFactorEnabled(settings.two_factor_enabled);
      setBackupCode(settings.two_factor_backup_code || null);
      setEncryptionStandard(settings.data_encryption_standard || 'AES-256-GCM');
    } catch (err: any) {
      console.warn('Could not load privacy settings from backend:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage(null);
    setErrorMessage(null);

    try {
      const updated = await api.updatePrivacySettings({
        is_profile_private: isProfilePrivate,
        share_anonymous_telemetry: shareTelemetry,
        allow_ai_model_training: modelTrainingConsent,
        video_retention_days: Number(retentionDays),
        two_factor_enabled: twoFactorEnabled
      });

      setIsProfilePrivate(updated.is_profile_private);
      setShareTelemetry(updated.share_anonymous_telemetry);
      setModelTrainingConsent(updated.allow_ai_model_training);
      setRetentionDays(updated.video_retention_days);
      setTwoFactorEnabled(updated.two_factor_enabled);
      setBackupCode(updated.two_factor_backup_code || null);

      setSavedMessage('Privacy & data preferences successfully secured in the database.');
      setTimeout(() => setSavedMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save privacy settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rallyvision_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export your data.');
    } finally {
      setExporting(false);
    }
  };

  const handlePurgeAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurgeError(null);

    if (purgeConfirmText.trim().toUpperCase() !== 'DELETE MY ACCOUNT') {
      setPurgeError("Please type 'DELETE MY ACCOUNT' exactly to confirm.");
      return;
    }
    if (!purgePassword) {
      setPurgeError('Please enter your current password.');
      return;
    }

    try {
      setPurging(true);
      await api.deleteAccount({
        password: purgePassword,
        confirmation_text: purgeConfirmText.trim().toUpperCase()
      });
      alert('Your account and all associated telemetry have been permanently deleted.');
      window.location.href = '/register';
    } catch (err: any) {
      setPurgeError(err.message || 'Failed to purge account.');
      setPurging(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
      <div>
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Sovereignty</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Privacy & Account Data Protection
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Everyday privacy for all players: your match recordings, speed metrics, and profile are strictly private by default.
        </p>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Security Architecture Guarantees */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-[#1e293b] flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Core Privacy Safeguards</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              <span>Strict Data Isolation</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Matches and video files are bound strictly to your unique account ID with SQL-level authorization checks.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Encrypted Storage</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All video streams and database credentials utilize military-grade <span className="font-mono text-cyan-300">{encryptionStandard}</span> encryption.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Zero Model Ingestion Without Consent</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Your match recordings are never fed into external tracking models without your explicit opt-in switch.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Preferences Form */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-[#1e293b] flex flex-col gap-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white">
          Account Visibility & Data Permissions
        </h2>

        <div className="flex flex-col gap-4">
          {/* Profile Privacy */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="pr-4">
              <span className="text-xs font-semibold text-white block">
                Private Account by Default (Recommended)
              </span>
              <span className="text-[11px] text-slate-400">
                When enabled, your matches, player archetype, and speed analytics are visible only to you.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isProfilePrivate}
              onChange={(e) => setIsProfilePrivate(e.target.checked)}
              className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          {/* Anonymous Telemetry */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="pr-4">
              <span className="text-xs font-semibold text-white block">
                Anonymous System Diagnostic Telemetry
              </span>
              <span className="text-[11px] text-slate-400">
                Help improve court calibration reliability by transmitting anonymous homography error margins (no video included).
              </span>
            </div>
            <input
              type="checkbox"
              checked={shareTelemetry}
              onChange={(e) => setShareTelemetry(e.target.checked)}
              className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          {/* Optical Model Landmark Feedback */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="pr-4">
              <span className="text-xs font-semibold text-white block">
                Contribute Shuttlecock Detection Landmarks
              </span>
              <span className="text-[11px] text-slate-400">
                Allow anonymized optical trajectory points to help fine-tune future badminton ball detection algorithms.
              </span>
            </div>
            <input
              type="checkbox"
              checked={modelTrainingConsent}
              onChange={(e) => setModelTrainingConsent(e.target.checked)}
              className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
            />
          </div>

          {/* Video Retention */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="pr-4">
              <span className="text-xs font-semibold text-white block">
                Raw Video Storage Retention Schedule
              </span>
              <span className="text-[11px] text-slate-400">
                Automatically purge raw video files from server storage to conserve space while keeping your analytics and charts permanently.
              </span>
            </div>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="px-3 py-2 bg-[#080d1a] border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="90">Auto-delete video after 90 days (Recommended)</option>
              <option value="30">Auto-delete video after 30 days</option>
              <option value="0">Retain raw videos indefinitely</option>
            </select>
          </div>

          {/* Two-Step Verification (2FA) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">
                    Two-Step Verification (2-Factor Authentication)
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      twoFactorEnabled
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {twoFactorEnabled ? 'PROTECTED' : 'DISABLED'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Require a 6-digit cryptographic security code upon sign-in. Protects player telemetry against unauthorized global access.
                </span>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="w-5 h-5 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            {twoFactorEnabled && backupCode && (
              <div className="mt-2 p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">
                    Emergency Recovery Backup Code
                  </span>
                  <span className="text-[11px] text-slate-300">
                    Store this code safely. It grants emergency one-time access if you ever lose your two-step challenge code.
                  </span>
                </div>
                <code className="text-xs font-mono font-black text-cyan-200 bg-cyan-900/60 px-3 py-1.5 rounded-lg border border-cyan-600/50 tracking-widest ml-4 shrink-0">
                  {backupCode}
                </code>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            Changes are cryptographically updated in your database profile.
          </span>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Privacy Preferences'}
          </Button>
        </div>
      </div>

      {/* Data Sovereignty & Portability (GDPR / CCPA) */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-[#1e293b] flex flex-col gap-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Data Portability & Export (GDPR)</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Download a complete digital copy of your account profile, match telemetry, shot logs, and tactical coordinates in standard JSON format.
        </p>
        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            icon={FileText}
            onClick={handleExportData}
            disabled={exporting}
          >
            {exporting ? 'Generating Export...' : 'Export My Personal Data (.JSON)'}
          </Button>
        </div>
      </div>

      {/* Danger Zone: Account & Telemetry Purge */}
      <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/20 flex flex-col gap-3">
        <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Danger Zone: Permanent Account & Telemetry Purge</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Permanently delete your account, player profile, uploaded match videos, generated PDF reports, and all computer-vision telemetry from disk and database. This action is instantaneous and irreversible.
        </p>
        <div className="pt-2">
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => setShowPurgeModal(true)}
          >
            Purge Account & All Data
          </Button>
        </div>
      </div>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0f172a] border border-rose-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
                <p className="text-xs text-slate-400">All videos and match history will be wiped immediately.</p>
              </div>
            </div>

            {purgeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {purgeError}
              </div>
            )}

            <form onSubmit={handlePurgeAccount} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Type <span className="font-mono text-rose-400 font-bold">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Enter your current password:
                </label>
                <input
                  type="password"
                  value={purgePassword}
                  onChange={(e) => setPurgePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowPurgeModal(false);
                    setPurgeError(null);
                    setPurgePassword('');
                    setPurgeConfirmText('');
                  }}
                  disabled={purging}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={purging}
                >
                  {purging ? 'Purging Everything...' : 'Confirm Permanent Deletion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
