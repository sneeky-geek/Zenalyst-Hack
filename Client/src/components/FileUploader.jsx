import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

const FileUploader = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    // Filter files to only include supported formats
    const supportedExtensions = ['.xlsx', '.xls', '.csv', '.pdf'];
    const filteredFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      return supportedExtensions.includes(ext);
    });
    
    // Check if any files were filtered out
    if (filteredFiles.length < files.length) {
      setError(`${files.length - filteredFiles.length} file(s) were skipped because they are not supported. Only Excel, CSV, and PDF files are processed.`);
    }
    
    // Group files by directory for better organization
    const filesByDirectory = {};
    filteredFiles.forEach(file => {
      // Handle relative path for folder uploads
      const path = file.webkitRelativePath || '';
      const directory = path ? path.split('/')[0] : 'Files';
      
      if (!filesByDirectory[directory]) {
        filesByDirectory[directory] = [];
      }
      filesByDirectory[directory].push(file);
    });
    
    // Add all files to selectedFiles state
    setSelectedFiles(prev => [...prev, ...filteredFiles]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setUploadStatus('Uploading files...');

    try {
      // Create FormData to send files
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Upload files
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total); // 50% for upload
          setUploadProgress(progress);
        }
      });

      setUploadStatus('Processing files...');
      
      // Process files through ETL pipeline
      const processingResponse = await axios.post('http://localhost:5000/api/process', {
        files: response.data.uploadedFiles
      });

      setProcessedFiles(processingResponse.data.processedFiles);
      setUploadProgress(100);
      setUploadStatus('Files processed successfully!');
      
      // Call callback to refresh dashboard data
      if (onUploadComplete) {
        onUploadComplete(processingResponse.data);
      }

      // Reset selected files
      setSelectedFiles([]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload files. Please try again.');
      setUploadProgress(0);
      setUploadStatus('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fileTypesAccepted = ".xlsx,.xls,.csv,.pdf";

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Financial Documents
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              mb: 2,
              backgroundColor: '#f9f9f9',
              '&:hover': {
                backgroundColor: '#f0f0f0',
                borderColor: '#1976d2'
              }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* File upload input */}
              <Box>
                <input
                  type="file"
                  multiple
                  accept={fileTypesAccepted}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload-input"
                  disabled={uploading}
                />
                <label htmlFor="file-upload-input">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                    fullWidth
                  >
                    Select Files
                  </Button>
                </label>
              </Box>
              
              {/* Folder upload input */}
              <Box>
                <input
                  type="file"
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="folder-upload-input"
                  disabled={uploading}
                />
                <label htmlFor="folder-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploading}
                    fullWidth
                  >
                    Select Folder
                  </Button>
                </label>
              </Box>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Accepted formats: Excel (.xlsx, .xls), CSV, PDF
              </Typography>
            </Box>
          </Box>

          {selectedFiles.length > 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({selectedFiles.length})
              </Typography>
              <List dense sx={{ maxHeight: '250px', overflow: 'auto' }}>
                {(() => {
                  // Group files by directory
                  const filesByDirectory = {};
                  selectedFiles.forEach((file, index) => {
                    const path = file.webkitRelativePath || '';
                    const directory = path ? path.split('/')[0] : 'Loose Files';
                    
                    if (!filesByDirectory[directory]) {
                      filesByDirectory[directory] = [];
                    }
                    filesByDirectory[directory].push({file, index});
                  });
                  
                  // Render files grouped by directory
                  return Object.entries(filesByDirectory).map(([directory, filesWithIndex], dirIndex) => (
                    <Box key={dirIndex} sx={{ mb: 1 }}>
                      {directory !== 'Loose Files' && (
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            bgcolor: 'primary.light', 
                            color: 'white', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1 
                          }}
                        >
                          📁 {directory} ({filesWithIndex.length} files)
                        </Typography>
                      )}
                      
                      {filesWithIndex.map(({file, index}) => (
                        <ListItem
                          key={index}
                          secondaryAction={
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => handleRemoveFile(index)}
                              disabled={uploading}
                            >
                              Remove
                            </Button>
                          }
                        >
                          <ListItemIcon>
                            <DescriptionIcon />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.webkitRelativePath ? file.name : file.name}
                            secondary={`${(file.size / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      ))}
                    </Box>
                  ));
                })()}
              </List>
              <Button
                variant="contained"
                color="primary"
                onClick={uploadFiles}
                disabled={uploading || selectedFiles.length === 0}
                fullWidth
                sx={{ mt: 2 }}
              >
                {uploading ? 'Processing...' : `Process ${selectedFiles.length} Documents`}
              </Button>
            </>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {uploading && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <CircularProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {uploadStatus || 'Processing...'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {uploadProgress}% complete
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {processedFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Processing Results
                </Typography>
                
                {(() => {
                  // Group files by folder for result display
                  const filesByFolder = {};
                  processedFiles.forEach((file) => {
                    const folder = file.folder || 'Root';
                    
                    if (!filesByFolder[folder]) {
                      filesByFolder[folder] = [];
                    }
                    filesByFolder[folder].push(file);
                  });
                  
                  // Render files grouped by folder
                  return Object.entries(filesByFolder).map(([folder, files], folderIndex) => (
                    <Box key={folderIndex} sx={{ mb: 2 }}>
                      {folder !== 'Root' && (
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            bgcolor: 'success.light', 
                            color: 'white', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1 
                          }}
                        >
                          📁 {folder} ({files.length} files)
                        </Typography>
                      )}
                      
                      <List dense>
                        {files.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {file.success ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                            </ListItemIcon>
                            <ListItemText
                              primary={file.filename}
                              secondary={file.message}
                            />
                            <Chip 
                              label={file.recordsExtracted || 0} 
                              color={file.recordsExtracted > 0 ? "success" : "default"}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ));
                })()}
                
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${processedFiles.reduce((acc, file) => acc + (file.recordsExtracted || 0), 0)} records extracted`}
                    color="primary"
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FileUploader;