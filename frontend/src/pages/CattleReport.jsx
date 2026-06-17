import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { ArrowLeft, Download, FileText, Activity, Milk, Heart, Calendar, ShoppingBasket, Thermometer, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CattleReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [cattle, setCattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef();

  const API_URL = '/api/cattle-records/weekly-report';
  const CATTLE_API = '/api/cattle';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, cattleRes] = await Promise.all([
          axios.get(`${API_URL}/${id}`),
          axios.get(`${CATTLE_API}/${id}`)
        ]);
        
        // Format dates for charts
        const formattedRecords = reportRes.data.map(record => ({
          ...record,
          displayDate: format(parseISO(record.createdAt), 'MMM dd')
        }));
        
        setRecords(formattedRecords);
        setCattle(cattleRes.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const downloadPDF = async () => {
    try {
      setDownloading(true);
      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cattle_Report_${cattle?.tagNumber}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="loading">Generating report...</div>;
  if (!cattle) return <div className="error">Cattle not found</div>;

  return (
    <div className="report-container">
      <header className="report-header no-print">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1>Weekly Performance Report</h1>
        </div>
        <button className="download-btn" onClick={downloadPDF} disabled={downloading}>
          <Download size={20} />
          <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
          {downloading && <Loader2 size={18} className="spinner-icon" />}
        </button>
      </header>

      <div className="report-paper" ref={reportRef}>
        <div className="report-inner">
          {/* Report Header */}
          <div className="report-title-section">
            <div className="report-logo">
              <Activity size={32} color="#2d5a3f" />
              <span>CattleManage AI</span>
            </div>
            <div className="report-meta">
              <h2>Performance Analysis</h2>
              <p>Period: {records.length > 0 ? `${records[0].displayDate} - ${records[records.length-1].displayDate}` : 'No data available'}</p>
              <p>Generated on: {format(new Date(), 'PPP')}</p>
            </div>
          </div>

          {/* Cattle Info Summary */}
          <div 
            className="report-cattle-summary" 
            style={{ cursor: 'pointer', transition: 'background 0.2s' }}
            onClick={() => navigate(`/cattle-details/${cattle._id}`, { state: { cattle } })}
            title="View Full Details"
          >
            <div className="summary-item">
              <span className="label">Tag Number</span>
              <span className="value">{cattle.tagNumber}</span>
            </div>
            <div className="summary-item">
              <span className="label">Breed</span>
              <span className="value">{cattle.breed}</span>
            </div>
            <div className="summary-item">
              <span className="label">Age</span>
              <span className="value">{cattle.age} Years</span>
            </div>
            <div className="summary-item">
              <span className="label">Health Status</span>
              <span className={`value status-${cattle.healthStatus.toLowerCase()}`}>{cattle.healthStatus}</span>
            </div>
          </div>

          {records.length === 0 ? (
            <div className="no-records-msg">
              <FileText size={48} />
              <p>No daily records found for this period.</p>
            </div>
          ) : (
            <div className="report-charts-grid">
              {/* Milk Production Chart */}
              <div className="chart-card">
                <h3><Milk size={18} /> Milk Production (Liters)</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={records}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="Milk_AM" name="Morning" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="Milk_PM" name="Evening" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="Total_Milk" name="Total Daily" stroke="#2d5a3f" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Levels Chart */}
              <div className="chart-card">
                <h3><Activity size={18} /> Activity: Daily Steps</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={records}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="Number_of_Steps" name="Steps" fill="#2d5a3f" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Health Vitals Chart */}
              <div className="chart-card">
                <h3><Heart size={18} /> Body Temperature (°C)</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={records}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Line type="stepAfter" dataKey="Body_Temperature" name="Temp" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rumination & Feeding Chart */}
              <div className="chart-card">
                <h3><Calendar size={18} /> Rumination vs Feeding Time (Hrs)</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={records}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Legend />
                      <Bar dataKey="Rumination_Time" name="Rumination" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Feeding_Time" name="Feeding" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* THI Index Chart */}
              <div className="chart-card">
                <h3><Thermometer size={18} /> Heat Stress: THI Index</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={records}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Line type="monotone" dataKey="THI_Index" name="THI Index" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Feeding Details Section */}
          {records.length > 0 && (
            <div className="report-feeding-details" style={{marginTop: '40px'}}>
              <h3 style={{display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: '#1e293b', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px'}}>
                <ShoppingBasket size={18} /> Daily Feeding Breakdown
              </h3>
              <div className="feeding-table-wrapper">
                <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px'}}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc', color: '#64748b'}}>
                      <th style={{padding: '12px', borderBottom: '1px solid #f1f5f9'}}>Date</th>
                      <th style={{padding: '12px', borderBottom: '1px solid #f1f5f9'}}>Feed & Consumption Details</th>
                      <th style={{padding: '12px', borderBottom: '1px solid #f1f5f9'}}>Environmental Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #f1f5f9'}}>
                        <td style={{padding: '12px', fontWeight: '600'}}>{record.displayDate}</td>
                        <td style={{padding: '12px'}}>
                          <div style={{fontWeight: '600'}}>{record.Feed_Type || 'Not recorded'}</div>
                          <div style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                            Total Weight: {record.Total_Feed_Weight ? `${record.Total_Feed_Weight} kg` : '-'}
                          </div>
                        </td>
                        <td style={{padding: '12px'}}>
                          <div>Water pH: {record.Water_pH || '-'}</div>
                          <div style={{marginTop: '4px'}}>Ammonia: {record.Ammonia_Level ? `${record.Ammonia_Level} ppm` : '-'}</div>
                          <div style={{marginTop: '4px'}}>Methane: {record.Methane_Level ? `${record.Methane_Level} ppm` : '-'}</div>
                          <div style={{marginTop: '4px'}}>CO2: {record.Carbon_Dioxide_Level ? `${record.Carbon_Dioxide_Level} ppm` : '-'}</div>
                          <div style={{marginTop: '4px'}}>Cleanliness: <span style={{fontWeight: '600'}}>{record.Cleanliness || '-'}</span></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer for PDF */}
          <div className="report-footer">
            <p>© 2024 CattleManage AI - Smart Farming Solutions</p>
            <p>This report is generated automatically based on sensor data and daily records.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .report-container {
          padding: 40px 5%;
          background: #f1f5f9;
          min-height: 100vh;
        }
        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          max-width: 1000px;
          margin-left: auto;
          margin-right: auto;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .report-header h1 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #1e293b;
          margin: 0;
        }
        .download-btn {
          background: #2d5a3f;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(45, 90, 63, 0.2);
        }
        .download-btn:hover {
          background: #1e3d2a;
          transform: translateY(-2px);
        }
        .download-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }
        .spinner-icon {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .report-paper {
          background: white;
          max-width: 1000px;
          margin: 0 auto;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          border-radius: 4px;
        }
        .report-inner {
          padding: 60px;
        }
        .report-title-section {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #2d5a3f;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .report-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .report-logo span {
          font-size: 24px;
          font-weight: 800;
          color: #2d5a3f;
          letter-spacing: -1px;
        }
        .report-meta {
          text-align: right;
        }
        .report-meta h2 {
          margin: 0;
          color: #1e293b;
          font-size: 22px;
        }
        .report-meta p {
          margin: 4px 0;
          color: #64748b;
          font-size: 14px;
        }
        .report-cattle-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          background: #f8fafc;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 40px;
          border: 1px solid transparent;
        }
        .report-cattle-summary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        .summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .summary-item .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #94a3b8;
          font-weight: 700;
        }
        .summary-item .value {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        .status-healthy { color: #166534 !important; }
        .status-sick { color: #991b1b !important; }
        
        .report-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }
        .chart-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
        }
        .chart-card h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          color: #334155;
          margin-top: 0;
          margin-bottom: 20px;
        }
        .chart-wrapper {
          height: 250px;
        }
        .no-records-msg {
          text-align: center;
          padding: 100px 0;
          color: #94a3b8;
        }
        .report-footer {
          margin-top: 60px;
          border-top: 1px solid #f1f5f9;
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          color: #94a3b8;
          font-size: 12px;
        }
        @media print {
          .no-print { display: none; }
          .report-container { padding: 0; background: white; }
          .report-paper { box-shadow: none; max-width: 100%; }
          .report-inner { padding: 40px; }
        }
        @media (max-width: 768px) {
          .report-charts-grid { grid-template-columns: 1fr; }
          .report-cattle-summary { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CattleReport;
