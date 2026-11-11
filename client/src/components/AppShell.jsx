import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, PlusCircle, Building2, Shield, UserCheck, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="app-container">
      {/* Desktop Left Rail */}
      <aside className="app-rail">
        <div className="app-rail-header">
          <NavLink to="/" className="wordmark">Sourcing CRM</NavLink>
        </div>

        <nav className="app-rail-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} strokeWidth={1.5} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/clients" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={18} strokeWidth={1.5} />
            <span>Clients</span>
          </NavLink>

          <NavLink to="/clients/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <PlusCircle size={18} strokeWidth={1.5} />
            <span>New visit</span>
          </NavLink>

          <NavLink to="/partners" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Building2 size={18} strokeWidth={1.5} />
            <span>Partners</span>
          </NavLink>

          {isAdmin && (
            <NavLink to="/team" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Shield size={18} strokeWidth={1.5} />
              <span>Team</span>
            </NavLink>
          )}

          <NavLink to="/account" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <UserCheck size={18} strokeWidth={1.5} />
            <span>Account</span>
          </NavLink>
        </nav>

        <div className="app-rail-footer">
          <div className="text-meta">
            <strong>{user?.displayName}</strong>
            <div>{user?.role === 'admin' ? 'Admin' : 'Sourcing Manager'}</div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={handleLogout}
          >
            <LogOut size={16} strokeWidth={1.5} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-content">
        <Outlet />
      </main>

      {/* Mobile Drawer (When More is tapped) */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 27, 24, 0.4)',
            zIndex: 60,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              width: '260px',
              height: '100%',
              backgroundColor: 'var(--paper)',
              padding: 'var(--space-24) var(--space-16)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-dropdown)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-24)' }}>
              <span className="wordmark" style={{ fontSize: '20px' }}>Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                aria-label="Close menu"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)', flex: 1 }}>
              <NavLink
                to="/partners"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 size={18} strokeWidth={1.5} />
                <span>Partners</span>
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/team"
                  className="nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield size={18} strokeWidth={1.5} />
                  <span>Team</span>
                </NavLink>
              )}

              <NavLink
                to="/account"
                className="nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserCheck size={18} strokeWidth={1.5} />
                <span>Account</span>
              </NavLink>
            </nav>

            <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-16)' }}>
              <div className="text-meta" style={{ marginBottom: 'var(--space-12)' }}>
                <strong>{user?.displayName}</strong>
                <div>{user?.role === 'admin' ? 'Admin' : 'Sourcing Manager'}</div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                style={{ width: '100%' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut size={16} strokeWidth={1.5} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Bar (under 720px) */}
      <nav className="mobile-bottom-bar" aria-label="Mobile navigation">
        <NavLink to="/" end className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} strokeWidth={1.5} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/clients" end className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <Users size={20} strokeWidth={1.5} />
          <span>Clients</span>
        </NavLink>

        <NavLink to="/clients/new" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
          <PlusCircle size={20} strokeWidth={1.5} />
          <span>New visit</span>
        </NavLink>

        <button
          type="button"
          className="mobile-nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} strokeWidth={1.5} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
