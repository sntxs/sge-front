import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaUserAlt, FaSignInAlt } from 'react-icons/fa';
import { API_URL_GLOBAL } from '../../api-config.jsx';
import '../css/login.css';
import PropTypes from 'prop-types';

function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [username, setUser] = useState('');
    const [password, setPassword] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberPassword, setRememberPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL_GLOBAL}/Auth`, {
                username,
                password
            },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

            if (response.status === 200) {
                if (rememberPassword) {
                    localStorage.setItem('savedUser', username);
                    localStorage.setItem('savedPassword', password);
                } else {
                    localStorage.removeItem('savedUser');
                    localStorage.removeItem('savedPassword');
                }
                localStorage.setItem('token', response.data.token);

                const responseUser = await axios.get(`${API_URL_GLOBAL}/User/${response.data.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                )
                localStorage.setItem('isAdmin', responseUser.data.isAdmin);

                localStorage.setItem('id', responseUser.data.id);

                onLoginSuccess(responseUser.data.name);
                navigate('/home');
            } else {
                setModalMessage('Não foi possivel efetuar o login, tente novamente mais tarde.');
                setModalVisible(true);
            }
        } catch (error) {
            if (error.response?.status === 400) {
                setModalMessage('Usuário ou senha inválidos');
                setModalVisible(true);
            } else {
                setModalMessage('Não foi possível realizar o login, verifique sua conexão com a internet.');
                setModalVisible(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleRememberPassword = () => {
        setRememberPassword(!rememberPassword);
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">
                        <FaSignInAlt size={40} />
                    </div>
                    <h1 className="login-title">S.G.E</h1>
                    <p className="login-subtitle">Sistema de Gerenciamento de Estoque</p>
                </div>
                
                <div className="login-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-input-group">
                            <label htmlFor="username" className="form-label">Usuário:</label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="text"
                                    className="form-input"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUser(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-icon-button"
                                    tabIndex="-1"
                                >
                                    <FaUserAlt />
                                </button>
                            </div>
                        </div>
                        
                        <div className="form-input-group">
                            <label htmlFor="password" className="form-label">Senha:</label>
                            <div className="input-icon-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="input-icon-button"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="rememberPassword"
                                checked={rememberPassword}
                                onChange={toggleRememberPassword}
                            />
                            <label className="form-check-label" htmlFor="rememberPassword">
                                Lembrar senha
                            </label>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="login-button" 
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner-container">
                                        <div className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Carregando...</span>
                                        </div>
                                    </div>
                                    Processando...
                                </>
                            ) : (
                                <>Entrar</>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Modal de Feedback */}
            <div className={`modal fade ${modalVisible ? 'show' : ''}`} tabIndex="-1" role="dialog" style={{ display: modalVisible ? 'block' : 'none' }}>
                <div className="modal-dialog" role="document">
                    <div className="modal-content feedback-modal">
                        <div className="modal-header modal-custom-header">
                            <h5 className="modal-title">Atenção</h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body modal-custom-body">
                            <p>{modalMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="login-button" style={{ width: 'auto' }} onClick={closeModal}>
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {modalVisible && <div className="modal-backdrop fade show"></div>}
        </div>
    );
}

Login.propTypes = {
    onLoginSuccess: PropTypes.func.isRequired
};

export default Login;
