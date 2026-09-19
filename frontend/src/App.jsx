import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

// Components
import Navbar from './components/NavBar';
import ProductFilterBar from './components/productFilterBar';
import ProductCard from './components/ProductCard';
import CheckoutModal from './components/CheckoutModal';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import ConfirmModal from './components/ConfirmModal';
import Footer from './components/Footer';

// Backend Base URL and Credentials
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'https://storeblocks-api.onrender.com';
axios.defaults.withCredentials = true;

// Axios Request Interceptor: Attach Authorization Bearer token as a reliable fallback
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('storeblocks_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default function App() {
  const [view, setView] = useState('shop'); // 'shop', 'orders', 'admin'
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('storeblocks_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Cancellation Modal State
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Search & Filter Engine State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState(10000);
  const [sortBy, setSortBy] = useState('featured');

  // Modals & Drawers
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showCookieNotice, setShowCookieNotice] = useState(() => {
    return !localStorage.getItem('cookies_accepted');
  });

  // Shopping Cart
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('storeblocks_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const isVerifyingRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('storeblocks_cart', JSON.stringify(cart));
  }, [cart]);

  // Load Initial API Data
  const loadStoreData = async () => {
    try {
      setLoading(true);
      const [prodRes, orderRes, userRes] = await Promise.all([
        axios.get('/api/products').catch(() => ({ data: [] })),
        axios.get('/api/orders/myorders').catch(() => ({ data: [] })),
        axios.get('/api/users/profile').catch(() => ({ data: null })),
      ]);
      setProducts(prodRes.data || []);
      setOrders(orderRes.data || []);
      if (userRes.data) {
        setUser(userRes.data);
        localStorage.setItem('storeblocks_user', JSON.stringify(userRes.data));
      }

      if (prodRes.data && prodRes.data.length > 0) {
        const highestPrice = Math.max(...prodRes.data.map((p) => p.price || 0));
        setPriceRange(highestPrice > 0 ? highestPrice : 10000);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      toast.error('Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout').catch(() => {});
    } finally {
      setUser(null);
      setOrders([]);
      setCart([]);
      localStorage.removeItem('storeblocks_cart');
      localStorage.removeItem('storeblocks_token');
      localStorage.removeItem('storeblocks_user');
      setView('shop');
      toast.success('Logged out successfully');
    }
  };

  // Cart Operations (Stock Guarded & 10 Unit Capped)
  const addToCart = (product, quantity = 1) => {
    const availableStock = product.countInStock ?? product.stock ?? 0;
    const maxLimit = Math.min(10, availableStock);

    setCart((prev) => {
      const existing = prev.find((item) => (item._id || item.id) === (product._id || product.id));
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      if (targetQty > maxLimit) {
        toast.error(`Cannot add more than ${maxLimit} units of this product.`);
        return prev;
      }

      toast.success(`${product.name} added to cart!`);

      if (existing) {
        return prev.map((item) =>
          (item._id || item.id) === (product._id || product.id)
            ? { ...item, quantity: targetQty }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });

    setIsCheckoutOpen(true);
  };

  // Remove single item from shopping cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => (item._id || item.id) !== productId));
    toast.success('Item removed from cart');
  };

  // Razorpay Checkout Execution
  const handlePlaceOrder = async ({ shippingAddress, totalAmount }) => {
    if (!user) {
      setIsCheckoutOpen(false);
      setIsAuthOpen(true);
      toast('Please login to complete your order', { icon: '🔒' });
      return;
    }

    try {
      setVerifyingPayment(true);

      const orderPayload = {
        orderItems: cart.map((item) => ({
          product: item._id || item.id,
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image,
        })),
        shippingAddress,
        paymentMethod: 'Razorpay',
        totalAmount,
        totalPrice: totalAmount,
      };

      const { data: createdOrder } = await axios.post('/api/orders', orderPayload);
      const targetOrderId = createdOrder._id || createdOrder.id;

      const { data: razorpayOrder } = await axios.post('/api/payments/create-razorpay-order', {
        orderId: targetOrderId,
      });

      const options = {
        key: import.meta.env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TZ4A4Gc6CNe03Y',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'StoreBlocks',
        description: `Order #${String(targetOrderId).slice(-6).toUpperCase()}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          if (isVerifyingRef.current) return;
          isVerifyingRef.current = true;

          const verifyToast = toast.loading('Verifying payment signature...');

          try {
            await axios.post('/api/payments/verify', {
              orderId: targetOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Order placed and payment verified successfully!', { id: verifyToast });
            setCart([]);
            setIsCheckoutOpen(false);
            await loadStoreData();
            setView('orders');
          } catch (err) {
            console.error('Verification failed:', err);
            toast.error(err.response?.data?.message || 'Payment verification failed.', { id: verifyToast });
          } finally {
            isVerifyingRef.current = false;
            setVerifyingPayment(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: shippingAddress.phone || '9876543210',
        },
        theme: { color: '#0284c7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.message || 'Error processing transaction.');
      setVerifyingPayment(false);
    }
  };

  // Delete / Cancel Pending Order Execution
  const executeOrderCancel = async () => {
    if (!orderToCancel) return;

    try {
      await axios.delete(`/api/orders/${orderToCancel}`);
      setOrders((prev) => prev.filter((o) => (o._id || o.id) !== orderToCancel));
      toast.success('Order cancelled and removed successfully.');
    } catch (err) {
      console.error('Failed to remove order:', err);
      toast.error(err.response?.data?.message || 'Could not remove order.');
    } finally {
      setOrderToCancel(null);
    }
  };

  // Pay Now for an Existing Pending Order
  const handlePayNow = async (order) => {
    const targetOrderId = order._id || order.id;

    if (!targetOrderId) {
      toast.error('Order ID is missing.');
      return;
    }

    try {
      setVerifyingPayment(true);

      const { data: razorpayOrder } = await axios.post('/api/payments/create-razorpay-order', {
        orderId: targetOrderId,
      });

      const options = {
        key: import.meta.env?.VITE_RAZORPAY_KEY_ID || 'rzp_test_TZ4A4Gc6CNe03Y',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'StoreBlocks',
        description: `Order #${String(targetOrderId).slice(-6).toUpperCase()}`,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          if (isVerifyingRef.current) return;
          isVerifyingRef.current = true;

          const verifyToast = toast.loading('Verifying payment...');

          try {
            await axios.post('/api/payments/verify', {
              orderId: targetOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success('Payment verified successfully!', { id: verifyToast });
            await loadStoreData();
          } catch (err) {
            console.error('Verification failed:', err);
            toast.error(err.response?.data?.message || 'Payment verification failed.', { id: verifyToast });
          } finally {
            isVerifyingRef.current = false;
            setVerifyingPayment(false);
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: order.shippingAddress?.phone || '9876543210',
        },
        theme: { color: '#0284c7' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment checkout error:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize payment.');
      setVerifyingPayment(false);
    }
  };

  // Category and Product Filter Calculation
  const categories = useMemo(() => {
    return ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  const maxProductPrice = useMemo(() => {
    return products.length > 0 ? Math.max(...products.map((p) => p.price || 0)) : 10000;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = p.price <= priceRange;
        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  return (
    <div className="app-wrapper">
      <Navbar
        cartCount={cart.reduce((a, c) => a + c.quantity, 0)}
        user={user}
        onOpenCart={() => setIsCheckoutOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        currentView={view}
        onNavigate={setView}
        categories={categories.filter((c) => c !== 'All')}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="main-content">
        {/* Loading Spinner */}
        {(loading || verifyingPayment) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
            <div className="three-body">
              <div className="three-body__dot"></div>
              <div className="three-body__dot"></div>
              <div className="three-body__dot"></div>
            </div>
            <p style={{ marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
              {verifyingPayment ? 'Verifying signature and updating inventory...' : 'Loading catalog...'}
            </p>
          </div>
        )}

        {/* 1. SHOP CATALOG VIEW */}
        {!loading && view === 'shop' && (
          <>
            <ProductFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
              priceRange={priceRange}
              maxProductPrice={maxProductPrice}
              onPriceChange={setPriceRange}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {filteredProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                No products match the selected criteria.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id || product.id}
                    product={product}
                    onAddToCart={addToCart}
                    onBuyNow={(p, qty) => {
                      setCart([{ ...p, quantity: qty }]);
                      setIsCheckoutOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 2. CUSTOMER ORDERS VIEW */}
        {!loading && view === 'orders' && (
          <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: '0 0 12px 0', color: '#0f172a' }}>Order History</h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                No orders recorded for this account.
              </div>
            ) : (
              orders.map((ord) => {
                const orderId = ord._id || ord.id || '';
                const status = (ord.orderStatus || ord.status || 'pending').toLowerCase();
                const isPending = status === 'pending';

                return (
                  <div key={orderId} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontWeight: '700', fontSize: '18px', color: '#0f172a' }}>
                        #{String(orderId).slice(-6).toUpperCase()}
                      </span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                        backgroundColor: status === 'paid' || status === 'delivered' ? '#dcfce7' : '#fef3c7',
                        color: status === 'paid' || status === 'delivered' ? '#166534' : '#854d0e',
                      }}>
                        {ord.orderStatus || ord.status || 'pending'}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                      Date: {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                    </div>

                    {/* Order Item Thumbnails & Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {ord.orderItems?.map((it, idx) => {
                        const itemImg =
                          Array.isArray(it.images) && it.images.length > 0
                            ? it.images[0]
                            : it.image || 'https://via.placeholder.com/40';

                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={itemImg}
                              alt={it.name}
                              referrerPolicy="no-referrer"
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                            />
                            <div style={{ fontSize: '14px', color: '#334155' }}>
                              <span style={{ fontWeight: '600' }}>{it.name}</span> — Qty: {it.quantity} (Rs. {it.price})
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#0f172a' }}>
                        Total: Rs. {ord.totalAmount || ord.totalPrice}
                      </span>

                      {/* Action buttons for pending orders */}
                      {isPending && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setOrderToCancel(orderId)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fecaca',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Remove Order
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePayNow(ord)}
                            style={{
                              padding: '6px 16px',
                              backgroundColor: '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                          >
                            Pay Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 3. ADMIN VIEW (Strictly guarded) */}
        {!loading && view === 'admin' && (
          user?.role?.toLowerCase() === 'admin' ? (
            <AdminDashboard />
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
              <h2 style={{ color: '#0f172a', marginBottom: '8px' }}>Access Denied</h2>
              <p>You do not have administrative privileges to view this section.</p>
              <button
                type="button"
                onClick={() => setView('shop')}
                style={{
                  marginTop: '16px',
                  padding: '8px 16px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Return to Shop
              </button>
            </div>
          )
        )}
      </main>

      <Footer />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        user={user}
        onPlaceOrder={handlePlaceOrder}
        isProcessing={verifyingPayment}
        onRemoveItem={removeFromCart}
      />

      {/* Shadcn Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => {
          if (u.token) {
            localStorage.setItem('storeblocks_token', u.token);
          }
          localStorage.setItem('storeblocks_user', JSON.stringify(u));
          setUser(u);
          setIsAuthOpen(false);
          loadStoreData();
          toast.success(`Welcome back, ${u.name || 'Shopper'}!`);
        }}
      />

      {/* Custom Order Cancellation Modal */}
      <ConfirmModal
        isOpen={Boolean(orderToCancel)}
        title="Cancel & Remove Order"
        message="Are you sure you want to cancel and remove this pending order? This action cannot be reversed."
        confirmText="Cancel Order"
        isDanger={true}
        onConfirm={executeOrderCancel}
        onCancel={() => setOrderToCancel(null)}
      />

      {/* Cookie Consent Notice */}
      {showCookieNotice && (
        <div className="cookie-card">
          <svg className="cookie-svg" viewBox="0 0 122.88 122.25">
            <g>
              <path d="M101.77,49.38c2.09,3.1,4.37,5.11,6.86,5.78c2.45,0.66,5.32,0.06,8.7-2.01c1.36-0.84,3.14-0.41,3.97,0.95 c0.28,0.46,0.42,0.96,0.43,1.47c0.13,1.4,0.21,2.82,0.24,4.26c0.03,1.46,0.02,2.91-0.05,4.35h0v0c0,0.13-0.01,0.26-0.03,0.38 c-0.91,16.72-8.47,31.51-20,41.93c-11.55,10.44-27.06,16.49-43.82,15.69v0.01h0c-0.13,0-0.26-0.01-0.38-0.03 c-16.72-0.91-31.51-8.47-41.93-20C5.31,90.61-0.73,75.1,0.07,58.34H0.07v0c0-0.13,0.01-0.26,0.03-0.38 C1,41.22,8.81,26.35,20.57,15.87C32.34,5.37,48.09-0.73,64.85,0.07V0.07h0c1.6,0,2.89,1.29,2.89,2.89c0,0.4-0.08,0.78-0.23,1.12 c-1.17,3.81-1.25,7.34-0.27,10.14c0.89,2.54,2.7,4.51,5.41,5.52c1.44,0.54,2.2,2.1,1.74,3.55l0.01,0 c-1.83,5.89-1.87,11.08-0.52,15.26c0.82,2.53,2.14,4.69,3.88,6.4c1.74,1.72,3.9,3,6.39,3.78c4.04,1.26,8.94,1.18,14.31-0.55 C99.73,47.78,101.08,48.3,101.77,49.38L101.77,49.38z" />
            </g>
          </svg>
          <p className="cookie-heading">We use cookies.</p>
          <p className="cookie-desc">
            This website uses cookies to maintain session states and authentication.
          </p>
          <div className="cookie-actions">
            <button
              type="button"
              className="cookie-btn-allow"
              onClick={() => {
                localStorage.setItem('cookies_accepted', 'true');
                setShowCookieNotice(false);
              }}
            >
              Allow
            </button>
            <button
              type="button"
              className="cookie-btn-decline"
              onClick={() => setShowCookieNotice(false)}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#f8fafc',
            fontSize: '13px',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a',
            },
          },
        }}
      />
    </div>
  );
}