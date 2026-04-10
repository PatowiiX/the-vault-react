import React, { useState } from 'react';

const UserOrders = ({ orders, reloadOrders }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const toNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pagado': { bg: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' },
      'pendiente': { bg: 'rgba(255, 193, 7, 0.15)', color: '#ffc107', border: '1px solid rgba(255, 193, 7, 0.3)' },
      'enviado': { bg: 'rgba(0, 123, 255, 0.15)', color: '#007bff', border: '1px solid rgba(0, 123, 255, 0.3)' },
      'entregado': { bg: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', border: '1px solid rgba(0, 255, 136, 0.3)' },
      'cancelado': { bg: 'rgba(220, 53, 69, 0.15)', color: '#dc3545', border: '1px solid rgba(220, 53, 69, 0.3)' }
    };
    return statusMap[status] || statusMap['pendiente'];
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pagado': '✅ Pagado',
      'pendiente': '⏳ Pendiente',
      'enviado': '📦 Enviado',
      'entregado': '🎁 Entregado',
      'cancelado': '❌ Cancelado'
    };
    return statusMap[status] || status;
  };

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    return (
      <div>
        <h3 className="text-white bungee-font mb-4">Mis Pedidos</h3>
        <div className="text-center py-5">
          <i className="bi bi-receipt text-white-50" style={{ fontSize: '4rem' }}></i>
          <h4 className="text-white mt-3">No tienes pedidos aún</h4>
          <p className="text-white-50">Realiza tu primera compra para ver tus pedidos aquí</p>
          <a href="/" className="btn btn-neon-pink mt-3">IR A LA TIENDA</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-white bungee-font mb-4">Mis Pedidos</h3>
      
      <div className="table-responsive">
        <table style={{ 
          width: '100%', 
          background: '#0a0a1a',
          borderRadius: '12px',
          overflow: 'hidden',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{ 
              background: '#0f0f2a',
              borderBottom: '2px solid #00ff88'
            }}>
              <th style={{ color: '#00ff88', padding: '15px 12px', textAlign: 'left', fontFamily: 'Bungee, cursive', fontSize: '0.85rem' }}>ID Pedido</th>
              <th style={{ color: '#00ff88', padding: '15px 12px', textAlign: 'left', fontFamily: 'Bungee, cursive', fontSize: '0.85rem' }}>Fecha</th>
              <th style={{ color: '#00ff88', padding: '15px 12px', textAlign: 'left', fontFamily: 'Bungee, cursive', fontSize: '0.85rem' }}>Total</th>
              <th style={{ color: '#00ff88', padding: '15px 12px', textAlign: 'left', fontFamily: 'Bungee, cursive', fontSize: '0.85rem' }}>Estado</th>
              <th style={{ color: '#00ff88', padding: '15px 12px', textAlign: 'left', fontFamily: 'Bungee, cursive', fontSize: '0.85rem' }}>Tracking</th>
              <th style={{ color: '#00ff88', padding: '15px 12px', textAlign: 'center', fontFamily: 'Bungee, cursive', fontSize: '0.85rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const statusStyle = getStatusBadge(order.estado);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <td style={{ padding: '12px', color: '#ffffff', fontWeight: 'bold' }}>#{order.id}</td>
                  <td style={{ padding: '12px', color: '#cccccc' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                  <td style={{ padding: '12px', color: '#00ff88', fontWeight: 'bold' }}>
                    ${toNumber(order.total).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      border: statusStyle.border
                    }}>
                      {getStatusText(order.estado)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#aaaaaa' }}>{order.tracking_number || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button 
                      onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #00ff88',
                        color: '#00ff88',
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#00ff88';
                        e.target.style.color = '#0a0a1a';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.color = '#00ff88';
                      }}
                    >
                      {selectedOrder === order.id ? 'Ocultar' : 'Ver Detalles'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Detalles del pedido seleccionado */}
      {selectedOrder && (
        <div style={{
          marginTop: '24px',
          background: '#0a0a1a',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(0, 255, 136, 0.2)'
        }}>
          {(() => {
            const order = orders.find(o => o.id === selectedOrder);
            if (!order) return null;
            
            return (
              <>
                <h5 style={{ 
                  color: '#00ff88', 
                  marginBottom: '15px',
                  fontFamily: 'Bungee, cursive',
                  fontSize: '1rem'
                }}>
                  Detalles del Pedido #{order.id}
                </h5>
                <hr style={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '12px',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div>
                        <strong style={{ color: '#ffffff' }}>{item.title || item.titulo}</strong>
                        <br />
                        <span style={{ color: '#aaaaaa', fontSize: '0.85rem' }}>{item.artist || item.artista}</span>
                        <br />
                        <small style={{ color: '#888888', fontSize: '0.75rem' }}>
                          Cantidad: {item.quantity || item.cantidad || 1} x ${toNumber(item.price).toFixed(2)}
                        </small>
                      </div>
                      <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                        ${(toNumber(item.price) * (item.quantity || item.cantidad || 1)).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#aaaaaa' }}>No hay detalles disponibles</p>
                )}
                
                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />
                
                <div style={{ textAlign: 'right' }}>
                  <p style={{ marginBottom: '6px', color: '#cccccc' }}>
                    Subtotal: ${toNumber(order.subtotal).toFixed(2)}
                  </p>
                  <p style={{ marginBottom: '6px', color: '#cccccc' }}>
                    Envío: ${toNumber(order.shipping_cost).toFixed(2)}
                  </p>
                  <p style={{ marginBottom: '6px', color: '#cccccc' }}>
                    IVA: ${toNumber(order.tax_amount).toFixed(2)}
                  </p>
                  <p style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    color: '#00ff88',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    Total: ${toNumber(order.total).toFixed(2)}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default UserOrders;