const express = require('express');
const router = express.Router();

// Proxy PTZ POST request to Python microservice
router.post('/focus/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // We send a POST request natively to the Python backend
    // Catch errors gracefully if the python server is down.
    const response = await fetch(`http://localhost:8000/focus/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Python API responded with status ${response.status}`);
    }

    const data = await response.json();

    res.json({ success: true, message: `Successfully focused PTZ on ${id}`, data });
  } catch (error) {
    console.error('Error proxying PTZ focus request:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to focus PTZ camera. Is the Python service running on Port 8000?',
      error: error.message
    });
  }
});

module.exports = router;


