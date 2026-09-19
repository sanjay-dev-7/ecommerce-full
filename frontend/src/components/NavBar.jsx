import React from 'react';

export default function Navbar({
  cartCount,
  user,
  onOpenCart,
  onOpenAuth,
  onLogout,
  currentView,
  onNavigate,
  categories = [],
  selectedCategory,
  onSelectCategory,
}) {
  return (
    <header style={styles.header}>
      {/* Tier 1: Dark Utility Bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <div style={styles.brand} onClick={() => onNavigate('shop')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m2 7 10-5 10 5-10 5z"/>
              <path d="m2 17 10 5 10-5"/>
              <path d="m2 12 10 5 10-5"/>
            </svg>
            <span style={styles.brandText}>StoreBlocks</span>
          </div>

          <div style={styles.topRightActions}>
            {user && (
              <button
                type="button"
                onClick={() => onNavigate('orders')}
                style={{
                  ...styles.topLink,
                  color: currentView === 'orders' ? '#38bdf8' : '#e2e8f0',
                }}
              >
                Orders
              </button>
            )}

            {/* Admin link: Only visible if user exists AND role is strictly 'admin' */}
            {user && user.role?.toLowerCase() === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                style={{
                  ...styles.topLink,
                  color: currentView === 'admin' ? '#38bdf8' : '#e2e8f0',
                  fontWeight: '600',
                }}
              >
                Admin
              </button>
            )}

            {user ? (
              <div style={styles.userSection}>
                <span style={styles.userName}>{user.name}</span>
                <button type="button" onClick={onLogout} style={styles.authBtnSmall}>
                  Logout
                </button>
              </div>
            ) : (
              <button type="button" onClick={onOpenAuth} style={styles.topLink}>
                Account
              </button>
            )}

            <button type="button" onClick={onOpenCart} style={styles.cartButton}>
              <span>Cart</span>
              <span style={styles.cartBadge}>{cartCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tier 2: Category Filter Strip */}
      <div style={styles.subBar}>
        <div style={styles.subBarInner} className="subbar-scroll">
          <button
            type="button"
            onClick={() => {
              onSelectCategory('All');
              if (currentView !== 'shop') onNavigate('shop');
            }}
            style={{
              ...styles.subLink,
              fontWeight: selectedCategory === 'All' && currentView === 'shop' ? '700' : '500',
              borderBottom: selectedCategory === 'All' && currentView === 'shop' ? '2px solid #0f172a' : 'none',
            }}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onSelectCategory(cat);
                if (currentView !== 'shop') onNavigate('shop');
              }}
              style={{
                ...styles.subLink,
                fontWeight: selectedCategory === cat && currentView === 'shop' ? '700' : '500',
                borderBottom: selectedCategory === cat && currentView === 'shop' ? '2px solid #0f172a' : 'none',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    width: '100%',
    maxWidth: '100vw',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    boxSizing: 'border-box',
    overflowX: 'clip',
  },
  topBar: {
    backgroundColor: '#121212',
    color: '#ffffff',
    padding: '10px 0',
    width: '100%',
    boxSizing: 'border-box',
  },
  topBarInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    boxSizing: 'border-box',
    width: '100%',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  brandText: {
    fontSize: '1.05rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  topRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginLeft: 'auto',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  topLink: {
    background: 'none',
    border: 'none',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    padding: '4px 6px',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  userName: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    maxWidth: '80px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  authBtnSmall: {
    background: '#262626',
    border: 'none',
    color: '#f8fafc',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  cartButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#262626',
    border: '1px solid #404040',
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  cartBadge: {
    backgroundColor: '#f59e0b',
    color: '#000000',
    fontSize: '0.7rem',
    fontWeight: '700',
    borderRadius: '10px',
    padding: '1px 5px',
  },
  subBar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
    overflowX: 'hidden',
  },
  subBarInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 12px',
    display: 'flex',
    gap: '14px',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    width: '100%',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
  },
  subLink: {
    background: 'none',
    border: 'none',
    padding: '10px 2px',
    cursor: 'pointer',
    color: '#0f172a',
    fontSize: '0.82rem',
    flexShrink: 0,
  },
};