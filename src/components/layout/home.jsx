import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/home.css';
import SideMenu from './side-menu';
import axios from 'axios';
import { API_URL_GLOBAL } from '../../api-config';

function Home({ username, onLogout }) {
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Definindo 5 itens por página no card

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_URL_GLOBAL}/Product`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const formattedItems = response.data.map(item => ({
          name: item.name,
          quantity: item.quantity
        }));
        setStockItems(formattedItems);
      } catch (error) {
        console.error('Erro ao buscar itens do estoque:', error);
      }
    };

    fetchItems();
  }, []);

  // Lógica de paginação
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = stockItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(stockItems.length / itemsPerPage);

  return (
    <div className="d-flex">
      <SideMenu username={username} onLogout={onLogout} />
      <div id="content" className="flex-grow-1 p-3 transition-margin">
        <div className="container text-center">
          <h1 className="mb-4 font-weight-bold">Olá, {username}!</h1>
          <h2 className="display-5 mb-4 font-weight-bold">Bem-vindo ao Sistema de Gestão de Estoque</h2>
          <div className="row mt-5">
            <div className="d-flex flex-column justify-content-between">
              <div className="col-md-6 mx-auto">
                <h3 className="font-weight-bold text-primary">Visualizar Estoque</h3>
                <p>Confira o status atual do seu inventário.</p>
                <div className="card">
                  <div className="card-body">
                    <ul className="list-group">
                      {currentItems.map((item, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {item.name}
                          <span className="badge bg-primary rounded-pill">{item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Paginação */}
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, stockItems.length)} de {stockItems.length} itens
                      </small>
                      <nav>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              Anterior
                            </button>
                          </li>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(num => {
                              if (totalPages <= 5) return true;
                              if (num === 1 || num === totalPages) return true;
                              if (num >= currentPage - 1 && num <= currentPage + 1) return true;
                              return false;
                            })
                            .map((number) => (
                              <React.Fragment key={number}>
                                {number > 1 && number - 1 !== 1 && 
                                  <li className="page-item disabled">
                                    <span className="page-link">...</span>
                                  </li>
                                }
                                <li className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                  <button 
                                    className="page-link"
                                    onClick={() => setCurrentPage(number)}
                                  >
                                    {number}
                                  </button>
                                </li>
                              </React.Fragment>
                            ))}

                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Próximo
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>

                    <div className="card-header bg-primary text-white rounded-bottom mt-3">
                      <h5 className="mb-0">Total de itens cadastrados: {stockItems.length}</h5>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mx-auto mt-3">
                <button className="btn btn-primary p-2" onClick={() => navigate('/stock-panel')}>
                  Verificar estoque com detalhes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;