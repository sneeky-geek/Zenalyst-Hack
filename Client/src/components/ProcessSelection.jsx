import React, { useState } from 'react';
import { ChevronDown, FileText, Upload, Loader2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProcessSelection = ({ onProcessSelect, onFileUpload }) => {
  const [selectedProcess, setSelectedProcess] = useState('');
  const [selectedInputs, setSelectedInputs] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const navigate = useNavigate();

  // Business process definitions from the screenshot
  const businessProcesses = {
    'three-way-match': {
      id: 'three-way-match',
      name: '3-Way Match Verification',
      mainProcess: 'Summary of Data',
      subProcess: '3-Way Match: Verify if PO quantities match GRN quantities and vendor invoices',
      inputs: [
        { id: 'po', name: 'PO {PDF}', type: 'pdf', required: true },
        { id: 'purchase-invoice', name: 'Purchase Invoice {PDF}', type: 'pdf', required: true },
        { id: 'grn', name: 'GRN', type: 'pdf', required: true }
      ]
    },
    'excess-procurement': {
      id: 'excess-procurement',
      name: 'Excess/Short Procurement Analysis',
      mainProcess: 'Verification',
      subProcess: 'Excess Short Procurement / excess procurement',
      inputs: [
        { id: 'po', name: 'PO {PDF}', type: 'pdf', required: true },
        { id: 'purchase-invoice', name: 'Purchase Invoice {PDF}', type: 'pdf', required: true }
      ]
    },
    'inventory-cost': {
      id: 'inventory-cost',
      name: 'Inventory Cost Analysis',
      mainProcess: 'Inventory Cost Analysis',
      subProcess: 'Carrying Cost Incurred for each product on the Obsolete products & highlight if the Gross Margin is less than Carrying Cost',
      inputs: [
        { id: 'inventory-register', name: 'Inventory Register', type: 'excel', required: true }
      ]
    },
    'inventory-ageing': {
      id: 'inventory-ageing',
      name: 'Inventory Ageing Analysis',
      mainProcess: 'Inventory Ageing Analysis',
      subProcess: 'Obsolete/Dead Stock: Items not sold within shelf life window',
      inputs: [
        { id: 'inventory-workings', name: 'Inventory Workings', type: 'excel', required: true }
      ]
    },
    'inventory-valuation': {
      id: 'inventory-valuation',
      name: 'Inventory Valuation Analysis',
      mainProcess: 'Inventory Valuation Analysis',
      subProcess: 'Stock Valuation: Value of inventory based on FIFO (Purchase Invoices) vs. selling price',
      inputs: [
        { id: 'inventory-workings', name: 'Inventory Workings', type: 'excel', required: true }
      ]
    },
    'profitability': {
      id: 'profitability',
      name: 'Profitability Analysis',
      mainProcess: 'Profitability Analysis',
      subProcess: '1. Which vendor-supplied books generate best margins. 2. Which categories are most profitable (Literature, Self-help, Finance, etc.). 3. Calculate the Gross Margin of the each SKUs and highlight if there any -ve margin SKUs & also check which Top 5 products having highest gross margin',
      inputs: [
        { id: 'inventory-register', name: 'Inventory Register', type: 'excel', required: true }
      ]
    }
  };

  const handleProcessChange = (processId) => {
    setSelectedProcess(processId);
    setSelectedInputs([]);
    setUploadedFiles([]);
    
    if (onProcessSelect) {
      onProcessSelect(businessProcesses[processId]);
    }
  };

  const handleFileUpload = (inputId, files) => {
    const input = businessProcesses[selectedProcess]?.inputs.find(i => i.id === inputId);
    if (!input) return;
    
    const validFiles = Array.from(files).filter(file => {
      const isValidType = input.type === 'pdf' ? 
        file.type === 'application/pdf' : 
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.type === 'application/vnd.ms-excel';
      
      if (!isValidType) {
        alert(`Invalid file type for ${input.name}. Please upload ${input.type.toUpperCase()} files only.`);
        return false;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0) return;
    
    const newFiles = validFiles.map(file => ({
      inputId,
      file,
      name: file.name,
      type: file.type,
      id: `${inputId}_${file.name}_${Date.now()}_${Math.random()}`
    }));
    
    setUploadedFiles(prev => {
      // Add new files to existing files for this input (don't remove existing ones)
      const existingFiles = prev.filter(f => f.inputId === inputId);
      const otherFiles = prev.filter(f => f.inputId !== inputId);
      
      // Check for duplicate filenames
      const filteredNewFiles = newFiles.filter(newFile => 
        !existingFiles.some(existing => existing.name === newFile.name)
      );
      
      if (filteredNewFiles.length < newFiles.length) {
        const duplicates = newFiles.length - filteredNewFiles.length;
        alert(`${duplicates} duplicate file${duplicates > 1 ? 's' : ''} skipped.`);
      }
      
      return [...otherFiles, ...existingFiles, ...filteredNewFiles];
    });
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAnalyze = async () => {
    const process = businessProcesses[selectedProcess];
    const filesData = {
      processId: selectedProcess,
      process: process,
      files: uploadedFiles
    };
    
    setIsProcessing(true);
    setProcessingStage('Uploading files...');
    
    try {
      // Simulate processing stages
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingStage('Analyzing documents with AI...');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessingStage('Generating insights...');
      
      if (onFileUpload) {
        await onFileUpload(filesData);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingStage('Analysis complete!');
      
      // Redirect to analytics page after a short delay
      setTimeout(() => {
        navigate('/analytics');
      }, 1500);
      
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
    }
  };

  const isAnalyzeEnabled = () => {
    if (!selectedProcess) return false;
    
    const process = businessProcesses[selectedProcess];
    const requiredInputs = process.inputs.filter(input => input.required);
    
    return requiredInputs.every(input => 
      uploadedFiles.some(file => file.inputId === input.id)
    );
  };
  
  const getTotalFilesCount = () => {
    return uploadedFiles.length;
  };
  
  const getFilesForInput = (inputId) => {
    return uploadedFiles.filter(f => f.inputId === inputId);
  };

  // Loading Screen Component
  if (isProcessing) {
    return (
      <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Loader2 size={64} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          🚀 Processing Your Business Analysis
        </h2>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            fontSize: '18px', 
            color: '#3b82f6', 
            marginBottom: '16px',
            fontWeight: '500'
          }}>
            {processingStage}
          </div>
          <div style={{
            width: '300px',
            height: '8px',
            backgroundColor: '#e5e7eb',
            borderRadius: '4px',
            margin: '0 auto',
            overflow: 'hidden'
          }}>
            <div style={{
              width: processingStage.includes('complete') ? '100%' : 
                     processingStage.includes('insights') ? '75%' : 
                     processingStage.includes('Analyzing') ? '50%' : '25%',
              height: '100%',
              backgroundColor: '#3b82f6',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
        <div style={{ color: '#6b7280', fontSize: '16px', marginBottom: '16px' }}>
          Selected Process: <strong>{businessProcesses[selectedProcess]?.name}</strong>
        </div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>
          Files: {getTotalFilesCount()} uploaded • Using Gemini AI 2.0 Flash
        </div>
        {processingStage.includes('complete') && (
          <div style={{ marginTop: '20px', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={20} />
            <span>Redirecting to analytics...</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
        📋 Business Process Selection
      </h2>

      {/* Process Selection Dropdown */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
          Select Business Process
        </label>
        <div style={{ position: 'relative' }}>
          <select
            value={selectedProcess}
            onChange={(e) => handleProcessChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              appearance: 'none'
            }}
          >
            <option value="">Choose a business process...</option>
            {Object.values(businessProcesses).map(process => (
              <option key={process.id} value={process.id}>
                {process.name}
              </option>
            ))}
          </select>
          <ChevronDown 
            size={20} 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#6b7280',
              pointerEvents: 'none'
            }} 
          />
        </div>
      </div>

      {/* Process Details */}
      {selectedProcess && (
        <div style={{ marginBottom: '24px' }}>
          <div className="ai-insight">
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#7c3aed' }}>
              Process Details
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <strong>Main Process:</strong> {businessProcesses[selectedProcess].mainProcess}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Sub Process:</strong> {businessProcesses[selectedProcess].subProcess}
            </div>
            {getTotalFilesCount() > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#0369a1', marginBottom: '8px' }}>
                  📁 Files Ready for Analysis ({getTotalFilesCount()} total)
                </div>
                {businessProcesses[selectedProcess].inputs.map(input => {
                  const inputFiles = getFilesForInput(input.id);
                  return inputFiles.length > 0 ? (
                    <div key={input.id} style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px' }}>
                      • {input.name}: {inputFiles.length} file{inputFiles.length > 1 ? 's' : ''}
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Upload Section */}
      {selectedProcess && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
              Required Documents
            </h3>
            {getTotalFilesCount() > 0 && (
              <button
                onClick={() => setUploadedFiles([])}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  color: '#dc2626',
                  backgroundColor: 'transparent',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#fee2e2';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Clear All Files
              </button>
            )}
          </div>
          
          {businessProcesses[selectedProcess].inputs.map(input => (
            <div key={input.id} style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500', 
                color: '#374151',
                fontSize: '14px'
              }}>
                {input.name} {input.required && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              
              <div 
                className="upload-area"
                style={{
                  padding: '20px',
                  border: uploadedFiles.some(f => f.inputId === input.id) 
                    ? '2px solid #059669' 
                    : '2px dashed #cbd5e1',
                  backgroundColor: uploadedFiles.some(f => f.inputId === input.id) 
                    ? '#ecfdf5' 
                    : 'white'
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(input.id, e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => {
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = input.type === 'pdf' ? '.pdf' : '.xlsx,.xls';
                  fileInput.multiple = true; // Enable multiple file selection
                  fileInput.onchange = (e) => handleFileUpload(input.id, e.target.files);
                  fileInput.click();
                }}
              >
                <Upload size={24} style={{ color: '#6b7280', margin: '0 auto 8px' }} />
                
                <div>
                  <div style={{ fontWeight: '500', color: '#374151' }}>
                    Upload {input.name}
                  </div>
                  <div className="upload-text">
                    Drop files here or click to browse ({input.type.toUpperCase()} files only)
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Multiple files allowed
                  </div>
                </div>
              </div>
              
              {/* Display uploaded files */}
              {uploadedFiles.filter(f => f.inputId === input.id).length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Uploaded Files ({uploadedFiles.filter(f => f.inputId === input.id).length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {uploadedFiles.filter(f => f.inputId === input.id).map((file) => (
                      <div key={file.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: '#059669' }} />
                          <span style={{ fontSize: '14px', color: '#374151' }}>{file.name}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>({(file.file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#fee2e2'}
                          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analyze Button */}
      {selectedProcess && (
        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={handleAnalyze}
            disabled={!isAnalyzeEnabled() || isProcessing}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: (isAnalyzeEnabled() && !isProcessing) ? '#3b82f6' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: (isAnalyzeEnabled() && !isProcessing) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              transform: (isAnalyzeEnabled() && !isProcessing) ? 'scale(1)' : 'scale(0.95)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                🚀 Start Analysis
              </>
            )}
          </button>
          
          {!isAnalyzeEnabled() && selectedProcess && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              color: '#6b7280',
              fontStyle: 'italic'
            }}>
              Please upload all required documents to proceed
            </div>
          )}
          
          {isAnalyzeEnabled() && getTotalFilesCount() > 0 && (
            <div style={{ 
              marginTop: '8px', 
              fontSize: '14px', 
              color: '#059669',
              fontWeight: '500'
            }}>
              ✓ Ready to analyze {getTotalFilesCount()} file{getTotalFilesCount() > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessSelection;