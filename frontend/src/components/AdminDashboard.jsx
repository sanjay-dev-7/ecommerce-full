import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockInputs, setStockInputs] = useState({});

  // State for creating a new product
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    countInStock: '',
    category: 'Electronics',
    image: 'https://via.placeholder.com/150',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/orders/all', { withCredentials: true }),
        axios.get('http://localhost:5000/api/products', { withCredentials: true })
      ]);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

const handleCreateProduct = async (e) => {
  e.preventDefault();
  try {
    const qty = Number(newProduct.countInStock);
    await axios.post(
      '/api/products',
      {
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        category: newProduct.category,
        image: newProduct.image || 'https://via.placeholder.com/150',
        stock: qty,
        countInStock: qty,
      },
      { withCredentials: true }
    );

    alert('✅ Product created successfully!');
    setNewProduct({
      name: '',
      price: '',
      description: '',
      countInStock: '',
      category: 'Electronics',
      image: 'https://via.placeholder.com/150',
    });
    setShowAddForm(false);
    fetchData();
  } catch (err) {
    console.error('Failed to create product:', err);
    alert('Failed: ' + (err.response?.data?.message || err.message));
  }
};

  const handleUpdateStock = async (productId) => {
    const newStock = stockInputs[productId];
    if (newStock === undefined || newStock === '') return;

    try {
      await axios.patch(
        `http://localhost:5000/api/products/${productId}/stock`,
        { countInStock: Number(newStock) },
        { withCredentials: true }
      );
      alert('Stock updated successfully!');
      fetchData();
    } catch (err) {
      alert('Failed to update stock: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        withCredentials: true
      });
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '26px' }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: activeTab === 'orders' ? '#2563eb' : '#e2e8f0',
              color: activeTab === 'orders' ? '#fff' : '#1e293b'
            }}
          >
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              backgroundColor: activeTab === 'products' ? '#2563eb' : '#e2e8f0',
              color: activeTab === 'products' ? '#fff' : '#1e293b'
            }}
          >
            Inventory ({products.length})
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading records...</p>
      ) : activeTab === 'orders' ? (
        /* ORDERS LIST */
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px' }}>Order ID</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Items</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Razorpay ID</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {o._id.slice(-6)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div><strong>{o.user?.name || 'Customer'}</strong></div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{o.user?.email}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>
                    {o.orderItems?.map((it, idx) => (
                      <div key={idx}>{it.name || 'Item'} × {it.quantity}</div>
                    ))}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>₹{o.totalAmount}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: o.orderStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                        color: o.orderStatus === 'Paid' ? '#15803d' : '#a16207'
                      }}
                    >
                      {o.orderStatus}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                    {o.razorpayPaymentId || o.paymentResult?.id || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* INVENTORY LIST & PRODUCT CREATION */
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: '8px 16px',
                backgroundColor: showAddForm ? '#64748b' : '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showAddForm ? '✕ Close Form' : '+ Add New Product'}
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateProduct}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Headphones"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1999"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Initial Stock</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 10"
                  value={newProduct.countInStock}
                  onChange={(e) => setNewProduct({ ...newProduct, countInStock: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Category</label>
                <input
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '600' }}>Description</label>
                <textarea
                  rows="2"
                  placeholder="Short description of the item..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save Product
                </button>
              </div>
            </form>
          )}

          <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Product</th>
                  <th style={{ padding: '12px' }}>Price</th>
                  <th style={{ padding: '12px' }}>Current Stock</th>
                  <th style={{ padding: '12px' }}>Update Stock</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{p.name}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{p.category}</div>
                    </td>
                    <td style={{ padding: '12px' }}>₹{p.price}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: (p.countInStock ?? p.stock) <= 2 ? '#dc2626' : '#15803d' }}>
                        {p.countInStock ?? p.stock ?? 0} units
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="number"
                          placeholder={p.countInStock ?? p.stock ?? 0}
                          style={{ width: '70px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          onChange={(e) => setStockInputs({ ...stockInputs, [p._id]: e.target.value })}
                        />
                        <button
                          onClick={() => handleUpdateStock(p._id)}
                          style={{ padding: '6px 12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Save
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        style={{ padding: '6px 12px', background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}