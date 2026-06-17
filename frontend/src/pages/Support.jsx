import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MessageSquare, BookOpen, LifeBuoy, 
  Mail, Phone, ExternalLink, HelpCircle, 
  ChevronRight, Activity
} from 'lucide-react';
import './Support.css';

const Support = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      q: "How often are health metrics synchronized?",
      a: "Metrics are updated in real-time through our high-precision sensor mesh. Typically, data points are transmitted every 30-60 seconds to ensure optimal monitoring without excessive battery drain on the RFID tags."
    },
    {
      q: "Can I export data for veterinarian reviews?",
      a: "Yes. Use the 'Weekly Performance Report' button on any herd entry page to generate a professional PDF document containing vital signs, nutrition logs, and activity levels."
    },
    {
      q: "How do I recalibrate the 3D Biometric Schematic?",
      a: "If the 3D model appears misaligned or the mesh is not loading, ensure you have the latest .glb file uploaded. You can re-upload model files at any time via the Herd Detail section."
    }
  ];

  return (
    <div className="support-container">
      <button className="back-btn" onClick={() => navigate(-1)} style={{ position: 'fixed', top: '32px', left: '32px', background: 'white', borderRadius: '50%', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <ArrowLeft size={20} />
      </button>

      <header className="support-header">
        <h1>Precision Help Center</h1>
        <p>Expert assistance for your agricultural intelligence suite. We're here to ensure your unit 01 operations run at peak efficiency.</p>
      </header>

      <section className="support-grid">
        <div className="support-card">
          <div className="support-icon-box">
            <MessageSquare size={32} />
          </div>
          <h3>Live Expert Chat</h3>
          <p>Direct access to our senior farm technologists. Average response time: 2 minutes.</p>
          <button className="btn-support">Initialize Session</button>
        </div>

        <div className="support-card">
          <div className="support-icon-box">
            <BookOpen size={32} />
          </div>
          <h3>User Documentation</h3>
          <p>Comprehensive guides on sensor integration, genetic reporting, and data management.</p>
          <button className="btn-support">Explore Library</button>
        </div>

        <div className="support-card">
          <div className="support-icon-box" style={{ background: '#fef2f2', color: '#ef4444' }}>
            <LifeBuoy size={32} />
          </div>
          <h3>Technical Tickets</h3>
          <p>Experiencing hardware issues? Submit a direct sensor diagnostic ticket.</p>
          <button className="btn-support" style={{ background: '#ef4444' }}>Open Ticket</button>
        </div>
      </section>

      <section className="faq-section">
        <h2>
          <HelpCircle size={28} color="#2d5a3f" />
          Frequently Asked Biometrics
        </h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <h4>{faq.q}</h4>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="support-footer-info">
        <div className="report-logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
          <Activity size={24} color="#2d5a3f" />
          <span style={{ fontSize: '20px', fontWeight: 800 }}>GreenGeoFarm Support</span>
        </div>
        <div className="contact-links">
          <div className="contact-item">
             <Mail size={18} color="#94a3b8" />
             support@agroprecision.ai
          </div>
          <div className="contact-item">
             <Phone size={18} color="#94a3b8" />
             +1 (800) AGRO-TECH
          </div>
          <div className="contact-item">
             <ExternalLink size={18} color="#94a3b8" />
             Regional Portal
          </div>
        </div>
        <p style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8' }}>© 2024 AgroPrecision AI Systems. All diagnostic reports are encrypted.</p>
      </footer>
    </div>
  );
};

export default Support;
