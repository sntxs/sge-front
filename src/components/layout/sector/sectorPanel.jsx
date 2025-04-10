import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaEdit, FaSearch, FaSort, FaSortUp, FaSortDown, FaBuilding } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { BsFileEarmarkSpreadsheet } from 'react-icons/bs';
import * as XLSX from 'xlsx';
import SideMenu from '../side-menu';
import '../../css/sector.css';
import { API_URL_GLOBAL } from '../../../api-config';

function SectorPanel({ username, onLogout }) {
  const [sectors, setSectors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSector, setCurrentSector] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL_GLOBAL}/Sector`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSectors(response.data);
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
      setErrorMessage('Não foi possível carregar os setores');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL_GLOBAL}/Sector`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setFormData({ name: '' });
      setShowModal(false);
      setSuccessMessage('Setor adicionado com sucesso!');
      setShowSuccessModal(true);
      fetchSectors();
    } catch (error) {
      console.error('Erro ao adicionar setor:', error);
      setErrorMessage('Não foi possível adicionar o setor');
      setShowErrorModal(true);
    }
  };

  const handleEdit = (sector) => {
    setCurrentSector(sector);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API_URL_GLOBAL}/Sector/${currentSector.id}`, currentSector, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShowEditModal(false);
      setSuccessMessage('Setor editado com sucesso!');
      setShowSuccessModal(true);
      fetchSectors();
    } catch (error) {
      console.error('Erro ao editar setor:', error);
      setErrorMessage('Não foi possível editar o setor');
      setShowErrorModal(true);
    }
  };

  const handleDelete = (sector) => {
    setCurrentSector(sector);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL_GLOBAL}/Sector/${currentSector.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setShowDeleteModal(false);
      setSuccessMessage('Setor excluído com sucesso!');
      setShowSuccessModal(true);
      fetchSectors();
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
      setErrorMessage('Não foi possível excluir o setor');
      setShowErrorModal(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  // Funções de ordenação e filtragem
  const sortItems = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedSectors = [...sectors].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
    setSectors(sortedSectors);
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <FaSort />;
    return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
  };

  const filteredSectors = sectors.filter(sector =>
    sector.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSectors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSectors.length / itemsPerPage);

  const exportToExcel = () => {
    const dataToExport = filteredSectors.map(sector => ({
      'Nome': sector.name,
      'Data de Criação': new Date(sector.createdAt).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Setores");
    XLSX.writeFile(wb, `setores_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="sector-container">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="sector-content">
        {/* Header Card */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-icon">
              <FaBuilding size={30} />
            </div>
            <div>
              <h1 className="mb-0">Painel de Setores</h1>
              <p className="mb-0">Gerencie todos os setores da organização</p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="control-panel">
          <div className="search-container">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar setor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="action-buttons">
            <button
              className="btn btn-sector"
              onClick={() => setShowModal(true)}
            >
              <FaBuilding className="me-2" /> Adicionar Setor
            </button>
            <button
              className="btn btn-rel"
              onClick={exportToExcel}
            >
              <BsFileEarmarkSpreadsheet className="me-2" /> Relatório
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="table-container">
          {isLoading ? (
            <div className="spinner">
              <div className="bounce1"></div>
              <div className="bounce2"></div>
              <div className="bounce3"></div>
              <p className="mt-3">Carregando setores...</p>
            </div>
          ) : filteredSectors.length === 0 ? (
            <div className="empty-state">
              <FaBuilding size={50} className="empty-icon" />
              <h4>Nenhum setor encontrado</h4>
              <p>Não existem setores cadastrados ou correspondentes à sua busca.</p>
            </div>
          ) : (
            <table className="sector-table">
              <thead>
                <tr>
                  <th onClick={() => sortItems('name')}>
                    <div className="th-content">
                      Nome {getSortIcon('name')}
                    </div>
                  </th>
                  <th onClick={() => sortItems('createdAt')}>
                    <div className="th-content">
                      Data de Criação {getSortIcon('createdAt')}
                    </div>
                  </th>
                  <th>
                    <div className="th-content">
                      Ações
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((sector) => (
                  <tr key={sector.id} className="sector-row">
                    <td>{sector.name}</td>
                    <td>{new Date(sector.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div className="action-cell">
                        <button className="action-btn edit-btn" onClick={() => handleEdit(sector)}>
                          <FaEdit />
                        </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(sector)}>
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && filteredSectors.length > 0 && (
          <div className="pagination-container">
            <div className="showing-info">
              Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSectors.length)} de {filteredSectors.length} setores
            </div>
            <nav>
              <ul className="custom-pagination">
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
        )}

        {/* Modal de Adição */}
        <Modal 
          show={showModal} 
          onHide={() => setShowModal(false)}
          centered
          className="custom-modal"
        >
          <Modal.Header closeButton className="modal-custom-header">
            <Modal.Title>Adicionar Setor</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body">
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Setor</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="custom-input"
                />
              </Form.Group>
              <div className="text-end mt-4">
                <Button variant="primary" type="submit" className="custom-button">
                  Adicionar
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Modal de Edição */}
        <Modal 
          show={showEditModal} 
          onHide={() => setShowEditModal(false)}
          centered
          className="custom-modal"
        >
          <Modal.Header closeButton className="modal-custom-header">
            <Modal.Title>Editar Setor</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body">
            {currentSector && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Setor</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentSector.name}
                    onChange={(e) => setCurrentSector({...currentSector, name: e.target.value})}
                    required
                    className="custom-input"
                  />
                </Form.Group>
              </Form>
            )}
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
          className="custom-modal"
        >
          <Modal.Header closeButton className="modal-custom-header">
            <Modal.Title>Confirmar Exclusão</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body text-center">
            <div className="delete-icon-container mb-4">
              <MdDelete size={40} />
            </div>
            <h4>Tem certeza que deseja excluir este setor?</h4>
            <p className="mb-0">
              {currentSector?.name}
            </p>
            <p className="text-muted">Esta ação não poderá ser desfeita.</p>
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

        {/* Modal de Sucesso */}
        <Modal
          show={showSuccessModal}
          onHide={handleCloseSuccessModal}
          centered
          className="feedback-modal"
        >
          <Modal.Header closeButton className="modal-custom-header success-header">
            <Modal.Title>Sucesso</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body text-center py-4">
            <div className="success-icon-container mb-3">
              <span className="success-icon">✓</span>
            </div>
            <h4>Operação realizada com sucesso!</h4>
            <p>{successMessage}</p>
          </Modal.Body>
          <Modal.Footer className="modal-custom-footer">
            <Button
              variant="success"
              onClick={handleCloseSuccessModal}
              className="custom-button success-button mx-auto"
            >
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal de Erro */}
        <Modal
          show={showErrorModal}
          onHide={handleCloseErrorModal}
          centered
          className="feedback-modal"
        >
          <Modal.Header closeButton className="modal-custom-header error-header">
            <Modal.Title>Erro</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body text-center py-4">
            <div className="error-icon-container mb-3">
              <span className="error-icon">!</span>
            </div>
            <h4>Ocorreu um erro</h4>
            <p>{errorMessage || "Não foi possível completar a operação."}</p>
          </Modal.Body>
          <Modal.Footer className="modal-custom-footer">
            <Button
              variant="danger"
              onClick={handleCloseErrorModal}
              className="custom-button error-button mx-auto"
            >
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
}

export default SectorPanel; 