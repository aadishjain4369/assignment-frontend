type DashboardHeaderProps = {
  email: string;
  onLogout: () => void;
};

export function DashboardHeader({ email, onLogout }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header bar">
      <div className="dashboard-header-brand">
        <span className="dashboard-header-title">Webhook Dashboard</span>
      </div>
      <div className="dashboard-header-user">
        <span className="dashboard-header-email" title={email}>
          {email}
        </span>
        <button type="button" className="linkish dashboard-header-signout" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
