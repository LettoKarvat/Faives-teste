import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Assignment as ProjectsIcon,
  Task as TasksIcon,
  Event as AppointmentsIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  SupportAgent as CallIcon, // <-- ícone de chamados
} from '@mui/icons-material';

const drawerWidth = 240;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // 1. Ler do localStorage o objeto 'user'
  const storedUser = localStorage.getItem('user');
  const userObject = storedUser ? JSON.parse(storedUser) : {};

  // 2. Pegar nome e role
  const userName = userObject.name || 'Usuário';
  const userRole = userObject.role || '';

  // 3. Itens do menu (Chamados incluso)
  const menuItems = [
    { text: 'Projetos', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Tarefas', icon: <TasksIcon />, path: '/tasks' },
    { text: 'Compromissos', icon: <AppointmentsIcon />, path: '/appointments' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/clients' },
    { text: 'Chamados', icon: <CallIcon />, path: '/calls' }, // <-- novo item
    { text: 'Colaboradores', icon: <PeopleIcon />, path: '/colaboradores', adminOnly: true },
  ];

  // 4. Filtrar menu com base na role
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.adminOnly && userRole !== 'admin') {
      return false;
    }
    return true;
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Sistema de Gestão
          </Typography>
          <Typography variant="subtitle1" sx={{ mr: 2 }}>
            {userName}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>

      {/* Menu lateral */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Drawer para mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        {/* Drawer permanente em telas maiores */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
