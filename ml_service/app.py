from flask import Flask, request, jsonify
from flask_cors import CORS  # This allows the Website to talk to Python
import joblib
import numpy as np

# Initialize the App
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Load the "Brain" you just trained
print("Loading AI Model...")
model = joblib.load('parking_model.pkl')
print("AI Model Loaded Successfully!")

@app.route('/predict', methods=['POST'])
def predict():
    # 1. Get data from the Website
    data = request.json
    
    # Extract inputs: day (0-6), hour (0-23), is_weekend (0/1)
    features = [data['day_of_week'], data['hour'], data['is_weekend']]
    
    # 2. Convert to format the AI understands
    final_features = [np.array(features)]
    
    # 3. Ask the Brain for a prediction
    prediction = model.predict(final_features)
    
    # 4. Send the answer back
    output = round(prediction[0], 2) # Round to 2 decimal places
    
    return jsonify({
        'prediction_text': f'Predicted Occupancy: {output}%',
        'occupancy_score': output
    })

if __name__ == "__main__":
    print("Starting Python AI Server on Port 5000...")
    app.run(port=5000, debug=True)