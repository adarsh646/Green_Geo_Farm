import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, Droplets, Sun, Settings2, Gauge,
  CheckCircle2, CalendarDays, ChevronDown, Loader2, History,
  Sprout, Bath, GlassWater
} from 'lucide-react';

const API = '/api/daily-updates';

const SOURCES = [
  { key: 'solar',     label: 'Solar',     icon: <Sun size={18} />,      color: '#f59e0b', bg: '#fef3c7' },
  { key: 'generator', label: 'Generator', icon: <Settings2 size={18} />, color: '#ef4444', bg: '#fee2e2' },
  { key: 'kseb',      label: 'KSEB',      icon: <Gauge size={18} />,    color: '#6366f1', bg: '#ede9fe' },
];

const WATER_CATEGORIES = [
  { key: 'irrigation',     label: 'Irrigation',     icon: <Sprout size={18} />,    color: '#22c55e', bg: '#dcfce7' },
  { key: 'cleaning',       label: 'Cleaning',       icon: <Bath size={18} />,      color: '#3b82f6', bg: '#dbeafe' },
  { key: 'cattleDrinking', label: 'Cattle Drinking',icon: <GlassWater size={18} />,color: '#06b6d4', bg: '#cffafe' },
];

const today = () => new Date().toISOString().slice(0, 10);

// ── small reusable source input ──────────────────────────────
const DataInput = ({ item, value, onChange, unit }) => (
  <div style={{
    background: 'white', border: `2px solid ${value > 0 ? item.color : '#e2e8f0'}`,
    borderRadius: '16px', padding: '16px 20px', transition: 'border-color 0.2s',
    display: 'flex', alignItems: 'center', gap: '14px'
  }}>
    <div style={{ background: item.bg, color: item.color, padding: '10px', borderRadius: '12px', display: 'flex', flexShrink: 0 }}>
      {item.icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>{item.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '120px', padding: '8px 12px', border: '1px solid #e2e8f0',
            borderRadius: '10px', fontSize: '16px', fontWeight: 700,
            color: '#1e293b', outline: 'none', background: '#f8fafc'
          }}
        />
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  </div>
);

// ── History row ──────────────────────────────────────────────
const HistoryRow = ({ record }) => {
  const d = new Date(record.date);
  const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const totalEnergy = record.energy.solar + record.energy.generator + record.energy.kseb;
  const totalWater = (record.water.irrigation || 0) + (record.water.cleaning || 0) + (record.water.cattleDrinking || 0);
  
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr 1.2fr',
      gap: '8px', padding: '14px 20px', alignItems: 'center',
      background: 'white', borderRadius: '12px', fontSize: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
    }}>
      <span style={{ fontWeight: 600, color: '#1e293b' }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: '#f59e0b' }}>Sol: {record.energy.solar}</span>
        <span style={{ color: '#ef4444' }}>Gen: {record.energy.generator}</span>
        <span style={{ color: '#6366f1' }}>KSB: {record.energy.kseb}</span>
      </div>
      <span style={{ color: '#1e293b', fontWeight: 700 }}>{totalEnergy.toFixed(2)} kWh</span>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ color: '#22c55e' }}>Irr: {record.water.irrigation || 0}</span>
        <span style={{ color: '#3b82f6' }}>Cln: {record.water.cleaning || 0}</span>
        <span style={{ color: '#06b6d4' }}>Dnk: {record.water.cattleDrinking || 0}</span>
      </div>
      <span style={{ color: '#06b6d4', fontWeight: 700 }}>{totalWater.toFixed(1)} L</span>
      <span style={{ color: '#94a3b8', fontSize: '10px' }}>{record.notes ? '📝' : ''}</span>
    </div>
  );
};

