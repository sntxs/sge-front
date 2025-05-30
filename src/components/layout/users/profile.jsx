import { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaEye, FaEyeSlash, FaUser, FaIdCard, FaEnvelope, FaPhone, FaBuilding, FaUserCog, FaLock } from 'react-icons/fa';
import SideMenu from '../side-menu';
import { API_URL_GLOBAL } from '../../../api-config';
import '../../css/profile.css';
import PropTypes from 'prop-types';

function Profile({ username, onLogout }) {
    const [userData, setUserData] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
    });
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [alertInfo, setAlertInfo] = useState({
        title: '',
        message: '',
        type: '',
        icon: null
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const userId = localStorage.getItem('id');
            const response = await axios.get(`${API_URL_GLOBAL}/User/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUserData(response.data);
        } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            showError('Erro ao carregar dados do usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const showError = (message) => {
        setAlertInfo({
            title: 'Erro',
            message,
            type: 'danger',
            icon: '❌'
        });
        setShowAlertModal(true);
    };

    const showSuccess = (message) => {
        setAlertInfo({
            title: 'Sucesso',
            message,
            type: 'success',
            icon: '✅'
        });
        setShowAlertModal(true);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showError('As senhas não coincidem');
            return;
        }

        if (!passwordData.currentPassword) {
            showError('A senha atual é obrigatória');
            return;
        }

        if (passwordData.newPassword.length < 6 || passwordData.newPassword.length > 12) {
            showError('A nova senha deve ter entre 6 e 12 caracteres');
            return;
        }

        if (!/\d/.test(passwordData.newPassword)) {
            showError('A nova senha deve conter pelo menos um dígito');
            return;
        }

        try {
            const userId = localStorage.getItem('id');
            await axios.post(`${API_URL_GLOBAL}/User/change-password`, {
                userId: userId,
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            setShowPasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
                showCurrentPassword: false,
                showNewPassword: false,
                showConfirmPassword: false
            });
            showSuccess('Senha alterada com sucesso!');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            const errorMessage = error.response?.data || 'Erro ao alterar senha. Por favor, tente novamente.';
            showError(errorMessage);
        }
    };

    const togglePasswordVisibility = (field) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const formatPhoneNumber = (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

    const formatCPF = (cpf) => {
        const cleaned = cpf.replace(/\D/g, '');
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    return (
        <div className="profile-page">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="profile-content-wrapper">
                {/* Hero Banner */}
                <div className="profile-hero-banner">
                    <div className="user-avatar">
                        {userData?.name ? userData.name.charAt(0).toUpperCase() : <FaUser />}
                    </div>
                    <h1>Meu Perfil</h1>
                    <p>Gerencie suas informações pessoais e preferências</p>
                </div>

                {isLoading ? (
                    <div className="loading-glass-card">
                        <div className="pulse-loader">
                            <div className="pulse-circle"></div>
                            <div className="pulse-circle"></div>
                            <div className="pulse-circle"></div>
                        </div>
                        <p>Carregando suas informações...</p>
                    </div>
                ) : userData && (
                    <div className="profile-cards-container">
                        {/* Personal Info Card */}
                        <div className="glass-card">
                            <div className="card-header infoPessoais rounded">
                                <h2>Informações Pessoais</h2>
                            </div>
                            <div className="card-content">
                                <div className="info-item">
                                    <div className="info-icon">
                                        <FaUser />
                                    </div>
                                    <div className="info-details">
                                        <label>Nome</label>
                                        <div className="info-value">{userData.name}</div>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <FaEnvelope />
                                    </div>
                                    <div className="info-details">
                                        <label>Email</label>
                                        <div className="info-value">{userData.email}</div>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <FaPhone />
                                    </div>
                                    <div className="info-details">
                                        <label>Telefone</label>
                                        <div className="info-value">{formatPhoneNumber(userData.phoneNumber)}</div>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <FaIdCard />
                                    </div>
                                    <div className="info-details">
                                        <label>CPF</label>
                                        <div className="info-value">{formatCPF(userData.cpf)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* System Info Card */}
                        <div className="glass-card">
                            <div className="card-header infoSistemas rounded">
                                <h2>Informações do Sistema</h2>
                            </div>
                            <div className="card-content">
                                <div className="info-item">
                                    <div className="info-icon">
                                        <FaBuilding />
                                    </div>
                                    <div className="info-details">
                                        <label>Setor</label>
                                        <div className="info-value">{userData.sector?.name}</div>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <FaUserCog />
                                    </div>
                                    <div className="info-details">
                                        <label>Tipo de Usuário</label>
                                        <div className="info-value">{userData.isAdmin ? 'Administrador' : 'Usuário Comum'}</div>
                                    </div>
                                </div>

                                <div className="action-container">
                                    <button
                                        className="action-button"
                                        onClick={() => setShowPasswordModal(true)}
                                    >
                                        <FaLock />
                                        <span>Alterar Senha</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Alteração de Senha */}
                <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered className="modern-modal">
                    <Modal.Header closeButton>
                        <div className="modal-title-with-icon">
                            <FaLock />
                            <Modal.Title>Alterar Senha</Modal.Title>
                        </div>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handlePasswordChange}>
                            <Form.Group className="mb-4">
                                <Form.Label>Senha Atual</Form.Label>
                                <div className="password-input-group">
                                    <Form.Control
                                        type={passwordData.showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({
                                            ...passwordData,
                                            currentPassword: e.target.value
                                        })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => togglePasswordVisibility('showCurrentPassword')}
                                    >
                                        {passwordData.showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Nova Senha</Form.Label>
                                <div className="password-input-group">
                                    <Form.Control
                                        type={passwordData.showNewPassword ? "text" : "password"}
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({
                                            ...passwordData,
                                            newPassword: e.target.value
                                        })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => togglePasswordVisibility('showNewPassword')}
                                    >
                                        {passwordData.showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>Confirmar Nova Senha</Form.Label>
                                <div className="password-input-group">
                                    <Form.Control
                                        type={passwordData.showConfirmPassword ? "text" : "password"}
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({
                                            ...passwordData,
                                            confirmPassword: e.target.value
                                        })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => togglePasswordVisibility('showConfirmPassword')}
                                    >
                                        {passwordData.showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                                {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                                    <div style={{ color: 'red', fontSize: '0.95em', marginTop: '0.25rem' }}>
                                        As senhas não coincidem
                                    </div>
                                )}
                            </Form.Group>

                            <div className="password-requirements">
                                <h5>Requisitos de Senha:</h5>
                                <div className="requirements-list">
                                    <div className={`requirement ${passwordData.newPassword.length >= 6 && passwordData.newPassword.length <= 12 ? 'fulfilled' : ''}`}>
                                        Entre 6 e 12 caracteres
                                    </div>
                                    <div className={`requirement ${/\d/.test(passwordData.newPassword) ? 'fulfilled' : ''}`}>
                                        Pelo menos um dígito
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <Button variant="outline-secondary" onClick={() => setShowPasswordModal(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="primary" type="submit">
                                    Salvar
                                </Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>

                {/* Modal de Alerta Personalizado */}
                <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} centered className="modern-modal alert-modal">
                    <Modal.Body className="text-center py-4">
                        <div className={`alert-icon ${alertInfo.type === 'danger' ? 'error-icon' : 'success-icon'}`}>
                            {alertInfo.type === 'danger' ? '!' : '✓'}
                        </div>
                        <h4 className="mt-4 mb-3">{alertInfo.title}</h4>
                        <p className="alert-message">
                            {alertInfo.message}
                        </p>
                        <Button
                            className={`close-alert-btn ${alertInfo.type === 'danger' ? 'error-btn' : 'success-btn'}`}
                            onClick={() => setShowAlertModal(false)}
                        >
                            Fechar
                        </Button>
                    </Modal.Body>
                </Modal>
            </div>
        </div>
    );
}

Profile.propTypes = {
    username: PropTypes.string.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default Profile; 