import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import SideMenu from '../side-menu';
import '../../css/requestItem.css';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet } from 'react-icons/bs';
import { MdDelete } from 'react-icons/md';
import * as XLSX from 'xlsx';
import { API_URL_GLOBAL } from '../../../api-config';

const RequestItem = ({ username, onLogout }) => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [stockItems, setStockItems] = useState([]); // Para itens do estoque
    const [requestedItems, setRequestedItems] = useState([]); // Para itens solicitados
    const id = localStorage.getItem('id');
    const [formData, setFormData] = useState({
        productId: '',
        userId: id,
        userSectorName: '',
        quantity: '',
        dataSolicitacao: new Date().toISOString().split('T')[0]
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("Erro ao enviar solicitação. Por favor, tente novamente.");

    // Atualizar o useEffect para buscar itens do estoque
    useEffect(() => {
        const fetchStockItems = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${API_URL_GLOBAL}/Product`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const formattedItems = response.data.map(item => ({
                    id: item.id,
                    nomeProduto: item.name,
                    quantidade: item.quantity,
                }));
                setStockItems(formattedItems);
            } catch (error) {
                console.error('Erro ao buscar itens do estoque:', error);
            }
        };

        const fetchRequestedItems = async () => {
            try {
                const response = await axios.get(`${API_URL_GLOBAL}/ProductRequest`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setRequestedItems(response.data);
            } catch (error) {
                console.error('Erro ao buscar solicitações:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStockItems();
        fetchRequestedItems();
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
            const requestData = {
                userId: formData.userId,
                productId: formData.productId,
                quantity: parseInt(formData.quantity)
            };

            const response = await axios.post(`${API_URL_GLOBAL}/ProductRequest`, requestData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 200 || response.status === 201) {
                setShowSuccessModal(true);
                setShowModal(false);

                // Resetar formulário
                setFormData({
                    productId: '',
                    userId: id,
                    userSectorName: '',
                    quantity: '',
                    dataSolicitacao: new Date().toISOString().split('T')[0]
                });

                // Recarregar a lista de solicitações
                await reloadRequests();
            }
        } catch (error) {
            console.error('Erro ao enviar solicitação:', error);
            // Capturar mensagem de erro do backend
            if (error.response && error.response.data) {
                // Verifica se é o erro específico de quantidade
                if (typeof error.response.data === 'string' && error.response.data.includes('quantidade')) {
                    setErrorMessage(error.response.data);
                } else if (error.response.data.message) {
                    setErrorMessage(error.response.data.message);
                } else if (typeof error.response.data === 'string') {
                    setErrorMessage(error.response.data);
                }
            }
            setShowErrorModal(true); // Mostrar modal de erro
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handleEdit = (item) => {
        setItemToEdit(item);
        setShowEditModal(true);
    };

    const handleDelete = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            // Fazer a requisição DELETE para a API
            await axios.delete(`${API_URL_GLOBAL}/ProductRequest/${itemToDelete.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Atualizar o estado local após a exclusão
            const updatedItems = requestedItems.filter(item => item.id !== itemToDelete.id);
            setRequestedItems(updatedItems);
            setShowDeleteModal(false);

            // Mostrar feedback ao usuário (opcional)
            // setShowSuccessMessage("Solicitação excluída com sucesso");
        } catch (error) {
            console.error('Erro ao excluir solicitação:', error);
            // Mostrar mensagem de erro (opcional)
            // setShowErrorMessage("Erro ao excluir solicitação");
        }
    };

    const handleSaveEdit = async () => {
        try {
            // Criar objeto com os dados atualizados
            const updatedData = {
                quantity: parseInt(itemToEdit.quantity) // Assumindo que estamos editando a quantidade
                // Adicione outros campos que podem ser editáveis
            };

            // Fazer a requisição PUT para a API
            await axios.put(`${API_URL_GLOBAL}/ProductRequest/${itemToEdit.id}`, updatedData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Atualizar o estado local
            const updatedItems = requestedItems.map(item =>
                item.id === itemToEdit.id ? { ...item, ...updatedData } : item
            );
            setRequestedItems(updatedItems);
            setShowEditModal(false);

            // Mostrar feedback ao usuário (opcional)
            // setShowSuccessMessage("Solicitação atualizada com sucesso");
        } catch (error) {
            console.error('Erro ao editar solicitação:', error);
            // Capturar mensagem de erro do backend
            if (error.response && error.response.data) {
                // Verifica se é o erro específico de quantidade
                if (typeof error.response.data === 'string' && error.response.data.includes('quantidade')) {
                    setErrorMessage(error.response.data);
                } else if (error.response.data.message) {
                    setErrorMessage(error.response.data.message);
                } else if (typeof error.response.data === 'string') {
                    setErrorMessage(error.response.data);
                } else {
                    setErrorMessage("Erro ao editar solicitação. Por favor, tente novamente.");
                }
            } else {
                setErrorMessage("Erro ao editar solicitação. Por favor, tente novamente.");
            }

            setShowEditModal(false); // Fechar modal de edição
            setShowErrorModal(true); // Mostrar modal de erro
        }
    };

    const filteredRequestedItems = requestedItems.filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Adicione a função de exportação para Excel
    const exportToExcel = () => {
        const dataToExport = filteredRequestedItems.map(item => ({
            'Produto': item.productName,
            'Solicitante': item.userName,
            'Setor': item.userSector.name,
            'Quantidade': item.quantity,
            'Data de Solicitação': formatDate(item.createdAt)
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Solicitações");

        const fileName = `solicitacoes_${new Date().toLocaleDateString()}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Adicione a função de ordenação
    const sortItems = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedItems = [...requestedItems].sort((a, b) => {
            if (a[key] < b[key]) return direction === 'ascending' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setRequestedItems(sortedItems);
    };

    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <FaSort />;
        return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    };

    // Lógica de paginação
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRequestedItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRequestedItems.length / itemsPerPage);

    const handleCloseModal = () => {
        window.location.reload(); // Recarregar a página
    };

    // Função para recarregar as solicitações após uma operação
    const reloadRequests = async () => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${API_URL_GLOBAL}/ProductRequest`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setRequestedItems(response.data);
        } catch (error) {
            console.error('Erro ao buscar solicitações:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="d-flex">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="flex-grow-1 p-4">
                <h1 className="text-center">Solicitar Item</h1>

                {/* Barra de pesquisa e botões */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="search-container position-relative">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar solicitação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div>
                        <Button variant="primary" onClick={() => setShowModal(true)} className="me-2">
                            Solicitar Produto
                        </Button>
                        <Button variant="secondary" onClick={() => navigate('/stock-panel')} className="me-2">
                            Ver Painel de Estoque
                        </Button>
                        <Button variant="success" onClick={exportToExcel} >
                            <BsFileEarmarkSpreadsheet className='mb-1 me-2' />
                            Relatório
                        </Button>
                    </div>
                </div>

                {/* Tabela de Solicitações */}
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr className="text-uppercase">
                                <th className="text-center fw-bold" onClick={() => sortItems('productName')} style={{ cursor: 'pointer' }}>
                                    Produto {getSortIcon('productName')}
                                </th>
                                <th className="text-center fw-bold" onClick={() => sortItems('userName')} style={{ cursor: 'pointer' }}>
                                    Solicitante {getSortIcon('userName')}
                                </th>
                                <th className="text-center fw-bold" onClick={() => sortItems('userSector.name')} style={{ cursor: 'pointer' }}>
                                    Setor {getSortIcon('userSector.name')}
                                </th>
                                <th className="text-center fw-bold" onClick={() => sortItems('quantity')} style={{ cursor: 'pointer' }}>
                                    Quantidade {getSortIcon('quantity')}
                                </th>
                                <th className="text-center fw-bold" onClick={() => sortItems('createdAt')} style={{ cursor: 'pointer' }}>
                                    Data {getSortIcon('createdAt')}
                                </th>
                                {localStorage.getItem('isAdmin') === 'true' && (
                                    <th className="text-center fw-bold">Ações</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={localStorage.getItem('isAdmin') === 'true' ? 6 : 5} className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Carregando...</span>
                                        </div>
                                        <p className="mt-2 mb-0">Carregando solicitações...</p>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={localStorage.getItem('isAdmin') === 'true' ? 6 : 5} className="text-center py-4">
                                        <p className="mb-0">Nenhuma solicitação encontrada.</p>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="align-middle text-center">{item.productName}</td>
                                        <td className="align-middle text-center">{item.userName}</td>
                                        <td className="align-middle text-center">{item.userSector.name}</td>
                                        <td className="align-middle text-center">{item.quantity}</td>
                                        <td className="align-middle text-center">{formatDate(item.createdAt)}</td>
                                        {localStorage.getItem('isAdmin') === 'true' && (
                                            <td className="align-middle text-center">
                                                <button className="btn btn-primary btn-sm m-1" onClick={() => handleEdit(item)}>
                                                    <FaEdit />
                                                </button>
                                                <button className="btn btn-danger btn-sm m-1" onClick={() => handleDelete(item)}>
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

                {/* Paginação */}
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredRequestedItems.length)} de {filteredRequestedItems.length} solicitações
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

                {/* Modal de Solicitação */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Solicitar Produto</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="productId" className="form-label">Produto:</label>
                                <select
                                    className="form-control"
                                    id="productId"
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Selecione um produto</option>
                                    {stockItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.nomeProduto}: {item.quantidade} unidades disponíveis
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="quantity" className="form-label">
                                    Quantidade:
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="quantity"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    min="1"
                                    max={stockItems.find(item => item.id === parseInt(formData.productId))?.quantidade}
                                    required
                                />
                            </div>
                            <Button variant="primary" type="submit">
                                Enviar Solicitação
                            </Button>
                        </form>
                    </Modal.Body>
                </Modal>

                {/* Modal de Edição */}
                <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Editar Solicitação</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {itemToEdit && (
                            <form>
                                <div className="mb-3">
                                    <label className="form-label">Quantidade</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={itemToEdit.quantity}
                                        onChange={(e) => setItemToEdit({
                                            ...itemToEdit,
                                            quantity: e.target.value
                                        })}
                                        min="1"
                                        max={stockItems.find(item => item.id === itemToEdit.productId)?.quantidade || 999}
                                    />
                                </div>
                            </form>
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
                        Tem certeza que deseja excluir esta solicitação?
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

                {/* Modal de Sucesso */}
                <Modal show={showSuccessModal} onHide={handleCloseModal} centered>
                    <Modal.Header closeButton className="bg-success text-white">
                        <Modal.Title>Sucesso</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-success text-white">
                        Solicitação enviada com sucesso!
                    </Modal.Body>
                    <Modal.Footer className="bg-success">
                        <Button variant="light" onClick={handleCloseModal}>
                            Fechar
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Modal de Erro */}
                <Modal show={showErrorModal} onHide={handleCloseModal} centered>
                    <Modal.Header closeButton className="bg-danger text-white">
                        <Modal.Title>Erro</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="bg-danger text-white">
                        {errorMessage}
                    </Modal.Body>
                    <Modal.Footer className="bg-danger">
                        <Button variant="light" onClick={handleCloseModal}>
                            Fechar
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default RequestItem;