import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import axios from 'axios';

const FileUpload = ({ setAnalysisData, setLoading }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      setErrorMessage('Please upload only PDF files');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36),
      name: file.name,
      size: file.size,
      type: getFileType(file.name),
      status: 'pending'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setErrorMessage('');
  }, []);

  const getFileType = (filename) => {
    const lower = filename.toLowerCase();
    if (lower.includes('po') || lower.includes('purchase_order') || lower.includes('purchase-order')) {
      return 'Purchase Order';
    } else if (lower.includes('grn') || lower.includes('goods_receipt')) {
      return 'GRN';
    } else if (lower.includes('invoice') || lower.includes('pi-')) {
      return 'Purchase Invoice';
    } else if (lower.includes('inventory') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      return 'Inventory Register';
    }
    return 'Document';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) {
      setErrorMessage('Please upload at least one file');
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');
    
    try {
      // Create FormData
      const formData = new FormData();
      uploadedFiles.forEach(fileObj => {
        formData.append('files', fileObj.file);
      });

      // Call backend API
      const response = await axios.post('http://localhost:8000/api/upload-and-analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000 // 2 minutes timeout
      });

      setAnalysisData(response.data);
      setUploadStatus('success');
      
      // Update file statuses
      setUploadedFiles(prev => 
        prev.map(f => ({ ...f, status: 'processed' }))
      );

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(
        error.response?.data?.detail || 
        error.message || 
        'Failed to process files. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="dashboard-card">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
        📁 Upload Business Documents
      </h2>
      
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Upload your Purchase Orders (PO), Purchase Invoices, Goods Receipt Notes (GRN), and Inventory Register to start the analysis
      </p>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive ? 'dragover' : ''}`}
        style={{ marginBottom: '24px' }}
      >
        <input {...getInputProps()} />
        <Upload size={48} style={{ color: '#94a3b8', marginBottom: '16px' }} />
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>
          {isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
        </div>
        <div className="upload-text">
          or <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>browse files</span>
        </div>
        <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
          Supports: PDF, Excel (.xlsx, .xls)
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div style={{ 
          backgroundColor: '#fef2f2', 
          color: '#dc2626', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          border: '1px solid #fecaca'
        }}>
          <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
          {errorMessage}
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#374151' }}>
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div style={{ space: '12px' }}>
            {uploadedFiles.map(fileObj => (
              <div
                key={fileObj.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <File size={20} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#374151' }}>{fileObj.name}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>
                      {fileObj.type} • {formatFileSize(fileObj.size)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {fileObj.status === 'processed' && (
                    <CheckCircle size={16} style={{ color: '#059669' }} />
                  )}
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#dc2626',
                      padding: '4px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      {uploadedFiles.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={processFiles}
            disabled={uploadStatus === 'uploading'}
            style={{
              padding: '16px 32px',
              backgroundColor: uploadStatus === 'uploading' ? '#94a3b8' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            {uploadStatus === 'uploading' ? (
              <>
                <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                Processing Files...
              </>
            ) : (
              <>
                🚀 Start Analysis
              </>
            )}
          </button>
        </div>
      )}

      {/* Expected Files Guide */}
      <div style={{ marginTop: '32px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '12px' }}>
          📋 Expected Document Types:
        </h4>
        <div className="grid grid-2" style={{ gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>📄 Purchase Orders (PO)</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>PDF files containing purchase order details</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>🧾 Purchase Invoices</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Vendor invoices for purchased items</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>📦 Goods Receipt Notes (GRN)</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Documents confirming goods received</div>
          </div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#374151' }}>📊 Inventory Register</div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>Excel file with current inventory details</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;