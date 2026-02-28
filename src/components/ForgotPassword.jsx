import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('request'); // 'request', 'sent', 'reset'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.ok) {
        setStep('sent');
        setMessage('Te hemos enviado un correo con instrucciones para recuperar tu contraseña.');
      } else {
        setError(data.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-view fade-in">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="auth-container p-4">
              <h2 className="text-white bungee-font text-center mb-4">
                <i className="bi bi-key me-2 text-pink"></i>
                RECUPERAR CONTRASEÑA
              </h2>

              {step === 'request' && (
                <>
                  <p className="text-white text-center mb-4">
                    Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                  </p>

                  {error && (
                    <div className="alert alert-danger mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleRequestReset}>
                    <div className="mb-4">
                      <label className="form-label text-white">Correo electrónico</label>
                      <input
                        type="email"
                        className="form-control bg-dark text-white border-pink"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                          : 'linear-gradient(45deg, #ff00ff, #ff007f)',
                        border: 'none',
                        color: 'white'
                      }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          ENVIANDO...
                        </>
                      ) : (
                        'ENVIAR INSTRUCCIONES'
                      )}
                    </button>
                  </form>
                </>
              )}

              {step === 'sent' && (
                <div className="text-center py-4">
                  <div className="mb-4">
                    <i className="bi bi-envelope-check text-pink" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h4 className="text-white mb-3">¡Revisa tu correo!</h4>
                  <p className="text-white mb-4">{message}</p>
                  <p className="text-white-50 small mb-4">
                    ¿No recibiste el correo? Revisa tu carpeta de spam o 
                    <button 
                      className="btn btn-link text-pink p-0 ms-1"
                      onClick={() => setStep('request')}
                    >
                      intenta de nuevo
                    </button>
                  </p>
                </div>
              )}

              <div className="text-center mt-4">
                <Link to="/login" className="text-pink text-decoration-none">
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;