import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Save, Package, ArrowLeft, RefreshCw, X, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FeedStock.css';
import { getManagementRole } from '../utils/sessionStorage';
import { buildApiUrl } from '../api/http';

const FeedStock = () => {
  const navigate = useNavigate();
  const [feedStocks, setFeedStocks] = useState([]);
  const [newFeedType, setNewFeedType] = useState('');
  const [newMaxCapacity, setNewMaxCapacity] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [newFeedCategory, setNewFeedCategory] = useState('');
  const [selectedFeed, setSelectedFeed] = useState('');
  const [weight, setWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState(null);
  const [currentMaxCapacity, setCurrentMaxCapacity] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const role = getManagementRole();
    if (role) {
      setUserRole(role);
    }
    fetchFeedStocks(1);
  }, []);

  useEffect(() => {
    if (selectedFeed) {
      const feed = feedStocks.find(f => f.feedType === selectedFeed);
      if (feed) {
        setCurrentWeight(feed.weight);
        setCurrentMaxCapacity(feed.maxCapacity);
      }
    } else {
      setCurrentWeight(null);
      setCurrentMaxCapacity(null);
    }
  }, [selectedFeed, feedStocks]);

  const fetchFeedStocks = async (requestedPage = 1, append = false) => {
    if (!append) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await axios.get('/api/feed-stock', {
        params: {
          page: requestedPage,
          limit,
        }
      });

      const data = response.data.items || response.data;
      const totalCount = response.data.totalCount ?? data.length;

      setFeedStocks((prev) => (append ? [...prev, ...data] : data));
      setHasMore(requestedPage * limit < totalCount);
      setPage(requestedPage);
    } catch (error) {
      console.error('Error fetching feed stocks:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleAddFeedType = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('feedType', newFeedType);
    formData.append('maxCapacity', newMaxCapacity);
    formData.append('category', newFeedCategory);
    if (newImage) {
      formData.append('image', newImage);
    }

    try {
      await axios.post('/api/feed-stock/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewFeedType('');
      setNewMaxCapacity('');
      setNewImage(null);
      setNewFeedCategory('');
      setShowAddModal(false);
      fetchFeedStocks();
    } catch (error) {
      alert('Error adding feed type: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateWeight = async (e) => {
    e.preventDefault();
    const parsedWeight = parseInt(weight);
    if (isNaN(parsedWeight) || parsedWeight < 0) {
      alert('Please enter a valid positive weight');
      return;
    }
    try {
      await axios.put('/api/feed-stock/update-weight', { 
        feedType: selectedFeed, 
        weight: parsedWeight 
      });
      setWeight('');
      setSelectedFeed('');
      fetchFeedStocks();
      alert('Weight updated successfully!');
    } catch (error) {
      alert('Error updating weight: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRefillStock = async (e) => {
    e.preventDefault();
    if (!selectedFeed || !weight) {
      alert('Please select feed type and enter weight');
      return;
    }
    const parsedWeight = parseInt(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      alert('Please enter a valid positive integer for refilling');
      return;
    }
    try {
      await axios.put('/api/feed-stock/refill', { 
        feedType: selectedFeed, 
        weight: parsedWeight 
      });
      setWeight('');
      setSelectedFeed('');
      fetchFeedStocks();
      alert('Stock refilled successfully!');
    } catch (error) {
      alert('Error refilling stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDispenseStock = async (e) => {
    e.preventDefault();
    if (!selectedFeed || !weight) {
      alert('Please select feed type and enter weight');
      return;
    }
    const parsedWeight = parseInt(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      alert('Please enter a valid positive integer for dispensing');
      return;
    }
    try {
      await axios.put('/api/feed-stock/dispense', { 
        feedType: selectedFeed, 
        weight: parsedWeight 
      });
      setWeight('');
      setSelectedFeed('');
      fetchFeedStocks();
      alert('Feed dispensed successfully!');
    } catch (error) {
      alert('Error dispensing feed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteFeedStock = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feed type?')) return;
    try {
      await axios.delete(`/api/feed-stock/${id}`);
      fetchFeedStocks();
    } catch (error) {
      alert('Error deleting feed type: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="feed-stock-container">
      <div className="feed-stock-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1>Feed Stock Management</h1>
      </div>

      <div className="feed-stock-grid">
        <div className="feed-list-section">
          <h2>Current Stock</h2>
          {loading ? (
            <p className="no-data">Loading feed stock…</p>
          ) : feedStocks.length === 0 ? (
            <p className="no-data">No feed types added yet. {userRole === 'admin' ? 'Click the + button to add one.' : 'Waiting for admin to add feed types.'}</p>
          ) : (
            <div className="stock-cards">
              {feedStocks.map((stock) => (
                <div key={stock._id} className="stock-card">
                  {userRole === 'admin' && (
                    <button 
                      className="delete-stock-btn" 
                      onClick={() => handleDeleteFeedStock(stock._id)}
                      title="Delete Feed Type"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <div className="stock-image-container">
                    {stock.imageUrl ? (
                      <img loading="lazy" src={buildApiUrl(stock.imageUrl)} alt={stock.feedType} className="stock-image" />
                    ) : (
                      <Package size={48} />
                    )}
                  </div>
                  <div className="stock-info">
                    <h3>{stock.feedType}</h3>
                    <p style={{ color: '#0369a1', fontWeight: 600, fontSize: '0.85em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      {stock.category || 'Other'}
                    </p>
                    <p>Weight: <strong>{stock.weight} kg</strong></p>
                    <p>Max Capacity: <strong>{stock.maxCapacity} kg</strong></p>
                    <p>Availability: <strong>{Math.round((stock.weight / stock.maxCapacity) * 100)}%</strong></p>
                    <span>Last Updated: {new Date(stock.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && hasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <button
                className="cd-btn-secondary"
                onClick={() => fetchFeedStocks(page + 1, true)}
                disabled={loadingMore}
                style={{ padding: '10px 18px', borderRadius: '24px' }}
              >
                {loadingMore ? 'Loading more feed types...' : 'Load more feed types'}
              </button>
            </div>
          )}
          <form onSubmit={handleUpdateWeight} className="update-form">
            <div className="form-group">
              <label>Select Feed Type</label>
              <select 
                value={selectedFeed} 
                onChange={(e) => setSelectedFeed(e.target.value)}
                required
              >
                <option value="">Select Feed Type</option>
                {feedStocks.map((stock) => (
                  <option key={stock._id} value={stock.feedType}>
                    {stock.feedType}
                  </option>
                ))}
              </select>
            </div>

            {currentWeight !== null && (
              <div className="current-info">
                <p>Current Weight: <strong>{currentWeight} kg</strong></p>
                <p>Max Capacity: <strong>{currentMaxCapacity} kg</strong></p>
              </div>
            )}

            <div className="form-group">
              <label>Weight (kg)</label>
              <input 
                type="number" 
                placeholder="Enter weight" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)}
                min="0"
                step="1"
                required
              />
            </div>
            <div className="button-group">
            
              <button type="submit" className="save-btn">
                <Save size={20} /> Update {selectedFeed || 'Feed'} Weight
              </button>
              <button type="button" className="refill-btn" onClick={handleRefillStock}>
                <RefreshCw size={20} /> Re-fill Stock
              </button>
              <button type="button" className="dispense-btn" onClick={handleDispenseStock}>
                <Download size={20} /> Feed Dispensing
              </button>
            </div>
          </form>
        </div>
      </div>

      {userRole === 'admin' && (
        <button 
          className="floating-btn" 
          onClick={() => setShowAddModal(true)}
          title="Add New Feed Type"
        >
          <Plus size={32} />
        </button>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Feed Type</h3>
            <form onSubmit={handleAddFeedType}>
              <div className="form-group">
                <label>Feed Type Name</label>
                <input 
                  type="text" 
                  placeholder="Feed Type Name " 
                  value={newFeedType} 
                  onChange={(e) => setNewFeedType(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={newFeedCategory} 
                  onChange={(e) => setNewFeedCategory(e.target.value)}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Silage">Silage</option>
                  <option value="Fresh Green Grass">Fresh Green Grass</option>
                  <option value="Dry Fodder">Dry Fodder</option>
                  <option value="Concentrate">Concentrate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Maximum Capacity (kg)</label>
                <input 
                  type="number" 
                  placeholder="Enter Maximum Storage Capacity" 
                  value={newMaxCapacity} 
                  onChange={(e) => setNewMaxCapacity(e.target.value)}
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Feed Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setNewImage(e.target.files[0])}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedStock;
