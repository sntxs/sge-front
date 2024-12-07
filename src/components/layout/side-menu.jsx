import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaBars, FaTimes, FaHome, FaBoxes, FaUserPlus, FaSignOutAlt, FaChevronDown, FaChevronUp, FaUser } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

import '../css/side-menu.css';

function SideMenu({ username, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [estoqueOpen, setEstoqueOpen] = useState(false);
    const [usuariosOpen, setUsuariosOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        onLogout();
        navigate('/login');
        window.location.reload(); // Recarrega a página após o logout
    };

    const toggleEstoque = () => {
        if (menuOpen) {
            setEstoqueOpen(!estoqueOpen);
        }
    };

    const toggleUsuarios = () => {
        if (menuOpen) {
            setUsuariosOpen(!usuariosOpen);
        }
    };

    useEffect(() => {
        const content = document.getElementById('content');
        if (content) {
            content.style.marginLeft = menuOpen ? '250px' : '60px';
            content.style.transition = 'margin-left 0.3s';
        }
    }, [menuOpen]);

    const userTitle = localStorage.getItem('isAdmin') === 'true' ? 'Administrador' : 'Usuário';

    return (
        <>
            <div id='menu-left' className={`bg-dark text-white ${menuOpen ? 'w-250px' : 'w-60px'} min-vh-100 position-fixed transition-width`}>
                <button className="btn btn-dark d-flex justify-content-center align-items-center w-100 py-3" onClick={toggleMenu}>
                    {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
                <div className="p-3">
                    <div className="mb-5 menu-item">
                        <button 
                            style={{ backgroundColor: 'transparent', border: 'none' }}
                            className="btn btn-dark d-flex align-items-center w-100 p-0"
                            onClick={() => menuOpen && setUserDropdownOpen(!userDropdownOpen)}
                        >
                            <span className="menu-icon"><FaUserCircle size={20} /></span>
                            {menuOpen && (
                                <>
                                    <div className="d-flex flex-column">
                                        <span className="menu-text">{username}</span>
                                        <small className="menu-text-2">{userTitle}</small>
                                    </div>
                                    <span className="arrow-icon ms-auto">
                                        {userDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                                    </span>
                                </>
                            )}
                        </button>
                        <div className={`submenu-wrapper ${menuOpen && userDropdownOpen ? 'open' : ''}`}>
                            <ul className="list-unstyled ms-4 mt-2 submenu">
                                <li>
                                    <Link to="/profile" className="text-white text-decoration-none">
                                        Meu Perfil
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <nav>
                        <ul className="list-unstyled">
                            <li className="mb-3">
                                <Link to="/home" className="text-white text-decoration-none">
                                    <FaHome className="me-2" size={20} />
                                    {menuOpen && 'Home'}
                                </Link>
                            </li>
                            <li className="mb-3 menu-item">
                                <button onClick={toggleEstoque} className="btn btn-link text-white text-decoration-none p-0 w-100">
                                    <span className="menu-icon"><FaBoxes size={20} /></span>
                                    {menuOpen && (
                                        <>
                                            <span className="menu-text">Estoque</span>
                                            <span className="arrow-icon">
                                                {estoqueOpen ? <FaChevronUp /> : <FaChevronDown />}
                                            </span>
                                        </>
                                    )}
                                </button>
                                <div className={`submenu-wrapper ${menuOpen && estoqueOpen ? 'open' : ''}`}>
                                    <ul className="list-unstyled ms-4 mt-2 submenu">
                                        <li className="mb-2">
                                            <Link to="/request-item" className="text-white text-decoration-none">
                                                Solicitar Item
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/stock-panel" className="text-white text-decoration-none">
                                                Painel do Estoque
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                            <li className="mb-3 menu-item" style={{ display: localStorage.getItem('isAdmin') === 'false' ? 'none' : 'block' }}>
                                <button onClick={toggleUsuarios} className="btn btn-link text-white text-decoration-none p-0 w-100">
                                    <span className="menu-icon"><FaUserPlus size={20} /></span>
                                    {menuOpen && (
                                        <>
                                            <span className="menu-text">Usuários</span>
                                            <span className="arrow-icon">
                                                {usuariosOpen ? <FaChevronUp /> : <FaChevronDown />}
                                            </span>
                                        </>
                                    )}
                                </button>
                                <div className={`submenu-wrapper ${menuOpen && usuariosOpen ? 'open' : ''}`}>
                                    <ul className="list-unstyled ms-4 mt-2 submenu">
                                        <li>
                                            <Link to="/user-panel" className="text-white text-decoration-none">
                                                Painel de Usuários
                                            </Link>
                                        </li>
                                        <li className="mt-2">
                                            <Link to="/sector-panel" className="text-white text-decoration-none">
                                                Painel de Setores
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="btn btn-link text-white text-decoration-none p-0">
                                    <FaSignOutAlt className="me-2" size={20} />
                                    {menuOpen && 'Sair'}
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
            <div id="content" className="transition-margin">
                {/* O conteúdo da página será renderizado aqui */}
            </div>
        </>
    );
}

export default SideMenu;