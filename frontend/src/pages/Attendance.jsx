import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Activity, LayoutDashboard, Users, Heart, CalendarDays, HelpCircle, LogOut,
  Bell, Home, Search, ChevronLeft, ChevronRight, SunMedium, MoonStar, User2, ArrowRight, Grid2X2
} from 'lucide-react';
import { clearManagementSession, getManagementUsername } from '../utils/sessionStorage';
import './Attendance.css';

const formatDateKey = (date) => date.toISOString().slice(0, 10);
const parseDateKey = (dateKey) => new Date(`${dateKey}T00:00:00`);

const Attendance = () => {
  const navigate = useNavigate();
  const username = getManagementUsername() || 'Administrator';
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [attendanceByDate, setAttendanceByDate] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const response = await axios.get('/api/users/ranchers');
        setWorkers(response.data || []);
      } catch (error) {
        console.error('Error fetching workers for attendance', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const response = await axios.get(`/api/attendance/${selectedDate}`);
        const records = response.data?.records || {};
        const normalizedRecords = Object.entries(records).reduce((acc, [workerId, record]) => {
          acc[workerId] = {
            morning: Boolean(record?.morning),
            evening: Boolean(record?.evening),
          };
          return acc;
        }, {});

        setAttendanceByDate((prev) => ({
          ...prev,
          [selectedDate]: normalizedRecords,
        }));
      } catch (error) {
        console.error('Error loading attendance data', error);
      }
    };

    fetchAttendance();
  }, [selectedDate]);

  const currentDate = useMemo(() => parseDateKey(selectedDate), [selectedDate]);

  const getStatus = (workerId) => attendanceByDate[selectedDate]?.[workerId] || { morning: false, evening: false };

  const saveAttendance = async (nextAttendanceForDay) => {
    setSaving(true);
    try {
      await axios.put(`/api/attendance/${selectedDate}`, {
        records: nextAttendanceForDay,
        lastUpdatedBy: username,
      });
    } catch (error) {
      console.error('Error saving attendance data', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (workerId, period) => {
    setAttendanceByDate((prev) => {
      const dayRecord = prev[selectedDate] || {};
      const workerRecord = dayRecord[workerId] || { morning: false, evening: false };
      const nextDayRecord = {
        ...dayRecord,
        [workerId]: {
          ...workerRecord,
          [period]: !workerRecord[period],
        },
      };

      saveAttendance(nextDayRecord);

      return {
        ...prev,
        [selectedDate]: nextDayRecord,
      };
    });
  };

  const goToPreviousDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() - 1);
    setSelectedDate(formatDateKey(nextDate));
  };

  const goToNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    setSelectedDate(formatDateKey(nextDate));
  };

  const presentCount = workers.reduce((count, worker) => {
    const status = getStatus(worker._id);
    return count + (status.morning || status.evening ? 1 : 0);
  }, 0);

  return (
    <div className="cattle-details-layout dashboard-layout attendance-layout">
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
          <div className="cd-nav-item" onClick={() => navigate('/attendance/monthly')}><ArrowRight size={20} /><span>Monthly Record</span></div>
          <div className="cd-nav-item" onClick={() => navigate('/health-tracking')}><Heart size={20} /><span>Health Tracking</span></div>
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}><HelpCircle size={20} /><span>Support</span></div>
          <div className="cd-nav-item" onClick={() => { clearManagementSession(); navigate('/management/login'); }}><LogOut size={20} /><span>Termination</span></div>
        </footer>
      </aside>

      <main className="cd-main-content attendance-main">
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Attendance Register</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Daily morning and evening monitoring for all workers. Logged in as {username}</p>
          </div>
          <div className="cd-toolbar">
            <div className="cd-search">
              <Search size={16} color="#94a3b8" />
              <input type="text" placeholder="Search workers..." />
            </div>
            <Home size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')} />
            <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
          </div>
        </header>

        <section className="attendance-summary-grid">
          <div className="attendance-summary-card compact">
            <span>Selected Day</span>
            <strong>{currentDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
          </div>
          <div className="attendance-summary-card compact">
            <span>Total Workers</span>
            <strong>{workers.length}</strong>
          </div>
          <div className="attendance-summary-card compact">
            <span>Present Today</span>
            <strong>{presentCount}</strong>
          </div>
          <div className="attendance-summary-card compact clickable" onClick={() => navigate('/attendance/monthly')} role="button" tabIndex={0}>
            <span>Monthly Record</span>
            <strong>Open</strong>
          </div>
          <div className="attendance-summary-card compact clickable" onClick={() => navigate('/attendance/sheet')} role="button" tabIndex={0}>
            <span>Attendance Sheet</span>
            <strong>Open</strong>
          </div>
        </section>

        <section className="attendance-card">
          <div className="attendance-card-header">
            <div>
              <h2>Daily Attendance Sheet</h2>
              <p>Mark each worker for morning and evening attendance.</p>
            </div>
            <div className="attendance-date-controls">
              <button type="button" className="date-nav-btn" onClick={goToPreviousDay} disabled={saving}><ChevronLeft size={18} /></button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="attendance-date-input"
                disabled={saving}
              />
              <button type="button" className="date-nav-btn" onClick={goToNextDay} disabled={saving}><ChevronRight size={18} /></button>
            </div>
          </div>

          {loading ? (
            <div className="attendance-loading">Loading workers...</div>
          ) : (
            <div className="attendance-table-wrap">
              <div className="attendance-table">
                <div className="attendance-table-head">
                  <div>Worker</div>
                  <div>Morning</div>
                  <div>Evening</div>
                </div>
                {workers.map((worker) => {
                  const status = getStatus(worker._id);
                  return (
                    <div key={worker._id} className="attendance-table-row">
                      <div className="attendance-worker-cell">
                        <div className="attendance-avatar"><User2 size={18} /></div>
                        <div>
                          <strong>{worker.username}</strong>
                          <span>{worker.email}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`attendance-toggle ${status.morning ? 'is-on' : ''}`}
                        onClick={() => toggleStatus(worker._id, 'morning')}
                      >
                        <SunMedium size={16} />
                        {status.morning ? 'Present' : 'Mark'}
                      </button>
                      <button
                        type="button"
                        className={`attendance-toggle ${status.evening ? 'is-on' : ''}`}
                        onClick={() => toggleStatus(worker._id, 'evening')}
                      >
                        <MoonStar size={16} />
                        {status.evening ? 'Present' : 'Mark'}
                      </button>
                    </div>
                  );
                })}
              </div>
              {workers.length === 0 && <div className="attendance-loading">No workers found.</div>}
              {saving && <div className="attendance-saving">Saving attendance...</div>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Attendance;
