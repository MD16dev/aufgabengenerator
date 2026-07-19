import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, AlertTriangle, MessageSquare, ExternalLink,
  Github, AlertCircle, Inbox, Trash2, Users, ShieldCheck, ShieldOff
} from 'lucide-react';
import { GitHubIssueModal } from './GitHubIssueModal';
import { API_BASE } from '../config';

interface FeedbackItem {
  id: string;
  category: 'BUG' | 'FEEDBACK';
  message: string;
  email: string | null;
  userId: string | null;
  githubIssueUrl: string | null;
  createdAt: string;
}

interface UserItem {
  id: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  createdAt: string;
  solvedCount: number;
}

type CategoryFilter = 'ALL' | 'BUG' | 'FEEDBACK';
type AdminSection = 'feedback' | 'users';

export const AdminPanel: React.FC = () => {
  const [section, setSection] = useState<AdminSection>('feedback');
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [issueModalFeedback, setIssueModalFeedback] = useState<FeedbackItem | null>(null);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/feedback`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Feedback konnte nicht geladen werden.');
      }

      setFeedbacks(data);
    } catch (err: any) {
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Benutzer konnten nicht geladen werden.');
      }

      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === 'feedback') {
      fetchFeedbacks();
    } else {
      fetchUsers();
    }
  }, [section, fetchFeedbacks, fetchUsers]);

  const handleToggleAdmin = async (userId: string, makeAdmin: boolean) => {
    setTogglingUserId(userId);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/auth/users/${userId}/admin`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAdmin: makeAdmin })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Aktion fehlgeschlagen.');
      }

      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, isAdmin: data.user.isAdmin } : u)));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Ändern der Admin-Rechte.');
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Diesen Eintrag wirklich löschen?')) return;

    setDeletingId(feedbackId);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE}/api/feedback/${feedbackId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Eintrag konnte nicht gelöscht werden.');
      }

      setFeedbacks(prev => prev.filter(item => item.id !== feedbackId));
    } catch (err: any) {
      alert(err.message || 'Fehler beim Löschen.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateGitHubIssue = async (feedbackId: string, title: string, body: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE}/api/feedback/${feedbackId}/github-issue`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, body })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'GitHub Issue konnte nicht erstellt werden.');
    }

    setFeedbacks(prev =>
      prev.map(item =>
        item.id === feedbackId
          ? { ...item, githubIssueUrl: data.githubIssueUrl }
          : item
      )
    );
  };

  const filteredFeedbacks = feedbacks.filter(item => {
    if (categoryFilter === 'ALL') return true;
    return item.category === categoryFilter;
  });

  const bugCount = feedbacks.filter(f => f.category === 'BUG').length;
  const feedbackCount = feedbacks.filter(f => f.category === 'FEEDBACK').length;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 animate-fadeIn">
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold font-display text-theme-primary mb-1">Admin-Panel</h2>
            <p className="text-theme-secondary text-sm">
              Feedback, Bug-Reports und Benutzer verwalten
            </p>
          </div>
          <button
            onClick={section === 'feedback' ? fetchFeedbacks : fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-theme-card hover:brightness-95 dark:hover:brightness-110 border border-theme-border rounded-xl text-theme-secondary hover:text-theme-primary text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-theme-card border border-theme-border rounded-xl">
          <button
            onClick={() => setSection('feedback')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              section === 'feedback'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Feedback
          </button>
          <button
            onClick={() => setSection('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              section === 'users'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            <Users className="w-4 h-4" /> Benutzer
          </button>
        </div>

        {section === 'users' ? (
          <>
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-theme-muted text-xs">Benutzer werden geladen...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-3">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="p-5 bg-theme-card border border-theme-border rounded-2xl transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-theme-primary text-sm font-bold truncate">
                            {u.displayName || u.username}
                          </span>
                          {u.isAdmin && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-theme-muted font-medium">
                          @{u.username} · {u.solvedCount} gelöst · {new Date(u.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}
                        disabled={togglingUserId === u.id}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                          u.isAdmin
                            ? 'text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10'
                            : 'text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                        title={u.isAdmin ? 'Admin-Rechte entziehen' : 'Zum Admin machen'}
                      >
                        {togglingUserId === u.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : u.isAdmin ? (
                          <><ShieldOff className="w-4 h-4" /> Entziehen</>
                        ) : (
                          <><ShieldCheck className="w-4 h-4" /> Zum Admin</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-theme-muted">
                <Inbox className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">Keine Benutzer vorhanden.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="p-4 bg-theme-card border border-theme-border rounded-2xl text-center">
                <span className="block text-2xl font-extrabold text-theme-primary">{feedbacks.length}</span>
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Gesamt</span>
              </div>
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
                <span className="block text-2xl font-extrabold text-red-600 dark:text-red-400">{bugCount}</span>
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Bugs</span>
              </div>
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-center">
                <span className="block text-2xl font-extrabold text-blue-600 dark:text-blue-400">{feedbackCount}</span>
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Feedback</span>
              </div>
            </div>

            <div className="flex gap-2 mb-6 p-1 bg-theme-card border border-theme-border rounded-xl">
              {(['ALL', 'BUG', 'FEEDBACK'] as CategoryFilter[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setCategoryFilter(filter)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === filter
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {filter === 'ALL' ? 'Alle' : filter === 'BUG' ? 'Bugs' : 'Feedback'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                <p className="text-theme-muted text-xs">Einträge werden geladen...</p>
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="space-y-3">
                {filteredFeedbacks.map(item => (
                  <div
                    key={item.id}
                    className="p-5 bg-theme-card border border-theme-border rounded-2xl transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          item.category === 'BUG'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}>
                          {item.category === 'BUG'
                            ? <><AlertTriangle className="w-3 h-3" /> Bug</>
                            : <><MessageSquare className="w-3 h-3" /> Feedback</>
                          }
                        </span>
                        <span className="text-[10px] text-theme-muted font-medium">
                          {new Date(item.createdAt).toLocaleString('de-DE')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-2 rounded-lg text-theme-muted hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                        title="Eintrag löschen"
                      >
                        {deletingId === item.id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </div>

                    <p className="text-theme-primary text-sm font-medium leading-relaxed whitespace-pre-wrap mb-3">
                      {item.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-theme-muted font-semibold mb-4">
                      {item.email && <span>E-Mail: {item.email}</span>}
                      {item.userId && <span>User-ID: {item.userId}</span>}
                      {!item.email && !item.userId && <span>Gast-Einreichung</span>}
                    </div>

                    {item.category === 'BUG' && (
                      <div className="pt-3 border-t border-theme-border">
                        {item.githubIssueUrl ? (
                          <a
                            href={item.githubIssueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-all"
                          >
                            <Github className="w-4 h-4" />
                            GitHub Issue ansehen
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <button
                            onClick={() => setIssueModalFeedback(item)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-theme-input hover:bg-purple-500/10 border border-theme-border hover:border-purple-500/30 rounded-xl text-theme-primary text-xs font-bold transition-all cursor-pointer"
                          >
                            <Github className="w-4 h-4" />
                            GitHub Issue erstellen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-theme-muted">
                <Inbox className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">Keine Einträge vorhanden.</p>
              </div>
            )}
          </>
        )}
      </div>

      <GitHubIssueModal
        feedback={issueModalFeedback}
        isOpen={!!issueModalFeedback}
        onClose={() => setIssueModalFeedback(null)}
        onSubmit={handleCreateGitHubIssue}
      />
    </div>
  );
};

export default AdminPanel;
