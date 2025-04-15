import React, { useEffect, useState, useMemo } from 'react';
import moment from 'moment';
import {
  Calendar,
  momentLocalizer
} from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Card, CardContent, CardActions,
  useMediaQuery, useTheme, Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// Import para DatePickers do MUI
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';

import api from '../services/api';

// Estilos RBC
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarDark.css';

// Configura localizador RBC com moment
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

/**
 * Checa sobreposição de compromissos para um usuário no mesmo horário.
 */
function checkOverlap(appointments, userId, start, end, ignoreId) {
  return appointments.some((ap) => {
    if (!ap.assigned_to || ap.assigned_to.id !== userId) return false;
    if (ignoreId && ap.id === ignoreId) return false;
    const apStart = new Date(ap.start);
    const apEnd = new Date(ap.end);
    return (apStart < end && apEnd > start);
  });
}

// Mapeia cores para usuários
const userColorMap = {
  1: '#f44336',
  2: '#2196f3',
  3: '#ff9800',
  4: '#9c27b0',
};

// Custom para Agenda
function CustomAgendaEvent({ event }) {
  const analystName = event.resource?.assigned_to?.name || '—';
  return (
    <span>
      <strong>{event.title}</strong> {' - '} {analystName}
    </span>
  );
}

export default function CalendarWithDayView() {
  // Verifica o usuário logado no localStorage
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : {};
  const isConvidado = currentUser.role === 'convidado';
  const currentUserId = currentUser.id;

  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  // Filtro por usuário (para usuários não-convidados)
  const [selectedUserFilter, setSelectedUserFilter] = useState('');

  // MODAL: CRIAR
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    local: '',
    date: '',
    startTime: '',
    endTime: '',
    userId: '',
    clientId: '',
    projectId: '',
  });

  // MODAL: DIA
  const [showDayModal, setShowDayModal] = useState(false);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);

  // MODAL: EDITAR
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: null,
    title: '',
    description: '',
    local: '',
    date: '',
    startTime: '',
    endTime: '',
    userId: '',
    clientId: '',
    projectId: '',
  });

  // MODAL: COPIAR INTERVALO
  const [openCopyRangeModal, setOpenCopyRangeModal] = useState(false);
  const [sourceStart, setSourceStart] = useState(null);
  const [sourceEnd, setSourceEnd] = useState(null);
  const [targetStart, setTargetStart] = useState(null);

  // MODAL: COPIAR UM DIA (todos os compromissos do dia)
  const [openCopyDayModal, setOpenCopyDayModal] = useState(false);
  const [copyTargetDay, setCopyTargetDay] = useState(null);

  // MODAL: COPIAR APENAS UM COMPROMISSO
  const [openCopyAppointmentModal, setOpenCopyAppointmentModal] = useState(false);
  const [copyAppointment, setCopyAppointment] = useState(null);
  const [copyAppointmentTargetDate, setCopyAppointmentTargetDate] = useState(null);

  // Responsividade: Detectar se é mobile
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // --- SNACKBAR ---
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  function showNotification(message) {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }
  function handleSnackbarClose() {
    setSnackbarOpen(false);
  }

  useEffect(() => {
    loadAppointments();
    loadUsers();
    loadClients();
    loadProjects();
  }, []);

  async function loadAppointments() {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Erro ao buscar appointments:', err);
    }
  }
  async function loadUsers() {
    try {
      const res = await api.get('/auth/users/list');
      setUsers(res.data);
    } catch (err) {
      console.error('Erro ao buscar users:', err);
    }
  }
  async function loadClients() {
    try {
      const res = await api.get('/clients/list');
      setClients(res.data);
    } catch (err) {
      console.error('Erro ao buscar clients:', err);
    }
  }
  async function loadProjects() {
    try {
      const res = await api.get('/projects/list');
      setProjects(res.data);
    } catch (err) {
      console.error('Erro ao buscar projects:', err);
    }
  }

  // Filtrar appointments:
  // - Se for "convidado": mostra somente os compromissos atribuídos a ele.
  // - Caso contrário, se houver filtro selecionado, filtra conforme o usuário selecionado.
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    if (isConvidado) {
      filtered = appointments.filter(ap =>
        ap.assigned_to && String(ap.assigned_to.id) === String(currentUserId)
      );
    } else if (selectedUserFilter) {
      filtered = appointments.filter((ap) => {
        if (!ap.assigned_to) return false;
        return String(ap.assigned_to.id) === String(selectedUserFilter);
      });
    }
    return filtered;
  }, [appointments, selectedUserFilter, isConvidado, currentUserId]);

  // ---------- CRIAR ----------
  function handleOpenModal() {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    setForm({
      title: '',
      description: '',
      local: '',
      date: '',
      startTime: '',
      endTime: '',
      userId: '',
      clientId: '',
      projectId: '',
    });
    setOpenModal(true);
  }
  function handleCloseModal() {
    setOpenModal(false);
  }
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleCreateAppointment() {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    const { title, description, local, date, startTime, endTime, userId, clientId, projectId } = form;
    if (!title || !date || !startTime || !endTime) {
      showNotification('Título, Data, Horário Início e Fim são obrigatórios!');
      return;
    }
    const startStr = `${date} ${startTime}:00`;
    const endStr = `${date} ${endTime}:00`;
    const start = new Date(moment(startStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
    const end = new Date(moment(endStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
    if (end < start) {
      showNotification('Horário de término < horário de início!');
      return;
    }
    const numericUserId = userId ? parseInt(userId) : null;
    if (numericUserId) {
      if (checkOverlap(appointments, numericUserId, start, end, null)) {
        showNotification('O usuário já tem compromisso nesse horário!');
        return;
      }
    }
    const payload = {
      title,
      description,
      local,
      start: moment(start).format('YYYY-MM-DD HH:mm:ss'),
      end: moment(end).format('YYYY-MM-DD HH:mm:ss'),
      color: '#4caf50',
      assigned_to_user_id: numericUserId,
      client_id: clientId ? parseInt(clientId) : null,
      project_id: projectId ? parseInt(projectId) : null,
    };
    try {
      await api.post('/appointments', payload);
      showNotification('Compromisso criado com sucesso!');
      setOpenModal(false);
      loadAppointments();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao criar compromisso');
    }
  }

  // ---------- VISUALIZAR DIA ----------
  function handleSelectSlot(slotInfo) {
    const day = slotInfo.start;
    setSelectedDay(day);
    const dayApts = filteredAppointments.filter((ap) => {
      const apDay = moment(ap.start).startOf('day');
      return apDay.isSame(moment(day).startOf('day'));
    });
    dayApts.sort((a, b) => new Date(a.start) - new Date(b.start));
    setDayAppointments(dayApts);
    setShowDayModal(true);
  }
  function handleSelectEvent(event) {
    const day = event.start;
    setSelectedDay(day);
    const dayApts = filteredAppointments.filter((ap) => {
      const apDay = moment(ap.start).startOf('day');
      return apDay.isSame(moment(day).startOf('day'));
    });
    dayApts.sort((a, b) => new Date(a.start) - new Date(b.start));
    setDayAppointments(dayApts);
    setShowDayModal(true);
  }
  function handleCloseDayModal() {
    setShowDayModal(false);
  }

  // ---------- COPIAR COMPROMISSOS DO DIA (todos) ----------
  function handleOpenCopyDayModal() {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    setCopyTargetDay(null);
    setOpenCopyDayModal(true);
  }
  function handleCloseCopyDayModal() {
    setOpenCopyDayModal(false);
  }
  async function handleSubmitCopyDay() {
    if (!copyTargetDay) {
      showNotification('Selecione a data de destino!');
      return;
    }
    const sourceDate = moment(selectedDay).format('YYYY-MM-DD');
    const targetDateStr = copyTargetDay.format('YYYY-MM-DD');
    const sourceDayStart = moment(sourceDate).startOf('day');
    const sourceAppointments = appointments.filter((ap) => {
      return moment(ap.start).startOf('day').isSame(sourceDayStart);
    });
    for (let ap of sourceAppointments) {
      const userId = ap.assigned_to ? ap.assigned_to.id : null;
      if (!userId) continue;
      const apStart = moment(ap.start);
      const apEnd = moment(ap.end);
      const startTime = apStart.format('HH:mm');
      const endTime = apEnd.format('HH:mm');
      const newStartStr = `${targetDateStr} ${startTime}:00`;
      const newEndStr = `${targetDateStr} ${endTime}:00`;
      const newStart = new Date(moment(newStartStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
      const newEnd = new Date(moment(newEndStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
      if (checkOverlap(appointments, userId, newStart, newEnd, null)) {
        showNotification(`Sobreposição! O usuário ${ap.assigned_to.name} já tem compromisso em ${startTime} ~ ${endTime} na data de destino.`);
        return;
      }
    }
    try {
      const res = await api.post('/appointments/copy', {
        source_date: sourceDate,
        target_date: targetDateStr
      });
      showNotification(res.data.message);
      loadAppointments();
      setOpenCopyDayModal(false);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao copiar compromissos');
    }
  }

  // ---------- EDITAR ----------
  function handleOpenEdit(ap) {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    const st = moment(ap.start);
    const en = moment(ap.end);
    setEditForm({
      id: ap.id,
      title: ap.title,
      description: ap.description,
      local: ap.local || '',
      date: st.format('YYYY-MM-DD'),
      startTime: st.format('HH:mm'),
      endTime: en.format('HH:mm'),
      userId: ap.assigned_to ? String(ap.assigned_to.id) : '',
      clientId: ap.client ? String(ap.client.id) : '',
      projectId: ap.project ? String(ap.project.id) : '',
    });
    setOpenEditModal(true);
  }
  function handleCloseEditModal() {
    setOpenEditModal(false);
  }
  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }
  async function handleUpdateAppointment() {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    const { id, title, description, local, date, startTime, endTime, userId, clientId, projectId } = editForm;
    if (!title || !date || !startTime || !endTime) {
      showNotification('Campos obrigatórios faltando!');
      return;
    }
    const startStr = `${date} ${startTime}:00`;
    const endStr = `${date} ${endTime}:00`;
    const start = new Date(moment(startStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
    const end = new Date(moment(endStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
    if (end < start) {
      showNotification('Horário fim < início!');
      return;
    }
    const numericUserId = userId ? parseInt(userId) : null;
    if (numericUserId) {
      if (checkOverlap(appointments, numericUserId, start, end, id)) {
        showNotification('O usuário já tem compromisso nesse horário!');
        return;
      }
    }
    const payload = {
      title,
      description,
      local,
      start: moment(start).format('YYYY-MM-DD HH:mm:ss'),
      end: moment(end).format('YYYY-MM-DD HH:mm:ss'),
      assigned_to_user_id: numericUserId,
      client_id: clientId ? parseInt(clientId) : null,
      project_id: projectId ? parseInt(projectId) : null,
    };
    try {
      await api.patch(`/appointments/${id}`, payload);
      showNotification('Compromisso atualizado!');
      setOpenEditModal(false);
      setShowDayModal(false);
      loadAppointments();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao editar');
    }
  }

  // ---------- EXCLUIR ----------
  async function handleDeleteAppointment(aptId) {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    if (!window.confirm('Deseja excluir este compromisso?')) return;
    try {
      await api.delete(`/appointments/${aptId}`);
      showNotification('Excluído!');
      setShowDayModal(false);
      loadAppointments();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao excluir');
    }
  }

  // ---------- DRAG & DROP ----------
  async function handleEventDrop({ event, start, end }) {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      loadAppointments();
      return;
    }
    const userId = event.resource.assigned_to ? event.resource.assigned_to.id : null;
    if (userId) {
      if (checkOverlap(appointments, userId, start, end, event.id)) {
        showNotification('Sobreposição! Operação cancelada.');
        loadAppointments();
        return;
      }
    }
    doPatchDrag(event.id, start, end);
  }
  async function handleEventResize({ event, start, end }) {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      loadAppointments();
      return;
    }
    const userId = event.resource.assigned_to ? event.resource.assigned_to.id : null;
    if (userId) {
      if (checkOverlap(appointments, userId, start, end, event.id)) {
        showNotification('Sobreposição no resize! Cancelado.');
        loadAppointments();
        return;
      }
    }
    doPatchDrag(event.id, start, end);
  }
  async function doPatchDrag(aptId, startJs, endJs) {
    const startStr = moment(startJs).format('YYYY-MM-DD HH:mm:ss');
    const endStr = moment(endJs).format('YYYY-MM-DD HH:mm:ss');
    try {
      await api.patch(`/appointments/${aptId}`, { start: startStr, end: endStr });
      showNotification('Data atualizada!');
      loadAppointments();
    } catch (err) {
      console.error(err);
      showNotification('Erro ao atualizar drag/resize');
    }
  }

  // ---------- COPIAR INTERVALO (vários) ----------
  function handleOpenCopyRangeModal() {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    setSourceStart(null);
    setSourceEnd(null);
    setTargetStart(null);
    setOpenCopyRangeModal(true);
  }
  function handleCloseCopyRangeModal() {
    setOpenCopyRangeModal(false);
  }
  async function handleSubmitCopyRange() {
    if (!sourceStart || !sourceEnd || !targetStart) {
      showNotification('Preencha todas as datas!');
      return;
    }
    const ss = sourceStart.format('YYYY-MM-DD');
    const se = sourceEnd.format('YYYY-MM-DD');
    const ts = targetStart.format('YYYY-MM-DD');
    const startDay = moment(ss).startOf('day');
    const endDay = moment(se).endOf('day');
    const sourceApps = appointments.filter((ap) => {
      const apTime = moment(ap.start);
      return apTime.isBetween(startDay, endDay, null, '[]');
    });
    const offsetDays = moment(ts).diff(startDay, 'days');
    for (let ap of sourceApps) {
      const userId = ap.assigned_to ? ap.assigned_to.id : null;
      if (!userId) continue;
      const newStart = moment(ap.start).add(offsetDays, 'days').toDate();
      const newEnd = moment(ap.end).add(offsetDays, 'days').toDate();
      if (checkOverlap(appointments, userId, newStart, newEnd, null)) {
        showNotification(`Sobreposição! O usuário ${ap.assigned_to.name} já tem compromisso em ${moment(newStart).format('DD/MM HH:mm')} - ${moment(newEnd).format('HH:mm')}.`);
        return;
      }
    }
    try {
      const res = await api.post('/appointments/copy_range', {
        source_start: ss,
        source_end: se,
        target_start: ts
      });
      showNotification(res.data.message);
      loadAppointments();
      setOpenCopyRangeModal(false);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao copiar compromissos (intervalo)');
    }
  }

  // ---------- COPIAR APENAS UM COMPROMISSO ----------
  function handleOpenCopyAppointment(ap) {
    if (isConvidado) {
      showNotification("Ação não permitida para convidados.");
      return;
    }
    setCopyAppointment(ap);
    setCopyAppointmentTargetDate(null);
    setOpenCopyAppointmentModal(true);
  }
  function handleCloseCopyAppointmentModal() {
    setOpenCopyAppointmentModal(false);
  }
  async function handleSubmitCopyAppointment() {
    if (!copyAppointmentTargetDate) {
      showNotification('Selecione a data de destino!');
      return;
    }
    const originalStart = moment(copyAppointment.start);
    const originalEnd = moment(copyAppointment.end);
    const targetDateStr = copyAppointmentTargetDate.format('YYYY-MM-DD');
    const newStartStr = `${targetDateStr} ${originalStart.format('HH:mm:ss')}`;
    const newEndStr = `${targetDateStr} ${originalEnd.format('HH:mm:ss')}`;
    const newStart = new Date(moment(newStartStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
    const newEnd = new Date(moment(newEndStr, 'YYYY-MM-DD HH:mm:ss').toISOString());
    const userId = copyAppointment.assigned_to ? copyAppointment.assigned_to.id : null;
    if (userId && checkOverlap(appointments, userId, newStart, newEnd, null)) {
      showNotification('Sobreposição! O usuário já tem compromisso nesse horário na data de destino.');
      return;
    }
    const payload = {
      title: copyAppointment.title,
      description: copyAppointment.description,
      local: copyAppointment.local,
      start: moment(newStart).format('YYYY-MM-DD HH:mm:ss'),
      end: moment(newEnd).format('YYYY-MM-DD HH:mm:ss'),
      color: copyAppointment.color || '#4caf50',
      assigned_to_user_id: userId,
      client_id: copyAppointment.client ? copyAppointment.client.id : null,
      project_id: copyAppointment.project ? copyAppointment.project.id : null,
    };
    try {
      await api.post('/appointments', payload);
      showNotification('Compromisso copiado com sucesso!');
      loadAppointments();
      setOpenCopyAppointmentModal(false);
    } catch (err) {
      console.error(err);
      showNotification('Erro ao copiar compromisso');
    }
  }

  const events = filteredAppointments.map((ap) => ({
    id: ap.id,
    title: ap.title,
    start: new Date(ap.start),
    end: new Date(ap.end),
    resource: ap,
  }));

  function eventStyleGetter(event) {
    const userId = event.resource.assigned_to ? event.resource.assigned_to.id : null;
    let bg = '#3174ad';
    if (userId && userColorMap[userId]) {
      bg = userColorMap[userId];
    }
    return {
      style: {
        backgroundColor: bg,
        color: '#fff',
        borderRadius: '4px',
        border: '1px solid #fff',
        opacity: 0.9,
      },
    };
  }

  const calendarContainerStyle = {
    width: '100%',
    height: isMobile ? 'calc(100vh - 250px)' : '75vh',
    margin: '0 auto'
  };

  // Estilo para os botões de cópia com fundo transparente e borda verde
  const copyButtonStyle = {
    color: '#4caf50',
    borderColor: '#4caf50',
    '&:hover': { backgroundColor: 'rgba(0, 255, 8, 0.2)' }
  };

  return (
    <div style={{ padding: isMobile ? 8 : 16 }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'flex-start'
      }}>
        {!isConvidado && (
          <>
            <FormControl style={{ minWidth: isMobile ? 120 : 200 }}>
              <InputLabel>Filtrar por Usuário</InputLabel>
              <Select
                label="Filtrar por Usuário"
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenModal}>
              Novo Compromisso
            </Button>
            <Button variant="outlined" sx={copyButtonStyle} onClick={handleOpenCopyRangeModal}>
              Copiar Intervalo (Semana, etc.)
            </Button>
          </>
        )}
      </div>

      <div style={calendarContainerStyle}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          defaultView="month"
          views={['month', 'week', 'day', 'agenda']}
          selectable={!isConvidado}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          resizable
          draggableAccessor={() => !isConvidado}
          components={{
            agenda: {
              event: CustomAgendaEvent
            },
          }}
          style={{ backgroundColor: '#2a2a2a' }}
        />
      </div>

      {/* Modal: Criar */}
      <Dialog
        open={openModal}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Criar Compromisso</DialogTitle>
        <br />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Título" name="title" value={form.title} onChange={handleChange} />
          <TextField label="Descrição" name="description" value={form.description} onChange={handleChange} multiline rows={3} />
          <TextField label="Local" name="local" value={form.local} onChange={handleChange} />
          <TextField label="Data" type="date" name="date" value={form.date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <TextField label="Hora Início" type="time" name="startTime" value={form.startTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <TextField label="Hora Fim" type="time" name="endTime" value={form.endTime} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Usuário</InputLabel>
            <Select label="Usuário" name="userId" value={form.userId} onChange={handleChange}>
              <MenuItem value="">Nenhum</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select label="Cliente" name="clientId" value={form.clientId} onChange={handleChange}>
              <MenuItem value="">Nenhum</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Projeto</InputLabel>
            <Select label="Projeto" name="projectId" value={form.projectId} onChange={handleChange}>
              <MenuItem value="">Nenhum</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', mx: 3, my: 2 }}>
          <Button onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateAppointment}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Visualizar Dia */}
      <Dialog
        open={showDayModal}
        onClose={handleCloseDayModal}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>
          Compromissos em {selectedDay ? moment(selectedDay).format('DD/MM/YYYY') : ''}
        </DialogTitle>
        <DialogContent>
          {dayAppointments.length === 0 ? (
            <p>Nenhum compromisso para esse dia.</p>
          ) : (
            dayAppointments.map((ap) => (
              <Card key={ap.id} sx={{ mb: 2, backgroundColor: '#424242', color: '#fff' }}>
                <CardContent>
                  <h3>{ap.title}</h3>
                  <p>
                    Início: {moment(ap.start).format('HH:mm')} | Fim: {moment(ap.end).format('HH:mm')}
                  </p>
                  <p>{ap.description}</p>
                  {ap.local && <p>Local: {ap.local}</p>}
                  {ap.assigned_to && <p>Usuário (Analista): {ap.assigned_to.name}</p>}
                  {ap.client && <p>Cliente: {ap.client.name}</p>}
                  {ap.project && <p>Projeto: {ap.project.name}</p>}
                </CardContent>
                {!isConvidado && (
                  <CardActions>
                    <Button variant="outlined" onClick={() => handleOpenEdit(ap)}>Editar</Button>
                    <Button variant="outlined" color="error" onClick={() => handleDeleteAppointment(ap.id)}>
                      Excluir
                    </Button>
                    <Button
                      variant="outlined"
                      sx={copyButtonStyle}
                      onClick={() => handleOpenCopyAppointment(ap)}
                    >
                      Copiar
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))
          )}
        </DialogContent>
        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          {!isConvidado && (
            <Button variant="outlined" sx={copyButtonStyle} onClick={handleOpenCopyDayModal}>
              Copiar compromissos
            </Button>
          )}
          <Button onClick={handleCloseDayModal}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Copiar um dia (todos os compromissos) */}
      <Dialog
        open={openCopyDayModal}
        onClose={handleCloseCopyDayModal}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
      >
        <DialogTitle>
          Copiar {selectedDay ? moment(selectedDay).format('DD/MM/YYYY') : ''} para...
        </DialogTitle>
        <br />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de Destino"
              value={copyTargetDay}
              onChange={(newValue) => setCopyTargetDay(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', mx: 3, my: 2 }}>
          <Button onClick={handleCloseCopyDayModal}>Cancelar</Button>
          <Button variant="outlined" sx={copyButtonStyle} onClick={handleSubmitCopyDay}>Copiar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Copiar intervalo de compromissos */}
      <Dialog
        open={openCopyRangeModal}
        onClose={handleCloseCopyRangeModal}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Copiar Intervalo de Compromissos</DialogTitle>
        <br />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data Inicial de Origem"
              value={sourceStart}
              onChange={(newValue) => setSourceStart(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Data Final de Origem"
              value={sourceEnd}
              onChange={(newValue) => setSourceEnd(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
            <DatePicker
              label="Data de Destino"
              value={targetStart}
              onChange={(newValue) => setTargetStart(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', mx: 3, my: 2 }}>
          <Button onClick={handleCloseCopyRangeModal}>Cancelar</Button>
          <Button variant="outlined" sx={copyButtonStyle} onClick={handleSubmitCopyRange}>Copiar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Editar compromisso */}
      <Dialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>Editar Compromisso</DialogTitle>
        <br />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Título" name="title" value={editForm.title} onChange={handleEditChange} />
          <TextField label="Descrição" name="description" value={editForm.description} onChange={handleEditChange} multiline rows={3} />
          <TextField label="Local" name="local" value={editForm.local} onChange={handleEditChange} />
          <TextField label="Data" type="date" name="date" value={editForm.date} onChange={handleEditChange} InputLabelProps={{ shrink: true }} />
          <TextField label="Hora Início" type="time" name="startTime" value={editForm.startTime} onChange={handleEditChange} InputLabelProps={{ shrink: true }} />
          <TextField label="Hora Fim" type="time" name="endTime" value={editForm.endTime} onChange={handleEditChange} InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth>
            <InputLabel>Usuário</InputLabel>
            <Select label="Usuário" name="userId" value={editForm.userId} onChange={handleEditChange}>
              <MenuItem value="">Nenhum</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select label="Cliente" name="clientId" value={editForm.clientId} onChange={handleEditChange}>
              <MenuItem value="">Nenhum</MenuItem>
              {clients.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Projeto</InputLabel>
            <Select label="Projeto" name="projectId" value={editForm.projectId} onChange={handleEditChange}>
              <MenuItem value="">Nenhum</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', mx: 3, my: 2 }}>
          <Button onClick={handleCloseEditModal}>Cancelar</Button>
          <Button variant="contained" onClick={handleUpdateAppointment}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Copiar um único compromisso */}
      <Dialog
        open={openCopyAppointmentModal}
        onClose={handleCloseCopyAppointmentModal}
        fullWidth
        maxWidth="xs"
        fullScreen={isMobile}
      >
        <DialogTitle>
          Copiar compromisso para...
        </DialogTitle>
        <br />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de Destino"
              value={copyAppointmentTargetDate}
              onChange={(newValue) => setCopyAppointmentTargetDate(newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', mx: 3, my: 2 }}>
          <Button onClick={handleCloseCopyAppointmentModal}>Cancelar</Button>
          <Button variant="outlined" sx={copyButtonStyle} onClick={handleSubmitCopyAppointment}>Copiar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </div>
  );
}
