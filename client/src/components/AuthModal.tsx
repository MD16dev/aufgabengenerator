import React, { useState } from 'react';
import { X, Lock, User, RefreshCw, KeyRound } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { id: string; username: string }, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === '' || password.trim() === '') return;

    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Authentifizierung fehlgeschlagen.');
      }

      // Save token locally
      localStorage.setItem('auth_token', data.token);
      
      // Callback to root app state
      onAuthSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Verbindung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card */}
      <div 
        className="w-full max-w-md p-6 md:p-8 rounded-3xl glass-panel relative border border-white/10 shadow-2xl glow-purple animate-fadeIn"
        id="auth-modal-container"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-400">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold font-display text-center text-slate-100 mb-2">
          {isLogin ? 'In dein Profil einloggen' : 'Neuen Account erstellen'}
        </h2>
        <p className="text-xs text-slate-400 text-center mb-6">
          {isLogin 
            ? 'Gib deine Daten ein, um deine Punkte zu synchronisieren.' 
            : 'Erstelle einen Account, um dich auf der Bestenliste zu verewigen.'}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Benutzername
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="z.B. StudiGott"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
              Passwort
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/40 border border-slate-700/60 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3 text-rose-300 bg-rose-500/10 border border-rose-500/20 text-xs font-medium rounded-xl leading-relaxed">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || username.trim() === '' || password.trim() === ''}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-md disabled:from-purple-800 disabled:to-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verarbeiten...
              </>
            ) : (
              isLogin ? 'Einloggen' : 'Registrieren'
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? 'Noch keinen Account?' : 'Bereits registriert?'}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="ml-1 text-purple-400 font-bold hover:underline cursor-pointer"
          >
            {isLogin ? 'Jetzt registrieren' : 'Jetzt einloggen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
