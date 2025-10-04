import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, TrendingUp, Package, DollarSign } from 'lucide-react';
import FileUpload from './FileUpload';

const Dashboard = ({ analysisData, setAnalysisData, loading, setLoading }) => {
  const [processStatus, setProcessStatus] = useState({
    threeWayMatch: { status: 'pending', accuracy: null },
    procurement: { status: 'pending', excessValue: null },
    costAnalysis: { status: 'pending', obsoleteCount: null },
    aging: { status: 'pending', deadStock: null },
    fifo: { status: 'pending', variance: null },
    profitability: { status: 'pending', totalProfit: null }
  });

  // Load sample data if no data exists
  const loadSampleData = async () => {
    if (analysisData) return; // Don't load if data already exists
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/sample-data');
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded server data:', data);
        setAnalysisData(data);
      } else {
        // Fallback to client-side sample data
        const fallbackData = generateSampleData();
        console.log('Using fallback data:', fallbackData);
        setAnalysisData(fallbackData);
      }
    } catch (error) {
      console.error('Error loading sample data:', error);
      // Use client-side sample data as fallback
      const fallbackData = generateSampleData();
      console.log('Error fallback data:', fallbackData);
      setAnalysisData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Generate sample data for demo purposes
  const generateSampleData = () => {
    return {
      business_data: {
        financial_summary: {
          total_revenue: 1699884,
          total_profit: 254982,
          overall_margin: 15.2,
          inventory_value: 456789
        }
      },
      process_results: {
        three_way_match: {
          match_accuracy_pct: 92.5
        },
        procurement_analysis: {
          total_excess_value: 45000
        },
        cost_analysis: {
          obsolete_products: Array(3).fill(null).map((_, i) => ({ id: i }))
        },
        aging_analysis: {
          dead_stock_value: 0
        },
        fifo_analysis: {
          valuation_variance: 12500
        }
      }
    };
  };

  useEffect(() => {
    loadSampleData();
  }, []);

  useEffect(() => {
    if (analysisData) {
      setProcessStatus({
        threeWayMatch: {
          status: 'complete',
          accuracy: analysisData.process_results?.three_way_match?.match_accuracy_pct || 0
        },
        procurement: {
          status: 'complete',
          excessValue: analysisData.process_results?.procurement_analysis?.total_excess_value || 0
        },
        costAnalysis: {
          status: 'complete',
          obsoleteCount: analysisData.process_results?.cost_analysis?.obsolete_products?.length || 0
        },
        aging: {
          status: 'complete',
          deadStock: analysisData.process_results?.aging_analysis?.dead_stock_value || 0
        },
        fifo: {
          status: 'complete',
          variance: analysisData.process_results?.fifo_analysis?.valuation_variance || 0
        },
        profitability: {
          status: 'complete',
          totalProfit: analysisData.business_data?.financial_summary?.total_profit || 0
        }
      });
    }
  }, [analysisData]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete': return <CheckCircle size={20} style={{ color: '#059669' }} />;
      case 'warning': return <AlertTriangle size={20} style={{ color: '#d97706' }} />;
      case 'error': return <XCircle size={20} style={{ color: '#dc2626' }} />;
      default: return <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>;
    }
  };

    const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₹0';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d.-]/g, '')) : value;
    if (isNaN(numValue)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  return (
    <div className="container">
      <div className="dashboard-card">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
          🚀 Zenalyst AI Business Intelligence
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '24px' }}>
          Real-time analytics with Gemini AI integration - Upload your documents to get started
        </p>

        {!analysisData && (
          <div style={{ marginBottom: '32px' }}>
            <FileUpload setAnalysisData={setAnalysisData} setLoading={setLoading} />
          </div>
        )}

        {loading && (
          <div className="dashboard-card" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="loading-spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px' }}></div>
            <h3 style={{ color: '#3b82f6', marginBottom: '8px' }}>Processing Your Documents...</h3>
            <p style={{ color: '#64748b' }}>
              Running ETL pipeline and generating AI-powered business insights
            </p>
          </div>
        )}

        {analysisData && (
          <>
            {/* Financial Overview */}
            <div className="dashboard-card">
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                💰 Financial Performance Overview
              </h2>
              <div className="grid grid-4">
                <div className="metric-card success-metric">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={24} style={{ color: '#059669' }} />
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                        {formatCurrency(analysisData.business_data?.financial_summary?.total_revenue || 0)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#065f46' }}>Total Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DollarSign size={24} style={{ color: '#3b82f6' }} />
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                        {formatCurrency(analysisData.business_data?.financial_summary?.total_profit || 0)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#1e3a8a' }}>Total Profit</div>
                    </div>
                  </div>
                </div>

                <div className={`metric-card ${analysisData.business_data?.financial_summary?.overall_margin < 0 ? 'danger-metric' : 'success-metric'}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={24} style={{ color: analysisData.business_data?.financial_summary?.overall_margin < 0 ? '#dc2626' : '#059669' }} />
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: analysisData.business_data?.financial_summary?.overall_margin < 0 ? '#dc2626' : '#059669' }}>
                        {(analysisData.business_data?.financial_summary?.overall_margin || 0).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: '14px', color: analysisData.business_data?.financial_summary?.overall_margin < 0 ? '#991b1b' : '#065f46' }}>Overall Margin</div>
                    </div>
                  </div>
                </div>

                <div className="metric-card warning-metric">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={24} style={{ color: '#d97706' }} />
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>
                        {formatCurrency(analysisData.business_data?.financial_summary?.inventory_value || 0)}
                      </div>
                      <div style={{ fontSize: '14px', color: '#92400e' }}>Inventory Value</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Process Status */}
            <div className="dashboard-card">
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                📊 Business Process Analysis Status
              </h2>
              <div className="grid grid-2">
                <div className="process-status process-complete">
                  {getStatusIcon(processStatus.threeWayMatch.status)}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>3-Way Match Verification</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>
                      {processStatus.threeWayMatch.accuracy !== null 
                        ? `${processStatus.threeWayMatch.accuracy.toFixed(1)}% Match Accuracy`
                        : 'Verifying PO, GRN, and Invoice quantities'
                      }
                    </div>
                  </div>
                </div>

                <div className={`process-status ${processStatus.procurement.excessValue > 100000 ? 'process-warning' : 'process-complete'}`}>
                  {getStatusIcon(processStatus.procurement.status)}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Excess/Short Procurement Analysis</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>
                      {processStatus.procurement.excessValue !== null 
                        ? `${formatCurrency(processStatus.procurement.excessValue)} Excess Inventory`
                        : 'Analyzing procurement vs actual needs'
                      }
                    </div>
                  </div>
                </div>

                <div className={`process-status ${processStatus.costAnalysis.obsoleteCount > 5 ? 'process-warning' : 'process-complete'}`}>
                  {getStatusIcon(processStatus.costAnalysis.status)}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Inventory Cost Analysis</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>
                      {processStatus.costAnalysis.obsoleteCount !== null 
                        ? `${processStatus.costAnalysis.obsoleteCount} Obsolete Products Identified`
                        : 'Analyzing carrying costs vs gross margins'
                      }
                    </div>
                  </div>
                </div>

                <div className={`process-status ${processStatus.aging.deadStock > 0 ? 'process-warning' : 'process-complete'}`}>
                  {getStatusIcon(processStatus.aging.status)}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Inventory Aging Analysis</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>
                      {processStatus.aging.deadStock !== null 
                        ? `${formatCurrency(processStatus.aging.deadStock)} Dead Stock Value`
                        : 'Identifying items beyond shelf life'
                      }
                    </div>
                  </div>
                </div>

                <div className="process-status process-complete">
                  {getStatusIcon(processStatus.fifo.status)}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>FIFO Valuation Analysis</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>
                      {processStatus.fifo.variance !== null 
                        ? `${formatCurrency(Math.abs(processStatus.fifo.variance))} Valuation Variance`
                        : 'Calculating FIFO vs selling price differences'
                      }
                    </div>
                  </div>
                </div>

                <div className="process-status process-complete">
                  {getStatusIcon(processStatus.profitability.status)}
                  <div>
                    <div style={{ fontWeight: 'bold' }}>Comprehensive Profitability Analysis</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>
                      {processStatus.profitability.totalProfit !== null 
                        ? `${formatCurrency(processStatus.profitability.totalProfit)} Total Analyzed Profit`
                        : 'Analyzing vendor, category, and product profitability'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                🚀 Quick Actions
              </h2>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => window.location.href = '/analytics'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📈 View Detailed Analytics
                </button>
                <button
                  onClick={() => window.location.href = '/insights'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🤖 AI Business Insights
                </button>
                <button
                  onClick={() => window.location.href = '/upload'}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📁 Upload New Files
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;