import Link from 'next/link';
import styles from '@/styles/home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>🚀 Cost-Aware LLMOps Platform</h1>
        <p>Intelligent AI Model Routing with Machine Learning</p>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🤖 ML-Based Routing</h3>
            <p>86.83% accuracy difficulty prediction</p>
          </div>
          <div className={styles.feature}>
            <h3>💰 Cost Optimization</h3>
            <p>60% savings with intelligent routing</p>
          </div>
          <div className={styles.feature}>
            <h3>📊 Real-Time Analytics</h3>
            <p>Complete monitoring and logging</p>
          </div>
          <div className={styles.feature}>
            <h3>💳 Budget Management</h3>
            <p>Real-time budget enforcement</p>
          </div>
        </div>

        <div className={styles.buttons}>
          <Link href="/dashboard" className={styles.primaryBtn}>
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}