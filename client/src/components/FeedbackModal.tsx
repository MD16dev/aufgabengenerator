import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import { API_BASE } from '../config';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { username: string } | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [category, setCategory] = useState<'BUG' | 'FEEDBACK'>('BUG');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 5) {
      setError('Die Nachricht muss mindestens 5 Zeichen lang sein.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // If user is authenticated, attach the token
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          message,
          email: email.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Fehler beim Senden des Feedbacks.');
      }

      setSuccess(true);
      setTimeout(() => {
        // Reset state and close modal after success
        setMessage('');
        setEmail('');
        setCategory('BUG');
        setSuccess(false);
        onClose();
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'Verbindung zum Server fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div 
        className="relative w-full max-w-md bg-theme-card border border-theme-border rounded-3xl shadow-2xl p-6 md:p-8 animate-scaleIn overflow-hidden"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glow decoration */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          category === 'BUG' ? 'bg-red-500' : 'bg-blue-500'
        }`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-theme-input text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
          aria-label="Schließen"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-xl font-bold text-theme-primary mb-2">Vielen Dank!</h3>
            <p className="text-theme-secondary text-sm max-w-xs leading-relaxed font-medium">
              Dein Beitrag wurde erfolgreich gespeichert und erscheint im Admin-Panel.
            </p>
          </div>
        ) : (
          // Form State
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold font-display text-theme-primary mb-1">
                Feedback & Bug-Report
              </h3>
              <p className="text-theme-muted text-xs font-medium">
                Hilf uns dabei, den Aufgabetyp-Generator zu verbessern!
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Category selection Tabs */}
            <div>
              <label className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-2">
                Art des Beitrags
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCategory('BUG')}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    category === 'BUG'
                      ? 'bg-red-500/10 border-red-500/50 text-red-650 dark:text-red-400 shadow-sm shadow-red-500/5'
                      : 'bg-theme-input border-theme-border text-theme-secondary hover:brightness-95 dark:hover:brightness-110'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" /> Bug melden
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('FEEDBACK')}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    category === 'FEEDBACK'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/5'
                      : 'bg-theme-input border-theme-border text-theme-secondary hover:brightness-95 dark:hover:brightness-110'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> Feedback
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div>
              <label htmlFor="feedback-message" className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider mb-1.5">
                Deine Nachricht <span className="text-red-500">*</span>
              </label>
              <textarea
                id="feedback-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={category === 'BUG' 
                  ? 'Beschreibe den Fehler: Was ist passiert und wie können wir ihn reproduzieren?' 
                  : 'Welche Ideen, Verbesserungen oder Wünsche hast du für uns?'
                }
                rows={4}
                className="w-full px-3 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500 placeholder-theme-muted/70 transition-colors"
                required
              />
            </div>

            {/* Optional Email Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="feedback-email" className="block text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                  E-Mail-Adresse (Optional)
                </label>
                {currentUser && (
                  <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                    Angemeldet als @{currentUser.username}
                  </span>
                )}
              </div>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kontakt@beispiel.de"
                className="w-full px-3 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500 placeholder-theme-muted/70 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                category === 'BUG'
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-600/10'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/10'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird gesendet...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Beitrag absenden
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
