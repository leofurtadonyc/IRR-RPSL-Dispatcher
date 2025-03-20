import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  List as ListIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalObjects: 0,
    pendingObjects: 0,
    submittedObjects: 0,
    recentActivity: [],
  });

  useEffect(() => {
    // Fetch data from the backend API
    const fetchDashboardData = async () => {

        try {
        const response = await fetch('/api/v1/objects');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.objects && Array.isArray(data.objects)) {
          const objects = data.objects;
          const pendingCount = objects.filter(obj => obj.status === 'pending').length;
          const submittedCount = objects.filter(obj => obj.status === 'submitted').length;
          
          // Sort by lastModified date to get the most recent objects
          const sortedObjects = [...objects].sort((a, b) => {
            return new Date(b.lastModified) - new Date(a.lastModified);
          });
          
          // Take the 5 most recent objects for the activity feed
          const recentActivity = sortedObjects.slice(0, 5).map(obj => ({
            id: obj.id,
            type: obj.type,
            action: 'add', // Default action since we don't have this info
            timestamp: new Date(obj.lastModified).toLocaleString(),
            status: obj.status
          }));
          
          setStats({
            totalObjects: objects.length,
            pendingObjects: pendingCount,
            submittedObjects: submittedCount,
            recentActivity
          });
        } else {
          // If no objects are found or the response format is unexpected
          setStats({
            totalObjects: 0,
            pendingObjects: 0,
            submittedObjects: 0,
            recentActivity: []
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set default values if there's an error
        setStats({
          totalObjects: 0,
          pendingObjects: 0,
          submittedObjects: 0,
          recentActivity: []
        });
      }
    };
    
    fetchDashboardData()
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Quick Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/objects/new"
            >
              Create New Object
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ListIcon />}
              component={Link}
              to="/objects"
            >
              View All Objects
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              component={Link}
              to="/audit-logs"
            >
              View Audit Logs
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              component={Link}
              to="/whois"
            >
              Whois Query
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Objects
              </Typography>
              <Typography variant="h3">{stats.totalObjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Objects
              </Typography>
              <Typography variant="h3">{stats.pendingObjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Submitted Objects
              </Typography>
              <Typography variant="h3">{stats.submittedObjects}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Activity */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {stats.recentActivity.map((activity, index) => (
            <React.Fragment key={activity.id}>
              {index > 0 && <Divider />}
              <ListItem
                button
                component={Link}
                to={`/objects/${activity.id}`}
              >
                <ListItemText
                  primary={
                    <Typography>
                      <strong>{activity.type}</strong> - {activity.action}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2">
                      {activity.timestamp} - <span style={{ color: activity.status === 'pending' ? 'orange' : 'green' }}>{activity.status}</span>
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Dashboard;