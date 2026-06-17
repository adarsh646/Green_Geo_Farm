import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Home, Trash2, Mail, User as UserIcon, Search, Lock, Plus,
  Activity, LayoutDashboard, Users, Heart, CalendarDays, HelpCircle, LogOut,
  PencilLine, X, BadgeInfo, CircleDollarSign, BriefcaseBusiness, Clock3
} from 'lucide-react';
import { clearManagementSession, getManagementUsername } from '../utils/sessionStorage';
import './ManageRanchers.css';

const emptyWorkerForm = {
  username: '',
  email: '',
  password: '',
  workerType: 'daily_wage',
  monthlySalary: '',
  wagePerDay: '',
};

const normalizeWorker = (worker) => ({
  ...worker,
  workerType: worker.workerType || 'daily_wage',
  monthlySalary: worker.monthlySalary ?? '',
  wagePerDay: worker.wagePerDay ?? '',
});

const ManageRanchers = () => {
  const [ranchers, setRanchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [newRancher, setNewRancher] = useState(emptyWorkerForm);
  const navigate = useNavigate();
  const username = getManagementUsername() || 'Administrator';

  const API_URL = '/api/users/ranchers';

  const fetchRanchers = async () => {
    try {
      const response = await axios.get(API_URL);
      setRanchers((response.data || []).map(normalizeWorker));
    } catch (err) {
      console.error('Error fetching ranchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanchers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rancher? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        await fetchRanchers();
      } catch (err) {
        alert('Error deleting rancher');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRancher((prev) => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 12; i += 1) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewRancher((prev) => ({ ...prev, password: generated }));
  };

  const resetForm = () => {
    setNewRancher(emptyWorkerForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);

    const payload = {
      username: newRancher.username,
      email: newRancher.email,
      password: newRancher.password,
      workerType: newRancher.workerType,
      monthlySalary: newRancher.workerType === 'permanent' ? newRancher.monthlySalary : '',
      wagePerDay: newRancher.workerType === 'daily_wage' ? newRancher.wagePerDay : '',
    };

    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
        alert('Worker updated successfully');
      } else {
        await axios.post(API_URL, payload);
        alert('Worker account created successfully');
      }
      resetForm();
      await fetchRanchers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving worker');
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (worker, event) => {
    event.stopPropagation();
    setSelectedWorker(null);
    setEditingId(worker._id);
    setNewRancher({
      username: worker.username || '',
      email: worker.email || '',
      password: '',
      workerType: worker.workerType || 'daily_wage',
      monthlySalary: worker.monthlySalary ?? '',
      wagePerDay: worker.wagePerDay ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredRanchers = useMemo(() => ranchers.filter((r) =>
    r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  ), [ranchers, searchTerm]);

  const closeModal = () => setSelectedWorker(null);

  return (
    <div className="manage-ranchers-layout">
      <aside className="manage-sidebar">
        <div className="manage-sidebar-logo">
          <div className="manage-logo-img"><Activity size={24} /></div>
          <div className="manage-logo-text">GreenGeoFarm<span>ENTERPRISE ADMIN</span></div>
        </div>

        <nav className="manage-sidebar-nav">
          <div className="nav-group-label">Core Operations</div>
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}><LayoutDashboard size={20} /><span>Command Center</span></div>
          <div className="cd-nav-item active" onClick={() => navigate('/manage-workers')}><Users size={20} /><span>Worker Matrix</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/attendance')}><CalendarDays size={20} /><span>Attendance</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/health-tracking')}><Heart size={20} /><span>Health Tracking</span></div>
        </nav>

        <footer className="manage-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}><HelpCircle size={20} /><span>Support</span></div>
          <div className="cd-nav-item" onClick={() => { clearManagementSession(); navigate('/management/login'); }}><LogOut size={20} /><span>Termination</span></div>
        </footer>
      </aside>

      <main className="manage-main-content manage-ranchers-main">
        <header className="manage-navbar">
          <div className="manage-nav-title-group">
            <h1 className="manage-nav-title">Manage Workers</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Logged in as {username}</p>
          </div>
          <div className="manage-toolbar">
            <div className="manage-search">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Home size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')} />
            <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        <section className="create-rancher-card">
          <h2>{editingId ? 'Update Worker' : 'Create Worker'}</h2>
          <form className="create-rancher-form" onSubmit={handleSubmit}>
            <div className="credential-input">
              <UserIcon size={16} />
              <input type="text" name="username" placeholder="Username" value={newRancher.username} onChange={handleInputChange} required />
            </div>

            <div className="credential-input">
              <Mail size={16} />
              <input type="email" name="email" placeholder="worker@example.com" value={newRancher.email} onChange={handleInputChange} required />
            </div>

            <div className="credential-input">
              <Lock size={16} />
              <input type="text" name="password" placeholder={editingId ? 'Leave blank to keep current password' : 'Password'} value={newRancher.password} onChange={handleInputChange} />
            </div>

            <div className="credential-input">
              <BriefcaseBusiness size={16} />
              <select name="workerType" value={newRancher.workerType} onChange={handleInputChange}>
                <option value="daily_wage">Daily Wage</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>

            {newRancher.workerType === 'permanent' ? (
              <div className="credential-input">
                <CircleDollarSign size={16} />
                <input type="number" name="monthlySalary" placeholder="Monthly salary" value={newRancher.monthlySalary} onChange={handleInputChange} required />
              </div>
            ) : (
              <div className="credential-input">
                <Clock3 size={16} />
                <input type="number" name="wagePerDay" placeholder="Wage per day" value={newRancher.wagePerDay} onChange={handleInputChange} required />
              </div>
            )}

            <div className="credential-actions">
              <button type="button" className="btn-generate-password" onClick={generatePassword}>Generate Password</button>
              <button type="button" className="btn-generate-password" onClick={resetForm}>Reset</button>
              <button type="submit" className="btn-add-rancher" disabled={creating}>
                <Plus size={16} />
                {creating ? 'Saving...' : editingId ? 'Update Worker' : 'Add Worker'}
              </button>
            </div>
          </form>
        </section>

        <section className="ranchers-list-main">
          {loading ? (
            <div className="loading">Loading workers...</div>
          ) : (
            <div className="ranchers-grid compact-grid">
              {filteredRanchers.map((rancher) => (
                <div key={rancher._id} className="rancher-row-card compact-card" onClick={() => setSelectedWorker(rancher)}>
                  <div className="rancher-details compact-details">
                    <h3>{rancher.username}</h3>
                    <div className="rancher-meta">
                      <Mail size={14} />
                      <span>{rancher.email}</span>
                    </div>
                    <div className="worker-badges">
                      <span className="worker-badge">{rancher.workerType === 'permanent' ? 'Permanent' : 'Daily Wage'}</span>
                      <span className="worker-badge subtle">{rancher.workerType === 'permanent' ? `Salary: ${rancher.monthlySalary ?? 'N/A'}` : `Wage/day: ${rancher.wagePerDay ?? 'N/A'}`}</span>
                    </div>
                  </div>
                  <div className="rancher-actions compact-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-mini btn-edit" onClick={(e) => beginEdit(rancher, e)} title="Edit worker">
                      <PencilLine size={16} />
                    </button>
                    <button className="btn-mini btn-delete" onClick={() => handleDelete(rancher._id)} title="Delete worker">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredRanchers.length === 0 && <p className="no-data">No workers found.</p>}
            </div>
          )}
        </section>

        {selectedWorker && (
          <div className="worker-modal-backdrop" onClick={closeModal}>
            <div className="worker-modal" onClick={(e) => e.stopPropagation()}>
              <div className="worker-modal-header">
                <div>
                  <span className="worker-modal-kicker"><BadgeInfo size={14} /> Worker Details</span>
                  <h3>{selectedWorker.username}</h3>
                </div>
                <button className="worker-modal-close" onClick={closeModal}><X size={18} /></button>
              </div>

              <div className="worker-modal-grid">
                <div><label>Email</label><p>{selectedWorker.email}</p></div>
                <div><label>Worker Type</label><p>{selectedWorker.workerType === 'permanent' ? 'Permanent' : 'Daily Wage'}</p></div>
                <div><label>Monthly Salary</label><p>{selectedWorker.monthlySalary ?? 'N/A'}</p></div>
                <div><label>Wage Per Day</label><p>{selectedWorker.wagePerDay ?? 'N/A'}</p></div>
                <div><label>Created</label><p>{selectedWorker.createdAt ? new Date(selectedWorker.createdAt).toLocaleString() : 'N/A'}</p></div>
                <div><label>Updated</label><p>{selectedWorker.updatedAt ? new Date(selectedWorker.updatedAt).toLocaleString() : 'N/A'}</p></div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageRanchers;
