import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(() => localStorage.getItem('guest') === 'true');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, password, name) => {
    const res = await authAPI.register(email, password, name);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const loginAsGuest = useCallback(() => {
    localStorage.setItem('guest', 'true');
    setGuest(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('guest');
    setUser(null);
    setGuest(false);
  }, []);

  const updateUser = async (data) => {
    const res = await authAPI.updateProfile(data);
    setUser(res.data.user || res.data);
    return res.data;
  };

  const displayName = guest ? 'Guest' : (user?.name || 'User');

  const value = useMemo(() => ({
    user,
    loading,
    guest,
    displayName,
    login,
    register,
    loginAsGuest,
    logout,
    updateUser,
  }), [user, loading, guest, displayName, login, register, loginAsGuest, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
