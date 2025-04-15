import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Table,
    TableBody,
    TableRow,
    TableCell,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Alert,
    InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import FancyItem from './FancyItem';

function MultiValueModal({
    open,
    onClose,
    onSave,
    defaultValues = [],
    mode = 'create',
    initialCardName = '',
    initialFieldName = '',
    onChangeCardName,
    onChangeFieldName
}) {
    const [values, setValues] = useState([]);

    useEffect(() => {
        if (open) {
            if (defaultValues.length > 0) {
                setValues([...defaultValues]);
            } else {
                setValues(['']);
            }
        }
    }, [open, defaultValues]);

    const handleAddValue = () => {
        setValues((prev) => [...prev, '']);
    };

    const handleRemoveValue = (index) => {
        if (values.length === 1) return;
        setValues((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeValue = (index, newVal) => {
        const updated = [...values];
        updated[index] = newVal;
        setValues(updated);
    };

    const handleSave = () => {
        onSave(values);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{mode === 'edit' ? 'Editar Campo' : 'Novo Campo'}</DialogTitle>
            <DialogContent sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Card Name"
                    fullWidth
                    value={initialCardName}
                    onChange={(e) => onChangeCardName(e.target.value)}
                    helperText="Informe o nome do card"
                />
                <TextField
                    label="Field Name"
                    fullWidth
                    value={initialFieldName}
                    onChange={(e) => onChangeFieldName(e.target.value)}
                />

                {values.map((val, idx) => (
                    <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                            label={`Valor #${idx + 1}`}
                            value={val}
                            onChange={(e) => handleChangeValue(idx, e.target.value)}
                            fullWidth
                        />
                        <IconButton
                            onClick={() => handleRemoveValue(idx)}
                            disabled={values.length === 1}
                        >
                            <RemoveIcon />
                        </IconButton>
                        {idx === values.length - 1 && (
                            <IconButton onClick={handleAddValue}>
                                <AddIcon />
                            </IconButton>
                        )}
                    </Box>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button variant="contained" onClick={handleSave}>Salvar</Button>
            </DialogActions>
        </Dialog>
    );
}

function buildCardsData(accessList) {
    const tempMap = {};

    accessList.forEach((acc) => {
        const cName = acc.card_name || 'Sem Título';
        if (!tempMap[cName]) {
            tempMap[cName] = {
                cardName: cName,
                cardOrder: acc.card_order || 0,
                items: []
            };
        }
        tempMap[cName].items.push(acc);
    });

    let cardArray = Object.values(tempMap);
    cardArray.sort((a, b) => a.cardOrder - b.cardOrder);
    return cardArray;
}

function renderFieldValue(value) {
    if (Array.isArray(value)) {
        return (
            <Box>
                {value.map((str, idx) => (
                    <FancyItem key={idx} text={str} />
                ))}
            </Box>
        );
    } else if (value && typeof value === 'object') {
        const entries = Object.entries(value);
        return (
            <Box>
                {entries.map(([k, v], i) => (
                    <FancyItem key={i} text={`${k}: ${v}`} />
                ))}
            </Box>
        );
    } else {
        return <FancyItem text={value || ''} />;
    }
}

export default function ClientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [client, setClient] = useState(null);
    const [loadingClient, setLoadingClient] = useState(true);
    const [errorClient, setErrorClient] = useState('');

    const [accesses, setAccesses] = useState([]);
    const [loadingAccesses, setLoadingAccesses] = useState(true);
    const [errorAccesses, setErrorAccesses] = useState('');

    const [cardsData, setCardsData] = useState([]);

    const [openNewCardModal, setOpenNewCardModal] = useState(false);
    const [newCardName, setNewCardName] = useState('');
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    const [openMultiModal, setOpenMultiModal] = useState(false);
    const [multiMode, setMultiMode] = useState('create');
    const [multiCardName, setMultiCardName] = useState('');
    const [multiFieldName, setMultiFieldName] = useState('');
    const [multiDefaultValues, setMultiDefaultValues] = useState([]);
    const [multiAccessId, setMultiAccessId] = useState(null);

    const [openRenameModal, setOpenRenameModal] = useState(false);
    const [oldCardName, setOldCardName] = useState('');
    const [newCardNameForRename, setNewCardNameForRename] = useState('');

    const [openEditClientModal, setOpenEditClientModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCnpj, setEditCnpj] = useState('');
    const [editSegment, setEditSegment] = useState('');
    const [editContactEmail, setEditContactEmail] = useState('');
    const [editContactPhone, setEditContactPhone] = useState('');
    const [editOwnerName, setEditOwnerName] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCards, setExpandedCards] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 5;

    useEffect(() => {
        fetchClient();
        fetchAccesses();
        // eslint-disable-next-line
    }, [id]);

    const fetchClient = async () => {
        try {
            setLoadingClient(true);
            const token = localStorage.getItem('token');
            const resp = await api.get(`/clients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClient(resp.data);
        } catch (err) {
            setErrorClient('Não foi possível carregar o cliente.');
            console.error(err);
        } finally {
            setLoadingClient(false);
        }
    };

    const fetchAccesses = async () => {
        try {
            setLoadingAccesses(true);
            const token = localStorage.getItem('token');
            const resp = await api.get(`/clients/${id}/accesses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const parsed = resp.data.map((item) => {
                if (typeof item.field_value === 'string') {
                    try {
                        const val = JSON.parse(item.field_value);
                        return { ...item, field_value: val };
                    } catch {
                        return item;
                    }
                }
                return item;
            });
            setAccesses(parsed);

            const cardsArr = buildCardsData(parsed);
            setCardsData(cardsArr);
        } catch (err) {
            console.error(err);
            setErrorAccesses('Não foi possível carregar os acessos.');
        } finally {
            setLoadingAccesses(false);
        }
    };

    const handleOpenNewCardModal = () => {
        setNewCardName('');
        setNewFieldName('');
        setNewFieldValue('');
        setOpenNewCardModal(true);
    };
    const handleCloseNewCardModal = () => setOpenNewCardModal(false);

    const handleCreateNewCard = async () => {
        if (!newCardName || !newFieldName) {
            alert('Nome do card e nome do primeiro campo são obrigatórios.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await api.post(
                `/clients/${id}/accesses`,
                {
                    card_name: newCardName,
                    field_name: newFieldName,
                    field_value: newFieldValue
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOpenNewCardModal(false);
            fetchAccesses();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar novo Card.');
        }
    };

    const handleOpenCreateField = (cardName) => {
        setMultiMode('create');
        setMultiCardName(cardName);
        setMultiFieldName('');
        setMultiDefaultValues(['']);
        setMultiAccessId(null);
        setOpenMultiModal(true);
    };

    const handleOpenEditField = (access) => {
        setMultiMode('edit');
        setMultiCardName(access.card_name || '');
        setMultiFieldName(access.field_name || '');
        setMultiAccessId(access.id);

        if (Array.isArray(access.field_value)) {
            setMultiDefaultValues([...access.field_value]);
        } else if (typeof access.field_value === 'string') {
            setMultiDefaultValues([access.field_value]);
        } else {
            setMultiDefaultValues(['']);
        }
        setOpenMultiModal(true);
    };

    const handleSaveMultiValues = async (valuesArray) => {
        try {
            const token = localStorage.getItem('token');
            const body = {
                card_name: multiCardName,
                field_name: multiFieldName,
                field_value: valuesArray
            };

            if (multiMode === 'create') {
                await api.post(`/clients/${id}/accesses`, body, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await api.patch(`/clients/${id}/accesses/${multiAccessId}`, body, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setOpenMultiModal(false);
            fetchAccesses();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar múltiplos valores');
        }
    };

    const handleOpenRenameModal = (oldName) => {
        setOldCardName(oldName);
        setNewCardNameForRename('');
        setOpenRenameModal(true);
    };
    const handleCloseRenameModal = () => setOpenRenameModal(false);

    const handleRenameCard = async () => {
        if (!oldCardName || !newCardNameForRename) {
            alert('Novo nome não pode estar vazio.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await api.patch(
                `/clients/${id}/cards/rename`,
                {
                    old_card_name: oldCardName,
                    new_card_name: newCardNameForRename
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOpenRenameModal(false);
            fetchAccesses();
        } catch (err) {
            console.error(err);
            alert('Não foi possível renomear o card.');
        }
    };

    const handleDeleteCard = async (cardName) => {
        if (!window.confirm(`Deseja excluir o card '${cardName}' e todos os campos?`)) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/clients/${id}/cards/delete`, {
                headers: { Authorization: `Bearer ${token}` },
                data: { card_name: cardName }
            });
            fetchAccesses();
        } catch (err) {
            console.error(err);
            alert('Não foi possível excluir o card.');
        }
    };

    const handleDeleteField = async (accessId) => {
        if (!window.confirm('Deseja excluir este campo?')) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/clients/${id}/accesses/${accessId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchAccesses();
        } catch (err) {
            console.error(err);
            alert('Não foi possível excluir o campo.');
        }
    };

    const handleOpenEditClientModal = () => {
        if (!client) return;
        setEditName(client.name);
        setEditCnpj(client.cnpj || '');
        setEditSegment(client.segment || '');
        setEditContactEmail(client.contactEmail || '');
        setEditContactPhone(client.contactPhone || '');
        setEditOwnerName(client.ownerName || '');
        setOpenEditClientModal(true);
    };
    const handleCloseEditClientModal = () => setOpenEditClientModal(false);

    const handleSaveClientEdit = async () => {
        const token = localStorage.getItem('token');
        try {
            await api.patch(
                `/clients/${id}`,
                {
                    name: editName,
                    cnpj: editCnpj,
                    segment: editSegment,
                    contactEmail: editContactEmail,
                    contactPhone: editContactPhone,
                    owner_name: editOwnerName
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Cliente atualizado com sucesso!');
            setOpenEditClientModal(false);
            fetchClient();
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar cliente.');
        }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm('Deseja excluir este cliente?')) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/clients/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Cliente excluído com sucesso.');
            navigate('/clients');
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir cliente.');
        }
    };

    const filteredCards = cardsData.filter((card) =>
        card.cardName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCards.length / cardsPerPage);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(1);
        }
        // eslint-disable-next-line
    }, [searchTerm, totalPages]);

    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = startIndex + cardsPerPage;
    const paginatedCards = filteredCards.slice(startIndex, endIndex);

    const toggleCardExpand = (cardName) => {
        setExpandedCards((prev) => ({
            ...prev,
            [cardName]: !prev[cardName]
        }));
    };

    const handleExpandAll = () => {
        const expandedAll = {};
        filteredCards.forEach((c) => {
            expandedAll[c.cardName] = true;
        });
        setExpandedCards(expandedAll);
    };

    const handleCollapseAll = () => {
        const collapsedAll = {};
        filteredCards.forEach((c) => {
            collapsedAll[c.cardName] = false;
        });
        setExpandedCards(collapsedAll);
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        if (sourceIndex === destinationIndex) return;

        const newPaginated = Array.from(paginatedCards);
        const [removed] = newPaginated.splice(sourceIndex, 1);
        newPaginated.splice(destinationIndex, 0, removed);

        const reorderMap = new Map();
        newPaginated.forEach((c, i) => {
            reorderMap.set(c.cardName, i);
        });

        const newCardsData = Array.from(cardsData);
        newCardsData.sort((a, b) => {
            const aInMap = reorderMap.has(a.cardName);
            const bInMap = reorderMap.has(b.cardName);

            if (aInMap && bInMap) {
                return reorderMap.get(a.cardName) - reorderMap.get(b.cardName);
            }
            if (aInMap && !bInMap) return -1;
            if (!aInMap && bInMap) return 1;
            return 0;
        });

        newCardsData.forEach((card, index) => {
            card.cardOrder = index;
        });

        setCardsData(newCardsData);

        const reorderedCardNames = newCardsData.map((c) => c.cardName);
        try {
            const token = localStorage.getItem('token');
            await api.patch(
                `/clients/${id}/cards/reorder`,
                { order: reorderedCardNames },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error('Erro ao reordenar cards:', err);
            alert('Não foi possível salvar a nova ordem dos cards.');
        }
    };

    if (loadingClient) {
        return (
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }
    if (!client) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{errorClient || 'Cliente não encontrado'}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                {client.name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Segmento: {client.segment} | Responsável: {client.ownerName}
            </Typography>
            {client.ownerName && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                    E-mail: {client.contactEmail} | Telefone: {client.contactPhone}
                </Typography>
            )}
            <Typography variant="body1" sx={{ mb: 2 }}>
                CNPJ: {client.cnpj}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button variant="outlined" onClick={handleOpenEditClientModal}>
                    Editar Cliente
                </Button>
                <Button variant="outlined" color="error" onClick={handleDeleteClient}>
                    Excluir Cliente
                </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenNewCardModal}
                >
                    Novo Card
                </Button>
                <Button variant="outlined" onClick={handleExpandAll}>
                    Expandir Todos
                </Button>
                <Button variant="outlined" onClick={handleCollapseAll}>
                    Colapsar Todos
                </Button>
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Buscar Card..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        )
                    }}
                    sx={{ width: 240 }}
                />
            </Box>

            {totalPages > 1 && (
                <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <Typography>
                        Página {currentPage} de {totalPages}
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Próxima
                    </Button>
                </Box>
            )}

            {loadingAccesses ? (
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : errorAccesses ? (
                <Alert severity="error">{errorAccesses}</Alert>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="cards-droppable">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {paginatedCards.length === 0 ? (
                                    <Alert severity="info">Nenhum Card encontrado.</Alert>
                                ) : (
                                    paginatedCards.map((card, index) => {
                                        const isExpanded = expandedCards[card.cardName] || false;
                                        return (
                                            <Draggable
                                                key={card.cardName}
                                                draggableId={String(card.cardName)}
                                                index={index}
                                            >
                                                {(providedDrag) => (
                                                    <div
                                                        ref={providedDrag.innerRef}
                                                        {...providedDrag.draggableProps}
                                                        {...providedDrag.dragHandleProps}
                                                        style={{
                                                            marginBottom: 8,
                                                            ...providedDrag.draggableProps.style
                                                        }}
                                                    >
                                                        <Card
                                                            sx={{
                                                                mb: 2,
                                                                p: 1,
                                                                backgroundColor: '#232323'
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                                                                <Box
                                                                    sx={{
                                                                        display: 'flex',
                                                                        flexDirection: {
                                                                            xs: 'column',
                                                                            sm: 'row'
                                                                        },
                                                                        alignItems: {
                                                                            xs: 'flex-start',
                                                                            sm: 'center'
                                                                        },
                                                                        justifyContent: 'space-between',
                                                                        mb: 2,
                                                                        gap: 1
                                                                    }}
                                                                >
                                                                    <Typography
                                                                        variant="h6"
                                                                        sx={{
                                                                            color: '#64b5f6',
                                                                            fontWeight: 'bold',
                                                                            mb: {
                                                                                xs: 1,
                                                                                sm: 0
                                                                            }
                                                                        }}
                                                                    >
                                                                        {card.cardName}
                                                                    </Typography>
                                                                    <Box
                                                                        sx={{
                                                                            display: 'flex',
                                                                            flexDirection: {
                                                                                xs: 'column',
                                                                                sm: 'row'
                                                                            },
                                                                            gap: 1
                                                                        }}
                                                                    >
                                                                        <Button
                                                                            variant="outlined"
                                                                            sx={{
                                                                                color: '#64b5f6',
                                                                                borderColor: '#64b5f6'
                                                                            }}
                                                                            onClick={() =>
                                                                                toggleCardExpand(
                                                                                    card.cardName
                                                                                )
                                                                            }
                                                                        >
                                                                            {isExpanded
                                                                                ? 'Colapsar'
                                                                                : 'Expandir'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outlined"
                                                                            sx={{
                                                                                color: '#64b5f6',
                                                                                borderColor: '#64b5f6'
                                                                            }}
                                                                            onClick={() =>
                                                                                handleOpenRenameModal(
                                                                                    card.cardName
                                                                                )
                                                                            }
                                                                        >
                                                                            Renomear
                                                                        </Button>
                                                                        <Button
                                                                            variant="outlined"
                                                                            color="error"
                                                                            onClick={() =>
                                                                                handleDeleteCard(
                                                                                    card.cardName
                                                                                )
                                                                            }
                                                                        >
                                                                            Excluir
                                                                        </Button>
                                                                    </Box>
                                                                </Box>

                                                                {isExpanded && (
                                                                    <Table size="small">
                                                                        <TableBody>
                                                                            {card.items.map((acc) => (
                                                                                <TableRow key={acc.id}>
                                                                                    <TableCell
                                                                                        sx={{
                                                                                            width: '30%',
                                                                                            color: 'white',
                                                                                            borderColor:
                                                                                                '#444'
                                                                                        }}
                                                                                    >
                                                                                        {
                                                                                            acc.field_name
                                                                                        }
                                                                                    </TableCell>
                                                                                    <TableCell
                                                                                        sx={{
                                                                                            width: '50%',
                                                                                            color: 'white',
                                                                                            borderColor:
                                                                                                '#444'
                                                                                        }}
                                                                                    >
                                                                                        {renderFieldValue(
                                                                                            acc.field_value
                                                                                        )}
                                                                                    </TableCell>
                                                                                    <TableCell
                                                                                        sx={{
                                                                                            width: '20%',
                                                                                            color: 'white',
                                                                                            borderColor:
                                                                                                '#444'
                                                                                        }}
                                                                                    >
                                                                                        <IconButton
                                                                                            color="primary"
                                                                                            onClick={() =>
                                                                                                handleOpenEditField(
                                                                                                    acc
                                                                                                )
                                                                                            }
                                                                                            sx={{ mr: 1 }}
                                                                                        >
                                                                                            <EditIcon />
                                                                                        </IconButton>
                                                                                        <IconButton
                                                                                            color="error"
                                                                                            onClick={() =>
                                                                                                handleDeleteField(
                                                                                                    acc.id
                                                                                                )
                                                                                            }
                                                                                        >
                                                                                            <DeleteIcon />
                                                                                        </IconButton>
                                                                                    </TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                            <TableRow
                                                                                sx={{
                                                                                    borderBottom:
                                                                                        '2px solid #555',
                                                                                    '& > td': {
                                                                                        borderBottom:
                                                                                            '0 !important'
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <TableCell
                                                                                    colSpan={3}
                                                                                    align="right"
                                                                                    sx={{
                                                                                        borderColor:
                                                                                            '#444'
                                                                                    }}
                                                                                >
                                                                                    <Button
                                                                                        variant="outlined"
                                                                                        startIcon={
                                                                                            <AddIcon />
                                                                                        }
                                                                                        onClick={() =>
                                                                                            handleOpenCreateField(
                                                                                                card.cardName
                                                                                            )
                                                                                        }
                                                                                        sx={{
                                                                                            color: '#64b5f6',
                                                                                            borderColor:
                                                                                                '#64b5f6'
                                                                                        }}
                                                                                    >
                                                                                        Adicionar Campo
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        </TableBody>
                                                                    </Table>
                                                                )}
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {/* MODAL: Novo Card */}
            <Dialog
                open={openNewCardModal}
                onClose={handleCloseNewCardModal}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Criar Novo Card</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Nome do Card"
                        variant="outlined"
                        fullWidth
                        value={newCardName}
                        onChange={(e) => setNewCardName(e.target.value)}
                    />
                    <TextField
                        label="Nome do Primeiro Campo"
                        variant="outlined"
                        fullWidth
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <TextField
                        label="Valor do Campo"
                        variant="outlined"
                        fullWidth
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                        helperText="Para vários valores, use 'Adicionar Campo' depois."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseNewCardModal}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreateNewCard}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: MultiValueModal */}
            <MultiValueModal
                open={openMultiModal}
                onClose={() => setOpenMultiModal(false)}
                onSave={handleSaveMultiValues}
                defaultValues={multiDefaultValues}
                mode={multiMode}
                initialCardName={multiCardName}
                initialFieldName={multiFieldName}
                onChangeCardName={setMultiCardName}
                onChangeFieldName={setMultiFieldName}
            />

            {/* MODAL: Renomear Card */}
            <Dialog
                open={openRenameModal}
                onClose={handleCloseRenameModal}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Renomear Card</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Typography>Card atual: {oldCardName}</Typography>
                    <TextField
                        label="Novo nome do Card"
                        variant="outlined"
                        fullWidth
                        value={newCardNameForRename}
                        onChange={(e) => setNewCardNameForRename(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRenameModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleRenameCard}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL: Editar Cliente */}
            <Dialog
                open={openEditClientModal}
                onClose={handleCloseEditClientModal}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle>Editar Cliente</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Nome"
                        variant="outlined"
                        fullWidth
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                    />
                    <TextField
                        label="CNPJ"
                        variant="outlined"
                        fullWidth
                        value={editCnpj}
                        onChange={(e) => setEditCnpj(e.target.value)}
                    />
                    <TextField
                        label="Segmento"
                        variant="outlined"
                        fullWidth
                        value={editSegment}
                        onChange={(e) => setEditSegment(e.target.value)}
                    />
                    <TextField
                        label="E-mail de Contato"
                        variant="outlined"
                        fullWidth
                        value={editContactEmail}
                        onChange={(e) => setEditContactEmail(e.target.value)}
                    />
                    <TextField
                        label="Telefone"
                        variant="outlined"
                        fullWidth
                        value={editContactPhone}
                        onChange={(e) => setEditContactPhone(e.target.value)}
                    />
                    <TextField
                        label="Nome do Dono (Responsável)"
                        variant="outlined"
                        fullWidth
                        value={editOwnerName}
                        onChange={(e) => setEditOwnerName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditClientModal}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveClientEdit}>
                        Salvar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
