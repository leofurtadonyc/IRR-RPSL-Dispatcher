import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FormHelperText,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

const ObjectForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    objectType: '',
    action: 'add',
    identifier: '',
    password: '',
    objectText: '',
    multipleRoutes: false,
    server: '',
  });
  
  // Server configurations
  const [serverConfigs, setServerConfigs] = useState({
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
  });
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('irrSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.servers) {
          setServerConfigs(parsedSettings.servers);
        }
        // Set default server from settings
        setFormData(prev => ({
          ...prev,
          server: parsedSettings.defaultIrr || 'tc'
        }));
      } catch (error) {
        console.error('Error parsing saved settings:', error);
        // Set default server if settings can't be loaded
        setFormData(prev => ({
          ...prev,
          server: 'tc'
        }));
      }
    } else {
      // No saved settings, use TC as default
      setFormData(prev => ({
        ...prev,
        server: 'tc'
      }));
    }
  }, []);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const objectTypes = [
    { value: 'route', label: 'Route (IPv4)' },
    { value: 'route6', label: 'Route (IPv6)' },
    { value: 'aut-num', label: 'Autonomous System (aut-num)' },
    { value: 'as-set', label: 'AS Set' },
    { value: 'route-set', label: 'Route Set' },
    { value: 'mntner', label: 'Maintainer' },
    { value: 'person', label: 'Person' },
    { value: 'role', label: 'Role' },
  ];

  const actionTypes = [
    { value: 'add', label: 'Add' },
    { value: 'modify', label: 'Modify' },
    { value: 'delete', label: 'Delete' },
  ];

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'multipleRoutes' ? checked : value,
    });

    // Clear error when field is updated
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.objectType) newErrors.objectType = 'Object type is required';
    if (!formData.action) newErrors.action = 'Action is required';
    if (!formData.identifier) newErrors.identifier = 'Identifier is required';
    if (!formData.objectText) newErrors.objectText = 'RPSL object text is required';
    if (!formData.server) newErrors.server = 'IRR server is required';
    
    // Only require password for add and modify actions
    if ((formData.action === 'add' || formData.action === 'modify') && !formData.password) {
      newErrors.password = 'Password is required for add and modify actions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Create the JSON object to submit
    const submitData = {
      object_type: formData.objectType,
      action: formData.action,
      data: {
        object_text: formData.objectText,
        identifier: formData.identifier,
        passwords: formData.password ? [formData.password] : [],
      },
      multiple_routes: formData.multipleRoutes,
      status: 'pending',
    };

    console.log('Submitting object:', submitData);
    
    // Set loading state
    setSnackbar({
      open: true,
      message: 'Submitting RPSL object...',
      severity: 'info',
    });
    
    // Get server configuration for the selected server
    const serverConfig = serverConfigs[formData.server];
    const protocol = serverConfig.useHttps ? 'https' : 'http';
    const apiUrl = `${protocol}://${serverConfig.hostname}:${serverConfig.port}/v1/submit`;
    
    console.log(`Submitting to ${apiUrl}`);
    
    // Submit to the backend API
    fetch('/api/v1/submit', {
      // In a real implementation, we would use apiUrl directly
      // For now, we'll pass the server info to the backend
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...submitData,
        server: formData.server,
        server_config: serverConfig
      }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        setSnackbar({
          open: true,
          message: 'RPSL object submitted successfully!',
          severity: 'success',
        });
        
        // Redirect to objects list after a short delay
        setTimeout(() => {
          navigate('/objects');
        }, 2000);
      })
      .catch(error => {
        console.error('Error:', error);
        setSnackbar({
          open: true,
          message: `Error submitting RPSL object: ${error.message}`,
          severity: 'error',
        });
      })
  };

  const handleSnackbarClose = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  const getObjectTextPlaceholder = () => {
    switch (formData.objectType) {
      case 'route':
        return 'route:         192.0.2.0/24\norigin:        AS12345\ndescr:         Example route\nmnt-by:        MAINT-AS12345\nsource:        IRRD';
      case 'route6':
        return 'route6:        2001:db8::/32\norigin:        AS12345\ndescr:         Example IPv6 route\nmnt-by:        MAINT-AS12345\nsource:        IRRD';
      case 'aut-num':
        return 'aut-num:       AS12345\nas-name:       EXAMPLE-AS\ndescr:         Example AS\nadmin-c:       ADMIN-EXAMPLE\ntech-c:        TECH-EXAMPLE\nmnt-by:        MAINT-AS12345\nsource:        IRRD';
      case 'as-set':
        return 'as-set:        AS-EXAMPLE\ndescr:         Example AS Set\nmembers:       AS12345, AS67890\nmnt-by:        MAINT-AS12345\nsource:        IRRD';
      default:
        return 'Enter RPSL object text here...';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {formData.action === 'add' ? 'Create New' : formData.action === 'modify' ? 'Modify' : 'Delete'} RPSL Object
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.objectType}>
                <InputLabel>Object Type</InputLabel>
                <Select
                  name="objectType"
                  value={formData.objectType}
                  onChange={handleChange}
                  label="Object Type"
                >
                  {objectTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.objectType && <FormHelperText>{errors.objectType}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.action}>
                <InputLabel>Action</InputLabel>
                <Select
                  name="action"
                  value={formData.action}
                  onChange={handleChange}
                  label="Action"
                >
                  {actionTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.action && <FormHelperText>{errors.action}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.server}>
                <InputLabel>IRR Server</InputLabel>
                <Select
                  name="server"
                  value={formData.server}
                  onChange={handleChange}
                  label="IRR Server"
                >
                  <MenuItem value="irrd">{serverConfigs.irrd.name} ({serverConfigs.irrd.hostname})</MenuItem>
                  <MenuItem value="altdb">{serverConfigs.altdb.name} ({serverConfigs.altdb.hostname})</MenuItem>
                  <MenuItem value="radb">{serverConfigs.radb.name} ({serverConfigs.radb.hostname})</MenuItem>
                  <MenuItem value="tc">{serverConfigs.tc.name} ({serverConfigs.tc.hostname})</MenuItem>
                </Select>
                {errors.server && <FormHelperText>{errors.server}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                error={!!errors.identifier}
                helperText={errors.identifier || 'e.g., 192.0.2.0/24, AS12345, AS-EXAMPLE'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || 'Required for add and modify actions'}
                disabled={formData.action === 'delete'}
              />
            </Grid>
            
            {(formData.objectType === 'route' || formData.objectType === 'route6') && (
              <Grid item xs={12}>
                <FormControl>
                  <FormHelperText>
                    Generate multiple route objects (subdivisions) from this prefix?
                  </FormHelperText>
                  <Select
                    name="multipleRoutes"
                    value={formData.multipleRoutes ? 'true' : 'false'}
                    onChange={(e) => handleChange({
                      target: {
                        name: 'multipleRoutes',
                        checked: e.target.value === 'true',
                      },
                    })}
                  >
                    <MenuItem value="false">No</MenuItem>
                    <MenuItem value="true">Yes</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="RPSL Object Text"
                name="objectText"
                value={formData.objectText}
                onChange={handleChange}
                error={!!errors.objectText}
                helperText={errors.objectText}
                multiline
                rows={10}
                placeholder={getObjectTextPlaceholder()}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                size="large"
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ObjectForm;