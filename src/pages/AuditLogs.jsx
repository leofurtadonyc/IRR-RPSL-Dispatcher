import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Fetch audit logs from the backend API
    const fetchAuditLogs = async () => {
      try {
        console.log('Fetching audit logs...');
        const response = await fetch('/api/v1/audit-logs');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Received audit logs data:', data);
        
        if (data.logs && Array.isArray(data.logs)) {
          setLogs(data.logs);
          setFilteredLogs(data.logs);
        } else {
          // If no logs are found or the response format is unexpected
          setLogs([]);
          setFilteredLogs([]);
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        // Set empty arrays if there's an error
        setLogs([]);
        setFilteredLogs([]);
      }
    };
    
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    const results = logs.filter(log =>
      log.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.objectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(results);
    setPage(0);
  }, [searchTerm, logs]);

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

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search logs..."
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
                <TableCell>Timestamp</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Host IP</TableCell>
                <TableCell>Operation</TableCell>
                <TableCell>Object Type</TableCell>
                <TableCell>Identifier</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.timestamp}</TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell>{log.hostIp}</TableCell>
                    <TableCell>{log.operation}</TableCell>
                    <TableCell>{log.objectType}</TableCell>
                    <TableCell>{log.identifier}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default AuditLogs;