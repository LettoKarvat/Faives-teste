import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    MenuItem,
    Paper,
    Chip,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';

// Helpers para cores de Chips
const getStatusChipColor = (status) => {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('pendente') || normalized.includes('aberto')) {
        return 'warning';
    }
    if (normalized.includes('andamento') || normalized.includes('progresso')) {
        return 'primary';
    }
    if (normalized.includes('atraso')) {
        return 'error';
    }
    if (normalized.includes('conclu')) {
        return 'success';
    }
    return 'default';
};

const getPriorityChipColor = (priority) => {
    const normalized = (priority || '').toLowerCase();
    if (normalized.includes('alta')) return 'error';
    if (normalized.includes('média') || normalized.includes('media')) return 'warning';
    if (normalized.includes('baixa')) return 'success';
    return 'default';
};

export default function ProjectDetail() {
    const { id } = useParams(); // /projects/:id
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal: criar nova tarefa
    const [openTaskModal, setOpenTaskModal] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        status: '',
        priority: '',
        start_date: '',
        due_date: '',
        assigned_to_user_id: '',
    });

    // Modal: editar projeto
    const [openEditProjectModal, setOpenEditProjectModal] = useState(false);
    const [editProjectForm, setEditProjectForm] = useState({
        name: '',
        status: '',
        deadline: '',
        description: '',
        progress: 0,
        responsible_user_id: '',
        associated_user_ids: [],
    });

    // Modal: editar tarefa
    const [openEditTaskModal, setOpenEditTaskModal] = useState(false);
    const [editTaskForm, setEditTaskForm] = useState({
        id: null,
        title: '',
        description: '',
        status: '',
        priority: '',
        start_date: '',
        due_date: '',
        assigned_to_user_id: '',
    });

    const [users, setUsers] = useState([]);

    // -----------------------------
    // Buscar detalhes do projeto
    const fetchProjectDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.get(`/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setProject(response.data);
        } catch (err) {
            console.error('Erro ao carregar detalhes do projeto', err);
            setError('Não foi possível carregar os detalhes do projeto.');
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Buscar lista de usuários
    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/auth/users/list', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Erro ao buscar usuários', error);
        }
    };

    // -----------------------------
    // Carrega dados iniciais
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
        fetchProjectDetails();
        fetchUsers();
    }, [id]);

    // -----------------------------
    // Regras de permissão
    const isAdminOrCreator =
        currentUser &&
        (currentUser.role === 'admin' || currentUser.id === project?.creator?.id);

    const canEditOrDeleteTask = (task) => {
        if (!currentUser) return false;
        if (currentUser.role === 'admin') return true;
        if (project.creator && currentUser.id === project.creator.id) return true;
        if (task.assigned_to && currentUser.id === task.assigned_to.id) return true;
        return false;
    };

    // -----------------------------
    // Modal Criar Tarefa
    const handleOpenTaskModal = () => {
        setTaskForm({
            title: '',
            description: '',
            status: '',
            priority: '',
            start_date: '',
            due_date: '',
            assigned_to_user_id: '',
        });
        setOpenTaskModal(true);
    };
    const handleCloseTaskModal = () => {
        setOpenTaskModal(false);
    };
    const handleTaskFormChange = (e) => {
        const { name, value } = e.target;
        setTaskForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleStartDateChange = (newValue) => {
        if (!newValue) {
            setTaskForm((prev) => ({ ...prev, start_date: '' }));
        } else {
            setTaskForm((prev) => ({
                ...prev,
                start_date: dayjs(newValue).format('YYYY-MM-DD'),
            }));
        }
    };
    const handleDueDateChange = (newValue) => {
        if (!newValue) {
            setTaskForm((prev) => ({ ...prev, due_date: '' }));
        } else {
            setTaskForm((prev) => ({
                ...prev,
                due_date: dayjs(newValue).format('YYYY-MM-DD'),
            }));
        }
    };
    const handleCreateTask = async () => {
        if (!taskForm.title) {
            alert('Título é obrigatório');
            return;
        }
        // Se data de término < data de início
        if (
            taskForm.due_date &&
            taskForm.start_date &&
            dayjs(taskForm.due_date).isBefore(dayjs(taskForm.start_date))
        ) {
            alert('A data de término não pode ser menor que a data de início.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = {
                ...taskForm,
                project_id: parseInt(id, 10),
            };
            await api.post('/tasks/create', payload, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOpenTaskModal(false);
            fetchProjectDetails();
        } catch (error) {
            console.error('Erro ao criar tarefa', error);
            alert('Não foi possível criar a tarefa.');
        }
    };

    // -----------------------------
    // Editar / Excluir Projeto
    const handleOpenEditProjectModal = () => {
        if (!project) return;
        setEditProjectForm({
            name: project.name || '',
            status: project.status || '',
            deadline: project.deadline || '',
            description: project.description || '',
            progress: project.progress || 0,
            responsible_user_id: project.responsible ? project.responsible.id : '',
            associated_user_ids: project.associated_users
                ? project.associated_users.map((u) => u.id)
                : [],
        });
        setOpenEditProjectModal(true);
    };
    const handleCloseEditProjectModal = () => {
        setOpenEditProjectModal(false);
    };
    const handleEditProjectFormChange = (e) => {
        const { name, value } = e.target;
        setEditProjectForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleEditProjectMultiSelectChange = (e) => {
        const { value } = e.target;
        setEditProjectForm((prev) => ({
            ...prev,
            associated_user_ids: typeof value === 'string' ? value.split(',') : value,
        }));
    };
    const handleEditProjectDeadlineChange = (newValue) => {
        if (!newValue) {
            setEditProjectForm((prev) => ({ ...prev, deadline: '' }));
        } else {
            setEditProjectForm((prev) => ({
                ...prev,
                deadline: dayjs(newValue).format('YYYY-MM-DD'),
            }));
        }
    };
    const handleUpdateProject = async () => {
        try {
            const token = localStorage.getItem('token');
            await api.patch(`/projects/${project.id}`, editProjectForm, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOpenEditProjectModal(false);
            fetchProjectDetails();
        } catch (error) {
            console.error('Erro ao atualizar projeto', error);
            alert('Não foi possível atualizar o projeto.');
        }
    };
    const handleDeleteProject = async () => {
        if (!window.confirm('Tem certeza que deseja excluir este projeto?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/projects/${project.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Projeto excluído com sucesso.');
            navigate('/projects');
        } catch (error) {
            console.error('Erro ao deletar projeto', error);
            alert('Não foi possível deletar o projeto.');
        }
    };

    // -----------------------------
    // Editar / Excluir Tarefa
    const handleOpenEditTaskModal = (task) => {
        setEditTaskForm({
            id: task.id,
            title: task.title || '',
            description: task.description || '',
            status: task.status || '',
            priority: task.priority || '',
            start_date: task.start_date || '',
            due_date: task.due_date || '',
            assigned_to_user_id: task.assigned_to ? task.assigned_to.id : '',
        });
        setOpenEditTaskModal(true);
    };
    const handleCloseEditTaskModal = () => {
        setOpenEditTaskModal(false);
    };
    const handleEditTaskFormChange = (e) => {
        const { name, value } = e.target;
        setEditTaskForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    const handleEditTaskStartDateChange = (newValue) => {
        if (!newValue) {
            setEditTaskForm((prev) => ({ ...prev, start_date: '' }));
        } else {
            setEditTaskForm((prev) => ({
                ...prev,
                start_date: dayjs(newValue).format('YYYY-MM-DD'),
            }));
        }
    };
    const handleEditTaskDueDateChange = (newValue) => {
        if (!newValue) {
            setEditTaskForm((prev) => ({ ...prev, due_date: '' }));
        } else {
            setEditTaskForm((prev) => ({
                ...prev,
                due_date: dayjs(newValue).format('YYYY-MM-DD'),
            }));
        }
    };
    const handleUpdateTask = async () => {
        if (
            editTaskForm.due_date &&
            editTaskForm.start_date &&
            dayjs(editTaskForm.due_date).isBefore(dayjs(editTaskForm.start_date))
        ) {
            alert('A data de término não pode ser menor que a data de início.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const payload = { ...editTaskForm };
            const { id: taskId, ...body } = payload;
            await api.patch(`/tasks/${taskId}`, body, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOpenEditTaskModal(false);
            fetchProjectDetails();
        } catch (error) {
            console.error('Erro ao atualizar tarefa', error);
            alert('Não foi possível atualizar a tarefa.');
        }
    };
    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/tasks/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Tarefa excluída com sucesso.');
            fetchProjectDetails();
        } catch (error) {
            console.error('Erro ao deletar tarefa', error);
            alert('Não foi possível deletar a tarefa.');
        }
    };

    // -----------------------------
    // Concluir Tarefa (Botão Verde)
    const handleCompleteTask = async (taskId) => {
        try {
            const token = localStorage.getItem('token');
            await api.patch(
                `/tasks/${taskId}`,
                { status: 'Concluída' },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            fetchProjectDetails();
        } catch (error) {
            console.error('Erro ao concluir tarefa', error);
            alert('Não foi possível concluir a tarefa.');
        }
    };

    // -----------------------------
    // Render
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }
    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }
    if (!project) {
        return <Typography>Projeto não encontrado.</Typography>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <Paper sx={{ p: 3, mb: 4 }} elevation={3}>
                <Typography variant="h4" gutterBottom>
                    Detalhes do Projeto
                </Typography>

                <Box mt={2} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6">Nome: {project.name}</Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography>Status:</Typography>
                        <Chip
                            size="small"
                            label={`Status: ${project.status || 'N/A'}`}
                            color={getStatusChipColor(project.status)}
                            variant="outlined"
                            sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                    </Box>

                    <Typography>
                        Prazo: <strong>{project.deadline || 'N/A'}</strong>
                    </Typography>
                    <Typography>
                        Progresso: <strong>{project.progress}%</strong>
                    </Typography>
                    <Typography>Descrição: {project.description || 'N/A'}</Typography>

                    <Typography sx={{ mt: 1 }}>
                        Responsável Principal:{' '}
                        {project.responsible ? project.responsible.name : 'N/A'}
                    </Typography>

                    {project.associated_users && project.associated_users.length > 0 && (
                        <Typography>
                            Responsáveis Adicionais:{' '}
                            {project.associated_users.map((u) => u.name).join(', ')}
                        </Typography>
                    )}

                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        Cliente: {project.client ? project.client.name : 'Não atribuído'}
                    </Typography>
                </Box>

                {/* Se for admin ou criador, pode editar ou excluir */}
                {isAdminOrCreator && (
                    <Box mt={2} display="flex" gap={2}>
                        {/* Botões "outlined" agora, para ficar igual ao "EDITAR" e "EXCLUIR" da tarefa */}
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={handleOpenEditProjectModal}
                        >
                            EDITAR PROJETO
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeleteProject}
                        >
                            EXCLUIR PROJETO
                        </Button>
                    </Box>
                )}
            </Paper>

            {/* LISTA DE TAREFAS */}
            <Typography variant="h5" sx={{ mb: 2 }}>
                Tarefas
            </Typography>
            {project.tasks && project.tasks.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {project.tasks.map((task) => {
                        const canEdit = canEditOrDeleteTask(task);

                        return (
                            <Paper
                                key={task.id}
                                sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
                                elevation={1}
                            >
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {task.title}
                                </Typography>

                                {/* Chips lado a lado */}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                        size="small"
                                        label={`Status: ${task.status || 'N/A'}`}
                                        color={getStatusChipColor(task.status)}
                                        variant="outlined"
                                        sx={{ fontSize: '0.75rem', height: 24 }}
                                    />
                                    <Chip
                                        size="small"
                                        label={`Prioridade: ${task.priority || 'N/A'}`}
                                        color={getPriorityChipColor(task.priority)}
                                        variant="outlined"
                                        sx={{ fontSize: '0.75rem', height: 24 }}
                                    />
                                </Box>

                                <Typography variant="body2">
                                    Período: {task.start_date || 'N/A'} até {task.due_date || 'N/A'}
                                </Typography>
                                {task.assigned_to && (
                                    <Typography variant="body2">
                                        Atribuída para: {task.assigned_to.name}
                                    </Typography>
                                )}
                                <Typography variant="body2">
                                    Descrição: {task.description || 'N/A'}
                                </Typography>

                                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                    {/* Botão Concluir agora "outlined" */}
                                    {!task.status?.toLowerCase().includes('conclu') && (
                                        <Button
                                            variant="outlined"
                                            color="success"
                                            onClick={() => handleCompleteTask(task.id)}
                                        >
                                            CONCLUIR
                                        </Button>
                                    )}

                                    {canEdit && (
                                        <>
                                            <Button variant="outlined" onClick={() => handleOpenEditTaskModal(task)}>
                                                EDITAR
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleDeleteTask(task.id)}
                                            >
                                                EXCLUIR
                                            </Button>
                                        </>
                                    )}
                                </Box>
                            </Paper>
                        );
                    })}
                </Box>
            ) : (
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Não há tarefas para este projeto.
                </Typography>
            )}

            {/* Botão para criar tarefa */}
            <Box mt={3}>
                <Button variant="contained" onClick={handleOpenTaskModal}>
                    Nova Tarefa
                </Button>
            </Box>

            {/* ---------- MODAIS ---------- */}

            {/* MODAL: CRIAR TAREFA */}
            <Dialog open={openTaskModal} onClose={handleCloseTaskModal} fullWidth maxWidth="sm">
                <DialogTitle>Criar Tarefa</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Título"
                        name="title"
                        variant="outlined"
                        fullWidth
                        value={taskForm.title}
                        onChange={handleTaskFormChange}
                        required
                    />

                    <TextField
                        label="Descrição"
                        name="description"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={taskForm.description}
                        onChange={handleTaskFormChange}
                    />

                    {/* Select de Status */}
                    <TextField
                        select
                        label="Status"
                        name="status"
                        variant="outlined"
                        fullWidth
                        value={taskForm.status}
                        onChange={handleTaskFormChange}
                    >
                        <MenuItem value="">
                            <em>Selecione</em>
                        </MenuItem>
                        <MenuItem value="Pendente">Pendente</MenuItem>
                        <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                        <MenuItem value="Concluída">Concluída</MenuItem>
                    </TextField>

                    {/* Select de Prioridade */}
                    <TextField
                        select
                        label="Prioridade"
                        name="priority"
                        variant="outlined"
                        fullWidth
                        value={taskForm.priority}
                        onChange={handleTaskFormChange}
                    >
                        <MenuItem value="Alta">Alta</MenuItem>
                        <MenuItem value="Média">Média</MenuItem>
                        <MenuItem value="Baixa">Baixa</MenuItem>
                    </TextField>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Data de Início"
                            format="DD/MM/YYYY"
                            value={taskForm.start_date ? dayjs(taskForm.start_date) : null}
                            onChange={handleStartDateChange}
                            slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                    </LocalizationProvider>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Data de Término"
                            format="DD/MM/YYYY"
                            value={taskForm.due_date ? dayjs(taskForm.due_date) : null}
                            onChange={handleDueDateChange}
                            slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                    </LocalizationProvider>

                    <TextField
                        select
                        label="Atribuir a"
                        name="assigned_to_user_id"
                        variant="outlined"
                        fullWidth
                        value={taskForm.assigned_to_user_id}
                        onChange={handleTaskFormChange}
                    >
                        <MenuItem value="">
                            <em>Ninguém</em>
                        </MenuItem>
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseTaskModal}>Cancelar</Button>
                    <Button variant="outlined" onClick={handleCreateTask}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: EDITAR PROJETO */}
            <Dialog
                open={openEditProjectModal}
                onClose={handleCloseEditProjectModal}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Editar Projeto</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Nome do Projeto"
                        name="name"
                        variant="outlined"
                        fullWidth
                        value={editProjectForm.name}
                        onChange={handleEditProjectFormChange}
                    />

                    <TextField
                        label="Status"
                        name="status"
                        variant="outlined"
                        fullWidth
                        value={editProjectForm.status}
                        onChange={handleEditProjectFormChange}
                        placeholder="Ex.: Em Aberto, Em Progresso, Concluído"
                    />

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Prazo"
                            format="DD/MM/YYYY"
                            value={editProjectForm.deadline ? dayjs(editProjectForm.deadline) : null}
                            onChange={handleEditProjectDeadlineChange}
                            slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                    </LocalizationProvider>

                    <TextField
                        label="Descrição"
                        name="description"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={editProjectForm.description}
                        onChange={handleEditProjectFormChange}
                    />

                    <TextField
                        label="Progresso (%)"
                        name="progress"
                        variant="outlined"
                        type="number"
                        fullWidth
                        value={editProjectForm.progress}
                        onChange={handleEditProjectFormChange}
                    />

                    <TextField
                        select
                        label="Responsável (principal)"
                        name="responsible_user_id"
                        variant="outlined"
                        fullWidth
                        value={editProjectForm.responsible_user_id}
                        onChange={handleEditProjectFormChange}
                    >
                        <MenuItem value="">
                            <em>Nenhum</em>
                        </MenuItem>
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Usuários Associados"
                        name="associated_user_ids"
                        variant="outlined"
                        fullWidth
                        SelectProps={{ multiple: true }}
                        value={editProjectForm.associated_user_ids}
                        onChange={handleEditProjectMultiSelectChange}
                    >
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditProjectModal}>Cancelar</Button>
                    <Button variant="outlined" onClick={handleUpdateProject}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: EDITAR TAREFA */}
            <Dialog
                open={openEditTaskModal}
                onClose={handleCloseEditTaskModal}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Editar Tarefa</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Título"
                        name="title"
                        variant="outlined"
                        fullWidth
                        value={editTaskForm.title}
                        onChange={handleEditTaskFormChange}
                        required
                    />

                    <TextField
                        label="Descrição"
                        name="description"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={editTaskForm.description}
                        onChange={handleEditTaskFormChange}
                    />

                    {/* Select de Status */}
                    <TextField
                        select
                        label="Status"
                        name="status"
                        variant="outlined"
                        fullWidth
                        value={editTaskForm.status}
                        onChange={handleEditTaskFormChange}
                    >
                        <MenuItem value="">
                            <em>Selecione</em>
                        </MenuItem>
                        <MenuItem value="Pendente">Pendente</MenuItem>
                        <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                        <MenuItem value="Concluída">Concluída</MenuItem>
                    </TextField>

                    {/* Select de Prioridade */}
                    <TextField
                        select
                        label="Prioridade"
                        name="priority"
                        variant="outlined"
                        fullWidth
                        value={editTaskForm.priority}
                        onChange={handleEditTaskFormChange}
                    >
                        <MenuItem value="Baixa">Baixa</MenuItem>
                        <MenuItem value="Média">Média</MenuItem>
                        <MenuItem value="Alta">Alta</MenuItem>
                    </TextField>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Data de Início"
                            format="DD/MM/YYYY"
                            value={editTaskForm.start_date ? dayjs(editTaskForm.start_date) : null}
                            onChange={handleEditTaskStartDateChange}
                            slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                    </LocalizationProvider>

                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            label="Data de Término"
                            format="DD/MM/YYYY"
                            value={editTaskForm.due_date ? dayjs(editTaskForm.due_date) : null}
                            onChange={handleEditTaskDueDateChange}
                            slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
                        />
                    </LocalizationProvider>

                    <TextField
                        select
                        label="Atribuir a"
                        name="assigned_to_user_id"
                        variant="outlined"
                        fullWidth
                        value={editTaskForm.assigned_to_user_id}
                        onChange={handleEditTaskFormChange}
                    >
                        <MenuItem value="">
                            <em>Ninguém</em>
                        </MenuItem>
                        {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                                {user.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditTaskModal}>Cancelar</Button>
                    <Button variant="outlined" onClick={handleUpdateTask}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
