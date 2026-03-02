// src/components/admin/AdminPanel.js
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import OrdersPanel from './OrdersPanel';

const AdminPanel = () => {
  const { 
    adminProducts, 
    isAdmin, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    orders,
    fetchOrders,
    refreshProducts  // 👈 AGREGADO
  } = useApp();
  
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [imagePreview, setImagePreview] = useState('');
  
  const initialFormState = {
    title: '',
    artist: '',
    year: new Date().getFullYear(),
    genre: 'Rock',
    format: 'Vinyl',
    price: 29.99,
    stock: 10,
    description: '',
    featured: false,
    heritage: false,
    image: '',
  };

  const [newProduct, setNewProduct] = useState(initialFormState);

  useEffect(() => {
    if (activeTab === 'orders' && isAdmin) {
      fetchOrders();
    }
  }, [activeTab, isAdmin, fetchOrders]);

  const handleAddProduct = async () => {
    if (!newProduct.title || !newProduct.artist) {
      alert('Completa los campos obligatorios (Título y Artista)');
      return;
    }
    
    const productToSend = {
      ...newProduct,
      image: newProduct.image || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop'
    };
    
    const result = await addProduct(productToSend);
    
    if (result.success) {
      alert('Producto guardado en MySQL');
      await refreshProducts(); // 👈 FORZAR RECARGA
      setNewProduct(initialFormState);
      setImagePreview('');
      setShowAddForm(false);
    } else {
      alert('Error: ' + (result.message || 'No se pudo guardar'));
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct.title || !editingProduct.artist) {
      alert('Completa los campos obligatorios');
      return;
    }

    const result = await updateProduct(editingProduct.id, editingProduct);
    
    if (result.success) {
      alert('Cambios guardados en la base de datos');
      await refreshProducts(); // 👈 FORZAR RECARGA
      setEditingProduct(null);
    } else {
      alert('Error: ' + (result.message || 'No se pudo actualizar'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este disco?')) {
      const result = await deleteProduct(id);
      if (result.success) {
        alert('Producto eliminado');
        await refreshProducts(); // 👈 FORZAR RECARGA
      }
    }
  };

  const openEditModal = (product) => {
    const normalizedProduct = {
      id: product.id,
      title: product.title || product.titulo,
      artist: product.artist || product.artista,
      year: product.year || product.anio || new Date().getFullYear(),
      genre: product.genre || product.genero || 'Rock',
      format: product.format || product.formato || 'Vinyl',
      price: product.price || product.precio || 25.00,
      stock: product.stock || 10,
      description: product.description || product.descripcion || '',
      featured: product.featured || (product.top === 1),
      heritage: product.heritage || (product.heritage === 1),
      image: product.image || product.imagen_path || ''
    };
    setEditingProduct(normalizedProduct);
  };

  const handleImageChange = (e, isEditing = false) => {
    const url = e.target.value;
    if (isEditing) {
      setEditingProduct({...editingProduct, image: url});
    } else {
      setNewProduct({...newProduct, image: url});
      setImagePreview(url);
    }
  };

  if (!isAdmin) {
    return (
      <div className="content-view fade-in">
        <div className="container py-5 text-center">
          <i className="bi bi-shield-lock text-danger" style={{ fontSize: '4rem' }}></i>
          <h1 className="text-white mt-3">ACCESO DENEGADO</h1>
          <p className="text-white">Necesitas permisos de administrador.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-view fade-in">
      <div className="container-fluid px-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="text-white bungee-font">
            <i className="bi bi-shield-lock me-2 text-pink"></i>
            PANEL DE CONTROL: LA BÓVEDA
          </h2>
          {activeTab === 'products' && (
            <button 
              className="btn btn-add-album"
              onClick={() => setShowAddForm(true)}
              title="Agregar nuevo disco"
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          )}
        </div>

        {activeTab === 'products' && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card bg-dark border-secondary text-white p-3 admin-stats-card">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6>TOTAL DISCOS</h6>
                    <h3 className="text-pink">{adminProducts.length}</h3>
                  </div>
                  <i className="bi bi-vinyl fs-1"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-dark border-secondary text-white p-3 admin-stats-card">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6>DESTACADOS</h6>
                    <h3 className="text-info">
                      {adminProducts.filter(p => p.featured || p.top === 1).length}
                    </h3>
                  </div>
                  <i className="bi bi-star fs-1"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-dark border-secondary text-white p-3 admin-stats-card">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6>HERITAGE</h6>
                    <h3 className="text-gold">
                      {adminProducts.filter(p => p.heritage === 1).length}
                    </h3>
                  </div>
                  <i className="bi bi-gem fs-1"></i>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card bg-dark border-secondary text-white p-3 admin-stats-card">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6>BAJO STOCK</h6>
                    <h3 className="text-warning">
                      {adminProducts.filter(p => (p.stock || 0) < 5).length}
                    </h3>
                  </div>
                  <i className="bi bi-exclamation-triangle fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        )}

        <ul className="nav nav-tabs border-secondary mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'products' ? 'active bg-dark text-pink border-pink' : 'text-white'}`}
              onClick={() => setActiveTab('products')}
            >
              <i className="bi bi-box-seam me-2"></i>
              Inventario
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'orders' ? 'active bg-dark text-pink border-pink' : 'text-white'}`}
              onClick={() => setActiveTab('orders')}
            >
              <i className="bi bi-cart-check me-2"></i>
              Pedidos
              {orders.length > 0 && (
                <span className="badge bg-pink ms-2">{orders.length}</span>
              )}
            </button>
          </li>
        </ul>

        {activeTab === 'products' ? (
          <div className="table-responsive bg-glass-dark p-3 rounded shadow">
            <table className="table table-dark table-hover align-middle table-inventory">
              <thead className="bg-dark">
                <tr>
                  <th>ID</th>
                  <th>Imagen</th>
                  <th>Disco</th>
                  <th>Artista</th>
                  <th>Formato</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Destacado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {adminProducts.map(product => (
                  <tr key={product.id}>
                    <td><small className="text-white">#{product.id}</small></td>
                    <td>
                      <img 
                        src={product.image || product.imagen_path || 'https://via.placeholder.com/40'} 
                        alt={product.title || product.titulo} 
                        style={{width: '50px', height: '50px', objectFit: 'cover'}}
                        className="rounded"
                      />
                    </td>
                    <td>
                      <strong className="text-white">
                        {product.title || product.titulo}
                      </strong>
                      <br/>
                      <small className="text-white">
                        {product.year || product.anio} • {product.genre || product.genero}
                      </small>
                    </td>
                    <td className="text-light">{product.artist || product.artista}</td>
                    <td>
                      <span className={`badge ${
                        (product.format || product.formato) === 'Vinyl' ? 'badge-vinyl' : 
                        (product.format || product.formato) === 'CD' ? 'badge-cd' : 'badge-cassette'
                      }`}>
                        {product.format || product.formato}
                      </span>
                    </td>
                    <td className="text-info fw-bold">
                      ${parseFloat(product.price || product.precio || 0).toFixed(2)}
                    </td>
                    
                    {/* UN RETOQUE POR ACA*/}
                    <td>
                      <div className="d-flex align-items-center">
                        <span className={`badge rounded-pill ${
                          (product.stock || 0) === 0 ? 'bg-danger' :
                          (product.stock || 0) < 5 ? 'bg-warning text-dark' : 'bg-success'
                        }`} style={{ 
                          fontSize: '0.95rem', 
                          padding: '6px 12px',
                          minWidth: '40px',
                          fontWeight: '600'
                        }}>
                          {product.stock || 0}
                        </span>
                        {(product.stock || 0) === 0 && (
                          <span className="ms-2 text-danger small">
                            <i className="bi bi-exclamation-circle-fill me-1"></i>
                            Agotado
                          </span>
                        )}
                        {(product.stock || 0) > 0 && (product.stock || 0) < 5 && (
                          <span className="ms-2 text-warning small">
                            <i className="bi bi-exclamation-triangle-fill me-1"></i>
                            Bajo stock
                          </span>
                        )}
                        {(product.stock || 0) >= 5 && (
                          <span className="ms-2 text-success small">
                            <i className="bi bi-check-circle-fill me-1"></i>
                            Disponible
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td>
                      <div className="d-flex gap-1">
                        {(product.featured || product.top === 1) && (
                          <i className="bi bi-star-fill text-warning" title="Destacado"></i>
                        )}
                        {(product.heritage || product.heritage === 1) && (
                          <i className="bi bi-gem text-gold ms-1" title="Heritage"></i>
                        )}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-info me-2"
                        onClick={() => openEditModal(product)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(product.id)}
                        title="Eliminar"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {adminProducts.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1"></i>
                <p className="mt-3">No hay discos en la base de datos.</p>
                <button 
                  className="btn btn-neon-pink mt-2"
                  onClick={() => setShowAddForm(true)}
                >
                  Agregar el primero
                </button>
              </div>
            )}
          </div>
        ) : (
          <OrdersPanel />
        )}

        {editingProduct && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1050}}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content bg-dark border-pink text-white">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-pink">
                    <i className="bi bi-pencil-square me-2"></i>
                    EDITAR DISCO #{editingProduct.id}
                  </h5>
                  <button 
                    className="btn-close btn-close-white" 
                    onClick={() => setEditingProduct(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4 mb-3 text-center">
                      <img 
                        src={editingProduct.image || 'https://via.placeholder.com/200'} 
                        alt="Preview"
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                      />
                      <small className="text-muted d-block">Vista previa</small>
                    </div>
                    
                    <div className="col-md-8">
                      <div className="row">
                        <div className="col-md-12 mb-3">
                          <label className="form-label">URL de Imagen</label>
                          <input 
                            type="text" 
                            className="form-control bg-secondary text-white border-0"
                            value={editingProduct.image || ''}
                            onChange={(e) => handleImageChange(e, true)}
                            placeholder="https://..."
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Título del Álbum *</label>
                          <input 
                            type="text" 
                            className="form-control bg-secondary text-white border-0"
                            value={editingProduct.title || ''}
                            onChange={e => setEditingProduct({...editingProduct, title: e.target.value})}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Artista *</label>
                          <input 
                            type="text" 
                            className="form-control bg-secondary text-white border-0"
                            value={editingProduct.artist || ''}
                            onChange={e => setEditingProduct({...editingProduct, artist: e.target.value})}
                          />
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Año</label>
                          <input 
                            type="number" 
                            className="form-control bg-secondary text-white border-0"
                            value={editingProduct.year || ''}
                            onChange={e => setEditingProduct({...editingProduct, year: parseInt(e.target.value)})}
                          />
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Género</label>
                          <select 
                            className="form-select bg-secondary text-white border-0"
                            value={editingProduct.genre || 'Rock'}
                            onChange={e => setEditingProduct({...editingProduct, genre: e.target.value})}
                          >
                            <option value="Rock">Rock</option>
                            <option value="Pop">Pop</option>
                            <option value="Jazz">Jazz</option>
                            <option value="Hip Hop">Hip Hop</option>
                            <option value="Electronic">Electronic</option>
                            <option value="Classical">Classical</option>
                            <option value="Metal">Metal</option>
                            <option value="Indie">Indie</option>
                            <option value="New Wave">New Wave</option>
                            <option value="Acid Jazz">Acid Jazz</option>
                            <option value="Funk">Funk</option>
                            <option value="Alternative">Alternative</option>
                            <option value="Country">Country</option>
                          </select>
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Formato</label>
                          <select 
                            className="form-select bg-secondary text-white border-0"
                            value={editingProduct.format || 'Vinyl'}
                            onChange={e => setEditingProduct({...editingProduct, format: e.target.value})}
                          >
                            <option value="Vinyl">Vinilo</option>
                            <option value="CD">CD</option>
                            <option value="Cassette">Cassette</option>
                          </select>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Precio ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control bg-secondary text-white border-0"
                            value={editingProduct.price || 0}
                            onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Stock</label>
                          <input 
                            type="number" 
                            className="form-control bg-secondary text-white border-0"
                            value={editingProduct.stock || 0}
                            onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})}
                          />
                        </div>
                        
                        <div className="col-md-12 mb-3">
                          <label className="form-label">Descripción</label>
                          <textarea 
                            className="form-control bg-secondary text-white border-0"
                            rows="3"
                            value={editingProduct.description || ''}
                            onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                          ></textarea>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={editingProduct.featured || false}
                              onChange={e => setEditingProduct({...editingProduct, featured: e.target.checked})}
                            />
                            <label className="form-check-label">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              Destacado (Top 5)
                            </label>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={editingProduct.heritage || false}
                              onChange={e => setEditingProduct({...editingProduct, heritage: e.target.checked})}
                            />
                            <label className="form-check-label">
                              <i className="bi bi-gem text-gold me-1"></i>
                              Edición Heritage
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setEditingProduct(null)}
                  >
                    <i className="bi bi-x-lg me-2"></i>
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-save-changes" 
                    onClick={handleUpdateProduct}
                  >
                    <i className="bi bi-check-lg me-2"></i>
                    GUARDAR CAMBIOS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1050}}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content bg-dark border-success text-white">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-success">
                    <i className="bi bi-plus-circle me-2"></i>
                    AGREGAR A LA BÓVEDA
                  </h5>
                  <button 
                    className="btn-close btn-close-white" 
                    onClick={() => {
                      setShowAddForm(false);
                      setImagePreview('');
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-4 mb-3 text-center">
                      <img 
                        src={imagePreview || 'https://via.placeholder.com/200?text=Nuevo+Disco'} 
                        alt="Preview"
                        className="img-fluid rounded mb-2"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                      />
                      <small className="text-muted d-block">Vista previa</small>
                    </div>
                    
                    <div className="col-md-8">
                      <div className="row">
                        <div className="col-md-12 mb-3">
                          <label className="form-label">URL de Imagen</label>
                          <input 
                            type="text" 
                            className="form-control bg-secondary text-white border-0"
                            value={newProduct.image}
                            onChange={(e) => handleImageChange(e, false)}
                            placeholder="https://images.unsplash.com/..."
                          />
                          <small className="text-muted">Deja vacío para usar imagen por defecto</small>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Título del Álbum *</label>
                          <input 
                            type="text" 
                            className="form-control bg-secondary text-white border-0"
                            value={newProduct.title}
                            onChange={e => setNewProduct({...newProduct, title: e.target.value})}
                            placeholder="Ej: Dark Side of the Moon"
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Artista *</label>
                          <input 
                            type="text" 
                            className="form-control bg-secondary text-white border-0"
                            value={newProduct.artist}
                            onChange={e => setNewProduct({...newProduct, artist: e.target.value})}
                            placeholder="Ej: Pink Floyd"
                          />
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Año</label>
                          <input 
                            type="number" 
                            className="form-control bg-secondary text-white border-0"
                            value={newProduct.year}
                            onChange={e => setNewProduct({...newProduct, year: parseInt(e.target.value)})}
                          />
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Género</label>
                          <select 
                            className="form-select bg-secondary text-white border-0"
                            value={newProduct.genre}
                            onChange={e => setNewProduct({...newProduct, genre: e.target.value})}
                          >
                            <option value="Rock">Rock</option>
                            <option value="Pop">Pop</option>
                            <option value="Jazz">Jazz</option>
                            <option value="Hip Hop">Hip Hop</option>
                            <option value="Electronic">Electronic</option>
                            <option value="Classical">Classical</option>
                            <option value="Metal">Metal</option>
                            <option value="Indie">Indie</option>
                            <option value="New Wave">New Wave</option>
                            <option value="Acid Jazz">Acid Jazz</option>
                            <option value="Funk">Funk</option>
                            <option value="Alternative">Alternative</option>
                            <option value="Country">Country</option>
                          </select>
                        </div>
                        
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Formato</label>
                          <select 
                            className="form-select bg-secondary text-white border-0"
                            value={newProduct.format}
                            onChange={e => setNewProduct({...newProduct, format: e.target.value})}
                          >
                            <option value="Vinyl">Vinilo</option>
                            <option value="CD">CD</option>
                            <option value="Cassette">Cassette</option>
                          </select>
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Precio ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="form-control bg-secondary text-white border-0"
                            value={newProduct.price}
                            onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Stock</label>
                          <input 
                            type="number" 
                            className="form-control bg-secondary text-white border-0"
                            value={newProduct.stock}
                            onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                          />
                        </div>
                        
                        <div className="col-md-12 mb-3">
                          <label className="form-label">Descripción</label>
                          <textarea 
                            className="form-control bg-secondary text-white border-0"
                            rows="3"
                            value={newProduct.description}
                            onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                            placeholder="Descripción del álbum..."
                          ></textarea>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={newProduct.featured}
                              onChange={e => setNewProduct({...newProduct, featured: e.target.checked})}
                            />
                            <label className="form-check-label">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              Destacado (Top 5)
                            </label>
                          </div>
                        </div>
                        
                        <div className="col-md-6">
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="checkbox" 
                              checked={newProduct.heritage}
                              onChange={e => setNewProduct({...newProduct, heritage: e.target.checked})}
                            />
                            <label className="form-check-label">
                              <i className="bi bi-gem text-gold me-1"></i>
                              Edición Heritage
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-secondary">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowAddForm(false);
                      setNewProduct(initialFormState);
                      setImagePreview('');
                    }}
                  >
                    <i className="bi bi-x-lg me-2"></i>
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-success" 
                    onClick={handleAddProduct}
                  >
                    <i className="bi bi-check-lg me-2"></i>
                    CREAR EN BASE DE DATOS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;