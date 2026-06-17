import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ArrowRight, Zap, Droplets, Bug, Radio } from 'lucide-react';
import newLandingBg from '../assets/new_landing_page.png';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="new-landing" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo-group">
            <span className="brand-name">GreenGeoFarm</span>
          </div>

          <div className="header-actions">
            <nav className="nav-menu">
              <Link to="/shop">Shop</Link>
              <div className="dropdown">
                <span className="dropdown-trigger">Our Products</span>
                <div className="dropdown-content">
                  <Link to="/management">Farm management software</Link>
                  <Link to="/sensors">Automatic Feed dispenser</Link>
                  <Link to="/sensors">Dung collector</Link>
                  <Link to="/sensors">Milking Robot</Link>
                </div>
              </div>
              <Link to="/community">Community</Link>
              <Link to="/about">About</Link>
            </nav>
            <div className="search-container">
              <Search size={18} />
              <input type="text" placeholder="Search ecosystem..." />
            </div>
            <button className="icon-btn"><Bell size={20} /></button>
            <button className="icon-btn"><User size={20} /></button>
            <Link to="/customer/signin" className="landing-auth-btn landing-auth-signin">Sign In</Link>
            <Link to="/customer/signup" className="landing-auth-btn landing-auth-signup">Sign Up</Link>
          </div>
        </div>
      </header>

      {/* Scrollable Full Image */}
      <div style={{ flex: 1, width: '100%', backgroundColor: '#000' }}>
        <img
          src={newLandingBg}
          alt="Farm Landing Background"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* New Footer */}
      <footer style={{
        backgroundColor: '#064e3b',
        color: 'white',
        padding: '3rem 5%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Contact Us</h4>
            <p>kunnipilly road,peruva, Green Geo Farms</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Mobile</h4>
            <p>+919746120384</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Email</h4>
            <p>hello@greengeofarm.com</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>WhatsApp</h4>
            <p>+1 (555) 987-6543</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Facebook</h4>
            <p>facebook.com/GreenGeoFarm</p>
          </div>
        </div>
        <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '800px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>© 2026 Green Geo Farm. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
