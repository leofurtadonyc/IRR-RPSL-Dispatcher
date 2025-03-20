import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const Whois = () => {
  const [formData, setFormData] = useState({
    query: '',
    server: '',
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Server options based on irr_rpsl_dispatcher.py
  const serverOptions = [
    { value: 'irrd', label: 'Local IRRd (localhost)', host: 'localhost', port: '8043' },
    { value: 'altdb', label: 'ALTDB (whois.altdb.net)', host: 'whois.altdb.net', port: '' },
    { value: 'radb', label: 'RADB (whois.radb.net)', host: 'whois.radb.net', port: '' },
    { value: 'tc', label: 'TC IRR (bgp.net.br)', host: 'bgp.net.br', port: '' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.query || !formData.server) {
      setSnackbar({
        open: true,
        message: 'Please enter a query and select a server',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    setResult('');
    
    try {
      // Execute whois query via backend
      const response = await fetch('/api/v1/whois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: formData.query,
          server: formData.server,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('Error executing whois query:', error);
      setSnackbar({
        open: true,
        message: `Error executing whois query: ${error.message}`,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
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
        Whois Query
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Whois Query"
                name="query"
                value={formData.query}
                onChange={handleChange}
                placeholder="Enter AS number, IP prefix, or object name"
                variant="outlined"
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>IRR Server</InputLabel>
                <Select
                  name="server"
                  value={formData.server}
                  onChange={handleChange}
                  label="IRR Server"
                >
                  {serverOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                disabled={loading}
              >
                {loading ? 'Querying...' : 'Execute Whois Query'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Query Results
          </Typography>
          <Box 
            component="pre"
            sx={{ 
              p: 2, 
              backgroundColor: 'background.paper', 
              border: 1, 
              borderColor: 'divider',
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: '"Roboto Mono", monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '500px',
            }}
          >
            {result}
          </Box>
        </Paper>
      )}
      
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

export default Whois;