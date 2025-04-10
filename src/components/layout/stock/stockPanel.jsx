import React, { useState, useEffect } from 'react';
import SideMenu from '../side-menu';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch, FaBoxOpen, FaArrowDown, FaArrowUp, FaListUl } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet, BsPlusCircleFill } from "react-icons/bs";
import { MdDelete, MdInventory, MdWarning, MdFilterList, MdFilterListOff } from 'react-icons/md';
import { Modal, Button, OverlayTrigger, Tooltip, Badge } from 'react-bootstrap';
import { API_URL_GLOBAL } from '../../../api-config.jsx';
import axios from 'axios';
import '../../css/stock.css';
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
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [warningStockCount, setWarningStockCount] = useState(0);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showWarningStockOnly, setShowWarningStockOnly] = useState(false);

  // Constantes para os limites de estoque
  const LOW_STOCK_THRESHOLD = 5;
  const WARNING_STOCK_THRESHOLD = 10;

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
        setIsLoading(true);
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

        // Contar itens com estoque baixo e em alerta
        const lowItems = formattedItems.filter(item => item.quantity <= LOW_STOCK_THRESHOLD);
        const warningItems = formattedItems.filter(item => item.quantity > LOW_STOCK_THRESHOLD && item.quantity <= WARNING_STOCK_THRESHOLD);

        setLowStockCount(lowItems.length);
        setWarningStockCount(warningItems.length);
      } catch (error) {
        console.error('Erro ao buscar itens do estoque:', error);
      } finally {
        setIsLoading(false);
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

  const toggleLowStockFilter = () => {
    setShowLowStockOnly(!showLowStockOnly);
    setShowWarningStockOnly(false);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const toggleWarningStockFilter = () => {
    setShowWarningStockOnly(!showWarningStockOnly);
    setShowLowStockOnly(false);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const resetFilters = () => {
    setShowLowStockOnly(false);
    setShowWarningStockOnly(false);
    setCurrentPage(1);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (showLowStockOnly) {
      return matchesSearch && item.quantity <= LOW_STOCK_THRESHOLD;
    }
    if (showWarningStockOnly) {
      return matchesSearch && item.quantity > LOW_STOCK_THRESHOLD && item.quantity <= WARNING_STOCK_THRESHOLD;
    }
    return matchesSearch;
  });

  const getQuantityColorClass = (quantity) => {
    if (quantity <= LOW_STOCK_THRESHOLD) return 'stock-critical';
    if (quantity <= WARNING_STOCK_THRESHOLD) return 'stock-warning';
    return 'stock-normal';
  };

  const getRowHighlightClass = (quantity) => {
    if (showLowStockOnly && quantity <= LOW_STOCK_THRESHOLD) {
      return 'low-stock-highlight';
    }
    if (showWarningStockOnly && quantity > LOW_STOCK_THRESHOLD && quantity <= WARNING_STOCK_THRESHOLD) {
      return 'warning-stock-highlight';
    }
    return '';
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

  return (
    <div className="d-flex stock-container">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="flex-grow-1 p-4 stock-content">
        <div className="header-card mb-4">
          <div className="header-content">
            <div className="header-icon">
              <MdInventory size={40} />
            </div>
            <div>
              <h1 className="text-center mb-0">Painel de Estoque</h1>
              <p className="text-center mb-0">Controle seus produtos de forma inteligente</p>
            </div>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="low-stock-alert mb-4">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center">
                <MdWarning size={24} className="me-2 warning-icon" />
                <span className='fw-bold'>Atenção! Você tem <u className='fw-bold'>{lowStockCount} {lowStockCount === 1 ? 'item' : 'itens'}</u> com estoque muito baixo.</span>
              </div>
              <button
                className={`btn ${showLowStockOnly ? 'btn-outline-danger' : 'btn-danger'} low-stock-btn`}
                onClick={toggleLowStockFilter}
              >
                {showLowStockOnly ? (
                  <>
                    <MdFilterListOff className="me-2" /> Mostrar Todos
                  </>
                ) : (
                  <>
                    <MdFilterList className="me-2" /> Ver Itens
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {warningStockCount > 0 && (
          <div className="warning-stock-alert mb-4">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center">
                <FaArrowDown size={20} className="me-2 warning-icon text-warning" />
                <span className='fw-bold'>Aviso! Você tem <u className='fw-bold'>{warningStockCount} {warningStockCount === 1 ? 'item' : 'itens'}</u> para considerar reposição em breve.</span>
              </div>
              <button
                className={`btn ${showWarningStockOnly ? 'btn-outline-warning' : 'btn-warning'} warning-stock-btn`}
                onClick={toggleWarningStockFilter}
              >
                {showWarningStockOnly ? (
                  <>
                    <MdFilterListOff className="me-2" /> Mostrar Todos
                  </>
                ) : (
                  <>
                    <MdFilterList className="me-2" /> Ver Itens
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="control-panel mb-4">
          <div className="search-container">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="action-buttons">
            {(showLowStockOnly || showWarningStockOnly) && (
              <button
                className="btn btn-outline-primary me-2"
                onClick={resetFilters}
              >
                <FaListUl className="me-1" /> Todos os Itens
              </button>
            )}
            <button
              className="btn btn-request btn-outline-primary"
              onClick={() => navigate('/request-item')}
            >
              <FaBoxOpen className='me-2 ' />
              Solicitar Item
            </button>
            {localStorage.getItem('isAdmin') === 'true' && (
              <button
                className="btn btn-add"
                onClick={() => setShowModal(true)}
              >
                <BsPlusCircleFill className='me-2' />
                Adicionar Item
              </button>
            )}
            <button
              className="btn btn-rel"
              onClick={exportToExcel}
            >
              <BsFileEarmarkSpreadsheet className='me-2' />
              Relatório
            </button>
          </div>
        </div>

        {showLowStockOnly && (
          <div className="filter-active-alert mb-3">
            <Badge bg="danger">Filtro Ativo: Apenas itens com estoque crítico (≤ 5 unidades)</Badge>
          </div>
        )}

        {showWarningStockOnly && (
          <div className="filter-active-alert mb-3">
            <Badge bg="warning" text="dark">Filtro Ativo: Itens para considerar reposição (6-10 unidades)</Badge>
          </div>
        )}

        <div className="table-container">
          <table className="table stock-table">
            <thead>
              <tr className="text-uppercase">
                <th onClick={() => sortItems('name')}>
                  <div className="th-content">
                    Nome do Produto
                    <span className="sort-icon">{getSortIcon('name')}</span>
                  </div>
                </th>
                <th onClick={() => sortItems('description')}>
                  <div className="th-content">
                    Descrição
                    <span className="sort-icon">{getSortIcon('description')}</span>
                  </div>
                </th>
                <th onClick={() => sortItems('userName')}>
                  <div className="th-content">
                    Cadastrado por
                    <span className="sort-icon">{getSortIcon('userName')}</span>
                  </div>
                </th>
                <th onClick={() => sortItems('quantity')}>
                  <div className="th-content">
                    Quantidade
                    <span className="sort-icon">{getSortIcon('quantity')}</span>
                  </div>
                </th>
                <th onClick={() => sortItems('createdAt')}>
                  <div className="th-content">
                    Data de Cadastro
                    <span className="sort-icon">{getSortIcon('createdAt')}</span>
                  </div>
                </th>
                {localStorage.getItem('isAdmin') === 'true' && (
                  <th className="text-center">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={localStorage.getItem('isAdmin') === 'true' ? 6 : 5} className="text-center py-4">
                    <div className="spinner">
                      <div className="bounce1"></div>
                      <div className="bounce2"></div>
                      <div className="bounce3"></div>
                    </div>
                    <p className="mt-2 mb-0">Carregando itens do estoque...</p>
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={localStorage.getItem('isAdmin') === 'true' ? 6 : 5} className="text-center py-4">
                    <div className="empty-state">
                      <MdInventory size={48} className="empty-icon" />
                      <p className="mb-0">
                        {showLowStockOnly
                          ? "Não há itens com estoque crítico."
                          : showWarningStockOnly
                            ? "Não há itens para considerar reposição."
                            : "Nenhum item encontrado no estoque."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr
                    key={index}
                    className={`stock-row ${getQuantityColorClass(item.quantity)} ${getRowHighlightClass(item.quantity)}`}
                  >
                    <td>{item.name}</td>
                    <td>{item.description}</td>
                    <td>{item.userName}</td>
                    <td className="quantity-cell">
                      <div className="quantity-wrapper">
                        <span className="quantity-badge">
                          {item.quantity}
                        </span>
                        {item.quantity <= LOW_STOCK_THRESHOLD && (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Estoque crítico! Necessita reposição urgente.</Tooltip>}
                          >
                            <div className="stock-indicator critical-indicator">
                              <MdWarning />
                            </div>
                          </OverlayTrigger>
                        )}
                        {item.quantity > LOW_STOCK_THRESHOLD && item.quantity <= WARNING_STOCK_THRESHOLD && (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Considere repor em breve.</Tooltip>}
                          >
                            <div className="stock-indicator warning-indicator">
                              <FaArrowDown />
                            </div>
                          </OverlayTrigger>
                        )}
                        {item.quantity > WARNING_STOCK_THRESHOLD && (
                          <OverlayTrigger
                            placement="top"
                            overlay={<Tooltip>Estoque normal</Tooltip>}
                          >
                            <div className="stock-indicator normal-indicator">
                              <FaArrowUp />
                            </div>
                          </OverlayTrigger>
                        )}
                      </div>
                    </td>
                    <td>{item.createdAt}</td>
                    {localStorage.getItem('isAdmin') === 'true' && (
                      <td className="action-cell">
                        <button className="action-btn edit-btn" onClick={() => handleEdit(item)}>
                          <FaEdit />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(item)}>
                          <MdDelete />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-container mt-3">
          <div className="showing-info">
            {filteredItems.length > 0 ? (
              <>
                Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredItems.length)} de {filteredItems.length} itens
                {showLowStockOnly && <span className="ms-2 text-danger">(Filtro de estoque crítico ativo)</span>}
                {showWarningStockOnly && <span className="ms-2 text-warning">(Filtro de reposição em breve ativo)</span>}
              </>
            ) : (
              <span>
                {showLowStockOnly ? "Nenhum item com estoque crítico encontrado" :
                  showWarningStockOnly ? "Nenhum item para considerar reposição encontrado" :
                    "Nenhum item encontrado"}
              </span>
            )}
          </div>
          {filteredItems.length > 0 && (
            <nav>
              <ul className="pagination custom-pagination">
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
          )}
        </div>
      </div>

      {/* Modal de Adição */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        dialogClassName="custom-modal"
        aria-labelledby="example-custom-modal-styling-title"
        centered
      >
        <Modal.Header closeButton className="modal-custom-header">
          <Modal.Title id="example-custom-modal-styling-title">
            <BsPlusCircleFill className="me-2" />
            Adicionar Item ao Estoque
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-custom-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nomeProduto" className="form-label">Nome do Produto</label>
              <input
                type="text"
                className="form-control custom-input"
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
                className="form-control custom-input"
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
                className="form-control custom-input"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
            <Button variant="primary" type="submit" className="custom-button">
              Cadastrar Item
            </Button>
          </form>
        </Modal.Body>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal
        show={showSuccessModal}
        onHide={handleCloseSuccessModal}
        centered
        className="feedback-modal success-modal"
      >
        <Modal.Header closeButton className="modal-custom-header success-header">
          <Modal.Title>Sucesso!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-custom-body text-center">
          <div className="success-icon-container">
            <div className="success-icon">✓</div>
          </div>
          <p className="mt-3">Item cadastrado com sucesso!</p>
        </Modal.Body>
        <Modal.Footer className="modal-custom-footer">
          <Button variant="success" onClick={handleCloseSuccessModal} className="custom-button success-button">
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Erro */}
      <Modal
        show={showErrorModal}
        onHide={() => setShowErrorModal(false)}
        centered
        className="feedback-modal error-modal"
      >
        <Modal.Header closeButton className="modal-custom-header error-header">
          <Modal.Title>Erro</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-custom-body text-center">
          <div className="error-icon-container">
            <div className="error-icon">×</div>
          </div>
          <p className="mt-3">
            Item já cadastrado!
          </p>
        </Modal.Body>
        <Modal.Footer className="modal-custom-footer">
          <Button variant="danger" onClick={() => setShowErrorModal(false)} className="custom-button error-button">
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Edição */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
        dialogClassName="custom-modal"
      >
        <Modal.Header closeButton className="modal-custom-header">
          <Modal.Title>
            <FaEdit className="me-2" />
            Editar Item
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-custom-body">
          <form>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Nome do Produto</label>
              <input
                type="text"
                className="form-control custom-input"
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
                className="form-control custom-input"
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
                className="form-control custom-input"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
              />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="modal-custom-footer">
          <Button variant="secondary" onClick={() => setShowEditModal(false)} className="custom-button cancel-button">
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} className="custom-button">
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Confirmação de Deleção */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        className="delete-confirmation-modal"
      >
        <Modal.Header closeButton className="modal-custom-header">
          <Modal.Title>
            <MdDelete className="me-2" />
            Confirmar Exclusão
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-custom-body">
          <div className="text-center mb-3">
            <div className="delete-icon-container">
              <MdDelete size={40} />
            </div>
          </div>
          <p className="text-center">
            Tem certeza que deseja excluir este item do estoque?<br />
            <strong>Esta ação não pode ser desfeita.</strong>
          </p>
        </Modal.Body>
        <Modal.Footer className="modal-custom-footer">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="custom-button cancel-button">
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} className="custom-button delete-button">
            Excluir
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Feedback */}
      <Modal
        show={showFeedbackModal}
        onHide={handleCloseFeedback}
        centered
        className={`feedback-modal ${feedbackError ? 'error-modal' : 'success-modal'}`}
      >
        <Modal.Header closeButton className={`modal-custom-header ${feedbackError ? 'error-header' : 'success-header'}`}>
          <Modal.Title>{feedbackError ? 'Erro' : 'Sucesso'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-custom-body text-center">
          <div className={feedbackError ? 'error-icon-container' : 'success-icon-container'}>
            <div className={feedbackError ? 'error-icon' : 'success-icon'}>
              {feedbackError ? '×' : '✓'}
            </div>
          </div>
          <p className={`mt-3 ${feedbackError ? 'text-danger' : 'text-success'}`}>
            {feedbackMessage}
          </p>
        </Modal.Body>
        <Modal.Footer className="modal-custom-footer">
          <Button
            variant={feedbackError ? 'danger' : 'success'}
            onClick={handleCloseFeedback}
            className={`custom-button ${feedbackError ? 'error-button' : 'success-button'}`}
          >
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default PainelStock;
