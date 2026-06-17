import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getShopUsername, getShopToken } from '../utils/sessionStorage';
import axios from 'axios';
import {
  Bell, Home, Package, Settings, LayoutDashboard,
  Users, Heart, GitBranch, Activity, ShieldAlert,
  Wifi, Search, HelpCircle, LogOut, Zap, Database, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../Dashboard.css';
import { getManagementUsername, clearManagementSession } from '../utils/sessionStorage';
import LiveCattleMonitorWide from '../components/LiveCattleMonitorWide.jsx';

const Dashboard = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseAddress, setPurchaseAddress] = useState('');
  const [milkQuantity, setMilkQuantity] = useState('');
  const username = getManagementUsername() || 'Worker';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const user = getShopUsername();
    const token = getShopToken();
    const isLoggedIn = user && user !== 'null' && user !== 'undefined' && token && token !== 'null' && token !== 'undefined';
    
    if (isLoggedIn && params.get('purchase') === '1') {
      setIsPurchaseModalOpen(true);
    }
  }, [location.search]);

  const handlePurchaseClick = () => {
    const user = getShopUsername();
    const token = getShopToken();
    const isLoggedIn = user && user !== 'null' && user !== 'undefined' && token && token !== 'null' && token !== 'undefined';
    
    if (isLoggedIn) {
      setIsPurchaseModalOpen(true);
    } else {
      navigate('/customer/signin', { state: { from: '/dashboard', openPurchase: true } });
    }
  };

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    console.log('Purchase submitted', { purchaseName, purchaseAddress, milkQuantity });
    alert('Purchase request sent!');
    setIsPurchaseModalOpen(false);
    setPurchaseName('');
    setPurchaseAddress('');
    setMilkQuantity('');
  };

  const [feedStockPercentage, setFeedStockPercentage] = useState(0);
  const [farmAssets, setFarmAssets] = useState([]);
  const [dbCattle, setDbCattle] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const feedResponse = await axios.get('/api/feed-stock');
        const feedStocks = feedResponse.data;
        if (feedStocks.length > 0) {
          const totalPercentage = feedStocks.reduce((acc, curr) => {
            const percentage = (curr.weight / curr.maxCapacity) * 100;
            return acc + percentage;
          }, 0);
          setFeedStockPercentage(Math.round(totalPercentage / feedStocks.length));
        } else {
          setFeedStockPercentage(0);
        }

        const assetsResponse = await axios.get('/api/farm-assets');
        setFarmAssets(assetsResponse.data);

        const cattleResponse = await axios.get('/api/cattle');
        setDbCattle(cattleResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, []);

  const assetsNeedingService = farmAssets.filter(asset => {
    if (asset.status === 'Maintenance Required') return true;
    if (asset.nextServiceDate && new Date(asset.nextServiceDate) < new Date()) return true;
    return false;
  });

  const managementItems = [
    { title: 'Herd Management', desc: 'Real-time biological monitoring and pedigree tracking.', icon: <Users size={24} />, color: '#eefdf5', link: '/cattle-management' },
    { title: 'Supply Chain', desc: 'Global feed inventory and automated logistics monitoring.', icon: <Package size={24} />, color: '#fffbeb', link: '/feed-stock' },
    { title: 'Health Tracking', desc: 'Monitor vital statistics and biological health alerts.', icon: <Heart size={24} />, color: '#fff7ed', link: '/health-tracking' },
    { title: 'Asset Logistics', desc: 'Facility health and equipment lifecycle management.', icon: <Settings size={24} />, color: '#f8fafc', link: '/farm-assets', alert: assetsNeedingService.length > 0 ? `${assetsNeedingService.length} Requires Service` : null },
    { title: 'Precision Milking', desc: 'Automated yield tracking and quality assurance protocols.', icon: <Activity size={24} />, color: '#f1f5f9', link: '/cattle-management' },
    { title: 'Daily Briefing', desc: 'Comprehensive daily snapshot of operations, herd, and carbon.', icon: <ClipboardList size={24} />, color: '#f5f3ff', link: '/daily-summary' },
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
            <span>ENTERPRISE UNIT 01</span>
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
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}>
            <GitBranch size={20} />
            <span>Genetic Analysis</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/feed-stock')}>
            <Package size={20} />
            <span>Supply Chain</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>System Control</div>
          <div className="cd-nav-item" onClick={() => navigate('/farm-assets')}>
            <Settings size={20} />
            <span>Asset Logistics</span>
          </div>
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
              {/* Purchase Button */}
      <button
        onClick={handlePurchaseClick}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '16px 32px',
          fontSize: '1.1rem',
          fontWeight: '600',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.1)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🛒 Purchase Now
      </button>

      {isPurchaseModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <h2 style={{ color: '#064e3b', marginBottom: '20px' }}>Complete Your Purchase</h2>
            <form onSubmit={handlePurchaseSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label>Full Name</label>
                <input type="text" value={purchaseName} onChange={(e) => setPurchaseName(e.target.value)} required style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Delivery Address</label>
                <input type="text" value={purchaseAddress} onChange={(e) => setPurchaseAddress(e.target.value)} required style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label>Milk Quantity (L)</label>
                <input type="number" min="0" value={milkQuantity} onChange={(e) => setMilkQuantity(e.target.value)} required style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} style={{ padding: '8px 16px' }}>Cancel</button>
                <button type="submit" style={{ backgroundColor: '#10b981', color: 'white', padding: '8px 16px', border: 'none' }}>Confirm Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </footer>
      </aside>

      {/* ── Main Dashboard Content ── */}
      <main className="cd-main-content">
        {/* ── Navbar ── */}
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Welcome Back, {username.split(' ')[0]}</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>System efficiency is currently at 98.2% across all sectors.</p>
          </div>
          <div className="cd-toolbar">
            <div className="cd-search">
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Scan protocols..." />
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
          <div className="cd-card cd-widget-card">
            <div className="cd-widget-header">
              <span>Production Output</span>
              <Activity size={18} color="#166534" />
            </div>
            <div className="cd-widget-value">5.2L</div>
            <div className="cd-widget-status">
              <div className="cd-status-dot"></div>
              +3.1% Avg Milk/Cow
            </div>
          </div>

          <div className="cd-card cd-widget-card">
            <div className="cd-widget-header">
              <span>Health Bio-Sync</span>
              <ShieldAlert size={18} color="#991b1b" />
            </div>
            <div className="cd-widget-value">03</div>
            <div className="cd-widget-status">
              <div className="cd-status-dot" style={{ background: '#ef4444' }}></div>
              Active Health Alerts
            </div>
          </div>

          <div className="cd-card cd-widget-card" onClick={() => navigate('/feed-stock')} style={{ cursor: 'pointer' }}>
            <div className="cd-widget-header">
              <span>Supply Integrity</span>
              <Zap size={18} color="#92400e" />
            </div>
            <div className="cd-widget-value">{feedStockPercentage}%</div>
            <div className="cd-widget-status">
              <div className="cd-status-dot" style={{ background: feedStockPercentage > 50 ? '#22c55e' : '#f59e0b' }}></div>
              {feedStockPercentage > 50 ? 'Optimal Inventory' : 'Reorder Recommended'}
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

export default Dashboard;
