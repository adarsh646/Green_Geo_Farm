import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Home, User, Users, Activity, Package,
  TrendingUp, Search, Plus, Milk, Calendar, Settings, 
  BarChart3, ChevronRight, LayoutDashboard, Heart, 
  GitBranch, HelpCircle, LogOut, ShieldAlert, Zap,
  Database, Wifi, Wrench, Leaf, CalendarDays, ShoppingBag
} from 'lucide-react';
import { getManagementUsername, clearManagementSession } from '../utils/sessionStorage';
import LiveCattleMonitorWide from '../components/LiveCattleMonitorWide.jsx';
import '../Dashboard.css';
import './CattleDetails.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const username = getManagementUsername() || 'Administrator';
  const [dbRanchers, setDbRanchers] = useState([]);
  const [dbCattle, setDbCattle] = useState([]);
  const [feedStockPercentage, setFeedStockPercentage] = useState(0);
  const [farmAssets, setFarmAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const RANCHERS_API = '/api/users/ranchers';
  const CATTLE_API = '/api/cattle';
  const FEED_STOCK_API = '/api/feed-stock';
  const FARM_ASSETS_API = '/api/farm-assets';

  const fetchData = async () => {
    try {
      const [ranchersRes, cattleRes, feedStockRes, assetsRes] = await Promise.all([
        axios.get(RANCHERS_API),
        axios.get(CATTLE_API),
        axios.get(FEED_STOCK_API),
        axios.get(FARM_ASSETS_API)
      ]);
      setDbRanchers(ranchersRes.data);
      setDbCattle(cattleRes.data);
      setFarmAssets(assetsRes.data);

      const feedStocks = feedStockRes.data;
      if (feedStocks.length > 0) {
        const totalPercentage = feedStocks.reduce((acc, curr) => {
          const percentage = (curr.weight / curr.maxCapacity) * 100;
          return acc + percentage;
        }, 0);
        setFeedStockPercentage(Math.round(totalPercentage / feedStocks.length));
      } else {
        setFeedStockPercentage(0);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const assetsNeedingService = farmAssets.filter(asset => {
    if (asset.status === 'Maintenance Required') return true;
    if (asset.nextServiceDate && new Date(asset.nextServiceDate) < new Date()) return true;
    return false;
  });

  const managementItems = [
    { title: 'Manage Workers', desc: 'Authorize biological unit handlers and manage accounts.', icon: <Users size={24} />, color: '#f3e5f5', link: '/manage-workers' },
    { title: 'Attendance', desc: 'Track morning and evening presence for every worker.', icon: <CalendarDays size={24} />, color: '#eef2ff', link: '/attendance' },
    { title: 'Herd Management', desc: 'Real-time biological monitoring and pedigree tracking.', icon: <Activity size={24} />, color: '#eefdf5', link: '/cattle-management' },
    { title: 'Health Tracking', desc: 'Monitor vital statistics and biological health alerts.', icon: <Heart size={24} />, color: '#fef2f2', link: '/health-tracking' },
    { title: 'Supply Chain', desc: 'Global feed inventory and automated logistics monitoring.', icon: <Package size={24} />, color: '#fffbeb', link: '/feed-stock' },
    { title: 'Asset Logistics', desc: 'Facility health and equipment lifecycle management.', icon: <Settings size={24} />, color: '#f8fafc', link: '/farm-assets', alert: assetsNeedingService.length > 0 ? `${assetsNeedingService.length} Requires Service` : null },
    { title: 'Enterprise Reports', desc: 'Full-spectrum financial and operational diagnostic data.', icon: <BarChart3 size={24} />, color: '#f1f5f9', link: '/enterprise-reports' },
    { title: 'Carbon Intelligence', desc: 'Live carbon score, emission analytics, and biogas recovery metrics.', icon: <Leaf size={24} />, color: '#f0fdf4', link: '/carbon-intelligence' },
    { title: 'Customers', desc: 'View all registered shop customers and their contact details.', icon: <ShoppingBag size={24} />, color: '#ecfdf5', link: '/customers' },
  ];

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
            <Activity size={24} />
          </div>
          <div className="cd-logo-text">
            GreenGeoFarm
            <span>ENTERPRISE ADMIN</span>
          </div>
        </div>

        <nav className="cd-sidebar-nav">
          <div className="nav-group-label">Core Operations</div>
          <div className="cd-nav-item active" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={20} />
            <span>Command Center</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/cattle-management')}>
            <Users size={20} />
            <span>Herd Management</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/health-tracking')}>
            <Heart size={20} />
            <span>Health Tracking</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>Strategic Insights</div>
          <div className="cd-nav-item" onClick={() => navigate('/manage-workers')}>
            <Users size={20} />
            <span>Worker Matrix</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/attendance')}>
            <CalendarDays size={20} />
            <span>Attendance</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/feed-stock')}>
            <Package size={20} />
            <span>Supply Chain</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/customers')}>
            <ShoppingBag size={20} />
            <span>Customers</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>System Control</div>
          <div className="cd-nav-item" onClick={() => navigate('/farm-assets')}>
            <Settings size={20} />
            <span>Asset Logistics</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/enterprise-reports')}>
            <BarChart3 size={20} />
            <span>Enterprise Reports</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/carbon-intelligence')}>
            <Leaf size={20} />
            <span>Emission Controller</span>
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

      {/* ── Main Dashboard Content ── */}
      <main className="cd-main-content">
        {/* ── Navbar ── */}
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Admin Console <ShieldAlert size={18} color="#ef4444" style={{ marginLeft: '8px' }} /></h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>System-wide diagnostics: All biological sensors active.</p>
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

        {/* ── Top Efficiency Widgets ── */}
        <div className="cd-top-widgets" style={{ marginBottom: '24px' }}>
          <div className="cd-card cd-widget-card" onClick={() => navigate('/manage-workers')} style={{ cursor: 'pointer' }}>
            <div className="cd-widget-header">
              <span>Human Resources</span>
              <Users size={18} color="#1e40af" />
            </div>
            <div className="cd-widget-value">{dbRanchers.length}</div>
            <div className="cd-widget-status">
              <div className="cd-status-dot"></div>
              Active Worker Nodes
            </div>
          </div>

          <div className="cd-card cd-widget-card" onClick={() => navigate('/cattle-management')} style={{ cursor: 'pointer' }}>
            <div className="cd-widget-header">
              <span>Biological Assets</span>
              <Activity size={18} color="#166534" />
            </div>
            <div className="cd-widget-value">{dbCattle.length}</div>
            <div className="cd-widget-status">
              <div className="cd-status-dot"></div>
              Synced Biological Profiles
            </div>
          </div>

          <div className="cd-card cd-widget-card">
            <div className="cd-widget-header">
              <span>Global Supply</span>
              <Zap size={18} color="#92400e" />
            </div>
            <div className="cd-widget-value">{feedStockPercentage}%</div>
            <div className="cd-widget-status">
              <div className="cd-status-dot" style={{ background: feedStockPercentage > 50 ? '#22c55e' : '#f59e0b' }}></div>
              Asset Preservation Level
            </div>
          </div>
        </div>

        {/* ── Main Operations Grid ── */}
        <div className="cd-grid-container" style={{ gridTemplateColumns: '1fr' }}>
          {/* Main Matrix Column */}
          <div className="cd-left-column">
            <div className="cd-card">
              <div className="cd-section-header">
                <Database size={16} color="#64748b" />
                <h3>Management Matrix</h3>
              </div>
              <div className="management-tiles-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {managementItems.map((item, i) => (
                  <div key={i} className="manage-tile-modern" onClick={() => item.link ? navigate(item.link, { state: item.state }) : null} style={{ flex: '1 1 calc(25% - 20px)', minWidth: '280px', height: 'auto' }}>
                    <div className="tile-icon-box" style={{ background: item.color, color: '#1e293b', marginBottom: '12px' }}>
                      {item.icon}
                    </div>
                    <div className="tile-info">
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b', wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}>{item.desc}</p>
                      {item.alert && <span className="alert-pill" style={{ marginTop: '12px', display: 'inline-block' }}>{item.alert}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Camera Matrix */}
            <div className="cd-card" style={{ marginTop: '24px' }}>
              <div className="cd-section-header">
                <Wifi size={16} color="#64748b" />
                <h3>System-Wide Monitoring</h3>
              </div>
              <LiveCattleMonitorWide cattleList={dbCattle} />
            </div>
          </div>


        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
