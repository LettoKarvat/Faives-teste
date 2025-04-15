// src/pages/Accesses.jsx
import { useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { mockAccesses } from '../mocks/accesses';
import { mockClients } from '../mocks/clients';

export default function Accesses() {
    const [accesses] = useState(mockAccesses);

    const columns = [
        {
            field: 'clientId',
            headerName: 'Cliente',
            flex: 1,
            valueGetter: (params) => {
                const client = mockClients.find(c => c.id === params.value);
                return client ? client.name : '';
            }
        },
        { field: 'type', headerName: 'Tipo', flex: 1 },
        { field: 'ip', headerName: 'IP', flex: 1 },
        { field: 'port', headerName: 'Porta', flex: 0.5, valueGetter: (params) => params.value || '-' },
        { field: 'user', headerName: 'Usuário', flex: 1 },
        {
            field: 'password',
            headerName: 'Senha',
            flex: 1,
            // Exemplo simples: exibir em texto puro
            // Em produção, você não deve exibir senhas assim
        },
        { field: 'description', headerName: 'Descrição', flex: 1.5 },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Acessos
            </Typography>
            <Paper sx={{ height: 400, width: '100%' }}>
                <DataGrid
                    rows={accesses}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    disableSelectionOnClick
                />
            </Paper>
        </Box>
    );
}
