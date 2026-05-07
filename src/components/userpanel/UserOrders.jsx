import React, { useState } from 'react';

const UserOrders = ({ orders, reloadOrders }) => {
  // ✅ Usar un objeto para múltiples pedidos abiertos
  const [openOrders, setOpenOrders] = useState({});

  const toNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // ✅ FUNCIÓN PARA PARSEAR LOS ITEMS CORRECTAMENTE
  const parseOrderItems = (order) => {
    if (!order) return [];
    
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    
    if (order.orden_items) {
      try {
        if (typeof order.orden_items === 'string') {
          const parsed = JSON.parse(order.orden_items);
          return Array.isArray(parsed) ? parsed : [];
        }
        if (Array.isArray(order.orden_items)) {
          return order.orden_items;
        }
      } catch (e) {
        console.error('Error parseando orden_items:', e);
        return [];
      }
    }
    
    return [];
  };

  // ✅ TOGGLE PARA ABRIR/CERRAR UN PEDIDO ESPECÍFICO
  const toggleOrder = (orderId) => {
    setOpenOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
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
      
      <div className="orders-accordion">
        {orders.map(order => {
          const statusStyle = getStatusBadge(order.estado);
          const isOpen = openOrders[order.id];
          const items = isOpen ? parseOrderItems(order) : [];
          
          return (
            <div key={order.id} style={{
              marginBottom: '16px',
              background: '#0a0a1a',
              borderRadius: '12px',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              overflow: 'hidden'
            }}>
              {/* CABECERA DEL PEDIDO - SIEMPRE VISIBLE */}
              <div 
                onClick={() => toggleOrder(order.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  background: isOpen ? 'rgba(0, 255, 136, 0.05)' : 'transparent',
                  transition: 'all 0.3s ease',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 136, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    #{order.id}
                  </span>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                    ${toNumber(order.total).toFixed(2)}
                  </span>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    border: statusStyle.border
                  }}>
                    {getStatusText(order.estado)}
                  </span>
                  <span style={{ color: '#aaa', fontSize: '0.75rem' }}>
                    Tracking: {order.tracking_number || 'N/A'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>
                    {isOpen ? '▲ Cerrar' : '▼ Ver detalles'}
                  </span>
                  <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: '#00ff88' }}></i>
                </div>
              </div>
              
              {/* DETALLES DEL PEDIDO - SOLO SI ESTÁ ABIERTO */}
              {isOpen && (
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid rgba(0, 255, 136, 0.1)',
                  background: 'rgba(0, 0, 0, 0.3)'
                }}>
                  <h6 style={{ color: '#00ff88', marginBottom: '15px', fontSize: '0.9rem' }}>
                    <i className="bi bi-box-seam me-2"></i>
                    Productos del pedido
                  </h6>
                  
                  {items.length > 0 ? (
                    <div>
                      {items.map((item, idx) => {
                        const titulo = item.titulo || item.title || 'Producto';
                        const artista = item.artista || item.artist || 'Artista';
                        const formato = item.formato || item.format || 'Vinyl';
                        const cantidad = item.cantidad || item.quantity || 1;
                        const precio = toNumber(item.precio_unitario || item.precio || item.price || 0);
                        
                        return (
                          <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 0',
                            borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <strong style={{ color: '#ffffff' }}>{titulo}</strong>
                                <span style={{ color: '#888', fontSize: '0.7rem' }}>{artista}</span>
                                <span className="badge bg-dark" style={{ fontSize: '0.65rem' }}>{formato}</span>
                              </div>
                              <small style={{ color: '#888', fontSize: '0.7rem' }}>
                                Cantidad: {cantidad} x ${precio.toFixed(2)}
                              </small>
                            </div>
                            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>
                              ${(precio * cantidad).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ color: '#aaa' }}>No hay detalles disponibles</p>
                  )}
                  
                  <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '15px 0' }} />
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ color: '#ccc' }}>Subtotal:</span>
                      <span style={{ color: '#fff' }}>${toNumber(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', flexWrap: 'wrap', marginTop: '5px' }}>
                      <span style={{ color: '#ccc' }}>Envío:</span>
                      <span style={{ color: '#fff' }}>${toNumber(order.shipping_cost).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', flexWrap: 'wrap', marginTop: '5px' }}>
                      <span style={{ color: '#ccc' }}>IVA (16%):</span>
                      <span style={{ color: '#fff' }}>${toNumber(order.tax_amount).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', flexWrap: 'wrap', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '1.1rem' }}>TOTAL:</span>
                      <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '1.1rem' }}>
                        ${toNumber(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserOrders;