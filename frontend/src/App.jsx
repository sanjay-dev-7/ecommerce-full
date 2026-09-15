import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import './App.css';
import AdminDashboard from './components/AdminDashboard';

axios.defaults.withCredentials = true;

function App() {
  const [view, setView] = useState('shop'); // 'shop', 'orders', or 'admin'
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Persist lock across renders to eliminate race-condition execution
  const isVerifying = useRef(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodRes, orderRes, userRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/orders/myorders').catch(() => ({ data: [] })),
        axios.get('/api/users/profile').catch(() => ({ data: null })),
      ]);
      setProducts(prodRes.data);
      setOrders(orderRes.data);
      setUser(userRes.data);
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBuyNow = async (product) => {
    try {
      setStatusMessage('Creating order...');

      const orderPayload = {
        orderItems: [
          {
            product: product._id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image || 'https://via.placeholder.com/150',
          },
        ],
        shippingAddress: {
          street: '123 Tech Park',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          phone: '9876543210',
        },
        paymentMethod: 'Razorpay',
        totalAmount: Number(product.price),
        totalPrice: Number(product.price),
      };

      const { data: order } = await axios.post('/api/orders', orderPayload);

      setStatusMessage('Initializing payment gateway...');

      const { data: razorpayOrder } = await axios.post('/api/payments/create-razorpay-order', {
        orderId: order._id,
      });

      const options = {
        key: 'rzp_test_TZ4A4Gc6CNe03Y',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'My Store',
        description: `Payment for ${product.name}`,
        order_id: razorpayOrder.id,
        handler: async function (response) {
          if (isVerifying.current) return;
          isVerifying.current = true;

          try {
            setStatusMessage('Verifying payment...');

            await axios.post('/api/payments/verify', {
              orderId: order._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert('🎉 Payment Successful!');
            setStatusMessage('');
            await loadData();
            setView('orders');
          } catch (err) {
            console.error(err);
            alert('❌ Payment verification failed.');
            setStatusMessage('');
          } finally {
            isVerifying.current = false;
          }
        },
        prefill: {
          name: user?.name || 'Customer',
          email: user?.email || 'customer@example.com',
          contact: '9876543210',
        },
        theme: { color: '#0284c7' },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Order creation failure details:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Error creating order');
      setStatusMessage('');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading store...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>🛍️ Store App</h1>
        <nav style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setView('shop')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: view === 'shop' ? '#0284c7' : '#f8fafc',
              color: view === 'shop' ? '#fff' : '#334155',
              cursor: 'pointer',
            }}
          >
            Products
          </button>
          <button
            onClick={() => setView('orders')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: view === 'orders' ? '#0284c7' : '#f8fafc',
              color: view === 'orders' ? '#fff' : '#334155',
              cursor: 'pointer',
            }}
          >
            My Orders ({orders.length})
          </button>

          {user?.role === 'Admin' && (
            <button
              onClick={() => setView('admin')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: view === 'admin' ? '#0f172a' : '#2563eb',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              ⚙️ Admin Portal
            </button>
          )}
        </nav>
      </header>

      {statusMessage && (
        <div style={{ padding: '12px', background: '#e0f2fe', color: '#0369a1', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {statusMessage}
        </div>
      )}

      {/* 1. STORE VIEW */}
      {view === 'shop' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
          {products.map((item) => (
            <div
              key={item._id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 0.5rem 0' }}>{item.name}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>{item.description}</p>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>₹{item.price}</div>
                <div style={{ fontSize: '0.85rem', color: (item.countInStock ?? item.stock) > 0 ? '#16a34a' : '#dc2626' }}>
                  {(item.countInStock ?? item.stock) > 0 ? `${item.countInStock ?? item.stock} in stock` : 'Out of stock'}
                </div>
              </div>

              <button
                onClick={() => handleBuyNow(item)}
                disabled={(item.countInStock ?? item.stock) <= 0}
                style={{
                  marginTop: '1rem',
                  backgroundColor: (item.countInStock ?? item.stock) > 0 ? '#0284c7' : '#94a3b8',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: (item.countInStock ?? item.stock) > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                {(item.countInStock ?? item.stock) > 0 ? 'Buy Now' : 'Sold Out'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. CUSTOMER ORDERS VIEW */}
      {view === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.length === 0 ? (
            <p style={{ color: '#64748b' }}>No orders placed yet.</p>
          ) : (
            orders.map((ord) => (
              <div
                key={ord._id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1.2rem',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold' }}>Order #{ord._id.slice(-6).toUpperCase()}</span>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      backgroundColor: ord.orderStatus?.toLowerCase() === 'paid' ? '#dcfce7' : '#fef3c7',
                      color: ord.orderStatus?.toLowerCase() === 'paid' ? '#15803d' : '#b45309',
                    }}
                  >
                    {ord.orderStatus}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Placed on: {new Date(ord.createdAt).toLocaleDateString()}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#0f172a' }}>
                  Total: ₹{ord.totalAmount}
                </div>
                {(ord.razorpayPaymentId || ord.paymentResult?.id) && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                    Payment ID: {ord.razorpayPaymentId || ord.paymentResult?.id}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. ADMIN PORTAL VIEW */}
      {view === 'admin' && user?.role === 'Admin' && <AdminDashboard />}
    </div>
  );
}

export default App;