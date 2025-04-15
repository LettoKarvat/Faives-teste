// FancyItem.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

export default function FancyItem({ text }) {
    // localiza o primeiro ':'
    const indexOfColon = text.indexOf(':');

    if (indexOfColon !== -1) {
        // "label" é tudo antes dos dois-pontos
        const label = text.substring(0, indexOfColon).trim();
        // "value" é tudo depois (incluindo quaisquer outros ':' lá no meio)
        const value = text.substring(indexOfColon + 1).trim();

        return (
            <Box
                sx={{
                    border: '1px dashed #666',
                    p: 1,
                    mb: 1,
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 1
                }}
            >
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#90caf9' }}>
                    {label}:
                </Typography>
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    {value}
                </Typography>
            </Box>
        );
    } else {
        // se não tem ":", volta a lógica de texto puro
        return (
            <Box
                sx={{
                    border: '1px dotted #999',
                    p: 1,
                    mb: 1,
                    borderRadius: 1
                }}
            >
                <Typography variant="body2" sx={{ color: '#fff' }}>
                    {text}
                </Typography>
            </Box>
        );
    }
}
