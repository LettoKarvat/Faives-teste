// app/contexts/AuthContext.jsx

import axios from 'axios';
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Nova função de login que chama a API real
  const login = async (email, password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      const { access_token } = res.data;

      // Guarde o token no localStorage, por exemplo
      localStorage.setItem('token', access_token);

      // Se quiser, busque dados do usuário logado ou guarde
      // algo como "setUser({ email, token: access_token })"
      setUser({ email, token: access_token });

      return true;
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      return false;
    }
  };

  const logout = () => {
    // Remove token do storage e limpa user
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
