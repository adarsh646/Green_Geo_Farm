import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/cattle-logo.png';
import '../Auth.css';
import {
  clearLegacySession,
  setShopSession,
} from '../utils/sessionStorage';

const CustomerSignin = ({ setAuth }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', formData);
      clearLegacySession();

      if (response.data.role !== 'customer') {
        setError('This sign in is only for customer accounts.');
        return;
      }

      setShopSession({
        token: response.data.token,
        username: response.data.username,
        email: response.data.email || formData.email,
        role: response.data.role,
      });
      if (setAuth) {
        setAuth({ module: 'shop', role: response.data.role });
      }
      let redirectTo = location.state?.from || '/customer/dashboard';
      if (location.state?.openPurchase) {
        redirectTo += '?purchase=1';
      }
      navigate(redirectTo);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="GreenGeoFarm Logo" className="auth-logo" />
          <h1 className="auth-title">Customer Sign In</h1>
        </div>
        <p className="auth-subtitle">
          Enter your credentials to access your customer account
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input 
                name="email" 
                type="email" 
                placeholder="customer@example.com" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>Password</label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="........" 
                onChange={handleChange} 
                required 
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>

          <button type="submit" className="btn-auth">Sign In</button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/customer/signup" className="footer-link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerSignin;
