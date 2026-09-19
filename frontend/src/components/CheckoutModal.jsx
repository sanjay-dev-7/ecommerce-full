import React, { useState } from 'react';

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  user,
  onPlaceOrder,
  isProcessing,
  onRemoveItem,
}) {
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: user?.email || '',
  });

  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  if (!isOpen || cart.length === 0) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = subtotal > 1500 ? 0 : 50;
  const total = Math.max(0, subtotal + shippingCost - discount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'SAVE50') {
      setDiscount(50);
    } else {
      alert('Invalid coupon code. Try "SAVE50".');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.phone) {
      alert('Please fill in your delivery address and contact phone number.');
      return;
    }
    onPlaceOrder({
      shippingAddress: {
        street: shippingAddress.address,
        city: shippingAddress.city,
        pincode: shippingAddress.postalCode || '600001',
        phone: shippingAddress.phone,
        state: 'Tamil Nadu',
      },
      totalAmount: total,
    });
  };

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Checkout & Order Review</h2>
          <button type="button" onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.grid}>
          {/* Left Column: Cart Summary */}
          <div style={styles.leftCol}>
            <p style={styles.cartCountText}>
              You have {cart.reduce((a, c) => a + c.quantity, 0)} items in your cart.
            </p>
            <div style={styles.itemList}>
              {cart.map((item) => {
                const itemId = item._id || item.id;
                return (
                  <div key={itemId} style={styles.itemRow}>
                    <img
                      src={Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : (item.image || 'https://via.placeholder.com/80')}
                      alt={item.name}
                      style={styles.itemThumb}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={styles.itemName}>{item.name}</div>
                      <div style={styles.itemMeta}>Quantity: {item.quantity}</div>
                    </div>
                    <div style={styles.itemPrice}>Rs. {item.price * item.quantity}</div>
                    {onRemoveItem && (
                      <button
                        type="button"
                        onClick={() => onRemoveItem(itemId)}
                        style={styles.removeBtn}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={styles.calculationBlock}>
              <div style={styles.calcRow}>
                <span>Subtotal</span>
                <span>Rs. {subtotal}</span>
              </div>
              <div style={styles.calcRow}>
                <span>Shipping Cost</span>
                <span>{shippingCost === 0 ? 'FREE' : `Rs. ${shippingCost}`}</span>
              </div>
              {discount > 0 && (
                <div style={{ ...styles.calcRow, color: '#16a34a' }}>
                  <span>Discount</span>
                  <span>- Rs. {discount}</span>
                </div>
              )}
              <div style={styles.totalRow}>
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
            </div>

            <form onSubmit={handleApplyCoupon} style={styles.couponBlock}>
              <p style={styles.couponLabel}>Coupon Code</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter code (e.g. SAVE50)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  style={styles.couponInput}
                />
                <button type="submit" style={styles.couponBtn}>Apply</button>
              </div>
            </form>
          </div>

          {/* Right Column: Customer & Delivery Info */}
          <div style={styles.rightCol}>
            <form onSubmit={handleSubmit} style={styles.shippingForm}>
              <h3 style={styles.sectionHeader}>Contact Information</h3>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>First Name</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.firstName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, firstName: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress.lastName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, lastName: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div>
                <label style={styles.inputLabel}>Delivery Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street name, apartment, building"
                  value={shippingAddress.address}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="600001"
                    value={shippingAddress.postalCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>City</label>
                  <input
                    type="text"
                    required
                    placeholder="Chennai"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.inputLabel}>Email</label>
                  <input
                    type="email"
                    required
                    value={shippingAddress.email}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                style={styles.placeOrderBtn}
              >
                {isProcessing ? 'Processing...' : 'Place Order & Pay with Razorpay'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '960px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '28px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cartCountText: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px',
  },
  itemThumb: {
    width: '50px',
    height: '50px',
    objectFit: 'contain',
    borderRadius: '6px',
    backgroundColor: '#f8fafc',
  },
  itemName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0f172a',
  },
  itemMeta: {
    fontSize: '12px',
    color: '#64748b',
  },
  itemPrice: {
    fontSize: '13px',
    fontWeight: '700',
  },
  removeBtn: {
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '4px',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: '700',
    marginLeft: '6px',
    flexShrink: 0,
  },
  calculationBlock: {
    backgroundColor: '#f8fafc',
    padding: '14px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#475569',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: '700',
    color: '#0f172a',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '8px',
  },
  couponBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  couponLabel: {
    fontSize: '12px',
    fontWeight: '600',
    margin: 0,
    color: '#475569',
  },
  couponInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
  },
  couponBtn: {
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  shippingForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionHeader: {
    fontSize: '14px',
    fontWeight: '700',
    margin: '0 0 4px 0',
    color: '#0f172a',
  },
  formRow: {
    display: 'flex',
    gap: '12px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    boxSizing: 'border-box',
  },
  placeOrderBtn: {
    marginTop: '12px',
    padding: '14px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
};