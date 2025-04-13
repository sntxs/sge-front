import React, { useState, useEffect } from 'react';
import SideMenu from '../side-menu';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaEdit, FaSort, FaSortUp, FaSortDown, FaSearch, FaLayerGroup } from 'react-icons/fa';
import { BsFileEarmarkSpreadsheet } from "react-icons/bs";
import { MdDelete, MdCheckCircle, MdError } from 'react-icons/md';
import { API_URL_GLOBAL } from '../../../api-config.jsx';
import '../../css/category.css';
import * as XLSX from 'xlsx';
import PropTypes from 'prop-types';

function CategoryPanel({ username, onLogout }) {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackError, setFeedbackError] = useState(false);

    // Funções de Adição
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
            const response = await axios.post(`${API_URL_GLOBAL}/Category`, {
                name: formData.name,
                description: formData.description
            },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

            if (response.status === 200) {
                setFormData({
                    name: '',
                    description: ''
                });
                setShowModal(false);
                setFeedbackMessage('Categoria cadastrada com sucesso!');
                setFeedbackError(false);
                setShowFeedbackModal(true);
            } else {
                setFeedbackMessage('Erro ao adicionar categoria');
                setFeedbackError(true);
                setShowFeedbackModal(true);
            }
        } catch (error) {
            setFeedbackMessage('Erro ao conectar com o banco: ' + (error.response?.data || error.message));
            setFeedbackError(true);
            setShowFeedbackModal(true);
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const response = await axios.get(`${API_URL_GLOBAL}/Category/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setCategories(response.data);
            } catch (error) {
                console.error('Erro ao buscar categorias:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const handleEdit = (category) => {
        setCurrentCategory(category);
        setShowEditModal(true);
    };

    const handleDelete = (category) => {
        setCurrentCategory(category);
        setShowDeleteModal(true);
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`${API_URL_GLOBAL}/Category/${currentCategory.id}`, {
                ...currentCategory
            },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            setShowEditModal(false);
            setFeedbackMessage('Categoria editada com sucesso!');
            setFeedbackError(false);
            setShowFeedbackModal(true);
        } catch (error) {
            console.error('Erro ao editar categoria:', error);
            setFeedbackMessage('Erro ao editar categoria: ' + (error.response?.data || error.message));
            setFeedbackError(true);
            setShowFeedbackModal(true);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${API_URL_GLOBAL}/Category/${currentCategory.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
            setShowDeleteModal(false);
            setFeedbackMessage('Categoria deletada com sucesso!');
            setFeedbackError(false);
            setShowFeedbackModal(true);
        } catch (error) {
            console.error('Erro ao deletar categoria:', error);
            setFeedbackMessage('Erro ao deletar categoria: ' + (error.response?.data || error.message));
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

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        }
    };

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const exportToExcel = () => {
        // Preparar os dados para exportação
        const dataToExport = filteredCategories.map(category => ({
            'Nome': category.name,
            'Data de Criação': category.createdAt ? new Date(category.createdAt).toLocaleDateString('pt-BR') : '-'
        }));

        // Criar planilha
        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Definir largura das colunas
        const columnWidths = [
            { wch: 30 }, // Nome
            { wch: 20 }, // Data de Criação
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
        XLSX.utils.book_append_sheet(wb, ws, "Categorias");

        // Gerar arquivo e fazer download
        const fileName = `categorias_${new Date().toLocaleDateString()}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const sortItems = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedCategories = [...categories].sort((a, b) => {
            const aValue = a[key] || '';
            const bValue = b[key] || '';
            if (aValue < bValue) return direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return direction === 'ascending' ? 1 : -1;
            return 0;
        });
        setCategories(sortedCategories);
    };

    const getSortIcon = (columnName) => {
        if (sortConfig.key !== columnName) return <FaSort />;
        return sortConfig.direction === 'ascending' ? <FaSortUp /> : <FaSortDown />;
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCategories = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;

    return (
        <div className="category-container">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="category-content">
                {/* Header Card */}
                <div className="header-card">
                    <div className="header-content">
                        <div className="header-icon">
                            <FaLayerGroup size={40} />
                        </div>
                        <div>
                            <h1 className="mb-0">Painel de Categorias</h1>
                            <p className="mb-0">Gerencie todas as categorias do sistema</p>
                        </div>
                    </div>
                </div>

                <div className="control-panel">
                    <div className="search-container">
                        <div className="search-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Buscar categoria..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="action-buttons">
                        <button
                            className="btn btn-category"
                            onClick={() => setShowModal(true)}
                        >
                            Adicionar Categoria
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

                {/* Tabela de Categorias */}
                <div className="table-container">
                    <table className="category-table">
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3}>
                                        <div className="spinner">
                                            <div className="bounce1"></div>
                                            <div className="bounce2"></div>
                                            <div className="bounce3"></div>
                                        </div>
                                        <div className="text-center">Carregando categorias...</div>
                                    </td>
                                </tr>
                            ) : currentCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3}>
                                        <div className="empty-state">
                                            <FaLayerGroup size={50} className="empty-icon" />
                                            <p>Nenhuma categoria encontrada.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentCategories.map(category => (
                                    <tr key={category.id} className="category-row">
                                        <td>{category.name}</td>
                                        <td>{category.createdAt ? new Date(category.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                                        <td>
                                            <div className="action-cell">
                                                <button className="action-btn edit-btn" onClick={() => handleEdit(category)}>
                                                    <FaEdit />
                                                </button>
                                                <button className="action-btn delete-btn" onClick={() => handleDelete(category)}>
                                                    <MdDelete />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="pagination-container">
                    <div className="showing-info">
                        {filteredCategories.length > 0 ? 
                            `Mostrando ${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredCategories.length)} de ${filteredCategories.length} categorias` :
                            "Nenhuma categoria encontrada"
                        }
                    </div>
                    <nav>
                        <ul className="custom-pagination">
                            <li className={`page-item ${currentPage === 1 || filteredCategories.length === 0 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1 || filteredCategories.length === 0}
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

                            <li className={`page-item ${currentPage === totalPages || filteredCategories.length === 0 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || filteredCategories.length === 0}
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
                className="custom-modal"
                centered
            >
                <Modal.Header closeButton className="modal-custom-header">
                    <Modal.Title>Adicionar Categoria</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-custom-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Nome</label>
                            <input
                                type="text"
                                className="custom-input"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="d-flex justify-content-end mt-4">
                            <Button className="custom-button cancel-button me-2" onClick={() => setShowModal(false)}>
                                Cancelar
                            </Button>
                            <Button className="custom-button btn-category" type="submit">
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
                className="custom-modal"
                centered
            >
                <Modal.Header closeButton className="modal-custom-header">
                    <Modal.Title>Editar Categoria</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-custom-body">
                    {currentCategory && (
                        <Form onKeyPress={handleKeyPress}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nome</Form.Label>
                                <Form.Control
                                    type="text"
                                    className="custom-input"
                                    value={currentCategory.name}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <div className="d-flex justify-content-end mt-4">
                                <Button className="custom-button cancel-button me-2" onClick={() => setShowEditModal(false)}>
                                    Cancelar
                                </Button>
                                <Button className="custom-button btn-category" onClick={handleSaveEdit}>
                                    Salvar
                                </Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>

            {/* Modal de Confirmação de Deleção */}
            <Modal 
                show={showDeleteModal} 
                onHide={() => setShowDeleteModal(false)}
                className="custom-modal"
                centered
            >
                <Modal.Header closeButton className="modal-custom-header">
                    <Modal.Title>Confirmar Deleção</Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-custom-body">
                    <p>Tem certeza que deseja deletar a categoria <strong>{currentCategory && currentCategory.name}</strong>?</p>
                    <p className="text-muted">Esta ação não pode ser desfeita.</p>
                </Modal.Body>
                <Modal.Footer className="modal-custom-footer">
                    <Button className="custom-button cancel-button" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button className="custom-button delete-button" onClick={handleConfirmDelete}>
                        Deletar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Feedback */}
            <Modal 
                show={showFeedbackModal} 
                onHide={handleCloseFeedback}
                className="feedback-modal"
                centered
            >
                <Modal.Header 
                    closeButton 
                    className={`modal-custom-header ${feedbackError ? 'error-header' : 'success-header'}`}
                >
                    <Modal.Title>
                        {feedbackError ? 'Erro' : 'Sucesso'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="modal-custom-body text-center py-4">
                    <div className={feedbackError ? 'error-icon-container' : 'success-icon-container'}>
                        {feedbackError ? (
                            <MdError className="error-icon" />
                        ) : (
                            <MdCheckCircle className="success-icon" />
                        )}
                    </div>
                    <h4 className="mt-4 mb-3">
                        {feedbackError ? 'Ocorreu um erro' : 'Operação realizada com sucesso'}
                    </h4>
                    <p>{feedbackMessage}</p>
                </Modal.Body>
                <Modal.Footer className="modal-custom-footer">
                    <Button 
                        className={`custom-button ${feedbackError ? 'error-button' : 'success-button'}`} 
                        onClick={handleCloseFeedback}
                    >
                        Fechar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

CategoryPanel.propTypes = {
    username: PropTypes.string.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default CategoryPanel;