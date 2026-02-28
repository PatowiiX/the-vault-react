// src/components/admin/OrdersPanel.jsx
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const OrdersPanel = () => {
  const { orders, fetchOrders, updateOrderStatus } = useApp();
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      await fetchOrders();
      setLoading(false);
    };
    loadOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
  };

  const getStatusBadge = (estado) => {
    const badges = {
      'pendiente': 'bg-warning',
      'pagado': 'bg-success',
      'enviado': 'bg-info',
      'entregado': 'bg-primary',
      'cancelado': 'bg-danger'
    };
    return badges[estado] || 'bg-secondary';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-pink" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
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
        >
          <i className="bi bi-arrow-clockwise me-2"></i>
          Actualizar
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-5 text-muted bg-glass-dark rounded">
          <i className="bi bi-inbox fs-1"></i>
          <p className="mt-3">No hay pedidos registrados todavía.</p>
          <p className="small">Los pedidos aparecerán aquí cuando los clientes realicen compras.</p>
        </div>
      ) : (
        <div className="table-responsive bg-glass-dark p-3 rounded shadow">
          <table className="table table-dark table-hover align-middle">
            <thead className="bg-dark">
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Productos</th>
                <th>Seguimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="badge bg-dark">#{order.id}</span>
                  </td>
                  <td>
                    <small>{formatDate(order.fecha)}</small>
                  </td>
                  <td>
                    <strong className="text-white">
                      {order.usuario_nombre || 'Visitante'}
                    </strong>
                    <br />
                    <small className="text-muted">{order.email || 'sin email'}</small>
                  </td>
                  <td className="text-info fw-bold">
                    ${order.total?.toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(order.estado)}`}>
                      {order.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-info"
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    >
                      <i className="bi bi-eye me-1"></i>
                      Ver items ({order.items?.length || 0})
                    </button>
                  </td>
                  <td>
                    <small className="text-muted">
                      {order.tracking_number || '—'}
                    </small>
                  </td>
                  <td>
                    <select 
                      className="form-select form-select-sm bg-dark text-white border-pink"
                      value={order.estado || 'pendiente'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      style={{ width: '130px' }}
                    >
                      <option value="pendiente">🟡 Pendiente</option>
                      <option value="pagado">🟢 Pagado</option>
                      <option value="enviado">🔵 Enviado</option>
                      <option value="entregado">🟣 Entregado</option>
                      <option value="cancelado">🔴 Cancelado</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal de detalles de items */}
          {selectedOrder && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content bg-dark text-white border-pink">
                  <div className="modal-header border-secondary">
                    <h5 className="modal-title">
                      <i className="bi bi-box-seam me-2 text-pink"></i>
                      Productos - Orden #{selectedOrder.id}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedOrder(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="table-responsive">
                      <table className="table table-dark table-sm">
                        <thead>
                          <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong>{item.titulo || item.title}</strong>
                                <br />
                                <small className="text-muted">{item.artista || item.artist}</small>
                              </td>
                              <td>{item.cantidad || item.quantity}</td>
                              <td>${(item.precio_unitario || item.price)?.toFixed(2)}</td>
                              <td>${((item.cantidad || item.quantity) * (item.precio_unitario || item.price)).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end"><strong>Subtotal:</strong></td>
                            <td>${selectedOrder.subtotal?.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end"><strong>Envío:</strong></td>
                            <td>${selectedOrder.shipping_cost?.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end"><strong>IVA:</strong></td>
                            <td>${selectedOrder.tax_amount?.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan="3" className="text-end"><strong>TOTAL:</strong></td>
                            <td className="text-info fw-bold">${selectedOrder.total?.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    
                    <div className="mt-3 p-3 bg-dark-light rounded">
                      <h6 className="text-pink mb-2">
                        <i className="bi bi-geo-alt me-2"></i>
                        Dirección de envío
                      </h6>
                      <p className="text-white mb-1">{selectedOrder.direccion_envio}</p>
                      <p className="text-muted small mb-0">
                        Método de pago: {selectedOrder.metodo_pago}
                      </p>
                    </div>
                  </div>
                  <div className="modal-footer border-secondary">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Cerrar
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