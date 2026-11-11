import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Activity,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Match } from '../types';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

export const PdfReportsPage: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingMatchId, setGeneratingMatchId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const data = await api.listMatches();
      setMatches(data.filter(m => m.status === 'COMPLETED'));
    } catch (err: any) {
      setError(err.message || 'Failed to load report archives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleGenerate = async (matchId: number) => {
    try {
      setGeneratingMatchId(matchId);
      const rep = await api.generateReport(matchId);
      window.open(api.getReportDownloadUrl(rep.id), '_blank');
      loadMatches();
    } catch (err: any) {
      alert(err.message || 'Failed to generate report.');
    } finally {
      setGeneratingMatchId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          PDF Match Reports Archive
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Download and share professional, printable performance reports with coaches and academies
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading report archives...</span>
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          title="No Match Reports Available"
          description="Upload and analyze a match video to automatically generate your first PDF report."
          actionLabel="Upload Match"
          actionHref="/upload"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {matches.map((m) => {
            const hasReport = m.reports && m.reports.length > 0;
            const latestReport = hasReport ? m.reports[0] : null;

            return (
              <div
                key={m.id}
                className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-xl flex flex-col justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm truncate">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.match_type} • {m.created_at.slice(0, 10)}
                    </p>
                  </div>
                </div>

                {m.analytics && (
                  <div className="p-3 rounded-xl bg-slate-900 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>{m.analytics.total_movement_distance_m.toFixed(0)}m covered</span>
                    <span className="text-cyan-400 font-bold">{m.analytics.total_shots} shots</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  {latestReport ? (
                    <a
                      href={api.getReportDownloadUrl(latestReport.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" icon={Download} className="w-full">
                        Download PDF
                      </Button>
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      icon={RefreshCw}
                      onClick={() => handleGenerate(m.id)}
                      loading={generatingMatchId === m.id}
                      className="flex-1"
                    >
                      Generate PDF
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    icon={RefreshCw}
                    onClick={() => handleGenerate(m.id)}
                    loading={generatingMatchId === m.id}
                    title="Regenerate Report"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

