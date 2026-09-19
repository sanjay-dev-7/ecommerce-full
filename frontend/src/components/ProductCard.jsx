import React, { useState, useEffect } from 'react';

// Default modern placeholder SVG when no image is uploaded
const DEFAULT_PLACEHOLDER =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="240" viewBox="0 0 300 240" fill="%23f1f5f9"><rect width="300" height="240" fill="%23f8fafc"/><path d="M130 100a15 15 0 1 0 0-30 15 15 0 0 0 0 30zm-45 60h130l-40-52-30 38-20-24-40 38z" fill="%23cbd5e1"/><text x="50%" y="180" font-size="12" font-family="sans-serif" fill="%2394a3b8" text-anchor="middle">No Image Available</text></svg>';

export default function ProductCard({ product, onAddToCart, onBuyNow }) {
  const [quantity, setQuantity] = useState(1);

  // Safely resolve any possible image property name from MongoDB
  const resolveImage = () => {
    if (Array.isArray(product.images) && product.images.length > 0 && product.images[0]) {
      return product.images[0];
    }
    return product.image || product.imageUrl || product.thumbnail || DEFAULT_PLACEHOLDER;
  };

  const [imgSrc, setImgSrc] = useState(resolveImage);

  // Sync state whenever products update or load
  useEffect(() => {
    setImgSrc(resolveImage());
  }, [product]);

  const availableStock = product.countInStock ?? product.stock ?? 0;
  const isOutOfStock = availableStock <= 0;
  const maxLimit = Math.min(10, availableStock);

  return (
    <div style={styles.card}>
      {/* Product Image */}
      <div style={styles.imageContainer}>
        <img
            src={imgSrc}
            alt={product.name}
            style={styles.image}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
            loading="lazy"
            />
        {isOutOfStock && <span style={styles.stockBadge}>Out of Stock</span>}
      </div>

      {/* Details */}
      <div style={styles.content}>
        <span style={styles.category}>{product.category || 'General'}</span>
        <h3 style={styles.title}>{product.name}</h3>
        <p style={styles.description}>
          {product.description && product.description.trim() !== ''
            ? product.description
            : 'No description provided'}
        </p>

        <div style={styles.priceRow}>
          <span style={styles.price}>Rs. {product.price}</span>
          <span
            style={{
              fontSize: '12px',
              color: isOutOfStock ? '#ef4444' : '#16a34a',
              fontWeight: '600',
            }}
          >
            {isOutOfStock ? 'Sold Out' : `${availableStock} in stock`}
          </span>
        </div>

        {/* Quantity Controls */}
        {!isOutOfStock && (
          <div style={styles.qtyContainer}>
            <span style={styles.qtyLabel}>Quantity:</span>
            <div style={styles.qtyControls}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                style={styles.qtyBtn}
              >
                −
              </button>
              <span style={styles.qtyValue}>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxLimit, q + 1))}
                disabled={quantity >= maxLimit}
                style={styles.qtyBtn}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={styles.actions}>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product, quantity)}
            style={{
              ...styles.addToCartBtn,
              opacity: isOutOfStock ? 0.5 : 1,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            }}
          >
            Add to Cart
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onBuyNow(product, quantity)}
            style={{
              ...styles.buyNowBtn,
              opacity: isOutOfStock ? 0.5 : 1,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '220px',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid #f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    padding: '8px',
    boxSizing: 'border-box',
    display: 'block',
  },
  stockBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
  },
  category: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#0284c7',
    letterSpacing: '0.05em',
    marginBottom: '4px',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 4px 0',
  },
  description: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 12px 0',
    lineHeight: 1.4,
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  price: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#0f172a',
  },
  qtyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px',
    padding: '6px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  qtyLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '16px',
    lineHeight: '1',
  },
  qtyValue: {
    fontSize: '13px',
    fontWeight: '700',
    minWidth: '20px',
    textAlign: 'center',
    color: '#0f172a',
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: 'auto',
  },
  addToCartBtn: {
    padding: '10px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
  },
  buyNowBtn: {
    padding: '10px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
  },
};