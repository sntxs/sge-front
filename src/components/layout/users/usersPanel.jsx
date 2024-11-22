import React, { useState, useEffect } from 'react';
import SideMenu from '../side-menu';
import axios from 'axios';
import '../../css/usersPanel.css';
import { Modal, Button, Form, ToggleButton, ToggleButtonGroup, Alert } from 'react-bootstrap';
import MaskedInput from 'react-text-mask';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { API_URL_GLOBAL } from '../../../api-config.jsx';
import { MdDelete } from 'react-icons/md';
import * as XLSX from 'xlsx';

function UsersPanel({ username, onLogout }) {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    cpf: '',
    username: '',
    password: '',
    sectorName: '',
    isAdmin: false,
  });
  const [showAlert, setShowAlert] = useState(false);
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);


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

      console.log({ ...formData, cpf: cleanCPF, phoneNumber: cleanPhoneNumber });

      const response = await axios.post(`${API_URL_GLOBAL}/User`, {
        name: formData.name,
        email: formData.email,
        phoneNumber: cleanPhoneNumber,
        cpf: cleanCPF,
        username: formData.username,
        password: formData.password,
        isAdmin: formData.isAdmin,
        sectorName: formData.sectorName
      },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (response.status === 200) {
        console.log('Usuário adicionado com sucesso');
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          cpf: '',
          username: '',
          password: '',
          isAdmin: false,
          sectorName: ''
        });
        setShowModal(false);
        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
          window.location.reload();
        }, 3000);
      } else {
        console.error('Erro ao adicionar usuário');
      }
    } catch (error) {
      console.error('Erro ao conectar com o banco:', error);
    }
  };


  /*   const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState(''); */

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${API_URL_GLOBAL}/User/`, {
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

  const handleEdit = (user) => {
    setCurrentUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setCurrentUser(user);
    setShowDeleteModal(true);
  };

  const handleSaveEdit = async () => {
    /*     if (password !== confirmPassword) {
          setPasswordError('As senhas não coincidem!');
          return;
        } */

    try {
      const cleanCPF = currentUser.cpf.replace(/\D/g, '');
      const cleanPhoneNumber = currentUser.phoneNumber.replace(/\D/g, '');

      await axios.put(`${API_URL_GLOBAL}/User/${currentUser.id}`, {
        ...currentUser,
        cpf: cleanCPF,
        phoneNumber: cleanPhoneNumber,
        //password: formData.password || undefined,
        isAdmin: currentUser.isAdmin, // Adicionando a permissão de administrador
        sectorName: currentUser.sectorName,

      },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setShowEditModal(false);
      setShowEditAlert(true);
      setTimeout(() => {
        setShowEditAlert(false);
        window.location.reload();
      }, 3000);
      // resetPasswordFields();
      // Atualizar a lista de usuários
      const response = await axios.get(`${API_URL_GLOBAL}/User/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao editar usuário:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`${API_URL_GLOBAL}/User/${currentUser.id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setShowDeleteModal(false);
      setShowDeleteAlert(true);
      setTimeout(() => {
        setShowDeleteAlert(false);
        window.location.reload();
      }, 3000);
      // Atualizar a lista de usuários
      const response = await axios.get(`${API_URL_GLOBAL}/User/`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
  };

  /*   const resetPasswordFields = () => {
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }; */

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    // resetPasswordFields();
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm) ||
    user.cpf.includes(searchTerm) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    // Preparar os dados para exportação
    const dataToExport = filteredUsers.map(user => ({
      'Nome': user.name,
      'Email': user.email,
      'Telefone': user.phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'),
      'CPF': user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      'Nome de Usuário': user.username,
      'Administrador': user.isAdmin ? 'Sim' : 'Não'
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
    ];
    ws['!cols'] = columnWidths;

    // Estilizar cabeçalhos
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellRef]) continue;

      ws[cellRef].s = {
        font: {
          bold: true,
          sz: 20,
          color: { rgb: "000000" }
        },
        fill: {
          fgColor: { rgb: "CCCCCC" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: { style: "medium" },
          bottom: { style: "medium" },
          left: { style: "medium" },
          right: { style: "medium" }
        }
      };
    }

    // Aplicar borda e alinhamento em todas as células
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
      if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
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
    <div className="d-flex">
      <SideMenu username={username} onLogout={onLogout} />
      <div className="flex-grow-1 p-4">
        <h1 className="text-center">Painel de Usuários</h1>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="search-container position-relative">
            <FaSearch className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="d-flex">
            <button
              className="btn btn-primary me-2"
              onClick={() => setShowModal(true)}
            >
              Adicionar Usuário
            </button>
            <button
              className="btn btn-success ml-2"
              onClick={exportToExcel}
            >
              <BsFileEarmarkSpreadsheet className='mb-1 me-2' />
              Relatório
            </button>
          </div>
        </div>

        {/* Modal de Adição */}
        <div className="d-flex">
          <Modal
            show={showModal}
            onHide={() => setShowModal(false)}
            dialogClassName="modal-90w"
            aria-labelledby="example-custom-modal-styling-title"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title id="example-custom-modal-styling-title">Adicionar Usuário</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Nome</label>
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
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
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
                    className="form-control"
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
                      className="form-control"
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
                  <label htmlFor="sectorName" className="form-label">Setor</label>
                  <input
                    type="text"
                    className="form-control"
                    id="sectorName"
                    name="sectorName"
                    value={formData.sectorName}
                    onChange={handleInputChange}
                    required
                  />
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
                      <ToggleButton id="tbg-radio-1" value={1} variant={formData.isAdmin ? "primary" : "light"} className={formData.isAdmin ? "toggle-button-primary" : "toggle-button-light"}>
                        Sim
                      </ToggleButton>
                      <ToggleButton id="tbg-radio-2" value={0} variant={formData.isAdmin ? "light" : "primary"} className={formData.isAdmin ? "toggle-button-light" : "toggle-button-primary"}>
                        Não
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </div>
                </div>
                <Modal.Footer>
                  <Button className='right' variant="primary" type="submit">
                    Cadastrar
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Body>
          </Modal>
          {showAlert && (
            <Alert variant="success" className="mt-3">
              Usuário cadastrado com sucesso! A página será recarregada em 3 segundos.
            </Alert>
          )}
        </div>

        {/* Tabela de Usuários */}
        <table className="table table-striped">
          <thead>
            <tr className='text-uppercase'>
              <th className="text-center fw-bold" onClick={() => sortItems('name')} style={{ cursor: 'pointer' }}>
                Nome {getSortIcon('name')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('email')} style={{ cursor: 'pointer' }}>
                Email {getSortIcon('email')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('phoneNumber')} style={{ cursor: 'pointer' }}>
                Telefone {getSortIcon('phoneNumber')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('cpf')} style={{ cursor: 'pointer' }}>
                CPF {getSortIcon('cpf')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('username')} style={{ cursor: 'pointer' }}>
                Nome de Usuário {getSortIcon('username')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('sectorName')} style={{ cursor: 'pointer' }}>
                Setor {getSortIcon('sectorName')}
              </th>
              <th className="text-center fw-bold" onClick={() => sortItems('isAdmin')} style={{ cursor: 'pointer' }}>
                Permissão de Administrador {getSortIcon('isAdmin')}
              </th>
              <th className="text-center fw-bold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id}>
                <td className="align-middle text-center">{user.name}</td>
                <td className="align-middle text-center">{user.email}</td>
                <td className="align-middle text-center">{user.phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')}</td>
                <td className="align-middle text-center">{user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</td>
                <td className="align-middle text-center">{user.username}</td>
                <td className="align-middle text-center">{user.sectorName}</td>
                <td className="align-middle text-center">{user.isAdmin ? 'Sim' : 'Não'}</td>
                <td className="align-middle text-center">
                  <button className="btn btn-primary btn-sm m-1" onClick={() => handleEdit(user)}>
                    <FaEdit />
                  </button>
                  <button className="btn btn-danger btn-sm m-1" onClick={() => handleDelete(user)}>
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
            Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} de {filteredUsers.length} usuários
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

      {/* Modal de Edição */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <Form onKeyPress={handleKeyPress}>
              <Form.Group controlId="formName">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  value={currentUser.name}
                  onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={currentUser.email}
                  onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formPhoneNumber">
                <Form.Label>Telefone</Form.Label>
                <MaskedInput
                  mask={['(', /[1-9]/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
                  className="form-control"
                  value={currentUser.phoneNumber}
                  onChange={(e) => setCurrentUser({ ...currentUser, phoneNumber: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formCpf">
                <Form.Label>CPF</Form.Label>
                <MaskedInput
                  mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]}
                  className="form-control"
                  value={currentUser.cpf}
                  onChange={(e) => setCurrentUser({ ...currentUser, cpf: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formUsername">
                <Form.Label>Nome de Usuário</Form.Label>
                <Form.Control
                  type="text"
                  value={currentUser.username}
                  onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                />
              </Form.Group>
              {/*               <Form.Group controlId="formPassword">
                <Form.Label>Senha</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {passwordError && <div style={{ color: 'red' }}>{passwordError}</div>}
              </Form.Group>
              <Form.Group controlId="formConfirmPassword">
                <Form.Label>Confirmar Senha</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </Form.Group> */}
              <Form.Group controlId="formSector">
                <Form.Label>Setor</Form.Label>
                <Form.Control
                  type="text"
                  value={currentUser.sectorName}
                  onChange={(e) => setCurrentUser({ ...currentUser, sectorName: e.target.value })}
                />
              </Form.Group>
              <Form.Group controlId="formIsAdmin">
                <Form.Label>Permissão Administrador</Form.Label>
                <div>
                  <ToggleButtonGroup
                    type="radio"
                    name="isAdmin"
                    value={currentUser.isAdmin ? 1 : 0}
                    onChange={(val) => setCurrentUser({ ...currentUser, isAdmin: val === 1 })}
                  >
                    <ToggleButton id="tbg-radio-1" value={1} variant={currentUser.isAdmin ? "primary" : "light"} className={currentUser.isAdmin ? "toggle-button-primary" : "toggle-button-light"}>
                      Sim
                    </ToggleButton>
                    <ToggleButton id="tbg-radio-2" value={0} variant={currentUser.isAdmin ? "light" : "primary"} className={currentUser.isAdmin ? "toggle-button-light" : "toggle-button-primary"}>
                      Não
                    </ToggleButton>
                  </ToggleButtonGroup>
                </div>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveEdit}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
      {showEditAlert && (
        <Alert variant="success" className="mt-3">
          Usuário editado com sucesso! A página será recarregada em 3 segundos.
        </Alert>
      )}

      {showDeleteAlert && (
        <Alert variant="success" className="mt-3">
          Usuário deletado com sucesso! A página será recarregada em 3 segundos.
        </Alert>
      )}

      {/* Modal de Confirmação de Deleção */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Deleção</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja deletar o usuário {currentUser && currentUser.name}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Deletar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UsersPanel;
