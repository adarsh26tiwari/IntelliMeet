import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Link, useNavigate } from 'react-router-dom';
import { APP_CONFIG, ROUTES } from '../utils/constants';
import { FaVideo } from 'react-icons/fa';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 theme-transition"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-[#6C63FF] to-[#8B83FF] rounded-lg flex items-center justify-center shadow-md">
              <FaVideo className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: 'var(--color-accent)' }}
            >
              {APP_CONFIG.APP_NAME}
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to={ROUTES.DASHBOARD}
                  className="text-sm font-medium theme-transition px-3 py-2 rounded-lg hover:bg-[var(--color-surface-2)]"
                  style={{ color: 'var(--color-text-2)' }}
                >
                  Dashboard
                </Link>
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg theme-transition"
                  style={{ background: 'var(--color-surface-2)' }}
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-[#6C63FF] to-[#8B83FF] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className="text-sm font-medium hidden sm:inline"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium rounded-lg theme-transition"
                  style={{
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                    background: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-danger)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-danger)';
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium theme-transition px-3 py-2 rounded-lg"
                  style={{ color: 'var(--color-text-2)' }}
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="btn-accent"
                  style={{ padding: '8px 18px' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;