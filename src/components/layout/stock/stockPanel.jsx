import React, { useState, useEffect } from 'react';
import SideMenu from '../side-menu';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { MdDelete } from 'react-icons/md';
import { Modal, Button } from 'react-bootstrap';
import { API_URL_GLOBAL } from '../../../api-config.jsx';
import axios from 'axios';
import '../../css/stock.css'; // Certifique-se de que o arquivo CSS está importado
import * as XLSX from 'xlsx';


function PainelStock({ username, onLogout }) {
  const navigate = useNavigate();
  const id = localStorage.getItem('id');
  const [items, setItems] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userName: '',
    userId: id,
    quantity: '',
    createdAt: ''
  });
  const [users, setUsers] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState(false);

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
        userId: id,
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

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get(`${API_URL_GLOBAL}/Product`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const formattedItems = response.data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          userName: item.userName,
          quantity: item.quantity,
          createdAt: new Date(item.createdAt).toLocaleDateString('pt-BR')
        }));
        setItems(formattedItems);
      } catch (error) {
        console.error('Erro ao buscar itens do estoque:', error);
      }
    };

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

    fetchItems();
  }, []);

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFormData(item);
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL_GLOBAL}/Product/${currentItem.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShowEditModal(false);
      setFeedbackMessage('Item editado com sucesso!');
      setFeedbackError(false);
      setShowFeedbackModal(true);
    } catch (error) {
      setShowEditModal(false);
      setFeedbackMessage('Erro ao editar item: ' + error.response.data || error);
      setFeedbackError(true);
      setShowFeedbackModal(true);
    }

    /*     const updatedItems = items.map(item =>
          item.id === currentItem.id ? formData : item
        );
        setItems(updatedItems);
        setShowEditModal(false); */
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL_GLOBAL}/Product/${itemToDelete.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShowDeleteModal(false);
      setFeedbackMessage('Item deletado com sucesso!');
      setFeedbackError(false);
      setShowFeedbackModal(true);
    } catch (error) {
      setShowDeleteModal(false);
      setFeedbackMessage('Erro ao deletar item: ' + error.response.data || error);
      setFeedbackError(true);
      setShowFeedbackModal(true);
    }
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
    if (!feedbackError) {
      window.location.reload();
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getQuantityColorClass = (quantity) => {
    return quantity < 3 ? 'text-danger fw-bold' : '';
  };

  const exportToExcel = () => {
    const dataToExport = filteredItems.map(item => ({
      'Nome do Produto': item.name,
      'Descrição': item.description,
      'Cadastrado por': item.userName,
      'Quantidade': item.quantity,
      'Data de Cadastro': item.createdAt
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);

    const columnWidths = [
      { wch: 30 }, // Nome do Produto
      { wch: 40 }, // Descrição
      { wch: 20 }, // Cadastrado por
      { wch: 15 }, // Quantidade
      { wch: 15 }, // Data de Cadastro
    ];
    ws['!cols'] = columnWidths;

    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: {
          bold: true,
          sz: 20, // Tamanho da fonte aumentado para 20
          color: { rgb: "000000" }
        },
        fill: {
          fgColor: { rgb: "CCCCCC" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: { // Adicionando bordas em todos os lados
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" }
        }
      };
    }

    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellRef]) continue;

        ws[cellRef].s = {
          ...ws[cellRef].s,
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" }
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true
          }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");

    const fileName = `estoque_${new Date().toLocaleDateString()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const sortItems = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedItems = [...items].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
    setItems(sortedItems);
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <FaSort />;
    return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  /*   const navigateToRequestItem = () => {
      window.location.href = '/request-item';
    }; */

  return (
    <div className="d-flex">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="flex-grow-1 p-4">
        <h1 className="text-center">Painel de Estoque</h1>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="search-container position-relative">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => navigate('/request-item')}
            >
              Itens Solicitados
            </button>
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowModal(true)}
            >
              Adicionar Item
            </button>
            <button
              className="btn btn-success"
              onClick={exportToExcel}
            >
              <BsFileEarmarkSpreadsheet className='mb-1 me-2' />
              Relatório
            </button>
          </div>
        </div>

        <table className="table table-striped">
          <thead>
            <tr className="text-uppercase">
              <th className="text-center fw-bold" onClick={() => sortItems('name')} style={{ cursor: 'pointer' }}>
                Nome do Produto {getSortIcon('name')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('description')} style={{ cursor: 'pointer' }}>
                Descrição {getSortIcon('description')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('userName')} style={{ cursor: 'pointer' }}>
                Cadastrado por {getSortIcon('userName')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('quantity')} style={{ cursor: 'pointer' }}>
                Quantidade {getSortIcon('quantity')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('createdAt')} style={{ cursor: 'pointer' }}>
                Data de Cadastro {getSortIcon('createdAt')}
              </th>
              <th className="text-center fw-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, index) => (
              <tr key={index}>
                <td className="align-middle text-center">{item.name}</td>
                <td className="align-middle text-center">{item.description}</td>
                <td className="align-middle text-center">{item.userName}</td>
                <td className={`align-middle text-center ${getQuantityColorClass(item.quantity)}`}>
                  {item.quantity}
                  {item.quantity < 3 &&
                    <div className="small text-danger">Estoque baixo!</div>
                  }
                </td>
                <td className="align-middle text-center">{item.createdAt}</td>
                <td className="align-middle text-center">
                  <button className="btn btn-primary btn-sm m-1" onClick={() => handleEdit(item)}>
                    <FaEdit />
                  </button>
                  <button className="btn btn-danger btn-sm m-1" onClick={() => handleDelete(item)}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredItems.length)} de {filteredItems.length} itens
          </div>
          <nav>
            <ul className="pagination">
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
                  if (totalPages <= 7) return true;
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
      </div>

      {/* Modal de Adição */}
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

      {/* Modal de Edição */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Nome do Produto</label>
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
              <label htmlFor="description" className="form-label">Descrição</label>
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
              <label htmlFor="quantity" className="form-label">Quantidade</label>
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
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmação de Deleção */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja excluir este item do estoque?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Feedback */}
      <Modal show={showFeedbackModal} onHide={handleCloseFeedback} centered>
        <Modal.Header closeButton>
          <Modal.Title>{feedbackError ? 'Erro' : 'Sucesso'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className={feedbackError ? 'text-danger' : 'text-success'}>
            {feedbackMessage}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant={feedbackError ? 'danger' : 'success'} onClick={handleCloseFeedback}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PainelStock;
