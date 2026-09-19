import React from 'react';

export default function Footer() {
  return (
    <footer style={styles.footer}>
      {/* Top Showroom Tier */}
      <div style={styles.showroomSection}>
        <div style={styles.inner}>
          <div style={styles.showroomGrid}>
            <div>
              <div style={styles.locationTitle}>New York Flagship &rarr;</div>
              <p style={styles.locationAddress}>123 Madison Ave, New York, NY 10010</p>
            </div>
            <div>
              <div style={styles.locationTitle}>Los Angeles Store &rarr;</div>
              <p style={styles.locationAddress}>456 Sunset Blvd, Los Angeles, CA 90028</p>
            </div>
            <div>
              <div style={styles.locationTitle}>London Showroom &rarr;</div>
              <p style={styles.locationAddress}>21 Oxford Street, London W1D 2LT</p>
            </div>
            <div>
              <div style={styles.locationTitle}>Paris Boutique &rarr;</div>
              <p style={styles.locationAddress}>8 Rue de Rivoli, 75001 Paris</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav Tier */}
      <div style={styles.bottomSection}>
        <div style={styles.inner}>
          <div style={styles.bottomGrid}>
            <div>
              <h3 style={styles.brandTitle}>StoreBlocks</h3>
              <p style={styles.brandMission}>
                Engineered products made to elevate everyday living. Quality materials, timeless style, and effortless comfort.
              </p>
            </div>

            <div>
              <h4 style={styles.colTitle}>Collections</h4>
              <ul style={styles.linkList}>
                <li>New Arrivals</li>
                <li>Best Sellers</li>
                <li>Seasonal Edits</li>
                <li>Wardrobe Essentials</li>
              </ul>
            </div>

            <div>
              <h4 style={styles.colTitle}>Help & Support</h4>
              <ul style={styles.linkList}>
                <li>Order Tracking</li>
                <li>Returns & Exchanges</li>
                <li>Shipping Policy</li>
                <li>Contact Us</li>
              </ul>
            </div>

            <div>
              <h4 style={styles.colTitle}>Information</h4>
              <ul style={styles.linkList}>
                <li>Terms and Conditions</li>
                <li>Privacy Policy</li>
                <li>Warranty Guarantee</li>
                <li>Security & Compliance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    marginTop: 'auto',
  },
  showroomSection: {
    borderBottom: '1px solid #f1f5f9',
    padding: '36px 0',
  },
  bottomSection: {
    padding: '48px 0 36px 0',
  },
  inner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
  },
  showroomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '24px',
  },
  locationTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '6px',
  },
  locationAddress: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '32px',
  },
  brandTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    color: '#0f172a',
  },
  brandMission: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.6',
    margin: 0,
  },
  colTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '12px',
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
  },
};