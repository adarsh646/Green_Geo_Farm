import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/cattle-logo.png';
import '../Auth.css';
import {
  clearLegacySession,
  setManagementSession,
  setShopSession,
} from '../utils/sessionStorage';

const Login = ({ setAuth, portal = 'shop' }) => {
  const isManagementPortal = portal === 'management';
  const signupPath = isManagementPortal ? '/management/signup' : '/shop/signup';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [actionText, setActionText] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setInfoMessage('');
    setActionLink('');
    setActionText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/auth/login', formData);
      clearLegacySession();

      if (isManagementPortal) {
        if (response.data.role === 'customer' || response.data.role === 'shopkeeper') {
          setError('You need to purchase cattle management software to continue.');
          setInfoMessage('Shop access is available for customer and shopkeeper accounts. Management access is for worker/admin only.');
          setActionLink('/shop');
          setActionText('Go to Shop');
          return;
        }

        setManagementSession({
          token: response.data.token,
          username: response.data.username,
          email: response.data.email || formData.email,
          role: response.data.role,
        });
        setAuth({ module: 'management', role: response.data.role });
        navigate('/dashboard');
        return;
      }

      if (!['customer', 'shopkeeper'].includes(response.data.role)) {
        setError('This sign in is only for shop accounts.');
        setInfoMessage('Worker/Admin users should sign in from the Cattle Management page.');
        setActionLink('/management/login');
        setActionText('Go to Management Sign In');
        return;
      }

      setShopSession({
        token: response.data.token,
        username: response.data.username,
        email: response.data.email || formData.email,
        role: response.data.role,
      });
      setAuth({ module: 'shop', role: response.data.role });
      navigate('/shop');
    } catch (err) {
      setInfoMessage('');
      setActionLink('');
      setActionText('');
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="GreenGeoFarm Logo" className="auth-logo" />
          <h1 className="auth-title">Sign In</h1>
        </div>
        <p className="auth-subtitle">
          {isManagementPortal
            ? 'Enter worker/admin credentials to access cattle management software'
            : 'Enter your credentials to access the shop'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input 
                name="email" 
                type="email" 
                placeholder="worker@example.com" 
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
            {infoMessage && (
              <div className="auth-info-box">
                <p className="info-message">{infoMessage}</p>
                {actionLink && (
                  <Link to={actionLink} className="info-action-link">
                    {actionText}
                  </Link>
                )}
              </div>
            )}
          </div>

          <button type="submit" className="btn-auth">Sign In</button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to={signupPath} className="footer-link">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
