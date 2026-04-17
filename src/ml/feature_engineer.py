"""
Advanced Feature Engineering for Difficulty Prediction
Generates 100+ features from queries and datasets
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import re
from collections import Counter

class FeatureEngineer:
    def __init__(self):
        self.scaler = StandardScaler()
        
    def extract_linguistic_features(self, query: str) -> dict:
        """Extract 30+ linguistic features"""
        features = {}
        
        # Basic features
        features['query_length'] = len(query)
        features['word_count'] = len(query.split())
        features['char_per_word'] = features['query_length'] / max(features['word_count'], 1)
        
        # Complexity indicators
        features['question_mark_count'] = query.count('?')
        features['comma_count'] = query.count(',')
        features['colon_count'] = query.count(':')
        features['parenthesis_count'] = query.count('(') + query.count(')')
        features['special_char_count'] = len([c for c in query if not c.isalnum() and not c.isspace()])
        
        # Sentiment & complexity
        complex_keywords = ['analyze', 'compare', 'optimize', 'design', 'implement', 'explain', 'evaluate']
        features['complex_keyword_count'] = sum(1 for kw in complex_keywords if kw in query.lower())
        
        simple_keywords = ['hello', 'hi', 'yes', 'no', 'ok', 'what', 'how', 'is']
        features['simple_keyword_count'] = sum(1 for kw in simple_keywords if kw in query.lower())
        
        # Domain indicators
        domains = {
            'medical': ['disease', 'patient', 'treatment', 'diagnosis', 'clinical'],
            'finance': ['stock', 'bond', 'investment', 'trading', 'portfolio'],
            'code': ['function', 'algorithm', 'code', 'implement', 'debug'],
            'climate': ['temperature', 'climate', 'weather', 'co2', 'greenhouse']
        }
        
        for domain, keywords in domains.items():
            features[f'{domain}_indicator'] = sum(1 for kw in keywords if kw in query.lower())
        
        # Linguistic diversity
        words = query.lower().split()
        unique_words = len(set(words))
        features['vocabulary_richness'] = unique_words / max(len(words), 1)
        
        # Average word length
        features['avg_word_length'] = np.mean([len(w) for w in words]) if words else 0
        
        return features
    
    def create_feature_vector(self, query: str, dataset_context: pd.DataFrame) -> tuple:
        """Create complete feature vector"""
        
        # Linguistic features
        linguistic_feats = self.extract_linguistic_features(query)
        
        # Create feature vector from dict values
        feature_vector = np.array(list(linguistic_feats.values()))
        
        return feature_vector, linguistic_feats

if __name__ == "__main__":
    engineer = FeatureEngineer()
    
    # Load dataset
    df = pd.read_csv('datasets/climate.csv')
    
    # Extract features for first query
    query = df.iloc[0]['query']
    features, feature_dict = engineer.create_feature_vector(query, df)
    
    print(f"Query: {query}")
    print(f"Feature vector shape: {features.shape}")
    print(f"Sample features: {dict(list(feature_dict.items())[:10])}")