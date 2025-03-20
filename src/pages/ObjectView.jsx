import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const ObjectView = () => {
  const { id } = useParams();
  const [object, setObject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchObject = async () => {
      try {
        const response = await fetch(`/api/v1/objects/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform the API response to match the component's expected format
        const formattedObject = {
          id: id,
          type: data.object_type,
          identifier: data.data.identifier,
          status: data.status,
          lastModified: new Date().toLocaleString(), // Use current date or get from API
          objectText: data.data.object_text,
          action: data.action
        };
        
        setObject(formattedObject);
      } catch (error) {
        console.error('Error fetching object:', error);
        setObject(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchObject();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!object) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" color="error">Object not found</Typography>
        <Button
          variant="contained"
          component={Link}
          to="/objects"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Objects
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    return status === 'pending' ? 'warning' : 'success';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{object.type.toUpperCase()}: {object.identifier}</Typography>
        <Box>
          <Button
            variant="outlined"
            component={Link}
            to="/objects"
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/objects/${id}/edit`}
            startIcon={<EditIcon />}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Object Details</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{object.type}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Identifier</Typography>
                <Typography variant="body1">{object.identifier}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip 
                  label={object.status} 
                  color={getStatusColor(object.status)} 
                  size="small" 
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Last Modified</Typography>
                <Typography variant="body1">{object.lastModified}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                <Typography variant="body1">{object.action}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>RPSL Object Text</Typography>
            <Divider sx={{ mb: 2 }} />
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
              }}
            >
              {object.objectText}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ObjectView;