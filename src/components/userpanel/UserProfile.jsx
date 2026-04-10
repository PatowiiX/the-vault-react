import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

const UserProfile = () => {
  const { currentUser, updateUserProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: currentUser?.nombre || currentUser?.username || '',
    email: currentUser?.email || '',
    avatar: null
  });
  const [previewAvatar, setPreviewAvatar] = useState(currentUser?.avatar || null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const getAvatarUrl = () => {
    if (previewAvatar) return previewAvatar;
    if (currentUser?.avatar) return currentUser.avatar;
    const name = encodeURIComponent(formData.nombre || currentUser?.nombre || currentUser?.username || 'User');
    return `https://ui-avatars.com/api/?background=00ff88&color=0a0a0f&bold=true&size=150&name=${name}`;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'danger', text: 'Solo se permiten imágenes' });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'danger', text: 'La imagen no debe superar los 5MB' });
        return;
      }
      
      setFormData({ ...formData, avatar: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    
    const result = await updateUserProfile(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: '✅ Perfil actualizado correctamente' });
      setEditing(false);
      if (result.user) {
        setFormData({
          nombre: result.user.nombre || result.user.username,
          email: result.user.email,
          avatar: null
        });
        setPreviewAvatar(result.user.avatar);
      }
    } else {
      setMessage({ type: 'danger', text: result.message || 'Error al actualizar perfil' });
    }
    
    setSaving(false);
  };

  if (!editing) {
    return (
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h3 className="text-white bungee-font mb-0">
            <i className="bi bi-person-circle me-2 text-success"></i>
            Mi Perfil
          </h3>
          <button 
            className="btn btn-neon-pink"
            onClick={() => setEditing(true)}
          >
            <i className="bi bi-pencil me-2"></i>
            Editar Perfil
          </button>
        </div>
        
        <div className="row">
          <div className="col-md-3 text-center mb-4">
            <div className="user-avatar-wrapper">
              <img 
                src={getAvatarUrl()}
                alt="Avatar" 
                className="user-avatar"
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00ff88' }}
              />
            </div>
          </div>
          <div className="col-md-9">
            <div className="mb-3">
              <label className="text-white-50 small text-uppercase mb-1">Nombre</label>
              <p className="text-white fs-4 fw-bold">{currentUser?.nombre || currentUser?.username}</p>
            </div>
            <div className="mb-3">
              <label className="text-white-50 small text-uppercase mb-1">Email</label>
              <p className="text-white fs-5">{currentUser?.email}</p>
            </div>
            <div className="mb-3">
              <label className="text-white-50 small text-uppercase mb-1">Miembro desde</label>
              <p className="text-white">
                {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="text-white bungee-font mb-0">
          <i className="bi bi-pencil-square me-2 text-warning"></i>
          Editar Perfil
        </h3>
        <button 
          className="btn btn-outline-light"
          onClick={() => {
            setEditing(false);
            setMessage(null);
          }}
        >
          Cancelar
        </button>
      </div>
      
      {message && (
        <div className={`alert alert-${message.type} mb-3`} style={{
          background: message.type === 'success' ? 'rgba(0,255,136,0.1)' : 'rgba(220,53,69,0.1)',
          border: `1px solid ${message.type === 'success' ? '#00ff88' : '#dc3545'}`,
          color: message.type === 'success' ? '#00ff88' : '#ff4444'
        }}>
          <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="text-center mb-4">
          <div className="avatar-upload">
            <img 
              src={getAvatarUrl()}
              alt="Avatar" 
              className="user-avatar"
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #00ff88' }}
            />
            <label className="avatar-upload-label">
              <i className="bi bi-camera-fill"></i>
              <input 
                type="file" 
                className="avatar-upload-input"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <small className="text-white-50 d-block mt-2">
            <i className="bi bi-info-circle me-1"></i>
            Haz clic en la cámara para cambiar tu foto (JPG, PNG, GIF - max 5MB)
          </small>
        </div>
        
        <div className="mb-3">
          <label className="form-label text-white">
            <i className="bi bi-person me-2 text-success"></i>
            Nombre
          </label>
          <input 
            type="text" 
            className="form-control bg-darker text-white"
            style={{ padding: '12px' }}
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="form-label text-white">
            <i className="bi bi-envelope me-2 text-success"></i>
            Email
          </label>
          <input 
            type="email" 
            className="form-control bg-darker text-white"
            style={{ padding: '12px' }}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-neon-pink w-100 py-3"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              GUARDANDO...
            </>
          ) : (
            <>
              <i className="bi bi-save me-2"></i>
              GUARDAR CAMBIOS
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;