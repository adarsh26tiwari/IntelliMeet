import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import AuthForm from '../components/AuthForm';

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const mode = location.pathname === ROUTES.REGISTER ? 'register' : 'login';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: "",
    confirmPassword: ""
  });
  const [localError, setLocalError] = useState('');

  const { login, register, loading, error, isAuthenticated, clearError } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD)
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setLocalError('');
    clearError();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'login') {
      if (!formData.email || !formData.password) {
        setLocalError('Please fill in all fields');
        return;
      }
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate(ROUTES.DASHBOARD)
      }
    } else {
      if (!formData.name || !formData.email || !formData.password) {
        setLocalError('Please fill in all fields')
        return;
      }
      if (formData.password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      const result = await register(formData.name, formData.email, formData.password);
      if (result.success) {
        navigate(ROUTES.DASHBOARD)
      }
    }
  }

  return (
    <AuthForm
      mode={mode}
      formData={formData}
      onChange={handleChange}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      localError={localError}
    />
  )
}

export default Auth;