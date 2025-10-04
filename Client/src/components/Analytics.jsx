import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, AlertTriangle, CheckCircle, FileText, DollarSign, Clock } from 'lucide-react';

// Process-specific analytics component
const ProcessSpecificAnalytics = ({ analysisData }) => {
  const { processType, processName, process_results, ai_insights } = analysisData;
  
  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const renderThreeWayMatch = () => {
    const data = process_results.three_way_match;
    if (!data) return null;

    const accuracyData = [
      { name: 'Matched', value: data.matched, color: '#059669' },
      { name: 'Discrepancies', value: data.discrepancies, color: '#dc2626' }
    ];

    return (
      <div className="container">
        <div className="dashboard-card">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            📊 {processName} Results
          </h1>
          
          {/* Key Metrics */}
          <div className="grid grid-3" style={{ marginBottom: '24px' }}>
            <div className="metric-card success-metric">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={24} style={{ color: '#059669' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                    {data.match_accuracy_pct?.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '14px', color: '#065f46' }}>Match Accuracy</div>
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                    {data.total_documents}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e3a8a' }}>Total Documents</div>
                </div>
              </div>
            </div>

            <div className="metric-card danger-metric">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                    {data.discrepancies}
                  </div>
                  <div style={{ fontSize: '14px', color: '#991b1b' }}>Discrepancies</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="dashboard-card">
            <h3 style={{ marginBottom: '16px' }}>Document Match Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={accuracyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {accuracyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Issues List */}
          {data.issues && data.issues.length > 0 && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: '16px' }}>Issues Requiring Attention</h3>
              {data.issues.map((issue, index) => (
                <div key={index} className={`process-status ${issue.severity === 'high' ? 'process-error' : issue.severity === 'medium' ? 'process-warning' : 'process-complete'}`}>
                  <AlertTriangle size={20} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{issue.po_number}</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>{issue.issue}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExcessProcurement = () => {
    const data = process_results.procurement_analysis;
    if (!data) return null;

    return (
      <div className="container">
        <div className="dashboard-card">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            📦 {processName} Results
          </h1>
          
          {/* Key Metrics */}
          <div className="grid grid-4" style={{ marginBottom: '24px' }}>
            <div className="metric-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={24} style={{ color: '#3b82f6' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                    {data.total_orders}
                  </div>
                  <div style={{ fontSize: '14px', color: '#1e3a8a' }}>Total Orders</div>
                </div>
              </div>
            </div>

            <div className="metric-card warning-metric">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={24} style={{ color: '#d97706' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706' }}>
                    {formatCurrency(data.total_excess_value)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#92400e' }}>Excess Value</div>
                </div>
              </div>
            </div>

            <div className="metric-card success-metric">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={24} style={{ color: '#059669' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                    {formatCurrency(data.optimization_savings)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#065f46' }}>Potential Savings</div>
                </div>
              </div>
            </div>

            <div className="metric-card danger-metric">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={24} style={{ color: '#dc2626' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                    {data.excess_orders}
                  </div>
                  <div style={{ fontSize: '14px', color: '#991b1b' }}>Excess Orders</div>
                </div>
              </div>
            </div>
          </div>

          {/* Excess Items Chart */}
          {data.excess_items && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: '16px' }}>Top Excess Items</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.excess_items}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="item" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="excess_value" fill="#d97706" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProfitability = () => {
    const data = process_results.profitability_analysis;
    if (!data) return null;

    return (
      <div className="container">
        <div className="dashboard-card">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            💰 {processName} Results
          </h1>

          {/* Top Vendors */}
          {data.top_vendors && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: '16px' }}>Top Performing Vendors</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.top_vendors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendor" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="margin" fill="#059669" name="Margin %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Categories */}
          {data.top_categories && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: '16px' }}>Category Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.top_categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => name === 'profit' ? formatCurrency(value) : `${value}%`} />
                  <Bar dataKey="margin" fill="#3b82f6" name="Margin %" />
                  <Bar dataKey="profit" fill="#059669" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Negative Margin Items */}
          {data.negative_margin_skus && data.negative_margin_skus.length > 0 && (
            <div className="dashboard-card">
              <h3 style={{ marginBottom: '16px', color: '#dc2626' }}>⚠️ Negative Margin SKUs</h3>
              {data.negative_margin_skus.map((item, index) => (
                <div key={index} className="process-status process-error">
                  <AlertTriangle size={20} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.sku} - {item.product}</div>
                    <div style={{ fontSize: '14px', opacity: '0.8' }}>Margin: {item.margin}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render based on process type
  switch (processType) {
    case 'three-way-match':
      return renderThreeWayMatch();
    case 'excess-procurement':
      return renderExcessProcurement();
    case 'profitability':
      return renderProfitability();
    default:
      return (
        <div className="container">
          <div className="dashboard-card">
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
              📊 {processName || 'Business Analysis'} Results
            </h1>
            <div className="ai-insight">
              <p>Process analysis completed successfully.</p>
              {ai_insights && (
                <div style={{ marginTop: '16px' }}>
                  <h3>AI Insights</h3>
                  <p>{ai_insights.summary || 'Analysis results available.'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
  }
};

const Analytics = ({ analysisData }) => {
  if (!analysisData) {
    return (
      <div className="container">
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Package size={64} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <h2 style={{ color: '#64748b', marginBottom: '8px' }}>No Analysis Data Available</h2>
          <p style={{ color: '#94a3b8' }}>
            Please upload your business documents first to view analytics
          </p>
          <button
            onClick={() => window.location.href = '/upload'}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Upload Files
          </button>
        </div>
      </div>
    );
  }

  // Check if this is process-specific data
  const processType = analysisData.processType;
  const processName = analysisData.processName;
  
  if (processType) {
    return <ProcessSpecificAnalytics analysisData={analysisData} />;
  }

  const processResults = analysisData.process_results || {};
  const businessData = analysisData.business_data || {};

  // Prepare chart data
  const vendorPerformanceData = businessData.top_vendors?.map(vendor => ({
    name: vendor.vendor?.substring(0, 20) + (vendor.vendor?.length > 20 ? '...' : ''),
    margin: parseFloat(vendor.avg_margin_pct || 0),
    revenue: parseFloat(vendor.total_sales_value || 0)
  })) || [];

  const categoryData = businessData.category_performance?.map(category => ({
    name: category.category,
    profit: parseFloat(category.total_profit || 0),
    margin: parseFloat(category.avg_margin_pct || 0)
  })) || [];

  const topProductsData = businessData.top_products?.slice(0, 10).map(product => ({
    name: product.product?.substring(0, 25) + (product.product?.length > 25 ? '...' : ''),
    margin: parseFloat(product.margin_pct || 0),
    sales: parseFloat(product.sales_value || 0)
  })) || [];

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="dashboard-card">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#1e40af' }}>
          📊 Detailed Analytics Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px' }}>
          Comprehensive business intelligence analysis across all 6 processes
        </p>
      </div>

      {/* Process Summary Cards */}
      <div className="grid grid-3">
        <div className="dashboard-card success-metric">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <CheckCircle size={24} style={{ color: '#059669' }} />
            <h3 style={{ color: '#059669', fontWeight: 'bold' }}>3-Way Match</h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>
            {(processResults.three_way_match?.match_accuracy_pct || 0).toFixed(1)}%
          </div>
          <p style={{ color: '#065f46', fontSize: '14px' }}>Match Accuracy</p>
        </div>

        <div className="dashboard-card warning-metric">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <AlertTriangle size={24} style={{ color: '#d97706' }} />
            <h3 style={{ color: '#d97706', fontWeight: 'bold' }}>Excess Inventory</h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>
            {formatCurrency(processResults.procurement_analysis?.total_excess_value || 0)}
          </div>
          <p style={{ color: '#92400e', fontSize: '14px' }}>Total Excess Value</p>
        </div>

        <div className="dashboard-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Package size={24} style={{ color: '#3b82f6' }} />
            <h3 style={{ color: '#3b82f6', fontWeight: 'bold' }}>Obsolete Products</h3>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
            {processResults.cost_analysis?.obsolete_products?.length || 0}
          </div>
          <p style={{ color: '#1e3a8a', fontSize: '14px' }}>Products Identified</p>
        </div>
      </div>

      {/* Vendor Performance Chart */}
      {vendorPerformanceData.length > 0 && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            🏪 Vendor Performance Analysis
          </h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vendorPerformanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'margin' ? `${value.toFixed(1)}%` : formatCurrency(value),
                  name === 'margin' ? 'Margin' : 'Revenue'
                ]} />
                <Bar dataKey="margin" fill="#3b82f6" name="Margin %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Performance */}
      {categoryData.length > 0 && (
        <div className="grid grid-2">
          <div className="dashboard-card">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
              📚 Category Profitability
            </h2>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="profit"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
              📈 Category Margins
            </h2>
            <div style={{ height: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                  <Bar dataKey="margin" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Top Products Performance */}
      {topProductsData.length > 0 && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            🏆 Top Performing Products
          </h2>
          <div style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'margin' ? `${value.toFixed(1)}%` : formatCurrency(value),
                  name === 'margin' ? 'Margin' : 'Sales'
                ]} />
                <Bar dataKey="margin" fill="#8b5cf6" name="Margin %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Process Results */}
      <div className="dashboard-card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          📋 Detailed Process Analysis
        </h2>
        
        <div className="grid grid-2">
          {/* Excess Items */}
          {processResults.procurement_analysis?.excess_items?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#d97706' }}>
                ⚠️ Excess Inventory Items
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {processResults.procurement_analysis.excess_items.slice(0, 5).map((item, index) => (
                  <div key={index} style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#fef3c7', 
                    marginBottom: '4px', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{item.product}</div>
                    <div style={{ color: '#92400e' }}>
                      Excess: {item.excess_quantity} units • Value: {formatCurrency(item.excess_value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Negative Margin Products */}
          {businessData.problem_areas?.negative_margin_products?.length > 0 && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#dc2626' }}>
                🔻 Negative Margin Products
              </h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {businessData.problem_areas.negative_margin_products.slice(0, 5).map((item, index) => (
                  <div key={index} style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#fee2e2', 
                    marginBottom: '4px', 
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{item.product}</div>
                    <div style={{ color: '#991b1b' }}>
                      Margin: {item.margin_pct?.toFixed(1)}% • Loss: {formatCurrency(Math.abs(item.gross_profit || 0))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="dashboard-card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          💾 Export & Actions
        </h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🖨️ Print Report
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
            🤖 View AI Insights
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify(analysisData, null, 2);
              const dataBlob = new Blob([dataStr], {type: 'application/json'});
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'zenalyst_analysis.json';
              link.click();
            }}
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
            📥 Download Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;