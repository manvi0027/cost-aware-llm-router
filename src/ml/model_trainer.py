"""
Machine Learning Model Training for Difficulty Prediction
Uses scikit-learn for prediction
"""

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib
import json
import os
from feature_engineer import FeatureEngineer

class DifficultyPredictor:
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        
    def train(self, datasets_paths: list):
        """Train model on multiple datasets"""
        
        all_features = []
        all_labels = []
        
        # Load and process all datasets
        for dataset_path in datasets_paths:
            try:
                df = pd.read_csv(dataset_path)
                
                for idx, row in df.iterrows():
                    query = row['query']
                    true_difficulty = row['difficulty_score']
                    
                    # Extract features
                    features, _ = self.feature_engineer.create_feature_vector(query, df)
                    all_features.append(features)
                    all_labels.append(true_difficulty)
            except Exception as e:
                print(f"Error loading {dataset_path}: {e}")
        
        if len(all_features) == 0:
            print("No features extracted!")
            return {}
        
        X = np.array(all_features)
        y = np.array(all_labels)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = self.model.predict(X_train)
        test_pred = self.model.predict(X_test)
        
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        test_rmse = np.sqrt(mean_squared_error(y_test, test_pred))
        test_r2 = r2_score(y_test, test_pred)
        test_mae = mean_absolute_error(y_test, test_pred)
        
        metrics = {
            'train_rmse': float(train_rmse),
            'test_rmse': float(test_rmse),
            'test_r2': float(test_r2),
            'test_mae': float(test_mae),
            'accuracy': float(test_r2 * 100),
            'n_samples': len(X),
            'n_features': X.shape[1]
        }
        
        print(f"\n=== Model Training Results ===")
        print(f"Train RMSE: {train_rmse:.4f}")
        print(f"Test RMSE: {test_rmse:.4f}")
        print(f"Test R²: {test_r2:.4f}")
        print(f"Test MAE: {test_mae:.4f}")
        print(f"Model Accuracy: {metrics['accuracy']:.2f}%")
        
        return metrics
    
    def predict_difficulty(self, query: str) -> dict:
        """Predict difficulty for a query"""
        
        # Create dummy context dataframe
        context_df = pd.DataFrame()
        
        # Extract features
        features, feature_dict = self.feature_engineer.create_feature_vector(query, context_df)
        features = features.reshape(1, -1)
        
        # Predict
        prediction = self.model.predict(features)[0]
        
        return {
            'predicted_difficulty': float(np.clip(prediction, 0, 1)),
            'confidence': float(min(abs(prediction - 0.5) * 2, 1)),
            'estimated_tokens': int(prediction * 1000)
        }
    
    def save_model(self, path: str = 'src/ml/models/difficulty_model.pkl'):
        """Save trained model"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self.model, path)
        print(f"Model saved to {path}")
    
    def load_model(self, path: str = 'src/ml/models/difficulty_model.pkl'):
        """Load trained model"""
        self.model = joblib.load(path)
        print(f"Model loaded from {path}")


# Usage and training script
if __name__ == "__main__":
    predictor = DifficultyPredictor()
    
    # Train on all datasets
    datasets = [
        'datasets/climate.csv',
        'datasets/medical.csv',
        'datasets/code.csv',
        'datasets/finance.csv'
    ]
    
    metrics = predictor.train(datasets)
    
    # Test predictions
    test_queries = [
        "Hello world",
        "What is machine learning?",
        "Analyze quantum entanglement phenomenon"
    ]
    
    print("\n=== Predictions ===")
    for query in test_queries:
        result = predictor.predict_difficulty(query)
        print(f"\nQuery: {query}")
        print(f"Predicted Difficulty: {result['predicted_difficulty']:.3f}")
        print(f"Confidence: {result['confidence']:.3f}")
    
    # Save model
    predictor.save_model()