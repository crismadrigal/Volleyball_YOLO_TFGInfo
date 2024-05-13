// Server to handle requests to execute Python scripts
const express = require('express');
const { Worker } = require('worker_threads');
const cors = require('cors');
const fs = require('fs').promises;

// Create the express app
const app = express();
// Set the port (5000)
const port = 5000;

app.use(cors());
app.use(express.json());

// Object to store the active workers
let activeWorkers = {};

// Function to verify if the path is valid and accessible
async function verificarPath(path, res) {
  try {
    // Check if the path is valid and accessible
    await fs.access(path);
    console.log('El path es válido y accesible.');
  } catch (error) {
    // If the path is not valid or accessible, return an error 404
    console.error('Error al acceder al path:', error.message);
    res.status(404).json({ error: 'El path no es válido o no se puede acceder.' });
    return false;
  }
  return true;
}

// Route to execute the Python script
app.post('/execute-python/:selection', async (req, res) => {
  // Get the path, second selection, and confidence from the request body
  const { path, secondSelection, confidence } = req.body;
  // Get the first selection from the URL
  const detectName = req.params.selection;

  if (!await verificarPath(path, res)) {
    return;
  }

  // Define the model based on the second selection
  let model;
  switch(secondSelection) {
    case 'YOLOv8 (customed dataset)': model = 1; break;
    case 'YOLOv8 (pretrained model)': model = 2; break;
    case 'YOLOv9 (pretrained model)': model = 3; break;
    default:
      return res.status(400).json({ error: 'Invalid selection - model' });
  }

  // Define the worker data
  const workerData = {
    path: path,
    detectName: detectName,
    model: model,
    confidence: confidence
  };
  // Create a new worker thread
  const worker = new Worker('./worker.js', { workerData });
  const workerId = worker.threadId;
  activeWorkers[workerId] = worker;

  worker.on('message', message => {
    if (message.type === 'finished') {
      delete activeWorkers[workerId];
      res.json({ message: "Analysis complete", workerId });
    }
  });

  worker.on('error', err => {
    console.log(err);
    delete activeWorkers[workerId];
    res.status(500).json({ error: 'Error during analysis' });
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.log(`Worker stopped with exit code ${code}`);
    }
  });

  res.json({ message: "Analysis started", workerId: workerId });
});

// Route to cancel the analysis
app.post('/cancel-analysis', (req, res) => {
  // Get the worker ID from the request body
  const { workerId } = req.body;
  if (workerId in activeWorkers) {
    // Terminate the worker thread
    activeWorkers[workerId].terminate().then(() => {
      console.log(`Worker ${workerId} terminated`);
      delete activeWorkers[workerId];
      res.send({ message: 'Analysis cancelled', workerId });
    }).catch(err => {
      console.log(`Error terminating worker ${workerId}: ${err}`);
      res.status(500).send({ error: 'Failed to terminate analysis' });
    });
  } else {
    res.status(404).send({ message: 'No active worker with such ID to cancel' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
