import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaUserAlt } from 'react-icons/fa';
import { API_URL_GLOBAL } from '../../api-config.jsx';
import '../css/login.css';

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


                // console.log(responseUser.data.isAdmin)

                onLoginSuccess(responseUser.data.name);
                navigate('/home');
            } else {
                setModalMessage('Não foi possivel efetuar o login, tente novamente mais tarde.');
                setModalVisible(true);
            }
        } catch (error) {
            if (error.response.status === 400) {
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
        <div id="login" className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="card shadow-lg">
                <div className="card-body">
                    {/* <img src="./src/components/img/patanal-ar-logo.png" alt="Pantanal" className="pantanal-logo mx-auto d-block" /> */}
                    <div className="text-center">
                        <h1>S.G.E</h1>
                        <p>Sistema de Gerenciamento de Estoque</p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="username" className="form-label">Usuário:</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUser(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-dark"
                                >
                                    <FaUserAlt />
                                </button>
                            </div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">Senha:</label>
                            <div className="input-group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="form-control"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-outline-dark"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                        <div className="mb-3 form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="rememberPassword"
                                checked={rememberPassword}
                                onChange={toggleRememberPassword}
                            />
                            <label className="form-check-label" htmlFor="rememberPassword">Lembrar senha</label>
                        </div>
                        <div className="d-grid pt-4">
                            <button 
                                type="submit" 
                                className="botaoLogin text-uppercase" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                        <span className="visually-hidden">Carregando...</span>
                                    </div>
                                ) : 'Entrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={`modal fade ${modalVisible ? 'show' : ''}`} tabIndex="-1" role="dialog" style={{ display: modalVisible ? 'block' : 'none' }}>
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Atenção</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Fechar" onClick={closeModal}></button>
                        </div>
                        <div className="modal-body">
                            <p>{modalMessage}</p>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={closeModal}>Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
            {modalVisible && <div className="modal-backdrop fade show"></div>}
        </div>
    );
}

export default Login;
