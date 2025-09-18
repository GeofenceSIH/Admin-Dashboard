import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  Container
} from '@mui/material';
import GeofenceManager from './GeofenceManager';
import UserManager from './UserManager'; // You'll create this

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#FF9933', // Indian saffron for accent
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function App() {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* App Header */}
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🛡️ Tourist Safety Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Risk Zone & User Management
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: '#f5f5f5' }}>
        <Container maxWidth="xl">
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 'bold',
              }
            }}
          >
            <Tab 
              label="🗺️ Risk Zones" 
              id="tab-0"
              aria-controls="tabpanel-0"
            />
            <Tab 
              label="👥 Users" 
              id="tab-1"
              aria-controls="tabpanel-1"
            />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Content */}
      <Container maxWidth="xl" sx={{ py: 0 }}>
        <TabPanel value={currentTab} index={0}>
          <GeofenceManager />
        </TabPanel>
        
        <TabPanel value={currentTab} index={1}>
          <UserManager />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;
