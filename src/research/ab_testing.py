"""
A/B Testing Framework for LLMOps Research
"""

import numpy as np
from scipy import stats
import json
from datetime import datetime

class ABTestingFramework:
    """Research-grade A/B testing"""
    
    def __init__(self):
        self.experiments = {}
    
    def create_experiment(self, experiment_name: str, strategy_a: str, strategy_b: str) -> dict:
        """Create new A/B test experiment"""
        
        exp = {
            'name': experiment_name,
            'strategy_a': strategy_a,
            'strategy_b': strategy_b,
            'created_at': datetime.now().isoformat(),
            'samples_a': [],
            'samples_b': [],
            'results': None
        }
        
        self.experiments[experiment_name] = exp
        return exp
    
    def record_observation(self, experiment_name: str, strategy: str, metric_value: float):
        """Record observation from experiment"""
        
        if experiment_name not in self.experiments:
            return {'error': 'Experiment not found'}
        
        exp = self.experiments[experiment_name]
        
        if strategy == 'A':
            exp['samples_a'].append(metric_value)
        elif strategy == 'B':
            exp['samples_b'].append(metric_value)
        
        return {'recorded': True}
    
    def analyze_experiment(self, experiment_name: str) -> dict:
        """Perform statistical analysis"""
        
        if experiment_name not in self.experiments:
            return {'error': 'Experiment not found'}
        
        exp = self.experiments[experiment_name]
        
        if len(exp['samples_a']) < 2 or len(exp['samples_b']) < 2:
            return {'error': 'Insufficient samples'}
        
        samples_a = np.array(exp['samples_a'])
        samples_b = np.array(exp['samples_b'])
        
        # T-test
        t_stat, p_value = stats.ttest_ind(samples_a, samples_b)
        
        # Cohen's d
        pooled_std = np.sqrt(((len(samples_a)-1)*np.std(samples_a)**2 + 
                              (len(samples_b)-1)*np.std(samples_b)**2) / 
                             (len(samples_a) + len(samples_b) - 2))
        cohens_d = (np.mean(samples_a) - np.mean(samples_b)) / pooled_std if pooled_std > 0 else 0
        
        # Significance
        is_significant = p_value < 0.05
        
        results = {
            'strategy_a': {
                'name': exp['strategy_a'],
                'mean': float(np.mean(samples_a)),
                'std': float(np.std(samples_a)),
                'samples': len(samples_a)
            },
            'strategy_b': {
                'name': exp['strategy_b'],
                'mean': float(np.mean(samples_b)),
                'std': float(np.std(samples_b)),
                'samples': len(samples_b)
            },
            'p_value': float(p_value),
            'significant': bool(is_significant),
            'cohens_d': float(cohens_d),
            'improvement_percentage': float((np.mean(samples_b) - np.mean(samples_a)) / np.mean(samples_a) * 100) if np.mean(samples_a) != 0 else 0
        }
        
        exp['results'] = results
        return results