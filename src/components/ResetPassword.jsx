import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [validToken, setValidToken] = useState(false);
  const [checking, setChecking] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    
    if (!urlToken) {
      setError('Token no proporcionado');
      setChecking(false);
      return;
    }

    setToken(urlToken);
    
    // Verificar que el token sea válido
    const verifyToken = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/password/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: urlToken })
        });

        const data = await response.json();

        if (data.ok) {
          setValidToken(true);
        } else {
          setError(data.error || 'Token inválido o expirado');
        }
      } catch (error) {
        setError('Error al verificar el token');
      } finally {
        setChecking(false);
      }
    };

    verifyToken();
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (data.ok) {
        setSuccess(true);
        // ✅ CAMBIADO: Redirige al HOME en lugar de /login
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(data.error || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="content-view fade-in">
        <div className="container text-center py-5">
          <div className="spinner-border text-pink" role="status">
            <span className="visually-hidden">Verificando...</span>
          </div>
          <p className="text-white mt-3">Verificando token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="auth-container p-4">
              <h2 className="text-white bungee-font text-center mb-4">
                <i className="bi bi-shield-lock me-2 text-pink"></i>
                RESTABLECER CONTRASEÑA
              </h2>

              {error && !success && (
                <div className="alert alert-danger mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {!validToken && !success ? (
                <div className="text-center py-4">
                  <i className="bi bi-exclamation-circle text-danger" style={{ fontSize: '3rem' }}></i>
                  <h4 className="text-white mt-3">Token inválido o expirado</h4>
                  <p className="text-white mb-4">
                    El enlace de recuperación ha expirado o no es válido.
                  </p>
                  <Link to="/forgot-password" className="btn btn-neon-pink">
                    Solicitar nuevo enlace
                  </Link>
                </div>
              ) : success ? (
                <div className="text-center py-4">
                  <div className="mb-4">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-white mb-3">¡Contraseña actualizada!</h4>
                  <p className="text-white mb-4">
                    Tu contraseña ha sido restablecida correctamente.
                  </p>
                  <p className="text-white-50 small">
                    Serás redirigido al inicio en 3 segundos...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <p className="text-white text-center mb-4">
                    Ingresa tu nueva contraseña.
                  </p>

                  <div className="mb-3">
                    <label className="form-label text-white">Nueva contraseña</label>
                    <input
                      type="password"
                      className="form-control bg-dark text-white border-pink"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength="6"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-white">Confirmar contraseña</label>
                    <input
                      type="password"
                      className="form-control bg-dark text-white border-pink"
                      placeholder="Repite tu contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn w-100 py-3 fw-bold"
                    disabled={loading}
                    style={{
                      background: loading 
                        ? 'linear-gradient(45deg, #666, #444)' 
                        : 'linear-gradient(45deg, #00ff88, #00cc66)',
                      border: 'none',
                      color: 'white'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        ACTUALIZANDO...
                      </>
                    ) : (
                      'RESTABLECER CONTRASEÑA'
                    )}
                  </button>
                </form>
              )}

              <div className="text-center mt-4">
                {/* ✅ CAMBIADO: Link al HOME en lugar de /login */}
                <Link to="/" className="text-pink text-decoration-none">
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;