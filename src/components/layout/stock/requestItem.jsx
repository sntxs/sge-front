import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import SideMenu from '../side-menu';
import '../../css/requestItem.css';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch, FaBoxOpen, FaCheck, FaFilter, FaUndo } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet } from 'react-icons/bs';
import { MdDelete, MdInventory, MdFilterList } from 'react-icons/md';
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
    const [sortConfig, setSortConfig] = useState({ key: 'delivered', direction: 'ascending' });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("Erro ao enviar solicitação. Por favor, tente novamente.");
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackError, setFeedbackError] = useState(false);
    const [showConfirmDeliveryModal, setShowConfirmDeliveryModal] = useState(false);
    const [itemToDeliver, setItemToDeliver] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'delivered'
    const [showCancelDeliveryModal, setShowCancelDeliveryModal] = useState(false);
    const [itemToCancelDelivery, setItemToCancelDelivery] = useState(null);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    // Temporary filter states
    const [tempStatusFilter, setTempStatusFilter] = useState('all');
    const [tempSelectedCategory, setTempSelectedCategory] = useState('');

    // Atualizar o useEffect para ordenar os itens após buscar
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
                    categoryName: item.categoryName || 'Sem categoria',
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

                // Ordena os itens com pendentes primeiro
                const sortedItems = response.data.sort((a, b) => {
                    if (a.delivered === b.delivered) return 0;
                    return a.delivered ? 1 : -1; // Coloca pendentes (false) primeiro
                });

                setRequestedItems(sortedItems);
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

            // Mostrar feedback ao usuário
            setFeedbackMessage("Solicitação excluída com sucesso!");
            setFeedbackError(false);
            setShowFeedbackModal(true);
        } catch (error) {
            console.error('Erro ao excluir solicitação:', error);
            // Mostrar mensagem de erro
            setFeedbackMessage("Erro ao excluir solicitação. Por favor, tente novamente.");
            setFeedbackError(true);
            setShowFeedbackModal(true);
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

            // Mostrar feedback ao usuário
            setFeedbackMessage("Solicitação atualizada com sucesso!");
            setFeedbackError(false);
            setShowFeedbackModal(true);
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

    // Adicione a função de ordenação
    const sortItems = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedItems = [...requestedItems].sort((a, b) => {
            // Ordenação especial para o campo 'delivered'
            if (key === 'delivered') {
                if (direction === 'ascending') {
                    // Pendentes primeiro, depois entregues
                    return a.delivered === b.delivered ? 0 : a.delivered ? 1 : -1;
                } else {
                    // Entregues primeiro, depois pendentes
                    return a.delivered === b.delivered ? 0 : a.delivered ? -1 : 1;
                }
            }

            // Ordenação padrão para outros campos
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

    // Função para filtrar por status
    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1); // Resetar para a primeira página ao mudar o filtro
    };

    // First, let's create a function to get unique categories with IDs from stock items
    const getUniqueCategories = () => {
        const uniqueCategories = [];
        const categoryIds = new Set();

        stockItems.forEach(item => {
            if (item.categoryId && !categoryIds.has(item.categoryId)) {
                categoryIds.add(item.categoryId);
                uniqueCategories.push({
                    id: item.categoryId,
                    name: item.categoryName || 'Sem categoria'
                });
            }
        });

        return uniqueCategories;
    };

    // Update applyFilters to correctly handle categoryId
    const applyFilters = () => {
        let filtered = [...requestedItems];

        // Filtrar por nome de produto
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.productName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por status
        if (statusFilter !== 'all') {
            const isDelivered = statusFilter === 'delivered';
            filtered = filtered.filter(item => item.delivered === isDelivered);
        }

        // Filtrar por categoria
        if (selectedCategory) {
            filtered = filtered.filter(item =>
                item.categoryId === selectedCategory ||
                item.categoryName === selectedCategory
            );
        }

        return filtered;
    };

    // Função de exportação para Excel
    const exportToExcel = () => {
        const filteredItems = applyFilters();
        const dataToExport = filteredItems.map(item => ({
            'Produto': item.productName,
            'Categoria': item.categoryName || 'Sem categoria',
            'Solicitante': item.userName,
            'Setor': item.userSector.name,
            'Quantidade': item.quantity,
            'Status': item.delivered ? 'Entregue' : 'Pendente',
            'Data de Solicitação': formatDate(item.createdAt),
            'Data de Entrega': item.delivered ? formatDate(item.deliveredAt) : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Solicitações");

        const fileName = `solicitacoes_${new Date().toLocaleDateString()}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Lógica de paginação com filtros aplicados
    const filteredItems = applyFilters();
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const handleCloseModal = () => {
        window.location.reload(); // Recarregar a página
    };

    const handleCloseFeedback = () => {
        setShowFeedbackModal(false);
        if (!feedbackError) {
            window.location.reload();
        }
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

    // Função para lidar com a confirmação de entrega
    const handleConfirmDelivery = (item) => {
        setItemToDeliver(item);
        setShowConfirmDeliveryModal(true);
    };

    // Função para processar a entrega
    const processDelivery = async () => {
        try {
            // Chamada para a API para finalizar a solicitação e dar baixa no estoque
            const response = await axios.put(`${API_URL_GLOBAL}/ProductRequest/${itemToDeliver.id}/deliver`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Atualizar o estado local após a entrega
            await reloadRequests();
            setShowConfirmDeliveryModal(false);

            // Mostrar feedback ao usuário
            setFeedbackMessage("Entrega confirmada com sucesso!");
            setFeedbackError(false);
            setShowFeedbackModal(true);
        } catch (error) {
            console.error('Erro ao confirmar entrega:', error);

            // Capturar mensagem de erro do backend
            let errorMsg = "Erro ao confirmar entrega. Por favor, tente novamente.";
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMsg = error.response.data;
                } else if (error.response.data.message) {
                    errorMsg = error.response.data.message;
                }
            }

            setFeedbackMessage(errorMsg);
            setFeedbackError(true);
            setShowFeedbackModal(true);
            setShowConfirmDeliveryModal(false);
        }
    };

    // Função para lidar com o cancelamento de entrega
    const handleCancelDelivery = (item) => {
        setItemToCancelDelivery(item);
        setShowCancelDeliveryModal(true);
    };

    // Função para processar o cancelamento da entrega
    const processCancelDelivery = async () => {
        try {
            // Chamada para a API para cancelar a entrega e retornar os itens ao estoque
            const response = await axios.put(`${API_URL_GLOBAL}/ProductRequest/${itemToCancelDelivery.id}/cancel-delivery`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Atualizar o estado local após o cancelamento
            await reloadRequests();
            setShowCancelDeliveryModal(false);

            // Mostrar feedback ao usuário
            setFeedbackMessage("Entrega cancelada com sucesso!");
            setFeedbackError(false);
            setShowFeedbackModal(true);
        } catch (error) {
            console.error('Erro ao cancelar entrega:', error);

            // Capturar mensagem de erro do backend
            let errorMsg = "Erro ao cancelar entrega. Por favor, tente novamente.";
            if (error.response && error.response.data) {
                if (typeof error.response.data === 'string') {
                    errorMsg = error.response.data;
                } else if (error.response.data.message) {
                    errorMsg = error.response.data.message;
                }
            }

            setFeedbackMessage(errorMsg);
            setFeedbackError(true);
            setShowFeedbackModal(true);
            setShowCancelDeliveryModal(false);
        }
    };

    return (
        <div className="request-container">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="request-content">
                <div className="header-card">
                    <div className="header-content">
                        <div className="header-icon">
                            <MdInventory size={40} />
                        </div>
                        <div>
                            <h1 className="text-center mb-0">Solicitar Item</h1>
                            <p className="text-center mb-0">Solicite produtos do estoque de forma simples</p>
                        </div>
                    </div>
                </div>

                <div className="control-panel">
                    <div className="search-and-filter">
                        <div className="search-container">
                            <div className="search-wrapper">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Buscar solicitação..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="filter-dropdown-container">
                                    <button
                                        className="filter-button"
                                        onClick={() => {
                                            // Initialize temp states with current values when opening
                                            if (!showFilterDropdown) {
                                                setTempStatusFilter(statusFilter);
                                                setTempSelectedCategory(selectedCategory);
                                            }
                                            setShowFilterDropdown(!showFilterDropdown);
                                        }}
                                    >
                                        <MdFilterList size={20} />
                                    </button>

                                    {showFilterDropdown && (
                                        <div className="filter-dropdown">
                                            <div className="filter-header">Filtrar por:</div>

                                            <div className="filter-section">
                                                <div className="filter-title">Status do Pedido</div>
                                                <div className="filter-option">
                                                    <input
                                                        type="radio"
                                                        id="statusAll"
                                                        name="statusFilter"
                                                        checked={tempStatusFilter === 'all'}
                                                        onChange={() => setTempStatusFilter('all')}
                                                    />
                                                    <label htmlFor="statusAll">Todos</label>
                                                </div>
                                                <div className="filter-option">
                                                    <input
                                                        type="radio"
                                                        id="statusPending"
                                                        name="statusFilter"
                                                        checked={tempStatusFilter === 'pending'}
                                                        onChange={() => setTempStatusFilter('pending')}
                                                    />
                                                    <label htmlFor="statusPending">Pendentes</label>
                                                </div>
                                                <div className="filter-option">
                                                    <input
                                                        type="radio"
                                                        id="statusDelivered"
                                                        name="statusFilter"
                                                        checked={tempStatusFilter === 'delivered'}
                                                        onChange={() => setTempStatusFilter('delivered')}
                                                    />
                                                    <label htmlFor="statusDelivered">Entregues</label>
                                                </div>
                                            </div>

                                            <div className="filter-section">
                                                <div className="filter-title">Categoria</div>
                                                <select
                                                    className="form-control custom-input mt-2"
                                                    value={tempSelectedCategory}
                                                    onChange={(e) => setTempSelectedCategory(e.target.value)}
                                                >
                                                    <option value="">Todas as categorias</option>
                                                    {getUniqueCategories().map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="filter-footer">
                                                <button
                                                    className="btn btn-sm btn-outline-secondary"
                                                    onClick={() => {
                                                        setTempStatusFilter('all');
                                                        setTempSelectedCategory('');
                                                    }}
                                                >
                                                    Limpar Filtros
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={() => {
                                                        // Apply filters when clicking apply
                                                        setStatusFilter(tempStatusFilter);
                                                        setSelectedCategory(tempSelectedCategory);
                                                        setShowFilterDropdown(false);
                                                        setCurrentPage(1); // Reset to first page when applying filters
                                                    }}
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="filters-actions-container">
                        <div className="filters-wrapper">
                            {(statusFilter !== 'all' || selectedCategory) && (
                                <div className="filter-active-alert">
                                    {statusFilter === 'pending' && (
                                        <span className="status-badge pending me-2">Pendentes</span>
                                    )}
                                    {statusFilter === 'delivered' && (
                                        <span className="status-badge delivered me-2">Entregues</span>
                                    )}
                                    {selectedCategory && (
                                        <span className="category-badge me-2">
                                            Categoria: {getUniqueCategories().find(c => c.id === selectedCategory)?.name || selectedCategory}
                                        </span>
                                    )}
                                    <button
                                        className="btn btn-sm btn-outline-secondary ms-2"
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setSelectedCategory('');
                                        }}
                                    >
                                        <FaFilter className="me-1" /> Limpar filtros
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="action-buttons">
                            <button
                                className="btn btn-request"
                                onClick={() => setShowModal(true)}
                            >
                                <FaBoxOpen className='me-2' />
                                Solicitar Produto
                            </button>
                            <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate('/stock-panel')}
                            >
                                Painel de Estoque
                            </button>
                            <button
                                className="btn btn-rel"
                                onClick={exportToExcel}
                            >
                                <BsFileEarmarkSpreadsheet className='me-2' />
                                Relatório
                            </button>
                        </div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="request-table">
                        <thead>
                            <tr>
                                <th onClick={() => sortItems('productName')}>
                                    <div className="th-content">
                                        Produto
                                        <span className="sort-icon">{getSortIcon('productName')}</span>
                                    </div>
                                </th>
                                <th onClick={() => sortItems('categoryName')}>
                                    <div className="th-content">
                                        Categoria
                                        <span className="sort-icon">{getSortIcon('categoryName')}</span>
                                    </div>
                                </th>
                                <th onClick={() => sortItems('userName')}>
                                    <div className="th-content">
                                        Solicitante
                                        <span className="sort-icon">{getSortIcon('userName')}</span>
                                    </div>
                                </th>
                                <th onClick={() => sortItems('userSector.name')}>
                                    <div className="th-content">
                                        Setor
                                        <span className="sort-icon">{getSortIcon('userSector.name')}</span>
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
                                        Data de Solicitação
                                        <span className="sort-icon">{getSortIcon('createdAt')}</span>
                                    </div>
                                </th>
                                <th onClick={() => sortItems('status')}>
                                    <div className="th-content">
                                        Status
                                        <span className="sort-icon">{getSortIcon('status')}</span>
                                    </div>
                                </th>
                                <th onClick={() => sortItems('deliveredAt')}>
                                    <div className="th-content">
                                        Data de Entrega
                                        <span className="sort-icon">{getSortIcon('deliveredAt')}</span>
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
                                    <td colSpan={localStorage.getItem('isAdmin') === 'true' ? 9 : 8} className="text-center py-4">
                                        <div className="spinner">
                                            <div className="bounce1"></div>
                                            <div className="bounce2"></div>
                                            <div className="bounce3"></div>
                                        </div>
                                        <p className="mt-2 mb-0">Carregando solicitações...</p>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={localStorage.getItem('isAdmin') === 'true' ? 9 : 8} className="text-center py-4">
                                        <div className="empty-state">
                                            <MdInventory size={48} className="empty-icon" />
                                            <p className="mb-0">Nenhuma solicitação encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item, index) => (
                                    <tr key={index} className="request-row">
                                        <td>{item.productName}</td>
                                        <td>{item.categoryName || 'Sem categoria'}</td>
                                        <td>{item.userName}</td>
                                        <td>{item.userSector.name}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatDate(item.createdAt)}</td>
                                        <td>
                                            <span className={`status-badge ${item.delivered ? 'delivered' : 'pending'}`}>
                                                {item.delivered ? 'Entregue' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td>
                                            {item.delivered ? formatDate(item.deliveredAt) : '-'}
                                        </td>
                                        {localStorage.getItem('isAdmin') === 'true' && (
                                            <td className="action-cell">
                                                {!item.delivered ? (
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>Confirmar Entrega</Tooltip>}
                                                    >
                                                        <button
                                                            className="action-btn confirm-btn"
                                                            onClick={() => handleConfirmDelivery(item)}
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                    </OverlayTrigger>
                                                ) : (
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>Cancelar Entrega</Tooltip>}
                                                    >
                                                        <button
                                                            className="action-btn cancel-delivery-btn"
                                                            onClick={() => handleCancelDelivery(item)}
                                                        >
                                                            <FaUndo />
                                                        </button>
                                                    </OverlayTrigger>
                                                )}
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

                <div className="pagination-container">
                    <div className="showing-info">
                        {filteredItems.length > 0 ? (
                            <>Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredItems.length)} de {filteredItems.length} solicitações</>
                        ) : (
                            <span>Nenhuma solicitação encontrada</span>
                        )}
                    </div>
                    {filteredItems.length > 0 && (
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
                    )}
                </div>

                {/* Modal de Solicitação */}
                <Modal
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    dialogClassName="custom-modal"
                    aria-labelledby="example-custom-modal-styling-title"
                    centered
                >
                    <Modal.Header closeButton className="modal-custom-header">
                        <Modal.Title id="example-custom-modal-styling-title">
                            <FaBoxOpen className="me-2" />
                            Solicitar Produto
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-custom-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="productId" className="form-label">Produto:</label>
                                <select
                                    className="custom-input"
                                    id="productId"
                                    name="productId"
                                    value={formData.productId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Selecione um produto</option>
                                    {stockItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.nomeProduto} ({item.categoryName}) - {item.quantidade} unidades disponíveis
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
                                    className="custom-input"
                                    id="quantity"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
                                    min="1"
                                    max={stockItems.find(item => item.id === parseInt(formData.productId))?.quantidade}
                                    required
                                />
                            </div>
                            <Button variant="primary" type="submit" className="custom-button">
                                Enviar Solicitação
                            </Button>
                        </form>
                    </Modal.Body>
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
                            Editar Solicitação
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-custom-body">
                        {itemToEdit && (
                            <form>
                                <div className="mb-3">
                                    <label className="form-label">Quantidade</label>
                                    <input
                                        type="number"
                                        className="custom-input"
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
                            Tem certeza que deseja excluir esta solicitação?<br />
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

                {/* Modal de Sucesso */}
                <Modal
                    show={showSuccessModal}
                    onHide={handleCloseModal}
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
                        <p className="mt-3">Solicitação enviada com sucesso!</p>
                    </Modal.Body>
                    <Modal.Footer className="modal-custom-footer">
                        <Button variant="success" onClick={handleCloseModal} className="custom-button success-button">
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
                            {errorMessage}
                        </p>
                    </Modal.Body>
                    <Modal.Footer className="modal-custom-footer">
                        <Button variant="danger" onClick={() => setShowErrorModal(false)} className="custom-button error-button">
                            Fechar
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

                {/* Modal de Confirmação de Entrega */}
                <Modal
                    show={showConfirmDeliveryModal}
                    onHide={() => setShowConfirmDeliveryModal(false)}
                    centered
                    className="confirmation-modal"
                >
                    <Modal.Header closeButton className="modal-custom-header">
                        <Modal.Title>
                            <FaCheck className="me-2" />
                            Confirmar Entrega
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-custom-body">
                        <div className="text-center mb-3">
                            <div className="confirm-icon-container">
                                <FaCheck size={40} />
                            </div>
                        </div>
                        {itemToDeliver && (
                            <div>
                                <p className="text-center">
                                    Confirmar entrega do produto <strong>{itemToDeliver.productName}</strong> para o setor <strong>{itemToDeliver.userSector.name}</strong>?
                                </p>
                                <p className="text-center text-warning">
                                    <strong>Atenção:</strong> Esta ação dará baixa de <strong>{itemToDeliver.quantity}</strong> unidades no estoque.
                                </p>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="modal-custom-footer">
                        <Button variant="secondary" onClick={() => setShowConfirmDeliveryModal(false)} className="custom-button cancel-button">
                            Cancelar
                        </Button>
                        <Button variant="success" onClick={processDelivery} className="custom-button confirm-button">
                            Confirmar Entrega
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Modal de Cancelamento de Entrega */}
                <Modal
                    show={showCancelDeliveryModal}
                    onHide={() => setShowCancelDeliveryModal(false)}
                    centered
                    className="confirmation-modal"
                >
                    <Modal.Header closeButton className="modal-custom-header cancel-delivery-header">
                        <Modal.Title>
                            <FaUndo className="me-2" />
                            Cancelar Entrega
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="modal-custom-body">
                        <div className="text-center mb-3">
                            <div className="cancel-delivery-icon-container">
                                <FaUndo size={40} />
                            </div>
                        </div>
                        {itemToCancelDelivery && (
                            <div>
                                <p className="text-center">
                                    Cancelar a entrega do produto <strong>{itemToCancelDelivery.productName}</strong>?
                                </p>
                                <p className="text-center text-warning">
                                    <strong>Atenção:</strong> Esta ação retornará <strong>{itemToCancelDelivery.quantity}</strong> unidades ao estoque e marcará a solicitação como pendente novamente.
                                </p>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="modal-custom-footer">
                        <Button variant="secondary" onClick={() => setShowCancelDeliveryModal(false)} className="custom-button cancel-button">
                            Cancelar
                        </Button>
                        <Button variant="warning" onClick={processCancelDelivery} className="custom-button cancel-delivery-button">
                            Reverter Entrega
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default RequestItem;