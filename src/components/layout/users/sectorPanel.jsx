import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaEdit, FaSearch, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { BsFileEarmarkSpreadsheet } from 'react-icons/bs';
import * as XLSX from 'xlsx';
import SideMenu from '../side-menu';
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
  const [showAlert, setShowAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const response = await axios.get(`${API_URL_GLOBAL}/Sector`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSectors(response.data);
    } catch (error) {
      console.error('Erro ao buscar setores:', error);
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
      const response = await axios.post(`${API_URL_GLOBAL}/Sector`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.status === 200) {
        setFormData({ name: '' });
        setShowModal(false);
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      console.error('Erro ao adicionar setor:', error);
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
      setShowEditAlert(true);
      setTimeout(() => {
        setShowEditAlert(false);
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Erro ao editar setor:', error);
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
      setShowDeleteAlert(true);
      setTimeout(() => {
        setShowDeleteAlert(false);
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('Erro ao deletar setor:', error);
    }
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
    <div className="d-flex">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="flex-grow-1 p-4">
        <h1 className="text-center">Painel de Setores</h1>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="search-container position-relative">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar setor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowModal(true)}
            >
              Adicionar Setor
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

        {/* Tabela de Setores */}
        <table className="table table-striped">
          <thead>
            <tr className='text-uppercase'>
              <th className="text-center fw-bold" onClick={() => sortItems('name')} style={{ cursor: 'pointer' }}>
                Nome {getSortIcon('name')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('createdAt')} style={{ cursor: 'pointer' }}>
                Data de Criação {getSortIcon('createdAt')}
              </th>
              <th className="text-center fw-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((sector) => (
              <tr key={sector.id}>
                <td className="text-center">{sector.name}</td>
                <td className="text-center">{new Date(sector.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="text-center">
                  <button className="btn btn-primary btn-sm m-1" onClick={() => handleEdit(sector)}>
                    <FaEdit />
                  </button>
                  <button className="btn btn-danger btn-sm m-1" onClick={() => handleDelete(sector)}>
                    <MdDelete />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginação */}
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSectors.length)} de {filteredSectors.length} setores
          </div>
          <nav>
            <ul className="pagination">
              {/* ... código da paginação igual aos outros componentes ... */}
            </ul>
          </nav>
        </div>

        {/* Modais */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Adicionar Setor</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nome do Setor</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
              <Button variant="primary" type="submit">
                Adicionar
              </Button>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Modal de Edição */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Editar Setor</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {currentSector && (
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Setor</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentSector.name}
                    onChange={(e) => setCurrentSector({...currentSector, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Form>
            )}
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
            Tem certeza que deseja excluir o setor "{currentSector?.name}"?
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

        {/* Alertas */}
        {showAlert && (
          <Alert variant="success" className="mt-3">
            Setor cadastrado com sucesso! A página será recarregada em 3 segundos.
          </Alert>
        )}
        {showEditAlert && (
          <Alert variant="success" className="mt-3">
            Setor editado com sucesso! A página será recarregada em 3 segundos.
          </Alert>
        )}
        {showDeleteAlert && (
          <Alert variant="success" className="mt-3">
            Setor excluído com sucesso! A página será recarregada em 3 segundos.
          </Alert>
        )}
      </div>
    </div>
  );
}

export default SectorPanel; 