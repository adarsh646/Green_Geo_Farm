import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, Heart, CalendarDays, HelpCircle, LogOut, Bell, Home, Search, ArrowLeft, Check, X } from 'lucide-react';
import { clearManagementSession, getManagementUsername } from '../utils/sessionStorage';
import './AttendanceSheet.css';

const pad = (value) => String(value).padStart(2, '0');
const getDaysInMonth = (selectedMonth) => {
  const [year, month] = selectedMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const AttendanceSheet = () => {
  const navigate = useNavigate();
  const username = getManagementUsername() || 'Administrator';
  const [workers, setWorkers] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [workersRes, recordsRes] = await Promise.all([
          axios.get('/api/users/ranchers'),
          axios.get(`/api/attendance/monthly/${selectedMonth.split('-')[0]}/${selectedMonth.split('-')[1]}`),
        ]);
        setWorkers(workersRes.data || []);
        setMonthlyRecords(recordsRes.data || []);
      } catch (error) {
        console.error('Error loading attendance sheet', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => getDaysInMonth(selectedMonth), [selectedMonth]);

  const today = new Date();
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonthNumber === (today.getMonth() + 1);
  const currentDayLimit = isCurrentMonth ? today.getDate() : daysInMonth;

  const dayNumbers = useMemo(() => Array.from({ length: daysInMonth }, (_, index) => index + 1), [daysInMonth]);

  const recordsByDay = useMemo(() => {
    return monthlyRecords.reduce((acc, dayRecord) => {
      acc[dayRecord.date] = dayRecord.records || {};
      return acc;
    }, {});
  }, [monthlyRecords]);

  const formatDateKey = (dayNumber) => {
    const [year, month] = selectedMonth.split('-');
    return `${year}-${month}-${pad(dayNumber)}`;
  };

  const renderCell = (workerId, dayNumber, period) => {
    if (dayNumber > currentDayLimit) {
      return <span className="sheet-mark blank" aria-hidden="true">&nbsp;</span>;
    }

    const dayKey = formatDateKey(dayNumber);
    const record = recordsByDay[dayKey]?.[workerId];
    const isPresent = Boolean(record?.[period]);

    return isPresent ? (
      <span className="sheet-mark present"><Check size={14} /></span>
    ) : (
      <span className="sheet-mark absent"><X size={14} /></span>
    );
  };

  return (
    <div className="cattle-details-layout dashboard-layout attendance-sheet-layout">
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
          <div className="cd-logo-img"><Activity size={24} /></div>
          <div className="cd-logo-text">GreenGeoFarm<span>ENTERPRISE ADMIN</span></div>
        </div>

        <nav className="cd-sidebar-nav">
          <div className="nav-group-label">Core Operations</div>
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}><LayoutDashboard size={20} /><span>Command Center</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/manage-workers')}><Users size={20} /><span>Worker Matrix</span></div>
          <div className="cd-nav-item active" onClick={() => navigate('/attendance')}><CalendarDays size={20} /><span>Attendance</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/attendance/monthly')}><ArrowLeft size={20} /><span>Monthly Record</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/attendance/sheet')}><LayoutDashboard size={20} /><span>Attendance Sheet</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/health-tracking')}><Heart size={20} /><span>Health Tracking</span></div>
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}><HelpCircle size={20} /><span>Support</span></div>
          <div className="cd-nav-item" onClick={() => { clearManagementSession(); navigate('/management/login'); }}><LogOut size={20} /><span>Termination</span></div>
        </footer>
      </aside>

      <main className="cd-main-content attendance-sheet-main">
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Attendance Sheet</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Month-by-month attendance grid with morning and evening status. Logged in as {username}</p>
          </div>
          <div className="cd-toolbar">
            <div className="cd-search">
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Search employees..." />
            </div>
            <Home size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => navigate('/attendance')} />
            <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        <section className="monthly-toolbar">
          <button className="back-link-btn" onClick={() => navigate('/attendance')}>
            <ArrowLeft size={18} /> Back to Attendance
          </button>
          <div className="month-picker-wrap">
            <label>Month</label>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </div>
          <div className="month-title">Attendance Matrix</div>
        </section>

        <section className="sheet-card">
          {loading ? (
            <div className="sheet-loading">Loading attendance sheet...</div>
          ) : (
            <div className="sheet-scroll">
              <table className="sheet-table">
                <thead>
                  <tr>
                    <th rowSpan="2" className="sticky-name">Name</th>
                    {dayNumbers.map((day) => (
                      <th key={day} colSpan="2" className={day > currentDayLimit ? 'day-group future-day' : 'day-group'}>{day}</th>
                    ))}
                  </tr>
                  <tr>
                    {dayNumbers.map((day) => (
                      <React.Fragment key={`sub-${day}`}>
                        <th className={day > currentDayLimit ? 'mini-col future-day' : 'mini-col'}>M</th>
                        <th className={day > currentDayLimit ? 'mini-col future-day' : 'mini-col'}>E</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr key={worker._id}>
                      <td className="sticky-name worker-name-cell">{worker.username}</td>
                      {dayNumbers.map((day) => (
                        <React.Fragment key={`${worker._id}-${day}`}>
                          <td>{renderCell(worker._id, day, 'morning')}</td>
                          <td>{renderCell(worker._id, day, 'evening')}</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {workers.length === 0 && <div className="sheet-loading">No workers found.</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AttendanceSheet;
