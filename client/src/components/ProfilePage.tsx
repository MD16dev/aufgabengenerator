import { useState } from 'react';
import { Trophy, BookOpen, Clock, Edit, Save, Camera, RefreshCw, Medal, Sparkles, LogIn } from 'lucide-react';
import type { UserProfile } from '../types';

interface ProfilePageProps {
  user: UserProfile | null;
  guestScore: number;
  onOpenAuth: () => void;
  onUpdateProfile: (payload: { displayName: string; profilePic: string; newPassword: string }) => Promise<void>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, guestScore, onOpenAuth, onUpdateProfile }) => {
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editDisplayName, setEditDisplayName] = useState<string>(user?.displayName || '');
  const [editPassword, setEditPassword] = useState<string>('');
  const [editProfilePic, setEditProfilePic] = useState<string>(user?.profilePic || '');
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="profile-details-panel">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <div className="max-w-md mx-auto py-6">
            <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 text-purple-600 dark:text-purple-400 w-fit mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold font-display text-theme-primary mb-2">Erstelle ein Profil</h2>
            <p className="text-theme-secondary text-sm mb-6">
              Melde dich an, um deine Rechenpunkte dauerhaft zu sichern, deine Erfolge einzusehen und einen Platz in der globalen Rangliste zu ergattern.
            </p>
            <div className="p-4 bg-theme-card rounded-2xl border border-theme-border text-left mb-6 shadow-sm">
              <span className="text-xs text-theme-muted font-bold uppercase tracking-wider block mb-1">Aktuelle Session (Gast)</span>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-theme-secondary">Punkte gesammelt:</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{guestScore}</span>
              </div>
            </div>
            <button
              onClick={onOpenAuth}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 cursor-pointer text-sm"
            >
              <LogIn className="w-4 h-4 inline mr-1" /> Profil jetzt erstellen / Einloggen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        alert('Das Bild darf maximal 1.5 MB groß sein.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) setEditProfilePic(event.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await onUpdateProfile({ displayName: editDisplayName, profilePic: editProfilePic, newPassword: editPassword });
      setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert!' });
      setEditPassword('');
      setIsEditMode(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Verbindung fehlgeschlagen.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 animate-fadeIn" id="profile-details-panel">
      <div className="glass-panel rounded-3xl p-6 md:p-8">
        {!isEditMode ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden shadow-lg border border-theme-border shrink-0">
                {user.profilePic ? (
                  <img src={user.profilePic} className="w-full h-full object-cover" alt="Profilbild" />
                ) : (
                  <span className="text-2xl font-bold text-white uppercase">{user.displayName.substring(0, 2)}</span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display text-theme-primary">{user.displayName}</h2>
                <p className="text-theme-muted text-xs font-semibold">@{user.username}</p>
                <p className="text-[10px] text-theme-muted mt-1 font-semibold">Registriert: {new Date(user.createdAt).toLocaleDateString('de-DE')}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsEditMode(true);
                setEditDisplayName(user.displayName);
                setEditProfilePic(user.profilePic || '');
                setEditPassword('');
                setMessage(null);
              }}
              className="px-4 py-2 border border-theme-border hover:border-purple-500/40 text-theme-secondary hover:text-purple-650 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Bearbeiten
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 mb-6">
            <h3 className="text-lg font-bold font-display text-theme-primary">Profil bearbeiten</h3>
            <div className="flex items-center gap-4 p-4 bg-theme-card border border-theme-border rounded-2xl">
              <div className="relative w-16 h-16 rounded-2xl bg-theme-input flex items-center justify-center overflow-hidden border border-theme-border shrink-0">
                {editProfilePic ? (
                  <img src={editProfilePic} className="w-full h-full object-cover" alt="Vorschau" />
                ) : (
                  <span className="text-2xl font-bold text-theme-muted uppercase">{editDisplayName.substring(0, 2)}</span>
                )}
                <label className="absolute inset-0 bg-black/50 hover:bg-black/60 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
              <div>
                <span className="text-xs font-bold text-theme-primary block mb-1">Profilbild hochladen</span>
                <span className="text-[10px] text-theme-muted block leading-relaxed font-semibold">Klicke auf das Vorschaubild zum Auswählen. Maximal 1.5 MB (PNG/JPG).</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5 pl-1">Anzeigename</label>
              <input
                type="text" required value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-theme-muted uppercase tracking-wider mb-1.5 pl-1">Neues Passwort (optional)</label>
              <input
                type="password" value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Freilassen, falls unverändert"
                className="w-full px-4 py-2.5 bg-theme-input border border-theme-border rounded-xl text-theme-primary text-sm font-medium focus:outline-none focus:border-purple-500"
              />
            </div>
            {message && (
              <div className={`p-3 text-xs font-medium rounded-xl leading-relaxed ${
                message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border border-rose-500/20 text-rose-600'
              }`}>{message.text}</div>
            )}
            <div className="flex gap-2">
              <button
                type="submit" disabled={saving || editDisplayName.trim().length < 2}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Speichern
              </button>
              <button
                type="button"
                onClick={() => { setIsEditMode(false); setMessage(null); }}
                className="px-5 py-2.5 border border-theme-border text-theme-secondary hover:text-theme-primary font-semibold rounded-xl text-xs transition-all cursor-pointer"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<Trophy className="w-5 h-5" />} color="purple" label="Punkte" value={user.solvedCount} sub="gelöste Aufgaben" />
          <StatCard icon={<BookOpen className="w-5 h-5" />} color="emerald" label="Module" value={user.solvedCount > 0 ? 1 : 0} sub="aktive Fächer" />
          <StatCard icon={<Clock className="w-5 h-5" />} color="blue" label="Status" value={user.solvedCount >= 10 ? 'Fortgeschritten' : 'Anfänger'} sub="Lernniveau" />
        </div>

        <h3 className="text-sm font-bold text-theme-muted uppercase tracking-wider mb-4">Erfolge</h3>
        <div className="space-y-3">
          <Achievement icon={<Medal className="w-6 h-6" />} title="Erster Schritt" desc="Erste Aufgabe im Modul Lineare Algebra richtig gelöst." unlocked={user.solvedCount >= 1} color="yellow" />
          <Achievement icon={<Medal className="w-6 h-6" />} title="Matrix Meister" desc="Löse 10 Determinanten-Aufgaben fehlerfrei." unlocked={user.solvedCount >= 10} color="purple" />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; color: 'purple' | 'emerald' | 'blue'; label: string; value: number | string; sub: string }> = ({ icon, color, label, value, sub }) => {
  const colorMap = {
    purple: 'text-purple-600 dark:text-purple-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="p-4 bg-theme-card border border-theme-border rounded-2xl flex flex-col justify-between shadow-sm">
      <div className={`flex justify-between items-start ${colorMap[color]} mb-2`}>{icon}<span className="text-xs text-theme-muted font-bold uppercase tracking-wider">{label}</span></div>
      <div>
        <span className="text-2xl font-extrabold text-theme-primary">{value}</span>
        <span className="block text-xs text-theme-muted mt-1 font-semibold">{sub}</span>
      </div>
    </div>
  );
};

const Achievement: React.FC<{ icon: React.ReactNode; title: string; desc: string; unlocked: boolean; color: 'yellow' | 'purple' }> = ({ icon, title, desc, unlocked, color }) => {
  const colorMap = { yellow: 'text-yellow-500', purple: 'text-purple-500' };
  return (
    <div className={`flex items-center gap-3.5 p-3.5 rounded-2xl border transition-all ${
      unlocked ? 'bg-theme-card border-theme-border opacity-100 shadow-sm' : 'bg-theme-card/30 border-theme-border/30 opacity-40'
    }`}>
      <span className={unlocked ? colorMap[color] : 'text-theme-muted'}>{icon}</span>
      <div>
        <h4 className="text-sm font-bold text-theme-primary">{title}</h4>
        <p className="text-xs text-theme-muted font-medium">{desc}</p>
      </div>
    </div>
  );
};

export default ProfilePage;
