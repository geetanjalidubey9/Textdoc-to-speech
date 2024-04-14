import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import TextToSpeechConverter from './TextToSpeechConverter'; // Corrected import path

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text-to-speech" element={<TextToSpeechConverter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function Home() {
  return <h1>Home Page</h1>; // Example of a Home page component
}

function NotFound() {
  return <Navigate to="/" replace />; // Redirect to the home page if route not found
}

export default App;