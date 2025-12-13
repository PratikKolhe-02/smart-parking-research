const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());
app.use(express.json());

// --- HELPER: Calculate Distance ---
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// --- API ---
app.post('/api/predict-parking', async (req, res) => {
    const { day, hour, is_weekend, userLat, userLng } = req.body;
    console.log(`📍 Searching for Garages & Hotels near: ${userLat}, ${userLng}`);

    let finalSpots = [];

    try {
        // 1. UPDATED QUERY: Ask for Parking, Garages (Car Repair), and Hotels
        const query = `
            [out:json];
            (
              node["amenity"="parking"](around:3000,${userLat},${userLng});
              node["shop"="car_repair"](around:3000,${userLat},${userLng});
              node["amenity"="fuel"](around:3000,${userLat},${userLng});
              node["tourism"="hotel"](around:3000,${userLat},${userLng});
              node["tourism"="guest_house"](around:3000,${userLat},${userLng});
              node["shop"="mall"](around:3000,${userLat},${userLng});
            );
            out body;
        `;
        
        const osmResponse = await axios.get(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const realData = osmResponse.data.elements;

        // 2. PROCESS & RENAME SPOTS
        if (realData && realData.length > 0) {
            finalSpots = realData
                .filter(item => item.tags && item.tags.name) // Must have a name
                .map(spot => {
                    let type = "Public";
                    let displayName = spot.tags.name;

                    // Rename based on type for better UX
                    if (spot.tags.shop === 'car_repair' || spot.tags.amenity === 'fuel') {
                        type = "Garage/Service";
                        displayName = `Garage: ${spot.tags.name}`;
                    } else if (spot.tags.tourism === 'hotel' || spot.tags.tourism === 'guest_house') {
                        type = "Hotel Parking";
                        displayName = `Hotel: ${spot.tags.name}`;
                    } else if (spot.tags.shop === 'mall') {
                        type = "Mall Parking";
                        displayName = `Mall: ${spot.tags.name}`;
                    }

                    return {
                        id: spot.id,
                        name: displayName,
                        lat: spot.lat,
                        lng: spot.lon,
                        type: type
                    };
                });
        }

        // Fallback if nothing found
        if (finalSpots.length === 0) {
            console.log("⚠️ No named spots found.");
            finalSpots = [{
                id: 0, name: "General Public Parking Area", lat: userLat + 0.001, lng: userLng + 0.001, type: "General"
            }];
        }

        // 3. AI PREDICTION
        let predictedOccupancy = 50;
        try {
            const pythonResponse = await axios.post('http://127.0.0.1:5000/predict', { day_of_week: day, hour, is_weekend });
            predictedOccupancy = pythonResponse.data.occupancy_score;
        } catch (e) { }

        // 4. FORMAT RESPONSE
        const responseData = finalSpots.map(spot => {
            const dist = calculateDistance(userLat, userLng, spot.lat, spot.lng);
            
            // Hotels are usually busier on weekends
            let adjustedOccupancy = predictedOccupancy;
            if (spot.type === "Hotel Parking" && is_weekend) adjustedOccupancy += 20;

            return {
                ...spot,
                distance: parseFloat(dist.toFixed(2)),
                occupancy: Math.min(Math.round(adjustedOccupancy), 100), // Cap at 100%
                status: adjustedOccupancy > 85 ? "Full" : "Available"
            };
        }).sort((a, b) => a.distance - b.distance).slice(0, 10); // Return top 10 results now

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error");
    }
});

app.listen(4000, () => console.log('✅ Server running on port 4000'));