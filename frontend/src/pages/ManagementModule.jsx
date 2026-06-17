import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/cattle-logo.png';
import '../ManagementModule.css';

const ManagementModule = () => {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-logo">
          <img src={logo} alt="GreenGeoFarm Logo" className="logo-img" />
          <span className="logo-text">GreenGeoFarm</span>
        </div>
        <div className="nav-actions">
          <Link to="/management/login" className="btn-login-nav">Sign In</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="smart-badge animate-fade-in">
            <span role="img" aria-label="cow">🐄</span> Smart Livestock Management
          </div>
          
          <h1 className="hero-title animate-slide-up">
            Manage Your Herd <i>Smarter</i>,<br /> Not Harder
          </h1>
          
          <p className="hero-description animate-slide-up-delayed">
            Track health records, breeding cycles, feed schedules, and 
            financials — all from one powerful platform built for modern 
            workers.
          </p>
        </div>
        
        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <div className="mouse">
            <div className="wheel"></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ManagementModule;
