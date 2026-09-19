import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_THEMES = {
  pending: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  processing: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
  shipped: { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' },
  delivered: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
};

const FALLBACK_IMAGE = 'https://via.placeholder.com/40?text=No+Img';

export default function AdminOrderManager({ orders = [], onOrdersUpdate }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
    try {
      setUpdatingId(orderId);
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}!`, { id: loadingToast });
      if (onOrdersUpdate) {
        onOrdersUpdate();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
      toast.error(err.response?.data?.message || 'Failed to update order status.', {
        id: loadingToast,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h3 style={styles.heading}>Customer Orders ({orders.length})</h3>
      </div>

      {orders.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '32px' }}>
          No customer orders available.
        </p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Items Purchased</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Total</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => {
                const orderId = ord._id || ord.id;
                const currentStatus = (ord.orderStatus || ord.status || 'pending').toLowerCase();
                const theme = STATUS_THEMES[currentStatus] || STATUS_THEMES.pending;

                return (
                  <tr key={orderId} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>#{String(orderId).slice(-6).toUpperCase()}</strong>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '600' }}>{ord.user?.name || 'Customer'}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {ord.user?.email || ord.shippingAddress?.phone || 'N/A'}
                      </div>
                    </td>

                    {/* Render Item Thumbnails and Names */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ord.orderItems?.map((it, idx) => {
                          const itemImg =
                            Array.isArray(it.images) && it.images.length > 0
                              ? it.images[0]
                              : it.image || FALLBACK_IMAGE;

                          return (
                            <div key={idx} style={styles.itemRow}>
                              <img
                                src={itemImg}
                                alt={it.name}
                                referrerPolicy="no-referrer"
                                style={styles.thumbImage}
                                onError={(e) => {
                                  e.target.src = FALLBACK_IMAGE;
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '600', fontSize: '12px', color: '#0f172a' }}>
                                  {it.name}
                                </span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                  Qty: {it.quantity} × Rs. {it.price}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>

                    <td style={styles.td}>
                      {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={styles.td}>
                      <strong>Rs. {ord.totalAmount || ord.totalPrice}</strong>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          backgroundColor: theme.bg,
                          color: theme.text,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        {currentStatus}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <select
                        value={currentStatus}
                        disabled={updatingId === orderId}
                        onChange={(e) => handleStatusChange(orderId, e.target.value)}
                        style={styles.select}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  headerRow: {
    marginBottom: '16px',
  },
  heading: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  thRow: {
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  th: {
    padding: '12px 14px',
    fontWeight: '600',
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px',
    color: '#1e293b',
    verticalAlign: 'middle',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  thumbImage: {
    width: '38px',
    height: '38px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    flexShrink: 0,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  select: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    color: '#0f172a',
    cursor: 'pointer',
  },
};