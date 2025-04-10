import React, { useState, useEffect } from 'react';
import SideMenu from '../side-menu';
import axios from 'axios';
import '../../css/usersPanel.css';
import { Modal, Button, Form, ToggleButton, ToggleButtonGroup, Alert } from 'react-bootstrap';
import MaskedInput from 'react-text-mask';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch, FaEye, FaEyeSlash, FaUserAlt } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { API_URL_GLOBAL } from '../../../api-config.jsx';
import { MdDelete } from 'react-icons/md';
import * as XLSX from 'xlsx';

function UsersPanel({ username, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    cpf: '',
    username: '',
    password: '',
    sectorId: '',
    isAdmin: false,
    showPassword: false
  });
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [itemToDelete, setItemToDelete] = useState(null);

  const togglePasswordVisibility = () => {
    setFormData(prevState => ({
      ...prevState,
      showPassword: !prevState.showPassword
    }));
  };

  // Funções de Adição
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Remover máscaras do CPF e telefone
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, '');

      const response = await axios.post(`${API_URL_GLOBAL}/User`, {
        name: formData.name,
        email: formData.email,
        phoneNumber: cleanPhoneNumber,
        cpf: cleanCPF,
        username: formData.username,
        password: formData.password,
        isAdmin: formData.isAdmin,
        sectorId: formData.sectorId
      },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.status === 200) {
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          cpf: '',
          username: '',
          password: '',
          isAdmin: false,
          sectorId: '',
          showPassword: false
        });
        setShowModal(false);
        setShowSuccessModal(true);
        fetchUsers();
      } else {
        setErrorMessage('Erro ao adicionar usuário');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erro ao conectar com o banco');
      setShowErrorModal(true);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSectors();
  }, []);

    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL_GLOBAL}/User/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      setErrorMessage(error.response?.data?.message || 'Erro ao buscar usuários');
      setShowErrorModal(true);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSectors = async () => {
      try {
        const response = await axios.get(`${API_URL_GLOBAL}/Sector/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setSectors(response.data);
      } catch (error) {
        console.error('Erro ao buscar setores:', error);
      setErrorMessage(error.response?.data?.message || 'Erro ao buscar setores');
      setShowErrorModal(true);
      }
    };

  const handleEdit = (user) => {
    setCurrentUser({
      ...user,
      sectorId: user.sector.id
    });
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setItemToDelete(user);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const cleanCPF = currentUser.cpf.replace(/\D/g, '');
      const cleanPhoneNumber = currentUser.phoneNumber.replace(/\D/g, '');

      await axios.put(`${API_URL_GLOBAL}/User/${currentUser.id}`, {
        ...currentUser,
        cpf: cleanCPF,
        phoneNumber: cleanPhoneNumber,
        isAdmin: currentUser.isAdmin,
        sectorId: currentUser.sectorId
      },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setShowEditModal(false);
      setShowSuccessModal(true);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erro ao editar usuário');
      setShowErrorModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL_GLOBAL}/User/${itemToDelete.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setShowDeleteModal(false);
      setShowSuccessModal(true);
      fetchUsers();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Erro ao deletar usuário');
      setShowErrorModal(true);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm) ||
    user.cpf.includes(searchTerm) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.sector.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    // Preparar os dados para exportação
    const dataToExport = filteredUsers.map(user => ({
      'Nome': user.name,
      'Email': user.email,
      'Telefone': user.phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
      'CPF': user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      'Nome de Usuário': user.username,
      'Administrador': user.isAdmin ? 'Sim' : 'Não',
      'Setor': user.sector.name
    }));

    // Criar planilha
    const ws = XLSX.utils.json_to_sheet(dataToExport);

    // Definir largura das colunas
    const columnWidths = [
      { wch: 30 }, // Nome
      { wch: 35 }, // Email
      { wch: 20 }, // Telefone
      { wch: 20 }, // CPF
      { wch: 20 }, // Nome de Usuário
      { wch: 15 }, // Administrador
      { wch: 20 }, // Setor
    ];
    ws['!cols'] = columnWidths;

    // Criar workbook e adicionar planilha
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuários");

    // Gerar arquivo e fazer download
    const fileName = `usuarios_${new Date().toLocaleDateString()}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const sortItems = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedUsers = [...users].sort((a, b) => {
      const aValue = key === 'sectorName' ? a.sector.name : a[key];
      const bValue = key === 'sectorName' ? b.sector.name : b[key];
      if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
    setUsers(sortedUsers);
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) return <FaSort />;
    return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <div className="users-container">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="users-content">
        {/* Header Card */}
        <div className="header-card">
          <div className="header-content">
            <div className="header-icon">
              <FaUserAlt size={30} />
            </div>
            <div>
              <h1 className="mb-0">Painel de Usuários</h1>
              <p className="mb-0">Gerencie todos os usuários do sistema</p>
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
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          </div>
          <div className="action-buttons">
            <button
              className="btn btn-request"
              onClick={() => setShowModal(true)}
            >
              <FaUserAlt /> Adicionar Usuário
            </button>
            <button
              className="btn btn-rel"
              onClick={exportToExcel}
            >
              <BsFileEarmarkSpreadsheet /> Relatório
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
                </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              <FaUserAlt size={50} className="empty-icon" />
              <h4>Nenhum usuário encontrado</h4>
              <p>Não existem usuários cadastrados ou correspondentes à sua busca.</p>
                </div>
          ) : (
            <table className="users-table">
          <thead>
                <tr>
                  <th onClick={() => sortItems('name')}>
                    <div className="th-content">
                Nome {getSortIcon('name')}
                    </div>
              </th>
                  <th onClick={() => sortItems('email')}>
                    <div className="th-content">
                Email {getSortIcon('email')}
                    </div>
              </th>
                  <th onClick={() => sortItems('phoneNumber')}>
                    <div className="th-content">
                Telefone {getSortIcon('phoneNumber')}
                    </div>
              </th>
                  <th onClick={() => sortItems('cpf')}>
                    <div className="th-content">
                CPF {getSortIcon('cpf')}
                    </div>
              </th>
                  <th onClick={() => sortItems('username')}>
                    <div className="th-content">
                Nome de Usuário {getSortIcon('username')}
                    </div>
              </th>
                  <th onClick={() => sortItems('sectorName')}>
                    <div className="th-content">
                Setor {getSortIcon('sectorName')}
                    </div>
                  </th>
                  <th onClick={() => sortItems('isAdmin')}>
                    <div className="th-content">
                      Permissão {getSortIcon('isAdmin')}
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
                {currentUsers.map(user => (
                  <tr key={user.id} className="users-row">
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</td>
                    <td>{user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                    <td>{user.username}</td>
                    <td>{user.sector.name}</td>
                    <td>{user.isAdmin ? 'Sim' : 'Não'}</td>
                    <td>
                      <div className="action-cell">
                        <button className="action-btn edit-btn" onClick={() => handleEdit(user)}>
                      <FaEdit />
                    </button>
                        <button className="action-btn delete-btn" onClick={() => handleDelete(user)}>
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
        {!isLoading && filteredUsers.length > 0 && (
          <div className="pagination-container">
            <div className="showing-info">
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} usuários
          </div>
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
            <Modal.Title>Adicionar Usuário</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="name" className="form-label">Nome</label>
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
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control custom-input"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="phoneNumber" className="form-label">Telefone</label>
                <MaskedInput
                  mask={['(', /[1-9]/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
                  className="form-control custom-input"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="cpf" className="form-label">CPF</label>
                <MaskedInput
                  mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]}
                  className="form-control custom-input"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Nome de Usuário</label>
                <input
                  type="text"
                  className="form-control custom-input"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Senha</label>
                <div className="input-group">
                  <input
                    type={formData.showPassword ? "text" : "password"}
                    className="form-control custom-input"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={togglePasswordVisibility}
                  >
                    {formData.showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="sectorId" className="form-label">Setor</label>
                <Form.Select
                  id="sectorId"
                  name="sectorId"
                  value={formData.sectorId}
                  onChange={handleInputChange}
                  required
                  className="custom-input"
                >
                  <option value="">Selecione um setor</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="mb-3">
                <label className="form-label">Permissão Administrador</label>
                <div>
                  <ToggleButtonGroup
                    type="radio"
                    name="isAdmin"
                    value={formData.isAdmin ? 1 : 0}
                    onChange={(val) => setFormData(prevState => ({ ...prevState, isAdmin: val === 1 }))}
                  >
                    <ToggleButton id="tbg-radio-1" value={1} variant={formData.isAdmin ? "primary" : "light"}>
                      Sim
                    </ToggleButton>
                    <ToggleButton id="tbg-radio-2" value={0} variant={formData.isAdmin ? "light" : "primary"}>
                      Não
                    </ToggleButton>
                  </ToggleButtonGroup>
        </div>
      </div>
              <div className="text-end mt-4">
                <Button variant="primary" type="submit" className="custom-button">
                  Cadastrar
                </Button>
              </div>
            </form>
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
          <Modal.Title>Editar Usuário</Modal.Title>
        </Modal.Header>
          <Modal.Body className="modal-custom-body">
          {currentUser && (
            <Form onKeyPress={handleKeyPress}>
                <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                    className="custom-input"
                />
              </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                    className="custom-input"
                />
              </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Telefone</Form.Label>
                <MaskedInput
                  mask={['(', /[1-9]/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
                    className="form-control custom-input"
                  value={currentUser.phoneNumber}
                  onChange={(e) => setCurrentUser({ ...currentUser, phoneNumber: e.target.value })}
                />
              </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>CPF</Form.Label>
                <MaskedInput
                  mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]}
                    className="form-control custom-input"
                  value={currentUser.cpf}
                  onChange={(e) => setCurrentUser({ ...currentUser, cpf: e.target.value })}
                />
              </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Nome de Usuário</Form.Label>
                <Form.Control
                  type="text"
                  value={currentUser.username}
                  onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                    className="custom-input"
                />
              </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Setor</Form.Label>
                <Form.Select
                  value={currentUser.sectorId}
                  onChange={(e) => setCurrentUser({ ...currentUser, sectorId: e.target.value })}
                    className="custom-input"
                >
                  <option value="">Selecione um setor</option>
                  {sectors.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Permissão Administrador</Form.Label>
                <div>
                  <ToggleButtonGroup
                    type="radio"
                    name="isAdmin"
                    value={currentUser.isAdmin ? 1 : 0}
                    onChange={(val) => setCurrentUser({ ...currentUser, isAdmin: val === 1 })}
                  >
                      <ToggleButton id="tbg-edit-1" value={1} variant={currentUser.isAdmin ? "primary" : "light"}>
                      Sim
                    </ToggleButton>
                      <ToggleButton id="tbg-edit-2" value={0} variant={currentUser.isAdmin ? "light" : "primary"}>
                      Não
                    </ToggleButton>
                  </ToggleButtonGroup>
                </div>
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
            <h4>Tem certeza que deseja excluir este usuário?</h4>
            <p className="mb-0">
              {itemToDelete && `${itemToDelete.name} (${itemToDelete.username})`}
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
            <Modal.Title>Operação Concluída</Modal.Title>
          </Modal.Header>
          <Modal.Body className="modal-custom-body text-center py-4">
            <div className="success-icon-container mb-3">
              <span className="success-icon">✓</span>
            </div>
            <h4>Operação realizada com sucesso!</h4>
            <p>Os dados foram atualizados no sistema.</p>
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

export default UsersPanel;
