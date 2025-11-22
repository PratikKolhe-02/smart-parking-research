const express = require('express');
const cors = require('cors');
const axios = require('axios'); // To talk to Python
const app = express();

app.use(cors());
app.use(express.json());

// --- FAKE DATABASE (Simulated Parking Lots) ---
// In a real project, this comes from MongoDB.
const parkingSpots = [
    { id: 1, name: "City Center Mall", lat: 23.25, lng: 77.41, type: "Mall" },
    { id: 2, name: "Railway Station", lat: 23.26, lng: 77.42, type: "Public" },
    { id: 3, name: "Tech Park Zone", lat: 23.27, lng: 77.40, type: "Office" }
];

// --- API: FIND PARKING ---
app.post('/api/predict-parking', async (req, res) => {
    const { day, hour, is_weekend } = req.body;

    console.log(`Request received: Day ${day}, Hour ${hour}`);

    try {
        // 1. Ask Python AI for the "Occupancy Percentage"
        // We send the data to the Python Server running on Port 5000
        const pythonResponse = await axios.post('http://127.0.0.1:5000/predict', {
            day_of_week: day,
            hour: hour,
            is_weekend: is_weekend
        });

        const predictedOccupancy = pythonResponse.data.occupancy_score;

        // 2. Update our Parking Spots with this prediction
        const updatedSpots = parkingSpots.map(spot => {
            // Add some randomness so every spot isn't exactly the same
            let spotOccupancy = predictedOccupancy; 
            if(spot.type === "Mall" && is_weekend) spotOccupancy += 10; 
            
            return {
                ...spot,
                occupancy: spotOccupancy,
                status: spotOccupancy > 85 ? "Full" : "Available"
            };
        });

        res.json(updatedSpots);

    } catch (error) {
        console.error("Error connecting to Python AI:", error.message);
        res.status(500).json({ error: "AI Service is down" });
    }
});

// Start Server on Port 3000
app.listen(3000, () => {
    console.log('Node Backend running on http://localhost:3000');
});