import React from "react";
import {
  FaEnvelope,
  FaExclamationCircle,
  FaLock,
  FaShieldAlt,
  FaSpinner,
  FaUser,
  FaUserPlus,
  FaVideo,
} from "react-icons/fa";
import { APP_CONFIG, ROUTES } from "../utils/constants";
import { Link } from "react-router-dom";

const AuthForm = ({
  mode,
  formData,
  onChange,
  onSubmit,
  loading,
  error,
  localError,
}) => {
  const isLogin = mode === "login";
  return (
    <div
      className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isLogin ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#0F0F13] dark:via-[#1A1A24] dark:to-[#22222E]" : "bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:from-[#1A1A24] dark:via-[#22222E] dark:to-[#0F0F13]"}`}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-4 ${isLogin ? "bg-gradient-to-br from-blue-600 to-indigo-600" : "bg-gradient-to-br from-purple-600 to-pink-600"}`}
          >
            {isLogin ? (
              <FaVideo className="w-8 h-8 text-white" />
            ) : (
              <FaUserPlus className="w-8 h-8 text-white" />
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {isLogin ? APP_CONFIG.APP_NAME : `Join ${APP_CONFIG.APP_NAME}`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin
              ? APP_CONFIG.APP_TAGLINE
              : "Start your learning journey today"}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1A24] rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 transition-all duration-300">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              {isLogin
                ? APP_CONFIG.AUTH_CONTENT.LOGIN.HEADING
                : APP_CONFIG.AUTH_CONTENT.REGISTER.HEADING}
            </h2>

            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              {isLogin
                ? APP_CONFIG.AUTH_CONTENT.LOGIN.DESCRIPTION
                : APP_CONFIG.AUTH_CONTENT.REGISTER.DESCRIPTION}
            </p>
          </div>

          <form
            className={isLogin ? "space-y-5" : "space-y-4"}
            onSubmit={onSubmit}
          >
            {(error || localError) && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg flex items-start">
                <FaExclamationCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error || localError}</span>
              </div>
            )}

            {!isLogin && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name || ""}
                    onChange={onChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#22222E] text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email || ""}
                  onChange={onChange}
                  className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#22222E] text-gray-900 dark:text-white focus:ring-2 transition-colors ${isLogin ? "focus:ring-blue-500 focus:border-blue-500" : "focus:ring-purple-500 focus:border-purple-500"}`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                  value={formData.password || ""}
                  onChange={onChange}
                  className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#22222E] text-gray-900 dark:text-white focus:ring-2 transition-colors ${isLogin ? "focus:ring-blue-500 focus:border-blue-500" : "focus:ring-purple-500 focus:border-purple-500"}`}
                  placeholder={isLogin ?'Enter your password' : 'Minimum 6 characters'}
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaShieldAlt className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete='new-password'
                    required
                    value={formData.confirmPassword || ""}
                    onChange={onChange}
                    className={`block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#22222E] text-gray-900 dark:text-white focus:ring-2 transition-colors focus:ring-purple-500 focus:border-purple-500`}
                    placeholder='Re-enter your password'
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] ${isLogin ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 mt-6'}`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"/>
                  {isLogin ? 'Signing...': 'Creating account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? (
                <>
                  Don't have an account{' '}
                  <Link to={ROUTES.REGISTER} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Create one now
                  </Link>
                </>
              ) : (
                <>
                  Already have an account{' '}
                  <Link to={ROUTES.LOGIN} className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                    Sign in here
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;