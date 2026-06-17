import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, LogOut } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getShopUsername, clearShopSession } from '../utils/sessionStorage';
import newLandingBg from '../assets/new_landing_page.png';

// Fix for default marker icon in leaflet + react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060
};

// Component to handle map clicks
function LocationMarker({ selectedLocation, setSelectedLocation }) {
  const map = useMapEvents({
    click(e) {
      setSelectedLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo(selectedLocation, map.getZoom());
    }
  }, [selectedLocation, map]);

  return selectedLocation === null ? null : (
    <Marker position={selectedLocation} />
  );
}

const CustomerDashboard = () => {
  const [username, setUsername] = useState('');
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseAddress, setPurchaseAddress] = useState('');
  const [milkQuantity, setMilkQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const name = getShopUsername();
    if (name) {
      setUsername(name);
    } else {
      navigate('/customer/signin');
    }
  }, [navigate]);

  const handleSearchLocation = async () => {
    if (!searchQuery) {
      alert('Please enter an address to search.');
      return;
    }
    try {
      setIsSearching(true);
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const result = data[0];
        setSelectedLocation({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        setPurchaseAddress(result.display_name);
      } else {
        alert('Location not found.');
      }
    } catch (err) {
      console.error(err);
      alert('Error searching location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    clearShopSession();
    navigate('/');
  };

  const handlePurchaseSubmit = (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      alert("Please select a location on the map.");
      return;
    }
    if (!purchaseAddress) {
      alert("Please enter a delivery address.");
      return;
    }
    if (!milkQuantity) {
      alert("Please enter the milk quantity.");
      return;
    }
    console.log("Purchase submitted", { name: purchaseName, address: purchaseAddress, milkQuantity: milkQuantity, location: selectedLocation });
    alert("Purchase request sent!");
    setIsPurchaseModalOpen(false);
    setPurchaseName('');
    setPurchaseAddress('');
    setMilkQuantity('');
    setSelectedLocation(null);
  };

  return (
    <div className="new-landing" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo-group">
            <span className="brand-name">GreenGeoFarm</span>
            <span className="customer-name" style={{ display: 'block', fontSize: '0.9rem', color: '#34d399', fontWeight: '500', marginTop: '4px' }}>
              Welcome, {username}
            </span>
          </div>

          <div className="header-actions">
            <nav className="nav-menu">
              <Link to="/shop">Shop</Link>
              <div className="dropdown">
                <span className="dropdown-trigger">Our Products</span>
                <div className="dropdown-content">
                  <Link to="/management">Farm management software</Link>
                  <Link to="/sensors">Automatic Feed dispenser</Link>
                  <Link to="/sensors">Dung collector</Link>
                  <Link to="/sensors">Milking Robot</Link>
                </div>
              </div>
              <Link to="/community">Community</Link>
              <Link to="/about">About</Link>
            </nav>
            <div className="search-container">
              <Search size={18} />
              <input type="text" placeholder="Search ecosystem..." />
            </div>
            <button className="icon-btn"><Bell size={20} /></button>
            <button className="icon-btn"><User size={20} /></button>
            <button onClick={handleLogout} className="icon-btn" title="Logout" style={{ color: '#ef4444' }}><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      {/* Scrollable Full Image */}
      <div style={{ flex: 1, width: '100%', backgroundColor: '#000' }}>
        <img
          src={newLandingBg}
          alt="Farm Landing Background"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </div>

      {/* New Footer */}
      <footer style={{
        backgroundColor: '#064e3b',
        color: 'white',
        padding: '3rem 5%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Contact Us</h4>
            <p>RG83+FV,Kunnappilly,Kerala 686610, Green Geo Farm</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Mobile</h4>
            <p>+91 9746120384</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Email</h4>
            <p>hello@greengeofarm.com</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>WhatsApp</h4>
            <p>+91 9746120384</p>
          </div>
          <div>
            <h4 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Facebook</h4>
            <p>facebook.com/GreenGeoFarm</p>
          </div>
        </div>
        <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%', maxWidth: '800px' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>© 2026 Green Geo Farm. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating Purchase Button */}
      <button
        onClick={() => setIsPurchaseModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          padding: '16px 32px',
          fontSize: '1.1rem',
          fontWeight: '600',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.1)',
          cursor: 'pointer',
          zIndex: 1000,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        🛒 Purchase Now
      </button>
      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/919746120384" target="_blank" rel="noopener noreferrer" className="whatsapp-float-btn" aria-label="Chat on WhatsApp" title="Contact via WhatsApp">
          <span style={{ fontSize: '1.5rem' }}>📞</span>
          <span style={{ fontSize: '0.75rem', marginTop: '4px' }}>Contact</span>
        </a>
      <style>{`.cart-btn {
  background: var(--primary-green);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  cursor: pointer;
}

/* WhatsApp floating button */
.whatsapp-float-btn {
  position: fixed;
  bottom: 120px;
  right: 40px;
  background-color: #10b981; /* same green as purchase button */
  color: #fff;
  border: none;
  border-radius: 50px;
  padding: 16px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.1);
  cursor: pointer;
  z-index: 1000;
  transition: transform 0.2s;
  text-decoration: none;
}
.whatsapp-float-btn:hover {
  transform: scale(1.05);
  background-color: #1EBE57;
}`}</style>

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <h2 style={{ color: '#064e3b', marginBottom: '20px', fontSize: '1.5rem', fontWeight: 'bold' }}>Complete Your Purchase</h2>

            <form onSubmit={handlePurchaseSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>Full Name</label>
                <input
                  type="text"
                  value={purchaseName}
                  onChange={(e) => setPurchaseName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                  }}
                  placeholder="Enter your name"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>Delivery Address</label>
                <input
                  type="text"
                  value={purchaseAddress}
                  onChange={(e) => setPurchaseAddress(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                  }}
                  placeholder="Enter delivery address"
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontWeight: '500' }}>Milk Quantity (L)</label>
                <input
                  type="number"
                  min="0"
                  value={milkQuantity}
                  onChange={(e) => setMilkQuantity(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    outline: 'none',
                  }}
                  placeholder="Enter quantity"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ color: '#475569', fontWeight: '500', margin: 0 }}>
                    Delivery Location <span style={{ fontSize: '0.85em', color: '#94a3b8' }}>(Click map to select)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search address..."
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #cbd5e1',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSearchLocation}
                      disabled={isSearching}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#ecfdf5',
                        color: '#10b981',
                        border: '1px solid #a7f3d0',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🔍 Search
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setSelectedLocation({
                              lat: position.coords.latitude,
                              lng: position.coords.longitude
                            });
                          },
                          (error) => {
                            alert("Error getting location: " + error.message);
                          }
                        );
                      } else {
                        alert("Geolocation is not supported by this browser.");
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#ecfdf5',
                      color: '#10b981',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    📍 Use GPS Location
                  </button>
                </div>

                <div style={{ height: '300px', width: '100%', marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <MapContainer
                    center={[defaultCenter.lat, defaultCenter.lng]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} />
                  </MapContainer>
                </div>

                {selectedLocation && (
                  <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#10b981' }}>
                    ✓ Location selected ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Confirm Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
