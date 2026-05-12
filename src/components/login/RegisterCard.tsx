import { type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export type RegisterCardProps = {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  error: string | null;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
};

export function RegisterCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  error,
  loading,
  onSubmit,
}: RegisterCardProps) {
  return (
    <div className="auth-card">
      <h1>Sign up</h1>
      <p className="muted">Password must be at least 8 characters.</p>
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? '…' : 'Create account'}
        </button>
      </form>
      <p className="muted small">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
