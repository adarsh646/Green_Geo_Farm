import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, Users, Heart, Package,
  Settings, BarChart3, Leaf, CalendarDays, HelpCircle,
  LogOut, Search, Home, Bell, ShoppingBag, Mail,
  Phone, X, UserCheck, UserX, Clock, TrendingUp
} from 'lucide-react';
import { clearManagementSession, getManagementUsername } from '../utils/sessionStorage';
import './CustomerView.css';
import '../pages/CattleDetails.css';

// ── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name = '') =>
  name.trim().slice(0, 2).toUpperCase() || '??';

const formatDate = (iso) => {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isNewCustomer = (createdAt) => {
  if (!createdAt) return false;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return new Date(createdAt) >= sevenDaysAgo;
};

// ── Component ────────────────────────────────────────────────────────────────

const CustomerView = () => {
  const navigate = useNavigate();
  const adminUsername = getManagementUsername() || 'Administrator';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ── Derived Stats ──────────────────────────────────────────────────────────

  const totalCustomers = customers.length;
  const newThisWeek = customers.filter((c) => isNewCustomer(c.createdAt)).length;
  const withPhone = customers.filter((c) => c.phone && c.phone.trim()).length;

  // ── Filtered List ──────────────────────────────────────────────────────────

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        (c.username || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    clearManagementSession();
    navigate('/management/login');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="cattle-details-layout dashboard-layout customer-view-layout">

      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
          <div className="cd-logo-img"><Activity size={24} /></div>
          <div className="cd-logo-text">
            GreenGeoFarm
            <span>ENTERPRISE ADMIN</span>
          </div>
        </div>

        <nav className="cd-sidebar-nav">
          <div className="nav-group-label">Core Operations</div>
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={20} /><span>Command Center</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/cattle-management')}>
            <Users size={20} /><span>Herd Management</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/health-tracking')}>
            <Heart size={20} /><span>Health Tracking</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>Strategic Insights</div>
          <div className="cd-nav-item" onClick={() => navigate('/manage-workers')}>
            <Users size={20} /><span>Worker Matrix</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/attendance')}>
            <CalendarDays size={20} /><span>Attendance</span>
          </div>
          <div className="cd-nav-item active" onClick={() => navigate('/customers')}>
            <ShoppingBag size={20} /><span>Customers</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/feed-stock')}>
            <Package size={20} /><span>Supply Chain</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>System Control</div>
          <div className="cd-nav-item" onClick={() => navigate('/farm-assets')}>
            <Settings size={20} /><span>Asset Logistics</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/enterprise-reports')}>
            <BarChart3 size={20} /><span>Enterprise Reports</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/carbon-intelligence')}>
            <Leaf size={20} /><span>Emission Controller</span>
          </div>
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}>
            <HelpCircle size={20} /><span>Support</span>
          </div>
          <div className="cd-nav-item" onClick={handleLogout}>
            <LogOut size={20} /><span>Termination</span>
          </div>
        </footer>
      </aside>

      {/* ── Main Content ── */}
      <main className="cd-main-content cv-main-content">

        {/* ── Navbar ── */}
        <header className="cd-navbar cv-navbar">
          <div className="cv-nav-title-group">
            <h1 className="cd-nav-title">
              <ShoppingBag size={20} color="#10b981" style={{ marginRight: '6px' }} />
              Customer Management
            </h1>
            <p>View and monitor all registered customers</p>
          </div>
          <div className="cv-toolbar cd-toolbar">
            <div className="cv-search cd-search">
              <Search size={16} color="#94a3b8" />
              <input
                id="customer-search-input"
                type="text"
                placeholder="Search customers…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Home
              size={20}
              color="#64748b"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            />
            <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        {/* ── Page Body ── */}
        <div className="cv-body">

          {/* ── Stats Row ── */}
          <div className="cv-stats-row">
            <div className="cv-stat-card">
              <div className="cv-stat-icon" style={{ background: '#f0fdf4' }}>
                <Users size={22} color="#16a34a" />
              </div>
              <div className="cv-stat-info">
                <span className="cv-stat-value">{totalCustomers}</span>
                <span className="cv-stat-label">Total Customers</span>
              </div>
            </div>

            <div className="cv-stat-card">
              <div className="cv-stat-icon" style={{ background: '#eff6ff' }}>
                <TrendingUp size={22} color="#2563eb" />
              </div>
              <div className="cv-stat-info">
                <span className="cv-stat-value">{newThisWeek}</span>
                <span className="cv-stat-label">New This Week</span>
              </div>
            </div>

            <div className="cv-stat-card">
              <div className="cv-stat-icon" style={{ background: '#fdf4ff' }}>
                <Phone size={22} color="#9333ea" />
              </div>
              <div className="cv-stat-info">
                <span className="cv-stat-value">{withPhone}</span>
                <span className="cv-stat-label">With Phone</span>
              </div>
            </div>
          </div>

          {/* ── Table Card ── */}
          <div className="cv-table-card">
            <div className="cv-table-header">
              <div className="cv-table-header-left">
                <Users size={16} color="#64748b" />
                <h2>Customer Directory</h2>
                <span className="cv-count-badge">{filteredCustomers.length}</span>
              </div>
            </div>

            <div className="cv-table-wrapper">
              {loading ? (
                <div className="cv-loading">
                  <div className="cv-spinner" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="cv-empty-state">
                  <UserX size={40} />
                  <p>{searchTerm ? 'No customers match your search.' : 'No customers registered yet.'}</p>
                </div>
              ) : (
                <table className="cv-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Joined</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer._id}
                        id={`customer-row-${customer._id}`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td>
                          <div className="cv-customer-cell">
                            <div className="cv-avatar">
                              {getInitials(customer.username)}
                            </div>
                            <span className="cv-customer-name">{customer.username}</span>
                          </div>
                        </td>
                        <td>{customer.email}</td>
                        <td>{customer.phone || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={13} color="#94a3b8" />
                            {formatDate(customer.createdAt)}
                          </div>
                        </td>
                        <td>
                          {isNewCustomer(customer.createdAt) ? (
                            <span className="cv-status-pill new">
                              <TrendingUp size={11} /> New
                            </span>
                          ) : (
                            <span className="cv-status-pill active">
                              <UserCheck size={11} /> Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Detail Modal ── */}
      {selectedCustomer && (
        <div
          id="customer-detail-modal"
          className="cv-modal-backdrop"
          onClick={() => setSelectedCustomer(null)}
        >
          <div className="cv-modal" onClick={(e) => e.stopPropagation()}>

            <div className="cv-modal-header">
              <div>
                <div className="cv-modal-avatar">
                  {getInitials(selectedCustomer.username)}
                </div>
                <p className="cv-modal-title">{selectedCustomer.username}</p>
                <p className="cv-modal-subtitle">Customer Profile</p>
              </div>
              <button
                className="cv-modal-close"
                onClick={() => setSelectedCustomer(null)}
                aria-label="Close customer detail"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cv-modal-body">
              <div className="cv-modal-grid">
                <div className="cv-modal-field full-width">
                  <label>Full Username</label>
                  <p>{selectedCustomer.username}</p>
                </div>
                <div className="cv-modal-field full-width">
                  <label>Email Address</label>
                  <p>
                    <Mail size={13} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#64748b' }} />
                    {selectedCustomer.email}
                  </p>
                </div>
                <div className="cv-modal-field">
                  <label>Phone Number</label>
                  <p>
                    {selectedCustomer.phone ? (
                      <>
                        <Phone size={13} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#64748b' }} />
                        {selectedCustomer.phone}
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Not provided</span>
                    )}
                  </p>
                </div>
                <div className="cv-modal-field">
                  <label>Status</label>
                  <p>
                    {isNewCustomer(selectedCustomer.createdAt) ? (
                      <span className="cv-status-pill new">
                        <TrendingUp size={11} /> New Customer
                      </span>
                    ) : (
                      <span className="cv-status-pill active">
                        <UserCheck size={11} /> Active
                      </span>
                    )}
                  </p>
                </div>
                <div className="cv-modal-field">
                  <label>Joined</label>
                  <p>{formatDate(selectedCustomer.createdAt)}</p>
                </div>
                <div className="cv-modal-field">
                  <label>Last Updated</label>
                  <p>{formatDate(selectedCustomer.updatedAt)}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
