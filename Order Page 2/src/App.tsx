import { useState } from 'react';
import { DairyOrderPage } from './components/DairyOrderPage';
import { LoginPage } from './components/LoginPage';

interface User {
  name: string;
  email: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <DairyOrderPage user={user} onLogout={handleLogout} />;
}