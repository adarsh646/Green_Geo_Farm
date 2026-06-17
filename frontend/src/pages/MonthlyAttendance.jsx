import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, Heart, CalendarDays, HelpCircle, LogOut, Bell, Home, Search, ArrowLeft, PencilLine, Trash2, Mail, User as UserIcon, Lock, Plus, BriefcaseBusiness, CircleDollarSign, Clock3, X, BadgeInfo } from 'lucide-react';
import { clearManagementSession, getManagementUsername } from '../utils/sessionStorage';
import './MonthlyAttendance.css';

const pad = (value) => String(value).padStart(2, '0');
const monthLabel = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

const getMonthDayCount = (selectedMonth) => {
  const [year, month] = selectedMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const buildRecordsByDate = (monthlyRecords) => {
  return monthlyRecords.reduce((acc, dayRecord) => {
    acc[dayRecord.date] = dayRecord.records || {};
    return acc;
  }, {});
};


const emptyWorkerForm = {
  username: '',
  email: '',
  password: '',
  workerType: 'daily_wage',
  monthlySalary: '',
  wagePerDay: '',
};

const normalizeWorker = (worker) => ({
  ...worker,
  workerType: worker.workerType || 'daily_wage',
  monthlySalary: worker.monthlySalary ?? '',
  wagePerDay: worker.wagePerDay ?? '',
});

const calculateSalarySummary = (worker, recordsByDate, selectedMonth) => {
  const [year, month] = selectedMonth.split('-').map(Number);
  const daysInMonth = getMonthDayCount(selectedMonth);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1);
  const dayLimit = isCurrentMonth ? Math.min(today.getDate(), daysInMonth) : daysInMonth;

  const salaryType = worker.workerType === 'permanent' ? 'Permanent' : 'Daily Wage';
  const shift = worker.workerType === 'permanent' ? '9:00 AM - 7:00 PM' : '8:00 AM - 4:30 PM';
  const monthlySalary = Number(worker.monthlySalary || 0);
  const wagePerDay = Number(worker.wagePerDay || 0);

  const baseDayRate = worker.workerType === 'permanent'
    ? monthlySalary / Math.max(daysInMonth, 1)
    : wagePerDay;
  const sessionRate = baseDayRate / 2;

  let present = 0;
  let halfDay = 0;
  let leave = 0;
  let finalSalary = 0;

  for (let day = 1; day <= dayLimit; day += 1) {
    const dayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = recordsByDate[dayKey]?.[worker._id];
    const morning = Boolean(record?.morning);
    const evening = Boolean(record?.evening);
    const sessionsToday = Number(morning) + Number(evening);
    const isPresent = sessionsToday > 0;
    const isHalfDay = sessionsToday === 1;
    const isLeave = sessionsToday === 0;

    // Attendance sheet rule:
    // - one or two sessions means present
    // - one session means half day
    // - zero sessions means leave
    if (isPresent) {
      present += 1;
      if (isHalfDay) halfDay += 1;
      finalSalary += sessionsToday * sessionRate;
    }

    if (isLeave) {
      leave += 1;
    }
  }

  const expectedSalary = baseDayRate * dayLimit;
  const deduction = Math.max(expectedSalary - finalSalary, 0);

  return {
    salaryType,
    shift,
    present,
    leave,
    halfDay,
    late: 0,
    comp: 0,
    perDay: baseDayRate,
    deduction,
    finalSalary,
    attendanceCount: present,
  };
};
const MonthlyAttendance = () => {
  const navigate = useNavigate();
  const username = getManagementUsername() || 'Administrator';
  const [workers, setWorkers] = useState([]);
  const [monthlyRecords, setMonthlyRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  });
  const [loading, setLoading] = useState(true);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editForm, setEditForm] = useState(emptyWorkerForm);
  const [savingWorker, setSavingWorker] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workersRes, recordsRes] = await Promise.all([
        axios.get('/api/users/ranchers'),
        axios.get(`/api/attendance/monthly/${selectedMonth.split('-')[0]}/${selectedMonth.split('-')[1]}`),
      ]);
      setWorkers((workersRes.data || []).map(normalizeWorker));
      setMonthlyRecords(recordsRes.data || []);
    } catch (error) {
      console.error('Error loading monthly attendance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const recordsByDate = useMemo(() => buildRecordsByDate(monthlyRecords), [monthlyRecords]);

  const rows = useMemo(() => {
    return workers.map((worker) => {
      const summary = calculateSalarySummary(worker, recordsByDate, selectedMonth);

      return {
        id: worker._id,
        worker,
        name: worker.username,
        salaryType: summary.salaryType,
        shift: summary.shift,
        present: summary.present,
        leave: summary.leave,
        halfDay: summary.halfDay,
        late: summary.late,
        comp: summary.comp,
        perDay: summary.perDay,
        deduction: summary.deduction,
        finalSalary: summary.finalSalary,
        attendanceCount: summary.attendanceCount,
      };
    });
  }, [recordsByDate, selectedMonth, workers]);

  const openEditWorker = (worker) => {
    setEditingWorker(worker);
    setEditForm({
      username: worker.username || '',
      email: worker.email || '',
      password: '',
      workerType: worker.workerType || 'daily_wage',
      monthlySalary: worker.monthlySalary ?? '',
      wagePerDay: worker.wagePerDay ?? '',
    });
  };

  const closeEditWorker = () => {
    setEditingWorker(null);
    setEditForm(emptyWorkerForm);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingWorker) return;

    setSavingWorker(true);
    try {
      await axios.put(`/api/users/ranchers/${editingWorker._id}`, {
        username: editForm.username,
        email: editForm.email,
        password: editForm.password,
        workerType: editForm.workerType,
        monthlySalary: editForm.workerType === 'permanent' ? editForm.monthlySalary : '',
        wagePerDay: editForm.workerType === 'daily_wage' ? editForm.wagePerDay : '',
      });
      await fetchData();
      closeEditWorker();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating worker');
    } finally {
      setSavingWorker(false);
    }
  };

  const handleDeleteWorker = async (worker) => {
    if (!window.confirm(`Delete ${worker.username}? This action cannot be undone.`)) return;

    try {
      await axios.delete(`/api/users/ranchers/${worker._id}`);
      if (editingWorker?._id === worker._id) {
        closeEditWorker();
      }
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting worker');
    }
  };

  return (
    <div className="cattle-details-layout dashboard-layout monthly-attendance-layout">
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
          <div className="cd-nav-item" onClick={() => navigate('/health-tracking')}><Heart size={20} /><span>Health Tracking</span></div>
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}><HelpCircle size={20} /><span>Support</span></div>
          <div className="cd-nav-item" onClick={() => { clearManagementSession(); navigate('/management/login'); }}><LogOut size={20} /><span>Termination</span></div>
        </footer>
      </aside>

      <main className="cd-main-content monthly-attendance-main">
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Monthly Record</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Monthly employee attendance summary. Logged in as {username}</p>
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
          <div className="month-title">{monthLabel(new Date(`${selectedMonth}-01`))}</div>
        </section>

        <section className="monthly-table-card">
          {loading ? (
            <div className="monthly-loading">Loading monthly record...</div>
          ) : (
            <div className="monthly-table-shell">
              <table className="monthly-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>Salary Type</th>
                    <th>Shift</th>
                    <th>Present</th>
                    <th>Leave</th>
                    <th>Half Day</th>
                    <th>Late</th>
                    <th>Comp</th>
                    <th>Per Day</th>
                    <th>Deduction</th>
                    <th>Final Salary</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td className="name-cell">{row.name}</td>
                      <td>{row.salaryType}</td>
                      <td>{row.shift}</td>
                      <td>{row.present}</td>
                      <td>{row.leave}</td>
                      <td>{row.halfDay}</td>
                      <td>{row.late}</td>
                      <td>{row.comp}</td>
                      <td>{row.perDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>{row.deduction.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="salary-cell">{row.finalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>
                        <div className="monthly-actions">
                          <button type="button" className="table-action-btn" onClick={() => openEditWorker(row.worker)}><PencilLine size={14} /> Edit</button>
                          <button type="button" className="table-action-btn danger" onClick={() => handleDeleteWorker(row.worker)}><Trash2 size={14} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <div className="monthly-loading">No employee records available.</div>}
            </div>
          )}
        </section>

        {editingWorker && (
          <div className="monthly-modal-backdrop" onClick={closeEditWorker}>
            <div className="monthly-modal" onClick={(event) => event.stopPropagation()}>
              <div className="monthly-modal-header">
                <div>
                  <span className="monthly-modal-kicker"><BadgeInfo size={14} /> Edit Worker</span>
                  <h3>{editingWorker.username}</h3>
                </div>
                <button type="button" className="monthly-modal-close" onClick={closeEditWorker}><X size={18} /></button>
              </div>

              <form className="monthly-edit-form" onSubmit={handleEditSubmit}>
                <div className="monthly-form-grid">
                  <label className="monthly-form-field">
                    <span><UserIcon size={14} /> Username</span>
                    <input type="text" name="username" value={editForm.username} onChange={handleEditChange} required />
                  </label>

                  <label className="monthly-form-field">
                    <span><Mail size={14} /> Email</span>
                    <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
                  </label>

                  <label className="monthly-form-field">
                    <span><Lock size={14} /> Password</span>
                    <input type="text" name="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep current password" />
                  </label>

                  <label className="monthly-form-field">
                    <span><BriefcaseBusiness size={14} /> Worker Type</span>
                    <select name="workerType" value={editForm.workerType} onChange={handleEditChange}>
                      <option value="daily_wage">Daily Wage</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </label>

                  {editForm.workerType === 'permanent' ? (
                    <label className="monthly-form-field">
                      <span><CircleDollarSign size={14} /> Monthly Salary</span>
                      <input type="number" name="monthlySalary" value={editForm.monthlySalary} onChange={handleEditChange} required />
                    </label>
                  ) : (
                    <label className="monthly-form-field">
                      <span><Clock3 size={14} /> Wage Per Day</span>
                      <input type="number" name="wagePerDay" value={editForm.wagePerDay} onChange={handleEditChange} required />
                    </label>
                  )}
                </div>

                <div className="monthly-modal-actions">
                  <button type="button" className="monthly-secondary-btn" onClick={closeEditWorker}>Cancel</button>
                  <button type="submit" className="monthly-primary-btn" disabled={savingWorker}>
                    <Plus size={14} /> {savingWorker ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {editingWorker && (
          <div className="monthly-modal-backdrop" onClick={closeEditWorker}>
            <div className="monthly-modal" onClick={(event) => event.stopPropagation()}>
              <div className="monthly-modal-header">
                <div>
                  <span className="monthly-modal-kicker"><BadgeInfo size={14} /> Edit Worker</span>
                  <h3>{editingWorker.username}</h3>
                </div>
                <button type="button" className="monthly-modal-close" onClick={closeEditWorker}><X size={18} /></button>
              </div>

              <form className="monthly-edit-form" onSubmit={handleEditSubmit}>
                <div className="monthly-form-grid">
                  <label className="monthly-form-field">
                    <span><UserIcon size={14} /> Username</span>
                    <input type="text" name="username" value={editForm.username} onChange={handleEditChange} required />
                  </label>

                  <label className="monthly-form-field">
                    <span><Mail size={14} /> Email</span>
                    <input type="email" name="email" value={editForm.email} onChange={handleEditChange} required />
                  </label>

                  <label className="monthly-form-field">
                    <span><Lock size={14} /> Password</span>
                    <input type="text" name="password" value={editForm.password} onChange={handleEditChange} placeholder="Leave blank to keep current password" />
                  </label>

                  <label className="monthly-form-field">
                    <span><BriefcaseBusiness size={14} /> Worker Type</span>
                    <select name="workerType" value={editForm.workerType} onChange={handleEditChange}>
                      <option value="daily_wage">Daily Wage</option>
                      <option value="permanent">Permanent</option>
                    </select>
                  </label>

                  {editForm.workerType === 'permanent' ? (
                    <label className="monthly-form-field">
                      <span><CircleDollarSign size={14} /> Monthly Salary</span>
                      <input type="number" name="monthlySalary" value={editForm.monthlySalary} onChange={handleEditChange} required />
                    </label>
                  ) : (
                    <label className="monthly-form-field">
                      <span><Clock3 size={14} /> Wage Per Day</span>
                      <input type="number" name="wagePerDay" value={editForm.wagePerDay} onChange={handleEditChange} required />
                    </label>
                  )}
                </div>

                <div className="monthly-modal-actions">
                  <button type="button" className="monthly-secondary-btn" onClick={closeEditWorker}>Cancel</button>
                  <button type="submit" className="monthly-primary-btn" disabled={savingWorker}>
                    <Plus size={14} /> {savingWorker ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default MonthlyAttendance;
