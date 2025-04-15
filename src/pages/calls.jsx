import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Pagination,
    Container,
    Paper,
    Snackbar,
    Avatar,
    Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

// Paleta de cores por prioridade
const priorityColors = {
    Alta: { main: '#ff5252', light: '#ffe2e2' },
    Média: { main: '#ffc107', light: '#fff3cd' },
    Baixa: { main: '#4caf50', light: '#e8f5e9' }
};

export default function Calls() {
    const [calls, setCalls] = useState([]);
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // Modal (criação/edição)
    const [openModal, setOpenModal] = useState(false);
    const [editingCall, setEditingCall] = useState(null);

    // Form do chamado
    const [callForm, setCallForm] = useState({
        title: '',
        description: '',
        priority: 'Média',
        client_id: '',
        assigned_to_user_id: '',
        status: 'Aberto'
    });
    const [modalError, setModalError] = useState('');

    // Snackbar de feedback
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Filtros/paginação
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [orderBy, setOrderBy] = useState('');
    const [page, setPage] = useState(1);
    const rowsPerPage = 6; // fixa o per_page
    const [totalPages, setTotalPages] = useState(1);

    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchCalls();
        }
        fetchClients();
        fetchUsers();
        // eslint-disable-next-line
    }, [currentUser]);

    // Quando filtros/pagina mudam, recarrega
    useEffect(() => {
        if (currentUser) {
            fetchCalls();
        }
        // eslint-disable-next-line
    }, [searchTerm, statusFilter, priorityFilter, orderBy, page]);

    /**
     * Busca no backend com paginação e filtros
     */
    const fetchCalls = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            // Monta a querystring
            params.append('page', page);
            params.append('per_page', rowsPerPage);

            if (statusFilter) {
                params.append('status', statusFilter);
            }
            if (searchTerm) {
                params.append('search', searchTerm);
            }
            if (priorityFilter) {
                params.append('priority', priorityFilter);
            }
            if (orderBy) {
                params.append('order', orderBy);
            }

            const res = await api.get(`/calls?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            setCalls(data.items || []);
            setPage(data.page || 1);
            setTotalPages(data.pages || 1);
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar chamados.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Busca lista de clients
     */
    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/clients/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(res.data);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
        }
    };

    /**
     * Busca lista de users
     */
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/auth/users/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Erro ao buscar usuários:', err);
        }
    };

    /**
     * Abre modal para criar ou editar
     */
    const handleOpenModal = (call = null) => {
        setEditingCall(call);
        if (call) {
            setCallForm({
                title: call.title,
                description: call.description,
                priority: call.priority,
                client_id: call.client?.id || '',
                assigned_to_user_id: call.assigned_to?.id || '',
                status: call.status
            });
        } else {
            setCallForm({
                title: '',
                description: '',
                priority: 'Média',
                client_id: '',
                assigned_to_user_id: '',
                status: 'Aberto'
            });
        }
        setModalError('');
        setOpenModal(true);
    };

    /**
     * Cria ou edita o chamado via API
     */
    const handleSaveCall = async () => {
        if (!callForm.title || !callForm.assigned_to_user_id) {
            setModalError('Título e Responsável são obrigatórios.');
            return;
        }
        try {
            setModalError('');
            const token = localStorage.getItem('token');
            if (editingCall) {
                // Edição
                await api.patch(`/calls/${editingCall.id}`, callForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSnackbar({
                    open: true,
                    message: 'Chamado atualizado.',
                    severity: 'success'
                });
            } else {
                // Criação
                await api.post('/calls', callForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSnackbar({
                    open: true,
                    message: 'Chamado criado.',
                    severity: 'success'
                });
            }
            // Recarrega a lista
            fetchCalls();
            setOpenModal(false);
        } catch (err) {
            console.error(err);
            setModalError('Erro ao salvar chamado.');
        }
    };

    /**
     * Deleta (soft delete) o chamado
     */
    const handleDeleteCall = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este chamado?')) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/calls/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSnackbar({
                open: true,
                message: 'Chamado excluído.',
                severity: 'info'
            });
            fetchCalls();
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: 'Erro ao excluir chamado.',
                severity: 'error'
            });
        }
    };

    /**
     * Reseta filtros para o estado inicial
     */
    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setPriorityFilter('');
        setOrderBy('');
        setPage(1);
    };

    // Navega para a tela de detalhes
    const handleCardClick = (callId) => {
        navigate(`/calls/${callId}`);
    };

    return (
        <Container sx={{ pb: 6 }}>
            {/* TÍTULO E BOTÃO DE CRIAR */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} mb={4}>
                <Typography variant="h4" fontWeight="bold" color="white">
                    Chamados
                </Typography>
                {currentUser?.role !== 'convidado' && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal(null)}
                        sx={{
                            borderRadius: 2,
                            fontWeight: 'bold'
                        }}
                    >
                        Novo Chamado
                    </Button>
                )}
            </Box>

            {/* FILTROS */}
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: '#2a2a2a',
                    boxShadow: 4
                }}
            >
                <Typography variant="h6" gutterBottom color="white">
                    Filtros
                </Typography>
                <Box
                    display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(5, auto)'
                    }}
                    gap={2}
                    mt={2}
                    alignItems="center"
                >
                    <TextField
                        label="Buscar"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        size="small"
                        variant="outlined"
                        sx={{
                            '& .MuiInputBase-root': {
                                borderRadius: 2,
                                backgroundColor: '#3a3a3a',
                                color: '#fff'
                            },
                            '& .MuiFormLabel-root': { color: '#bbb' }
                        }}
                    />

                    <TextField
                        select
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(1);
                        }}
                        size="small"
                        variant="outlined"
                        sx={{
                            minWidth: 120,
                            '& .MuiInputBase-root': {
                                borderRadius: 2,
                                backgroundColor: '#3a3a3a',
                                color: '#fff'
                            },
                            '& .MuiFormLabel-root': { color: '#bbb' }
                        }}
                    >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="Aberto">Aberto</MenuItem>
                        <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                        <MenuItem value="Concluído">Concluído</MenuItem>
                        <MenuItem value="Cancelado">Cancelado</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Prioridade"
                        value={priorityFilter}
                        onChange={(e) => {
                            setPriorityFilter(e.target.value);
                            setPage(1);
                        }}
                        size="small"
                        variant="outlined"
                        sx={{
                            minWidth: 120,
                            '& .MuiInputBase-root': {
                                borderRadius: 2,
                                backgroundColor: '#3a3a3a',
                                color: '#fff'
                            },
                            '& .MuiFormLabel-root': { color: '#bbb' }
                        }}
                    >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="Alta">Alta</MenuItem>
                        <MenuItem value="Média">Média</MenuItem>
                        <MenuItem value="Baixa">Baixa</MenuItem>
                    </TextField>

                    <TextField
                        select
                        label="Ordenar por"
                        value={orderBy}
                        onChange={(e) => {
                            setOrderBy(e.target.value);
                            setPage(1);
                        }}
                        size="small"
                        variant="outlined"
                        sx={{
                            minWidth: 160,
                            '& .MuiInputBase-root': {
                                borderRadius: 2,
                                backgroundColor: '#3a3a3a',
                                color: '#fff'
                            },
                            '& .MuiFormLabel-root': { color: '#bbb' }
                        }}
                    >
                        <MenuItem value="">Padrão</MenuItem>
                        <MenuItem value="priority_desc">Prioridade (Alta > Baixa)</MenuItem>
                        <MenuItem value="created_desc">Mais Recentes</MenuItem>
                        <MenuItem value="client_asc">Cliente (A-Z)</MenuItem>
                    </TextField>

                    <Button
                        onClick={resetFilters}
                        variant="outlined"
                        sx={{
                            borderRadius: 2,
                            color: 'white',
                            borderColor: '#666',
                            '&:hover': { borderColor: '#aaa' },
                            justifySelf: { xs: 'start', md: 'end' }
                        }}
                    >
                        Limpar Filtros
                    </Button>
                </Box>
            </Paper>

            {/* LISTA DE CHAMADOS */}
            {loading ? (
                <Box display="flex" justifyContent="center" mt={5}>
                    <CircularProgress sx={{ color: 'white' }} />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {calls.map((call) => {
                            const pColor = priorityColors[call.priority] || {
                                main: '#999',
                                light: '#444'
                            };
                            return (
                                <Grid item xs={12} md={6} lg={4} key={call.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 3,
                                            backgroundColor: '#2c2c2c',
                                            color: '#fff',
                                            boxShadow: 3,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '100%',
                                            cursor: 'pointer',
                                            '&:hover': { opacity: 0.9 }
                                        }}
                                        onClick={() => handleCardClick(call.id)} // <--- TORNA O CARD CLICÁVEL!
                                    >
                                        <CardHeader
                                            avatar={
                                                <Avatar
                                                    sx={{
                                                        bgcolor: pColor.main,
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {call.priority[0]}
                                                </Avatar>
                                            }
                                            title={
                                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                                    {call.title}
                                                </Typography>
                                            }
                                            subheader={
                                                <Typography variant="caption" sx={{ color: '#bbb' }}>
                                                    Criado em: {dayjs(call.created_at).format('DD/MM/YYYY HH:mm')}
                                                </Typography>
                                            }
                                            sx={{
                                                '.MuiCardHeader-title': { color: '#fff' },
                                                backgroundColor: '#1f1f1f',
                                                borderBottom: '1px solid #444'
                                            }}
                                        />
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Box mb={2}>
                                                <Typography variant="body2">
                                                    {call.description || 'Sem descrição'}
                                                </Typography>
                                            </Box>
                                            <Box display="flex" gap={1} mb={2}>
                                                <Chip
                                                    label={call.status}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor:
                                                            call.status === 'Concluído'
                                                                ? '#4caf50'
                                                                : call.status === 'Em Andamento'
                                                                    ? '#ffc107'
                                                                    : call.status === 'Cancelado'
                                                                        ? '#f44336'
                                                                        : '#666',
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                                <Chip
                                                    label={call.priority}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: pColor.main,
                                                        color: '#fff',
                                                        fontWeight: 'bold'
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="caption" display="block" gutterBottom>
                                                <strong>Cliente:</strong> {call.client?.name || 'N/A'}
                                            </Typography>
                                            <Typography variant="caption" display="block">
                                                <strong>Responsável:</strong> {call.assigned_to?.name || 'N/A'}
                                            </Typography>
                                        </CardContent>

                                        {/* Botões de edição e exclusão - sem parar a navegação
                        Se quiser bloquear a navegação, use event.stopPropagation() */}
                                        {currentUser?.id === call.opened_by?.id && (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    p: 1,
                                                    borderTop: '1px solid #444',
                                                    backgroundColor: '#1f1f1f'
                                                }}
                                            >
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // impede abrir a tela de detalhes
                                                        handleOpenModal(call);
                                                    }}
                                                    sx={{
                                                        color: '#ccc',
                                                        '&:hover': { color: '#fff' }
                                                    }}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCall(call.id);
                                                    }}
                                                    sx={{
                                                        color: '#ccc',
                                                        '&:hover': { color: '#fff' }
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* PAGINAÇÃO */}
                    {totalPages > 1 && (
                        <Box mt={4} display="flex" justifyContent="center">
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={(e, val) => setPage(val)}
                                color="primary"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        color: '#fff'
                                    },
                                    '& .MuiPaginationItem-ellipsis': {
                                        color: '#aaa'
                                    }
                                }}
                            />
                        </Box>
                    )}
                </>
            )}

            {/* DIÁLOGO DE CRIAÇÃO/EDIÇÃO */}
            <Dialog
                open={openModal}
                onClose={() => setOpenModal(false)}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        backgroundColor: '#2c2c2c',
                        color: '#fff'
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        backgroundColor: '#1f1f1f',
                        borderBottom: '1px solid #444'
                    }}
                >
                    {editingCall ? 'Editar Chamado' : 'Novo Chamado'}
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    {modalError && <Alert severity="error">{modalError}</Alert>}
                    <br />
                    <TextField
                        label="Título"
                        fullWidth
                        variant="outlined"
                        value={callForm.title}
                        onChange={(e) => setCallForm({ ...callForm, title: e.target.value })}
                        sx={{
                            '& .MuiInputBase-root': {
                                borderRadius: 2,
                                backgroundColor: '#3a3a3a',
                                color: '#fff'
                            },
                            '& .MuiFormLabel-root': { color: '#bbb' }
                        }}
                    />
                    <TextField
                        label="Descrição"
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        value={callForm.description}
                        onChange={(e) => setCallForm({ ...callForm, description: e.target.value })}
                        sx={{
                            '& .MuiInputBase-root': {
                                borderRadius: 2,
                                backgroundColor: '#3a3a3a',
                                color: '#fff'
                            },
                            '& .MuiFormLabel-root': { color: '#bbb' }
                        }}
                    />

                    <Box display="flex" gap={2}>
                        <TextField
                            select
                            label="Prioridade"
                            value={callForm.priority}
                            onChange={(e) =>
                                setCallForm({ ...callForm, priority: e.target.value })
                            }
                            fullWidth
                            variant="outlined"
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#3a3a3a',
                                    color: '#fff'
                                },
                                '& .MuiFormLabel-root': { color: '#bbb' }
                            }}
                        >
                            <MenuItem value="Alta">Alta</MenuItem>
                            <MenuItem value="Média">Média</MenuItem>
                            <MenuItem value="Baixa">Baixa</MenuItem>
                        </TextField>
                        <TextField
                            select
                            label="Status"
                            value={callForm.status}
                            onChange={(e) =>
                                setCallForm({ ...callForm, status: e.target.value })
                            }
                            fullWidth
                            variant="outlined"
                            sx={{
                                '& .MuiInputBase-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#3a3a3a',
                                    color: '#fff'
                                },
                                '& .MuiFormLabel-root': { color: '#bbb' }
                            }}
                        >
                            <MenuItem value="Aberto">Aberto</MenuItem>
                            <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                            <MenuItem value="Concluído">Concluído</MenuItem>
                            <MenuItem value="Cancelado">Cancelado</MenuItem>
                        </TextField>
                    </Box>

                    {/* AUTOCOMPLETE DE CLIENTE */}
                    <Autocomplete
                        freeSolo
                        clearOnEscape
                        options={clients}
                        getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                                return option;
                            }
                            return option.name || '';
                        }}
                        value={
                            callForm.client_id
                                ? clients.find((c) => c.id === callForm.client_id) || null
                                : null
                        }
                        onChange={(event, newValue) => {
                            if (!newValue || typeof newValue === 'string') {
                                setCallForm({ ...callForm, client_id: '' });
                            } else {
                                setCallForm({ ...callForm, client_id: newValue.id });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Cliente (opcional)"
                                variant="outlined"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: 2,
                                        backgroundColor: '#3a3a3a',
                                        color: '#fff'
                                    },
                                    '& .MuiFormLabel-root': { color: '#bbb' }
                                }}
                            />
                        )}
                    />

                    {/* AUTOCOMPLETE DE RESPONSÁVEL */}
                    <Autocomplete
                        freeSolo
                        clearOnEscape
                        options={users}
                        getOptionLabel={(option) => {
                            if (typeof option === 'string') {
                                return option;
                            }
                            return option.name || '';
                        }}
                        value={
                            callForm.assigned_to_user_id
                                ? users.find((u) => u.id === callForm.assigned_to_user_id) || null
                                : null
                        }
                        onChange={(event, newValue) => {
                            if (!newValue || typeof newValue === 'string') {
                                setCallForm({ ...callForm, assigned_to_user_id: '' });
                            } else {
                                setCallForm({ ...callForm, assigned_to_user_id: newValue.id });
                            }
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Responsável"
                                variant="outlined"
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: 2,
                                        backgroundColor: '#3a3a3a',
                                        color: '#fff'
                                    },
                                    '& .MuiFormLabel-root': { color: '#bbb' }
                                }}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions
                    sx={{
                        backgroundColor: '#1f1f1f',
                        borderTop: '1px solid #444'
                    }}
                >
                    <Button onClick={() => setOpenModal(false)} sx={{ color: '#fff' }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveCall}
                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                    >
                        {editingCall ? 'Salvar' : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* SNACKBAR DE FEEDBACK */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                message={snackbar.message}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            />
        </Container>
    );
}
