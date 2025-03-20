import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Layout components
import Layout from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import ObjectForm from './pages/ObjectForm';
import ObjectList from './pages/ObjectList';
import ObjectView from './pages/ObjectView';
import AuditLogs from './pages/AuditLogs';
import Whois from './pages/Whois';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/objects" element={<ObjectList />} />
          <Route path="/objects/new" element={<ObjectForm />} />
          <Route path="/objects/:id" element={<ObjectView />} />
          <Route path="/audit-logs" element={<AuditLogs />} />
          <Route path="/whois" element={<Whois />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;