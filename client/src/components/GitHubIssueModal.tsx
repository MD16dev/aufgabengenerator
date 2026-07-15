import React, { useState, useEffect } from 'react';
import { X, Github, RefreshCw, AlertCircle } from 'lucide-react';

interface FeedbackItem {
  id: string;
  category: 'BUG' | 'FEEDBACK';
  message: string;
  email: string | null;
  userId: string | null;
  createdAt: string;
}

interface GitHubIssueModalProps {
  feedback: FeedbackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackId: string, title: string, body: string) => Promise<void>;
}

function buildDefaultTitle(category: string, message: string): string {
  const preview = message.substring(0, 50);
  const suffix = message.length > 50 ? '...' : '';
  return `[${category}] ${preview}${suffix}`;
}

function buildDefaultBody(feedback: FeedbackItem): string {
  const label = feedback.category === 'BUG' ? '🐛 Bug-Report' : '💬 Feedback';
  return `### ${label}\n\n${feedback.message}\n\n---\n* **Erstellt am:** ${new Date(feedback.createdAt).toLocaleString('de-DE')}\n* **Gesendet über:** AufgabenGenerator App`;
}

export const GitHubIssueModal: React.FC<GitHubIssueModalProps> = ({
  feedback,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (feedback && isOpen) {
      setTitle(buildDefaultTitle(feedback.category, feedback.message));
      setBody(buildDefaultBody(feedback));
      setError(null);
    }
  }, [feedback, isOpen]);

  if (!isOpen || !feedback) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 3) {
      setError('Der Titel muss mindestens 3 Zeichen lang sein.');
      return;
    }
    if (body.trim().length < 5) {
      setError('Die Beschreibung muss mindestens 5 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(feedback.id, title.trim(), body.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'GitHub Issue konnte nicht erstellt werden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-theme-card border border-theme-border rounded-3xl shadow-2xl p-6 md:p-8 animate-scaleIn"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-500 rounded-t-3xl" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-theme-input text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <h3 className="text-xl font-bold font-display text-theme-primary mb-1 flex items-center gap-2">
              <Github className="w-5 h-5" />
              GitHub Issue erstellen
            </h3>
            <p className="text-theme-muted text-xs font-medium">
              Passe Titel und Beschreibung an, bevor das Issue erstellt wird.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="issue-title" className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              id="issue-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="issue-body" className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">
              Beschreibung <span className="text-red-500">*</span>
            </label>
            <textarea
              id="issue-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full px-3 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500 transition-colors font-mono leading-relaxed"
              required
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-theme-input border border-theme-border text-theme-secondary hover:text-theme-primary transition-all cursor-pointer disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Github className="w-4 h-4" />
                  Issue erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GitHubIssueModal;
