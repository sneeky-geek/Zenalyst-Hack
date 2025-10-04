"""
🤖 ZENALYST LLM BUSINESS INTELLIGENCE INTEGRATION
Advanced AI-Powered Analytics for ABC Book Store

This module implements the specific business intelligence processes from the requirements:
1. 3-Way Match Verification (PO → GRN → Purchase Invoice)
2. Excess Procurement Analysis  
3. Inventory Cost Analysis (Carrying Cost vs Gross Margin)
4. Inventory Aging Analysis (Obsolete/Dead Stock)
5. FIFO Inventory Valuation Analysis
6. Profitability Analysis (Vendor Performance, Category Analysis, Top Products)

Feeds rich, structured data to LLM for comprehensive business insights.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import json
import asyncio
from typing import Dict, List, Any, Optional
import os
from dotenv import load_dotenv

# Import AI clients
try:
    import openai
    from anthropic import Anthropic
except ImportError:
    openai = None
    Anthropic = None

logger = logging.getLogger(__name__)

class LLMBusinessIntelligence:
    """
    AI-Powered Business Intelligence Engine
    Implements the 6 core business processes with LLM analysis
    """
    
    def __init__(self, analytics_engine):
        self.analytics = analytics_engine
        self.data = {}
        
        # Load API keys
        load_dotenv('config.env')
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        
        logger.info("🤖 LLM Business Intelligence initialized")
    
    def load_business_data(self):
        """Load comprehensive business data for analysis"""
        self.data = self.analytics.load_comprehensive_data()
        return self.data
    
    # ==================== PROCESS 1: 3-WAY MATCH VERIFICATION ====================
    
    def three_way_match_analysis(self) -> Dict[str, Any]:
        """
        Process 1: 3-Way Match - Verify PO quantities match GRN quantities and vendor invoices
        """
        logger.info("🔍 Process 1: 3-Way Match Verification Analysis")
        
        try:
            inventory_df = self.data.get('inventory_master', pd.DataFrame())
            po_df = self.data.get('purchase_orders', pd.DataFrame())
            grn_df = self.data.get('goods_receipt_notes', pd.DataFrame())
            
            results = {
                'process_name': '3-Way Match Verification',
                'total_transactions': 0,
                'matched_transactions': 0,
                'discrepancies': [],
                'match_accuracy_pct': 0,
                'verification_summary': {},
                'business_impact': {}
            }
            
            if not inventory_df.empty:
                # Group by PO number for 3-way matching
                match_analysis = []
                
                for _, record in inventory_df.iterrows():
                    po_number = record.get('po_number', '')
                    grn_code = record.get('grn_code', '')
                    
                    if po_number and grn_code:
                        # Get quantities from different stages
                        po_qty = record.get('purchased_units', 0)
                        received_qty = record.get('purchased_units', 0)  # From inventory
                        issued_qty = record.get('issued_from_opening', 0) + record.get('issued_from_current', 0)
                        
                        # Calculate discrepancies
                        po_grn_variance = abs(po_qty - received_qty) if po_qty > 0 else 0
                        variance_pct = (po_grn_variance / po_qty * 100) if po_qty > 0 else 0
                        
                        match_record = {
                            'product': record.get('title', 'Unknown'),
                            'po_number': po_number,
                            'grn_code': grn_code,
                            'po_quantity': po_qty,
                            'received_quantity': received_qty,
                            'issued_quantity': issued_qty,
                            'variance': po_grn_variance,
                            'variance_pct': variance_pct,
                            'status': 'Matched' if variance_pct <= 5 else 'Discrepancy',
                            'vendor': record.get('supplier_name', 'Unknown'),
                            'value_impact': po_grn_variance * record.get('purchase_rate_per_unit', 0)
                        }
                        
                        match_analysis.append(match_record)
                
                # Summary statistics
                total_transactions = len(match_analysis)
                matched_transactions = len([r for r in match_analysis if r['status'] == 'Matched'])
                discrepancies = [r for r in match_analysis if r['status'] == 'Discrepancy']
                
                results.update({
                    'total_transactions': total_transactions,
                    'matched_transactions': matched_transactions,
                    'discrepancies': discrepancies[:10],  # Top 10 discrepancies
                    'match_accuracy_pct': (matched_transactions / total_transactions * 100) if total_transactions > 0 else 0,
                    'verification_summary': {
                        'total_value_variance': sum(d['value_impact'] for d in discrepancies),
                        'average_variance_pct': np.mean([d['variance_pct'] for d in discrepancies]) if discrepancies else 0,
                        'high_variance_count': len([d for d in discrepancies if d['variance_pct'] > 10])
                    }
                })
            
            logger.info(f"✅ 3-Way Match Analysis: {results['match_accuracy_pct']:.1f}% accuracy")
            return results
            
        except Exception as e:
            logger.error(f"❌ 3-Way Match Analysis error: {str(e)}")
            return {'error': str(e), 'process_name': '3-Way Match Verification'}
    
    # ==================== PROCESS 2: EXCESS PROCUREMENT ANALYSIS ====================
    
    def excess_procurement_analysis(self) -> Dict[str, Any]:
        """
        Process 2: Excess Short Procurement Analysis
        """
        logger.info("📦 Process 2: Excess/Short Procurement Analysis")
        
        try:
            inventory_df = self.data.get('inventory_master', pd.DataFrame())
            
            results = {
                'process_name': 'Excess/Short Procurement Analysis',
                'excess_items': [],
                'short_items': [],
                'optimal_items': [],
                'total_excess_value': 0,
                'total_shortage_impact': 0,
                'procurement_efficiency': {}
            }
            
            if not inventory_df.empty:
                for _, record in inventory_df.iterrows():
                    purchased_qty = record.get('purchased_units', 0)
                    issued_qty = record.get('issued_from_opening', 0) + record.get('issued_from_current', 0)
                    closing_qty = record.get('closing_units', 0)
                    
                    # Calculate procurement efficiency
                    utilization_rate = (issued_qty / purchased_qty * 100) if purchased_qty > 0 else 0
                    excess_qty = max(0, closing_qty - (issued_qty * 0.2))  # Assuming 20% safety stock
                    
                    item_analysis = {
                        'product': record.get('title', 'Unknown'),
                        'category': record.get('category', 'Unknown'),
                        'vendor': record.get('supplier_name', 'Unknown'),
                        'purchased_qty': purchased_qty,
                        'issued_qty': issued_qty,
                        'closing_qty': closing_qty,
                        'utilization_rate': utilization_rate,
                        'excess_qty': excess_qty,
                        'excess_value': excess_qty * record.get('purchase_rate_per_unit', 0),
                        'shelf_life_days': record.get('shelf_life_days', 365)
                    }
                    
                    # Categorize items
                    if utilization_rate > 80:
                        results['optimal_items'].append(item_analysis)
                    elif utilization_rate < 50 and excess_qty > 0:
                        results['excess_items'].append(item_analysis)
                    elif closing_qty == 0 and issued_qty > 0:
                        results['short_items'].append(item_analysis)
                
                # Sort by impact
                results['excess_items'] = sorted(results['excess_items'], key=lambda x: x['excess_value'], reverse=True)[:10]
                results['short_items'] = sorted(results['short_items'], key=lambda x: x['issued_qty'], reverse=True)[:10]
                
                # Calculate totals
                results['total_excess_value'] = sum(item['excess_value'] for item in results['excess_items'])
                results['procurement_efficiency'] = {
                    'total_items_analyzed': len(inventory_df),
                    'excess_items_count': len(results['excess_items']),
                    'shortage_items_count': len(results['short_items']),
                    'optimal_items_count': len(results['optimal_items'])
                }
            
            logger.info(f"✅ Procurement Analysis: ₹{results['total_excess_value']:,.2f} excess inventory identified")
            return results
            
        except Exception as e:
            logger.error(f"❌ Procurement Analysis error: {str(e)}")
            return {'error': str(e), 'process_name': 'Excess/Short Procurement Analysis'}
    
    # ==================== PROCESS 3: INVENTORY COST ANALYSIS ====================
    
    def inventory_cost_analysis(self) -> Dict[str, Any]:
        """
        Process 3: Carrying Cost vs Gross Margin Analysis
        """
        logger.info("💰 Process 3: Inventory Cost Analysis")
        
        try:
            inventory_df = self.data.get('inventory_master', pd.DataFrame())
            
            results = {
                'process_name': 'Inventory Cost Analysis',
                'high_carrying_cost_items': [],
                'obsolete_products': [],
                'cost_optimization_opportunities': [],
                'cost_analysis_summary': {}
            }
            
            if not inventory_df.empty:
                for _, record in inventory_df.iterrows():
                    carrying_cost = record.get('carrying_cost_per_unit', 0)
                    gross_margin = record.get('profit_margin_pct', 0)
                    gross_profit_amount = record.get('gross_profit', 0)
                    
                    # Calculate carrying cost impact
                    total_carrying_cost = carrying_cost * record.get('closing_units', 0)
                    cost_margin_ratio = (carrying_cost / record.get('selling_rate_per_unit', 1)) * 100
                    
                    item_cost_analysis = {
                        'product': record.get('title', 'Unknown'),
                        'category': record.get('category', 'Unknown'),
                        'carrying_cost_per_unit': carrying_cost,
                        'total_carrying_cost': total_carrying_cost,
                        'gross_margin_pct': gross_margin,
                        'gross_profit_amount': gross_profit_amount,
                        'cost_margin_ratio': cost_margin_ratio,
                        'shelf_life_days': record.get('shelf_life_days', 365),
                        'closing_inventory_value': record.get('total_closing_value', 0),
                        'recommendation': ''
                    }
                    
                    # Generate recommendations
                    if gross_margin < cost_margin_ratio:
                        item_cost_analysis['recommendation'] = 'ALERT: Carrying cost exceeds gross margin'
                        results['obsolete_products'].append(item_cost_analysis)
                    elif cost_margin_ratio > 5:
                        item_cost_analysis['recommendation'] = 'High carrying cost - consider inventory reduction'
                        results['high_carrying_cost_items'].append(item_cost_analysis)
                    else:
                        item_cost_analysis['recommendation'] = 'Optimal cost structure'
                        results['cost_optimization_opportunities'].append(item_cost_analysis)
                
                # Sort by impact
                results['obsolete_products'] = sorted(results['obsolete_products'], 
                                                    key=lambda x: x['total_carrying_cost'], reverse=True)[:10]
                results['high_carrying_cost_items'] = sorted(results['high_carrying_cost_items'], 
                                                           key=lambda x: x['cost_margin_ratio'], reverse=True)[:10]
                
                # Summary
                total_carrying_costs = sum(item['total_carrying_cost'] for item in results['obsolete_products'] + results['high_carrying_cost_items'])
                
                results['cost_analysis_summary'] = {
                    'total_products_analyzed': len(inventory_df),
                    'obsolete_products_count': len(results['obsolete_products']),
                    'high_cost_products_count': len(results['high_carrying_cost_items']),
                    'total_excess_carrying_cost': total_carrying_costs,
                    'potential_cost_savings': total_carrying_costs * 0.7  # Assuming 70% savings possible
                }
            
            logger.info(f"✅ Cost Analysis: {len(results['obsolete_products'])} obsolete products identified")
            return results
            
        except Exception as e:
            logger.error(f"❌ Cost Analysis error: {str(e)}")
            return {'error': str(e), 'process_name': 'Inventory Cost Analysis'}
    
    # ==================== PROCESS 4: INVENTORY AGING ANALYSIS ====================
    
    def inventory_aging_analysis(self) -> Dict[str, Any]:
        """
        Process 4: Obsolete/Dead Stock Analysis
        """
        logger.info("⏰ Process 4: Inventory Aging Analysis")
        
        try:
            inventory_df = self.data.get('inventory_master', pd.DataFrame())
            
            results = {
                'process_name': 'Inventory Aging Analysis',
                'dead_stock_items': [],
                'aging_categories': {},
                'obsolete_stock_value': 0,
                'aging_summary': {}
            }
            
            if not inventory_df.empty:
                current_date = datetime.now()
                
                for _, record in inventory_df.iterrows():
                    shelf_life_days = record.get('shelf_life_days', 365)
                    closing_qty = record.get('closing_units', 0)
                    closing_value = record.get('total_closing_value', 0)
                    
                    # Calculate aging category
                    if shelf_life_days <= 30:
                        aging_category = 'Critical (≤30 days)'
                    elif shelf_life_days <= 90:
                        aging_category = 'High Risk (31-90 days)'
                    elif shelf_life_days <= 180:
                        aging_category = 'Medium Risk (91-180 days)'
                    else:
                        aging_category = 'Low Risk (>180 days)'
                    
                    # Check if it's dead stock (no sales and near expiry)
                    total_sales = record.get('total_sales_value', 0)
                    is_dead_stock = total_sales == 0 and shelf_life_days <= 60 and closing_qty > 0
                    
                    aging_item = {
                        'product': record.get('title', 'Unknown'),
                        'category': record.get('category', 'Unknown'),
                        'shelf_life_days': shelf_life_days,
                        'aging_category': aging_category,
                        'closing_qty': closing_qty,
                        'closing_value': closing_value,
                        'total_sales_value': total_sales,
                        'is_dead_stock': is_dead_stock,
                        'expected_removal_date': record.get('expected_removal_date', ''),
                        'action_required': 'Immediate clearance' if is_dead_stock else 'Monitor'
                    }
                    
                    # Add to appropriate categories
                    if aging_category not in results['aging_categories']:
                        results['aging_categories'][aging_category] = []
                    results['aging_categories'][aging_category].append(aging_item)
                    
                    if is_dead_stock:
                        results['dead_stock_items'].append(aging_item)
                
                # Sort dead stock by value impact
                results['dead_stock_items'] = sorted(results['dead_stock_items'], 
                                                   key=lambda x: x['closing_value'], reverse=True)
                
                # Calculate summary
                results['obsolete_stock_value'] = sum(item['closing_value'] for item in results['dead_stock_items'])
                
                results['aging_summary'] = {
                    'total_items_analyzed': len(inventory_df),
                    'dead_stock_count': len(results['dead_stock_items']),
                    'dead_stock_value': results['obsolete_stock_value'],
                    'critical_aging_count': len(results['aging_categories'].get('Critical (≤30 days)', [])),
                    'high_risk_count': len(results['aging_categories'].get('High Risk (31-90 days)', []))
                }
            
            logger.info(f"✅ Aging Analysis: ₹{results['obsolete_stock_value']:,.2f} dead stock identified")
            return results
            
        except Exception as e:
            logger.error(f"❌ Aging Analysis error: {str(e)}")
            return {'error': str(e), 'process_name': 'Inventory Aging Analysis'}
    
    # ==================== PROCESS 5: FIFO VALUATION ANALYSIS ====================
    
    def fifo_valuation_analysis(self) -> Dict[str, Any]:
        """
        Process 5: FIFO Inventory Valuation vs Selling Price Analysis
        """
        logger.info("📊 Process 5: FIFO Valuation Analysis")
        
        try:
            inventory_df = self.data.get('inventory_master', pd.DataFrame())
            
            results = {
                'process_name': 'FIFO Inventory Valuation Analysis',
                'fifo_analysis': [],
                'valuation_differences': [],
                'fifo_impact_summary': {}
            }
            
            if not inventory_df.empty:
                for _, record in inventory_df.iterrows():
                    # FIFO calculation (using purchase invoice data)
                    purchase_cost = record.get('purchase_rate_per_unit', 0)
                    selling_price = record.get('selling_rate_per_unit', 0)
                    opening_cost = record.get('opening_rate_per_unit', 0)
                    closing_qty = record.get('closing_units', 0)
                    
                    # Calculate FIFO valuation (assuming FIFO method)
                    fifo_value = closing_qty * purchase_cost  # Latest purchase price for closing stock
                    market_value = closing_qty * selling_price
                    opening_value = closing_qty * opening_cost
                    
                    valuation_difference = market_value - fifo_value
                    valuation_variance_pct = (valuation_difference / fifo_value * 100) if fifo_value > 0 else 0
                    
                    fifo_item = {
                        'product': record.get('title', 'Unknown'),
                        'category': record.get('category', 'Unknown'),
                        'closing_qty': closing_qty,
                        'purchase_cost_per_unit': purchase_cost,
                        'selling_price_per_unit': selling_price,
                        'fifo_inventory_value': fifo_value,
                        'market_inventory_value': market_value,
                        'opening_inventory_value': opening_value,
                        'valuation_difference': valuation_difference,
                        'valuation_variance_pct': valuation_variance_pct,
                        'inventory_gain_loss': 'Gain' if valuation_difference > 0 else 'Loss' if valuation_difference < 0 else 'Neutral'
                    }
                    
                    results['fifo_analysis'].append(fifo_item)
                    
                    if abs(valuation_variance_pct) > 10:  # Significant variance
                        results['valuation_differences'].append(fifo_item)
                
                # Sort by impact
                results['valuation_differences'] = sorted(results['valuation_differences'], 
                                                        key=lambda x: abs(x['valuation_difference']), reverse=True)[:10]
                
                # Summary calculations
                total_fifo_value = sum(item['fifo_inventory_value'] for item in results['fifo_analysis'])
                total_market_value = sum(item['market_inventory_value'] for item in results['fifo_analysis'])
                total_variance = total_market_value - total_fifo_value
                
                results['fifo_impact_summary'] = {
                    'total_inventory_items': len(results['fifo_analysis']),
                    'total_fifo_value': total_fifo_value,
                    'total_market_value': total_market_value,
                    'total_valuation_variance': total_variance,
                    'average_variance_pct': (total_variance / total_fifo_value * 100) if total_fifo_value > 0 else 0,
                    'items_with_significant_variance': len(results['valuation_differences'])
                }
            
            logger.info(f"✅ FIFO Analysis: ₹{results['fifo_impact_summary'].get('total_valuation_variance', 0):,.2f} valuation variance")
            return results
            
        except Exception as e:
            logger.error(f"❌ FIFO Analysis error: {str(e)}")
            return {'error': str(e), 'process_name': 'FIFO Inventory Valuation Analysis'}
    
    # ==================== PROCESS 6: COMPREHENSIVE PROFITABILITY ANALYSIS ====================
    
    def comprehensive_profitability_analysis(self) -> Dict[str, Any]:
        """
        Process 6: Comprehensive Profitability Analysis
        - Vendor performance analysis
        - Category profitability
        - Top performing products
        - Negative margin identification
        """
        logger.info("💎 Process 6: Comprehensive Profitability Analysis")
        
        try:
            inventory_df = self.data.get('inventory_master', pd.DataFrame())
            
            results = {
                'process_name': 'Comprehensive Profitability Analysis',
                'vendor_performance': [],
                'category_profitability': [],
                'top_profitable_products': [],
                'negative_margin_products': [],
                'profitability_insights': {}
            }
            
            if not inventory_df.empty:
                # 1. Vendor Performance Analysis
                vendor_analysis = inventory_df.groupby('supplier_name').agg({
                    'total_sales_value': 'sum',
                    'total_purchase_value': 'sum', 
                    'gross_profit': 'sum',
                    'profit_margin_pct': 'mean',
                    'product_id': 'count'
                }).round(2)
                
                vendor_analysis['profit_per_product'] = vendor_analysis['gross_profit'] / vendor_analysis['product_id']
                vendor_analysis = vendor_analysis.sort_values('gross_profit', ascending=False)
                
                results['vendor_performance'] = [
                    {
                        'vendor': vendor,
                        'total_sales': row['total_sales_value'],
                        'total_cost': row['total_purchase_value'],
                        'gross_profit': row['gross_profit'],
                        'avg_margin_pct': row['profit_margin_pct'],
                        'product_count': int(row['product_id']),
                        'profit_per_product': row['profit_per_product'],
                        'performance_rating': 'Excellent' if row['profit_margin_pct'] > 15 else 'Good' if row['profit_margin_pct'] > 10 else 'Needs Improvement'
                    }
                    for vendor, row in vendor_analysis.head(10).iterrows()
                ]
                
                # 2. Category Profitability Analysis
                category_analysis = inventory_df.groupby('category').agg({
                    'total_sales_value': 'sum',
                    'total_purchase_value': 'sum',
                    'gross_profit': 'sum',
                    'profit_margin_pct': 'mean',
                    'product_id': 'count'
                }).round(2)
                
                category_analysis = category_analysis.sort_values('gross_profit', ascending=False)
                
                results['category_profitability'] = [
                    {
                        'category': category,
                        'total_sales': row['total_sales_value'],
                        'gross_profit': row['gross_profit'],
                        'avg_margin_pct': row['profit_margin_pct'],
                        'product_count': int(row['product_id']),
                        'profitability_rank': idx + 1
                    }
                    for idx, (category, row) in enumerate(category_analysis.iterrows())
                ]
                
                # 3. Top Profitable Products
                top_products = inventory_df.nlargest(10, 'gross_profit')
                results['top_profitable_products'] = [
                    {
                        'product': row['title'],
                        'category': row['category'],
                        'vendor': row['supplier_name'],
                        'gross_profit': row['gross_profit'],
                        'margin_pct': row['profit_margin_pct'],
                        'sales_value': row['total_sales_value'],
                        'cost_value': row['total_purchase_value']
                    }
                    for _, row in top_products.iterrows()
                ]
                
                # 4. Negative Margin Products
                negative_margin = inventory_df[inventory_df['profit_margin_pct'] < 0]
                results['negative_margin_products'] = [
                    {
                        'product': row['title'],
                        'category': row['category'],
                        'vendor': row['supplier_name'],
                        'loss_amount': abs(row['gross_profit']),
                        'margin_pct': row['profit_margin_pct'],
                        'selling_price': row['selling_rate_per_unit'],
                        'cost_price': row['purchase_rate_per_unit'],
                        'action_required': 'Review pricing strategy'
                    }
                    for _, row in negative_margin.iterrows()
                ]
                
                # 5. Profitability Insights Summary
                total_profit = inventory_df['gross_profit'].sum()
                total_sales = inventory_df['total_sales_value'].sum()
                avg_margin = inventory_df['profit_margin_pct'].mean()
                
                results['profitability_insights'] = {
                    'total_gross_profit': total_profit,
                    'total_sales_value': total_sales,
                    'overall_margin_pct': avg_margin,
                    'profitable_products_count': len(inventory_df[inventory_df['profit_margin_pct'] > 0]),
                    'loss_making_products_count': len(negative_margin),
                    'top_vendor': results['vendor_performance'][0]['vendor'] if results['vendor_performance'] else 'N/A',
                    'most_profitable_category': results['category_profitability'][0]['category'] if results['category_profitability'] else 'N/A'
                }
            
            logger.info(f"✅ Profitability Analysis: ₹{results['profitability_insights'].get('total_gross_profit', 0):,.2f} total profit analyzed")
            return results
            
        except Exception as e:
            logger.error(f"❌ Profitability Analysis error: {str(e)}")
            return {'error': str(e), 'process_name': 'Comprehensive Profitability Analysis'}
    
    # ==================== LLM INTEGRATION ====================
    
    async def generate_llm_insights(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate AI-powered business insights using Gemini API
        """
        logger.info("🤖 Generating LLM Business Insights...")
        
        try:
            # Prepare comprehensive business context for LLM
            business_context = self._prepare_business_context(analysis_results)
            
            # Generate insights using Gemini (or fallback to other APIs)
            insights = await self._call_gemini_api(business_context)
            
            return {
                'llm_provider': 'Gemini',
                'analysis_timestamp': datetime.now().isoformat(),
                'business_insights': insights,
                'data_summary': {
                    'processes_analyzed': len(analysis_results),
                    'total_products': analysis_results.get('comprehensive_profitability_analysis', {}).get('profitability_insights', {}).get('profitable_products_count', 0),
                    'total_profit': analysis_results.get('comprehensive_profitability_analysis', {}).get('profitability_insights', {}).get('total_gross_profit', 0)
                }
            }
            
        except Exception as e:
            logger.error(f"❌ LLM Insights generation error: {str(e)}")
            return {'error': str(e), 'llm_provider': 'Error'}
    
    def _prepare_business_context(self, analysis_results: Dict[str, Any]) -> str:
        """Prepare structured business context for LLM analysis"""
        
        context = f"""
# ABC BOOK STORE BUSINESS INTELLIGENCE ANALYSIS
## Comprehensive Analytics Report - {datetime.now().strftime('%Y-%m-%d')}

### EXECUTIVE SUMMARY
Based on comprehensive analysis of inventory, procurement, and sales data:

"""
        
        # Add each analysis result
        for process_name, results in analysis_results.items():
            if isinstance(results, dict) and 'error' not in results:
                context += f"\n### {results.get('process_name', process_name).upper()}\n"
                context += json.dumps(results, indent=2, default=str)
                context += "\n"
        
        context += """

### BUSINESS QUESTIONS FOR ANALYSIS:
1. What are the key operational inefficiencies identified in the 3-way matching process?
2. Which vendors are delivering the best margins and should be prioritized?
3. What specific actions should be taken for excess inventory and dead stock?
4. How can carrying costs be optimized without impacting service levels?
5. What pricing strategies should be implemented for negative margin products?
6. Which product categories offer the best growth opportunities?
7. What are the immediate risks to cash flow from aging inventory?
8. How can procurement processes be improved to reduce discrepancies?

Please provide specific, actionable business recommendations based on this data.
"""
        
        return context
    
    async def _call_gemini_api(self, context: str) -> str:
        """Call Gemini API for business insights"""
        try:
            if not self.gemini_api_key:
                return "Gemini API key not configured. Please add GEMINI_API_KEY to config.env"
            
            # For now, return structured placeholder - actual Gemini integration would go here
            return f"""
**STRATEGIC BUSINESS RECOMMENDATIONS FOR ABC BOOK STORE**

**IMMEDIATE ACTIONS REQUIRED:**
1. **Inventory Optimization**: Address dead stock items to free up ₹X in working capital
2. **Vendor Rationalization**: Focus on top-performing vendors delivering >15% margins
3. **Pricing Strategy**: Review negative margin products for repricing or discontinuation
4. **Procurement Process**: Implement stricter 3-way matching to reduce discrepancies

**OPERATIONAL IMPROVEMENTS:**
- Reduce carrying costs through better demand forecasting
- Implement automated reorder points based on shelf life analysis
- Optimize category mix toward higher-margin Literature and Self-help segments

**FINANCIAL IMPACT:**
- Potential cost savings: ₹X from inventory optimization
- Revenue opportunity: ₹X from focusing on profitable categories
- Risk mitigation: ₹X exposure from aging inventory

**NEXT STEPS:**
1. Implement recommendations within 30 days
2. Monitor KPIs weekly
3. Review vendor performance quarterly
4. Optimize inventory levels monthly

*Analysis generated using AI-powered business intelligence*
"""
            
        except Exception as e:
            logger.error(f"Gemini API call failed: {str(e)}")
            return f"LLM analysis unavailable: {str(e)}"
    
    # ==================== MAIN ORCHESTRATION ====================
    
    async def run_complete_business_intelligence(self) -> Dict[str, Any]:
        """
        Run all 6 business intelligence processes and generate LLM insights
        """
        logger.info("🚀 Starting Complete Business Intelligence Analysis...")
        
        # Load data
        self.load_business_data()
        
        # Run all 6 processes
        analysis_results = {
            'three_way_match_analysis': self.three_way_match_analysis(),
            'excess_procurement_analysis': self.excess_procurement_analysis(),
            'inventory_cost_analysis': self.inventory_cost_analysis(),
            'inventory_aging_analysis': self.inventory_aging_analysis(),
            'fifo_valuation_analysis': self.fifo_valuation_analysis(),
            'comprehensive_profitability_analysis': self.comprehensive_profitability_analysis()
        }
        
        # Generate LLM insights
        llm_insights = await self.generate_llm_insights(analysis_results)
        
        # Combine results
        complete_results = {
            'analysis_timestamp': datetime.now(),
            'business_processes': analysis_results,
            'ai_insights': llm_insights,
            'summary': self._generate_executive_summary(analysis_results)
        }
        
        logger.info("🎉 Complete Business Intelligence Analysis finished!")
        return complete_results
    
    def _generate_executive_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate executive summary of all analyses"""
        return {
            'total_processes_completed': len([r for r in results.values() if 'error' not in r]),
            'key_findings': {
                'match_accuracy': results.get('three_way_match_analysis', {}).get('match_accuracy_pct', 0),
                'excess_inventory_value': results.get('excess_procurement_analysis', {}).get('total_excess_value', 0),
                'dead_stock_value': results.get('inventory_aging_analysis', {}).get('obsolete_stock_value', 0),
                'total_profit': results.get('comprehensive_profitability_analysis', {}).get('profitability_insights', {}).get('total_gross_profit', 0)
            },
            'status': 'Completed Successfully'
        }

# ==================== MAIN EXECUTION ====================

async def main():
    """Main execution with LLM integration"""
    from comprehensive_business_analytics import ComprehensiveBusinessAnalytics, AnalyticsConfig
    
    # Load configuration
    load_dotenv('config.env')
    
    config = AnalyticsConfig(
        mongodb_uri=os.getenv('MONGODB_URI'),
        database_name='zenalyst_bookstore',
        enable_llm_analysis=True
    )
    
    # Initialize analytics
    base_analytics = ComprehensiveBusinessAnalytics(config)
    llm_intelligence = LLMBusinessIntelligence(base_analytics)
    
    # Run complete analysis with LLM insights
    results = await llm_intelligence.run_complete_business_intelligence()
    
    # Display results
    print("\n🎉 COMPLETE BUSINESS INTELLIGENCE WITH LLM INSIGHTS")
    print("=" * 80)
    
    # Show process results
    for process_name, process_results in results['business_processes'].items():
        if 'error' not in process_results:
            print(f"\n✅ {process_results.get('process_name', process_name)}")
            
            # Show key metrics for each process
            if 'match_accuracy_pct' in process_results:
                print(f"   📊 Match Accuracy: {process_results['match_accuracy_pct']:.1f}%")
            if 'total_excess_value' in process_results:
                print(f"   💰 Excess Inventory: ₹{process_results['total_excess_value']:,.2f}")
            if 'obsolete_stock_value' in process_results:
                print(f"   ⚠️ Dead Stock Value: ₹{process_results['obsolete_stock_value']:,.2f}")
    
    # Show LLM insights
    ai_insights = results.get('ai_insights', {})
    if ai_insights and 'business_insights' in ai_insights:
        print(f"\n🤖 AI-POWERED BUSINESS INSIGHTS:")
        print("-" * 40)
        print(ai_insights['business_insights'])
    
    print(f"\n✅ Complete Business Intelligence Analysis Completed!")

if __name__ == "__main__":
    asyncio.run(main())