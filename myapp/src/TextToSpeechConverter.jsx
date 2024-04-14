import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audio, setAudio] = useState(null); // State to hold audio element
  const [playing, setPlaying] = useState(false); // State to track if audio is playing
  const [conversionMessage, setConversionMessage] = useState('');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [pauseMessage, setPauseMessage] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const convertToAudio = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('http://localhost:5000/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        setAudioUrl(response.data.audioUrl);
        setConversionMessage('Audio is converted');
      }
    } catch (error) {
      console.error('Error converting file:', error);
      alert('An error occurred during file conversion');
    }
  };

  const handleDownload = async () => {
    if (!audioUrl) {
      alert('Audio file not available');
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000${audioUrl}`, {
        responseType: 'blob', // Important: responseType should be set to 'blob' for downloading files
      });

      if (response.status === 200) {
        // Create a temporary URL for the audio blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Create a link element and trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'audio.mp3');
        document.body.appendChild(link);
        link.click();

        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);

        setDownloadMessage('Audio is downloaded');
      }
    } catch (error) {
      console.error('Error downloading audio file:', error);
      alert('An error occurred while downloading the audio file');
    }
  };

  const handlePlay = () => {
    if (audioUrl) {
      if (!audio) {
        const newAudio = new Audio(`http://localhost:5000${audioUrl}`);
        newAudio.play();
        newAudio.onended = () => {
          setPlaying(false);
          setPauseMessage('Audio is paused');
        };
        setAudio(newAudio);
        setPlaying(true);
        setPauseMessage('');
      } else {
        audio.play();
        setPlaying(true);
        setPauseMessage('');
      }
    }
  };

  const handlePause = () => {
    if (audio) {
      audio.pause();
      setPlaying(false);
      setPauseMessage('Audio is paused');
    }
  };

  return (
    <div className="App">
      <style>
        {`
          .App {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #333;
            color: white;
          }

          .container {
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            width: 70%;
            max-width: 600px;
            text-align: center;
            color: black; /* Change text color to black */
          }

          .header {
            margin-bottom: 20px;
            font-size: 28px;
            font-weight: bold;
            color: black; /* Change heading color to black */
          }

          .file-input {
            margin-bottom: 20px;
          }

          .action-buttons {
            display: flex;
            justify-content: center;
          }

          .action-buttons button {
            margin: 0 10px;
            padding: 10px 20px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            background-color: #007bff;
            color: white;
            transition: background-color 0.3s ease;
          }

          .action-buttons button:hover {
            background-color: #0056b3;
          }

          .play-btn[disabled], .pause-btn[disabled] {
            cursor: not-allowed;
            background-color: #777;
          }

          .message {
            font-size: 14px;
            margin-top: 10px;
            color: green; /* Change message color to green */
          }
        `}
      </style>
      <div className="container">
        <h1 className="header">Text to Speech Converter</h1>
        <input className="file-input" type="file" accept=".txt,.doc,.docx" onChange={handleFileChange} />
        {selectedFile && (
          <p>Selected file: {selectedFile.name}</p>
        )}
        <div className="action-buttons">
          <button onClick={convertToAudio}>Convert to Audio</button>
          <button onClick={handleDownload}>Download Audio</button>
          {audioUrl && (
            <>
              <button className="play-btn" onClick={handlePlay} disabled={playing}>
                {playing ? 'Playing...' : 'Play Audio'}
              </button>
              <button className="pause-btn" onClick={handlePause} disabled={!playing}>
                Pause Audio
              </button>
            </>
          )}
        </div>
        {conversionMessage && <p className="message">{conversionMessage}</p>}
        {downloadMessage && <p className="message">{downloadMessage}</p>}
        {pauseMessage && <p className="message">{pauseMessage}</p>}
      </div>
    </div>
  );
}

export default App;
