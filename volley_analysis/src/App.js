/*This file contains the main structure of the application, including the form 
 to select the file to analyze, the options to choose the object to detect and 
 the model to use, and the confidence level to set. It also includes the functions 
 to handle the form inputs and to execute the Python scripts.*/

import React, { useState } from 'react';
import axios from 'axios';
import volleyballIcon from './img/volleyball_icon.png';
import './App.css';

function App() {
  // States to manage the form inputs and the analysis process
  const [error, setError] = useState(''); //error message
  const [file, setFile] = useState(null); //file 
  const [path, setPath] = useState(''); // file path
  const [showOptions, setShowOptions] = useState(false); // show options to choose
  const [firstDropdownSelection, setFirstDropdownSelection] = useState(''); // first dropdown selection
  const [secondDropdownOptions, setSecondDropdownOptions] = useState([]); // second dropdown options
  const [secondDropdownSelection, setSecondDropdownSelection] = useState(''); // second dropdown selection
  const [confidence, setConfidence] = useState(0.5);  // initial confidence level
  const [showConfidence, setShowConfidence] = useState(false);  // show confidence level
  const [isAnalyzing, setIsAnalyzing] = useState(false); // analyzing state
  const [workerId, setWorkerId] = useState(null); // store the worker ID


  // Function to handle the file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validExtensions = /\.(jpg|mp4|avi)$/i;
      if (validExtensions.test(file.name)) {
        setFile(file);
        setError('');
        // Base path to the files directory (using browse)
        const basePath = "/home/cristina/Desktop/TFGInfo/files/";
        setPath(basePath + file.name);  // Store the complete path to the file
        setShowOptions(true);  // Show the options to choose
      } else {
        setError("Invalid file type. Please select a file with an extension of .jpg, .mp4, .avi.");
      }
    }
  };
  
  // Function to handle the path input change
  const handlePathChange = (event) => {
    setPath(event.target.value);
    setFile(null);
  };

  // Function to handle the form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
  
    if (!path && !file) {  // Check if the path or file is empty
      setError("Please select a file.");
      setShowOptions(false);
      return;
    }
  
    // Check if the path is valid
    console.log("Valid input submitted:", path);
    setShowOptions(true);
  };
  

  // Function to handle the first dropdown change
  const handleFirstDropdownChange = (event) => {
    const selection = event.target.value;
    setFirstDropdownSelection(selection);

    // Set the options for the second dropdown based on the first selection
    if (['optionBall', 'optionPlayers'].includes(selection)) {
      setSecondDropdownOptions(['YOLOv8 (customed dataset)', 'YOLOv8 (pretrained model)', 'YOLOv9 (pretrained model)']);
    } else {
      setSecondDropdownOptions(['YOLOv8 (customed dataset)']);
    }
    // Reset the second dropdown selection and confidence level
    setSecondDropdownSelection('');
  };

  // Function to handle the second dropdown change
  const handleSecondDropdownChange = (event) => {
    const selection = event.target.value;
    setSecondDropdownSelection(selection);

    // Show the confidence level input
    setShowConfidence(selection !== "");
  };

  // Function to cancel the analysis
  const cancelAnalysis = async () => {
    if (workerId) {
      try {
        // Send a request to cancel the analysis indicating the worker ID
        await axios.post('http://localhost:5000/cancel-analysis', { workerId });
        resetForm();
        setError('Analysis cancelled by the user.');
      } catch (error) {
        console.error('Failed to cancel the analysis:', error);
        setError('Failed to cancel the analysis.');
      }
      // Reset the analyzing state and worker ID
      setIsAnalyzing(false);
      setWorkerId(null); 
    }
  };

  // Function to execute the analysis
  const executeAnalysis = async () => {
    // Validate the confidence level
    if (confidence < 0 || confidence > 1) {
      setError("Confidence level must be between 0 and 1.");
      resetForm();
      return;
    }

    // Check if all selections are completed
    if (!firstDropdownSelection || !secondDropdownSelection) {
      setError("Please complete all selections.");
      resetForm();
      return;
    }

    // Prepare the data to send to the server
    const data = {
      path: path, 
      secondSelection: secondDropdownSelection,
      confidence: confidence
    };

    // Define the script name based on the first dropdown selection
    let scriptName;
    if (firstDropdownSelection === 'optionBall') {
      scriptName = 'ball';
    } else if (firstDropdownSelection === 'optionPlayers') {
      scriptName = 'players';
    } else if (firstDropdownSelection === 'optionActions') {
      scriptName = 'actions';
    } else if (firstDropdownSelection === 'optionNetCourt') {
      scriptName = 'court';
    }else if (firstDropdownSelection === 'optionNet') {
      scriptName = 'net';
    } else if (firstDropdownSelection === 'optionReferees') {
      scriptName = 'referees';
    } else {
      setError('Invalid selection');
      resetForm();
      return;
    }

    setIsAnalyzing(true); // Set the analyzing state to true

    // Send a POST request to execute the Python script
    axios.post('http://localhost:5000/execute-python/' + scriptName, data)
      .then(response => {
        console.log('Python script output:', response.data);
        console.log('Worker ID:', response.data.workerId);
        setWorkerId(response.data.workerId); // Guardar el ID del proceso
        setError('');
      })
      .catch(error => {
        console.error('Error executing Python script:', error);
        resetForm();
        if (error.response && error.response.status === 404) {          
          setError('Invalid path. Please check the file path and try again.');
        } else {
          setError('Error executing Python script. Check the console for more details.');
        }
      });
  };

