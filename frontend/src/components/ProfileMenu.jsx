import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, CheckCircle2, Lock, LogOut, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  clearManagementSession,
  getManagementEmail,
  getManagementRole,
  getManagementUsername,
} from '../utils/sessionStorage';

const ProfileMenu = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const navigate = useNavigate();
  const username = getManagementUsername() || 'Worker';
  const email = getManagementEmail() || 'Email not available';
  const role = getManagementRole() || 'Manager';
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowMenu(false);
        setShowProfileDetails(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearManagementSession();
    navigate('/management/login');
  };

  return (
    <div className="profile-menu-container" ref={containerRef}>
      <button
        type="button"
        className="profile-toggle"
        onClick={() => {
          setShowMenu((prev) => {
            const next = !prev;
            if (next) setShowProfileDetails(true);
            return next;
          });
        }}
        aria-label="Open profile menu"
      >
        <User size={18} />
      </button>

      {showMenu && (
        <div className="profile-menu">
          <button
            type="button"
            className="profile-menu-item"
            onClick={() => setShowProfileDetails((prev) => !prev)}
          >
            <span className="profile-menu-label">
              <User size={16} />
              Profile
            </span>
            <ChevronRight size={18} className={showProfileDetails ? 'rotated' : ''} />
          </button>

          <button type="button" className="profile-menu-item logout-btn" onClick={handleLogout}>
            <span className="profile-menu-label">
              <LogOut size={16} />
              Log Out
            </span>
          </button>

          {showProfileDetails && (
            <div className="profile-details-panel">
              <div className="profile-details-heading">Profile information</div>
              <div className="profile-detail-row">
                <Mail size={14} />
                <span>{email || 'Email not available'}</span>
              </div>
              <div className="profile-detail-row">
                <CheckCircle2 size={14} />
                <span>{username}</span>
              </div>
              <div className="profile-detail-row">
                <span className="role-pill">{role.toUpperCase()}</span>
              </div>
              <button type="button" className="change-password-btn">
                <Lock size={14} />
                <span>Change password</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
