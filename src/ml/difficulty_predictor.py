"""
Integration of ML-based difficulty predictor with LLMOps system
"""

import numpy as np
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from model_trainer import DifficultyPredictor as MLPredictor
except ImportError:
    MLPredictor = None

class MLDifficultyPredictor:
    """Production-ready ML predictor for query difficulty"""
    
    def __init__(self, model_path: str = 'src/ml/models/difficulty_model.pkl'):
        self.model_path = model_path
        
        if MLPredictor is None:
            print("Warning: Could not import MLPredictor")
            self.predictor = None
        else:
            self.predictor = MLPredictor()
            
            # Load model if exists
            if os.path.exists(model_path):
                try:
                    self.predictor.load_model(model_path)
                except:
                    print(f"Warning: Could not load model from {model_path}")
    
    def estimate_difficulty(self, query: str) -> dict:
        """
        Estimate query difficulty using ML model
        """
        
        if self.predictor is None:
            return {
                'difficulty_score': 0.5,
                'model': 'fallback',
                'confidence': 0.5,
                'estimated_tokens': 500,
                'recommended_model': 'midtier'
            }
        
        try:
            result = self.predictor.predict_difficulty(query)
            difficulty = result['predicted_difficulty']
            confidence = result['confidence']
        except:
            return {
                'difficulty_score': 0.5,
                'model': 'fallback',
                'confidence': 0.5,
                'estimated_tokens': 500,
                'recommended_model': 'midtier'
            }
        
        # Determine recommended model
        if difficulty < 0.3:
            recommended_model = 'cheap'
        elif difficulty < 0.7:
            recommended_model = 'midtier'
        else:
            recommended_model = 'expert'
        
        return {
            'difficulty_score': difficulty,
            'model': 'ml-based',
            'confidence': confidence,
            'estimated_tokens': result['estimated_tokens'],
            'recommended_model': recommended_model
        }