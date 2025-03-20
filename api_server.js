const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8081;

// Middleware
app.use(bodyParser.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// API endpoint to handle RPSL object submissions
app.post('/v1/submit', (req, res) => {
  try {
    const { object_type, action, data, multiple_routes, server, server_config } = req.body;
    
    if (!object_type || !action || !data || !data.object_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Default to irrd if no server specified
    const targetServer = server || 'irrd';

    // Create a temporary file with the RPSL object data
    const tempDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const timestamp = new Date().getTime();
    const tempFile = path.join(tempDir, `rpsl_${timestamp}.txt`);
    
    // Format the content for the temporary file
    let fileContent = `# MAKE SURE TO CHANGE THE DESIRED ACTION. OPTIONS ARE: add, modify, delete\naction: ${action}\n`;
    
    if (data.passwords && data.passwords.length > 0) {
      fileContent += `password: ${data.passwords[0]}\n`;
    }
    
    if (multiple_routes) {
      fileContent += `multiple_routes: true\n`;
    }
    
    fileContent += `${data.object_text}`;
    
    fs.writeFileSync(tempFile, fileContent);
    
    // Execute the Python script with the temporary file and specified server
    const cmd = `python3 ${path.join(__dirname, 'irr_rpsl_dispatcher.py')} --instance ${targetServer} ${tempFile}`;
    
    exec(cmd, (error, stdout, stderr) => {
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return res.status(500).json({ error: error.message, stderr });
      }
      
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
      
      console.log(`Command output: ${stdout}`);
      
      // Parse the output to find the JSON filename
      const jsonFileMatch = stdout.match(/Generated JSON file: (.+\.json)/i);
      const jsonFilename = jsonFileMatch ? jsonFileMatch[1] : null;
      
      // Return success response
      return res.status(200).json({
        summary: { successful: 1, failed: 0 },
        message: 'RPSL object submitted successfully',
        details: stdout,
        jsonFile: jsonFilename
      });
    });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// API endpoint to get all RPSL objects
app.get('/v1/objects', (req, res) => {
  try {
    const objectsDir = path.join(__dirname, 'objects');
    
    if (!fs.existsSync(objectsDir)) {
      return res.json({ objects: [] });
    }
    
    const files = fs.readdirSync(objectsDir);
    const objects = [];
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(objectsDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const objectData = JSON.parse(fileContent);
          
          objects.push({
            id: path.basename(file, '.json'),
            type: objectData.object_type,
            identifier: objectData.data.identifier,
            status: objectData.status,
            lastModified: fs.statSync(filePath).mtime.toISOString()
          });
        } catch (err) {
          console.error(`Error reading file ${file}: ${err.message}`);
        }
      }
    });
    
    return res.json({ objects });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// API endpoint to get a specific RPSL object
app.get('/v1/objects/:id', (req, res) => {
  try {
    const objectsDir = path.join(__dirname, 'objects');
    const { id } = req.params;
    
    if (!fs.existsSync(objectsDir)) {
      return res.status(404).json({ error: 'Object not found' });
    }
    
    const files = fs.readdirSync(objectsDir);
    let objectFile = null;
    
    for (const file of files) {
      if (file.startsWith(id) || file === `${id}.json`) {
        objectFile = file;
        break;
      }
    }
    
    if (!objectFile) {
      return res.status(404).json({ error: 'Object not found' });
    }
    
    const filePath = path.join(objectsDir, objectFile);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const objectData = JSON.parse(fileContent);
    
    return res.json(objectData);
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// API endpoint to handle whois queries
app.post('/v1/whois', (req, res) => {
  try {
    const { query, server } = req.body;
    
    if (!query || !server) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Map server option to actual hostname and port
    let hostname, port;
    switch(server) {
      case 'irrd':
        hostname = 'localhost';
        port = '8043';
        break;
      case 'altdb':
        hostname = 'whois.altdb.net';
        port = '';
        break;
      case 'radb':
        hostname = 'whois.radb.net';
        port = '';
        break;
      case 'tc':
        hostname = 'bgp.net.br';
        port = '';
        break;
      default:
        return res.status(400).json({ error: 'Invalid server option' });
    }

    // Execute whois command with port if specified
    const portParam = port ? `-p ${port}` : '';
    const cmd = `whois -h ${hostname} ${portParam} ${query}`;
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing whois command: ${error.message}`);
        return res.status(500).json({ error: error.message, stderr });
      }
      
      if (stderr) {
        console.error(`Whois command stderr: ${stderr}`);
      }
      
      return res.status(200).json({
        result: stdout,
        server: hostname
      });
    });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// API endpoint to handle RPSL object deletions
app.delete('/v1/submit', (req, res) => {
  try {
    const { object_type, data, server, server_config } = req.body;
    
    if (!object_type || !data || !data.object_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Set action to delete for DELETE requests
    const action = 'delete';
    
    // Default to irrd if no server specified
    const targetServer = server || 'irrd';

    // Create a temporary file with the RPSL object data
    const tempDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const timestamp = new Date().getTime();
    const tempFile = path.join(tempDir, `rpsl_${timestamp}.txt`);
    
    // Format the content for the temporary file
    let fileContent = `# MAKE SURE TO CHANGE THE DESIRED ACTION. OPTIONS ARE: add, modify, delete\naction: ${action}\n`;
    
    if (data.passwords && data.passwords.length > 0) {
      fileContent += `password: ${data.passwords[0]}\n`;
    }
    
    fileContent += `${data.object_text}`;
    
    fs.writeFileSync(tempFile, fileContent);
    
    // Execute the Python script with the temporary file and specified server
    const cmd = `python3 ${path.join(__dirname, 'irr_rpsl_dispatcher.py')} --instance ${targetServer} ${tempFile}`;
    
    exec(cmd, (error, stdout, stderr) => {
      // Clean up the temporary file
      fs.unlinkSync(tempFile);
      
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return res.status(500).json({ error: error.message, stderr });
      }
      
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
      
      console.log(`Command output: ${stdout}`);
      
      // Parse the output to find the JSON filename
      const jsonFileMatch = stdout.match(/Generated JSON file: (.+\.json)/i);
      const jsonFilename = jsonFileMatch ? jsonFileMatch[1] : null;
      
      // Return success response
      return res.status(200).json({
        summary: { successful: 1, failed: 0 },
        message: 'RPSL object deleted successfully',
        details: stdout,
        jsonFile: jsonFilename
      });
    });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// API endpoint to get audit logs
app.get('/v1/audit-logs', (req, res) => {
  try {
    const logsDir = path.join(__dirname, 'logs');
    
    if (!fs.existsSync(logsDir)) {
      return res.json({ logs: [] });
    }
    
    const files = fs.readdirSync(logsDir);
    const logs = [];
    let logId = 1;
    
    files.forEach(file => {
      if (file.startsWith('audit_') && file.endsWith('.log')) {
        try {
          const filePath = path.join(logsDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf8');
          
          // Parse log file content
          const logEntries = fileContent.split('----------------------------------------');
          
          logEntries.forEach(entry => {
            if (entry.trim()) {
              const lines = entry.trim().split('\n');
              const logData = {};
              
              lines.forEach(line => {
                if (line.includes(': ')) {
                  const [key, value] = line.split(': ');
                  logData[key.toLowerCase()] = value;
                }
              });
              
              if (logData.timestamp) {
                // Extract object type and identifier from JSON file name if available
                let objectType = '';
                let identifier = '';
                
                if (logData['json file']) {
                  const jsonFileName = path.basename(logData['json file']);
                  const parts = jsonFileName.split('_');
                  if (parts.length > 0) {
                    objectType = parts[0];
                    // Try to extract identifier from remaining parts
                    if (parts.length > 1) {
                      identifier = parts.slice(1).join('_').replace('.json', '');
                    }
                  }
                }
                
                logs.push({
                  id: logId++,
                  timestamp: logData.timestamp,
                  username: logData.username || '',
                  hostIp: logData['host ip'] || '',
                  operation: logData.operation || '',
                  objectType: objectType,
                  identifier: identifier,
                  jsonFile: logData['json file'] || ''
                });
              }
            }
          });
        } catch (err) {
          console.error(`Error reading log file ${file}: ${err.message}`);
        }
      }
    });
    
    return res.json({ logs });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    return res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});