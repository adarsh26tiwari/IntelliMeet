import { BrowserRouter as Router , Routes, Route } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
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
import {Toaster} from 'react-hot-toast'


function Layout({children,showHeader=true,showFooter=true}){
  return (
    <>
    {showHeader && <Header/>}
    <main className={showHeader ? 'pt-16' : ''}>
      {children}
    </main>
        {showFooter && <Footer/>}
    </>
  )
}

function App() {
  return (
   <AuthProvider>
    <SessionProvider>
    <Router>
      <Toaster
         position='top-right'
         toastOptions={{
          duration:3000,
          style:{
            background: '#363636',
            color:'#fff',
          },
          success:{
            duration:3000,
            iconTheme:{
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error:{
                  duration:4000,
            iconTheme:{
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
         }}
      />
      <div className='min-h-screen flex flex-col bg-gray-50'>
         <Routes>
          <Route 
          
            path='/'
            element={
              <Layout>
                <Home/>
              </Layout>
            }
          />

                  <Route 
          
            path={ROUTES.LOGIN}
            element={
              <Layout showHeader={false} showFooter={false}>
                <Auth/>
              </Layout>
            }
          />
                            <Route 
          
            path={ROUTES.REGISTER}
            element={
              <Layout showHeader={false} showFooter={false}>
                <Auth/>
              </Layout>
            }
          />


          {/* Protected routes */}
                            <Route 
          
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
              <Layout >
                <Dashboard/>
              </Layout>
              </ProtectedRoute>
            }
          />

                                      <Route 
          
            path={ROUTES.HOST}
            element={
              <ProtectedRoute>
              <Layout >
                <HostSession/>
              </Layout>
              </ProtectedRoute>
            }
          />

                                                <Route 
          
            path={ROUTES.JOIN}
            element={
              <ProtectedRoute>
              <Layout >
                <JoinSession/>
              </Layout>
              </ProtectedRoute>
            }
          />


         <Route
         path='*'
         element={
          <Layout showHeader={false} showFooter={false}>
            <div className='min-h-screen flex items-center justify-center'>
              <div className='text-center'>
                <h1 className='text-4xl font-bold text-gray-800 mb-4'>
                   404                  
                </h1>
                <p className='text-gray-600 mb-4'>Page not found</p>
                <a href='/' className='text-blue-600 hover:text-blue-500'>
                  Go to home
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
  );
}

export default App;