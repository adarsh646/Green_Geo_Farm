import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import logo from '../assets/cattle-logo.png';
import '../Auth.css';

const CustomerSignup = () => {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const { username, email, phone, password } = formData;
      const role = 'customer';
      await axios.post('/api/auth/register', { username, email, phone, password, role });
      alert('Registration successful! Please login.');
      navigate('/customer/signin');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={logo} alt="GreenGeoFarm Logo" className="auth-logo" />
          <h1 className="auth-title">Customer Registration</h1>
        </div>
        <p className="auth-subtitle">
          Join GreenGeoFarm as a customer
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
              <input 
                name="username" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input 
                name="email" 
                type="email" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="input-wrapper">
              <Phone className="input-icon" size={20} />
              <input 
                name="phone" 
                type="tel" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
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
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input 
                name="confirmPassword" 
                type={showPassword ? "text" : "password"} 
                onChange={handleChange} 
                required 
              />
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>

          <button type="submit" className="btn-auth">Sign Up</button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/customer/signin" className="footer-link">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerSignup;
