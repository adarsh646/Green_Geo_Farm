import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Syringe, Cross, Activity, BookOpen, User, Calendar } from 'lucide-react';
import { getManagementToken } from '../utils/sessionStorage';

const API_URL = '/api/cattle';

const EventLogging = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cattle, setCattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    eventType: 'Vaccination',
    eventDate: new Date().toISOString().split('T')[0],
    doctorName: '',
    medicineGiven: '',
    notes: '',
  });

  useEffect(() => {
    const fetchCattle = async () => {
      try {
        const token = getManagementToken();
        const response = await axios.get(`${API_URL}/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCattle(response.data);
      } catch (err) {
        console.error('Error fetching cattle:', err);
        setError('Failed to load cattle details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCattle();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg('');
    setError('');

    try {
      const token = getManagementToken();
      await axios.post(`${API_URL}/${id}/events`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('Event logged successfully!');
      setTimeout(() => {
        navigate(`/cattle-details/${id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.response?.data?.message || 'Failed to log event.');
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Loading Event System...</div>;
  if (!cattle) return <div className="error-container">Cattle not found</div>;

  return (
    <div className="cattle-details-layout">
      {/* Sidebar Area (Placeholder for layout consistency) */}
      <aside className="cd-sidebar" style={{ width: '250px' }}>
         <div className="cd-sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="cd-logo-img">
              <User size={24} />
            </div>
            <div className="cd-logo-text">
              GreenGeoFarm
              <span>ENTERPRISE UNIT 01</span>
            </div>
         </div>
      </aside>

      <main className="cd-main-content">
        <header className="cd-navbar">
          <div className="cd-navbar-left">
             <button className="cd-btn-secondary" style={{ marginRight: '16px', padding: '6px 12px' }} onClick={() => navigate(`/cattle-details/${id}`)}>
               <ArrowLeft size={16} /> Back
             </button>
            <h2 className="cd-nav-title">Event Logging: {cattle.tagNumber}</h2>
          </div>
        </header>

        <div className="cd-dashboard-body" style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '40px' }}>
          <div className="cd-card" style={{ padding: '32px' }}>
            <div className="cd-section-header" style={{ marginBottom: '24px' }}>
              <BookOpen size={24} color="#2563eb" />
              <h2>Log New Event</h2>
            </div>
            
            {error && <div style={{ color: '#ef4444', marginBottom: '16px', padding: '12px', background: '#fef2f2', borderRadius: '8px' }}>{error}</div>}
            {successMsg && <div style={{ color: '#16a34a', marginBottom: '16px', padding: '12px', background: '#f0fdf4', borderRadius: '8px' }}>{successMsg}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Event Type *</label>
                  <select 
                    name="eventType" 
                    value={formData.eventType} 
                    onChange={handleChange} 
                    className="cd-search" 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px' }}
                    required
                  >
                    <option value="Vaccination">Vaccination</option>
                    <option value="Insemination">Insemination</option>
                    <option value="Medicine">Medicine Given</option>
                    <option value="Treatment">Other Treatment</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="date" 
                      name="eventDate" 
                      value={formData.eventDate} 
                      onChange={handleChange} 
                      className="cd-search" 
                      style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px' }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Doctor/Veterinarian Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    name="doctorName" 
                    placeholder="e.g. Dr. Smith"
                    value={formData.doctorName} 
                    onChange={handleChange} 
                    className="cd-search" 
                    style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Medicine / Vaccine / Details</label>
                <div style={{ position: 'relative' }}>
                  <Syringe size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    name="medicineGiven" 
                    placeholder="e.g. Amoxicillin 500mg"
                    value={formData.medicineGiven} 
                    onChange={handleChange} 
                    className="cd-search" 
                    style={{ width: '100%', padding: '12px 12px 12px 36px', borderRadius: '8px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '8px', display: 'block' }}>Additional Notes</label>
                <textarea 
                  name="notes" 
                  rows="4"
                  placeholder="Any additional observations or follow-up requirements..."
                  value={formData.notes} 
                  onChange={handleChange} 
                  className="cd-search" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                <button type="button" className="cd-btn-secondary" onClick={() => navigate(`/cattle-details/${id}`)} style={{ borderRadius: '24px', padding: '12px 24px', fontSize: '15px', minWidth: '120px' }}>Cancel</button>
                <button type="submit" className="cd-btn-primary" disabled={isSubmitting} style={{ borderRadius: '24px', padding: '12px 24px', fontSize: '15px', minWidth: '160px' }}>
                  {isSubmitting ? 'Saving...' : 'Save Event Log'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventLogging;
