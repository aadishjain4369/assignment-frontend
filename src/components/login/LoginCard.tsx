import { type FormEvent } from 'react';

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
      <h1>Login or Signup</h1>
      <p className="muted small">
        New here? Create your account. Already registered? Sign in with the same email and
        password.
      </p>
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
            minLength={8}
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
      <p className="muted small">Password must be at least 8 characters.</p>
    </div>
  );
}
