import React from 'react';

export default function ProductFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  priceRange,
  maxProductPrice,
  onPriceChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <input
          type="text"
          placeholder="Search products by title or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.controlGroup}>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            style={styles.select}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            style={styles.select}
          >
            <option value="featured">Sort by: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-asc">Alphabetical: A to Z</option>
          </select>
        </div>
      </div>

      <div style={styles.priceRow}>
        <label style={styles.priceLabel}>
          Max Price: <strong>Rs. {priceRange}</strong>
        </label>
        <input
          type="range"
          min="0"
          max={maxProductPrice || 10000}
          step="100"
          value={priceRange}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          style={styles.rangeInput}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  topRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'space-between',
  },
  searchInput: {
    flex: '1 1 280px',
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  controlGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  select: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#0f172a',
    cursor: 'pointer',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingTop: '8px',
    borderTop: '1px solid #f1f5f9',
  },
  priceLabel: {
    fontSize: '13px',
    color: '#475569',
    minWidth: '150px',
  },
  rangeInput: {
    flex: 1,
    cursor: 'pointer',
  },
};