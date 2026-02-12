import { NavLink, Outlet } from 'react-router-dom';
import { Settings, MessageSquare, GitBranch, Download } from 'lucide-react';

const navItems = [
  { to: '/', icon: Settings, label: 'Preferences' },
  { to: '/conversations', icon: MessageSquare, label: 'Conversations' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/export', icon: Download, label: 'Export' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <h1>opencontext</h1>
          <span className="header-tagline">
            Portable AI preferences &amp; context
          </span>
        </div>
      </header>

      <div className="app-body">
        <nav className="app-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
