import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/home.css';
import SideMenu from './side-menu';
import axios from 'axios';
import { API_URL_GLOBAL } from '../../api-config';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { FaBoxOpen, FaChartBar, FaArrowUp, FaClipboardList, FaLayerGroup, FaArrowDown, FaFilter } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';

// Registrar os componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

// Constantes para os limites de estoque - mesmos valores do stockPanel.jsx
const LOW_STOCK_THRESHOLD = 5;
const WARNING_STOCK_THRESHOLD = 10;

function Home({ username, onLogout }) {
    const navigate = useNavigate();
    const [stockItems, setStockItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5); // Definindo 5 itens por página no card
    const [stockCategories, setStockCategories] = useState({
        high: [],
        medium: [],
        low: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);
    const [showWarningStockOnly, setShowWarningStockOnly] = useState(false);

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
                    name: item.name,
                    quantity: item.quantity
                }));
                setStockItems(formattedItems);

                // Categorizar itens por quantidade
                categorizeItems(formattedItems);
            } catch (error) {
                console.error('Erro ao buscar itens do estoque:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchItems();
    }, []);

    // Função para categorizar itens por quantidade
    const categorizeItems = (items) => {
        // Se não houver itens, retorne
        if (!items.length) return;

        // Determinar limites de categorias baseados nos dados
        const highThreshold = WARNING_STOCK_THRESHOLD; // > 10
        const lowThreshold = LOW_STOCK_THRESHOLD; // <= 5

        // Categorizar os itens
        const high = items.filter(item => item.quantity > highThreshold);
        const medium = items.filter(item => item.quantity > lowThreshold && item.quantity <= highThreshold);
        const low = items.filter(item => item.quantity <= lowThreshold);

        setStockCategories({
            high,
            medium,
            low
        });
    };

    const resetFilters = () => {
        setShowLowStockOnly(false);
        setShowWarningStockOnly(false);
        setCurrentPage(1);
    };

    // Configuração do gráfico de barras
    const chartData = {
        labels: stockItems.slice(0, 10).map(item => item.name), // Limitando a 10 itens para melhor visualização
        datasets: [
            {
                label: 'Quantidade em Estoque',
                data: stockItems.slice(0, 10).map(item => item.quantity),
                backgroundColor: 'rgba(78, 115, 223, 0.7)',
                borderColor: 'rgba(78, 115, 223, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                color: '#FFF',
                text: 'Visão Geral do Estoque',
                font: {
                    size: 18,
                    weight: 'bold'
                }
            },

        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Quantidade'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Produtos'
                }
            }
        }
    };

    // Configuração do gráfico de categorias
    const categoryChartData = {
        labels: ['Estoque Normal', 'Reposição em Breve', 'Estoque Crítico'],
        datasets: [
            {
                data: [
                    stockCategories.high.length,
                    stockCategories.medium.length,
                    stockCategories.low.length
                ],
                backgroundColor: [
                    'rgba(28, 200, 138, 0.7)',
                    'rgba(246, 194, 62, 0.7)',
                    'rgba(231, 74, 59, 0.7)'
                ],
                borderColor: [
                    'rgba(28, 200, 138, 1)',
                    'rgba(246, 194, 62, 1)',
                    'rgba(231, 74, 59, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const categoryChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Distribuição por Nível de Estoque',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} produtos (${percentage}%)`;
                    }
                }
            }
        }
    };

    // Filtragem de itens
    const filteredItems = stockItems.filter(item => {
        if (showLowStockOnly) {
            return item.quantity <= LOW_STOCK_THRESHOLD;
        }
        if (showWarningStockOnly) {
            return item.quantity > LOW_STOCK_THRESHOLD && item.quantity <= WARNING_STOCK_THRESHOLD;
        }
        return true;
    });

    // Lógica de paginação
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    // Função para determinar a classe do badge baseada na quantidade
    const getBadgeClass = (quantity) => {
        if (quantity <= LOW_STOCK_THRESHOLD) return 'badge-low';
        if (quantity <= WARNING_STOCK_THRESHOLD) return 'badge-medium';
        return 'badge-high';
    };

    // Função para obter o ícone correto baseado na quantidade
    const getStockIcon = (quantity) => {
        if (quantity <= LOW_STOCK_THRESHOLD) return <MdWarning size={16} />;
        if (quantity <= WARNING_STOCK_THRESHOLD) return <FaArrowDown size={14} />;
        return <FaArrowUp size={14} />;
    };

    return (
        <div className="dashboard-container">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="dashboard-content">
                {/* Header Card */}
                <div className="header-card">
                    <div className="header-content">
                        <div className="header-icon">
                            <FaChartBar size={40} />
                        </div>
                        <div className="header-text">
                            <h1>Dashboard de Estoque</h1>
                            <p>Olá, {username}! Bem-vindo ao Sistema de Gestão de Estoque</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-icon stat-total">
                            <FaLayerGroup size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stockItems.length}</h3>
                            <p>Total de Itens</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-high">
                            <FaArrowUp size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stockCategories.high.length}</h3>
                            <p>Estoque Normal</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-medium">
                            <FaArrowDown size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stockCategories.medium.length}</h3>
                            <p>Reposição em Breve</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon stat-low">
                            <MdWarning size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>{stockCategories.low.length}</h3>
                            <p>Estoque Crítico</p>
                        </div>
                    </div>
                </div>

                {/* Stock List Card */}
                <div className="stock-list-card">
                    <div className="card-header">
                        <h5 className="p-4 d-flex align-items-center text-white rounded">
                            <FaClipboardList className="me-3" size={24} />
                            {showLowStockOnly
                                ? "Itens com Estoque Crítico"
                                : showWarningStockOnly
                                    ? "Itens para Reposição em Breve"
                                    : "Produtos em Estoque"}
                        </h5>
                    </div>
                    <div className="card-body">
                        {isLoading ? (
                            <div className="d-flex justify-content-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Carregando...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <ul className="list-group list-group-flush">
                                    {currentItems.length === 0 ? (
                                        <li className="list-group-item text-center py-4">
                                            <p className="mb-0 text-muted">
                                                {showLowStockOnly
                                                    ? "Nenhum item com estoque crítico encontrado."
                                                    : showWarningStockOnly
                                                        ? "Nenhum item para reposição em breve encontrado."
                                                        : "Nenhum item encontrado no estoque."}
                                            </p>
                                        </li>
                                    ) : (
                                        currentItems.map((item, index) => (
                                            <li key={index} className="list-group-item">
                                                <span className="item-name">{item.name}</span>
                                                <div className="item-quantity">
                                                    <span className={`item-badge ${getBadgeClass(item.quantity)}`}>
                                                        <span className="item-badge-icon">{getStockIcon(item.quantity)}</span>
                                                        <span className="item-badge-text">{item.quantity}</span>
                                                    </span>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>

                                {/* Paginação */}
                                <div className="pagination-container">
                                    <div className="showing-info">
                                        {filteredItems.length > 0 ?
                                            `Mostrando ${indexOfFirstItem + 1} - ${Math.min(indexOfLastItem, filteredItems.length)} de ${filteredItems.length} itens` :
                                            "Nenhum item encontrado"
                                        }
                                        {showLowStockOnly && <span className="filter-badge low-filter-badge">Filtro: Estoque Crítico</span>}
                                        {showWarningStockOnly && <span className="filter-badge warning-filter-badge">Filtro: Reposição em Breve</span>}
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
                                                    if (totalPages <= 5) return true;
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
                            </>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="text-center mb-4">
                    <button className="action-button" onClick={() => navigate('/stock-panel')}>
                        <FaBoxOpen className="me-2" />
                        Gerenciar Estoque
                    </button>
                </div>

                {/* Charts Row */}
                <div className="chart-row">
                    {/* Bar Chart */}
                    <div className="chart-container">
                        <div className="bar-chart-container">
                            {isLoading ? (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Carregando...</span>
                                    </div>
                                </div>
                            ) : (
                                <Bar data={chartData} options={chartOptions} />
                            )}
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="chart-container">
                        <div id="graficoPizza">
                            {isLoading ? (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Carregando...</span>
                                    </div>
                                </div>
                            ) : (
                                <Pie data={categoryChartData} options={categoryChartOptions} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Filter Reset Button if filters active */}
                {(showLowStockOnly || showWarningStockOnly) && (
                    <div className="text-center mb-3">
                        <button className="reset-filter-btn" onClick={resetFilters}>
                            <FaFilter className="me-2" /> Mostrar Todos os Itens
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// PropTypes
Home.propTypes = {
    username: PropTypes.string.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default Home;