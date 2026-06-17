import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import {
  ArrowLeft, Download, Zap, Droplets, Leaf, TrendingUp,
  Calendar, Building2, BarChart3, ChevronUp, ChevronDown,
  ClipboardList, Sun, Settings2, Gauge, Sprout, Bath, GlassWater
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const MONTHLY_API = '/api/daily-updates/monthly';

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>{`${(percent*100).toFixed(0)}%`}</text>;
};

const KpiCard = ({ icon, label, value, unit, change, up, color, bg }) => (
  <div style={{ background:'white', borderRadius:'20px', padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', borderTop:`4px solid ${color}`, position:'relative', overflow:'hidden' }}>
    <div style={{ position:'absolute', top:'-12px', right:'-12px', width:'80px', height:'80px', borderRadius:'50%', background:bg, opacity:0.15 }} />
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
      <div style={{ background:bg, padding:'10px', borderRadius:'12px', color, display:'flex' }}>{icon}</div>
      <span style={{ fontSize:'12px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', background: up ? '#dcfce7':'#fee2e2', color: up ? '#166534':'#991b1b', display:'flex', alignItems:'center', gap:'4px' }}>
        {up ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}{change}
      </span>
    </div>
    <div style={{ fontSize:'26px', fontWeight:800, color:'#1e293b', lineHeight:1.1 }}>
      {value}<span style={{ fontSize:'13px', fontWeight:500, color:'#94a3b8', marginLeft:'4px' }}>{unit}</span>
    </div>
    <div style={{ fontSize:'13px', color:'#64748b', marginTop:'4px' }}>{label}</div>
  </div>
);

const Card = ({ title, icon, children }) => (
  <div style={{ background:'white', borderRadius:'20px', padding:'24px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
      {icon}<h3 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'#1e293b' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null;
  const total = payload.reduce((sum, p) => sum + (Number(p.value) || 0), 0);
  return (
    <div style={{ background:'white', borderRadius:'14px', padding:'14px 18px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', minWidth:'180px' }}>
      <div style={{ fontWeight:700, color:'#1e293b', marginBottom:'10px', fontSize:'14px' }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display:'flex', justifyContent:'space-between', gap:'16px', fontSize:'13px', color:p.color, marginBottom:'4px' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight:700 }}>
            {Number(p.value).toFixed(3)} {unit}
          </span>
        </div>
      ))}
      <div style={{ marginTop:'10px', borderTop:'2px solid #f1f5f9', paddingTop:'10px', display:'flex', justifyContent:'space-between', fontSize:'13px', fontWeight:800, color:'#1e293b' }}>
        <span>Total</span><span style={{ color:'#f59e0b' }}>{total.toFixed(3)} {unit}</span>
      </div>
    </div>
  );
};

