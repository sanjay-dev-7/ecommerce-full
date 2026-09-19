import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminOrderManager from './AdminOrderManager';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'inventory'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Clothing',
    stock: '',
    image: '',
    description: '',
  });

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [orderRes, prodRes] = await Promise.all([
        axios.get('/api/orders/all').catch(() => ({ data: [] })),
        axios.get('/api/products').catch(() => ({ data: [] })),
      ]);
      setOrders(orderRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

 const handleCreateProduct = async (e) => {
  e.preventDefault();
  try {
    const imageUrl = newProduct.image.trim();

    await axios.post('/api/products', {
      name: newProduct.name,
      description: newProduct.description || 'Quality crafted utility product.',
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      // Schema expects images as an array:
      images: imageUrl ? [imageUrl] : [],
    });

    toast('Product created successfully!');
    setNewProduct({
      name: '',
      price: '',
      category: 'Clothing',
      stock: '',
      image: '',
      description: '',
    });
    fetchAdminData();
  } catch (err) {
    console.error('Error creating product:', err);
    toast.error(err.response?.data?.message || 'Failed to create product');
  }
};

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.heading}>Admin Control Center</h1>
          <p style={styles.subheading}>Manage customer order statuses and product inventory</p>
        </div>

        <div style={styles.tabs}>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'orders' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'orders' ? '#ffffff' : '#475569',
            }}
          >
            Orders ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'inventory' ? '#0f172a' : '#f1f5f9',
              color: activeTab === 'inventory' ? '#ffffff' : '#475569',
            }}
          >
            Inventory ({products.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Loading admin records...</p>
      ) : activeTab === 'orders' ? (
        /* ORDER STATUS MANAGEMENT VIEW */
        <AdminOrderManager orders={orders} onOrdersUpdate={fetchAdminData} />
      ) : (
        /* INVENTORY MANAGEMENT VIEW */
        <div style={styles.inventoryGrid}>
          {/* Add Product Form */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Add New Product</h3>
            <form onSubmit={handleCreateProduct} style={styles.form}>
              <div>
                <label style={styles.label}>Product Name</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Stock Units</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Clothing, Electronics..."
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Description</label>
                <textarea
                  rows="2"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ ...styles.input, resize: 'none' }}
                />
              </div>

              <button type="submit" style={styles.submitBtn}>Create Product</button>
            </form>
          </div>

          {/* Current Stock List */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Current Inventory</h3>
            <div style={styles.productList}>
              {products.map((p) => {
                const pId = p._id || p.id;
                const stockCount = p.countInStock ?? p.stock ?? 0;
                return (
                  <div key={pId} style={styles.productRow}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        ₹{p.price} • {stockCount} in stock
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(pId)}
                      style={styles.deleteBtn}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  subheading: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    padding: '8px 18px',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  inventoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 16px 0',
    color: '#0f172a',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: '4px',
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  submitBtn: {
    padding: '10px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '13px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  productList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '440px',
    overflowY: 'auto',
  },
  productRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #f1f5f9',
  },
  deleteBtn: {
    padding: '4px 10px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};