import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ArrowLeft, Download, Calendar, Activity, Zap, Droplets, Leaf, ShieldAlert,
  ClipboardList, Wind, TrendingUp, Users, HeartPulse
} from 'lucide-react';
import './DailySummary.css';

// Reusable KPI Component
const KpiCard = ({ icon, label, value, unit, color, bg }) => (
  <div style={{ background:'white', borderRadius:'20px', padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.04)', borderTop:`4px solid ${color}`, position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:'-12px', right:'-12px', width:'80px', height:'80px', borderRadius:'50%', background:bg, opacity:0.15 }} />
    <div style={{ display:'flex', alignItems:'center', marginBottom:'12px' }}>
      <div style={{ background:bg, padding:'10px', borderRadius:'12px', color, display:'flex' }}>{icon}</div>
    </div>
    <div style={{ fontSize:'28px', fontWeight:800, color:'#1e293b', lineHeight:1.1 }}>
      {value}<span style={{ fontSize:'14px', fontWeight:600, color:'#94a3b8', marginLeft:'4px' }}>{unit}</span>
    </div>
    <div style={{ fontSize:'13px', color:'#64748b', marginTop:'4px', fontWeight:500 }}>{label}</div>
  </div>
);


const DailySummary = () => {
  const navigate = useNavigate();
  const reportRef = useRef();
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/reports/daily-summary/${selectedDate}`);
        setData(res.data);
      } catch (err) {
        console.error("Error fetching daily summary", err);
        setData(null);
      }
      setLoading(false);
    };
    fetchData();
  }, [selectedDate]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true, logging: false });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
      pdf.save(`GeoFarm_Daily_Summary_${selectedDate}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
    setDownloading(false);
  };

  if (loading) {
    return <div className="daily-summary-layout" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#64748b' }}>Loading daily briefing...</div>;
  }

  // Safe extract data
  const { dailyUpdate, cngSummary, herdSummary, cattleDetails, behaviorLogs } = data || {};
  
  const totalEnergy = dailyUpdate ? (dailyUpdate.energy.solar + dailyUpdate.energy.generator + dailyUpdate.energy.kseb) : 0;
  const totalWater = dailyUpdate ? dailyUpdate.water.amount : 0;

  return (
    <div className="daily-summary-layout">
      {/* ── Header ── */}
      <header className="ds-header">
        <div className="ds-header-left">
          <button className="ds-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="ds-title">Daily Detailed Summary</h1>
            <p className="ds-subtitle">Complete briefing of farm operations</p>
          </div>
        </div>
        <div className="ds-header-controls">
          <input 
            type="date" 
            className="ds-date-picker" 
            value={selectedDate}
            max={todayStr}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button className="ds-export-btn" onClick={handleDownload} disabled={downloading}>
            <Download size={18} /> {downloading ? 'Generating PDF...' : 'Export to PDF'}
          </button>
        </div>
      </header>

      {/* ── Main Content Area to Export ── */}
      <div className="ds-content" ref={reportRef}>
        
        {/* Date Banner */}
        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius:'24px', padding:'32px', marginBottom:'32px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'white', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
          <div>
            <div style={{ fontSize:'14px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700, marginBottom:'4px' }}>Briefing For</div>
            <div style={{ fontSize:'28px', fontWeight:800 }}>{new Date(selectedDate).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric'})}</div>
          </div>
          <div style={{ display:'flex', gap:'20px', textAlign:'right' }}>
            <div>
              <div style={{ fontSize:'13px', color:'#94a3b8' }}>Total Cattle Logged</div>
              <div style={{ fontSize:'20px', fontWeight:700, color:'#38bdf8' }}>{herdSummary?.recordsCount || 0}</div>
            </div>
            <div>
              <div style={{ fontSize:'13px', color:'#94a3b8' }}>High Health Risks</div>
              <div style={{ fontSize:'20px', fontWeight:700, color:'#f87171' }}>{herdSummary?.highRiskCount || 0}</div>
            </div>
          </div>
        </div>

        {/* ── Top Level KPIs ── */}
        <div className="ds-section">
          <div className="ds-grid-4">
            <KpiCard icon={<Droplets size={24}/>} label="Total Milk Yield" value={herdSummary?.totalMilk.toFixed(1) || 0} unit="Litres" color="#3b82f6" bg="#dbeafe" />
            <KpiCard icon={<Zap size={24}/>} label="Total Energy Used" value={totalEnergy.toFixed(1)} unit="kWh" color="#f59e0b" bg="#fef3c7" />
            <KpiCard icon={<Wind size={24}/>} label="Bio-CNG Produced" value={cngSummary?.gasProduced.toFixed(1) || 0} unit="kg" color="#22c55e" bg="#dcfce7" />
            <KpiCard icon={<TrendingUp size={24}/>} label="Rural Value Saved" value={(cngSummary?.ruralCostSavings || 0).toFixed(0)} unit="₹" color="#8b5cf6" bg="#ede9fe" />
          </div>
        </div>

        {/* ── Detailed Two Column Split ── */}
        <div className="ds-grid-2 ds-section">
          
          {/* Carbon & Resources Box */}
          <div className="ds-card">
            <div className="ds-card-header">
              <Leaf size={20} color="#22c55e" />
              <h3>Sustainability & Utilities</h3>
            </div>
            
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px', background:'#f8fafc', borderRadius:'12px' }}>
                <span style={{ color:'#475569', fontWeight:600 }}>Methane Avoided (VM0041)</span>
                <span style={{ fontWeight:800, color:'#166534' }}>{cngSummary?.totalMethaneAvoided.toFixed(1) || 0} kg CO₂e</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px', background:'#f8fafc', borderRadius:'12px' }}>
                <span style={{ color:'#475569', fontWeight:600 }}>Estimated CAFE Credits</span>
                <span style={{ fontWeight:800, color:'#1e293b' }}>{cngSummary?.cafeCreditsPotential.toFixed(2) || 0}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px', background:'#f8fafc', borderRadius:'12px' }}>
                <span style={{ color:'#475569', fontWeight:600 }}>Total Water Consumed</span>
                <span style={{ fontWeight:800, color:'#0369a1' }}>{totalWater.toFixed(1)} L</span>
              </div>
            </div>
          </div>

          {/* Anomalies & Events */}
          <div className="ds-card">
            <div className="ds-card-header">
              <ShieldAlert size={20} color="#ef4444" />
              <h3>Behavior Logs & Anomalies</h3>
            </div>
            <div className="ds-timeline">
              {behaviorLogs && behaviorLogs.length > 0 ? (
                behaviorLogs.map(log => (
                  <div key={log._id} className={`timeline-item ${log.anomalyDetected ? 'alert' : 'info'}`}>
                    <div className="timeline-time">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-title">{log.activityType} - {log.cattleId?.tagNumber || 'Unknown'}</div>
                      <div className="timeline-desc">{log.notes || 'No description provided'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding:'20px', textAlign:'center', color:'#94a3b8', fontStyle:'italic' }}>
                  No significant behavioral anomalies logged on this date.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── Individual Cattle Data Table ── */}
        <div className="ds-section">
          <h2 className="ds-section-title"><ClipboardList size={22} color="#1e293b" /> Individual Cattle Overview</h2>
          <div className="ds-table-container">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Tag ID</th>
                  <th>Milk Yield (L)</th>
                  <th>Feed Intake (kg)</th>
                  <th>Temp (°C)</th>
                  <th>Methane (ppm)</th>
                  <th>Health Status</th>
                </tr>
              </thead>
              <tbody>
                {cattleDetails && cattleDetails.length > 0 ? (
                  cattleDetails.map(c => (
                    <tr key={c._id}>
                      <td><span className="tag-badge">{c.tagNumber}</span></td>
                      <td>{c.milkYield.toFixed(1)}</td>
                      <td>{c.feedIntake.toFixed(1)}</td>
                      <td>{c.temperature.toFixed(1)}</td>
                      <td>{c.methaneLevel.toFixed(1)}</td>
                      <td>
                        <span className={`risk-badge ${c.healthRiskScore > 7 ? 'high' : 'low'}`}>
                          {c.healthRiskScore > 7 ? 'High Risk' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign:'center', color:'#94a3b8', padding:'32px' }}>
                      No individual cattle records logged for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DailySummary;
