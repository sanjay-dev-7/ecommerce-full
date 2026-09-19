import React from 'react';

export default function HeroSection({ onShopClick }) {
  return (
    <section style={styles.heroWrapper}>
      <div style={styles.heroContent}>
        <h1 style={styles.title}>Engineered Apparel and Gear</h1>
        <p style={styles.subtitle}>
          Technical craftsmanship built for utility, longevity, and peak daily performance.
        </p>
        <button type="button" onClick={onShopClick} style={styles.ctaButton}>
          Browse Catalog
        </button>
      </div>

      <div style={styles.metricsBar}>
        <div style={styles.metricItem}>
          <span style={styles.metricNumber}>100%</span>
          <span style={styles.metricLabel}>Authentic Products</span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricNumber}>24/7</span>
          <span style={styles.metricLabel}>Inventory Sync</span>
        </div>
        <div style={styles.metricItem}>
          <span style={styles.metricNumber}>0 Sec</span>
          <span style={styles.metricLabel}>Razorpay Settlement Validation</span>
        </div>
      </div>
    </section>
  );
}

const styles = {
  heroWrapper: {
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    overflow: 'hidden',
    color: '#ffffff',
    marginBottom: '28px',
  },
  heroContent: {
    padding: '48px 24px',
    textAlign: 'center',
    maxWidth: '720px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    lineHeight: '1.6',
    margin: '0 0 24px 0',
  },
  ctaButton: {
    padding: '12px 28px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  metricsBar: {
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    padding: '16px 24px',
    gap: '16px',
    textAlign: 'center',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricNumber: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#f8fafc',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};