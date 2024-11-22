import React, { useState, useEffect } from 'react'; // Adicionado useEffect
import SideMenu from '../side-menu';
import { Modal, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Adicionado axios para fazer a requisição
import '../../css/stock.css';
import { API_URL_GLOBAL } from '../../../api-config.jsx';

function AddItemStock({ username, onLogout }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const id = localStorage.getItem('id');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userId: id,
    quantity: ''
  });
  const [users, setUsers] = useState([]); // Adicionado estado para armazenar os usuários
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');


  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL_GLOBAL}/User/`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
        setUsers(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL_GLOBAL}/Product`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setFormData({
        name: '',
        description: '',
        quantity: ''
      });
      setShowModal(false);
      setShowSuccessModal(true);
      
    } catch (error) {
      console.error('Erro ao cadastrar item:', error);
      if (error.response?.data?.includes('já existe')) {
        setErrorMessage('Já existe um item cadastrado com este nome!');
      } else {
        setErrorMessage('Erro ao cadastrar item. Tente novamente.');
      }
      setShowErrorModal(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    window.location.reload();
  };

  return (
    <div className="d-flex">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="flex-grow-1 p-4 text-center">
        <h1>Bem vindo ao menu de adição de item ao estoque</h1>
        <Button
          variant="primary"
          onClick={() => setShowModal(true)}
        >
          Adicionar Item
        </Button>

        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          dialogClassName="modal-90w"
          aria-labelledby="example-custom-modal-styling-title"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title id="example-custom-modal-styling-title">Adicionar Item ao Estoque</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="nomeProduto" className="form-label">Nome do Produto</label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="descricao" className="form-label">Descrição</label>
                <textarea
                  className="form-control"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <div className="mb-3">
                <label htmlFor="quantidade" className="form-label">Quantidade</label>
                <input
                  type="number"
                  className="form-control"
                  id="quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <Button variant="primary" type="submit">
                Enviar
              </Button>
            </form>
          </Modal.Body>
        </Modal>
        <button className="btn btn-primary mx-5" onClick={() => navigate('/stock-panel')}>Ver Estoque</button>

        {/* Modal de Sucesso */}
        <Modal
          show={showSuccessModal}
          onHide={handleCloseSuccessModal}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Sucesso!</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Item cadastrado com sucesso!</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="success" onClick={handleCloseSuccessModal}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Erro */}
        <Modal
          show={showErrorModal}
          onHide={() => setShowErrorModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Erro</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              {/* {errorMessage} */}
              Item já cadastrado!
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="danger" onClick={() => setShowErrorModal(false)}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default AddItemStock;
