import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, Trash2, Pencil, LayoutDashboard, Users, Heart, 
  GitBranch, Settings, BarChart3, HelpCircle, LogOut, Search, 
  Bell, Home, Activity, ShieldCheck, Wifi, Database, History, TrendingUp, Zap, User,
  Plus, Package, BookOpen
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import '@google/model-viewer';
import '../CattleManagement.css';
import './CattleDetails.css';
import { 
  getManagementToken, 
  getManagementRole, 
  clearManagementSession 
} from '../utils/sessionStorage';
import { buildApiUrl } from '../api/http';
import ReferenceMatchCowAnimation from '../components/CowAnimation_Essential/ReferenceMatchCowAnimation.jsx';
import LiveCattleMonitorZoom from '../components/LiveCattleMonitorZoom.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import CowBehaviorImage from '../assets/cow-behavior-img.png';

const CircularGauge = ({ value, max, color, unit, label }) => {
  const safeValue = isNaN(parseFloat(value)) ? 0 : Math.min(Math.max(parseFloat(value), 0), max);
  const data = [
    { value: safeValue },
    { value: max - safeValue }
  ];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
      <div style={{ width: '80px', height: '60px', position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius={22}
              outerRadius={32}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
            >
              <Cell fill={color} />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ 
          position: 'absolute', 
          bottom: '5px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          textAlign: 'center' 
        }}>
          <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{safeValue || '0'}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{unit}</span>
      </div>
    </div>
  );
};

const CattleDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [cattle, setCattle] = useState(location.state?.cattle || null);
  const [loading, setLoading] = useState(!location.state?.cattle);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [modelFileUrl, setModelFileUrl] = useState('');
  const [showDeleteModelOption, setShowDeleteModelOption] = useState(false);
  const [modelBusy, setModelBusy] = useState(false);
  const isAdmin = getManagementRole() === 'admin';

  const API_URL = buildApiUrl('/api/cattle');
  const BASE_URL = buildApiUrl('');
  
  const [behaviorLogs, setBehaviorLogs] = useState([]);
  const [latestRecord, setLatestRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ tagNumber: '', breed: '', age: '', gender: '', weight: '', healthStatus: '' });
  const [editBusy, setEditBusy] = useState(false);
  const [isStreamExpanded, setIsStreamExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [footageVideos, setFootageVideos] = useState([]);
  const [activeFootage, setActiveFootage] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [generatingDiet, setGeneratingDiet] = useState(false);
  const [roughageStrategy, setRoughageStrategy] = useState('50_50_MIX');
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const fetchCattle = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/${id}`);
        setCattle(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching cattle details:', err);
        setError('Unable to load cattle details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!cattle || cattle._id !== id) {
      fetchCattle();
    }
  }, [id]);

  useEffect(() => {
    // Fetch Historical behavior logs once cattle loads
    if (cattle?.tagNumber) {
      axios.get(`/api/behavior-logs/${cattle.tagNumber}`)
        .then(res => setBehaviorLogs(res.data))
        .catch(err => console.error('Failed fetching historical behavior logs', err));
    }
    
    // Fetch latest daily record
    if (cattle?._id) {
      axios.get(`/api/cattle-records/cattle/${cattle._id}?t=${Date.now()}`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            // Explicitly sort by createdAt descending to ensure newest is first
            const sorted = [...res.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setHistoricalRecords(sorted);
            setLatestRecord(sorted[0]);
          } else {
            setLatestRecord(null);
            setHistoricalRecords([]);
          }
        })
        .catch(err => console.error('Failed fetching latest cattle record', err));
    }

    const fetchNutritionPlan = async () => {
      try {
        const response = await axios.get(`${API_URL}/${id}/nutrition-plans`);
        const plans = response.data;
        if (plans && plans.length > 0) {
          const latestPlan = plans[0]; // Upsert ensures there's only one per cattle
          setDietPlan({
            inputs: latestPlan.inputs,
            diet_plan: latestPlan.dietPlan || latestPlan.diet_plan,
            createdAt: latestPlan.createdAt
          });
          setRoughageStrategy(latestPlan.roughageStrategy || '50_50_MIX');
        } else {
          setDietPlan(null);
          setRoughageStrategy('50_50_MIX');
        }
      } catch (err) {
        console.error('Failed fetching nutrition plan', err);
      }
    };

    if (cattle && cattle._id) {
      fetchNutritionPlan();
    }
  }, [cattle, id, API_URL]);

  // Fetch video list from the videos folder
  useEffect(() => {
    fetch(buildApiUrl('/api/videos'))
      .then(r => r.json())
      .then(list => {
        setFootageVideos(list);
        if (list.length > 0) setActiveFootage(list[0]);
      })
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!cattle?._id) {
      return;
    }

    if (!isAdmin) {
      alert('Only admin can delete cattle images and 3D models.');
      return;
    }

    const token = getManagementToken();
    if (!token) {
      alert('Session expired. Please sign in again.');
      navigate('/management/login');
      return;
    }

    try {
      setDeleting(true);
      await axios.delete(`${API_URL}/${cattle._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      navigate('/cattle-management');
    } catch (err) {
      console.error('Error deleting cattle:', err);
      alert('Error deleting cattle. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const statusClass = cattle?.healthStatus
    ? cattle.healthStatus.toLowerCase().replace(/\s+/g, '-')
    : '';
  const healthToneClass = statusClass.includes('healthy')
    ? 'tone-healthy'
    : statusClass.includes('warning')
      ? 'tone-warning'
      : statusClass.includes('sick')
        ? 'tone-sick'
        : 'tone-default';
  const cattleNode = cattle?._id ? cattle._id.slice(-4).toUpperCase() : '----';

  const detailItems = cattle
    ? [
        { label: 'Breed', value: cattle.breed || 'Not recorded' },
        { label: 'Age', value: cattle.age ? `${cattle.age} Years` : 'Not recorded' },
        { label: 'Gender', value: cattle.gender || 'Not recorded' },
        { label: 'Weight', value: cattle.weight ? `${cattle.weight} Kg` : 'Not recorded' },
      ]
    : [];

  const handleModelFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    if (!isAdmin) {
      alert('Only admin can add 3D models.');
      e.target.value = '';
      return;
    }

    const isSupported = /\.(glb|gltf)$/i.test(file.name);
    if (!isSupported) {
      alert('Please upload a .glb or .gltf model file.');
      e.target.value = '';
      return;
    }

    const token = getManagementToken();
    if (!token) {
      alert('Session expired. Please sign in again.');
      navigate('/management/login');
      e.target.value = '';
      return;
    }

    const uploadModel = async () => {
      try {
        setModelBusy(true);
        const formData = new FormData();
        formData.append('model3d', file);

        const response = await axios.patch(`${API_URL}/${id}/model`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        setCattle(response.data);
        setShowDeleteModelOption(false);
      } catch (err) {
        console.error('Error uploading 3D model:', err);
        alert(err.response?.data?.message || 'Failed to upload 3D model.');
      } finally {
        setModelBusy(false);
        e.target.value = '';
      }
    };

    uploadModel();
  };

  const handleDeleteModel = async () => {
    if (!isAdmin) {
      alert('Only admin can delete 3D models.');
      return;
    }

    const token = getManagementToken();
    if (!token) {
      alert('Session expired. Please sign in again.');
      navigate('/management/login');
      return;
    }

    try {
      setModelBusy(true);
      const response = await axios.delete(`${API_URL}/${id}/model`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCattle(response.data);
      setShowDeleteModelOption(false);
    } catch (err) {
      console.error('Error deleting 3D model:', err);
      alert(err.response?.data?.message || 'Failed to delete 3D model.');
    } finally {
      setModelBusy(false);
    }
  };

  useEffect(() => {
    if (cattle?.model3dUrl) {
      setModelFileUrl(`${BASE_URL}${cattle.model3dUrl}`);
    } else {
      setModelFileUrl('');
    }
    setShowDeleteModelOption(false);
  }, [cattle]);

  const openEditModal = () => {
    if (!cattle) return;
    setEditForm({
      tagNumber: cattle.tagNumber || '',
      breed: cattle.breed || '',
      age: cattle.age || '',
      gender: cattle.gender || '',
      weight: cattle.weight || '',
      healthStatus: cattle.healthStatus || 'Healthy'
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    const token = getManagementToken();
    if (!token) {
      alert('Session expired. Please sign in again.');
      navigate('/management/login');
      return;
    }
    try {
      setEditBusy(true);
      const response = await axios.patch(`${API_URL}/${cattle._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCattle(response.data);
      setShowEditModal(false);
    } catch (err) {
      console.error('Error updating cattle:', err);
      alert(err.response?.data?.message || 'Failed to update cattle details.');
    } finally {
      setEditBusy(false);
    }
  };

  const mapBreedToType = (breed) => {
    if (!breed) return 'CROSSBRED';
    const b = String(breed).toLowerCase();
    if (b.includes('indigenous') || b.includes('desi')) return 'INDIGENOUS';
    if (b.includes('cross')) return 'CROSSBRED';
    if (b.includes('hf') || b.includes('holstein') || b.includes('holst')) return 'EXOTIC_HF';
    if (b.includes('jersey')) return 'EXOTIC_JERSEY';
    return 'CROSSBRED';
  };

  const generateDietPlan = async ({ roughageStrategy: strategyOverride } = {}) => {
    setGeneratingDiet(true);
    try {
      const breed_type = mapBreedToType(cattle?.breed);
      const weight_input = cattle?.weight ? parseFloat(cattle.weight) : null;
      const milk_yield_input = latestRecord && latestRecord.Total_Milk ? parseFloat(latestRecord.Total_Milk) : 0;
      const fat_input_raw = latestRecord?.Milk_Fat || latestRecord?.Fat || latestRecord?.Milk_Fat_Content || null;
      const fat_input = fat_input_raw ? parseFloat(fat_input_raw) : null;
      const roughage = strategyOverride || roughageStrategy || '50_50_MIX';

      // STEP 1: defaults
      let cow_weight;
      if (!weight_input || weight_input <= 0) {
        if (breed_type === 'INDIGENOUS') cow_weight = 375;
        else if (breed_type === 'CROSSBRED') cow_weight = 425;
        else if (breed_type === 'EXOTIC_HF') cow_weight = 550;
        else if (breed_type === 'EXOTIC_JERSEY') cow_weight = 400;
        else cow_weight = 425;
      } else {
        cow_weight = weight_input;
      }

      let milk_fat;
      if (!fat_input || fat_input <= 0) {
        if (breed_type === 'INDIGENOUS') milk_fat = 4.8;
        else if (breed_type === 'CROSSBRED') milk_fat = 4.2;
        else if (breed_type === 'EXOTIC_HF') milk_fat = 3.5;
        else if (breed_type === 'EXOTIC_JERSEY') milk_fat = 5.0;
        else milk_fat = 4.2;
      } else {
        milk_fat = fat_input;
      }

      // STEP 2: total DMI
      const total_dmi_target = (0.02 * cow_weight) + (0.3 * milk_yield_input);

      // STEP 3: concentrates
      const concentrate_maintenance = 1.5;
      let concentrate_production;
      if (milk_fat >= 4.5) {
        concentrate_production = milk_yield_input / 2.0;
      } else {
        concentrate_production = milk_yield_input / 2.5;
      }
      let physical_concentrate_needed = concentrate_maintenance + concentrate_production;
      let concentrate_dmi_allocated = physical_concentrate_needed * 0.90;
      if (concentrate_dmi_allocated > (total_dmi_target * 0.50)) {
        concentrate_dmi_allocated = total_dmi_target * 0.50;
        physical_concentrate_needed = concentrate_dmi_allocated / 0.90;
      }

      // STEP 4: roughage split
      const remaining_roughage_dmi = Math.max(total_dmi_target - concentrate_dmi_allocated, 0);
      const green_roughage_dmi_target = remaining_roughage_dmi * 0.70;
      const dry_roughage_dmi_target = remaining_roughage_dmi * 0.30;

      // STEP 5: convert to as-fed
      const DM_STRAW_HAY = 0.90;
      const DM_FRESH_GREEN = 0.20;
      const DM_SILAGE = 0.33;

      const physical_dry_fodder = dry_roughage_dmi_target / DM_STRAW_HAY;
      let physical_fresh_green = 0.0;
      let physical_silage = 0.0;

      if (roughage === 'FRESH_GREEN_ONLY') {
        physical_fresh_green = green_roughage_dmi_target / DM_FRESH_GREEN;
      } else if (roughage === 'SILAGE_ONLY') {
        physical_silage = green_roughage_dmi_target / DM_SILAGE;
      } else {
        const half_green_dmi = green_roughage_dmi_target * 0.50;
        physical_fresh_green = half_green_dmi / DM_FRESH_GREEN;
        physical_silage = half_green_dmi / DM_SILAGE;
      }

      // STEP 6: supplements & water
      const mineral_mixture_grams = milk_yield_input < 15 ? 50 : 100;
      const salt_grams = 30;
      const water_liters = 40 + (3.5 * milk_yield_input);

      const result = {
        calculated_cow_weight_kg: Math.round(cow_weight * 10) / 10,
        total_dry_matter_target_kg: Math.round(total_dmi_target * 100) / 100,
        diet_plan: {
          concentrate_feed_kg: Math.round(physical_concentrate_needed * 100) / 100,
          dry_fodder_straw_kg: Math.round(physical_dry_fodder * 100) / 100,
          fresh_green_grass_kg: Math.round(physical_fresh_green * 100) / 100,
          silage_kg: Math.round(physical_silage * 100) / 100,
          mineral_mixture_grams,
          common_salt_grams: salt_grams,
          minimum_clean_water_liters: Math.round(water_liters * 10) / 10,
        },
        inputs: {
          breed_type,
          weight_input: weight_input || null,
          milk_yield_input,
          milk_fat,
          roughage_strategy: roughage,
        }
      };

      // Attempt to persist to backend if token available
      const token = getManagementToken();
      if (token) {
        try {
          const payload = {
            inputs: result.inputs,
            dietPlan: result.diet_plan
          };
          const resp = await axios.post(`${API_URL}/${cattle._id}/nutrition-plan`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const added = resp.data?.addedPlan || resp.data?.added_plan || resp.data;
          setDietPlan({ inputs: added.inputs || result.inputs, diet_plan: added.dietPlan || added.diet_plan || result.diet_plan, createdAt: added.createdAt || new Date() });
          setIsRegenerating(false);
          return resp.data;
        } catch (err) {
          setDietPlan(result);
          setIsRegenerating(false);
          console.error('Failed saving nutrition plan:', err?.response?.data || err.message || err);
          alert('Warning: could not persist plan to server. Saved locally in this view.');
          return result;
        }
      }

      setDietPlan(result);
      return result;
    } finally {
      setGeneratingDiet(false);
    }
  };

  const handleHomeSessionEnd = () => {
    clearManagementSession();
    navigate('/management', { replace: true });
  };

  const radarData = latestRecord ? [
    { subject: 'Milk', value: Math.min(100, (parseFloat(latestRecord.Total_Milk) || 0) / 40 * 100), raw: latestRecord.Total_Milk || 0, unit: 'L' },
    { subject: 'Steps', value: Math.min(100, (parseInt(latestRecord.Number_of_Steps) || 0) / 10000 * 100), raw: latestRecord.Number_of_Steps || 0, unit: '' },
    { subject: 'Temp', value: Math.min(100, (parseFloat(latestRecord.Body_Temperature) || 38) / 42 * 100), raw: latestRecord.Body_Temperature || '--', unit: '°C' },
    { subject: 'Heart Rate', value: Math.min(100, (parseFloat(latestRecord.Heart_Rate) || 70) / 120 * 100), raw: latestRecord.Heart_Rate || '--', unit: 'bpm' },
    { subject: 'Feeding', value: Math.min(100, (parseFloat(latestRecord.Feeding_Time) || 0) / 12 * 100), raw: latestRecord.Feeding_Time || 0, unit: 'hrs' },
    { subject: 'Water', value: Math.min(100, (parseFloat(latestRecord.Water_Intake) || 0) / 100 * 100), raw: latestRecord.Water_Intake || 0, unit: 'L' },
  ] : [];

  const reproductionPieData = [
    { name: 'Probability', value: latestRecord?.Estrus_Probability || 0 },
    { name: 'Remaining', value: 100 - (latestRecord?.Estrus_Probability || 0) }
  ];
  const pieColors = ['#e11d48', '#f1f5f9'];

  const renderMetricsContent = () => (
    <>
      <div className="cd-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0px', marginBottom: '12px' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>PERFORMANCE METRICS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={14} color="#64748b" />
          <h3 style={{ fontSize: '12px' }}>Daily Metric Overview</h3>
        </div>
      </div>
      
      {latestRecord ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Progress Bars */}
          <div>
            <div className="cd-metric-item" style={{ marginBottom: '12px' }}>
              <div className="cd-metric-label">
                <span>Milk Production (Target 40L)</span>
                <span>{latestRecord.Total_Milk || 0}L</span>
              </div>
              <div className="cd-progress-bar">
                <div className="cd-progress-fill" style={{ width: `${Math.min(100, (parseFloat(latestRecord.Total_Milk) || 0) / 40 * 100)}%`, background: '#2563eb' }}></div>
              </div>
            </div>
            <div className="cd-metric-item" style={{ marginBottom: '12px' }}>
              <div className="cd-metric-label">
                <span>Activity Goal (10k Steps)</span>
                <span>{latestRecord.Number_of_Steps || 0}</span>
              </div>
              <div className="cd-progress-bar">
                <div className="cd-progress-fill" style={{ width: `${Math.min(100, (parseInt(latestRecord.Number_of_Steps) || 0) / 10000 * 100)}%`, background: '#16a34a' }}></div>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Vitals" dataKey="value" stroke="#2d5a3f" fill="#2d5a3f" fillOpacity={0.6} />
                <Tooltip formatter={(value, name, props) => [`${props.payload.raw} ${props.payload.unit}`, props.payload.subject]} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Feeding & Digestion AreaChart */}
          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Feeding & Digestion Trend</h4>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalRecords}>
                  <defs>
                    <linearGradient id="colorFeeding" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRumination" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="createdAt" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}/>
                  <Legend wrapperStyle={{fontSize: '11px'}} />
                  <Area type="monotone" dataKey="Feeding_Time" name="Feeding (hrs)" stroke="#f59e0b" fillOpacity={1} fill="url(#colorFeeding)" />
                  <Area type="monotone" dataKey="Rumination_Time" name="Rumination (hrs)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRumination)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Locomotion BarChart */}
          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Locomotion History</h4>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historicalRecords}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="createdAt" tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} labelFormatter={(label) => new Date(label).toLocaleDateString()} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}/>
                  <Bar dataKey="Number_of_Steps" name="Steps" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reproduction PieChart */}
          <div style={{ marginTop: '10px' }}>
            <h4 style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase' }}>Reproduction Status</h4>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={reproductionPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} startAngle={180} endAngle={0} dataKey="value" stroke="none">
                      {reproductionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: '-60px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                  {latestRecord?.Estrus_Probability || 0}%
                </div>
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Estrus Prob.</div>
              </div>
              <div style={{ flex: 1, paddingLeft: '20px' }}>
                <div className="cd-bio-item" style={{ marginBottom: '12px' }}>
                  <span>Estrus Activity Index</span>
                  <p style={{ fontSize: '16px' }}>{latestRecord?.Estrus_Activity_Index || '0'}</p>
                </div>
                <div className="cd-bio-item">
                  <span>Mounting Events</span>
                  <p style={{ fontSize: '16px' }}>{latestRecord?.Mounting_Events || '0'}</p>
                </div>
              </div>

                
            </div>
          </div>
          
        </div>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          No daily records found for this unit.
        </div>
      )}
    </>
  );  if (loading) return <div className="loading">Initializing Unit Diagnostic...</div>;
  if (error) return <div className="error-container">{error}</div>;
  if (!cattle) return <div className="loading">Establishing Neural Link...</div>;

  return (
    <div className="cattle-details-layout">
      {/* ── Sidebar ── */}
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
          <div className="cd-logo-img">
            <User size={24} />
          </div>
          <div className="cd-logo-text">
            GreenGeoFarm
            <span>ENTERPRISE UNIT 01</span>
          </div>
        </div>

        <nav className="cd-sidebar-nav">
          <div className={`cd-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </div>
          <div className={`cd-nav-item ${location.pathname.startsWith('/cattle-management') || location.pathname.startsWith('/cattle-details') ? 'active' : ''}`} onClick={() => navigate('/cattle-management')}>
            <Users size={20} />
            <span>Herd Management</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate(`/cattle-report/${cattle?._id}`)}>
            <BarChart3 size={20} />
            <span>Weekly Report</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/cattle-records', { state: { cattleId: cattle?._id, tagNumber: cattle?.tagNumber, breed: cattle?.breed, age: cattle?.age } })}>
            <Plus size={20} />
            <span>Log Daily Metrics</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate(`/cattle-details/${cattle?._id}/event-logging`)}>
            <BookOpen size={20} />
            <span>Event Logging</span>
          </div>

          {isAdmin && (
            <>
              <div className="nav-group-label" style={{ marginTop: '24px' }}>Administrative Control</div>
              <div className={`cd-nav-item active`}>
                 <Database size={20} />
                 <span>Biometric Details</span>
              </div>
              <div className="cd-nav-item" onClick={openEditModal}>
                <Pencil size={20} />
                <span>Update Profile</span>
              </div>
              <div className="cd-nav-item" onClick={() => setShowDeleteConfirm(true)} style={{ color: '#ef4444' }}>
                <Trash2 size={20} />
                <span>Delete Profile</span>
              </div>
            </>
          )}
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}>
            <HelpCircle size={20} />
            <span>Support</span>
          </div>
          <div className="cd-nav-item" onClick={() => {
            clearManagementSession();
            navigate('/management/login');
          }}>
            <LogOut size={20} />
            <span>Log Out</span>
          </div>
        </footer>
      </aside>

      {/* ── Main Content ── */}
      <main className="cd-main-content">
        {/* ── Navbar ── */}
        <header className="cd-navbar">
          <div className="cd-navbar-left">
            <h2 className="cd-nav-title">Cattle details</h2>
          </div>
          <div className="cd-nav-tabs">
            <div className="cd-tab active">Herd Detail</div>
          </div>
          <div className="cd-toolbar">
            <Home
              size={20}
              color="#64748b"
              style={{ cursor: 'pointer' }}
              onClick={handleHomeSessionEnd}
            />
            <Bell size={20} color="#64748b" style={{ cursor: 'pointer' }} />
            <Settings size={20} color="#64748b" />
          </div>
        </header>

        {loading ? (
          <div className="loading">Initializing Neural Link...</div>
        ) : error ? (
          <div className="cd-card" style={{ textAlign: 'center', padding: '100px' }}>
            <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
            <button className="cd-btn-secondary" onClick={() => navigate('/cattle-management')} style={{ marginTop: '20px' }}>
              Return to Management
            </button>
          </div>
        ) : cattle ? (
          <div className="cd-dashboard-body">
            {/* ── Top Row ── */}
            <div className="cd-top-widgets" style={{ marginBottom: '24px' }}>
              {/* Cattle Hero */}
              <div 
                className={`cd-card cd-hero-card ${isImageExpanded ? 'is-expanding' : ''}`}
                onClick={() => setIsImageExpanded(true)}
                style={{ cursor: 'zoom-in' }}
              >
                {cattle.imageUrl ? (
                  <img src={`${BASE_URL}${cattle.imageUrl}`} alt="Cattle" className="cd-hero-img" />
                ) : (
                  <div className="cattle-image-placeholder">{cattle.tagNumber?.charAt(0) || 'C'}</div>
                )}
                <div className="cd-hero-overlay">
                  <h1 className="cd-hero-title">{cattle.tagNumber}</h1>
                </div>
                <div className="cd-image-overlay-hint">Click to enlarge</div>
              </div>

              {/* Column 2: Vitality + Ammonia */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="cd-card cd-widget-card-small" style={{ flex: 1 }}>
                  <div className="cd-widget-header">
                    <span>Vitality Index</span>
                    <Activity size={18} color="#2d5a3f" />
                  </div>
                  <div className="cd-widget-value">98.4%</div>
                  <div className="cd-widget-status">
                    <div className="cd-status-dot"></div>
                    Optimal Performance
                  </div>
                </div>
                <div className="cd-card cd-widget-card-small" style={{ flex: 1, padding: '16px 20px' }}>
                  <CircularGauge 
                    value={latestRecord?.Ammonia_Level} 
                    max={50} 
                    color="#eab308" 
                    unit="ppm" 
                    label="Ammonia" 
                  />
                </div>
              </div>

              {/* Column 3: Health + Methane */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="cd-card cd-widget-card-small" style={{ flex: 1 }}>
                  <div className="cd-widget-header">
                    <span>Health Status</span>
                    <ShieldCheck size={18} color="#22c55e" />
                  </div>
                  <div className="cd-widget-value" style={{ color: cattle.healthStatus === 'Sick' ? '#ef4444' : '#1e293b' }}>
                    {(cattle.healthStatus || 'SECURE').toUpperCase()}
                  </div>
                  <div className="cd-widget-status">
                    Last Check: Just now
                  </div>
                </div>
                <div className="cd-card cd-widget-card-small" style={{ flex: 1, padding: '16px 20px' }}>
                  <CircularGauge 
                    value={latestRecord?.Methane_Level} 
                    max={500} 
                    color="#3b82f6" 
                    unit="ppm" 
                    label="Methane" 
                  />
                </div>
              </div>

              {/* Column 4: Sync + CO2 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="cd-card cd-widget-card-small" style={{ flex: 1 }}>
                  <div className="cd-widget-header">
                    <span>Sync Status</span>
                    <Wifi size={18} color="#0ea5e9" />
                  </div>
                  <div className="cd-widget-value">LIVE</div>
                  <div className="cd-widget-status">
                    Latency: 42ms
                  </div>
                </div>
                <div className="cd-card cd-widget-card-small" style={{ flex: 1, padding: '16px 20px' }}>
                  <CircularGauge 
                    value={latestRecord?.Carbon_Dioxide_Level} 
                    max={2000} 
                    color="#8b5cf6" 
                    unit="ppm" 
                    label="CO2" 
                  />
                </div>
              </div>
            </div>

            {/* ── Monitor Row ── */}
            <div className="cd-monitor-row" style={{ marginBottom: '24px' }}>
                {/* Camera Footage Card */}
                <div 
                  className={`cd-card cd-ptz-card`}
                  style={{ cursor: 'default', overflow: 'hidden' }}
                >
                  <div className="cd-ptz-header">
                    <span className="cd-ptz-label">CAMERA FOOTAGE</span>
                    <span className="cd-ptz-badge" style={{ background: '#dcfce7', color: '#166534' }}>● LIVE</span>
                  </div>

                  {/* Video selector dropdown */}
                  {footageVideos.length > 1 && (
                    <div style={{
                      position: 'absolute', top: 8, right: 60, zIndex: 5,
                    }}>
                      <select
                        value={activeFootage?.filename || ''}
                        onChange={e => {
                          const v = footageVideos.find(f => f.filename === e.target.value);
                          if (v) setActiveFootage(v);
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{
                          background: 'rgba(15,23,42,0.75)', color: '#e2e8f0',
                          border: 'none', borderRadius: '6px', padding: '4px 8px',
                          fontSize: '10px', fontWeight: 700, backdropFilter: 'blur(4px)',
                          cursor: 'pointer',
                        }}
                      >
                        {footageVideos.map(v => (
                          <option key={v.filename} value={v.filename}>
                            {v.name.replace(/\.[^.]+$/, '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="cd-ptz-stream" style={{ background: '#000' }}>
                    {activeFootage ? (
                      <video
                        key={activeFootage.url}
                        src={buildApiUrl(activeFootage.url)}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: '#475569', fontSize: '12px', gap: '8px',
                      }}>
                        <span>No footage available</span>
                      </div>
                    )}
                  </div>

                  {activeFootage && (
                    <span style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(15,23,42,0.75)', color: '#e2e8f0',
                      fontSize: '9px', fontWeight: 700, padding: '3px 8px',
                      borderRadius: '6px', letterSpacing: '0.5px', backdropFilter: 'blur(4px)',
                    }}>📷 {activeFootage.name.replace(/\.[^.]+$/, '')}</span>
                  )}
                </div>

                {/* Metric Overview */}
                <div 
                  className={`cd-card cd-metrics-card ${isMetricsExpanded ? 'is-expanding' : ''}`} 
                  style={{ padding: '15px', height: '400px', overflowY: 'auto', cursor: 'zoom-in' }}
                  onClick={() => setIsMetricsExpanded(true)}
                >
                  {renderMetricsContent()}
                  <div className="cd-image-overlay-hint" style={{ opacity: 1, position: 'sticky', bottom: 0, left: '100%', width: 'fit-content', marginTop: '10px' }}>Click to expand</div>
                </div>
            </div>

            {/* ── Middle Grid ── */}
            <div className="cd-grid-container" style={{ marginBottom: '24px' }}>
              {/* Biological Profile */}
              <div className="cd-left-column">
                <div className="cd-card">
                  <div className="cd-section-header">
                    <Database size={16} color="#64748b" />
                    <h3>Biological Profile</h3>
                  </div>
                  <div className="cd-bio-grid">
                    <div className="cd-bio-item">
                      <span>Breed</span>
                      <p>{cattle.breed || 'N/A'}</p>
                    </div>
                    <div className="cd-bio-item">
                      <span>Gender</span>
                      <p>{cattle.gender || 'N/A'}</p>
                    </div>
                    <div className="cd-bio-item">
                      <span>Age</span>
                      <p>{cattle.age ? `${cattle.age} Months` : 'N/A'}</p>
                    </div>
                    <div className="cd-bio-item">
                      <span>Weight</span>
                      <p>{cattle.weight ? `${cattle.weight} KG` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Today's Log (Last Recorded) */}
                {latestRecord && (
                  <div className="cd-card">
                    <div className="cd-section-header">
                      <Activity size={16} color="#64748b" />
                      <h3>Recent Log: Core Metrics</h3>
                    </div>
                    
                    <h4 style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>General & Health</h4>
                    <div className="cd-bio-grid">
                      <div className="cd-bio-item">
                        <span style={{ color: '#2563eb' }}>Production (Total Milk)</span>
                        <p>{latestRecord.Total_Milk || '0'} L</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#16a34a' }}>Activity (Steps)</span>
                        <p>{latestRecord.Number_of_Steps || '0'}</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#dc2626' }}>Health (Body Temp)</span>
                        <p>{latestRecord.Body_Temperature || '--'} °C</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#dc2626' }}>Health (Heart Rate)</span>
                        <p>{latestRecord.Heart_Rate || '--'} bpm</p>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '12px', color: '#64748b', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>Feed & Consumption</h4>
                    <div className="cd-bio-grid">
                      <div className="cd-bio-item">
                        <span style={{ color: '#f59e0b' }}>Feed Type</span>
                        <p>{latestRecord.Feed_Type || 'N/A'}</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#f59e0b' }}>Total Feed</span>
                        <p>{latestRecord.Total_Feed_Weight || '0'} Kg</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#0ea5e9' }}>Water Intake</span>
                        <p>{latestRecord.Water_Intake || '0'} L</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#0ea5e9' }}>Water pH</span>
                        <p>{latestRecord.Water_pH || '--'}</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#8b5cf6' }}>Feeding Time</span>
                        <p>{latestRecord.Feeding_Time || '0'} hrs</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#8b5cf6' }}>Rumination Time</span>
                        <p>{latestRecord.Rumination_Time || '0'} hrs</p>
                      </div>
                    </div>

                    <h4 style={{ fontSize: '12px', color: '#64748b', marginTop: '16px', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>Environmental Details</h4>
                    <div className="cd-bio-grid">
                      <div className="cd-bio-item">
                        <span style={{ color: '#64748b' }}>Ambient Temp</span>
                        <p>{latestRecord.Ambient_Temperature || '--'} °C</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#64748b' }}>Humidity</span>
                        <p>{latestRecord.Humidity || '--'} %</p>
                      </div>
                      <div className="cd-bio-item">
                        <span style={{ color: '#64748b' }}>THI Index</span>
                        <p>{latestRecord.THI_Index || '--'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nutrition Plan Tile */}
                <div className="cd-card">
                  <div className="cd-section-header">
                    <Activity size={16} color="#64748b" />
                    <h3>Nutrition Plan</h3>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ fontSize: '12px', color: '#64748b' }}></p>

                    {(!dietPlan || isRegenerating) ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>Select Roughage Strategy</label>
                          <select value={roughageStrategy} onChange={e => setRoughageStrategy(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', minWidth: '200px' }}>
                            <option value="FRESH_GREEN_ONLY">Fresh Green Only</option>
                            <option value="SILAGE_ONLY">Silage Only</option>
                            <option value="50_50_MIX">50/50 Mix</option>
                          </select>
                        </div>
                        <button className="cd-btn-primary" onClick={() => generateDietPlan()} style={{ marginLeft: 'auto', alignSelf: 'flex-end' }} disabled={generatingDiet}>
                          {generatingDiet ? 'Generating...' : (dietPlan ? 'Update Plan' : 'Generate')}
                        </button>
                        {dietPlan && (
                          <button className="cd-btn-secondary" onClick={() => setIsRegenerating(false)} style={{ alignSelf: 'flex-end', padding: '10px 20px', borderRadius: '24px' }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                        <div style={{ background: '#f0fdf4', padding: '8px 16px', borderRadius: '24px', border: '1px solid #bbf7d0', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Active Strategy:</span>
                          <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 700 }}>
                            {roughageStrategy === 'FRESH_GREEN_ONLY' ? 'Fresh Green Only' : roughageStrategy === 'SILAGE_ONLY' ? 'Silage Only' : '50/50 Mix'}
                          </span>
                        </div>
                        <button className="cd-btn-secondary" onClick={() => setIsRegenerating(true)} style={{ padding: '8px 16px', borderRadius: '24px', fontSize: '13px' }}>
                          Regenerate Plan
                        </button>
                      </div>
                    )}

                    {dietPlan ? (
                      <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                          <strong>Inputs</strong>
                          <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                            <div>Breed Type: {dietPlan.inputs.breed_type}</div>
                            <div>Weight (kg): {dietPlan.inputs.weight_input ?? 'Default'}</div>
                            <div>Milk Yield (L): {dietPlan.inputs.milk_yield_input}</div>
                            
                            <div>Roughage Strategy: {dietPlan.inputs.roughage_strategy}</div>
                          </div>
                        </div>
                        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                          <strong>Diet Plan</strong>
                          <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>
                            <div>Concentrate: {dietPlan.diet_plan.concentrate_feed_kg} Kg</div>
                            <div>Dry Fodder (Straw/Hay): {dietPlan.diet_plan.dry_fodder_straw_kg} Kg</div>
                            <div>Fresh Green Grass: {dietPlan.diet_plan.fresh_green_grass_kg} Kg</div>
                            <div>Silage: {dietPlan.diet_plan.silage_kg} Kg</div>
                            <div>Mineral Mix: {dietPlan.diet_plan.mineral_mixture_grams} g</div>
                            <div>Common Salt: {dietPlan.diet_plan.common_salt_grams} g</div>
                            <div>Water (min): {dietPlan.diet_plan.minimum_clean_water_liters} L</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '12px', color: '#94a3b8', fontSize: '13px' }}>No plan generated yet. Click Generate to create a plan.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="cd-right-column">
                {/* Biometric Schematic */}
                <div className="cd-card cd-schematic-card">
                <div className="cd-schematic-header">
                  <div className="cd-section-header" style={{ marginBottom: 0 }}>
                    <h3>Technical Biometric Schematic</h3>
                  </div>

                </div>
                <span style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '20px', display: 'block' }}>Sensor Mesh Overlay v4.2</span>
                
                <div className="cd-schematic-view">
                   {modelFileUrl ? (
                      <model-viewer
                        style={{ width: '100%', height: '100%', minHeight: '200px' }}
                        src={modelFileUrl}
                        alt="3D Schematic"
                        camera-controls
                        auto-rotate
                        shadow-intensity="1"
                        exposure="1"
                        interaction-prompt="none"
                      ></model-viewer>
                   ) : (
                     <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#94a3b8', fontSize: '13px' }}>Neural Schematic Offline</p>
                        {isAdmin && (
                           <label className="cd-btn-secondary" style={{ cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '12px' }}>
                              Upload GLB Model
                              <input type="file" style={{ display: 'none' }} onChange={handleModelFileChange} />
                           </label>
                        )}
                     </div>
                   )}
                 </div>
               </div>
               
               {/* Recent History */}
               <div className="cd-card" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                 <div className="cd-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0px', marginBottom: '16px' }}>
                   <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>EVENT LOGGING</span>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                     <History size={14} color="#64748b" />
                     <h3 style={{ fontSize: '12px' }}>Recent History</h3>
                   </div>
                 </div>
                 <div className="cd-history-list" style={{ flex: 1, overflowY: 'auto' }}>
                   <div className="cd-history-item">
                     <div className="cd-history-dot" style={{ background: '#22c55e' }}></div>
                     <div className="cd-history-content">
                       <p>Routine Vaccination Administered</p>
                       <span>Oct 12, 2023 • Admin: J. Carter</span>
                     </div>
                   </div>
                   <div className="cd-history-item">
                     <div className="cd-history-dot" style={{ background: '#3b82f6' }}></div>
                     <div className="cd-history-content">
                       <p>Weight Target Achievement</p>
                       <span>Sep 28, 2023 • +12kg Growth</span>
                     </div>
                   </div>
                   {behaviorLogs.length > 0 && (
                     <div className="cd-history-item">
                       <div className="cd-history-dot" style={{ background: '#a855f7' }}></div>
                       <div className="cd-history-content">
                         <p>Behaviour Pattern Captured</p>
                         <span>{behaviorLogs[0].date} • {behaviorLogs[0].total_ruminating} min rumination</span>
                       </div>
                     </div>
                   )}
                    {cattle?.events && cattle.events.slice().reverse().map((event, index) => (
                      <div className="cd-history-item" key={event._id || index}>
                        <div className="cd-history-dot" style={{ background: event.eventType === 'Vaccination' ? '#22c55e' : event.eventType === 'Treatment' ? '#ef4444' : '#f59e0b' }}></div>
                        <div className="cd-history-content">
                          <p>{event.eventType}: {event.medicineGiven || event.notes || 'Event Logged'}</p>
                          <span>{new Date(event.eventDate).toLocaleDateString()} {event.doctorName ? '• Dr. ' + event.doctorName : ''}</span>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
             </div>
           </div>

            {/* ── Bottom Grid ── */}
            <div className="cd-bottom-grid" style={{ gridTemplateColumns: '1fr 400px', gap: '24px' }}>
                <div></div>
                {/* Analytics Card (re-using behavior chart) */}
                <div className="cd-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px' }}>
                  <div className="cd-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.5px' }}>SENSORY ANALYTICS</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} color="#64748b" />
                      <h3 style={{ fontSize: '10px' }}>Behavioral Dynamics</h3>
                    </div>
                  </div>
                  <div style={{ width: '100%', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={CowBehaviorImage} alt="Cow Behavioral Dynamics" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                  <div style={{ width: '100%', height: 70 }}>
                    <ResponsiveContainer>
                      <LineChart data={behaviorLogs}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="total_ruminating" stroke="#2d5a3f" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="total_eating" stroke="#cbd5e1" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
            </div>

            {/* Fixed Action Buttons */}
               <div className="cd-action-buttons">
                 <button className="cd-action-btn cd-btn-secondary" onClick={() => navigate('/cattle-management')}>
                   <ArrowLeft size={16} /> Back to Registry
                 </button>
               </div>
             </div>
         ) : (
          <div className="cd-card" style={{ textAlign: 'center', padding: '100px' }}>
            <p>Cattle metrics not found.</p>
          </div>
        )}
      </main>

      {/* ── Modals (Using existing styles but ensuring they work) ── */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Trash2 size={40} color="#ef4444" style={{ marginBottom: '16px' }} />
            <h2 style={{ marginBottom: '8px' }}>Delete Herd Entry?</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Are you sure you want to remove <strong>{cattle?.tagNumber}</strong> from the system? This action is permanent.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="cd-btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="cd-btn-danger" style={{ flex: 1 }} onClick={handleDelete}>{deleting ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '24px' }}>Update Biometrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
               <div className="form-group">
                 <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Tag ID</label>
                 <input className="cd-search" style={{ width: '100%', marginTop: '4px', padding: '12px' }} type="text" value={editForm.tagNumber} onChange={(e) => setEditForm({...editForm, tagNumber: e.target.value})} />
               </div>
               <div className="form-group">
                 <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Breed</label>
                 <input className="cd-search" style={{ width: '100%', marginTop: '4px', padding: '12px' }} type="text" value={editForm.breed} onChange={(e) => setEditForm({...editForm, breed: e.target.value})} />
               </div>
               <div className="form-group">
                 <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Weight (KG)</label>
                 <input className="cd-search" style={{ width: '100%', marginTop: '4px', padding: '12px' }} type="number" value={editForm.weight} onChange={(e) => setEditForm({...editForm, weight: e.target.value})} />
               </div>
               <div className="form-group">
                 <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Health Status</label>
                 <select className="cd-search" style={{ width: '100%', marginTop: '4px', padding: '12px' }} value={editForm.healthStatus} onChange={(e) => setEditForm({...editForm, healthStatus: e.target.value})}>
                   <option value="Healthy">Healthy</option>
                   <option value="Sick">Sick</option>
                   <option value="Warning">Warning</option>
                 </select>
               </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="cd-btn-secondary" style={{ flex: 1, padding: '10px 20px', borderRadius: '24px', fontSize: '15px' }} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="cd-btn-primary" style={{ flex: 1, padding: '10px 20px', borderRadius: '24px', fontSize: '15px' }} onClick={handleEditSave}>{editBusy ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Feed Popup */}
      <div 
        className={`stream-popup-overlay ${isStreamExpanded ? 'active' : ''}`}
        onClick={(e) => {
          if(e.target.classList.contains('stream-popup-overlay')) {
            setIsStreamExpanded(false);
          }
        }}
      >
        <div className="stream-popup-content">
          <div className="stream-popup-header">
            <h3>Live Unit Monitor: {cattle?.tagNumber}</h3>
            <button onClick={() => setIsStreamExpanded(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Close</button>
          </div>
          <div className="stream-popup-body">
            <LiveCattleMonitorZoom cowId={cattle?.tagNumber} />
          </div>
        </div>
      </div>

      {/* Profile Image Popup */}
      <div 
        className={`image-popup-overlay ${isImageExpanded ? 'active' : ''}`}
        onClick={() => setIsImageExpanded(false)}
      >
        <div className="image-popup-content">
          {cattle.imageUrl ? (
            <img src={`${BASE_URL}${cattle.imageUrl}`} alt="Cattle Large" className="cd-hero-img" />
          ) : (
            <div className="cattle-image-placeholder big">{cattle.tagNumber?.charAt(0) || 'C'}</div>
          )}
          <div className="image-popup-footer">
            <span>{cattle.tagNumber} — {cattle.breed}</span>
          </div>
        </div>
      </div>

      {/* Metrics Popup */}
      <div 
        className={`stream-popup-overlay ${isMetricsExpanded ? 'active' : ''}`}
        onClick={(e) => {
          if(e.target.classList.contains('stream-popup-overlay')) {
            setIsMetricsExpanded(false);
          }
        }}
        style={{ cursor: 'zoom-out' }}
      >
        <div className="stream-popup-content" style={{ padding: '32px', background: '#ffffff', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', cursor: 'auto' }}>
          <div className="stream-popup-header" style={{ background: 'transparent', padding: '0 0 20px 0', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <h3 style={{ color: '#1e293b' }}>Detailed Performance Metrics</h3>
            <button onClick={() => setIsMetricsExpanded(false)} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Close</button>
          </div>
          <div className="metrics-popup-body" style={{ color: '#1e293b' }}>
            {renderMetricsContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CattleDetails;