const EnterpriseReport = () => {
  const navigate = useNavigate();
  const reportRef = useRef();
  const [monthlyData, setMonthlyData] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLabel = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [monthlyRes, todayRes] = await Promise.allSettled([
          axios.get(MONTHLY_API),
          axios.get(`/api/daily-updates/${todayStr}`),
        ]);
        if (monthlyRes.status === 'fulfilled') setMonthlyData(monthlyRes.value.data);
        if (todayRes.status === 'fulfilled') setTodayData(todayRes.value.data);
      } catch {}
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Derived KPIs
  const totalEnergy = monthlyData.reduce((s, r) => s + r.totalEnergy, 0);
  const totalWater  = monthlyData.reduce((s, r) => s + r.totalWater,  0);

  // Today's Energy Pie
  const todayEnergySources = [
    { name:'Solar',     value: todayData ? Number(todayData.energy.solar.toFixed(3))     : 0, color:'#f59e0b' },
    { name:'Generator', value: todayData ? Number(todayData.energy.generator.toFixed(3)) : 0, color:'#ef4444' },
    { name:'KSEB',      value: todayData ? Number(todayData.energy.kseb.toFixed(3))      : 0, color:'#6366f1' },
  ].filter(s => s.value > 0);
  const todayTotalEnergy = todayEnergySources.reduce((s, r) => s + r.value, 0);

  // Today's Water Pie
  const todayWaterSources = [
    { name:'Irrigation',      value: todayData ? Number(todayData.water.irrigation.toFixed(3))     : 0, color:'#22c55e' },
    { name:'Cleaning',        value: todayData ? Number(todayData.water.cleaning.toFixed(3))       : 0, color:'#3b82f6' },
    { name:'Cattle Drinking', value: todayData ? Number(todayData.water.cattleDrinking.toFixed(3)) : 0, color:'#06b6d4' },
  ].filter(s => s.value > 0);
  const todayTotalWater = todayWaterSources.reduce((s, r) => s + r.value, 0);

  const carbonRadial = [
    { name:'Offset',  value:78, fill:'#22c55e' },
    { name:'Emitted', value:22, fill:'#ef4444' },
  ];

  const chartData = monthlyData.map(r => ({
    month:      r.monthLabel,
    solar:       r.totalSolar,
    generator:   r.totalGenerator,
    kseb:        r.totalKseb,
    irrigation:  r.totalIrrigation,
    cleaning:    r.totalCleaning,
    drinking:    r.totalCattleDrinking,
    totalWater:  r.totalWater,
  }));

  const handleDownload = async () => {
    setDownloading(true);
    const canvas = await html2canvas(reportRef.current, { scale:1.5, useCORS:true, logging:false });
    const pdf = new jsPDF('p','mm','a4');
    const w = pdf.internal.pageSize.getWidth();
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height*w)/canvas.width);
    pdf.save(`Enterprise_Report_${new Date().toISOString().slice(0,10)}.pdf`);
    setDownloading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f9ff 0%,#f8fafc 50%,#f0fdf4 100%)', fontFamily:"'Inter',sans-serif" }}>

      <header style={{ background:'white', padding:'16px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background:'#f1f5f9', border:'none', borderRadius:'12px', padding:'10px', cursor:'pointer', display:'flex', color:'#1e293b' }}>
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 style={{ margin:0, fontSize:'22px', fontWeight:800, color:'#1e293b' }}>Enterprise Reports</h1>
            <p style={{ margin:0, fontSize:'13px', color:'#64748b' }}>Full-spectrum farm diagnostics</p>
          </div>
        </div>
        <button onClick={handleDownload} disabled={downloading} style={{ background:'linear-gradient(135deg,#2d5a3f,#166534)', color:'white', border:'none', borderRadius:'14px', padding:'12px 24px', fontWeight:700, fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', boxShadow:'0 4px 14px rgba(45,90,63,0.3)' }}>
          <Download size={18}/>{downloading ? 'Generating...' : 'Export PDF'}
        </button>
      </header>

      <div ref={reportRef} style={{ padding:'32px 40px', maxWidth:'1280px', margin:'0 auto' }}>

        <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', borderRadius:'24px', padding:'32px', marginBottom:'28px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'white', boxShadow:'0 8px 32px rgba(0,0,0,0.15)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
            <div style={{ background:'rgba(255,255,255,0.1)', padding:'16px', borderRadius:'16px', display:'flex' }}>
              <Building2 size={32} color="#22c55e"/>
            </div>
            <div>
              <div style={{ fontSize:'22px', fontWeight:800 }}>GreenGeoFarm</div>
              <div style={{ fontSize:'13px', color:'#94a3b8', marginTop:'4px' }}>Enterprise Analytics — Live Data</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'13px', color:'#64748b' }}>Records found</div>
            <div style={{ fontSize:'24px', fontWeight:700, color:'#22c55e' }}>{monthlyData.length} months</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'80px', color:'#64748b' }}>Loading report...</div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'20px', marginBottom:'28px' }}>
              <KpiCard icon={<Zap size={22}/>}        label="Total Electricity" value={totalEnergy.toLocaleString()} unit="kWh" color="#f59e0b" bg="#fef3c7" change="YTD" up={false}/>
              <KpiCard icon={<Droplets size={22}/>}   label="Total Water"       value={totalWater.toLocaleString()}  unit="L"   color="#06b6d4" bg="#cffafe" change="YTD" up={false}/>
              <KpiCard icon={<Leaf size={22}/>}        label="Carbon Credits"    value="148"                         unit="tCO₂e" color="#22c55e" bg="#dcfce7" change="+12.5%" up={true}/>
              <KpiCard icon={<TrendingUp size={22}/>} label="This Month Revenue"  value="₹1,00,000"                   unit=""     color="#6366f1" bg="#ede9fe" change="+8.2%" up={true}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'20px' }}>
              {/* Energy Charts */}
              <Card title="Energy by Source per Month (kWh)" icon={<Gauge size={18} color="#6366f1"/>}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#94a3b8' }}/>
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#94a3b8' }}/>
                    <Tooltip content={<CustomTooltip unit="kWh" />}/>
                    <Bar dataKey="solar"     name="Solar"     stackId="a" fill="#f59e0b" radius={[0,0,0,0]}/>
                    <Bar dataKey="generator" name="Generator" stackId="a" fill="#ef4444" radius={[0,0,0,0]}/>
                    <Bar dataKey="kseb"      name="KSEB"      stackId="a" fill="#6366f1" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Today's Energy" icon={<Zap size={18} color="#f59e0b"/>}>
                <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'12px' }}>{todayLabel}</div>
                {todayEnergySources.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={todayEnergySources} cx="50%" cy="50%" outerRadius={60} labelLine={false} label={renderLabel} dataKey="value">
                          {todayEnergySources.map((e,i) => <Cell key={i} fill={e.color}/>)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${Number(v).toFixed(3)} kWh`]}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'10px' }}>
                      {todayEnergySources.map(s => (
                        <div key={s.name} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                          <span style={{ color:'#64748b' }}>{s.name}</span>
                          <span style={{ fontWeight:700, color:s.color }}>{s.value.toFixed(3)}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:'6px', display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:800 }}>
                        <span>Total</span><span style={{ color:'#f59e0b' }}>{todayTotalEnergy.toFixed(3)}</span>
                      </div>
                    </div>
                  </>
                ) : <div style={{ textAlign:'center', padding:'20px', fontSize:'12px', color:'#94a3b8' }}>No data today</div>}
              </Card>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px', marginBottom:'20px' }}>
              {/* Water Charts */}
              <Card title="Water by Category per Month (Litres)" icon={<Droplets size={18} color="#06b6d4"/>}>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#94a3b8' }}/>
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize:12, fill:'#94a3b8' }}/>
                    <Tooltip content={<CustomTooltip unit="L" />}/>
                    <Bar dataKey="irrigation" name="Irrigation" stackId="a" fill="#22c55e" radius={[0,0,0,0]}/>
                    <Bar dataKey="cleaning"   name="Cleaning"   stackId="a" fill="#3b82f6" radius={[0,0,0,0]}/>
                    <Bar dataKey="drinking"   name="Drinking"   stackId="a" fill="#06b6d4" radius={[6,6,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Today's Water" icon={<Droplets size={18} color="#06b6d4"/>}>
                <div style={{ fontSize:'12px', color:'#94a3b8', marginBottom:'12px' }}>{todayLabel}</div>
                {todayWaterSources.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={todayWaterSources} cx="50%" cy="50%" outerRadius={60} labelLine={false} label={renderLabel} dataKey="value">
                          {todayWaterSources.map((e,i) => <Cell key={i} fill={e.color}/>)}
                        </Pie>
                        <Tooltip formatter={(v) => [`${Number(v).toFixed(3)} L`]}/>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginTop:'10px' }}>
                      {todayWaterSources.map(s => (
                        <div key={s.name} style={{ display:'flex', justifyContent:'space-between', fontSize:'12px' }}>
                          <span style={{ color:'#64748b' }}>{s.name}</span>
                          <span style={{ fontWeight:700, color:s.color }}>{s.value.toFixed(3)}</span>
                        </div>
                      ))}
                      <div style={{ borderTop:'1px solid #f1f5f9', paddingTop:'6px', display:'flex', justifyContent:'space-between', fontSize:'12px', fontWeight:800 }}>
                        <span>Total</span><span style={{ color:'#06b6d4' }}>{todayTotalWater.toFixed(3)}</span>
                      </div>
                    </div>
                  </>
                ) : <div style={{ textAlign:'center', padding:'20px', fontSize:'12px', color:'#94a3b8' }}>No data today</div>}
              </Card>
            </div>

            <div style={{ background:'white', borderRadius:'20px', padding:'28px', boxShadow:'0 4px 20px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px' }}>
                <BarChart3 size={18} color="#1e293b"/>
                <h3 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'#1e293b' }}>Monthly Summary</h3>
              </div>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background:'#f8fafc' }}>
                    <th style={{ padding:'12px', textAlign:'left', borderBottom:'1px solid #e2e8f0' }}>Month</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', color: '#f59e0b' }}>Solar</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', color: '#ef4444' }}>Gen</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', color: '#6366f1' }}>KSEB</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', color: '#22c55e' }}>Irrigation</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', color: '#3b82f6' }}>Cleaning</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', color: '#06b6d4' }}>Drinking</th>
                    <th style={{ padding:'12px', textAlign:'right', borderBottom:'1px solid #e2e8f0', fontWeight: 700 }}>Total L</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row, i) => (
                    <tr key={i} style={{ background: i%2===0 ? 'white':'#fafafa' }}>
                      <td style={{ padding:'12px', fontWeight:600 }}>{row.monthLabel} {row.year}</td>
                      <td style={{ padding:'12px', textAlign:'right' }}>{row.totalSolar.toFixed(1)}</td>
                      <td style={{ padding:'12px', textAlign:'right' }}>{row.totalGenerator.toFixed(1)}</td>
                      <td style={{ padding:'12px', textAlign:'right' }}>{row.totalKseb.toFixed(3)}</td>
                      <td style={{ padding:'12px', textAlign:'right' }}>{row.totalIrrigation.toFixed(1)}</td>
                      <td style={{ padding:'12px', textAlign:'right' }}>{row.totalCleaning.toFixed(1)}</td>
                      <td style={{ padding:'12px', textAlign:'right' }}>{row.totalCattleDrinking.toFixed(1)}</td>
                      <td style={{ padding:'12px', textAlign:'right', fontWeight: 700 }}>{row.totalWater.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => navigate('/daily-updates')}
        style={{
          position:'fixed', bottom:'32px', right:'32px', zIndex:999,
          background:'linear-gradient(135deg,#1e293b,#0f172a)',
          color:'white', border:'none', borderRadius:'20px',
          padding:'16px 24px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px',
          boxShadow:'0 8px 30px rgba(0,0,0,0.25)', fontSize:'15px', fontWeight:700
        }}
      >
        <ClipboardList size={20} color="#22c55e"/>
        Daily Updates
      </button>
    </div>
  );
};

export default EnterpriseReport;
