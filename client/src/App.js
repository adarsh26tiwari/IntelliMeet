import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import { ROUTES } from './utils/constants';
import Auth from './pages/Auth';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import HostSession from './pages/HostSession';
import JoinSession from './pages/JoinSession';
import { SessionProvider } from './context/sessionContext';
import { Toaster } from 'react-hot-toast';

function Layout({ children, showHeader = true, showFooter = true }) {
  return (
    <>
      {showHeader && <Header />}
      <main className={showHeader ? 'pt-16' : ''}>{children}</main>
      {showFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          <Router>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-card)',
                },
                success: {
                  duration: 3000,
                  iconTheme: { primary: '#4ADE80', secondary: '#fff' },
                },
                error: {
                  duration: 4000,
                  iconTheme: { primary: '#F87171', secondary: '#fff' },
                },
              }}
            />
            <div className="min-h-screen flex flex-col im-bg theme-transition">
              <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />

                <Route
                  path={ROUTES.LOGIN}
                  element={<Layout showHeader={false} showFooter={false}><Auth /></Layout>}
                />
                <Route
                  path={ROUTES.REGISTER}
                  element={<Layout showHeader={false} showFooter={false}><Auth /></Layout>}
                />

                {/* Protected routes */}
                <Route
                  path={ROUTES.DASHBOARD}
                  element={
                    <ProtectedRoute>
                      <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.HOST}
                  element={
                    <ProtectedRoute>
                      <Layout><HostSession /></Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path={ROUTES.JOIN}
                  element={
                    <ProtectedRoute>
                      <Layout><JoinSession /></Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="*"
                  element={
                    <Layout showHeader={false} showFooter={false}>
                      <div className="min-h-screen flex items-center justify-center im-bg">
                        <div className="text-center">
                          <h1 className="text-7xl font-bold mb-4" style={{ color: 'var(--color-accent)' }}>404</h1>
                          <p className="mb-6 text-lg" style={{ color: 'var(--color-text-2)' }}>Page not found</p>
                          <a
                            href="/"
                            className="btn-accent"
                            style={{ textDecoration: 'none' }}
                          >
                            Go home
                          </a>
                        </div>
                      </div>
                    </Layout>
                  }
                />
              </Routes>
            </div>
          </Router>
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;