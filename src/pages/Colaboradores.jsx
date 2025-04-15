import React, { useEffect, useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    MenuItem,
    CircularProgress,
    Alert
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import InputMask from 'react-input-mask'; // <--- Importante
import dayjs from 'dayjs';
import api from '../services/api';

// Função para obter o usuário atual
const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export default function Colaboradores() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Usuário logado
    const [currentUser, setCurrentUser] = useState(null);

    // Estados para o diálogo de criar/editar usuário
    const [openDialog, setOpenDialog] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('colaborador'); // padrão: colaborador
    const [newContact, setNewContact] = useState('');
    const [newEspecialidade, setNewEspecialidade] = useState('');
    const [newAdmissionDate, setNewAdmissionDate] = useState('');

    // Estado para identificar se está editando (contém o usuário a ser editado)
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const user = getCurrentUser();
        setCurrentUser(user);
        fetchUsersFromBackend();
    }, []);

    const fetchUsersFromBackend = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await api.get('/auth/users/list', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
            setError('Não foi possível carregar os colaboradores.');
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------
    // Diálogo para criar/editar usuário
    const handleOpenDialog = () => {
        setEditingUser(null);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('colaborador');
        setNewContact('');
        setNewEspecialidade('');
        setNewAdmissionDate('');
        setOpenDialog(true);
    };

    const handleOpenEditDialog = (user) => {
        setEditingUser(user);
        setNewName(user.name);
        setNewEmail(user.email);
        setNewPassword('');
        setNewRole(user.role);
        setNewContact(user.contact || '');
        setNewEspecialidade(user.position || '');
        setNewAdmissionDate(user.admission_date || '');
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    // --------------------------------------------------
    // Criar/Editar usuário
    const handleSaveUser = async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Apenas administradores podem criar ou editar usuários.');
            return;
        }
        if (!newName || !newEmail) {
            alert('Nome e e-mail são obrigatórios.');
            return;
        }
        const token = localStorage.getItem('token');
        try {
            if (editingUser) {
                // Edição
                const payload = {
                    name: newName,
                    email: newEmail,
                    role: newRole,
                    contact: newContact,
                    position: newEspecialidade,
                    admission_date: newAdmissionDate,
                };
                if (newPassword) {
                    payload.password = newPassword;
                }
                await api.patch(`/auth/users/${editingUser.id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert('Usuário atualizado com sucesso!');
            } else {
                // Criação
                if (!newPassword) {
                    alert('Senha é obrigatória para criação de usuário.');
                    return;
                }
                const payload = {
                    name: newName,
                    email: newEmail,
                    password: newPassword,
                    role: newRole,
                    contact: newContact,
                    position: newEspecialidade,
                    admission_date: newAdmissionDate,
                };
                await api.post('/auth/users', payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                alert('Usuário criado com sucesso!');
            }
            handleCloseDialog();
            fetchUsersFromBackend();
        } catch (err) {
            console.error('Erro ao salvar usuário:', err);
            alert('Não foi possível salvar o usuário. Verifique os dados e tente novamente.');
        }
    };

    // --------------------------------------------------
    // Excluir usuário
    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/auth/users/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Usuário excluído com sucesso!');
            fetchUsersFromBackend();
        } catch (err) {
            console.error('Erro ao excluir usuário:', err);
            alert('Não foi possível excluir o usuário.');
        }
    };

    // --------------------------------------------------
    // Renderização
    if (loading) {
        return (
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Colaboradores
            </Typography>

            {/* Botão para criar novo usuário (visível somente para admin) */}
            {currentUser?.role === 'admin' && (
                <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpenDialog}>
                    Novo Colaborador
                </Button>
            )}

            <Grid container spacing={2}>
                {users.map((user) => (
                    <Grid item key={user.id} xs={12} sm={6} md={4}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6">{user.name}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    E-mail: {user.email}
                                </Typography>
                                <Chip
                                    label={user.role}
                                    variant="outlined"
                                    color={
                                        user.role === 'admin'
                                            ? 'success'
                                            : user.role === 'colaborador'
                                                ? 'primary'
                                                : 'default'
                                    }
                                    sx={{ mt: 1 }}
                                />
                                {user.contact && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        Contato: {user.contact}
                                    </Typography>
                                )}
                                {user.position && (
                                    <Typography variant="body2">
                                        Especialidade: {user.position}
                                    </Typography>
                                )}
                                {user.admission_date && (
                                    <Typography variant="body2">
                                        Admissão: {user.admission_date}
                                    </Typography>
                                )}

                                {/* Botões de ação: Editar e Excluir (somente para admin) */}
                                {currentUser?.role === 'admin' && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ mt: 1, mr: 1 }}
                                            onClick={() => handleOpenEditDialog(user)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            color="error"
                                            sx={{ mt: 1 }}
                                            onClick={() => handleDeleteUser(user)}
                                        >
                                            Excluir
                                        </Button>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Diálogo para criar/editar usuário */}
            <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>
                    {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Nome Completo"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label="E-mail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        label={
                            editingUser
                                ? 'Nova Senha (deixe em branco para manter a atual)'
                                : 'Senha'
                        }
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        fullWidth
                    />
                    <TextField
                        select
                        label="Papel (Role)"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        fullWidth
                    >
                        <MenuItem value="admin">Administrador</MenuItem>
                        <MenuItem value="colaborador">Colaborador</MenuItem>
                        <MenuItem value="convidado">Convidado</MenuItem>
                    </TextField>

                    {/* Campo de telefone com máscara */}
                    <InputMask
                        mask="(99) 99999-9999"
                        maskChar=""
                        value={newContact}
                        onChange={(e) => setNewContact(e.target.value)}
                    >
                        {(inputProps) => (
                            <TextField
                                {...inputProps}
                                label="Contato (Telefone)"
                                fullWidth
                            />
                        )}
                    </InputMask>

                    <TextField
                        label="Especialidade"
                        value={newEspecialidade}
                        onChange={(e) => setNewEspecialidade(e.target.value)}
                        fullWidth
                        placeholder="Ex.: Suporte N1, Analista, etc."
                    />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Data de Admissão"
                            format="DD/MM/YYYY"
                            value={newAdmissionDate ? dayjs(newAdmissionDate) : null}
                            onChange={(newValue) => {
                                if (!newValue) {
                                    setNewAdmissionDate('');
                                } else {
                                    const formatted = dayjs(newValue).format('YYYY-MM-DD');
                                    setNewAdmissionDate(formatted);
                                }
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveUser}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
