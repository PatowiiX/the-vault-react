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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
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

      {/* Filtros y búsqueda */}
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
          <p className="text-white mt-3">No hay pedidos registrados todavía.</p>
          <p className="text-white-50 small">Los pedidos aparecerán aquí cuando los clientes realicen compras.</p>
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
                <th>Seguimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <span className="badge bg-dark">#{order.id}</span>
                  </td>
                  <td>
                    <small className="text-white">{formatDate(order.fecha || order.created_at)}</small>
                  </td>
                  <td>
                    <strong className="text-white">
                      {order.usuario_nombre || 'Visitante'}
                    </strong>
                  </td>
                  <td>
                    <span className="text-white">{order.email || 'N/A'}</span>
                  </td>
                  <td className="text-info fw-bold">
                    {formatCurrency(order.total)}
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
                      Ver ({order.items?.length || 0})
                    </button>
                  </td>
                  <td>
                    <span className="text-white">{order.tracking_number || '—'}</span>
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

          {/* Modal de detalles de items - CORREGIDO */}
          {selectedOrder && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content bg-dark text-white border-pink">
                  <div className="modal-header border-secondary">
                    <h5 className="modal-title text-white">
                      <i className="bi bi-box-seam me-2 text-pink"></i>
                      DETALLES DEL PEDIDO #{selectedOrder.id}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white"
                      onClick={() => setSelectedOrder(null)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <p className="text-white mb-1"><strong>Cliente:</strong> {selectedOrder.usuario_nombre || 'N/A'}</p>
                        <p className="text-white mb-1"><strong>Email:</strong> {selectedOrder.email || 'N/A'}</p>
                        <p className="text-white mb-1"><strong>Fecha:</strong> {formatDate(selectedOrder.fecha || selectedOrder.created_at)}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="text-white mb-1"><strong>Total:</strong> {formatCurrency(selectedOrder.total)}</p>
                        <p className="text-white mb-1">
                          <strong>Estado:</strong> 
                          <span className={`badge ${getStatusBadge(selectedOrder.estado)} ms-2`}>
                            {selectedOrder.estado?.toUpperCase()}
                          </span>
                        </p>
                        <p className="text-white mb-1"><strong>Seguimiento:</strong> {selectedOrder.tracking_number || 'N/A'}</p>
                      </div>
                    </div>

                    <h6 className="text-pink mb-3">PRODUCTOS:</h6>
                    
                    {/* ✅ TABLA DE PRODUCTOS CORREGIDA */}
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-dark table-sm">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Artista</th>
                              <th>Cantidad</th>
                              <th>Precio Unit.</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item, idx) => {
                              // Asegurar que los datos existan
                              const titulo = item.titulo || item.title || 'Producto';
                              const artista = item.artista || item.artist || 'Artista';
                              const cantidad = item.cantidad || item.quantity || 1;
                              const precio = parseFloat(item.precio_unitario || item.price || 0);
                              const subtotal = precio * cantidad;
                              
                              return (
                                <tr key={idx}>
                                  <td className="text-white fw-bold">{titulo}</td>
                                  <td className="text-white">{artista}</td>
                                  <td className="text-white text-center">{cantidad}</td>
                                  <td className="text-info">{formatCurrency(precio)}</td>
                                  <td className="text-success fw-bold">{formatCurrency(subtotal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="4" className="text-end text-white"><strong>Subtotal:</strong></td>
                              <td className="text-white">{formatCurrency(selectedOrder.subtotal || 0)}</td>
                            </tr>
                            <tr>
                              <td colSpan="4" className="text-end text-white"><strong>Envío:</strong></td>
                              <td className="text-white">{formatCurrency(selectedOrder.shipping_cost || 0)}</td>
                            </tr>
                            <tr>
                              <td colSpan="4" className="text-end text-white"><strong>IVA:</strong></td>
                              <td className="text-white">{formatCurrency(selectedOrder.tax_amount || 0)}</td>
                            </tr>
                            <tr>
                              <td colSpan="4" className="text-end text-white"><strong>TOTAL:</strong></td>
                              <td className="text-info fw-bold fs-5">{formatCurrency(selectedOrder.total || 0)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        No hay productos en esta orden
                      </div>
                    )}
                    
                    {selectedOrder.direccion_envio && (
                      <div className="mt-3 p-3 bg-dark-light rounded">
                        <h6 className="text-pink mb-2">
                          <i className="bi bi-geo-alt me-2"></i>
                          Dirección de envío
                        </h6>
                        <p className="text-white mb-1">{selectedOrder.direccion_envio}</p>
                        <p className="text-white-50 small mb-0">
                          <span className="text-white">Método de pago:</span> {selectedOrder.metodo_pago || 'PayPal'}
                        </p>
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