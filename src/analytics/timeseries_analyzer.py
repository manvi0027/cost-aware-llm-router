"""
Time-series analysis for LLMOps metrics
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

class TimeSeriesAnalyzer:
    """Advanced time-series analytics for cost and performance"""
    
    def detect_anomalies(self, data: list, contamination: float = 0.1) -> dict:
        """
        Detect anomalies using Isolation Forest
        """
        
        if len(data) < 5:
            return {'anomalies': []}
        
        X = np.array(data).reshape(-1, 1)
        detector = IsolationForest(contamination=contamination, random_state=42)
        predictions = detector.fit_predict(X)
        
        anomaly_indices = np.where(predictions == -1)[0]
        
        return {
            'anomaly_indices': anomaly_indices.tolist(),
            'anomaly_values': [data[i] for i in anomaly_indices],
            'anomaly_count': len(anomaly_indices),
            'anomaly_percentage': float(len(anomaly_indices) / len(data) * 100)
        }
    
    def calculate_trend(self, data: list) -> dict:
        """Calculate trend statistics"""
        
        if len(data) < 2:
            return {'error': 'Insufficient data'}
        
        data = np.array(data)
        mean = np.mean(data)
        std = np.std(data)
        
        # Simple linear trend
        x = np.arange(len(data))
        z = np.polyfit(x, data, 1)
        trend_slope = z[0]
        
        return {
            'mean': float(mean),
            'std': float(std),
            'trend_slope': float(trend_slope),
            'trend_direction': 'up' if trend_slope > 0 else 'down',
            'min': float(np.min(data)),
            'max': float(np.max(data)),
            'volatility': float(std / mean) if mean != 0 else 0
        }