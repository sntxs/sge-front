import React, { useState } from 'react';
import SideMenu from '../side-menu';
import { Modal, Button, ToggleButton, ToggleButtonGroup, Alert } from 'react-bootstrap';
import axios from 'axios';
import MaskedInput from 'react-text-mask';
import '../../css/addUsers.css';
import { API_URL_GLOBAL } from '../../../api-config.jsx';

function AddUsers({ username, onLogout }) {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        cpf: '',
        username: '',
        password: '',
        isAdmin: false
    });
    const [showAlert, setShowAlert] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Remover máscaras do CPF e telefone
            const cleanCPF = formData.cpf.replace(/\D/g, '');
            const cleanPhoneNumber = formData.phoneNumber.replace(/\D/g, '');

            console.log({ ...formData, cpf: cleanCPF, phoneNumber: cleanPhoneNumber });

            const response = await axios.post(`${API_URL_GLOBAL}/User`, { 
                name: formData.name, 
                email: formData.email, 
                phoneNumber: cleanPhoneNumber, 
                cpf: cleanCPF, 
                username: formData.username, 
                password: formData.password, 
                isAdmin: formData.isAdmin 
            },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (response.status === 200) {
                console.log('Usuário adicionado com sucesso');
                setFormData({
                    name: '',
                    email: '',
                    phoneNumber: '',
                    cpf: '',
                    username: '',
                    password: '',
                    isAdmin: false
                });
                setShowModal(false);
                setShowAlert(true);
                setTimeout(() => {
                    setShowAlert(false);
                    window.location.reload();
                }, 3000);
            } else {
                console.error('Erro ao adicionar usuário');
            }
        } catch (error) {
            console.error('Erro ao conectar com o banco:', error);
        }
    };

    return (
        <div className="d-flex">
            <SideMenu username={username} onLogout={onLogout} />
            <div className="flex-grow-1 p-4 text-center">
                <h1>Adicionar Usuários</h1>
                <Button
                    variant="primary"
                    onClick={() => setShowModal(true)}
                >
                    Adicionar Usuário
                </Button>

                <Modal
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    dialogClassName="modal-90w"
                    aria-labelledby="example-custom-modal-styling-title"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title id="example-custom-modal-styling-title">Adicionar Usuário</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Nome</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="phoneNumber" className="form-label">Telefone</label>
                                <MaskedInput
                                    mask={['(', /[1-9]/, /\d/, ')', ' ', /\d/, /\d/, /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/]}
                                    className="form-control"
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="cpf" className="form-label">CPF</label>
                                <MaskedInput
                                    mask={[/\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '.', /\d/, /\d/, /\d/, '-', /\d/, /\d/]}
                                    className="form-control"
                                    id="cpf"
                                    name="cpf"
                                    value={formData.cpf}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="username" className="form-label">Nome de Usuário</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">Senha</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Permissão Administrador</label>
                                <div>
                                    <ToggleButtonGroup
                                        type="radio"
                                        name="isAdmin"
                                        value={formData.isAdmin ? 1 : 0}
                                        onChange={(val) => setFormData(prevState => ({ ...prevState, isAdmin: val === 1 }))}
                                    >
                                        <ToggleButton id="tbg-radio-1" value={1} variant="success" className="toggle-button-success">
                                            Sim
                                        </ToggleButton>
                                        <ToggleButton id="tbg-radio-2" value={0} variant="danger" className="toggle-button-danger">
                                            Não
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </div>
                            </div>
                            <Button variant="success" type="submit">
                                Cadastrar
                            </Button>
                        </form>
                    </Modal.Body>
                </Modal>
                {showAlert && (
                    <Alert variant="success" className="mt-3">
                        Usuário cadastrado com sucesso! A página será recarregada em 3 segundos.
                    </Alert>
                )}
            </div>
        </div>
    );
}

export default AddUsers;
