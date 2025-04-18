import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/layout/login';
import Home from './components/layout/home';
import StockPanel from './components/layout/stock/stockPanel';
import RequestItem from './components/layout/stock/requestItem';
import UsersPanel from './components/layout/users/usersPanel';
import SectorPanel from './components/layout/sector/sectorPanel';
import CategoryPanel from './components/layout/category/categoryPanel';
import Profile from './components/layout/users/profile';
import 'bootstrap/dist/css/bootstrap.min.css';

function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn ? children : <Navigate to="/login" />;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [initialRoute, setInitialRoute] = useState('/');

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    if (loggedIn) {
      setIsLoggedIn(true);
      setUsername(localStorage.getItem('username'));
      // Recupera a rota atual do localStorage
      const savedRoute = localStorage.getItem('currentRoute') || '/home';
      setInitialRoute(savedRoute);
    }
  }, []);

  // Função para salvar a rota atual
  const saveCurrentRoute = (path) => {
    localStorage.setItem('currentRoute', path);
  };

  const handleLoginSuccess = (loggedInUsername) => {
    setIsLoggedIn(true);
    setUsername(loggedInUsername);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('username', loggedInUsername);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
  };

  return (
    <Router>
      <RouteHandler saveCurrentRoute={saveCurrentRoute} initialRoute={initialRoute}>
        <div className="App">
          <Routes>
            <Route path="/login" element={
              isLoggedIn ? <Navigate to={initialRoute} /> : <Login onLoginSuccess={handleLoginSuccess} />
            } />
            <Route path="/home" element={
              <PrivateRoute>
                <Home username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/stock-panel" element={
              <PrivateRoute>
                <StockPanel username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/request-item" element={
              <PrivateRoute>
                <RequestItem username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/user-panel" element={
              <PrivateRoute>
                <UsersPanel username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/sector-panel" element={
              <PrivateRoute>
                <SectorPanel username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/category-panel" element={
              <PrivateRoute>
                <CategoryPanel username={username} onLogout={handleLogout} />
              </PrivateRoute>
            } />
            <Route path="/" element={isLoggedIn ? <Navigate to={initialRoute} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </RouteHandler>
    </Router>
  );
}

// Componente para lidar com a atualização da rota
function RouteHandler({ children, saveCurrentRoute, initialRoute }) {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/login') {
      saveCurrentRoute(location.pathname);
    }
  }, [location, saveCurrentRoute]);

  return children;
}

export default App;
