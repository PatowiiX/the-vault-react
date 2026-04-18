import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => ({
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ element }) => element,
  Navigate: () => <div>Redirect</div>,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '', state: null }),
  useParams: () => ({})
}));

jest.mock('./context/AppContext', () => ({
  useApp: () => ({
    isLoggedIn: false,
    isAdmin: false,
    loading: false
  })
}));

jest.mock('./components/Header', () => () => <div>RETROSOUND</div>);
jest.mock('./pages/Home', () => () => <div>HOME PAGE</div>);
jest.mock('./pages/Boveda', () => () => <div>BOVEDA PAGE</div>);
jest.mock('./pages/Heritage', () => () => <div>HERITAGE PAGE</div>);
jest.mock('./pages/Formatos', () => () => <div>FORMATOS PAGE</div>);
jest.mock('./pages/AlbumDetails', () => () => <div>ALBUM PAGE</div>);
jest.mock('./pages/MiCuenta', () => () => <div>MI CUENTA PAGE</div>);
jest.mock('./pages/PagoExitoso', () => () => <div>PAGO EXITOSO PAGE</div>);
jest.mock('./components/Cart', () => () => <div>CART PAGE</div>);
jest.mock('./components/ForgotPassword', () => () => <div>FORGOT PASSWORD PAGE</div>);
jest.mock('./components/ResetPassword', () => () => <div>RESET PASSWORD PAGE</div>);
jest.mock('./components/SearchBar', () => () => <div>SEARCH PAGE</div>);
jest.mock('./components/admin/AdminPanel', () => () => <div>ADMIN PAGE</div>);
jest.mock('./components/admin/OrdersPanel', () => () => <div>ORDERS PAGE</div>);

test('renders the main shell and home route', () => {
  render(<App />);
  expect(screen.getByText('RETROSOUND')).toBeInTheDocument();
  expect(screen.getAllByText('HOME PAGE').length).toBeGreaterThan(0);
});
