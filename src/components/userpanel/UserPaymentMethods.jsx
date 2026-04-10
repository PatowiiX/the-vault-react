import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const UserPaymentMethods = ({ methods, reloadMethods }) => {
  const { addPaymentMethod, deletePaymentMethod } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: 'credit',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [adding, setAdding] = useState(false);

  const getCardIcon = (type) => {
    switch(type) {
      case 'visa': return 'bi bi-credit-card-2-front';
      case 'mastercard': return 'bi bi-credit-card';
      case 'paypal': return 'bi bi-paypal';
      default: return 'bi bi-credit-card';
    }
  };

  const formatCardNumber = (number) => {
    if (!number) return '';
    const last4 = number.slice(-4);
    return `**** **** **** ${last4}`;
  };

  const handleAddPaymentMethod = async (e) => {
    e.preventDefault();
    setAdding(true);
    
    const result = await addPaymentMethod(newMethod);
    
    if (result.success) {
      setShowAddForm(false);
      setNewMethod({
        type: 'credit',
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: ''
      });
      reloadMethods();
    }
    
    setAdding(false);
  };

  const handleDelete = async (methodId) => {
    if (window.confirm('¿Eliminar este método de pago?')) {
      await deletePaymentMethod(methodId);
      reloadMethods();
    }
  };

  if (methods.length === 0 && !showAddForm) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-white bungee-font mb-0">Métodos de Pago</h3>
          <button 
            className="btn btn-neon-pink"
            onClick={() => setShowAddForm(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Agregar Método
          </button>
        </div>
        
        <div className="text-center py-5">
          <i className="bi bi-credit-card text-white-50" style={{ fontSize: '4rem' }}></i>
          <h4 className="text-white mt-3">No hay métodos de pago guardados</h4>
          <p className="text-white-50">Agrega una tarjeta para pagos más rápidos</p>
          <button 
            className="btn btn-add-payment mt-3"
            onClick={() => setShowAddForm(true)}
          >
            AGREGAR MÉTODO DE PAGO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white bungee-font mb-0">Métodos de Pago</h3>
        {!showAddForm && (
          <button 
            className="btn btn-neon-pink"
            onClick={() => setShowAddForm(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Agregar Nuevo
          </button>
        )}
      </div>
      
      {showAddForm ? (
        <div className="payment-method-form p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '15px' }}>
          <h5 className="text-white mb-3">Agregar Nueva Tarjeta</h5>
          <form onSubmit={handleAddPaymentMethod}>
            <div className="mb-3">
              <label className="form-label text-white">Tipo de Tarjeta</label>
              <select 
                className="form-select bg-darker text-white"
                value={newMethod.type}
                onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
              </select>
            </div>
            
            <div className="mb-3">
              <label className="form-label text-white">Número de Tarjeta</label>
              <input 
                type="text" 
                className="form-control bg-darker text-white"
                placeholder="**** **** **** ****"
                value={newMethod.cardNumber}
                onChange={(e) => setNewMethod({ ...newMethod, cardNumber: e.target.value })}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label text-white">Titular de la Tarjeta</label>
              <input 
                type="text" 
                className="form-control bg-darker text-white"
                placeholder="Nombre como aparece en la tarjeta"
                value={newMethod.cardHolder}
                onChange={(e) => setNewMethod({ ...newMethod, cardHolder: e.target.value })}
                required
              />
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <label className="form-label text-white">Fecha Expiración</label>
                <input 
                  type="text" 
                  className="form-control bg-darker text-white"
                  placeholder="MM/YY"
                  value={newMethod.expiryDate}
                  onChange={(e) => setNewMethod({ ...newMethod, expiryDate: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <label className="form-label text-white">CVV</label>
                <input 
                  type="text" 
                  className="form-control bg-darker text-white"
                  placeholder="123"
                  value={newMethod.cvv}
                  onChange={(e) => setNewMethod({ ...newMethod, cvv: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="mt-4 d-flex gap-3">
              <button 
                type="submit" 
                className="btn btn-add-payment"
                disabled={adding}
              >
                {adding ? 'GUARDANDO...' : 'GUARDAR TARJETA'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline-light"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          {methods.map((method, idx) => (
            <div key={idx} className="payment-method-card">
              <div className="d-flex align-items-center">
                <i className={`${getCardIcon(method.type)} payment-method-icon`}></i>
                <div className="payment-method-info">
                  <h6>{method.type === 'paypal' ? 'PayPal' : `${method.type.toUpperCase()} terminada en ${method.last4}`}</h6>
                  <p>{method.cardHolder}</p>
                </div>
              </div>
              <button 
                className="btn-delete-payment"
                onClick={() => handleDelete(method.id)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserPaymentMethods;