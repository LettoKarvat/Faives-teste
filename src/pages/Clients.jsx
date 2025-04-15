import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    CircularProgress,
    Alert,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import api from '../services/api';

// Componente customizado para integrar o IMask com o TextField do MUI
const TextMaskCustom = React.forwardRef(function TextMaskCustom(props, ref) {
    const { onChange, mask, ...other } = props;
    return (
        <IMaskInput
            {...other}
            // Se "mask" for um objeto (para máscara dinâmica), passamos suas propriedades
            mask={mask.mask ? mask.mask : mask}
            dispatch={mask.dispatch}
            unmask={false}
            inputRef={ref}
            onAccept={(value) =>
                onChange({ target: { name: props.name, value } })
            }
            overwrite
        />
    );
});

export default function Clients() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [openModal, setOpenModal] = useState(false);

    // Estado para o filtro de busca
    const [searchTerm, setSearchTerm] = useState('');

    // Estado para o novo cliente, incluindo campo 'owner_name'
    const [newClient, setNewClient] = useState({
        name: '',
        cnpj: '',
        segment: '',
        contactEmail: '',
        contactPhone: '',
        owner_name: '' // <-- Campo para nome do dono/responsável
    });

    const [modalError, setModalError] = useState('');
    const navigate = useNavigate();

    // Busca a lista de clientes ao montar o componente
    const fetchClients = async () => {
        try {
            const response = await api.get('/clients/list');
            setClients(response.data);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            setErrorMsg('Não foi possível carregar os clientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const handleCardClick = (clientId) => {
        navigate(`/clients/${clientId}`);
    };

    const handleOpenModal = () => {
        setNewClient({
            name: '',
            cnpj: '',
            segment: '',
            contactEmail: '',
            contactPhone: '',
            owner_name: ''
        });
        setModalError('');
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    // Atualiza os campos do novo cliente
    const handleNewClientChange = (e) => {
        const { name, value } = e.target;
        setNewClient((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleCreateClient = async () => {
        if (!newClient.name) {
            setModalError("O campo 'Nome' é obrigatório.");
            return;
        }
        try {
            await api.post('/clients/', newClient);
            fetchClients();
            setOpenModal(false);
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            setModalError('Erro ao criar cliente. Verifique os dados e tente novamente.');
        }
    };

    // Máscara dinâmica para CPF/CNPJ com dispatch
    const docMask = {
        mask: [
            { mask: '000.000.000-00' },           // CPF (11 dígitos)
            { mask: '00.000.000/0000-00' }         // CNPJ (14 dígitos)
        ],
        dispatch: function (appended, dynamicMasked) {
            // Concatena o valor atual com o que está sendo digitado e remove tudo que não é dígito
            const number = (dynamicMasked.value + appended).replace(/\D/g, '');
            // Se tiver mais de 11 dígitos, retorna a máscara de CNPJ
            return number.length > 11 ? dynamicMasked.compiledMasks[1] : dynamicMasked.compiledMasks[0];
        },
    };

    // Filtra os clientes com base no termo de busca (nome, e-mail de contato e nome do dono)
    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contactEmail && client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.ownerName && client.ownerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Clientes
                </Typography>
                <Button variant="contained" onClick={handleOpenModal}>
                    Novo Cliente
                </Button>
            </Box>

            {/* Campo de pesquisa */}
            <Box sx={{ mb: 2 }}>
                <TextField
                    fullWidth
                    label="Pesquisar por nome, e-mail ou responsável"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : errorMsg ? (
                <Alert severity="error">{errorMsg}</Alert>
            ) : (
                <Grid container spacing={2} sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}>
                    {filteredClients.map((client) => (
                        <Grid item key={client.id} xs={12} sm={12} md={6} lg={6}>
                            <Card sx={{ minHeight: 150, minWidth: { xs: 'auto', md: 400 } }}>
                                <CardActionArea onClick={() => handleCardClick(client.id)}>
                                    <CardContent>
                                        <Typography variant="h6">{client.name}</Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                            E-mail: {client.contactEmail}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                            Telefone: {client.contactPhone}
                                        </Typography>
                                        {/* Exibe o nome do dono/responsável, se existir */}
                                        {client.ownerName && (
                                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                                Responsavel: {client.ownerName}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Modal para criação de novo cliente */}
            <Dialog open={openModal} onClose={handleCloseModal}>
                <DialogTitle>Novo Cliente</DialogTitle>
                <DialogContent>
                    {modalError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {modalError}
                        </Alert>
                    )}
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome"
                        name="name"
                        fullWidth
                        variant="outlined"
                        value={newClient.name}
                        onChange={handleNewClientChange}
                        required
                    />

                    {/* Campo CPF/CNPJ com máscara dinâmica */}
                    <TextField
                        margin="dense"
                        label="CPF/CNPJ"
                        name="cnpj"
                        fullWidth
                        variant="outlined"
                        value={newClient.cnpj}
                        onChange={handleNewClientChange}
                        InputProps={{
                            inputComponent: TextMaskCustom,
                            inputProps: {
                                mask: docMask,
                                name: 'cnpj',
                            },
                        }}
                    />

                    <TextField
                        margin="dense"
                        label="Segmento"
                        name="segment"
                        fullWidth
                        variant="outlined"
                        value={newClient.segment}
                        onChange={handleNewClientChange}
                    />

                    <TextField
                        margin="dense"
                        label="E-mail de Contato"
                        name="contactEmail"
                        fullWidth
                        variant="outlined"
                        value={newClient.contactEmail}
                        onChange={handleNewClientChange}
                    />

                    <TextField
                        margin="dense"
                        label="Telefone"
                        name="contactPhone"
                        fullWidth
                        variant="outlined"
                        value={newClient.contactPhone}
                        onChange={handleNewClientChange}
                        InputProps={{
                            inputComponent: TextMaskCustom,
                            inputProps: {
                                mask: '(00) 00000-0000',
                                name: 'contactPhone',
                            },
                        }}
                    />

                    {/* Campo para nome do dono/responsável */}
                    <TextField
                        margin="dense"
                        label="Nome do Dono (Responsável)"
                        name="owner_name"
                        fullWidth
                        variant="outlined"
                        value={newClient.owner_name}
                        onChange={handleNewClientChange}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreateClient}>
                        Criar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
