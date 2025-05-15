import { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaBars, FaTimes, FaHome, FaUserPlus, FaSignOutAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { MdInventory } from 'react-icons/md';
import { TbCategoryPlus } from "react-icons/tb";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL_GLOBAL } from '../../api-config.jsx';

import '../css/side-menu.css';

function SideMenu({ username, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState(null);
    const [menuItemPositions, setMenuItemPositions] = useState({});
    const menuItemsRef = useRef({});
    const submenusRef = useRef({});
    const navigate = useNavigate();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const userTitle = isAdmin ? 'Administrador' : 'Usuário';
    const [sector, setSector] = useState({ name: 'Carregando...' });

    useEffect(() => {
        const fetchUserSector = async () => {
            try {
                const userId = localStorage.getItem('id');
                if (userId) {
                    const response = await axios.get(`${API_URL_GLOBAL}/User/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (response.data && response.data.sector) {
                        setSector(response.data.sector);
                    } else {
                        setSector({ name: 'Não atribuído' });
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar setor do usuário:', error);
                setSector({ name: 'Erro ao carregar' });
            }
        };

        fetchUserSector();
    }, []);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
        // Close any open submenu when collapsing the menu
        if (menuOpen) {
            setActiveSubmenu(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('isAdmin');
        onLogout();
        navigate('/login');
        window.location.reload();
    };

    const toggleSubmenu = (submenu) => {
        if (menuOpen) {
            setActiveSubmenu(activeSubmenu === submenu ? null : submenu);
        }
    };

    // Atualiza as posições dos itens de menu
    const updateMenuItemPositions = () => {
        const positions = {};
        Object.keys(menuItemsRef.current).forEach(key => {
            const el = menuItemsRef.current[key];
            if (el) {
                const rect = el.getBoundingClientRect();
                positions[key] = {
                    top: rect.top,
                    height: rect.height,
                    left: rect.right
                };
            }
        });
        setMenuItemPositions(positions);
    };

    // Monitora redimensionamento e rolagem da página
    useEffect(() => {
        updateMenuItemPositions();

        window.addEventListener('resize', updateMenuItemPositions);
        document.addEventListener('scroll', updateMenuItemPositions);

        return () => {
            window.removeEventListener('resize', updateMenuItemPositions);
            document.removeEventListener('scroll', updateMenuItemPositions);
        };
    }, []);

    // Atualiza posições quando o menu muda
    useEffect(() => {
        updateMenuItemPositions();
    }, [menuOpen]);

    // Posiciona os submenus com base nas posições dos itens de menu
    useEffect(() => {
        Object.keys(menuItemPositions).forEach(itemId => {
            const submenuEl = submenusRef.current[itemId];
            const pos = menuItemPositions[itemId];

            if (submenuEl && pos) {
                submenuEl.style.top = `${pos.top}px`;
                submenuEl.style.left = `${pos.left}px`;
            }
        });
    }, [menuItemPositions]);

    useEffect(() => {
        const content = document.getElementById('content');
        if (content) {
            content.style.marginLeft = menuOpen ? '250px' : '70px';
            content.style.transition = 'margin-left 0.3s';
        }
    }, [menuOpen]);

    // Menu structure configuration
    const menuItems = [
        {
            id: 'home',
            title: 'Home',
            icon: <FaHome size={20} />,
            link: '/home',
            type: 'link'
        },
        {
            id: 'estoque',
            title: 'Estoque',
            icon: <MdInventory size={20} />,
            type: 'submenu',
            submenu: [
                { title: 'Painel do Estoque', link: '/stock-panel' },
                { title: 'Solicitar Item', link: '/request-item' }
            ]
        },
        {
            id: 'usuarios',
            title: 'Usuários',
            icon: <FaUserPlus size={20} />,
            type: 'submenu',
            adminOnly: true,
            submenu: [
                { title: 'Painel de Usuários', link: '/user-panel' }
            ]
        },
        {
            id: 'setores',
            title: 'Setor',
            icon: <HiOutlineOfficeBuilding size={20} />,
            type: 'submenu',
            adminOnly: true,
            submenu: [
                { title: 'Painel de Setor', link: '/sector-panel' }
            ]
        },
        {
            id: 'categorias',
            title: 'Categorias',
            icon: <TbCategoryPlus size={20} />,
            type: 'submenu',
            adminOnly: true,
            submenu: [
                { title: 'Painel de Categorias', link: '/category-panel' }
            ]
        }
    ];

    return (
        <>
            <aside id='menu-left' className={`${menuOpen ? 'w-250px' : 'w-70px'} min-vh-100 position-fixed transition-width`}>
                <button className="menu-toggle" onClick={toggleMenu}>
                    {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                </button>

                <div className="menu-content">
                    {/* User Profile */}
                    <div
                        className="user-profile"
                        ref={el => menuItemsRef.current['profile'] = el}
                        onMouseEnter={updateMenuItemPositions}
                    >
                        <div className="avatar-container">
                            <FaUserCircle size={menuOpen ? 30 : 24} />
                        </div>

                        {menuOpen && (
                            <div className="user-info">
                                <span className="username">{username}</span>
                                <span className="user-role">Cargo: {userTitle}</span>
                                <span className="user-role">Setor: {sector.name}</span>
                            </div>
                        )}

                        {menuOpen && (
                            <button
                                className="btn-transparent"
                                onClick={() => toggleSubmenu('profile')}
                            >
                                {activeSubmenu === 'profile' ? <FaChevronUp /> : <FaChevronDown />}
                            </button>
                        )}
                    </div>

                    {/* User profile submenu - visible when open or on hover */}
                    <div
                        className={`submenu-wrapper user-submenu-wrapper ${menuOpen && activeSubmenu === 'profile' ? 'open' : ''}`}
                        ref={el => submenusRef.current['profile'] = el}
                    >
                        <ul className="submenu user-submenu">
                            <li>
                                <Link to="/profile">Meu Perfil</Link>
                            </li>
                        </ul>
                    </div>

                    <nav className="menu-nav">
                        <ul className="menu-list">
                            {menuItems.map(item => {
                                // Skip admin-only items if the user is not an admin
                                if (item.adminOnly && !isAdmin) return null;

                                return (
                                    <li
                                        key={item.id}
                                        className="menu-list-item"
                                        ref={el => menuItemsRef.current[item.id] = el}
                                        onMouseEnter={updateMenuItemPositions}
                                    >
                                        {item.type === 'link' ? (
                                            <Link to={item.link} className="menu-link" title={item.title}>
                                                <span className="menu-icon">{item.icon}</span>
                                                {menuOpen && <span className="menu-text">{item.title}</span>}
                                            </Link>
                                        ) : (
                                            <>
                                                <button
                                                    className="menu-button"
                                                    onClick={() => toggleSubmenu(item.id)}
                                                    title={item.title}
                                                >
                                                    <span className="menu-icon">{item.icon}</span>
                                                    {menuOpen && (
                                                        <>
                                                            <span className="menu-text">{item.title}</span>
                                                            <span className="menu-arrow">
                                                                {activeSubmenu === item.id ? <FaChevronUp /> : <FaChevronDown />}
                                                            </span>
                                                        </>
                                                    )}
                                                </button>

                                                {/* Submenu - visible when open or on hover */}
                                                <div
                                                    className={`submenu-wrapper ${menuOpen && activeSubmenu === item.id ? 'open' : ''}`}
                                                    ref={el => submenusRef.current[item.id] = el}
                                                >
                                                    <ul className="submenu">
                                                        {item.submenu.map((subItem, idx) => (
                                                            <li key={idx}>
                                                                <Link to={subItem.link}>{subItem.title}</Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                );
                            })}

                            {/* Logout button */}
                            <li className="menu-list-item logout-item">
                                <button onClick={handleLogout} className="menu-button logout-button" title="Sair">
                                    <span className="menu-icon"><FaSignOutAlt size={20} /></span>
                                    {menuOpen && <span className="menu-text">Sair</span>}
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>
            <main id="content" className="transition-margin">
                {/* O conteúdo da página será renderizado aqui */}
            </main>
        </>
    );
}

export default SideMenu;