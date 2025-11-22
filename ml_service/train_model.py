import pandas as pd
import numpy as np
import random
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import joblib

# --- STEP 1: GENERATE SYNTHETIC DATA (The "Fake History") ---
print("1. Generating synthetic parking data...")

data = []
# Simulate 90 days of data (3 months)
for day in range(90): 
    for hour in range(6, 24): # From 6 AM to Midnight
        
        # Logic to make it look real:
        # 0 = Monday, 6 = Sunday
        day_of_week = day % 7
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Base traffic: 50% full usually
        traffic = 50 
        
        # If it's evening (5 PM - 8 PM), add traffic
        if 17 <= hour <= 20: 
            traffic += 30 
        
        # If it's weekend, add a little traffic
        if is_weekend == 1:
            traffic += 10
            
        # Add random noise (so it's not perfect)
        noise = random.randint(-10, 10)
        occupancy = traffic + noise
        
        # Ensure occupancy is between 0 and 100
        occupancy = max(0, min(100, occupancy))
        
        # Add to our list
        data.append([day_of_week, hour, is_weekend, occupancy])

# Convert to a Table (DataFrame)
df = pd.DataFrame(data, columns=['Day_of_Week', 'Hour', 'Is_Weekend', 'Occupancy'])

# Save the data to show your professor later
df.to_csv("parking_data.csv", index=False)
print("   -> Data saved as 'parking_data.csv'")

# --- STEP 2: TRAIN THE AI MODEL ---
print("2. Training the Random Forest Model...")

# Input (Features): Day, Hour, Weekend?
X = df[['Day_of_Week', 'Hour', 'Is_Weekend']] 
# Output (Target): How full is it?
y = df['Occupancy'] 

# Split data: 80% for training, 20% for testing exam
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Create the Brain
model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)

# Check how smart it is
accuracy = model.score(X_test, y_test)
print(f"   -> Model Accuracy: {accuracy * 100:.2f}%")

# --- STEP 3: SAVE THE BRAIN ---
joblib.dump(model, 'parking_model.pkl')
print("3. Success! AI Brain saved as 'parking_model.pkl'")