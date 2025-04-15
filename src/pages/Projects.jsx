import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
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
  Pagination, // IMPORTANTE: para paginação
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [errorProjects, setErrorProjects] = useState('');

  // Usuário logado
  const [currentUser, setCurrentUser] = useState(null);

  // Modal de criação de projeto
  const [openModal, setOpenModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    client_id: '',
    responsible_user_id: '',
    associated_user_ids: [],
    status: '',
    deadline: '',
    description: '',
  });
  const [modalError, setModalError] = useState('');

  // Modal para adicionar responsáveis extras
  const [openAssociateDialog, setOpenAssociateDialog] = useState(false);
  const [selectedAssociateUser, setSelectedAssociateUser] = useState('');

  // ---- Filtros e Ordenação ----
  const [searchTerm, setSearchTerm] = useState('');     // Filtro por nome
  const [statusFilter, setStatusFilter] = useState(''); // Filtro por status
  const [sortBy, setSortBy] = useState('');             // Ordenação (por deadline, etc.)

  // ---- Paginação ----
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  const navigate = useNavigate();

  // 1. Carrega o usuário do localStorage ao montar o componente
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      setCurrentUser(null);
    }
  }, []);

  // 2. Quando "currentUser" estiver definido, busca projetos
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [currentUser]);

  // 3. Busca clients e users independentemente, sem depender do currentUser
  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  // =======================
  // Buscar projetos
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = localStorage.getItem('token');

      const response = await api.get('/projects/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Se o prazo passou e o status não for "Concluído", marcamos como "Em Atraso"
      let fetchedProjects = response.data;
      let updatedProjects = fetchedProjects.map((proj) => {
        if (
          proj.deadline &&
          dayjs(proj.deadline).isBefore(dayjs()) &&
          proj.status !== 'Concluído'
        ) {
          return { ...proj, status: 'Em Atraso' };
        }
        return proj;
      });

      // Se usuário for "convidado", mostra apenas projetos em que ele é responsável ou associado
      if (currentUser?.role === 'convidado') {
        updatedProjects = updatedProjects.filter((proj) => {
          const isResponsible = proj.responsible?.id === currentUser.id;
          const isAssociated = proj.associated_users?.some(
            (u) => u.id === currentUser.id
          );
          return isResponsible || isAssociated;
        });
      }

      setProjects(updatedProjects);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      setErrorProjects('Não foi possível carregar os projetos.');
    } finally {
      setLoadingProjects(false);
    }
  };

  // Buscar clientes
  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/clients/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setClients(response.data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('auth/users/list', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  // =======================
  // Função que filtra e ordena os projetos
  const getFilteredProjects = () => {
    let filtered = [...projects];

    // Filtro por nome
    if (searchTerm.trim()) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Ordenação
    if (sortBy === 'deadline') {
      filtered.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return dayjs(a.deadline).diff(dayjs(b.deadline));
      });
    }

    return filtered;
  };

  // Aplica filtro+ordenação
  const allFilteredProjects = getFilteredProjects();

  // PAGINAÇÃO local
  const totalPages = Math.ceil(allFilteredProjects.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const projectsOnPage = allFilteredProjects.slice(startIndex, endIndex);

  // =======================
  // Modal de criar projeto
  const handleOpenModal = () => {
    // Se for convidado, bloquear
    if (currentUser?.role === 'convidado') {
      alert('Você não tem permissão para criar projetos.');
      return;
    }

    setProjectForm({
      name: '',
      client_id: '',
      responsible_user_id: '',
      associated_user_ids: [],
      status: '',
      deadline: '',
      description: '',
    });
    setModalError('');
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProjectForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleDeadlineChange = (newDate) => {
    if (!newDate) {
      setProjectForm((prev) => ({ ...prev, deadline: '' }));
    } else {
      const formatted = dayjs(newDate).format('YYYY-MM-DD');
      setProjectForm((prev) => ({ ...prev, deadline: formatted }));
    }
  };
  const handleCreateProject = async () => {
    if (!currentUser || currentUser.role === 'convidado') {
      alert('Você não tem permissão para criar projetos.');
      return;
    }

    if (!projectForm.name || !projectForm.responsible_user_id) {
      setModalError('Os campos "Nome" e "Responsável" são obrigatórios.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...projectForm,
        progress: 0, // força o progresso inicial a zero
      };

      await api.post('/projects/create', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await fetchProjects();
      setOpenModal(false);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      setModalError('Erro ao criar projeto. Verifique os dados e tente novamente.');
    }
  };

  // =======================
  // Modal de adicionar responsável associado
  const handleOpenAssociateDialog = () => {
    setSelectedAssociateUser('');
    setOpenAssociateDialog(true);
  };
  const handleCloseAssociateDialog = () => {
    setOpenAssociateDialog(false);
  };
  const handleAddAssociateUser = () => {
    if (!selectedAssociateUser) return;
    if (projectForm.associated_user_ids.includes(selectedAssociateUser)) {
      return;
    }
    setProjectForm((prev) => ({
      ...prev,
      associated_user_ids: [...prev.associated_user_ids, selectedAssociateUser],
    }));
    setOpenAssociateDialog(false);
  };
  const handleRemoveAssociateUser = (userId) => {
    setProjectForm((prev) => ({
      ...prev,
      associated_user_ids: prev.associated_user_ids.filter((id) => id !== userId),
    }));
  };

  return (
    <Box>
      {/* Título e botão de novo projeto */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Projetos
        </Typography>
        {currentUser && currentUser.role !== 'convidado' && (
          <Button variant="contained" onClick={handleOpenModal}>
            Novo Projeto
          </Button>
        )}
      </Box>

      {/* Barra de Filtros e Ordenação */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          label="Buscar por nome"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // reset da paginação
          }}
          variant="outlined"
        />

        <TextField
          select
          label="Filtrar por Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="Pendente">Pendente</MenuItem>
          <MenuItem value="Em Andamento">Em Andamento</MenuItem>
          <MenuItem value="Em Atraso">Em Atraso</MenuItem>
          <MenuItem value="Concluído">Concluído</MenuItem>
        </TextField>

        <TextField
          select
          label="Ordenar"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Sem ordenação</MenuItem>
          <MenuItem value="deadline">Pelo Prazo</MenuItem>
        </TextField>
      </Box>

      {/* Se ainda carregando, exibe spinner; se erro, exibe alerta */}
      {loadingProjects ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : errorProjects ? (
        <Alert severity="error">{errorProjects}</Alert>
      ) : (
        <>
          {/* Listagem de projetos (já filtrados) */}
          <Grid container spacing={2}>
            {projectsOnPage.map((project) => {
              // Combina responsável principal + responsáveis associados
              const allResponsibles = [];
              if (project.responsible) {
                allResponsibles.push(project.responsible);
              }
              if (project.associated_users && project.associated_users.length > 0) {
                allResponsibles.push(...project.associated_users);
              }

              return (
                <Grid item key={project.id} xs={12} sm={12} md={6} lg={4}>
                  <Card
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {project.name}
                      </Typography>

                      <Typography variant="body2" color="textSecondary">
                        Cliente: {project.client ? project.client.name : 'Não atribuído'}
                      </Typography>

                      <Chip
                        label={project.status}
                        color={
                          project.status === 'Em Atraso'
                            ? 'error'
                            : project.status === 'Em Andamento'
                              ? 'primary'
                              : project.status === 'Pendente'
                                ? 'warning'
                                : project.status === 'Concluído'
                                  ? 'success'
                                  : 'default'
                        }
                        variant="outlined"
                        sx={{ my: 1 }}
                      />

                      <Typography variant="body2">
                        Prazo: {project.deadline || 'N/A'}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Progresso:
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={project.progress}
                        sx={{ height: 8, borderRadius: 2, mt: 0.5 }}
                      />
                      <Typography variant="caption">{project.progress}%</Typography>

                      {allResponsibles.length > 0 && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Responsáveis: {allResponsibles.map((u) => u.name).join(', ')}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Paginação */}
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
        </>
      )}

      {/* Modal: Criar Projeto */}
      <Dialog open={openModal} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>Novo Projeto</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {modalError && <Alert severity="error">{modalError}</Alert>}

          <TextField
            label="Nome"
            name="name"
            fullWidth
            variant="outlined"
            value={projectForm.name}
            onChange={handleFormChange}
            required
          />

          <TextField
            select
            label="Cliente"
            name="client_id"
            fullWidth
            variant="outlined"
            value={projectForm.client_id}
            onChange={handleFormChange}
          >
            <MenuItem value="">
              <em>Nenhum</em>
            </MenuItem>
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>

          <Box display="flex" gap={1} alignItems="center">
            <TextField
              select
              label="Responsável (principal)"
              name="responsible_user_id"
              fullWidth
              variant="outlined"
              value={projectForm.responsible_user_id}
              onChange={handleFormChange}
              required
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.name}
                </MenuItem>
              ))}
            </TextField>

            <IconButton
              color="primary"
              onClick={handleOpenAssociateDialog}
              title="Adicionar outro responsável"
            >
              <AddIcon />
            </IconButton>
          </Box>

          {/* Chips para responsáveis adicionais */}
          {projectForm.associated_user_ids.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {projectForm.associated_user_ids.map((userId) => {
                const userInfo = users.find((u) => u.id === userId);
                return (
                  <Chip
                    key={userId}
                    label={userInfo ? userInfo.name : `ID ${userId}`}
                    onDelete={() => handleRemoveAssociateUser(userId)}
                  />
                );
              })}
            </Box>
          )}

          <TextField
            select
            label="Status"
            name="status"
            fullWidth
            variant="outlined"
            value={projectForm.status}
            onChange={handleFormChange}
          >
            <MenuItem value="">
              <em>Selecione</em>
            </MenuItem>
            <MenuItem value="Pendente">Pendente</MenuItem>
            <MenuItem value="Em Andamento">Em Andamento</MenuItem>
            <MenuItem value="Concluído">Concluído</MenuItem>
          </TextField>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Prazo"
              format="DD/MM/YYYY"
              value={projectForm.deadline ? dayjs(projectForm.deadline) : null}
              onChange={handleDeadlineChange}
              slotProps={{ textField: { fullWidth: true, variant: 'outlined' } }}
            />
          </LocalizationProvider>

          <TextField
            label="Descrição"
            name="description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={projectForm.description}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateProject}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Adicionar responsável associado */}
      <Dialog
        open={openAssociateDialog}
        onClose={handleCloseAssociateDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Adicionar Outro Responsável</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            select
            label="Usuário"
            value={selectedAssociateUser}
            onChange={(e) => setSelectedAssociateUser(e.target.value)}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="">
              <em>Selecione</em>
            </MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssociateDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddAssociateUser}>
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
