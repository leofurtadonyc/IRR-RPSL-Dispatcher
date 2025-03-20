import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

const ObjectList = () => {
  const [objects, setObjects] = useState([]);
  const [filteredObjects, setFilteredObjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Fetch data from the backend API
    const fetchObjects = async () => {
      try {
        const response = await fetch('/api/v1/objects');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.objects && Array.isArray(data.objects)) {
          setObjects(data.objects);
          setFilteredObjects(data.objects);
        } else {
          // If no objects are found or the response format is unexpected
          setObjects([]);
          setFilteredObjects([]);
        }
      } catch (error) {
        console.error('Error fetching objects:', error);
        // Set empty arrays if there's an error
        setObjects([]);
        setFilteredObjects([]);
      }
    };
    
    fetchObjects()
  }, []);

  useEffect(() => {
    const results = objects.filter(obj =>
      obj.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      obj.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredObjects(results);
    setPage(0);
  }, [searchTerm, objects]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const getStatusColor = (status) => {
    return status === 'pending' ? 'warning' : 'success';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">RPSL Objects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/objects/new"
        >
          Create New Object
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by identifier or type..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Identifier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredObjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((obj) => (
                  <TableRow key={obj.id}>
                    <TableCell>{obj.type}</TableCell>
                    <TableCell>{obj.identifier}</TableCell>
                    <TableCell>
                      <Chip 
                        label={obj.status} 
                        color={getStatusColor(obj.status)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{obj.lastModified}</TableCell>
                    <TableCell>
                      <IconButton
                        component={Link}
                        to={`/objects/${obj.id}`}
                        color="primary"
                        size="small"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredObjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default ObjectList;