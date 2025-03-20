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
    // In a real implementation, this would fetch data from the backend API
    // For now, we'll use mock data
    const mockLogs = [
      { id: 1, timestamp: '2023-06-15 14:30', username: 'admin', hostIp: '192.168.1.100', operation: 'add', objectType: 'route', identifier: '192.0.2.0/24' },
      { id: 2, timestamp: '2023-06-15 13:45', username: 'admin', hostIp: '192.168.1.100', operation: 'modify', objectType: 'as-set', identifier: 'AS-EXAMPLE' },
      { id: 3, timestamp: '2023-06-15 11:20', username: 'operator', hostIp: '192.168.1.101', operation: 'add', objectType: 'aut-num', identifier: 'AS12345' },
      { id: 4, timestamp: '2023-06-14 16:15', username: 'admin', hostIp: '192.168.1.100', operation: 'add', objectType: 'route6', identifier: '2001:db8::/32' },
      { id: 5, timestamp: '2023-06-14 10:30', username: 'operator', hostIp: '192.168.1.101', operation: 'modify', objectType: 'mntner', identifier: 'MAINT-AS12345' },
      { id: 6, timestamp: '2023-06-13 09:45', username: 'admin', hostIp: '192.168.1.100', operation: 'delete', objectType: 'route', identifier: '198.51.100.0/24' },
      { id: 7, timestamp: '2023-06-12 14:20', username: 'operator', hostIp: '192.168.1.101', operation: 'add', objectType: 'as-set', identifier: 'AS-CUSTOMERS' },
      { id: 8, timestamp: '2023-06-11 11:10', username: 'admin', hostIp: '192.168.1.100', operation: 'add', objectType: 'person', identifier: 'ADMIN-EXAMPLE' },
    ];
    
    setLogs(mockLogs);
    setFilteredLogs(mockLogs);
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