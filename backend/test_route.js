const express = require('express');
const app = express();

// Test simple route
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works' });
});

console.log('Test route created successfully');