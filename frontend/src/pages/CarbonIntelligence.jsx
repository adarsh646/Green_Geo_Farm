import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Leaf,
  Wind,
  Zap,
  TrendingUp,
  Map as MapIcon,
  Globe,
  ShieldCheck,
  LayoutDashboard,
  Users,
  Package,
  Settings,
  BarChart3,
  HelpCircle,
  LogOut,
  ArrowUpRight,
  Info,
  AlertTriangle,
  Calculator
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { clearManagementSession } from '../utils/sessionStorage';
import './CarbonIntelligence.css';

const API_BASE = '/api/carbon';
const GWP_CH4 = 27.2;
const GWP_N2O = 273;
const NITROGEN_EXCRETION_FACTOR = 0.029;

const ZONE_FACTORS = [0.78, 0.89, 1.12, 0.96, 1.08, 0.85, 1.03, 1.2, 0.92, 0.74, 1.15, 1.05, 0.81, 1.18, 0.98];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const formatValue = (value, digits = 2) => toNumber(value).toFixed(digits);

const CarbonIntelligence = () => {
  const navigate = useNavigate();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);

  const [vcsParams, setVcsParams] = useState({
    animalGroup: 'Lactating Cows',
    meanHeadCount: 124,
    daysOnFarm: 365,
    dryMatterIntake: 22.5,
    feedAmount: 4500,
    gridElecUsed: 0.12,
    transportDist: 150,
    volatileSolidsFraction: 0.85,
    EFelec: 708,
    FCa: 0.043,
    EFa: 74100,
    TEFim: 0.0001,
    EFijS: 1.5,
    EF3S: 0.005
  });

  const [bioCngLogs, setBioCngLogs] = useState([]);
  const [creditInputs, setCreditInputs] = useState({
    bufferPercent: 15,
    issuancePercent: 5,
    creditPrice: 1200
  });

  useEffect(() => {
    const fetchCarbonData = async () => {
      try {
        const [vcsRes, logsRes] = await Promise.all([
          axios.get(`${API_BASE}/emission-factors`),
          axios.get(`${API_BASE}/bio-cng`)
        ]);

        if (vcsRes.data) {
          setVcsParams((prev) => ({ ...prev, ...vcsRes.data }));
        }
        if (Array.isArray(logsRes.data)) {
          setBioCngLogs(logsRes.data);
        }
      } catch (error) {
        console.error('Failed to load carbon data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarbonData();
  }, []);

  const baselineMetrics = useMemo(() => {
    const meanHeadCount = toNumber(vcsParams.meanHeadCount);
    const daysOnFarm = toNumber(vcsParams.daysOnFarm);
    const dryMatterIntake = toNumber(vcsParams.dryMatterIntake);
    const volatileSolidsFraction = toNumber(vcsParams.volatileSolidsFraction);
    const EFijS = toNumber(vcsParams.EFijS);
    const EF3S = toNumber(vcsParams.EF3S);

    const feedAmount = toNumber(vcsParams.feedAmount);
    const gridElecUsed = toNumber(vcsParams.gridElecUsed);
    const transportDist = toNumber(vcsParams.transportDist);
    const EFelec = toNumber(vcsParams.EFelec);
    const FCa = toNumber(vcsParams.FCa);
    const EFa = toNumber(vcsParams.EFa);
    const TEFim = toNumber(vcsParams.TEFim);

    const dryMatterTotalKg = meanHeadCount * daysOnFarm * dryMatterIntake;
    const volatileSolidsKg = dryMatterTotalKg * volatileSolidsFraction;

    const manureCh4Kg = (volatileSolidsKg * EFijS) / 1000;
    const manureCh4Tco2e = (manureCh4Kg * GWP_CH4) / 1000;

    const nitrogenExcretionKg = dryMatterTotalKg * NITROGEN_EXCRETION_FACTOR;
    const n2oNKg = nitrogenExcretionKg * EF3S;
    const n2oKg = n2oNKg * (44 / 28);
    const manureN2oTco2e = (n2oKg * GWP_N2O) / 1000;

    const feedElectricityMwh = feedAmount * gridElecUsed;
    const feedElectricityTco2e = (feedElectricityMwh * EFelec) / 1000;

    const feedTransportTco2e = (feedAmount * transportDist * TEFim) / 1000;

    const feedFuelTj = feedAmount * FCa;
    const feedFuelTco2e = (feedFuelTj * EFa) / 1000;

    const components = [
      { name: 'Manure CH4', value: manureCh4Tco2e },
      { name: 'Manure N2O', value: manureN2oTco2e },
      { name: 'Feed Electricity', value: feedElectricityTco2e },
      { name: 'Feed Transport', value: feedTransportTco2e },
      { name: 'Feed Fuel Combustion', value: feedFuelTco2e }
    ];

    const totalBaselineTco2e = components.reduce((sum, item) => sum + toNumber(item.value), 0);

    return {
      components,
      totalBaselineTco2e,
      annualDryMatterKg: dryMatterTotalKg,
      annualVolatileSolidsKg: volatileSolidsKg,
      manureCh4Kg,
      n2oKg,
      feedElectricityMwh
    };
  }, [vcsParams]);

  const projectMetrics = useMemo(() => {
    const totals = bioCngLogs.reduce(
      (acc, log) => {
        acc.totalMethaneAvoided += toNumber(log.totalMethaneAvoided);
        acc.methaneAvoidedAa += toNumber(log.methaneAvoidedAa);
        acc.methaneAvoidedAb += toNumber(log.methaneAvoidedAb);
        acc.gasProduced += toNumber(log.gasProduced);
        acc.slurryToBiogas += toNumber(log.slurryToBiogas);
        acc.cafeCreditsPotential += toNumber(log.cafeCreditsPotential);
        acc.ruralCostSavings += toNumber(log.ruralCostSavings);
        acc.ammoniaPpm += toNumber(log.ammoniaPpm);
        acc.co2Ppm += toNumber(log.co2Ppm);
        return acc;
      },
      {
        totalMethaneAvoided: 0,
        methaneAvoidedAa: 0,
        methaneAvoidedAb: 0,
        gasProduced: 0,
        slurryToBiogas: 0,
        cafeCreditsPotential: 0,
        ruralCostSavings: 0,
        ammoniaPpm: 0,
        co2Ppm: 0
      }
    );

    const logsCount = bioCngLogs.length || 1;

    return {
      totalMethaneAvoidedTco2e: totals.totalMethaneAvoided / 1000,
      methaneAvoidedAaTco2e: totals.methaneAvoidedAa / 1000,
      methaneAvoidedAbTco2e: totals.methaneAvoidedAb / 1000,
      totalGasProducedKg: totals.gasProduced,
      totalSlurryToBiogasL: totals.slurryToBiogas,
      totalCafeCredits: totals.cafeCreditsPotential,
      totalRuralSavings: totals.ruralCostSavings,
      avgAmmoniaPpm: totals.ammoniaPpm / logsCount,
      avgCo2Ppm: totals.co2Ppm / logsCount
    };
  }, [bioCngLogs]);

  const latestLog = bioCngLogs[0] || {};

  const chartData = useMemo(() => {
    const baselinePerDay = baselineMetrics.totalBaselineTco2e / 365;
    const latestSevenLogs = [...bioCngLogs]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);

    if (latestSevenLogs.length === 0) {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
        name: day,
        baseline: baselinePerDay,
        avoided: 0,
        net: baselinePerDay
      }));
    }

    return latestSevenLogs.map((log) => {
      const avoided = toNumber(log.totalMethaneAvoided) / 1000;
      const net = Math.max(0, baselinePerDay - avoided);
      const dayLabel = new Date(log.date).toLocaleDateString('en-US', { weekday: 'short' });

      return {
        name: dayLabel,
        baseline: baselinePerDay,
        avoided,
        net
      };
    });
  }, [baselineMetrics.totalBaselineTco2e, bioCngLogs]);

  const weeklyChange = useMemo(() => {
    const currentWeekTotal = bioCngLogs.slice(0, 7).reduce((sum, log) => sum + toNumber(log.totalMethaneAvoided), 0);
    const previousWeekTotal = bioCngLogs.slice(7, 14).reduce((sum, log) => sum + toNumber(log.totalMethaneAvoided), 0);

    if (previousWeekTotal <= 0) {
      return currentWeekTotal > 0 ? 100 : 0;
    }

    return ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100;
  }, [bioCngLogs]);

  const netEmissionsTco2e = baselineMetrics.totalBaselineTco2e - projectMetrics.totalMethaneAvoidedTco2e;
  const recoveryRate =
    baselineMetrics.totalBaselineTco2e > 0
      ? (projectMetrics.totalMethaneAvoidedTco2e / baselineMetrics.totalBaselineTco2e) * 100
      : 0;
  const score = clamp(recoveryRate, 0, 100);
  const scoreLabel = score >= 80 ? 'EXCELLENT' : score >= 60 ? 'STRONG' : score >= 40 ? 'MODERATE' : 'IMPROVE';

  const grossCredits = Math.max(0, projectMetrics.totalMethaneAvoidedTco2e);
  const bufferCredits = grossCredits * (toNumber(creditInputs.bufferPercent) / 100);
  const issuanceCredits = grossCredits * (toNumber(creditInputs.issuancePercent) / 100);
  const tradableCredits = Math.max(0, grossCredits - bufferCredits - issuanceCredits);
  const projectedRevenue = tradableCredits * toNumber(creditInputs.creditPrice);

  const creditEstimation = [
    { name: 'Recovered', value: clamp(recoveryRate, 0, 100), fill: '#22c55e' },
    { name: 'Remaining', value: Math.max(0, 100 - clamp(recoveryRate, 0, 100)), fill: '#f1f5f9' }
  ];

  const zoneData = useMemo(() => {
    const methaneBase = Math.max(8, toNumber(latestLog.gasProduced, 0) / 50);
    const co2Base = Math.max(320, toNumber(latestLog.co2Ppm, projectMetrics.avgCo2Ppm || 380));
    const ammoniaBase = Math.max(12, toNumber(latestLog.ammoniaPpm, projectMetrics.avgAmmoniaPpm || 24));

    return ZONE_FACTORS.map((factor, index) => {
      const methane = methaneBase * factor;
      const co2 = co2Base * (0.7 + factor * 0.35);
      const temp = 23 + (index % 5) * 0.8 + (Math.floor(index / 5) - 1) * 0.5;
      const riskScore = methane * 1.8 + co2 / 30 + ammoniaBase * factor;

      let status = 'Stable';
      if (riskScore >= 55) status = 'Critical';
      else if (riskScore >= 42) status = 'Medium';
      else if (riskScore >= 30) status = 'Low';

      return {
        id: index + 1,
        name: `ZONE-${index + 1}`,
        methane: formatValue(methane, 1),
        co2: formatValue(co2, 0),
        temp: formatValue(temp, 1),
        status
      };
    });
  }, [latestLog, projectMetrics.avgAmmoniaPpm, projectMetrics.avgCo2Ppm]);

  const highRiskZoneCount = zoneData.filter((zone) => zone.status === 'Critical').length;

  const captureStats = [
    {
      label: 'Methane Avoided',
      value: `${formatValue(projectMetrics.totalMethaneAvoidedTco2e)} tCO2e`,
      trend: `${weeklyChange >= 0 ? '+' : ''}${formatValue(weeklyChange)}%`,
      trendClass: weeklyChange >= 0 ? 'positive' : 'negative',
      icon: <Wind size={20} color="#22c55e" />
    },
    {
      label: 'Bio-CNG Produced',
      value: `${formatValue(projectMetrics.totalGasProducedKg, 0)} kg`,
      trend: `${formatValue(projectMetrics.totalSlurryToBiogasL, 0)} L input`,
      trendClass: 'positive',
      icon: <Zap size={20} color="#eab308" />
    },
    {
      label: 'Net Annual Emission',
      value: `${formatValue(netEmissionsTco2e)} tCO2e`,
      trend: netEmissionsTco2e <= 0 ? 'Carbon negative' : 'Requires mitigation',
      trendClass: netEmissionsTco2e <= 0 ? 'positive' : 'negative',
      icon: <Leaf size={20} color="#16a34a" />
    },
    {
      label: 'Tradable Credits',
      value: `${formatValue(tradableCredits)} tCO2e`,
      trend: `Rs ${formatValue(projectedRevenue, 0)} projected`,
      trendClass: 'positive',
      icon: <Activity size={20} color="#2563eb" />
    }
  ];

  const onCreditInputChange = (event) => {
    const { name, value } = event.target;
    setCreditInputs((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="cattle-details-layout dashboard-layout carbon-intel-layout">
      <aside className="cd-sidebar">
        <div className="cd-sidebar-logo">
          <div className="cd-logo-img" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}>
            <Leaf size={24} color="white" />
          </div>
          <div className="cd-logo-text">
            GreenGeoFarm
            <span>CARBON UNIT 01</span>
          </div>
        </div>

        <nav className="cd-sidebar-nav">
          <div className="nav-group-label">Core Operations</div>
          <div className="cd-nav-item" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard size={20} />
            <span>Command Center</span>
          </div>
          <div className="cd-nav-item active">
            <Leaf size={20} />
            <span>Emission Controller</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>Strategic Insights</div>
          <div className="cd-nav-item" onClick={() => navigate('/cattle-management')}>
            <Users size={20} />
            <span>Herd Management</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/feed-stock')}>
            <Package size={20} />
            <span>Supply Chain</span>
          </div>

          <div className="nav-group-label" style={{ marginTop: '24px' }}>System Control</div>
          <div className="cd-nav-item" onClick={() => navigate('/farm-assets')}>
            <Settings size={20} />
            <span>Asset Logistics</span>
          </div>
          <div className="cd-nav-item" onClick={() => navigate('/enterprise-reports')}>
            <BarChart3 size={20} />
            <span>Enterprise Reports</span>
          </div>
        </nav>

        <footer className="cd-sidebar-footer">
          <div className="cd-nav-item" onClick={() => navigate('/support')}>
            <HelpCircle size={20} />
            <span>Support</span>
          </div>
          <div
            className="cd-nav-item"
            onClick={() => {
              clearManagementSession();
              navigate('/management/login');
            }}
          >
            <LogOut size={20} />
            <span>Termination</span>
          </div>
        </footer>
      </aside>

      <main className="cd-main-content">
        <header className="cd-navbar">
          <div className="cd-nav-title-group">
            <h1 className="cd-nav-title">Carbon Emission Console</h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              Live baseline emissions, mitigation, and credit estimations from farm operations.
            </p>
          </div>
          <div className="cd-toolbar">
            <div className="carbon-badge">
              <ShieldCheck size={14} />
              <span>{loading ? 'Loading Carbon Data' : 'Certified Sustainable'}</span>
            </div>
          </div>
        </header>

        <div className="carbon-grid">
          <div className="cd-card carbon-score-card">
            <div className="cd-section-header">
              <Activity size={16} color="#22c55e" />
              <h3>Net Carbon Score</h3>
              <Info size={14} color="#94a3b8" className="info-icon" />
            </div>
            <div className="gauge-container">
              <div className="main-gauge">
                <div className="gauge-inner">
                  <span className="gauge-value">{Math.round(score)}</span>
                  <span className="gauge-label">{scoreLabel}</span>
                </div>
                <svg viewBox="0 0 100 100" className="gauge-svg">
                  <circle cx="50" cy="50" r="45" className="gauge-track" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    className="gauge-fill"
                    style={{ strokeDasharray: `${(282 * score) / 100} 282` }}
                  />
                </svg>
              </div>
              <div className="gauge-stats">
                <div className="g-stat">
                  <span className="g-label">Weekly Change</span>
                  <span className={`g-value ${weeklyChange >= 0 ? 'positive' : 'negative'}`}>
                    <ArrowUpRight size={14} /> {formatValue(weeklyChange)}%
                  </span>
                </div>
                <div className="g-stat">
                  <span className="g-label">Baseline Emission</span>
                  <span className="g-value">{formatValue(baselineMetrics.totalBaselineTco2e)} tCO2e</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-mini-grid">
            {captureStats.map((stat) => (
              <div key={stat.label} className="cd-card mini-stat-card">
                <div className="ms-icon">{stat.icon}</div>
                <div className="ms-info">
                  <span className="ms-label">{stat.label}</span>
                  <span className="ms-value">{stat.value}</span>
                  <span className={`ms-trend ${stat.trendClass}`}>{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="cd-card analytics-card">
            <div className="cd-section-header">
              <TrendingUp size={16} color="#2563eb" />
              <h3>Emission & Recovery Analytics (7 Entries)</h3>
            </div>
            <div className="chart-container" style={{ height: '300px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAvoided" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${formatValue(value)} tCO2e`, '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area type="monotone" dataKey="baseline" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBaseline)" />
                  <Area type="monotone" dataKey="avoided" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAvoided)" />
                  <Area type="monotone" dataKey="net" stroke="#ef4444" strokeWidth={2.2} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="cd-card baseline-card">
            <div className="cd-section-header">
              <BarChart3 size={16} color="#0ea5e9" />
              <h3>Baseline Emission Breakdown</h3>
            </div>

            <div className="baseline-main">
              <span className="b-val">{formatValue(baselineMetrics.totalBaselineTco2e)}</span>
              <span className="b-unit">tCO2e per baseline year</span>
            </div>

            <div className="baseline-chart-wrap">
              <ResponsiveContainer width="100%" height="170px">
                <BarChart data={baselineMetrics.components}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => `${formatValue(value)} tCO2e`} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {baselineMetrics.components.map((item) => (
                      <Cell key={item.name} fill="#0ea5e9" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="baseline-list">
              {baselineMetrics.components.map((component) => (
                <div key={component.name} className="baseline-row">
                  <span>{component.name}</span>
                  <strong>{formatValue(component.value)} tCO2e</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="cd-card credits-card">
            <div className="cd-section-header">
              <Globe size={16} color="#16a34a" />
              <h3>Carbon Credit Potential</h3>
            </div>
            <div className="credit-content">
              <div className="credit-main">
                <span className="c-val">{formatValue(tradableCredits)}</span>
                <span className="c-unit">Tradable credits (tCO2e)</span>
              </div>
              <div className="credit-visual">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={creditEstimation} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                      {creditEstimation.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="credit-meta">
                <div className="credit-meta-row">
                  <span>Gross Creditable</span>
                  <strong>{formatValue(grossCredits)} tCO2e</strong>
                </div>
                <div className="credit-meta-row">
                  <span>Projected Revenue</span>
                  <strong>Rs {formatValue(projectedRevenue, 0)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="cd-card calculator-card">
            <div className="cd-section-header">
              <Calculator size={16} color="#0f766e" />
              <h3>Credit Calculator</h3>
            </div>
            <div className="calculator-grid">
              <label className="calc-field" htmlFor="bufferPercent">
                Buffer Reserve (%)
                <input
                  id="bufferPercent"
                  name="bufferPercent"
                  type="number"
                  min="0"
                  step="0.1"
                  value={creditInputs.bufferPercent}
                  onChange={onCreditInputChange}
                />
              </label>
              <label className="calc-field" htmlFor="issuancePercent">
                Issuance Fee (%)
                <input
                  id="issuancePercent"
                  name="issuancePercent"
                  type="number"
                  min="0"
                  step="0.1"
                  value={creditInputs.issuancePercent}
                  onChange={onCreditInputChange}
                />
              </label>
              <label className="calc-field" htmlFor="creditPrice">
                Market Price (Rs / Credit)
                <input
                  id="creditPrice"
                  name="creditPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={creditInputs.creditPrice}
                  onChange={onCreditInputChange}
                />
              </label>
            </div>

            <div className="calculator-results">
              <div className="calc-row">
                <span>Baseline Emissions</span>
                <strong>{formatValue(baselineMetrics.totalBaselineTco2e)} tCO2e</strong>
              </div>
              <div className="calc-row">
                <span>Project Reductions</span>
                <strong>{formatValue(projectMetrics.totalMethaneAvoidedTco2e)} tCO2e</strong>
              </div>
              <div className="calc-row">
                <span>Buffer Deduction</span>
                <strong>{formatValue(bufferCredits)} credits</strong>
              </div>
              <div className="calc-row">
                <span>Issuance Deduction</span>
                <strong>{formatValue(issuanceCredits)} credits</strong>
              </div>
              <div className="calc-row total">
                <span>Final Tradable Credits</span>
                <strong>{formatValue(tradableCredits)} credits</strong>
              </div>
            </div>
          </div>

          <div className={`cd-card heatmap-card ${isMapExpanded ? 'expanded' : ''}`}>
            <div className="cd-section-header">
              <MapIcon size={16} color="#64748b" />
              <h3>Farm Emission Heatmap</h3>
              <button className="expand-toggle-btn" onClick={() => setIsMapExpanded(!isMapExpanded)}>
                {isMapExpanded ? 'Exit Fullscreen' : 'Expand View'}
              </button>
            </div>
            <div className="heatmap-placeholder">
              <div className="map-overlay">
                <div className="map-legend">
                  <span className="legend-item"><span className="dot low"></span> Low</span>
                  <span className="legend-item"><span className="dot med"></span> Med</span>
                  <span className="legend-item"><span className="dot high"></span> High</span>
                </div>
              </div>

              <div className="simulated-map-upgraded">
                <div className="radar-sweep"></div>
                <div className="sensor-grid-array">
                  {zoneData.map((zone) => (
                    <div
                      key={zone.id}
                      className={`sensor-node ${
                        zone.status === 'Critical' ? 'high-density' : zone.status === 'Medium' ? 'medium-density' : zone.status === 'Low' ? 'low-density' : ''
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedZone(zone);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="node-dot"></div>
                      {(zone.status === 'Critical' || zone.status === 'Medium') && <div className="node-glow"></div>}
                      {(zone.status === 'Critical' || zone.status === 'Medium' || zone.status === 'Low') && <span className="node-label">{zone.name}</span>}
                    </div>
                  ))}
                </div>

                {selectedZone && (
                  <div className="zone-popup-overlay" onClick={() => setSelectedZone(null)}>
                    <div className="zone-popup-card" onClick={(event) => event.stopPropagation()}>
                      <div className="popup-header">
                        <h4>{selectedZone.name} Details</h4>
                        <button className="close-popup" onClick={() => setSelectedZone(null)}>x</button>
                      </div>
                      <div className="popup-body">
                        <div className="p-stat">
                          <span>Methane</span>
                          <strong>{selectedZone.methane} m3</strong>
                        </div>
                        <div className="p-stat">
                          <span>CO2 Level</span>
                          <strong>{selectedZone.co2} ppm</strong>
                        </div>
                        <div className="p-stat">
                          <span>Temp</span>
                          <strong>{selectedZone.temp} C</strong>
                        </div>
                        <div className="p-status-pill" data-status={selectedZone.status}>
                          {selectedZone.status}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid-coordinates">
                  <span>SEC-A // GRID-84</span>
                  <span>Derived from latest sensor log</span>
                </div>
              </div>
            </div>
            <div className="map-footer-upgraded">
              <div className="map-stat-chip">
                <div className="sensor-pulse-dot"></div>
                <span className="chip-label">Active Sensors</span>
                <span className="chip-value">{zoneData.length}</span>
              </div>
              <div className="map-stat-chip">
                <AlertTriangle size={14} className="chip-icon warning" />
                <span className="chip-label">High Density Zones</span>
                <span className="chip-value">{highRiskZoneCount}</span>
              </div>
              <div className="map-stat-chip">
                <Activity size={14} className="chip-icon sync" />
                <span className="chip-label">Avg CO2</span>
                <span className="chip-value">{formatValue(projectMetrics.avgCo2Ppm, 0)} ppm</span>
              </div>
            </div>
          </div>

          <div className="vcs-dashboard">
            <div className="vcs-header">
              <h2><ShieldCheck size={20} color="#22c55e" /> Baseline Parameters (VM0041)</h2>
            </div>

            <div className="vcs-grid">
              <div className="vcs-card">
                <h3><Users size={16} /> Livestock Parameters</h3>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Animal Group (j)</span>
                  <span className="vcs-stat-value">{vcsParams.animalGroup}</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Mean Head Count</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.meanHeadCount, 0)}</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Days on Farm</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.daysOnFarm, 0)} days</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Dry Matter Intake</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.dryMatterIntake)} kg/day</span>
                </div>
              </div>

              <div className="vcs-card">
                <h3><Package size={16} /> Feed & Transport Inputs</h3>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Feed Amount</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.feedAmount, 0)} kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Grid Electricity</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.gridElecUsed, 4)} MWh/kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Transport Distance</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.transportDist, 0)} km</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Volatile Solids Fraction</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.volatileSolidsFraction, 3)}</span>
                </div>
              </div>

              <div className="vcs-card">
                <h3><Leaf size={16} /> Emission Factors</h3>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">EFelec</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.EFelec, 0)} kgCO2/MWh</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">FCa</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.FCa, 4)} TJ/kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">EFa</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.EFa, 0)} kgCO2e/TJ</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">TEFim</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.TEFim, 5)} kgCO2/kg/km</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">EFijS</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.EFijS, 3)} gCH4/kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">EF3S</span>
                  <span className="vcs-stat-value">{formatValue(vcsParams.EF3S, 4)} kgN2O-N/kgN</span>
                </div>
              </div>

              <div className="vcs-card">
                <h3><Activity size={16} /> Derived Baseline Indicators</h3>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Annual Dry Matter</span>
                  <span className="vcs-stat-value">{formatValue(baselineMetrics.annualDryMatterKg, 0)} kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Annual Volatile Solids</span>
                  <span className="vcs-stat-value">{formatValue(baselineMetrics.annualVolatileSolidsKg, 0)} kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">CH4 Mass</span>
                  <span className="vcs-stat-value">{formatValue(baselineMetrics.manureCh4Kg, 0)} kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">N2O Mass</span>
                  <span className="vcs-stat-value">{formatValue(baselineMetrics.n2oKg, 1)} kg</span>
                </div>
                <div className="vcs-stat-row">
                  <span className="vcs-stat-label">Feed Electricity</span>
                  <span className="vcs-stat-value">{formatValue(baselineMetrics.feedElectricityMwh, 2)} MWh</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bio-cng-dashboard">
            <div className="vcs-header">
              <h2><Wind size={20} color="#3b82f6" /> Bio-CNG & Mobility Impact</h2>
              <div className="carbon-badge" style={{ background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
                <Activity size={14} /> SATAT Ready
              </div>
            </div>

            <div className="bio-cng-grid">
              <div className="bio-cng-card">
                <h3><Globe size={16} /> Methane Reduction Split</h3>
                <div className="bio-stat-main">
                  <span className="bio-val negative">{formatValue(projectMetrics.totalMethaneAvoidedTco2e)}</span>
                  <span className="bio-unit">tCO2e avoided</span>
                </div>
                <div className="wtw-comparison">
                  <div className="wtw-row">
                    <span className="wtw-label">Process</span>
                    <div className="wtw-bar-container">
                      <div className="wtw-bar petrol" style={{ width: `${clamp((projectMetrics.methaneAvoidedAaTco2e / (projectMetrics.totalMethaneAvoidedTco2e || 1)) * 100, 0, 100)}%` }}>
                        {formatValue(projectMetrics.methaneAvoidedAaTco2e)} t
                      </div>
                    </div>
                  </div>
                  <div className="wtw-row">
                    <span className="wtw-label">Soil</span>
                    <div className="wtw-bar-container">
                      <div className="wtw-bar biocng" style={{ width: `${clamp((projectMetrics.methaneAvoidedAbTco2e / (projectMetrics.totalMethaneAvoidedTco2e || 1)) * 100, 0, 100)}%` }}>
                        {formatValue(projectMetrics.methaneAvoidedAbTco2e)} t
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bio-cng-card">
                <h3><TrendingUp size={16} /> CAFE Credits from Logs</h3>
                <div className="bio-stat-main">
                  <span className="bio-val">{formatValue(projectMetrics.totalCafeCredits)}</span>
                  <span className="bio-unit">Total CAFE credit potential</span>
                </div>
                <div className="bio-progress-container">
                  <div className="bio-progress-labels" style={{ marginBottom: '4px' }}>
                    <span>Credit Utilization</span>
                    <span>{formatValue(clamp((projectMetrics.totalCafeCredits / 150) * 100, 0, 100), 0)}%</span>
                  </div>
                  <div className="bio-progress-bar">
                    <div className="bio-progress-fill" style={{ width: `${clamp((projectMetrics.totalCafeCredits / 150) * 100, 0, 100)}%` }}></div>
                  </div>
                  <span className="bio-unit" style={{ fontSize: '10px' }}>*Derived directly from all saved Bio-CNG records.</span>
                </div>
              </div>

              <div className="bio-cng-card">
                <h3><Users size={16} /> Rural Mobility Savings</h3>
                <div className="savings-highlight">
                  <span className="savings-currency">Rs</span>{formatValue(projectMetrics.totalRuralSavings, 0)}
                </div>
                <span className="bio-unit">Cumulative cost savings from Bio-CNG use</span>
                <div className="bio-progress-container">
                  <div className="bio-progress-bar">
                    <div className="bio-progress-fill green" style={{ width: `${clamp((projectMetrics.totalRuralSavings / 100000) * 100, 0, 100)}%` }}></div>
                  </div>
                  <p className="savings-subtext">
                    Live values from daily logs, including gas output and equivalent rural transport savings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <button
        onClick={() => navigate('/carbon-intelligence-update')}
        style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          zIndex: 999,
          background: 'linear-gradient(135deg,#16a34a,#15803d)',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '16px 24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 30px rgba(22,163,74,0.3)',
          fontSize: '15px',
          fontWeight: 700
        }}
      >
        <ArrowUpRight size={20} color="white" />
        Update Carbon Log
      </button>
    </div>
  );
};

export default CarbonIntelligence;
