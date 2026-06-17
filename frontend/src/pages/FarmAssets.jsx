import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Search, ArrowLeft, Settings, Calendar, Info, Trash2, Wrench, Edit, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../CattleManagement.css'; // Reusing styles
import { getManagementRole } from '../utils/sessionStorage';
import { buildApiUrl } from '../api/http';

const FarmAssets = () => {
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const userRole = getManagementRole();
  const isAdmin = userRole === 'admin';

  const [formData, setFormData] = useState({
    name: '',
    type: 'Machine',
    description: '',
    purchaseDate: '',
    lastServiceDate: '',
    nextServiceDate: '',
    status: 'Active',
  });
  const [imageFile, setImageFile] = useState(null);

  const API_URL = '/api/farm-assets';
  const BASE_URL = buildApiUrl('');

  const fetchAssets = async () => {
    try {
      const response = await axios.get(API_URL);
      setAssets(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching assets');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Machine',
      description: '',
      purchaseDate: '',
      lastServiceDate: '',
      nextServiceDate: '',
      status: 'Active',
    });
    setImageFile(null);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  };

  const isServiceDue = (asset) => {
    if (asset.status === 'Maintenance Required') return true;
    const nextService = asset.nextServiceDate ? new Date(asset.nextServiceDate) : null;
    if (nextService && nextService < new Date()) return true;
    return false;
  };

  const handleEdit = (asset) => {
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      lastServiceDate: asset.lastServiceDate ? asset.lastServiceDate.split('T')[0] : '',
      nextServiceDate: asset.nextServiceDate ? asset.nextServiceDate.split('T')[0] : '',
      status: asset.status,
    });
    setEditingId(asset._id);
    setIsEditing(true);
    setShowForm(true);
    setSelectedAsset(null); // Close detail modal if open
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) {
      data.append('image', imageFile);
    }

    try {
      if (isEditing) {
        await axios.patch(`${API_URL}/${editingId}`, data);
      } else {
        await axios.post(API_URL, data);
      }
      resetForm();
      fetchAssets();
    } catch (err) {
      alert(`Error ${isEditing ? 'updating' : 'adding'} asset`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setSelectedAsset(null);
      fetchAssets();
    } catch (err) {
      alert('Error deleting asset');
    }
  };

  const filteredAssets = assets.filter((asset) => {
    const term = searchTerm.toLowerCase();
    return (
      asset.name.toLowerCase().includes(term) ||
      asset.type.toLowerCase().includes(term)
    );
  });

  return (
    <div className="cattle-mgmt-container">
      <header className="cattle-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>Farm Assets</h1>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="cattle-list-main">
        {loading ? (
          <div className="loading">Loading assets...</div>
        ) : (
          <div className="cattle-list-container">
            {filteredAssets.map((asset) => (
              <div 
                key={asset._id} 
                className={`cattle-item-row ${isServiceDue(asset) ? 'service-due' : ''}`} 
                onClick={() => setSelectedAsset(asset)}
              >
                <div className="cattle-avatar">
                  {asset.imageUrl ? (
                    <img src={`${BASE_URL}${asset.imageUrl}`} alt="Asset" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <Settings size={24} color="#9c27b0" />
                  )}
                </div>
                <div className="cattle-info-main">
                  <div className="cattle-row-header">
                    <span className="cattle-tag-number">{asset.name}</span>
                    {isServiceDue(asset) && (
                      <span className="service-badge-mini">Service Needed</span>
                    )}
                    <span className={`status-dot ${asset.status.replace(' ', '-').toLowerCase()}`}></span>
                  </div>
                  <div className="cattle-row-subtext">
                    {asset.type} • Status: {asset.status}
                  </div>
                </div>
                <div className="cattle-row-action">
                  <Info size={20} />
                </div>
              </div>
            ))}
            {assets.length === 0 && <p className="no-data">No farm assets found.</p>}
          </div>
        )}
      </main>

      {isAdmin && (
        <button className="fab-add" onClick={() => { setIsEditing(false); setShowForm(true); }}>
          <Plus size={28} />
        </button>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Asset' : 'Add New Asset'}</h2>
              <button className="close-btn" onClick={resetForm}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="cattle-form">
              <div className="form-group">
                <label>Asset Name</label>
                <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Motor Pump A" required />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="Machine">Machine</option>
                    <option value="Motor Pump">Motor Pump</option>
                    <option value="Tractor">Tractor</option>
                    <option value="Irrigation System">Irrigation System</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="In Service">In Service</option>
                    <option value="Maintenance Required">Maintenance Required</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Details about the asset..." />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input name="purchaseDate" type="date" value={formData.purchaseDate} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Last Service</label>
                  <input name="lastServiceDate" type="date" value={formData.lastServiceDate} onChange={handleChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Next Service Date</label>
                <input name="nextServiceDate" type="date" value={formData.nextServiceDate} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label>Asset Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files[0])} 
                  />
                  <Camera size={20} color="#64748b" />
                </div>
              </div>

              <button type="submit" className="btn-submit-cattle">
                {isEditing ? 'Update Asset' : 'Save Asset'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedAsset && (
        <div className="modal-overlay">
          <div className="modal-content detail-modal">
            <div className="modal-header">
              <h2>Asset Details</h2>
              <button className="close-btn" onClick={() => setSelectedAsset(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="detail-card">
              {selectedAsset.imageUrl && (
                <div className="detail-image-container" style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', maxHeight: '400px', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center' }}>
                  <img 
                    src={`${BASE_URL}${selectedAsset.imageUrl}`} 
                    alt="Asset" 
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div className="detail-header-main">
                <div className="detail-tag-large">{selectedAsset.name}</div>
                <span className={`status-badge ${selectedAsset.status.replace(' ', '-').toLowerCase()}`}>
                  {selectedAsset.status}
                </span>
              </div>

              <div className="detail-info-grid">
                <div className="info-item">
                  <Settings size={20} />
                  <div>
                    <span className="info-label">Type</span>
                    <span className="info-value">{selectedAsset.type}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar size={20} />
                  <div>
                    <span className="info-label">Purchase Date</span>
                    <span className="info-value">{selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Wrench size={20} />
                  <div>
                    <span className="info-label">Last Service</span>
                    <span className="info-value">{selectedAsset.lastServiceDate ? new Date(selectedAsset.lastServiceDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="info-item">
                  <Calendar size={20} />
                  <div>
                    <span className="info-label">Next Service</span>
                    <span className="info-value" style={{ color: selectedAsset.nextServiceDate && new Date(selectedAsset.nextServiceDate) < new Date() ? '#ef4444' : 'inherit' }}>
                      {selectedAsset.nextServiceDate ? new Date(selectedAsset.nextServiceDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedAsset.description && (
                <div className="detail-description" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span className="info-label">Description</span>
                  <p style={{ marginTop: '5px', color: '#475569' }}>{selectedAsset.description}</p>
                </div>
              )}
            </div>
            
            {isAdmin && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  className="btn-submit-cattle" 
                  style={{ flex: 1, backgroundColor: '#3b82f6' }}
                  onClick={() => handleEdit(selectedAsset)}
                >
                  <Edit size={20} style={{ marginRight: '8px' }} />
                  Edit Asset
                </button>
                <button 
                  className="btn-submit-cattle" 
                  style={{ flex: 1, backgroundColor: '#ef4444' }}
                  onClick={() => handleDelete(selectedAsset._id)}
                >
                  <Trash2 size={20} style={{ marginRight: '8px' }} />
                  Delete
                </button>
              </div>
            )}
            <button className="btn-close-detail" onClick={() => setSelectedAsset(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmAssets;