// ── ProgressBar Component ───────────────────────────────────
const ProgressBar = ({ data, total, unit }) => {
  if (total === 0) return (
    <div style={{ marginTop: '20px', height: '12px', borderRadius: '99px', background: 'rgba(0,0,0,0.05)' }} />
  );
  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', height: '14px', borderRadius: '99px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', gap: '2px', border: '1px solid rgba(0,0,0,0.05)' }}>
        {data.map(item => (
          item.value > 0 && (
            <div 
              key={item.label}
              style={{ 
                width: `${(item.value / total) * 100}%`, 
                background: item.color,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2)'
              }} 
            />
          )
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
        {data.map(item => (
          item.value > 0 && (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'inherit', opacity: 0.8 }}>
                {item.label}: {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────
const DailyUpdates = () => {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(today());
  const [solar,     setSolar]     = useState(0);
  const [generator, setGenerator] = useState(0);
  const [kseb,      setKseb]      = useState(0);
  
  const [irrigation,     setIrrigation]     = useState(0);
  const [cleaning,       setCleaning]       = useState(0);
  const [cattleDrinking, setCattleDrinking] = useState(0);
  
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [history,   setHistory]   = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load existing record when date changes
  useEffect(() => {
    const fetchDay = async () => {
      try {
        const res = await axios.get(`${API}/${selectedDate}`);
        const r = res.data;
        setSolar(r.energy.solar);
        setGenerator(r.energy.generator);
        setKseb(r.energy.kseb);
        
        setIrrigation(r.water.irrigation || 0);
        setCleaning(r.water.cleaning || 0);
        setCattleDrinking(r.water.cattleDrinking || 0);
        
        setNotes(r.notes || '');
      } catch {
        // no record yet — reset
        setSolar(0); setGenerator(0); setKseb(0); 
        setIrrigation(0); setCleaning(0); setCattleDrinking(0);
        setNotes('');
      }
    };
    fetchDay();
  }, [selectedDate]);

  // Load history
  const fetchHistory = async () => {
    try {
      const res = await axios.get(API);
      setHistory(res.data.reverse()); // latest first
    } catch { /* silent */ }
    setLoadingHistory(false);
  };
  useEffect(() => { fetchHistory(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(API, {
        date: selectedDate,
        energy: { solar, generator, kseb },
        water: { irrigation, cleaning, cattleDrinking },
        notes,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      fetchHistory();
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.message || err.message));
    }
    setSaving(false);
  };

  const totalEnergy = solar + generator + kseb;
  const totalWater = irrigation + cleaning + cattleDrinking;

  const energyBarData = [
    { label: 'Solar', value: solar, color: '#f59e0b' },
    { label: 'Generator', value: generator, color: '#ef4444' },
    { label: 'KSEB', value: kseb, color: '#6366f1' },
  ];

  const waterBarData = [
    { label: 'Irrigation', value: irrigation, color: '#22c55e' },
    { label: 'Cleaning', value: cleaning, color: '#3b82f6' },
    { label: 'Drinking', value: cattleDrinking, color: '#06b6d4' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#f0fdf4 100%)', fontFamily: "'Inter',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: 'white', padding: '16px 40px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/enterprise-reports')} style={{
            background: '#f1f5f9', border: 'none', borderRadius: '12px',
            padding: '10px', cursor: 'pointer', display: 'flex', color: '#1e293b'
          }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>Daily Updates</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Log daily energy & water consumption details</p>
          </div>
        </div>
        {/* Date Selector */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <CalendarDays size={18} color="#64748b" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            max={today()}
            style={{
              paddingLeft: '42px', paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px',
              border: '2px solid #e2e8f0', borderRadius: '14px', fontSize: '14px', fontWeight: 600,
              color: '#1e293b', background: 'white', cursor: 'pointer', outline: 'none'
            }}
          />
        </div>
      </header>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Energy Section ── */}
        <div style={{
          background: 'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius: '24px',
          padding: '28px', marginBottom: '20px', color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(245,158,11,0.2)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <Zap size={22} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Energy Consumption</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Units consumed from each source (kWh)</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#f59e0b' }}>{totalEnergy.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total kWh</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <DataInput item={SOURCES[0]} value={solar} onChange={setSolar} unit="kWh" />
            <DataInput item={SOURCES[1]} value={generator} onChange={setGenerator} unit="kWh" />
            <DataInput item={SOURCES[2]} value={kseb} onChange={setKseb} unit="kWh" />
          </div>

          <ProgressBar data={energyBarData} total={totalEnergy} unit="kWh" />
        </div>

        {/* ── Water Section ── */}
        <div style={{
          background: 'white', borderRadius: '24px', padding: '28px',
          marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          border: '2px solid #e0f2fe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#cffafe', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <Droplets size={22} color="#06b6d4" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Water Consumption</h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Usage across different farm categories (Litres)</p>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#06b6d4' }}>{totalWater.toFixed(1)}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Total Litres</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <DataInput item={WATER_CATEGORIES[0]} value={irrigation} onChange={setIrrigation} unit="L" />
            <DataInput item={WATER_CATEGORIES[1]} value={cleaning} onChange={setCleaning} unit="L" />
            <DataInput item={WATER_CATEGORIES[2]} value={cattleDrinking} onChange={setCattleDrinking} unit="L" />
          </div>

          <div style={{ color: '#64748b' }}>
            <ProgressBar data={waterBarData} total={totalWater} unit="L" />
          </div>
        </div>

        {/* ── Notes ── */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <label style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '10px' }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any remarks for the day..."
            rows={3}
            style={{
              width: '100%', padding: '14px', border: '2px solid #e2e8f0',
              borderRadius: '14px', fontSize: '14px', color: '#1e293b',
              resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* ── Save Button ── */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '18px', borderRadius: '18px', border: 'none',
            background: saved
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : 'linear-gradient(135deg,#2d5a3f,#166534)',
            color: 'white', fontSize: '16px', fontWeight: 800, cursor: saving ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 6px 20px rgba(45,90,63,0.3)', transition: 'all 0.3s', marginBottom: '36px'
          }}
        >
          {saving
            ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
            : saved
              ? <><CheckCircle2 size={20} /> Saved Successfully!</>
              : <><CheckCircle2 size={20} /> Save Daily Update</>
          }
        </button>

        {/* ── History Table ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <History size={18} color="#64748b" />
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>Recent Records</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingHistory
              ? <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>Loading records...</div>
              : history.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '14px' }}>
                    No records yet. Save your first daily update above!
                  </div>
                : history.map(r => <HistoryRow key={r._id} record={r} />)
            }
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default DailyUpdates;
