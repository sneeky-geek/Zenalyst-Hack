import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import FileUpload from './components/FileUpload';
import Analytics from './components/Analytics';
import AIInsights from './components/AIInsights';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load sample data on app start
  useEffect(() => {
    const loadSampleData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/sample-data');
        if (response.ok) {
          const data = await response.json();
          setAnalysisData(data);
        }
      } catch (error) {
        console.log('Sample data not available, will load on demand');
      }
    };
    
    loadSampleData();
  }, []);

  // Persist data in localStorage
  useEffect(() => {
    if (analysisData) {
      localStorage.setItem('zenalyst_analysis_data', JSON.stringify(analysisData));
    }
  }, [analysisData]);

  // Load data from localStorage on app start
  useEffect(() => {
    const savedData = localStorage.getItem('zenalyst_analysis_data');
    if (savedData && !analysisData) {
      try {
        setAnalysisData(JSON.parse(savedData));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <Dashboard 
                  analysisData={analysisData}
                  setAnalysisData={setAnalysisData}
                  loading={loading}
                  setLoading={setLoading}
                />
              } 
            />
            <Route 
              path="/upload" 
              element={
                <FileUpload 
                  setAnalysisData={setAnalysisData}
                  setLoading={setLoading}
                />
              } 
            />
            <Route 
              path="/analytics" 
              element={<Analytics analysisData={analysisData} />} 
            />
            <Route 
              path="/insights" 
              element={<AIInsights analysisData={analysisData} />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
