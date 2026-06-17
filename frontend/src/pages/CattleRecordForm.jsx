import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, ClipboardList, Activity, Milk, ShoppingBasket, Heart, Thermometer, MapPin, AlertTriangle, X, Pencil, Trash2, Calendar } from 'lucide-react';
import '../CattleManagement.css';

const CattleRecordForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cattleId, tagNumber, breed, age } = location.state || {};

  const [feedStocks, setFeedStocks] = useState([]);
  const [selectedFeedType, setSelectedFeedType] = useState('');
  const [feedWeightTaken, setFeedWeightTaken] = useState('');
  const [selectedFeedsList, setSelectedFeedsList] = useState([]);
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);

  const [formData, setFormData] = useState({
    cattleId: cattleId || '',
    tagNumber: tagNumber || '',
    Breed: breed || '',
    Age: age || '',
    
    // Production
    Milk_AM: '',
    Milk_PM: '',
    Total_Milk: '',
    
    // Activity
    Number_of_Steps: '',
    Distance_Moved: '',
    Standing_Time: '',
    Lying_Time: '',
    Walking_Time: '',
    
    // Feeding
    Feeding_Time: '',
    Number_of_Feeding_Visits: '',
    Water_Intake: '',
    Water_pH: '',
    Rumination_Time: '',
    
    // Health
    Body_Temperature: '',
    Heart_Rate: '',
    Respiration_Rate: '',
    Ammonia_Level: '',
    Methane_Level: '',
    Carbon_Dioxide_Level: '',
    Cleanliness: 'Average',
    
    // Reproduction
    Estrus_Activity_Index: '',
    Mounting_Events: '',
    Pregnancy_Status: 'False',
    
    // Locomotion
    Gait_Score: '',
    Limb_Movement_Symmetry: 'Normal',
    
    // Environment
    Ambient_Temperature: '',
    Humidity: '',
    THI_Index: '',
    
    // Alerts
    Health_Risk_Score: '',
    Estrus_Probability: '',
    Lameness_Risk: 'Low'
  });

  useEffect(() => {
    fetchFeedStocks();
    if (cattleId) {
      fetchRecords();
      fetchNutritionPlan();
    }
  }, [cattleId]);
  
  const fetchNutritionPlan = async () => {
    try {
      const response = await axios.get(`/api/cattle/${cattleId}/nutrition-plans`);
      const plans = response.data;
      if (plans && plans.length > 0) {
        setDietPlan(plans[0]);
      } else {
        setDietPlan(null);
      }
    } catch (error) {
      console.error('Error fetching nutrition plan:', error);
    }
  };
  
  const fetchRecords = async () => {
    try {
      const response = await axios.get(`/api/cattle-records/cattle/${cattleId}`);
      // Sort by date descending
      const sortedRecords = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecords(sortedRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchFeedStocks = async () => {
    try {
      const response = await axios.get('/api/feed-stock');
      setFeedStocks(response.data);
    } catch (error) {
      console.error('Error fetching feed stocks:', error);
    }
  };

  const API_URL = '/api/cattle-records';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-calculate Total Milk
      if (name === 'Milk_AM' || name === 'Milk_PM') {
        const am = parseFloat(name === 'Milk_AM' ? value : prev.Milk_AM) || 0;
        const pm = parseFloat(name === 'Milk_PM' ? value : prev.Milk_PM) || 0;
        newData.Total_Milk = (am + pm).toFixed(2);
      }

      // Auto-calculate THI Index
      if (name === 'Ambient_Temperature' || name === 'Humidity') {
        const temp = parseFloat(name === 'Ambient_Temperature' ? value : prev.Ambient_Temperature) || 0;
        const rh = parseFloat(name === 'Humidity' ? value : prev.Humidity) || 0;
        
        // THI Formula: (0.8 × Tdb) + (RH/100) × (Tdb - 14.4) + 46.4
        const thi = (0.8 * temp) + (rh / 100) * (temp - 14.4) + 46.4;
        newData.THI_Index = thi.toFixed(1);
      }
      
      return newData;
    });
  };

  const handleAddFeedToList = () => {
    if (!selectedFeedType || !feedWeightTaken) {
      alert('Please select a feed type and enter weight');
      return;
    }
    
    const weight = parseInt(feedWeightTaken);
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight');
      return;
    }

    const feedStock = feedStocks.find(f => f.feedType === selectedFeedType);
    if (feedStock && feedStock.weight < weight) {
      alert(`Insufficient stock for ${selectedFeedType}. Available: ${feedStock.weight}kg`);
      return;
    }

    if (dietPlan && (dietPlan.dietPlan || dietPlan.diet_plan)) {
      const planLimits = dietPlan.dietPlan || dietPlan.diet_plan || {};
      const category = feedStock?.category || 'Other';
      let recommendedLimit = 0;
      
      if (category === 'Silage') recommendedLimit = parseFloat(planLimits.silage_kg) || 0;
      else if (category === 'Fresh Green Grass') recommendedLimit = parseFloat(planLimits.fresh_green_grass_kg) || 0;
      else if (category === 'Dry Fodder') recommendedLimit = parseFloat(planLimits.dry_fodder_straw_kg) || 0;
      else if (category === 'Concentrate') recommendedLimit = parseFloat(planLimits.concentrate_feed_kg) || 0;

      if (category !== 'Other') {
        const currentTotal = selectedFeedsList
          .filter(f => {
            const fs = feedStocks.find(s => s.feedType === f.feedType);
            return fs && fs.category === category;
          })
          .reduce((sum, f) => sum + parseFloat(f.weight), 0);

        if (currentTotal + weight > recommendedLimit) {
          alert(`Cannot add feed! This exceeds the recommended diet plan of ${recommendedLimit}kg for ${category}. Current selected total: ${currentTotal}kg.`);
          return;
        }
      }
    } else {
      console.warn("No diet plan exists for this cow or plan structure is invalid, skipping recommendation validation.");
    }

    // Check if already in list
    if (selectedFeedsList.some(item => item.feedType === selectedFeedType)) {
      alert(`${selectedFeedType} is already in the list. Delete it first if you want to change the weight.`);
      return;
    }

    setSelectedFeedsList([...selectedFeedsList, { feedType: selectedFeedType, weight }]);
    setSelectedFeedType('');
    setFeedWeightTaken('');
  };

  const handleRemoveFeedFromList = (feedType) => {
    setSelectedFeedsList(selectedFeedsList.filter(item => item.feedType !== feedType));
  };


  const resetForm = () => {
    setFormData({
      cattleId: cattleId || '',
      tagNumber: tagNumber || '',
      Breed: breed || '',
      Age: age || '',
      Milk_AM: '',
      Milk_PM: '',
      Total_Milk: '',
      Number_of_Steps: '',
      Distance_Moved: '',
      Standing_Time: '',
      Lying_Time: '',
      Walking_Time: '',
      Feeding_Time: '',
      Number_of_Feeding_Visits: '',
      Water_Intake: '',
      Water_pH: '',
      Rumination_Time: '',
      Body_Temperature: '',
      Heart_Rate: '',
      Respiration_Rate: '',
      Ammonia_Level: '',
      Methane_Level: '',
      Carbon_Dioxide_Level: '',
      Cleanliness: 'Average',
      Estrus_Activity_Index: '',
      Mounting_Events: '',
      Pregnancy_Status: 'False',
      Gait_Score: '',
      Limb_Movement_Symmetry: 'Normal',
      Ambient_Temperature: '',
      Humidity: '',
      THI_Index: '',
      Health_Risk_Score: '',
      Estrus_Probability: '',
      Lameness_Risk: 'Low'
    });
    setSelectedFeedsList([]);
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    
    // Parse feeds from string "Corn (5kg), Hay (2kg)"
    const feedsList = [];
    if (record.Feed_Type) {
      const parts = record.Feed_Type.split(', ');
      parts.forEach(p => {
        const match = p.match(/(.+) \((\d+)kg\)/);
        if (match) {
          feedsList.push({ feedType: match[1], weight: parseInt(match[2]) });
        }
      });
    }
    setSelectedFeedsList(feedsList);

    setFormData({
      cattleId: record.cattleId || cattleId,
      tagNumber: record.tagNumber || tagNumber,
      Breed: record.Breed || breed,
      Age: record.Age || age,
      Milk_AM: record.Milk_AM || '',
      Milk_PM: record.Milk_PM || '',
      Total_Milk: record.Total_Milk || '',
      Number_of_Steps: record.Number_of_Steps || '',
      Distance_Moved: record.Distance_Moved || '',
      Standing_Time: record.Standing_Time || '',
      Lying_Time: record.Lying_Time || '',
      Walking_Time: record.Walking_Time || '',
      Feeding_Time: record.Feeding_Time || '',
      Number_of_Feeding_Visits: record.Number_of_Feeding_Visits || '',
      Water_Intake: record.Water_Intake || '',
      Water_pH: record.Water_pH || '',
      Rumination_Time: record.Rumination_Time || '',
      Body_Temperature: record.Body_Temperature || '',
      Heart_Rate: record.Heart_Rate || '',
      Respiration_Rate: record.Respiration_Rate || '',
      Ammonia_Level: record.Ammonia_Level || '',
      Methane_Level: record.Methane_Level || '',
      Carbon_Dioxide_Level: record.Carbon_Dioxide_Level || '',
      Cleanliness: record.Cleanliness || 'Average',
      Estrus_Activity_Index: record.Estrus_Activity_Index || '',
      Mounting_Events: record.Mounting_Events || '',
      Pregnancy_Status: record.Pregnancy_Status || 'False',
      Gait_Score: record.Gait_Score || '',
      Limb_Movement_Symmetry: record.Limb_Movement_Symmetry || 'Normal',
      Ambient_Temperature: record.Ambient_Temperature || '',
      Humidity: record.Humidity || '',
      THI_Index: record.THI_Index || '',
      Health_Risk_Score: record.Health_Risk_Score || '',
      Estrus_Probability: record.Estrus_Probability || '',
      Lameness_Risk: record.Lameness_Risk || 'Low'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchRecords();
      } catch (error) {
        console.error('Error deleting record:', error);
        alert('Error deleting record');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create comma separated feed string: "Corn (5kg), Hay (2kg)"
      const feedString = selectedFeedsList.map(item => `${item.feedType} (${item.weight}kg)`).join(', ');
      
      // Calculate total weight
      const totalWeight = selectedFeedsList.reduce((sum, item) => sum + item.weight, 0);
      
      const finalFormData = {
        ...formData,
        Feed_Type: feedString,
        Total_Feed_Weight: totalWeight
      };

      // 1. Save or Update Cattle Record
      if (editingId) {
        await axios.patch(`${API_URL}/${editingId}`, finalFormData);
        alert('Cattle record updated successfully!');
      } else {
        await axios.post(API_URL, finalFormData);
        // 2. Dispense all feeds in the list (only for new records to avoid double counting)
        for (const item of selectedFeedsList) {
          try {
            await axios.put('/api/feed-stock/dispense', {
              feedType: item.feedType,
              weight: item.weight
            });
          } catch (dispenseErr) {
            console.error(`Error dispensing ${item.feedType}:`, dispenseErr);
          }
        }
        alert('Cattle record saved successfully!');
      }
      
      // Reset form and refresh
      setEditingId(null);
      resetForm();
      fetchRecords();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Error saving record. Please try again.');
    }
  };


  if (!cattleId) {
    return (
      <div className="cattle-mgmt-container">
        <div className="no-data">
          <p>No cattle selected. Please go back to Cattle Records.</p>
          <button className="back-btn" onClick={() => navigate('/cattle-management')}>
            <ArrowLeft size={20} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cattle-mgmt-container">
      <header className="cattle-header">
        <button className="back-btn" onClick={() => navigate('/cattle-management')}>
          <ArrowLeft size={20} />
        </button>
        <h1>New Daily Record</h1>
        <div className="header-actions">
           <span 
             className="cattle-tag-number" 
             style={{fontSize: '24px', cursor: 'pointer', textDecoration: 'underline'}} 
             onClick={() => navigate(`/cattle-details/${cattleId}`, { state: { cattle: location.state } })}
             title="View Cattle Details"
           >
             {tagNumber}
           </span>
        </div>
      </header>

      <main className="cattle-list-main" style={{maxWidth: '800px', margin: '0 auto 100px'}}>
        <form onSubmit={handleSubmit} className="cattle-form-detailed">
          
          {/* Section: Production */}
          <section className="form-section">
            <div className="section-title">
              <Milk size={20} />
              <h2>Production</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Milk AM (L)</label>
                <input type="number" step="0.01" name="Milk_AM" value={formData.Milk_AM} onChange={handleChange} placeholder="e.g. 8.5" />
              </div>
              <div className="form-group">
                <label>Milk PM (L)</label>
                <input type="number" step="0.01" name="Milk_PM" value={formData.Milk_PM} onChange={handleChange} placeholder="e.g. 7.2" />
              </div>
              <div className="form-group">
                <label>Total Milk (L)</label>
                <input type="number" step="0.01" name="Total_Milk" value={formData.Total_Milk} readOnly className="read-only-input" />
              </div>
            </div>
          </section>

          {/* Section: Activity */}
          <section className="form-section">
            <div className="section-title">
              <Activity size={20} />
              <h2>Activity</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Steps</label>
                <input type="number" name="Number_of_Steps" value={formData.Number_of_Steps} onChange={handleChange} placeholder="3500" />
              </div>
              <div className="form-group">
                <label>Distance (km)</label>
                <input type="number" step="0.1" name="Distance_Moved" value={formData.Distance_Moved} onChange={handleChange} placeholder="2.5" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Standing (hrs)</label>
                <input type="number" step="0.1" name="Standing_Time" value={formData.Standing_Time} onChange={handleChange} placeholder="8" />
              </div>
              <div className="form-group">
                <label>Lying (hrs)</label>
                <input type="number" step="0.1" name="Lying_Time" value={formData.Lying_Time} onChange={handleChange} placeholder="10" />
              </div>
              <div className="form-group">
                <label>Walking (hrs)</label>
                <input type="number" step="0.1" name="Walking_Time" value={formData.Walking_Time} onChange={handleChange} placeholder="2" />
              </div>
            </div>
          </section>

          {/* Section: Feeding */}
          <section className="form-section">
            <div className="section-title">
              <ShoppingBasket size={20} />
              <h2>Feeding & Digestion</h2>
            </div>
            
            <div className="feed-selection-box" style={{backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '12px', marginBottom: '20px'}}>
              <div className="form-row" style={{marginBottom: '15px'}}>
                <div className="form-group">
                  <label>Feed Type Selection</label>
                  <select 
                    value={selectedFeedType} 
                    onChange={(e) => setSelectedFeedType(e.target.value)}
                  >
                    <option value="">Select Feed Type</option>
                    {feedStocks.map((stock) => (
                      <option key={stock._id} value={stock.feedType}>
                        {stock.feedType} (Avail: {stock.weight} kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight Taken (kg)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="1" 
                    value={feedWeightTaken} 
                    onChange={(e) => setFeedWeightTaken(e.target.value)} 
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="form-group" style={{justifyContent: 'flex-end', display: 'flex', paddingBottom: '5px'}}>
                  <button type="button" onClick={handleAddFeedToList} className="add-feed-btn" style={{backgroundColor: '#2d5a3f', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'}}>
                    Add Feed
                  </button>
                </div>
              </div>

              {selectedFeedsList.length > 0 && (
                <div className="selected-feeds-list" style={{marginTop: '15px', borderTop: '1px solid #bae6fd', paddingTop: '15px'}}>
                  <h3 style={{fontSize: '14px', color: '#0369a1', marginBottom: '10px'}}>Selected Feeds List:</h3>
                  <div className="feed-items-grid" style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
                    {selectedFeedsList.map((item, index) => (
                      <div key={index} className="feed-item-tag" style={{backgroundColor: 'white', padding: '8px 12px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: '8px'}}>
                        <span style={{fontWeight: '600', color: '#0369a1'}}>{item.feedType}: {item.weight}kg</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFeedFromList(item.feedType)}
                          style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px'}}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Feeding Time (hrs)</label>
                <input type="number" step="0.1" name="Feeding_Time" value={formData.Feeding_Time} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Feeder Visits</label>
                <input type="number" name="Number_of_Feeding_Visits" value={formData.Number_of_Feeding_Visits} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Water (L)</label>
                <input type="number" step="0.1" name="Water_Intake" value={formData.Water_Intake} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Water pH</label>
                <input type="number" step="0.1" name="Water_pH" value={formData.Water_pH} onChange={handleChange} placeholder="e.g. 7.0" />
              </div>
              <div className="form-group">
                <label>Rumination (hrs)</label>
                <input type="number" step="0.1" name="Rumination_Time" value={formData.Rumination_Time} onChange={handleChange} />
              </div>
            </div>
          </section>

          {/* Section: Health */}
          <section className="form-section">
            <div className="section-title">
              <Heart size={20} />
              <h2>Health Vitals</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Temp (°C)</label>
                <input type="number" step="0.1" name="Body_Temperature" value={formData.Body_Temperature} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Heart Rate (bpm)</label>
                <input type="number" name="Heart_Rate" value={formData.Heart_Rate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Respiration (bpm)</label>
                <input type="number" name="Respiration_Rate" value={formData.Respiration_Rate} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ammonia (ppm)</label>
                <input type="number" step="0.1" name="Ammonia_Level" value={formData.Ammonia_Level} onChange={handleChange} placeholder="e.g. 5.0" />
              </div>
              <div className="form-group">
                <label>Methane (ppm)</label>
                <input type="number" step="0.1" name="Methane_Level" value={formData.Methane_Level} onChange={handleChange} placeholder="e.g. 10.0" />
              </div>
              <div className="form-group">
                <label>CO2 (ppm)</label>
                <input type="number" step="0.1" name="Carbon_Dioxide_Level" value={formData.Carbon_Dioxide_Level} onChange={handleChange} placeholder="e.g. 400" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cleanliness</label>
                <select name="Cleanliness" value={formData.Cleanliness} onChange={handleChange}>
                  <option value="Not Cleaned">Not Cleaned</option>
                  <option value="Average">Average</option>
                  <option value="Good">Good</option>
                </select>
              </div>
              <div className="form-group"></div>
              <div className="form-group"></div>
            </div>
          </section>

          {/* Section: Reproduction */}
          <section className="form-section">
            <div className="section-title">
              <ClipboardList size={20} />
              <h2>Reproduction</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Estrus Index</label>
                <input type="number" step="0.1" name="Estrus_Activity_Index" value={formData.Estrus_Activity_Index} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Mounting Events</label>
                <input type="number" name="Mounting_Events" value={formData.Mounting_Events} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Pregnancy Status</label>
                <select name="Pregnancy_Status" value={formData.Pregnancy_Status} onChange={handleChange}>
                  <option value="False">Not Pregnant</option>
                  <option value="True">Pregnant</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Locomotion */}
          <section className="form-section">
            <div className="section-title">
              <MapPin size={20} />
              <h2>Locomotion</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Gait Score (1-5)</label>
                <input type="number" min="1" max="5" name="Gait_Score" value={formData.Gait_Score} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Limb Symmetry</label>
                <select name="Limb_Movement_Symmetry" value={formData.Limb_Movement_Symmetry} onChange={handleChange}>
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section: Environment */}
          <section className="form-section">
            <div className="section-title">
              <Thermometer size={20} />
              <h2>Environment</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ambient Temp (°C)</label>
                <input type="number" step="0.1" name="Ambient_Temperature" value={formData.Ambient_Temperature} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Humidity (%)</label>
                <input type="number" step="0.1" name="Humidity" value={formData.Humidity} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>THI Index</label>
                <input type="number" step="0.1" name="THI_Index" value={formData.THI_Index} readOnly className="read-only-input" />
              </div>
            </div>
          </section>

          {/* Section: Alerts */}
          <section className="form-section">
            <div className="section-title">
              <AlertTriangle size={20} />
              <h2>AI Predictions & Alerts</h2>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Health Risk (0-100)</label>
                <input type="number" min="0" max="100" name="Health_Risk_Score" value={formData.Health_Risk_Score} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Estrus Prob. (%)</label>
                <input type="number" min="0" max="100" name="Estrus_Probability" value={formData.Estrus_Probability} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Lameness Risk</label>
                <select name="Lameness_Risk" value={formData.Lameness_Risk} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
          </section>

          <button type="submit" className="btn-submit-cattle" style={{marginTop: '40px'}}>
            <Save size={20} /> {editingId ? 'Update Daily Record' : 'Save Daily Record'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); resetForm(); }} className="btn-cancel-edit" style={{marginTop: '10px', width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600'}}>
              Cancel Edit
            </button>
          )}
        </form>

        {/* Section: Historical Records List */}
        <section className="records-list-section" style={{marginTop: '60px'}}>
          <div className="section-title">
            <Calendar size={20} />
            <h2>Historical Records</h2>
          </div>
          
          <div className="records-vertical-list">
            {records.length > 0 ? (
              records.map((record) => (
                <div key={record._id} className="record-list-item">
                  <div className="record-date-box">
                    <span className="record-date">{new Date(record.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="record-time">{new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="record-metrics-summary">
                    <div className="metric-tag">
                      <Milk size={14} />
                      <span>{record.Total_Milk || 0}L</span>
                    </div>
                    <div className="metric-tag">
                      <Activity size={14} />
                      <span>{record.Number_of_Steps || 0} Steps</span>
                    </div>
                    <div className="metric-tag">
                      <Heart size={14} />
                      <span>{record.Body_Temperature || '--'}°C</span>
                    </div>
                  </div>

                  <div className="record-actions">
                    <button className="edit-btn" onClick={() => handleEdit(record)} title="Edit Record">
                      <Pencil size={18} />
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(record._id)} title="Delete Record">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-records">No historical records found for this cattle.</div>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .form-section {
          background: white;
          padding: 24px;
          border-radius: 20px;
          margin-bottom: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          color: #2d5a3f;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
        }
        .section-title h2 {
          font-size: 18px;
          margin: 0;
          font-weight: 700;
        }
        .read-only-input {
          background-color: #f1f5f9 !important;
          color: #475569;
          font-weight: 700;
        }
        .btn-submit-cattle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
        }
        .records-vertical-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .record-list-item {
          background: white;
          padding: 16px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
        }
        .record-list-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .record-date-box {
          display: flex;
          flex-direction: column;
          min-width: 140px;
        }
        .record-date {
          font-weight: 700;
          color: #1e293b;
          font-size: 14px;
        }
        .record-time {
          font-size: 12px;
          color: #64748b;
        }
        .record-metrics-summary {
          display: flex;
          gap: 12px;
          flex: 1;
          margin: 0 20px;
        }
        .metric-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f8fafc;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }
        .record-actions {
          display: flex;
          gap: 8px;
        }
        .record-actions button {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .edit-btn {
          color: #2563eb;
        }
        .edit-btn:hover {
          background: #eff6ff;
        }
        .delete-btn {
          color: #ef4444;
        }
        .delete-btn:hover {
          background: #fef2f2;
        }
        .no-records {
          text-align: center;
          padding: 40px;
          background: #f8fafc;
          border-radius: 16px;
          color: #94a3b8;
          border: 2px dashed #e2e8f0;
        }
      `}</style>
    </div>
  );
};

export default CattleRecordForm;
