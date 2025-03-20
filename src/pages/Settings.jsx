import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

// Default server configurations
const DEFAULT_SERVERS = {
  irrd: {
    name: 'Local IRRd',
    hostname: '127.0.0.1',
    port: '8080',
    useHttps: false,
  },
  altdb: {
    name: 'ALTDB',
    hostname: 'whois.altdb.net',
    port: '443',
    useHttps: true,
  },
  radb: {
    name: 'RADB',
    hostname: 'whois.radb.net',
    port: '443',
    useHttps: true,
  },
  tc: {
    name: 'TC IRR',
    hostname: 'bgp.net.br',
    port: '443',
    useHttps: true,
  },
};

const Settings = () => {
  // State for server configurations
  const [serverConfigs, setServerConfigs] = useState(DEFAULT_SERVERS);
  const [defaultIrr, setDefaultIrr] = useState('tc');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load saved settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('irrSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setServerConfigs(parsedSettings.servers || DEFAULT_SERVERS);
        setDefaultIrr(parsedSettings.defaultIrr || 'tc');
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Handle changes to server configuration fields
  const handleServerConfigChange = (serverKey, field, value) => {
    setServerConfigs({
      ...serverConfigs,
      [serverKey]: {
        ...serverConfigs[serverKey],
        [field]: value,
      },
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save settings to localStorage
    const settings = {
      servers: serverConfigs,
      defaultIrr,
    };
    
    localStorage.setItem('irrSettings', JSON.stringify(settings));
    
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success',
    });
  };

  // Handle reset to defaults
  const handleReset = () => {
    setServerConfigs(DEFAULT_SERVERS);
    setDefaultIrr('tc');
    
    setSnackbar({
      open: true,
      message: 'Settings reset to defaults',
      severity: 'info',
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom>
            IRR Server Configurations
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default IRR Server</InputLabel>
                <Select
                  value={defaultIrr}
                  onChange={(e) => setDefaultIrr(e.target.value)}
                  label="Default IRR Server"
                >
                  <MenuItem value="irrd">Local IRRd</MenuItem>
                  <MenuItem value="altdb">ALTDB</MenuItem>
                  <MenuItem value="radb">RADB</MenuItem>
                  <MenuItem value="tc">TC IRR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Local IRRd Settings */}
          <Typography variant="h6" gutterBottom>
            Local IRRd
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hostname"
                value={serverConfigs.irrd.hostname}
                onChange={(e) => handleServerConfigChange('irrd', 'hostname', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Port"
                value={serverConfigs.irrd.port}
                onChange={(e) => handleServerConfigChange('irrd', 'port', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={serverConfigs.irrd.useHttps}
                    onChange={(e) => handleServerConfigChange('irrd', 'useHttps', e.target.checked)}
                  />
                }
                label="Use HTTPS"
              />
            </Grid>
          </Grid>
          
          {/* ALTDB Settings */}
          <Typography variant="h6" gutterBottom>
            ALTDB
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hostname"
                value={serverConfigs.altdb.hostname}
                onChange={(e) => handleServerConfigChange('altdb', 'hostname', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Port"
                value={serverConfigs.altdb.port}
                onChange={(e) => handleServerConfigChange('altdb', 'port', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={serverConfigs.altdb.useHttps}
                    onChange={(e) => handleServerConfigChange('altdb', 'useHttps', e.target.checked)}
                  />
                }
                label="Use HTTPS"
              />
            </Grid>
          </Grid>
          
          {/* RADB Settings */}
          <Typography variant="h6" gutterBottom>
            RADB
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hostname"
                value={serverConfigs.radb.hostname}
                onChange={(e) => handleServerConfigChange('radb', 'hostname', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Port"
                value={serverConfigs.radb.port}
                onChange={(e) => handleServerConfigChange('radb', 'port', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={serverConfigs.radb.useHttps}
                    onChange={(e) => handleServerConfigChange('radb', 'useHttps', e.target.checked)}
                  />
                }
                label="Use HTTPS"
              />
            </Grid>
          </Grid>
          
          {/* TC IRR Settings */}
          <Typography variant="h6" gutterBottom>
            TC IRR
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hostname"
                value={serverConfigs.tc.hostname}
                onChange={(e) => handleServerConfigChange('tc', 'hostname', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Port"
                value={serverConfigs.tc.port}
                onChange={(e) => handleServerConfigChange('tc', 'port', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={serverConfigs.tc.useHttps}
                    onChange={(e) => handleServerConfigChange('tc', 'useHttps', e.target.checked)}
                  />
                }
                label="Use HTTPS"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
            >
              Save Settings
            </Button>
            <Button
              variant="outlined"
              onClick={handleReset}
            >
              Reset to Defaults
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;