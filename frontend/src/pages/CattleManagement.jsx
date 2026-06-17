import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, X, Search, Info, Activity, LayoutDashboard, 
  Users, Heart, GitBranch, Settings, BarChart3, HelpCircle, LogOut,
  Database, Package, Radio, ClipboardList
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  clearManagementSession,
  getManagementRole,
  getManagementToken
} from '../utils/sessionStorage';
import { buildApiUrl } from '../api/http';
import LiveCattleMonitorWide from '../components/LiveCattleMonitorWide.jsx';
import '../Dashboard.css';
import './CattleDetails.css';

const CattleManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = getManagementRole() === 'admin';
  
  const [cattle, setCattle] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(location.state?.initialFilter || '');
  const [query, setQuery] = useState(location.state?.initialFilter || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const [formData, setFormData] = useState({
    tagNumber: '',
    breed: '',
    age: '',
    gender: 'Female',
    healthStatus: 'Healthy',
    weight: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [predictedBreed, setPredictedBreed] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const API_URL = '/api/cattle';
  const BASE_URL = buildApiUrl('');

  const fetchCattle = async ({ page = 1, queryValue = query, append = false, signal } = {}) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await axios.get(API_URL, {
        params: {
          page,
          limit,
          search: queryValue || undefined,
        },
        signal,
      });

      const data = response.data.items || response.data;
      const count = response.data.totalCount ?? data.length;

      setCattle((prev) => (append ? [...prev, ...data] : data));
      setTotalCount(count);
      setHasMore(page * limit < count);
      setPage(page);
    } catch (err) {
      if (axios.isCancel(err)) {
        return;
      }
      console.error('Error fetching cattle', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filteredCattle = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return cattle;

    return cattle.filter((item) => {
      const tag = item.tagNumber || '';
      const breed = item.breed || '';
      const gender = item.gender || '';

      return (
        tag.toLowerCase().includes(term) ||
        breed.toLowerCase().includes(term) ||
        gender.toLowerCase().includes(term)
      );
    });
  }, [cattle, searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCattle({ page: 1, queryValue: query, append: false, signal: controller.signal });
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      setQuery(searchTerm.trim());
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    
    if (file) {
      setIsPredicting(true);
      setPredictedBreed(null);
      try {
        const predData = new FormData();
        predData.append('file', file);
        
        const response = await axios.post(`${API_URL}/predict`, predData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data && response.data.prediction) {
           setPredictedBreed({
             breed: response.data.prediction,
             confidence: response.data.confidence
           });
           setFormData(prev => ({ ...prev, breed: response.data.prediction }));
        }
      } catch (err) {
        console.error('Error predicting breed:', err);
      } finally {
        setIsPredicting(false);
      }
    } else {
      setPredictedBreed(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getManagementToken();

    if (!isAdmin) {
      alert('Only admin can add cattle images and records.');
      return;
    }

    if (!token) {
      alert('Session expired. Please sign in again.');
      navigate('/management/login');
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) {
      data.append('image', imageFile);
    }
    
    try {
      await axios.post(API_URL, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setShowAddForm(false);
      setFormData({
        tagNumber: '',
        breed: '',
        age: '',
        gender: 'Female',
        healthStatus: 'Healthy',
        weight: '',
      });
      setImageFile(null);
      setPredictedBreed(null);
      setIsPredicting(false);
      fetchCattle();
    } catch (err) {
      alert('Error adding cattle');
    }
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
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}>
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

      {/* ── Main Dashboard Content ── */}
      <main className="cd-main-content">
        {/* ── Navbar ── */}
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Herd Bio-Logistics</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Active biological units under surveillance: {cattle.length}</p>
          </div>
          <div className="cd-toolbar">
            <div className="cd-search">
              <Search size={16} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Scan RFID/Breed..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {isAdmin && (
              <button className="cd-btn-primary" onClick={() => setShowAddForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '24px', fontSize: '15px' }}>
                <Plus size={18} /> New Profile
              </button>
            )}
          </div>
        </header>

        {/* ── Management Table View ── */}
        <div className="cd-card">
          <div className="cd-section-header">
            <Database size={16} color="#64748b" />
            <h3>Active Biological Profiles</h3>
          </div>
          
          <div className="cattle-list-container">
            {loading ? (
              <div className="loading" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Initializing bio-matrix...</div>
            ) : (
              <>
                {filteredCattle.map((item) => (
                  <div 
                    key={item._id} 
                    className="cattle-item-row" 
                    onClick={() =>
                      navigate(`/cattle-details/${item._id}`, {
                        state: { cattle: item }
                      })
                    }
                    style={{ 
                      padding: '16px', 
                      borderRadius: '12px', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div className="cattle-avatar" style={{ width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                      {item.imageUrl ? (
                        <img loading="lazy" src={`${BASE_URL}${item.imageUrl}`} alt="Cattle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div className="avatar-placeholder" style={{ background: '#f1f5f9', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          {item.tagNumber ? item.tagNumber.charAt(0) : '?'}
                        </div>
                      )}
                    </div>
                    <div className="cattle-info-main" style={{ flex: 1 }}>
                      <div className="cattle-row-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="cattle-tag-number" style={{ fontWeight: 800, fontSize: '15px' }}>{item.tagNumber || 'Unknown'}</span>
                        <span className={`status-dot ${(item.healthStatus || '').toLowerCase()}`} style={{ width: '6px', height: '6px', borderRadius: '50%', background: (item.healthStatus || 'Healthy') === 'Healthy' ? '#22c55e' : '#ef4444' }}></span>
                      </div>
                      <div className="cattle-row-subtext" style={{ fontSize: '12px', color: '#64748b' }}>
                        {item.breed} • {item.age} Years • {item.gender}
                      </div>
                    </div>
                    <div className="cattle-row-action" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <button 
                        className="btn-add-record-mini" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/cattle-records', {
                            state: { 
                              cattleId: item._id, 
                              tagNumber: item.tagNumber, 
                              breed: item.breed, 
                              age: item.age 
                            }
                          });
                        }}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                        title="Add Daily Record"
                      >
                        <Plus size={16} color="#64748b" />
                      </button>
                      <Info size={18} color="#94a3b8" />
                    </div>
                  </div>
                ))}
                {filteredCattle.length === 0 && !loading && (
                  <p className="no-data" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No biological signatures found.
                  </p>
                )}

                {hasMore && !loading && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <button
                      className="cd-btn-secondary"
                      onClick={() => fetchCattle({ page: page + 1, queryValue: query, append: true })}
                      disabled={loadingMore}
                      style={{ padding: '10px 20px', borderRadius: '24px' }}
                    >
                      {loadingMore ? 'Loading more...' : 'Load more cattle'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Live Footage Panel ── */}
        <div className="cd-card" style={{ marginTop: '24px' }}>
          <div className="cd-section-header" style={{ marginBottom: '16px' }}>
            <Radio size={16} color="#ef4444" style={{ animation: 'pill-pulse 1.6s ease-in-out infinite' }} />
            <h3>Live Camera Footage</h3>
            <span style={{
              marginLeft: 'auto',
              fontSize: '10px', fontWeight: 700, color: '#ef4444',
              background: '#fee2e2', borderRadius: '4px', padding: '2px 8px',
              letterSpacing: '0.5px',
            }}>● LIVE</span>
          </div>

          <LiveCattleMonitorWide cattleList={cattle} />
        </div>
      </main>

      {/* Add Cattle Modal */}
      {showAddForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content cd-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>New Bio-Profile</h2>
              <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#64748b" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="cattle-form">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tag Number</label>
                <input 
                  name="tagNumber" 
                  value={formData.tagNumber} 
                  onChange={handleChange} 
                  placeholder="e.g. TX-402" 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Breed</label>
                  <input 
                    name="breed" 
                    value={formData.breed} 
                    onChange={handleChange} 
                    placeholder="e.g. Angus" 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Age (Y)</label>
                  <input 
                    name="age" 
                    type="number" 
                    value={formData.age} 
                    onChange={handleChange} 
                    required 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Gender</label>
                  <select 
                    name="gender" 
                    value={formData.gender} 
                    onChange={handleChange}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Weight (Kg)</label>
                  <input 
                    name="weight" 
                    type="number" 
                    value={formData.weight} 
                    onChange={handleChange} 
                    placeholder="Optional" 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Asset Bio-Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  style={{ fontSize: '12px' }}
                />
                {isPredicting && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Predicting breed using AI...</div>}
                {predictedBreed && (
                  <div style={{ fontSize: '12px', color: '#22c55e', marginTop: '8px', fontWeight: 700 }}>
                    Predicted Breed: {predictedBreed.breed} ({predictedBreed.confidence})
                  </div>
                )}
              </div>

              <button type="submit" className="cd-btn-primary" style={{ width: '100%', padding: '14px' }}>Commit Profile to Mesh</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CattleManagement;
