import { QueryRequest } from '@/src/types';

export class DifficultyEstimator {
  private complexityKeywords = {
    high: ['analyze', 'compare', 'evaluate', 'summarize', 'explain', 'research', 'technical', 'algorithm', 'architecture', 'optimize', 'debug', 'implement', 'design', 'complex', 'advanced'],
    medium: ['how', 'what', 'why', 'describe', 'list', 'question', 'help', 'suggest', 'recommend', 'explain'],
    low: ['hello', 'hi', 'thanks', 'yes', 'no', 'simple', 'basic', 'quick', 'brief', 'ok']
  };

  estimateDifficulty(query: QueryRequest): number {
    let score = 0;

    // Query length analysis
    const queryLength = query.query.length;
    if (queryLength < 50) score += 0.1;
    else if (queryLength < 200) score += 0.2;
    else if (queryLength < 500) score += 0.4;
    else score += 0.6;

    // Keyword-based difficulty
    const lowerQuery = query.query.toLowerCase();
    let keywordScore = 0;

    for (const keyword of this.complexityKeywords.high) {
      if (lowerQuery.includes(keyword)) keywordScore = Math.max(keywordScore, 0.7);
    }

    for (const keyword of this.complexityKeywords.medium) {
      if (lowerQuery.includes(keyword)) keywordScore = Math.max(keywordScore, 0.4);
    }

    for (const keyword of this.complexityKeywords.low) {
      if (lowerQuery.includes(keyword)) keywordScore = Math.max(keywordScore, 0.1);
    }

    score = (score + keywordScore) / 2;

    // Special character analysis (technical content indicators)
    const specialChars = (query.query.match(/[{}[\]():<>|&*]/g) || []).length;
    score += Math.min(specialChars * 0.02, 0.2);

    // Numbers and formulas
    const numbers = (query.query.match(/\d+/g) || []).length;
    score += Math.min(numbers * 0.01, 0.15);

    return Math.min(score, 1);
  }

  getEstimatedTokens(query: string): { input: number; output: number } {
    // Rough estimation: ~4 characters per token
    const inputTokens = Math.ceil(query.length / 4);
    const outputTokens = Math.ceil(inputTokens * 0.5); // Output ~50% of input
    return { input: inputTokens, output: outputTokens };
  }
}