import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Box,
    Container,
    Grid,
    Card,
    CardHeader,
    CardContent,
    Typography,
    CircularProgress,
    Button,
    TextField,
    Alert,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    Chip,
    Avatar,
    Paper,
} from '@mui/material';

import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from '@mui/lab';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ModeCommentIcon from '@mui/icons-material/ModeComment';
import CloseIcon from '@mui/icons-material/Close';

//const BASE_URL = 'http://127.0.0.1:5000/api/calls';
const baseURL = api.defaults.baseURL;
const BASE_URL = baseURL + '/calls';
// Função utilitária para verificar se o nome do arquivo é de imagem
function isImageFile(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
}

export default function CallDetails() {
    const { callId } = useParams(); // /calls/:callId
    const navigate = useNavigate();

    const [callData, setCallData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Acompanhamentos
    const [followUps, setFollowUps] = useState([]);

    // Form de criação de acompanhamento
    const [newFollowUp, setNewFollowUp] = useState('');
    const [followUpType, setFollowUpType] = useState('comentario');
    const [file, setFile] = useState(null); // Apenas 1 arquivo

    // Estados para edição de follow-up
    const [editingFollowUpId, setEditingFollowUpId] = useState(null);
    const [editFollowUpDescription, setEditFollowUpDescription] = useState('');
    const [editFollowUpType, setEditFollowUpType] = useState('comentario');

    // Modal de imagem
    const [openImageModal, setOpenImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState('');

    // ------------ ESTADO PARA EDIÇÃO DO CHAMADO ------------
    const [editingCall, setEditingCall] = useState(false);
    // Campos editáveis do chamado
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [editPriority, setEditPriority] = useState('');
    const [editAssignedTo, setEditAssignedTo] = useState('');

    // Exemplo de listas fixas de opções (caso queira exibir no <Select>)
    const statusOptions = ['Aberto', 'Em Andamento', 'Concluído', 'Cancelado'];
    const priorityOptions = ['Alta', 'Média', 'Baixa'];

    useEffect(() => {
        fetchCallDetails();
        fetchFollowUps();
        // eslint-disable-next-line
    }, [callId]);

    const fetchCallDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await api.get(`/calls/${callId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCallData(res.data);

            // Preenche estados de edição
            setEditTitle(res.data.title);
            setEditDescription(res.data.description || '');
            setEditStatus(res.data.status || 'Aberto');
            setEditPriority(res.data.priority || 'Média');
            setEditAssignedTo(res.data.assigned_to?.id || '');
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar detalhes do chamado.');
        } finally {
            setLoading(false);
        }
    };

    const fetchFollowUps = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get(`/calls/${callId}/follow_ups`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFollowUps(res.data);
        } catch (err) {
            console.error(err);
            setError('Erro ao listar acompanhamentos.');
        }
    };

    // Ao selecionar arquivo (apenas 1)
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        } else {
            setFile(null);
        }
    };

    // Cria um follow-up com anexo
    const handleCreateFollowUp = async () => {
        if (!newFollowUp.trim()) {
            setError('Descrição do acompanhamento é obrigatória.');
            return;
        }
        try {
            setError('');
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('description', newFollowUp);
            formData.append('type', followUpType);

            if (file) {
                formData.append('files', file);
            }

            await api.post(`/calls/${callId}/follow_ups`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            setNewFollowUp('');
            setFile(null);
            setFollowUpType('comentario');

            fetchFollowUps();
            fetchCallDetails();
        } catch (err) {
            console.error(err);
            setError('Erro ao criar acompanhamento.');
        }
    };

    // Inicia a edição de acompanhamento
    const handleStartEdit = (fu) => {
        setEditingFollowUpId(fu.id);
        setEditFollowUpDescription(fu.description);
        setEditFollowUpType(fu.type);
    };

    // Cancela o modo de edição
    const handleCancelEdit = () => {
        setEditingFollowUpId(null);
        setEditFollowUpDescription('');
        setEditFollowUpType('comentario');
    };

    // Atualiza o acompanhamento (PATCH)
    const handleUpdateFollowUp = async (id) => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            await api.patch(
                `/calls/${callId}/follow_ups/${id}`,
                {
                    description: editFollowUpDescription,
                    type: editFollowUpType,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setEditingFollowUpId(null);
            fetchFollowUps();
            fetchCallDetails();
        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar acompanhamento.');
        }
    };

    // Exclui um acompanhamento
    const handleDeleteFollowUp = async (id) => {
        try {
            setError('');
            const token = localStorage.getItem('token');
            await api.delete(`/calls/${callId}/follow_ups/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchFollowUps();
            fetchCallDetails();
        } catch (err) {
            console.error(err);
            setError('Erro ao excluir acompanhamento.');
        }
    };

    // Abre a modal para exibir a imagem ampliada
    const handleImageClick = (url) => {
        setSelectedImageUrl(url);
        setOpenImageModal(true);
    };

    // Fecha a modal de imagem
    const handleCloseImageModal = () => {
        setOpenImageModal(false);
        setSelectedImageUrl('');
    };

    // --------------- LÓGICA PARA EDITAR O CHAMADO ------------------
    const handleEditCallClick = () => {
        // Alterna o estado para exibir formulário de edição
        setEditingCall(true);
    };

    const handleCancelEditCall = () => {
        // Cancela e restaura o que estava
        setEditingCall(false);
        if (callData) {
            setEditTitle(callData.title);
            setEditDescription(callData.description || '');
            setEditStatus(callData.status || 'Aberto');
            setEditPriority(callData.priority || 'Média');
            setEditAssignedTo(callData.assigned_to?.id || '');
        }
    };

    const handleSaveEditCall = async () => {
        try {
            setError('');
            const token = localStorage.getItem('token');

            // Monta o payload do PATCH
            const payload = {
                title: editTitle,
                description: editDescription,
                status: editStatus,
                priority: editPriority,
            };

            // Se quiser enviar um 'assigned_to_user_id', inclua também:
            if (editAssignedTo) {
                payload.assigned_to_user_id = Number(editAssignedTo);
            }

            // Chama o endpoint PATCH
            const response = await api.patch(`/calls/${callId}`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Atualiza o estado local com o resultado do backend
            setCallData(response.data);
            setEditingCall(false);
        } catch (err) {
            console.error(err);
            setError('Erro ao atualizar o chamado.');
        }
    };
    // --------------------------------------------------------------

    // Renderiza cada acompanhamento como item da Timeline
    const renderFollowUpItem = (fu) => {
        const isSolucao = fu.type === 'solucao';
        const dotColor = isSolucao ? 'success' : 'primary';
        const DotIcon = isSolucao ? <CheckCircleIcon fontSize="small" /> : <ModeCommentIcon fontSize="small" />;

        return (
            <TimelineItem key={fu.id}>
                <TimelineSeparator>
                    <TimelineDot color={dotColor}>{DotIcon}</TimelineDot>
                    <TimelineConnector sx={{ bgcolor: 'grey.600' }} />
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 4 }}>
                    <Paper
                        variant="outlined"
                        sx={{
                            p: 2,
                            backgroundColor: 'background.paper',
                            borderRadius: 2,
                            borderColor: isSolucao ? 'success.main' : 'grey.700',
                            position: 'relative',
                        }}
                    >
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                    {fu.user?.name?.[0] || '?'}
                                </Avatar>
                                <Typography variant="subtitle2" color="text.primary" fontWeight="bold">
                                    {fu.user ? fu.user.name : 'Usuário?'}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(fu.created_at).toLocaleString()}
                                </Typography>
                            </Box>
                        </Box>

                        {editingFollowUpId === fu.id ? (
                            <Box>
                                <TextField
                                    fullWidth
                                    label="Descrição"
                                    multiline
                                    rows={3}
                                    variant="filled"
                                    value={editFollowUpDescription}
                                    onChange={(e) => setEditFollowUpDescription(e.target.value)}
                                    sx={{ mb: 2 }}
                                />
                                <FormControl sx={{ mb: 2, minWidth: 200 }} variant="filled">
                                    <InputLabel id="editFollowUpType-label">Tipo</InputLabel>
                                    <Select
                                        labelId="editFollowUpType-label"
                                        value={editFollowUpType}
                                        label="Tipo"
                                        onChange={(e) => setEditFollowUpType(e.target.value)}
                                    >
                                        <MenuItem value="comentario">Comentário</MenuItem>
                                        <MenuItem value="solucao">Solução</MenuItem>
                                    </Select>
                                </FormControl>
                                <Box display="flex" gap={1}>
                                    <Button variant="contained" onClick={() => handleUpdateFollowUp(fu.id)}>
                                        Salvar
                                    </Button>
                                    <Button variant="outlined" onClick={handleCancelEdit}>
                                        Cancelar
                                    </Button>
                                </Box>
                            </Box>
                        ) : (
                            <>
                                {isSolucao && (
                                    <Chip
                                        label="SOLUÇÃO"
                                        color="success"
                                        size="small"
                                        icon={<CheckCircleIcon />}
                                        sx={{ mb: 1 }}
                                    />
                                )}
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    {fu.description}
                                </Typography>

                                {fu.attachments && fu.attachments.length > 0 && (
                                    <Box sx={{ ml: 1 }}>
                                        {fu.attachments.map((att) => {
                                            const isImg = isImageFile(att.file_name || '');
                                            const fileUrl = `${BASE_URL}/uploads/${att.file_url}`;

                                            return (
                                                <Box key={att.id} sx={{ mb: 1 }}>
                                                    {isImg ? (
                                                        <img
                                                            src={fileUrl}
                                                            alt={att.file_name}
                                                            style={{
                                                                maxWidth: '150px',
                                                                cursor: 'pointer',
                                                                borderRadius: 8,
                                                                border: '1px solid #444',
                                                            }}
                                                            onClick={() => handleImageClick(fileUrl)}
                                                        />
                                                    ) : (
                                                        <Typography variant="body2" color="primary">
                                                            <a
                                                                href={fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ color: '#90caf9' }}
                                                            >
                                                                {att.file_name || att.file_url}
                                                            </a>
                                                        </Typography>
                                                    )}
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                )}
                            </>
                        )}

                        {editingFollowUpId !== fu.id && (
                            <Box mt={2} display="flex" gap={1}>
                                <Button variant="text" size="small" onClick={() => handleStartEdit(fu)}>
                                    Editar
                                </Button>
                                <Button
                                    variant="text"
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteFollowUp(fu.id)}
                                >
                                    Excluir
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </TimelineContent>
            </TimelineItem>
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!callData) {
        return <Alert severity="info">Chamado não encontrado.</Alert>;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Detalhes do Chamado #{callData.id}
            </Typography>

            <Card
                sx={{
                    mb: 4,
                    backgroundColor: 'background.paper',
                    borderRadius: 2,
                }}
            >
                <CardHeader
                    title={
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>

                            {callData.title}
                        </Typography>
                    }
                    sx={{
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                    }}
                />
                <CardContent>
                    {editingCall ? (
                        // MODO EDIÇÃO
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Título */}
                            <TextField
                                label="Título"
                                variant="filled"
                                fullWidth
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                            {/* Descrição */}
                            <TextField
                                label="Descrição"
                                variant="filled"
                                multiline
                                rows={3}
                                fullWidth
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                            />
                            {/* Status */}
                            <FormControl variant="filled">
                                <InputLabel id="edit-status-label">Status</InputLabel>
                                <Select
                                    labelId="edit-status-label"
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                >
                                    {statusOptions.map((st) => (
                                        <MenuItem key={st} value={st}>
                                            {st}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {/* Prioridade */}
                            <FormControl variant="filled">
                                <InputLabel id="edit-priority-label">Prioridade</InputLabel>
                                <Select
                                    labelId="edit-priority-label"
                                    value={editPriority}
                                    onChange={(e) => setEditPriority(e.target.value)}
                                >
                                    {priorityOptions.map((pr) => (
                                        <MenuItem key={pr} value={pr}>
                                            {pr}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Responsável (assigned_to), se quiser permitir selecionar usuário */}
                            <TextField
                                label="ID do Responsável"
                                variant="filled"
                                fullWidth
                                value={editAssignedTo}
                                onChange={(e) => setEditAssignedTo(e.target.value)}
                            />

                            <Box display="flex" gap={2}>
                                <Button variant="contained" onClick={handleSaveEditCall}>
                                    Salvar
                                </Button>
                                <Button variant="outlined" onClick={handleCancelEditCall}>
                                    Cancelar
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        // MODO LEITURA
                        <>
                            {/* Título */}


                            {/* Descrição */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                Descrição:
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                {callData.description || 'Sem descrição.'}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Status:
                                        </Typography>
                                        <Chip
                                            label={callData.status || 'N/A'}
                                            color={
                                                callData.status === 'Concluído' ? 'success' : 'primary'
                                            }
                                            size="small"
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Prioridade:
                                        </Typography>
                                        <Chip
                                            label={callData.priority || 'N/A'}
                                            size="small"
                                            color={callData.priority === 'Alta' ? 'error' : 'default'}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Cliente:
                                        </Typography>
                                        <Typography variant="body2">
                                            {callData.client?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Responsável:
                                        </Typography>
                                        <Typography variant="body2">
                                            {callData.assigned_to?.name || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            {/* Botão para entrar em modo de edição do chamado */}
                            <Box sx={{ mt: 2 }}>
                                {/* Só exibe o botão "Editar Chamado" se não estiver concluído */}
                                {callData.status !== 'Concluído' && (
                                    <Button variant="outlined" onClick={handleEditCallClick}>
                                        Editar Chamado
                                    </Button>
                                )}
                            </Box>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Acompanhamentos (Timeline) */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Acompanhamentos
            </Typography>
            {followUps.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Nenhum acompanhamento ainda.
                </Typography>
            )}

            <Timeline position="alternate">{followUps.map((fu) => renderFollowUpItem(fu))}</Timeline>

            {/* Formulário para criação de acompanhamento (somente se não estiver concluído) */}
            {callData.status !== 'Concluído' && (
                <Card
                    sx={{
                        mt: 2,
                        backgroundColor: 'background.paper',
                        borderRadius: 2,
                    }}
                    elevation={1}
                >
                    <CardHeader
                        title={
                            <Typography variant="subtitle1" fontWeight="bold">
                                Novo Acompanhamento
                            </Typography>
                        }
                        sx={{
                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                    />
                    <CardContent>
                        {!!error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        <TextField
                            fullWidth
                            variant="filled"
                            label="Descrição"
                            multiline
                            rows={3}
                            value={newFollowUp}
                            onChange={(e) => setNewFollowUp(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <FormControl fullWidth variant="filled" sx={{ mb: 2 }}>
                            <InputLabel id="followUpType-label">Tipo</InputLabel>
                            <Select
                                labelId="followUpType-label"
                                value={followUpType}
                                label="Tipo"
                                onChange={(e) => setFollowUpType(e.target.value)}
                            >
                                <MenuItem value="comentario">Comentário</MenuItem>
                                <MenuItem value="solucao">Solução</MenuItem>
                            </Select>
                        </FormControl>

                        <Box sx={{ mb: 2 }}>
                            <Button variant="contained" component="label">
                                Selecione um Arquivo
                                <input hidden type="file" onChange={handleFileChange} />
                            </Button>
                            {file && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Arquivo selecionado: {file.name}
                                </Typography>
                            )}
                        </Box>

                        <Button
                            variant="contained"
                            onClick={handleCreateFollowUp}
                            sx={{ borderRadius: 2, fontWeight: 'bold' }}
                        >
                            Enviar
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Button variant="outlined" onClick={() => navigate('/calls')} sx={{ mt: 3 }}>
                Voltar
            </Button>

            {/* Modal para exibir imagem ampliada */}
            <Dialog open={openImageModal} onClose={handleCloseImageModal} maxWidth="lg" fullWidth>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <DialogTitle sx={{ cursor: 'pointer' }} onClick={handleCloseImageModal}>
                        Visualizar Imagem
                    </DialogTitle>
                    <Button onClick={handleCloseImageModal} sx={{ mr: 2, minWidth: 0 }} color="inherit">
                        <CloseIcon />
                    </Button>
                </Box>

                <DialogContent dividers>
                    {selectedImageUrl && (
                        <img
                            src={selectedImageUrl}
                            alt="Imagem Ampliada"
                            style={{ width: '100%', borderRadius: 8 }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </Container>
    );
}
