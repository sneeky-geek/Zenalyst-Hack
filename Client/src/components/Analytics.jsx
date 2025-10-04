import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Package, AlertTriangle, CheckCircle } from 'lucide-react';

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