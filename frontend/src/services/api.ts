import {
  User,
  Match,
  UploadedVideo,
  CourtCalibration,
  CornerPoint,
  ShotEvent,
  RallyEvent,
  ShotType,
  AnalysisResults,
  DashboardSummary,
  MatchAnalytics,
  GeneratedReport,
  UserProfile,
  PrivacySettings,
  ShareMatchResult,
  SharedMatchPublic,
  TokenResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('rallyvision_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data: { email: string; password: string; full_name: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await handleResponse<{ access_token: string; user: User }>(res);
    localStorage.setItem('rallyvision_token', json.access_token);
    return json;
  },

  async login(data: { email: string; password: string; two_factor_code?: string }): Promise<TokenResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await handleResponse<TokenResponse>(res);
    if (json.access_token) {
      localStorage.setItem('rallyvision_token', json.access_token);
    }
    return json;
  },

  async verifyTwoFactor(data: { email: string; two_factor_code: string }): Promise<TokenResponse> {
    const res = await fetch(`${API_BASE}/auth/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await handleResponse<TokenResponse>(res);
    if (json.access_token) {
      localStorage.setItem('rallyvision_token', json.access_token);
    }
    return json;
  },

  logout() {
    localStorage.removeItem('rallyvision_token');
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse<User>(res);
  },

  async updateProfile(profile: Partial<UserProfile>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profile)
    });
    return handleResponse<User>(res);
  },

  async getPrivacySettings(): Promise<PrivacySettings> {
    const res = await fetch(`${API_BASE}/auth/privacy`, {
      headers: getAuthHeaders()
    });
    return handleResponse<PrivacySettings>(res);
  },

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    const res = await fetch(`${API_BASE}/auth/privacy`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse<PrivacySettings>(res);
  },

  async changePassword(data: { current_password: string; new_password: string; confirm_new_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<{ message: string }>(res);
  },

  async exportData(): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/export-data`, {
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  async deleteAccount(data: { password: string; confirmation_text: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/account`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const json = await handleResponse<{ message: string }>(res);
    localStorage.removeItem('rallyvision_token');
    return json;
  },

  // Matches
  async listMatches(): Promise<Match[]> {
    const res = await fetch(`${API_BASE}/matches`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Match[]>(res);
  },

  async getMatch(id: number): Promise<Match> {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<Match>(res);
  },

  async createMatch(data: {
    title: string;
    match_type?: 'SINGLES' | 'DOUBLES';
    match_date?: string;
    player_position?: string;
    opponent_name?: string;
    notes?: string;
  }): Promise<Match> {
    const res = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Match>(res);
  },

  async updateMatch(id: number, data: any): Promise<Match> {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse<Match>(res);
  },

  async deleteMatch(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string }>(res);
  },

  // Public Sharing of Private Matches
  async enableMatchShare(matchId: number): Promise<ShareMatchResult> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/share`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<ShareMatchResult>(res);
  },

  async revokeMatchShare(matchId: number): Promise<ShareMatchResult> {
    const res = await fetch(`${API_BASE}/matches/${matchId}/share`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse<ShareMatchResult>(res);
  },

  async getSharedMatch(shareToken: string): Promise<SharedMatchPublic> {
    const res = await fetch(`${API_BASE}/matches/shared/${shareToken}`);
    return handleResponse<SharedMatchPublic>(res);
  },

  getSharedPdfUrl(shareToken: string): string {
    return `${API_BASE}/reports/shared/${shareToken}/download`;
  },

  // Videos
  async uploadVideo(matchId: number, file: File, onProgress?: (pct: number) => void): Promise<UploadedVideo> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/videos/upload/${matchId}`);
      const token = localStorage.getItem('rallyvision_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            onProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText);
            reject(new Error(err.detail || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('Network error during video upload'));

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  },

  getVideoStreamUrl(videoId: number) {
    const token = localStorage.getItem('rallyvision_token');
    return `${API_BASE}/videos/${videoId}/stream?token=${token || ''}`;
  },

  // Court Calibration
  async getCalibrationFrame(matchId: number, frameIndex = 25): Promise<{ frame_url: string; width: number; height: number }> {
    const res = await fetch(`${API_BASE}/court/${matchId}/frame?frame_index=${frameIndex}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{ frame_url: string; width: number; height: number }>(res);
  },

  async getCalibration(matchId: number): Promise<CourtCalibration> {
    const res = await fetch(`${API_BASE}/court/${matchId}/calibration`, {
      headers: getAuthHeaders()
    });
    return handleResponse<CourtCalibration>(res);
  },

  async autoDetectCourt(matchId: number): Promise<CourtCalibration> {
    const res = await fetch(`${API_BASE}/court/${matchId}/detect`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<CourtCalibration>(res);
  },

  async updateCalibration(
    matchId: number,
    corners: CornerPoint[],
    courtType: 'SINGLES' | 'DOUBLES' = 'SINGLES'
  ): Promise<CourtCalibration> {
    const res = await fetch(`${API_BASE}/court/${matchId}/calibration`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ corners, court_type: courtType, is_manual_override: true })
    });
    return handleResponse<CourtCalibration>(res);
  },

  // Analysis
  async startAnalysis(matchId: number): Promise<{ message: string; match_id: number }> {
    const res = await fetch(`${API_BASE}/analysis/${matchId}/start`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<{ message: string; match_id: number }>(res);
  },

  async getAnalysisStatus(matchId: number): Promise<{
    match_id: number;
    status: string;
    progress: number;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/analysis/${matchId}/status`, {
      headers: getAuthHeaders()
    });
    return handleResponse<{
      match_id: number;
      status: string;
      progress: number;
      message: string;
    }>(res);
  },

  async getAnalysisResults(matchId: number): Promise<AnalysisResults> {
    const res = await fetch(`${API_BASE}/analysis/${matchId}/results`, {
      headers: getAuthHeaders()
    });
    return handleResponse<AnalysisResults>(res);
  },

  async correctShot(shotId: number, shotType: ShotType): Promise<ShotEvent> {
    const res = await fetch(`${API_BASE}/analysis/shots/${shotId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shot_type: shotType })
    });
    return handleResponse<ShotEvent>(res);
  },

  async verifyRally(rallyId: number): Promise<RallyEvent> {
    const res = await fetch(`${API_BASE}/analysis/rallies/${rallyId}/verify`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse<RallyEvent>(res);
  },

  // Analytics
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getAuthHeaders()
    });
    return handleResponse<DashboardSummary>(res);
  },

  async getMatchAnalytics(matchId: number): Promise<MatchAnalytics> {
    const res = await fetch(`${API_BASE}/analytics/${matchId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<MatchAnalytics>(res);
  },

  async compareMatches(matchA: number, matchB: number): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/compare/matches?match_a=${matchA}&match_b=${matchB}`, {
      headers: getAuthHeaders()
    });
    return handleResponse<any>(res);
  },

  // Reports
  async generateReport(matchId: number): Promise<GeneratedReport> {
    const res = await fetch(`${API_BASE}/reports/${matchId}/generate`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse<GeneratedReport>(res);
  },

  getReportDownloadUrl(reportId: number) {
    const token = localStorage.getItem('rallyvision_token');
    return `${API_BASE}/reports/${reportId}/download?token=${token || ''}`;
  },

  // AI Tactical Coach
  async askAICoach(query: string, matchId?: number): Promise<{
    id?: number;
    answer: string;
    grounded_metrics: Record<string, any>;
    suggested_followups: string[];
    match_context_included: boolean;
    timestamp: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/ask`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query, match_id: matchId })
    });
    return handleResponse(res);
  },

  async getAICoachHistory(matchId?: number, limit = 50): Promise<{
    messages: Array<{
      id: number;
      user_id: number;
      match_id?: number;
      query: string;
      answer: string;
      grounded_metrics?: Record<string, any>;
      suggested_followups?: string[];
      created_at: string;
    }>;
    total_count: number;
  }> {
    const params = new URLSearchParams();
    if (matchId !== undefined) params.append('match_id', matchId.toString());
    params.append('limit', limit.toString());
    const res = await fetch(`${API_BASE}/ai/history?${params.toString()}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  async clearAICoachHistory(matchId?: number): Promise<{ status: string; message: string; deleted_count: number }> {
    const params = new URLSearchParams();
    if (matchId !== undefined) params.append('match_id', matchId.toString());
    const res = await fetch(`${API_BASE}/ai/history?${params.toString()}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};

