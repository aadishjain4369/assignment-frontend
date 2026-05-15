import { type FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

import { LoginCard } from '../components/login/LoginCard';
import { useAuth } from '../context/AuthContext';

function isEmailAlreadyRegistered(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const m = err.message.toLowerCase();
  return m.includes('already registered') || m.includes('email already');
}

export function LoginPage() {
  const { token, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(email.trim(), password);
      navigate('/', { replace: true });
    } catch (regErr) {
      if (!isEmailAlreadyRegistered(regErr)) {
        setError(regErr instanceof Error ? regErr.message : 'Sign up failed');
        return;
      }
      try {
        await login(email.trim(), password);
        navigate('/', { replace: true });
      } catch {
        setError('Invalid email or password');
      }
    }
  }

  return (
    <LoginCard
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      error={error}
      loading={loading}
      onSubmit={onSubmit}
    />
  );
}
