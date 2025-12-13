import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { auth, signInWithGoogle, logout } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import './App.css'; 

function App() {
  const [user, setUser] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // AUTO-SCAN: As soon as user logs in, find parking!
      if (currentUser) {
        findNearestParking();
      }
    });
    return () => unsubscribe();
  }, []);

  const findNearestParking = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const now = new Date();
        const day = now.getDay();
        const hour = now.getHours();
        const is_weekend = (day === 0 || day === 6) ? 1 : 0;

        try {
          const response = await axios.post('http://localhost:4000/api/predict-parking', {
            day, hour, is_weekend,
            userLat: latitude,
            userLng: longitude
          });
          setSpots(response.data);
          setLoading(false);
        } catch (err) {
          console.error("Backend Error", err);
          setLoading(false);
        }
      },
      () => setLoading(false),
      { enableHighAccuracy: true }
    );
  };

  // --- LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>🚀 Smart City Access</h1>
          <p>AI-Powered Parking, Garage & Hotel Finder</p>
          <button onClick={signInWithGoogle} className="google-btn">
             {/* Google Icon SVG */}
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  const filteredSpots = activeTab === 'all' 
    ? spots 
    : spots.filter(s => {
        if(activeTab === 'garage') return s.type.includes("Garage");
        if(activeTab === 'hotel') return s.type.includes("Hotel");
        return !s.type.includes("Garage") && !s.type.includes("Hotel");
      });

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="logo">🅿️ SmartPark AI</div>
        <div className="user-info">
          <span className="welcome-text">Hi, {user.displayName ? user.displayName.split(' ')[0] : 'User'}</span>
          
          {/* --- THE FIX FOR BROKEN IMAGE --- */}
          <img 
            src={user.photoURL} 
            referrerPolicy="no-referrer"
            alt="Profile" 
            className="avatar"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"; // Fallback Icon
            }}
          />
          
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <header className="hero">
        <h2>Find Nearby Services</h2>
        <p>Real-time availability powered by AI</p>
        <button onClick={findNearestParking} className="scan-btn">
          {loading ? "📡 Scanning Satellite..." : "🔄 Refresh Location"}
        </button>
      </header>

      {/* Tabs */}
      {spots.length > 0 && (
        <div className="tabs">
          <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>All Results</button>
          <button className={activeTab === 'parking' ? 'active' : ''} onClick={() => setActiveTab('parking')}>🚗 Parking</button>
          <button className={activeTab === 'garage' ? 'active' : ''} onClick={() => setActiveTab('garage')}>🔧 Garages</button>
          <button className={activeTab === 'hotel' ? 'active' : ''} onClick={() => setActiveTab('hotel')}>🏨 Hotels</button>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid-container">
        {filteredSpots.map((spot, index) => (
          <div key={index} className="card">
            <div className="card-header">
              <h3>{spot.name}</h3>
              <span className={`badge ${spot.type.split(" ")[0].toLowerCase()}`}>{spot.type}</span>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span>📏 Distance</span>
                <strong>{spot.distance} km</strong>
              </div>
              <div className="info-row">
                <span>📊 Occupancy</span>
                <strong>{spot.occupancy}%</strong>
              </div>
              <div className="progress-bar">
                <div 
                  className="fill" 
                  style={{ 
                    width: `${spot.occupancy}%`, 
                    background: spot.occupancy > 80 ? '#ef4444' : '#10b981' 
                  }}
                ></div>
              </div>
            </div>
            <div className="card-footer">
              <span className={`status ${spot.status === 'Full' ? 'full' : 'available'}`}>
                {spot.status}
              </span>
              <button className="nav-btn">Navigate ➔</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;