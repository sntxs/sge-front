import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Login from './components/layout/login';
import Home from './components/layout/home';
//import AddItemStock from './components/layout/stock/addItemStock';
import StockPanel from './components/layout/stock/stockPanel';
import RequestItem from './components/layout/stock/requestItem';
//import AddUsers from './components/layout/users/addUsers';
import UsersPanel from './components/layout/users/usersPanel';
import SectorPanel from './components/layout/users/sectorPanel';
import 'bootstrap/dist/css/bootstrap.min.css';

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
              isLoggedIn ? <Home username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
            } />
{/*             <Route path="/add-item" element={
              isLoggedIn ? <AddItemStock username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
            } /> */}
            <Route path="/stock-panel" element={
              isLoggedIn ? <StockPanel username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
            } />
            <Route path="/request-item" element={
              isLoggedIn ? <RequestItem username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
            } />
{/*             <Route path="/add-user" element={
              isLoggedIn ? <AddUsers username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
            } /> */}
            <Route path="/user-panel" element={
              isLoggedIn ? <UsersPanel username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
            } />
            <Route path="/sector-panel" element={
              isLoggedIn ? <SectorPanel username={username} onLogout={handleLogout} /> : <Navigate to="/login" />
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
