import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import SideMenu from '../side-menu';
import { API_URL_GLOBAL } from '../../../api-config';
import '../../css/profile.css';

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

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
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
        <div className="d-flex">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="flex-grow-1 p-4">
                <div className="container">
                    <h1 className="text-center mb-4">Meu Perfil</h1>

                    {userData && (
                        <div className="profile-container">
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <div className="info-group">
                                        <label>Nome</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={userData.name}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="info-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={userData.email}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="info-group">
                                        <label>Telefone</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formatPhoneNumber(userData.phoneNumber)}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="info-group">
                                        <label>CPF</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formatCPF(userData.cpf)}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="info-group">
                                        <label>Setor</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={userData.sector?.name}
                                            readOnly
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="info-group">
                                        <label>Tipo de Usuário</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={userData.isAdmin ? 'Administrador' : 'Usuário Comum'}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => setShowPasswordModal(true)}
                                >
                                    Alterar Senha
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Modal de Alteração de Senha */}
                    <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Alterar Senha</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form onSubmit={handlePasswordChange}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Senha Atual</Form.Label>
                                    <div className="input-group">
                                        <Form.Control
                                            type={passwordData.showCurrentPassword ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({
                                                ...passwordData,
                                                currentPassword: e.target.value
                                            })}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => togglePasswordVisibility('showCurrentPassword')}
                                        >
                                            {passwordData.showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Nova Senha</Form.Label>
                                    <div className="input-group">
                                        <Form.Control
                                            type={passwordData.showNewPassword ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({
                                                ...passwordData,
                                                newPassword: e.target.value
                                            })}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => togglePasswordVisibility('showNewPassword')}
                                        >
                                            {passwordData.showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Confirmar Nova Senha</Form.Label>
                                    <div className="input-group">
                                        <Form.Control
                                            type={passwordData.showConfirmPassword ? "text" : "password"}
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({
                                                ...passwordData,
                                                confirmPassword: e.target.value
                                            })}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => togglePasswordVisibility('showConfirmPassword')}
                                        >
                                            {passwordData.showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                        </Button>
                                        <Form.Text className="text-muted">
                                            - A senha deve ter entre 6 e 12 caracteres e conter pelo menos um dígito.
                                        </Form.Text>
                                    </div>
                                </Form.Group>

                                <div className="d-flex justify-content-end">
                                    <Button variant="secondary" className="me-2" onClick={() => setShowPasswordModal(false)}>
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
                    <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} centered>
                        <Modal.Header closeButton className={`bg-${alertInfo.type} text-white`}>
                            <Modal.Title className="d-flex align-items-center">
                                <span className="me-2">{alertInfo.icon}</span>
                                {alertInfo.title}
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <div className={`text-${alertInfo.type} fw-bold`}>
                                {alertInfo.message}
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button 
                                variant={alertInfo.type} 
                                onClick={() => setShowAlertModal(false)}
                            >
                                Fechar
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
            </div>
        </div>
    );
}

export default Profile; 