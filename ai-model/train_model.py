import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import skl2onnx
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

# 1. Generate Refined Synthetic Data (Based on STEPS 2019 / User Master Instruction)
def generate_steps_data(n_samples=10000):
    np.random.seed(42)
    
    age = np.random.randint(15, 65, n_samples)
    gender = np.random.binomial(1, 0.5, n_samples)
    
    # Smoking: 1 (Current), 0 (Never/Former)
    smoking = np.where(gender == 1, 
                       np.random.binomial(1, 0.491, n_samples), # 49.1% men
                       np.random.binomial(1, 0.05, n_samples))
    
    # Alcohol: 1 (Hazardous), 0 (None/Moderate)
    alcohol = np.random.binomial(1, 0.25, n_samples) 
    
    # Fruit/Veg: 1 (< 5 portions), 0 (>= 5 portions) - 96.4% of population < 5
    fruit_veg = np.random.binomial(1, 0.964, n_samples)
    
    # Physical Activity: 1 (Inactive), 0 (Active)
    activity = np.random.binomial(1, 0.22, n_samples)
    
    # Continuous values
    bmi = np.random.normal(26, 5, n_samples)
    bmi = np.clip(bmi, 15, 50)
    
    sys_bp = np.random.normal(125, 20, n_samples)
    sys_bp = np.clip(sys_bp, 90, 200)
    
    df = pd.DataFrame({
        'age': age,
        'gender': gender,
        'smoking': smoking,
        'alcohol': alcohol,
        'fruit_veg': fruit_veg,
        'activity': activity,
        'bmi': bmi,
        'sys_bp': sys_bp
    })
    
    # Labeling Logic (Target Labeling)
    # 0: Low, 1: Moderate, 2: High
    risk_score = (
        smoking * 1.5 + 
        alcohol * 1.0 + 
        fruit_veg * 1.0 + 
        activity * 1.2 + 
        ((bmi >= 25).astype(int) * 1.5) + 
        ((sys_bp >= 140).astype(int) * 2.0)
    )
    
    df['risk_level'] = np.where(risk_score >= 4.5, 2, np.where(risk_score >= 2.0, 1, 0))
    
    return df

print("--- Data Preprocessing ---")
data = generate_steps_data()
print(f"Dataset generated: {data.shape[0]} samples")
print(data['risk_level'].value_counts(normalize=True))

# 2. Train Model (Random Forest for Explainability)
X = data.drop('risk_level', axis=1)
y = data['risk_level']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("\n--- Model Training (Random Forest) ---")
model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred, target_names=['Low', 'Moderate', 'High']))

# 3. Model Conversion (ONNX for Offline)
print("\n--- Model Conversion (ONNX) ---")
initial_type = [('float_input', FloatTensorType([None, X.shape[1]]))]
onx = convert_sklearn(model, initial_types=initial_type, target_opset=12)

with open("healthModel.onnx", "wb") as f:
    f.write(onx.SerializeToString())

print("✅ Model successfully exported as healthModel.onnx")

# Specialty Mapping Reference (For Documentation)
"""
Mapping Table:
High Risk Category -> Specialty -> Hospital
- High sys_bp      -> Cardiology  -> III Hospital, Songdo
- High BMI         -> Endocrinology -> I Hospital
- High Smoking     -> Pulmonology  -> NCCD
- Alcohol/Stress   -> Mental Health -> MCH
"""
