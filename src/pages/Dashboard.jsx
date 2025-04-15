// import { useState, useEffect } from 'react';
// import { Grid, Paper, Typography, Box } from '@mui/material';
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer
// } from 'recharts';
// import { mockProjects } from '../mocks/projects';
// import { mockTasks } from '../mocks/tasks';
// import { mockAppointments } from '../mocks/appointments';

// export default function Dashboard() {
//   const [stats, setStats] = useState({
//     projects: {
//       total: 0,
//       inProgress: 0,
//       completed: 0
//     },
//     tasks: {
//       total: 0,
//       pending: 0,
//       inProgress: 0,
//       completed: 0
//     },
//     appointments: {
//       upcoming: 0
//     }
//   });

//   const [userName, setUserName] = useState('');

//   useEffect(() => {
//     // Recupera os dados do usuário armazenados no localStorage
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       const user = JSON.parse(storedUser);
//       setUserName(user.name);
//     }

//     // Calcula as estatísticas
//     const projectStats = {
//       total: mockProjects.length,
//       inProgress: mockProjects.filter(p => p.status === 'Em Progresso').length,
//       completed: mockProjects.filter(p => p.status === 'Concluído').length
//     };

//     const taskStats = {
//       total: mockTasks.length,
//       pending: mockTasks.filter(t => t.status === 'Pendente').length,
//       inProgress: mockTasks.filter(t => t.status === 'Em Progresso').length,
//       completed: mockTasks.filter(t => t.status === 'Concluída').length
//     };

//     const now = new Date();
//     const appointmentStats = {
//       upcoming: mockAppointments.filter(a => new Date(a.dateTime) > now).length
//     };

//     setStats({ projects: projectStats, tasks: taskStats, appointments: appointmentStats });
//   }, []);

//   const projectData = [
//     { name: 'Total', value: stats.projects.total },
//     { name: 'Em Progresso', value: stats.projects.inProgress },
//     { name: 'Concluídos', value: stats.projects.completed }
//   ];

//   const taskData = [
//     { name: 'Total', value: stats.tasks.total },
//     { name: 'Pendentes', value: stats.tasks.pending },
//     { name: 'Em Progresso', value: stats.tasks.inProgress },
//     { name: 'Concluídas', value: stats.tasks.completed }
//   ];

//   return (
//     <Box>
//       <Typography variant="h4" gutterBottom>
//         Dashboard {userName && `- Bem-vindo, ${userName}`}
//       </Typography>
//       <Grid container spacing={3}>
//         {/* Estatísticas de Projetos */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 2, height: '100%' }}>
//             <Typography variant="h6" gutterBottom>
//               Projetos
//             </Typography>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={projectData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="value" fill="#8884d8" />
//               </BarChart>
//             </ResponsiveContainer>
//           </Paper>
//         </Grid>

//         {/* Estatísticas de Tarefas */}
//         <Grid item xs={12} md={6}>
//           <Paper sx={{ p: 2, height: '100%' }}>
//             <Typography variant="h6" gutterBottom>
//               Tarefas
//             </Typography>
//             <ResponsiveContainer width="100%" height={300}>
//               <BarChart data={taskData}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="name" />
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey="value" fill="#82ca9d" />
//               </BarChart>
//             </ResponsiveContainer>
//           </Paper>
//         </Grid>

//         {/* Próximos Compromissos */}
//         <Grid item xs={12}>
//           <Paper sx={{ p: 2 }}>
//             <Typography variant="h6" gutterBottom>
//               Próximos Compromissos
//             </Typography>
//             <Typography variant="h3" align="center" color="primary">
//               {stats.appointments.upcoming}
//             </Typography>
//             <Typography variant="subtitle1" align="center" color="text.secondary">
//               compromissos agendados
//             </Typography>
//           </Paper>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// }

import { Box, Typography } from '@mui/material';

export default function Calendar() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Calendário
      </Typography>
      <Typography variant="body1">
        Visualização do calendário será implementada em breve.
      </Typography>
    </Box>
  );
}
