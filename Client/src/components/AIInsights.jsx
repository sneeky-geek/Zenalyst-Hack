import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Lightbulb, Target } from 'lucide-react';

const AIInsights = ({ analysisData }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (analysisData?.ai_insights) {
      setInsights(analysisData.ai_insights);
    }
  }, [analysisData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (!analysisData) {
    return (
      <div className="container">
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '60px' }}>
          <Brain size={64} style={{ color: '#94a3b8', marginBottom: '16px' }} />
          <h2 style={{ color: '#64748b', marginBottom: '8px' }}>No Analysis Data Available</h2>
          <p style={{ color: '#94a3b8' }}>
            Please upload your business documents first to get AI-powered insights
          </p>
          <button
            onClick={() => window.location.href = '/upload'}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              backgroundColor: '#7c3aed',
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

  const businessData = analysisData.business_data || {};
  const aiAnalysis = insights?.analysis || '';

  // Parse AI analysis sections
  const parseAnalysisSections = (text) => {
    const sections = {};
    const lines = text.split('\n');
    let currentSection = '';
    let currentContent = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('EXECUTIVE SUMMARY') || trimmed.includes('**EXECUTIVE SUMMARY**')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'executive';
        currentContent = [];
      } else if (trimmed.includes('IMMEDIATE ACTIONS') || trimmed.includes('**IMMEDIATE ACTIONS**')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'actions';
        currentContent = [];
      } else if (trimmed.includes('FINANCIAL OPTIMIZATION') || trimmed.includes('**FINANCIAL OPTIMIZATION**')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'financial';
        currentContent = [];
      } else if (trimmed.includes('OPERATIONAL IMPROVEMENTS') || trimmed.includes('**OPERATIONAL IMPROVEMENTS**')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'operational';
        currentContent = [];
      } else if (trimmed.includes('STRATEGIC RECOMMENDATIONS') || trimmed.includes('**STRATEGIC RECOMMENDATIONS**')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'strategic';
        currentContent = [];
      } else if (trimmed.includes('RISK MITIGATION') || trimmed.includes('**RISK MITIGATION**')) {
        if (currentSection) sections[currentSection] = currentContent.join('\n');
        currentSection = 'risks';
        currentContent = [];
      } else if (trimmed && currentSection) {
        currentContent.push(line);
      }
    });

    if (currentSection) sections[currentSection] = currentContent.join('\n');
    return sections;
  };

  const sections = parseAnalysisSections(aiAnalysis);

  const formatAnalysisText = (text) => {
    return text
      .split('\n')
      .filter(line => line.trim())
      .map((line, index) => {
        const trimmed = line.trim();
        
        // Handle numbered lists
        if (trimmed.match(/^\d+\./)) {
          return (
            <div key={index} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                {trimmed}
              </div>
            </div>
          );
        }
        
        // Handle bullet points
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return (
            <div key={index} style={{ marginLeft: '16px', marginBottom: '8px', color: '#4b5563' }}>
              {trimmed}
            </div>
          );
        }
        
        // Handle bold text
        if (trimmed.includes('**') && trimmed.includes(':**')) {
          const parts = trimmed.split('**');
          if (parts.length >= 3) {
            return (
              <div key={index} style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{parts[1]}:</span>
                <span style={{ color: '#4b5563' }}>{parts[2]}</span>
              </div>
            );
          }
        }
        
        return (
          <div key={index} style={{ marginBottom: '8px', color: '#4b5563', lineHeight: '1.5' }}>
            {trimmed}
          </div>
        );
      });
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="dashboard-card">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', color: '#7c3aed' }}>
          🤖 AI-Powered Business Insights
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '16px' }}>
          Gemini AI analysis of your business data with actionable recommendations
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
          <Brain size={20} style={{ color: '#7c3aed' }} />
          <div>
            <div style={{ fontWeight: 'bold', color: '#7c3aed' }}>Analysis Provider: {insights?.provider || 'Gemini AI'}</div>
            <div style={{ fontSize: '14px', color: '#8b5cf6' }}>Generated: {insights?.timestamp || new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="dashboard-card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          📊 Key Business Metrics
        </h2>
        <div className="grid grid-4">
          <div className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TrendingUp size={20} style={{ color: '#3b82f6' }} />
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>Revenue</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {formatCurrency(businessData.financial_summary?.total_revenue || 0)}
            </div>
          </div>
          
          <div className={`metric-card ${businessData.financial_summary?.total_profit > 0 ? 'success-metric' : 'danger-metric'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Target size={20} style={{ color: businessData.financial_summary?.total_profit > 0 ? '#059669' : '#dc2626' }} />
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>Profit</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: businessData.financial_summary?.total_profit > 0 ? '#059669' : '#dc2626' }}>
              {formatCurrency(businessData.financial_summary?.total_profit || 0)}
            </div>
          </div>

          <div className="metric-card warning-metric">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={20} style={{ color: '#d97706' }} />
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>Excess Inventory</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#d97706' }}>
              {formatCurrency(businessData.operational_metrics?.excess_inventory_value || 0)}
            </div>
          </div>

          <div className={`metric-card ${businessData.operational_metrics?.negative_margin_products === 0 ? 'success-metric' : 'danger-metric'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertTriangle size={20} style={{ color: businessData.operational_metrics?.negative_margin_products === 0 ? '#059669' : '#dc2626' }} />
              <span style={{ fontWeight: 'bold', color: '#1f2937' }}>Loss Products</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: businessData.operational_metrics?.negative_margin_products === 0 ? '#059669' : '#dc2626' }}>
              {businessData.operational_metrics?.negative_margin_products || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {sections.executive && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle style={{ color: '#3b82f6' }} />
            Executive Summary
          </h2>
          <div className="ai-insight">
            {formatAnalysisText(sections.executive)}
          </div>
        </div>
      )}

      {/* Immediate Actions */}
      {sections.actions && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle style={{ color: '#dc2626' }} />
            Immediate Actions Required
          </h2>
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '20px' }}>
            {formatAnalysisText(sections.actions)}
          </div>
        </div>
      )}

      <div className="grid grid-2">
        {/* Financial Optimization */}
        {sections.financial && (
          <div className="dashboard-card">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp style={{ color: '#059669' }} />
              Financial Optimization
            </h2>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
              {formatAnalysisText(sections.financial)}
            </div>
          </div>
        )}

        {/* Operational Improvements */}
        {sections.operational && (
          <div className="dashboard-card">
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lightbulb style={{ color: '#3b82f6' }} />
              Operational Improvements
            </h2>
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px' }}>
              {formatAnalysisText(sections.operational)}
            </div>
          </div>
        )}
      </div>

      {/* Strategic Recommendations */}
      {sections.strategic && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target style={{ color: '#7c3aed' }} />
            Strategic Recommendations
          </h2>
          <div className="ai-insight">
            {formatAnalysisText(sections.strategic)}
          </div>
        </div>
      )}

      {/* Risk Mitigation */}
      {sections.risks && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#d97706', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle style={{ color: '#d97706' }} />
            Risk Mitigation
          </h2>
          <div style={{ backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '20px' }}>
            {formatAnalysisText(sections.risks)}
          </div>
        </div>
      )}

      {/* Full AI Analysis (Fallback) */}
      {!sections.executive && aiAnalysis && (
        <div className="dashboard-card">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain style={{ color: '#7c3aed' }} />
            Complete AI Analysis
          </h2>
          <div className="ai-insight">
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, lineHeight: '1.6' }}>
              {aiAnalysis}
            </pre>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="dashboard-card">
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          🎯 Recommended Next Steps
        </h2>
        <div className="grid grid-3">
          <button
            onClick={() => window.location.href = '/analytics'}
            style={{
              padding: '16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            📊 Review Detailed Analytics
            <div style={{ fontSize: '14px', opacity: '0.9', marginTop: '4px' }}>
              Dive deeper into specific metrics
            </div>
          </button>
          
          <button
            onClick={() => window.print()}
            style={{
              padding: '16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            📋 Export Report
            <div style={{ fontSize: '14px', opacity: '0.9', marginTop: '4px' }}>
              Save insights for stakeholders
            </div>
          </button>
          
          <button
            onClick={() => window.location.href = '/upload'}
            style={{
              padding: '16px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              textAlign: 'left'
            }}
          >
            🔄 Upload New Data
            <div style={{ fontSize: '14px', opacity: '0.9', marginTop: '4px' }}>
              Refresh analysis with new files
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;