import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const OrdersPanel = () => {
  const { orders, fetchOrders, updateOrderStatus, isAdmin } = useApp();
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      if (isAdmin) {
        await fetchOrders();
        setLoading(false);
      }
    };
    loadOrders();
  }, [fetchOrders, isAdmin]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    await fetchOrders();
  };

  const getStatusBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-warning text-dark',
      'pagado': 'bg-success',
      'enviado': 'bg-info',
      'entregado': 'bg-primary',
      'cancelado': 'bg-danger'
    };
    return badges[estado] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'MXN 0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  };

  // ✅ FUNCIÓN MEJORADA PARA NORMALIZAR LOS ITEMS
  const parseOrderItems = (order) => {
    if (!order) return [];
    
    // Si ya tiene items y es un array, usarlo
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items;
    }
    
    // Si orden_items existe, intentar parsearlo
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

  // Filtrar órdenes
  const filteredOrders = orders.filter(order => {
    if (filter !== 'todos' && order.estado !== filter) {
      return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.id?.toString().includes(term) ||
        order.usuario_nombre?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term) ||
        order.tracking_number?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-pink" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-white mt-3">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="orders-panel">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white">
          <i className="bi bi-truck me-2 text-pink"></i>
          GESTIÓN DE PEDIDOS
        </h3>
        <button 
          className="btn btn-sm btn-outline-pink"
          onClick={fetchOrders}
          title="Actualizar pedidos"
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="btn-group" role="group">
            <button 
              className={`btn btn-sm ${filter === 'todos' ? 'btn-pink' : 'btn-outline-pink'}`}
              onClick={() => setFilter('todos')}
            >
              Todos
            </button>
            <button 
              className={`btn btn-sm ${filter === 'pendiente' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilter('pendiente')}
            >
              Pendientes
            </button>
            <button 
              className={`btn btn-sm ${filter === 'pagado' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('pagado')}
            >
              Pagados
            </button>
            <button 
              className={`btn btn-sm ${filter === 'enviado' ? 'btn-info' : 'btn-outline-info'}`}
              onClick={() => setFilter('enviado')}
            >
              Enviados
            </button>
            <button 
              className={`btn btn-sm ${filter === 'entregado' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('entregado')}
            >
              Entregados
            </button>
            <button 
              className={`btn btn-sm ${filter === 'cancelado' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('cancelado')}
            >
              Cancelados
            </button>
          </div>
        </div>
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-dark text-white border-pink">
              <i className="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              className="form-control bg-dark text-white border-pink"
              placeholder="Buscar por ID, cliente, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-5 text-muted bg-glass-dark rounded">
          <i className="bi bi-inbox fs-1"></i>
          <p className="text-white mt-3">No hay pedidos registrados.</p>
        </div>
      ) : (
        <div className="table-responsive bg-glass-dark p-3 rounded shadow">
          <table className="table table-dark table-hover align-middle">
            <thead className="bg-dark">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Email</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Items</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const items = parseOrderItems(order);
                return (
                  <tr key={order.id}>
                    <td className="fw-bold">#{order.id}</td>
                    <td><small className="text-white-50">{formatDate(order.created_at)}</small></td>
                    <td><strong className="text-white">{order.usuario_nombre || 'Visitante'}</strong></td>
                    <td><span className="text-white-50">{order.email || 'N/A'}</span></td>
                    <td className="text-info fw-bold">{formatCurrency(order.total)}</td>
                    <td>
                      <select
                        className={`form-select form-select-sm ${getStatusBadge(order.estado)}`}
                        value={order.estado || 'pendiente'}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ width: '130px', fontSize: '0.8rem' }}
                      >
                        <option value="pendiente">⏳ Pendiente</option>
                        <option value="pagado">✅ Pagado</option>
                        <option value="enviado">📦 Enviado</option>
                        <option value="entregado">🎁 Entregado</option>
                        <option value="cancelado">❌ Cancelado</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-info"
                        onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order)}
                      >
                        <i className="bi bi-eye me-1"></i>
                        Ver ({items.length})
                      </button>
                    </td>
                    <td>
                      <span className="badge bg-dark">{order.tracking_number || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* MODAL DE DETALLES */}
          {selectedOrder && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1060 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content bg-dark text-white border-pink">
                  <div className="modal-header border-secondary">
                    <h5 className="modal-title text-white">
                      <i className="bi bi-receipt me-2 text-pink"></i>
                      DETALLES DEL PEDIDO #{selectedOrder.id}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedOrder(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    {/* Información del pedido */}
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Cliente:</strong> <span className="text-white-50">{selectedOrder.usuario_nombre || 'N/A'}</span></p>
                        <p className="mb-1"><strong>Email:</strong> <span className="text-white-50">{selectedOrder.email || 'N/A'}</span></p>
                        <p className="mb-1"><strong>Fecha:</strong> <span className="text-white-50">{formatDate(selectedOrder.created_at)}</span></p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1"><strong>Total:</strong> <span className="text-success fw-bold">{formatCurrency(selectedOrder.total)}</span></p>
                        <p className="mb-1"><strong>Tracking:</strong> <span className="text-info">{selectedOrder.tracking_number || 'N/A'}</span></p>
                        <p className="mb-1"><strong>Método de pago:</strong> <span className="text-white-50">{selectedOrder.metodo_pago || 'PayPal'}</span></p>
                      </div>
                    </div>

                    <h6 className="text-pink mb-3">PRODUCTOS</h6>
                    
                    {(() => {
                      const items = parseOrderItems(selectedOrder);
                      return items.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-dark table-sm">
                            <thead>
                              <tr className="text-white-50">
                                <th>Producto</th>
                                <th>Artista</th>
                                <th>Formato</th>
                                <th className="text-center">Cantidad</th>
                                <th className="text-end">Precio</th>
                                <th className="text-end">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, idx) => {
                                const titulo = item.titulo || item.title || 'Producto';
                                const artista = item.artista || item.artist || 'Artista';
                                const formato = item.formato || item.format || 'Vinyl';
                                const cantidad = item.cantidad || item.quantity || 1;
                                const precio = parseFloat(item.precio_unitario || item.precio || item.price || 0);
                                const subtotal = precio * cantidad;
                                
                                return (
                                  <tr key={idx}>
                                    <td className="text-white fw-bold">{titulo}</td>
                                    <td className="text-white-50">{artista}</td>
                                    <td><span className="badge bg-dark">{formato}</span></td>
                                    <td className="text-center text-white">{cantidad}</td>
                                    <td className="text-end text-info">{formatCurrency(precio)}</td>
                                    <td className="text-end text-success">{formatCurrency(subtotal)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="border-top">
                                <td colSpan="5" className="text-end text-white-50"><strong>Subtotal:</strong></td>
                                <td className="text-end text-white">{formatCurrency(selectedOrder.subtotal || 0)}</td>
                               </tr>
                              <tr>
                                <td colSpan="5" className="text-end text-white-50"><strong>Envío:</strong></td>
                                <td className="text-end text-white">{formatCurrency(selectedOrder.shipping_cost || 0)}</td>
                               </tr>
                              <tr>
                                <td colSpan="5" className="text-end text-white-50"><strong>IVA (16%):</strong></td>
                                <td className="text-end text-white">{formatCurrency(selectedOrder.tax_amount || 0)}</td>
                               </tr>
                              <tr className="border-top">
                                <td colSpan="5" className="text-end text-white fw-bold fs-5"><strong>TOTAL:</strong></td>
                                <td className="text-end text-success fw-bold fs-5">{formatCurrency(selectedOrder.total || 0)}</td>
                               </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="alert alert-warning">
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          No hay productos en esta orden.
                          <br />
                          <small className="text-white-50">
                            Datos crudos: {JSON.stringify(selectedOrder.orden_items)?.substring(0, 100)}...
                          </small>
                        </div>
                      );
                    })()}
                    
                    {selectedOrder.direccion_envio && (
                      <div className="mt-3 p-3 bg-dark-light rounded">
                        <h6 className="text-pink mb-2">
                          <i className="bi bi-geo-alt me-2"></i>
                          Dirección de envío
                        </h6>
                        <p className="text-white mb-1">{selectedOrder.direccion_envio}</p>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer border-secondary">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Cerrar
                    </button>
                    <button 
                      className="btn btn-pink"
                      onClick={() => window.print()}
                    >
                      <i className="bi bi-printer me-2"></i>
                      Imprimir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPanel;