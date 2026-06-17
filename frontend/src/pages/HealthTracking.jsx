import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Bell, Home, Activity, LayoutDashboard, Users, 
  Heart, GitBranch, Settings, BarChart3, HelpCircle, 
  LogOut, ShieldAlert, Package, ClipboardList
} from 'lucide-react';
import { clearManagementSession, getManagementRole } from '../utils/sessionStorage';
import '../Dashboard.css';
import './CattleDetails.css';

const HealthTracking = () => {
  const navigate = useNavigate();
  const isAdmin = getManagementRole() === 'admin';

  const handleHomeSessionEnd = () => {
    clearManagementSession();
    navigate('/management', { replace: true });
  };

  return (
    <div className="cattle-details-layout dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
          <div className="cd-logo-img">
            <Heart size={24} color="#ef4444" />
          </div>
          <div className="cd-logo-text">
            GreenGeoFarm
            <span>HEALTH TRACKING</span>
          </div>
        </div>

        <nav className="cd-sidebar-nav">
          <div className="nav-group-label">Core Operations</div>
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={20} />
            <span>Command Center</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/cattle-management')}>
            <Users size={20} />
            <span>Herd Management</span>
          </div>
          <div className="cd-nav-item active">
            <Heart size={20} />
            <span>Health Tracking</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>Strategic Insights</div>
          <div className="cd-nav-item" onClick={() => isAdmin ? navigate('/manage-workers') : navigate('/dashboard')}>
            {isAdmin ? <Users size={20} /> : <GitBranch size={20} />}
            <span>{isAdmin ? 'Worker Matrix' : 'Genetic Analysis'}</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/feed-stock')}>
            <Package size={20} />
            <span>Supply Chain</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>System Control</div>
          <div className="cd-nav-item" onClick={() => navigate('/farm-assets')}>
            <Settings size={20} />
            <span>Facility Ops</span>
          </div>
          {isAdmin && (
            <div className="cd-nav-item" onClick={() => navigate('/enterprise-reports')}>
              <BarChart3 size={20} />
              <span>Enterprise Reports</span>
            </div>
          )}
          <div className="cd-nav-item" onClick={() => navigate('/daily-summary')}>
            <ClipboardList size={20} />
            <span>Daily Briefing</span>
          </div>
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}>
            <HelpCircle size={20} />
            <span>Support</span>
          </div>
          <div className="cd-nav-item" onClick={() => {
            clearManagementSession();
            navigate('/management/login');
          }}>
            <LogOut size={20} />
            <span>Termination</span>
          </div>
        </footer>
      </aside>

      {/* ── Main Content ── */}
      <main className="cd-main-content">
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Health Tracking <ShieldAlert size={18} color="#ef4444" style={{ marginLeft: '8px' }} /></h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Biological health status and alert matrix.</p>
          </div>
          <div className="cd-toolbar">
            <div className="cd-search">
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Global search..." />
            </div>
            <Home
              size={20}
              color="#64748b"
              style={{ cursor: 'pointer' }}
              onClick={handleHomeSessionEnd}
            />
            <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        {/* Placeholder Content */}
        <div style={{ marginTop: '40px', padding: '40px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
          <Heart size={48} color="#ef4444" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h2 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Health Tracking Dashboard</h2>
          <p style={{ margin: 0 }}>This section will display health metrics, disease incidence, and veterinary event timelines.</p>
        </div>
      </main>
    </div>
  );
};

export default HealthTracking;
