import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // State to store user inputs
  const [day, setDay] = useState(0); // 0 = Monday
  const [hour, setHour] = useState(12); // 12 PM
  const [spots, setSpots] = useState([]); // Stores the list of parking spots
  const [loading, setLoading] = useState(false);

  // Function to call the API
  const findParking = async () => {
    setLoading(true);
    try {
      // Calculate if it is a weekend (Saturday=5, Sunday=6)
      const isWeekend = day >= 5 ? 1 : 0;

      // Talk to your Node.js Backend (Port 3000)
      const response = await axios.post('http://localhost:3000/api/predict-parking', {
        day: parseInt(day),
        hour: parseInt(hour),
        is_weekend: isWeekend
      });

      // Save the results to state
      setSpots(response.data);
    } catch (error) {
      alert("Error connecting to server. Make sure Node Backend is running!");
      console.error(error);
    }
    setLoading(false);
  };

  // Function to open Google Maps for "Value Added Services"
  const openNearby = (lat, lng, type) => {
    // Opens a google search for hotels/garages near that parking spot
    const query = type === 'hotel' ? 'hotels near' : 'garage near';
    window.open(`https://www.google.com/maps/search/${query}+${lat},${lng}`, '_blank');
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🚗 Smart Parking Predictor</h1>
        <p>AI-Powered Availability System</p>
      </header>

      <div className="controls">
        <label>Select Day:</label>
        <select value={day} onChange={(e) => setDay(e.target.value)}>
          <option value={0}>Monday</option>
          <option value={1}>Tuesday</option>
          <option value={2}>Wednesday</option>
          <option value={3}>Thursday</option>
          <option value={4}>Friday</option>
          <option value={5}>Saturday</option>
          <option value={6}>Sunday</option>
        </select>

        <label>Select Time (24h):</label>
        <input 
          type="number" 
          min="0" max="23" 
          value={hour} 
          onChange={(e) => setHour(e.target.value)} 
        />

        <button onClick={findParking} disabled={loading}>
          {loading ? "Calculating..." : "Find Parking"}
        </button>
      </div>

      <div className="results-container">
        {spots.map((spot) => (
          <div key={spot.id} className={`parking-card ${spot.status}`}>
            <h3>{spot.name}</h3>
            <p>Type: {spot.type}</p>
            
            <div className="prediction-box">
              <span>Predicted Occupancy:</span>
              <strong>{spot.occupancy}%</strong>
            </div>
            
            <p className="status-text">Status: {spot.status}</p>

            <div className="action-buttons">
              <button onClick={() => openNearby(spot.lat, spot.lng, 'hotel')}>
                🏨 Nearby Hotels
              </button>
              <button onClick={() => openNearby(spot.lat, spot.lng, 'garage')}>
                🔧 Nearby Garage
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;