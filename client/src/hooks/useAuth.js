import { useEffect, useState } from 'react';
import { getHealth, getMe, logout as apiLogout } from '../api.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMe(), getHealth()])
      .then(([me, h]) => {
        setUser(me.user);
        setHealth(h);
      })
      .catch(() => setHealth({ ok: false }))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  return { user, health, loading, logout };
}
