import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

// ESTILOS
import './styles/custom.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

// COMPONENTES
import App from './App';
import { AppProvider } from './context/AppContext'; // ← ¡IMPORTA EL PROVIDER!

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider> {/* ← PRIMERO EL PROVIDER */}
      <Router>    {/* ← LUEGO EL ROUTER */}
        <App />   {/* ← FINALMENTE LA APP */}
      </Router>
    </AppProvider>
  </React.StrictMode>
);