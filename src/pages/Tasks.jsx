import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  MenuItem,
  Snackbar,
  Pagination,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import SearchIcon from '@mui/icons-material/Search';

import api from '../services/api';

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentUser, setCurrentUser] = useState(null);

  // MODAL: Criar Tarefa
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');

  // MODAL: Editar Tarefa
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');

  // FILTROS
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // ORDENACAO
  const [sortBy, setSortBy] = useState('');

  // PAGINACAO
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  // SNACKBAR
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const handleSnackbarClose = () => setSnackbarOpen(false);

  // Expansão da descrição
  const [expandedIds, setExpandedIds] = useState([]);
  const toggleExpand = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // -----------------------
  // useEffect inicial
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    fetchTasks();
    fetchProjects();
    fetchUsers();
  }, []);

  // Buscar tarefas
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/tasks/list', {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Se o prazo passou e não está concluída, exibe "Em Atraso"
      const fetchedTasks = response.data;
      const updatedTasks = fetchedTasks.map((task) => {
        if (
          task.due_date &&
          dayjs(task.due_date).isBefore(dayjs()) &&
          task.status !== 'Concluída'
        ) {
          return { ...task, status: 'Em Atraso' };
        }
        return task;
      });

      setTasks(updatedTasks);
    } catch (err) {
      console.error('Erro ao buscar tarefas:', err);
      setError('Não foi possível carregar as tarefas.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar projetos
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/projects/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data);
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
    }
  };

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/users/list', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  // -----------------------
  // Filtro + Ordenação
  const getFilteredAndSortedTasks = () => {
    if (!currentUser) return [];

    // *** Ajuste para permitir que "admin" E "colaborador" vejam TODAS as tarefas. ***
    let visibleTasks;
    if (currentUser.role === 'admin' || currentUser.role === 'colaborador') {
      visibleTasks = tasks; // <--- ADICIONADO
    } else {
      // Se fosse outro role (ex. "user") que só enxerga tarefas sem responsável ou atribuídas a ele
      visibleTasks = tasks.filter(
        (t) => !t.assigned_to || t.assigned_to.id === currentUser.id
      );
    }

    // FILTRO: busca por título
    if (searchTerm.trim()) {
      visibleTasks = visibleTasks.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // FILTRO: status
    if (statusFilter) {
      visibleTasks = visibleTasks.filter((t) => t.status === statusFilter);
    }

    // FILTRO: prioridade
    if (priorityFilter) {
      visibleTasks = visibleTasks.filter((t) => t.priority === priorityFilter);
    }

    // ORDENAÇÃO
    if (sortBy === 'due_date') {
      visibleTasks.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return dayjs(a.due_date).diff(dayjs(b.due_date));
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { Alta: 1, Média: 2, Baixa: 3 };
      visibleTasks.sort((a, b) => {
        const aVal = priorityOrder[a.priority] || 99;
        const bVal = priorityOrder[b.priority] || 99;
        return aVal - bVal;
      });
    }

    return visibleTasks;
  };

  // Paginação local
  const allFilteredTasks = getFilteredAndSortedTasks();
  const totalPages = Math.ceil(allFilteredTasks.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const tasksOnPage = allFilteredTasks.slice(startIndex, endIndex);

  // -----------------------
  // Criar tarefa
  const handleOpenCreateModal = () => setOpenCreateDialog(true);
  const handleCloseCreateModal = () => setOpenCreateDialog(false);

  const handleCreateTask = async () => {
    // *** Permite que "admin" e "colaborador" criem tarefas. ***
    if (!currentUser) {
      alert('É preciso estar logado para criar tarefas.');
      return;
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'colaborador') {
      alert('Você não tem permissão para criar tarefas.');
      return;
    }

    if (!newTitle) {
      alert('Título é obrigatório');
      return;
    }

    if (newDueDate && newStartDate && dayjs(newDueDate).isBefore(dayjs(newStartDate))) {
      alert('A data de término não pode ser menor que a data de início.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: newTitle,
        description: newDescription || '',
        status: newStatus || 'Pendente',
        priority: newPriority || 'Baixa',
      };
      if (newStartDate) payload.start_date = newStartDate;
      if (newDueDate) payload.due_date = newDueDate;

      // *** Se for "admin", pode escolher o project e assigned_to normalmente. ***
      // *** Se for "colaborador", obriga a atribuição a si mesmo. ***
      if (currentUser.role === 'admin') {
        if (newProjectId) payload.project_id = parseInt(newProjectId, 10);
        if (newAssignedTo) {
          payload.assigned_to_user_id = parseInt(newAssignedTo, 10);
        }
      } else if (currentUser.role === 'colaborador') {
        // Se quiser permitir escolher o projeto também para colaborador, basta deixar:
        if (newProjectId) payload.project_id = parseInt(newProjectId, 10);
        // Mas a tarefa será atribuída ao próprio colaborador, independente do que estiver no campo.
        payload.assigned_to_user_id = currentUser.id; // <--- ADICIONADO
      }

      await api.post('/tasks/create', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // reset
      setNewTitle('');
      setNewDescription('');
      setNewProjectId('');
      setNewStatus('');
      setNewPriority('');
      setNewStartDate('');
      setNewDueDate('');
      setNewAssignedTo('');
      setOpenCreateDialog(false);

      fetchTasks();
      setSnackbarMsg('Tarefa criada com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      alert('Não foi possível criar a tarefa');
    }
  };

  // -----------------------
  // Clique no Card => assumir ou concluir
  const handleCardClick = (task) => {
    if (!currentUser) return;
    if (task.status?.toLowerCase().includes('conclu')) return;

    const assignedUser = task.assigned_to;
    if (!assignedUser) {
      const confirmar = window.confirm('Deseja assumir esta tarefa?');
      if (!confirmar) return;
      handleAssignToMe(task.id);
    } else if (assignedUser.id === currentUser.id) {
      const confirmar = window.confirm('Deseja marcar esta tarefa como concluída?');
      if (!confirmar) return;
      handleCompleteTask(task.id);
    }
  };

  const handleAssignToMe = async (taskId) => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/tasks/${taskId}`,
        { assigned_to_user_id: currentUser.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      setSnackbarMsg('Tarefa assumida com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erro ao atribuir tarefa:', err);
      alert('Não foi possível atribuir a tarefa.');
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!currentUser) return;
    try {
      const token = localStorage.getItem('token');
      await api.patch(
        `/tasks/${taskId}`,
        { status: 'Concluída' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      setSnackbarMsg('Tarefa concluída com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erro ao concluir tarefa:', err);
      alert('Não foi possível concluir a tarefa.');
    }
  };

  // -----------------------
  // Editar / Excluir (apenas admin)
  const canAdminEditOrDelete = (user) => user?.role === 'admin';

  const handleOpenEditModal = (task) => {
    setEditTaskId(task.id || null);
    setEditTitle(task.title || '');
    setEditDescription(task.description || '');
    setEditProjectId(task.project ? String(task.project.id) : '');
    // Se estava "Em Atraso", consideramos que o status real é "Em Andamento".
    setEditStatus(task.status === 'Em Atraso' ? 'Em Andamento' : task.status || 'Pendente');
    setEditPriority(task.priority || 'Baixa');
    setEditStartDate(task.start_date || '');
    setEditDueDate(task.due_date || '');
    setEditAssignedTo(task.assigned_to ? String(task.assigned_to.id) : '');
    setOpenEditDialog(true);
  };

  const handleCloseEditModal = () => setOpenEditDialog(false);

  const handleUpdateTask = async () => {
    if (!currentUser || currentUser.role !== 'admin') return; // <--- SOMENTE ADMIN
    if (!editTaskId) {
      alert('Nenhuma tarefa selecionada');
      return;
    }
    if (!editTitle) {
      alert('Título é obrigatório');
      return;
    }

    if (editDueDate && editStartDate && dayjs(editDueDate).isBefore(dayjs(editStartDate))) {
      alert('A data de término não pode ser menor que a data de início.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: editTitle,
        description: editDescription || '',
        status: editStatus || 'Pendente',
        priority: editPriority || 'Baixa',
      };
      if (editStartDate) payload.start_date = editStartDate;
      if (editDueDate) payload.due_date = editDueDate;
      if (editProjectId) payload.project_id = parseInt(editProjectId, 10);
      if (editAssignedTo) payload.assigned_to_user_id = parseInt(editAssignedTo, 10);

      await api.patch(`/tasks/${editTaskId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOpenEditDialog(false);
      fetchTasks();
      setSnackbarMsg('Tarefa atualizada com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      alert('Não foi possível atualizar a tarefa');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!currentUser || currentUser.role !== 'admin') return; // <--- SOMENTE ADMIN
    if (!window.confirm('Deseja excluir esta tarefa?')) return;

    try {
      const token = localStorage.getItem('token');
      await api.delete(`/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchTasks();
      setSnackbarMsg('Tarefa excluída com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
      alert('Não foi possível excluir a tarefa');
    }
  };

  // -----------------------
  // Funções de cor para Chips
  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Pendente':
        return 'warning';
      case 'Em Andamento':
        return 'primary';
      case 'Em Atraso':
        return 'error';
      case 'Concluída':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityChipColor = (priority) => {
    switch (priority) {
      case 'Alta':
        return 'error';
      case 'Média':
        return 'warning';
      case 'Baixa':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTruncatedText = (text, id) => {
    if (!text) return 'N/A';
    const limit = 100;
    if (text.length <= limit || expandedIds.includes(id)) {
      return text;
    }
    return text.substring(0, limit) + '...';
  };

  // -----------------------
  // Render
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
        Tarefas
      </Typography>

      {/* Barra de Filtros e Busca */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          label="Buscar por título"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          InputProps={{
            endAdornment: <SearchIcon />,
          }}
        />

        <TextField
          select
          label="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="Pendente">Pendente</MenuItem>
          <MenuItem value="Em Andamento">Em Andamento</MenuItem>
          <MenuItem value="Em Atraso">Em Atraso</MenuItem>
          <MenuItem value="Concluída">Concluída</MenuItem>
        </TextField>

        <TextField
          select
          label="Filtrar por Prioridade"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="Alta">Alta</MenuItem>
          <MenuItem value="Média">Média</MenuItem>
          <MenuItem value="Baixa">Baixa</MenuItem>
        </TextField>

        <TextField
          select
          label="Ordenar"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">Sem ordenação</MenuItem>
          <MenuItem value="due_date">Pelo Prazo (Data de término)</MenuItem>
          <MenuItem value="priority">Pela Prioridade</MenuItem>
        </TextField>
      </Box>

      {/* Botão "Nova Tarefa" visível p/ admin e colaborador */}
      {currentUser && (currentUser.role === 'admin' || currentUser.role === 'colaborador') && (
        <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpenCreateModal}>
          Nova Tarefa
        </Button>
      )}

      <Grid container spacing={2}>
        {tasksOnPage.map((task) => {
          const {
            id,
            title,
            project,
            status,
            priority,
            start_date,
            due_date,
            assigned_to,
          } = task;

          const projectName = project ? project.name : 'Nenhum';
          const assignedToName = assigned_to?.name || null;
          const assignedToId = assigned_to?.id || null;

          const isAssigned = !!assignedToName;

          // Define estilo do card (apenas exemplo)
          const cardSx = {
            backgroundColor: !isAssigned ? '#0c0e2b' : 'inherit',
            cursor:
              !isAssigned || (isAssigned && assignedToId === currentUser?.id)
                ? 'pointer'
                : 'default',
          };

          const truncatedDesc = getTruncatedText(task.description, id);
          const isExpanded = expandedIds.includes(id);

          return (
            <Grid item key={id} xs={12} sm={6} md={4}>
              <Card sx={cardSx} onClick={() => handleCardClick(task)}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {title}
                  </Typography>

                  <Typography variant="body2" color="textSecondary">
                    Projeto: {projectName}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      size="small"
                      label={`Status: ${status}`}
                      color={getStatusChipColor(status)}
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                    <Chip
                      size="small"
                      label={`Prioridade: ${priority}`}
                      color={getPriorityChipColor(priority)}
                      variant="outlined"
                      sx={{ fontSize: '0.75rem', height: 24 }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Início: {start_date || '-'}
                  </Typography>
                  <Typography variant="body2">Fim: {due_date || '-'}</Typography>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Descrição: {truncatedDesc}
                    {task.description?.length > 100 && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(id);
                        }}
                      >
                        {isExpanded ? 'ver menos' : 'ver mais'}
                      </Button>
                    )}
                  </Typography>

                  {!isAssigned ? (
                    <Typography variant="body2" sx={{ mt: 1, color: '#fff' }}>
                      Responsável: Ninguém (clique para assumir)
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 1, color: '#fff' }}>
                      Responsável: {assignedToName}
                    </Typography>
                  )}

                  {/* Botões de Editar/Excluir (apenas admin) */}
                  {canAdminEditOrDelete(currentUser) && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(task);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(id);
                        }}
                      >
                        Excluir
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* MODAL: CRIAR TAREFA */}
      <Dialog
        open={openCreateDialog}
        onClose={handleCloseCreateModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Criar Tarefa</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Título"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <TextField
            label="Descrição"
            multiline
            rows={3}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          {/* Se quiser permitir que COLABORADOR também escolha projeto, pode deixar este campo.
              Caso contrário, você pode omitir completamente. */}
          <TextField
            select
            label="Projeto (opcional)"
            value={newProjectId}
            onChange={(e) => setNewProjectId(e.target.value)}
            fullWidth
            disabled={currentUser?.role !== 'admin'} // <--- Se quiser só admin escolhendo
          >
            <MenuItem value="">
              <em>Nenhum</em>
            </MenuItem>
            {projects.map((proj) => (
              <MenuItem key={proj.id} value={proj.id}>
                {proj.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            fullWidth
          >
            <MenuItem value="">
              <em>Selecione</em>
            </MenuItem>
            <MenuItem value="Pendente">Pendente</MenuItem>
            <MenuItem value="Em Andamento">Em Andamento</MenuItem>
            <MenuItem value="Concluída">Concluída</MenuItem>
          </TextField>

          <TextField
            select
            label="Prioridade"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            fullWidth
          >
            <MenuItem value="Alta">Alta</MenuItem>
            <MenuItem value="Média">Média</MenuItem>
            <MenuItem value="Baixa">Baixa</MenuItem>
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de Início (opcional)"
              format="DD/MM/YYYY"
              value={newStartDate ? dayjs(newStartDate) : null}
              onChange={(newValue) => {
                const dateStr = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
                setNewStartDate(dateStr);
              }}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de Término (opcional)"
              format="DD/MM/YYYY"
              value={newDueDate ? dayjs(newDueDate) : null}
              onChange={(newValue) => {
                if (!newValue) {
                  setNewDueDate('');
                  return;
                }
                const formatted = dayjs(newValue).format('YYYY-MM-DD');
                if (newStartDate && dayjs(formatted).isBefore(dayjs(newStartDate))) {
                  alert('A data de término não pode ser menor que a data de início.');
                  return;
                }
                setNewDueDate(formatted);
              }}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </LocalizationProvider>

          {/* Se for admin, exibe campo para escolher responsável;
              se for colaborador, ocultamos ou desabilitamos. */}
          {currentUser?.role === 'admin' && (
            <TextField
              select
              label="Atribuir a (opcional)"
              value={newAssignedTo}
              onChange={(e) => setNewAssignedTo(e.target.value)}
              fullWidth
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateTask}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL: EDITAR TAREFA - somente admin */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar Tarefa</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Título"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
          />
          <TextField
            label="Descrição"
            multiline
            rows={3}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <TextField
            select
            label="Projeto (opcional)"
            value={editProjectId}
            onChange={(e) => setEditProjectId(e.target.value)}
            fullWidth
          >
            <MenuItem value="">
              <em>Nenhum</em>
            </MenuItem>
            {projects.map((proj) => (
              <MenuItem key={proj.id} value={proj.id}>
                {proj.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            fullWidth
          >
            <MenuItem value="">
              <em>Selecione</em>
            </MenuItem>
            <MenuItem value="Pendente">Pendente</MenuItem>
            <MenuItem value="Em Andamento">Em Andamento</MenuItem>
            <MenuItem value="Concluída">Concluída</MenuItem>
          </TextField>

          <TextField
            select
            label="Prioridade"
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            fullWidth
          >
            <MenuItem value="Baixa">Baixa</MenuItem>
            <MenuItem value="Média">Média</MenuItem>
            <MenuItem value="Alta">Alta</MenuItem>
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de Início (opcional)"
              format="DD/MM/YYYY"
              value={editStartDate ? dayjs(editStartDate) : null}
              onChange={(newValue) => {
                const dateStr = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
                setEditStartDate(dateStr);
              }}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </LocalizationProvider>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de Término (opcional)"
              format="DD/MM/YYYY"
              value={editDueDate ? dayjs(editDueDate) : null}
              onChange={(newValue) => {
                if (!newValue) {
                  setEditDueDate('');
                  return;
                }
                const formatted = dayjs(newValue).format('YYYY-MM-DD');
                if (editStartDate && dayjs(formatted).isBefore(dayjs(editStartDate))) {
                  alert('A data de término não pode ser menor que a data de início.');
                  return;
                }
                setEditDueDate(formatted);
              }}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </LocalizationProvider>

          <TextField
            select
            label="Atribuir a (opcional)"
            value={editAssignedTo}
            onChange={(e) => setEditAssignedTo(e.target.value)}
            fullWidth
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateTask}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR de feedback */}
      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
        message={snackbarMsg}
      />
    </Box>
  );
}