// Function to reset the form
const resetForm = () => {
  setFile(null);
  setPath('');
  setShowOptions(false);
  setFirstDropdownSelection('');
  setSecondDropdownOptions([]);
  setSecondDropdownSelection('');
  setShowConfidence(false);
  setConfidence(0.5);
  setIsAnalyzing(false);
};


// Render the application
return (
  <div className="App">
    {isAnalyzing ? (
      <div className="analyzing-container">
        <div className="analyzing-message">ANALYSING FILE...</div>
        <button onClick={cancelAnalysis} className="cancel-button">Cancel</button>
      </div>
    ) : (
      <>
        <header className="App-header">
          <h1>Volleyball Analysis</h1>
          <img src={volleyballIcon} alt="Volleyball" />
        </header>
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter the file path to analyze or use the 'Browse' button"
                value={path}
                onChange={handlePathChange}
                required={!file}
              />
              <input
                type="file"
                id="file"
                accept=".jpg,.jpeg,.png,.mp4,.avi,.mov"
                onChange={handleFileChange}
                required={!path}
              />
              <label htmlFor="file" className="file-label">Browse...</label>
              <button type="submit">Submit</button>
            </div>
          </form>
          {error && <div className="error-message">{error}</div>}
          {showOptions && (
            <>
              <div className="dropdown-container">
                <label htmlFor="first-dropdown">What would you like to detect?</label>
                <select id="first-dropdown" value={firstDropdownSelection} onChange={handleFirstDropdownChange}>
                  <option value="" disabled>Select an option</option>
                  <option value="optionBall">Ball</option>
                  <option value="optionPlayers">Players</option>
                  <option value="optionActions">Actions</option>
                  <option value="optionNetCourt">Net + Court</option>
                  <option value="optionNet">Net</option>
                  <option value="optionReferees">Referees</option>
                </select>
              </div>
              {secondDropdownOptions.length > 0 && (
                <div className="dropdown-container">
                  <label htmlFor="second-dropdown">Choose a model</label>
                  <select id="second-dropdown" value={secondDropdownSelection} onChange={handleSecondDropdownChange}>
                    <option value="" disabled>Select an option</option>
                    {secondDropdownOptions.map((option, index) => (
                      <option key={index} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              )}
              {showConfidence && (
                <div className="input-group">
                  <label htmlFor="confidence">Confidence Level (0-1):</label>
                  <input
                    type="number"
                    id="confidence"
                    min="0"
                    max="1"
                    step="0.01"
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  />
                  <button type="button" onClick={executeAnalysis}>Accept</button>
                </div>
              )}
            </>
          )}
        </div>
      </>
    )}
  </div>
);
}


export default App;