import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, Loader2, Wind,
  Activity, Settings, Leaf, Save, Droplets,
  Package, Map, ActivitySquare
} from 'lucide-react';

const InputField = ({ label, name, value, onChange, unit, type = "number", required = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        step="any"
        style={{
          width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0',
          borderRadius: '10px', fontSize: '15px', color: '#1e293b',
          fontWeight: 600, outline: 'none', background: '#f8fafc',
          boxSizing: 'border-box'
        }}
      />
      {unit && (
        <span style={{
          position: 'absolute', right: '14px', top: '50%',
          transform: 'translateY(-50%)', color: '#94a3b8',
          fontWeight: 700, fontSize: '13px'
        }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

const CarbonIntelligenceUpdate = () => {
  const navigate = useNavigate();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('daily');

  // Daily Sensor & Biogas State
  const [dailyData, setDailyData] = useState({
    ammoniaPpm: '',
    co2Ppm: '',
    slurryToBiogas: '',
    feedstockType: 'Cattle Dung',
    feedstockAmount: '',
    gasProduced: '',
    slurryProduced: ''
  });

  // VCS State
  const [vcsData, setVcsData] = useState({
    animalGroup: 'Lactating Cows',
    meanHeadCount: 124,
    daysOnFarm: 365,
    dryMatterIntake: 22.5,
    feedAmount: 4500,
    gridElecUsed: 0.12,
    transportDist: 150,
    volatileSolidsFraction: 0.85,
    EFijS: 1.5,
    EF3S: 0.005
  });

  const [savingDaily, setSavingDaily] = useState(false);
  const [savedDaily, setSavedDaily] = useState(false);
  
  const [savingVcs, setSavingVcs] = useState(false);
  const [savedVcs, setSavedVcs] = useState(false);

  // Load existing VCS data
  useEffect(() => {
    const fetchVcs = async () => {
      try {
        const res = await axios.get('/api/carbon/emission-factors');
        if (res.data) setVcsData(res.data);
      } catch (err) {
        console.error('Failed to load VCS params', err);
      }
    };
    fetchVcs();
  }, []);

  const handleDailyChange = (e) => {
    const { name, value } = e.target;
    setDailyData(prev => ({ ...prev, [name]: value }));
  };

  const handleVcsChange = (e) => {
    const { name, value } = e.target;
    setVcsData(prev => ({ ...prev, [name]: value }));
  };

  const submitDaily = async (e) => {
    e.preventDefault();
    setSavingDaily(true);
    try {
      const payload = {
        feedstockType: dailyData.feedstockType,
        feedstockAmount: Number(dailyData.feedstockAmount) || 0,
        gasProduced: Number(dailyData.gasProduced) || 0,
        slurryProduced: Number(dailyData.slurryProduced) || 0,
        slurryToBiogas: Number(dailyData.slurryToBiogas) || 0,
        ammoniaPpm: Number(dailyData.ammoniaPpm) || 0,
        co2Ppm: Number(dailyData.co2Ppm) || 0,
      };
      await axios.post('/api/carbon/bio-cng', payload);
      setSavedDaily(true);
      setTimeout(() => setSavedDaily(false), 2500);
      setDailyData({
        ammoniaPpm: '',
        co2Ppm: '',
        slurryToBiogas: '',
        feedstockType: 'Cattle Dung',
        feedstockAmount: '',
        gasProduced: '',
        slurryProduced: ''
      });
    } catch (err) {
      alert('Failed to save daily log: ' + (err.response?.data?.message || err.message));
    }
    setSavingDaily(false);
  };

  const submitVcs = async (e) => {
    e.preventDefault();
    setSavingVcs(true);
    try {
      // Ensuring numbers
      const payload = { ...vcsData };
      Object.keys(payload).forEach(k => {
        if (k !== 'animalGroup' && k !== 'region' && k !== '_id' && k !== 'createdAt' && k !== 'updatedAt' && k !== '__v') {
          payload[k] = Number(payload[k]);
        }
      });
      await axios.put('/api/carbon/emission-factors', payload);
      setSavedVcs(true);
      setTimeout(() => setSavedVcs(false), 2500);
    } catch (err) {
      alert('Failed to update VCS Parameters: ' + (err.response?.data?.message || err.message));
    }
    setSavingVcs(false);
  };



  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0fdf4 0%,#f8fafc 50%,#f0f9ff 100%)', fontFamily: "'Inter',sans-serif" }}>
      {/* ── Header ── */}
      <header style={{
        background: 'white', padding: '16px 40px', display: 'flex',
        alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        position: 'sticky', top: 0, zIndex: 100, gap: '20px'
      }}>
        <button onClick={() => navigate('/carbon-intelligence')} style={{
          background: '#f1f5f9', border: 'none', borderRadius: '12px',
          padding: '10px', cursor: 'pointer', display: 'flex', color: '#1e293b'
        }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Carbon Intelligence Configuration</h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Update daily environmental sensor logs and baseline methodology parameters.</p>
        </div>
      </header>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        
        {/* Custom Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <button 
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'daily' ? '#22c55e' : 'white',
              color: activeTab === 'daily' ? 'white' : '#64748b',
              boxShadow: activeTab === 'daily' ? '0 4px 14px rgba(34,197,94,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <ActivitySquare size={18} /> Daily Sensor & Bio-CNG Log
          </button>
          <button 
            onClick={() => setActiveTab('vcs')}
            style={{
              padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === 'vcs' ? '#3b82f6' : 'white',
              color: activeTab === 'vcs' ? 'white' : '#64748b',
              boxShadow: activeTab === 'vcs' ? '0 4px 14px rgba(59,130,246,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <Settings size={18} /> VCS Methodology (VM0041)
          </button>
        </div>

        {activeTab === 'daily' && (
          <form onSubmit={submitDaily} style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #dcfce7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '14px', display: 'flex' }}>
                <ActivitySquare size={24} color="#16a34a" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>Daily Carbon Log</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Enter real-time sensor data and biogas operations for today.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wind size={16} /> Environmental Sensors
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <InputField label="Ammonia (NH₃)" name="ammoniaPpm" value={dailyData.ammoniaPpm} onChange={handleDailyChange} unit="ppm" />
                  <InputField label="Carbon Dioxide (CO₂)" name="co2Ppm" value={dailyData.co2Ppm} onChange={handleDailyChange} unit="ppm" />
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  <Leaf size={16} /> Bio-CNG Plant Inputs
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Feedstock Type</label>
                    <select name="feedstockType" value={dailyData.feedstockType} onChange={handleDailyChange} style={{
                      width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '15px', fontWeight: 600, background: '#f8fafc', outline: 'none'
                    }}>
                      <option value="Cattle Dung">Cattle Dung</option>
                      <option value="Paddy Straw">Paddy Straw</option>
                      <option value="Bagasse">Bagasse</option>
                      <option value="MSW">MSW</option>
                      <option value="Press Mud">Press Mud</option>
                    </select>
                  </div>
                  <InputField label="Amount of Slurry to Biogas" name="slurryToBiogas" value={dailyData.slurryToBiogas} onChange={handleDailyChange} unit="Litres" />
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  <Activity size={16} /> Bio-CNG Production (Optional)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <InputField label="Feedstock Amount" name="feedstockAmount" value={dailyData.feedstockAmount} onChange={handleDailyChange} unit="Tonnes" />
                  <InputField label="Gas Produced" name="gasProduced" value={dailyData.gasProduced} onChange={handleDailyChange} unit="kg" />
                  <InputField label="Slurry Produced" name="slurryProduced" value={dailyData.slurryProduced} onChange={handleDailyChange} unit="Litres" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={savingDaily || savedDaily} style={{
              width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
              background: savedDaily ? '#16a34a' : 'linear-gradient(135deg,#22c55e,#16a34a)',
              color: 'white', fontSize: '16px', fontWeight: 800, cursor: savingDaily ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 6px 20px rgba(34,197,94,0.3)', transition: 'all 0.3s'
            }}>
              {savingDaily ? <><Loader2 size={20} className="spin"/> Saving Log...</> : 
               savedDaily ? <><CheckCircle2 size={20}/> Logged Successfully!</> : 
               <><Save size={20}/> Save Daily Carbon Log</>}
            </button>
          </form>
        )}

        {activeTab === 'vcs' && (
          <form onSubmit={submitVcs} style={{
            background: 'white', borderRadius: '24px', padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '2px solid #dbeafe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ background: '#dbeafe', padding: '12px', borderRadius: '14px', display: 'flex' }}>
                <Settings size={24} color="#2563eb" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>VCS Methodology (VM0041)</h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Configure baseline environmental parameters for Carbon Credit estimations.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              
              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Droplets size={16} /> Livestock Data (Per Group)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <InputField label="Animal Group (j)" name="animalGroup" type="text" value={vcsData.animalGroup} onChange={handleVcsChange} />
                  <InputField label="Mean Head Count (N)" name="meanHeadCount" value={vcsData.meanHeadCount} onChange={handleVcsChange} />
                  <InputField label="Days on Farm" name="daysOnFarm" value={vcsData.daysOnFarm} onChange={handleVcsChange} unit="Days" />
                  <InputField label="Dry Matter Intake (DMI)" name="dryMatterIntake" value={vcsData.dryMatterIntake} onChange={handleVcsChange} unit="kg/d" />
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  <Package size={16} /> Feed & Transport Data
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <InputField label="Feed Amount (FM)" name="feedAmount" value={vcsData.feedAmount} onChange={handleVcsChange} unit="kg" />
                  <InputField label="Grid Elec Used (Q)" name="gridElecUsed" value={vcsData.gridElecUsed} onChange={handleVcsChange} unit="MWh/kg" />
                  <InputField label="Transport Dist (D)" name="transportDist" value={vcsData.transportDist} onChange={handleVcsChange} unit="km" />
                </div>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  <Map size={16} /> Manure Management (System S)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <InputField label="Volatile Solids Fraction" name="volatileSolidsFraction" value={vcsData.volatileSolidsFraction} onChange={handleVcsChange} />
                  <InputField label="CH₄ Factor (EF)" name="EFijS" value={vcsData.EFijS} onChange={handleVcsChange} unit="g/kg" />
                  <InputField label="N₂O Factor (EF)" name="EF3S" value={vcsData.EF3S} onChange={handleVcsChange} />
                </div>
              </div>

            </div>

            <button type="submit" disabled={savingVcs || savedVcs} style={{
              width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
              background: savedVcs ? '#2563eb' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
              color: 'white', fontSize: '16px', fontWeight: 800, cursor: savingVcs ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              boxShadow: '0 6px 20px rgba(59,130,246,0.3)', transition: 'all 0.3s'
            }}>
              {savingVcs ? <><Loader2 size={20} className="spin"/> Updating Baseline...</> : 
               savedVcs ? <><CheckCircle2 size={20}/> Updated Successfully!</> : 
               <><Save size={20}/> Update VCS Parameters</>}
            </button>
          </form>
        )}

      </div>
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default CarbonIntelligenceUpdate;
