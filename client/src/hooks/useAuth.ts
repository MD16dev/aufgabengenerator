import { useState, useCallback } from 'react';
import type { UserProfile } from '../types';

const API_BASE = 'http://localhost:5001';

/**
 * Handles authentication session state: token verification, logout and
 * profile updates (display name, password, avatar).
 */
export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  // Verify token and fetch user session on load
  const checkUserSession = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoadingUser(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (err) {
      console.error('Session-Check fehlgeschlagen:', err);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  // Profile update submission
  const updateProfile = async (payload: {
    displayName: string;
    profilePic: string;
    newPassword: string;
  }) => {
    const token = localStorage.getItem('auth_token');
    if (!user || !token) throw new Error('Nicht authentifiziert.');

    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Fehler beim Aktualisieren des Profils.');
    }
    await checkUserSession();
    return data;
  };

  return { user, setUser, loadingUser, checkUserSession, handleLogout, updateProfile };
}
