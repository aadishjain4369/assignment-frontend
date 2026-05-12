import { type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export type LoginCardProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function LoginCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  error,
  loading,
  onSubmit,
}: LoginCardProps) {
  return (
    <div className="auth-card">
      <h1>Log in</h1>
      <form onSubmit={onSubmit} className="stack">
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? '…' : 'Continue'}
        </button>
      </form>
      <p className="muted small">
        No account? <Link to="/register">Sign up</Link>
      </p>
    </div>
  );
}
