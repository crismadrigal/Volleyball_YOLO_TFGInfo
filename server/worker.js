// Define the worker thread that will run the python script

const { workerData, parentPort } = require('worker_threads');
const { spawn } = require('child_process');

// Start the python process (python3, script, arguments)
const pythonProcess = spawn('python3', [
  'detections.py',
  '--detec', workerData.detectName,
  '--model', workerData.model,
  '--file', workerData.path,
  '--confidence', workerData.confidence
]);

// Listen for the python process events
pythonProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

pythonProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

pythonProcess.on('close', (code) => {
  console.log(`Child process exited with code ${code}`);
  parentPort.postMessage({ type: 'finished' });
});
