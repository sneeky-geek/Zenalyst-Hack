# 🎯 ZENALYST SCHEMA REDESIGN SPECIFICATION
## Comprehensive Data Model for ABC Book Store Business Intelligence

### 📊 CURRENT PROBLEM ANALYSIS
- **Empty Fields Issue**: Current ETL pipeline creates sparse data with many null values
- **Poor Data Mapping**: Fields like `Amount` and `Total` are inconsistently mapped
- **Missing Relationships**: No proper linking between PO → GRN → PI → Sales Invoice
- **Schema Mismatch**: Single flat structure doesn't match multi-document business flow
- **Analytics Failure**: LLM gets incomplete data due to missing cost/profit calculations

### 🎯 PROPOSED SOLUTION: DOMAIN-DRIVEN SCHEMA DESIGN

## 📋 1. INVENTORY MASTER SCHEMA
```json
{
  "collection": "inventory_master",
  "fields": {
    "product_id": "BK-1001", 
    "isbn": "9780061122415",
    "title": "The Alchemist by Paulo Coelho",
    "author": "Paulo Coelho",
    "publisher": "HarperCollins", 
    "category": "Literature – Inspirational",
    "edition": "Paperback",
    "language": "English",
    "store_code": "BK-1001",
    "store_location": "Bangalore – Residency Rd",
    "store_incharge": "Mr. Ramesh",
    "
    // Inventory Quantities
    "opening_units": 19,
    "purchased_units": 40,
    "sold_units": 25,
    "closing_units": 34,
    "return_defective_qty": 0,
    
    // Financial Data
    "opening_rate_per_unit": 1360.24,
    "purchase_rate_per_unit": 1388.00,
    "selling_rate_per_unit": 2271.00,
    "closing_rate_per_unit": 1388.00,
    "carrying_cost_per_unit": 85.00,
    
    // Calculated Values
    "total_opening_value": 25844.56,
    "total_purchase_value": 55520.00,
    "total_sales_value": 56775.00,
    "total_closing_value": 47192.00,
    "gross_profit": 883.00,
    "profit_margin_pct": 1.55,
    
    // Dates
    "shelf_life_days": 23,
    "expected_removal_date": "2024-05-20",
    "last_purchase_date": "2024-04-27",
    "last_sale_date": "2024-05-10"
  }
}
```

## 📋 2. PURCHASE ORDER SCHEMA
```json
{
  "collection": "purchase_orders", 
  "fields": {
    "po_number": "PO-PRH-202509-001",
    "po_date": "2024-04-27",
    "vendor_code": "PRH",
    "vendor_name": "Rupa Publications India",
    "vendor_address": "7/16 Ansari Road, Daryaganj, New Delhi",
    "vendor_gstin": "29AAKCS7860D1ZY",
    "buyer_name": "ABC BOOK HOUSE PRIVATE LIMITED",
    "buyer_address": "3rd Main Road, Gandhinagar, Bangalore",
    
    "line_items": [
      {
        "item_no": 1,
        "product_id": "BK-1001",
        "isbn": "9780061122415",
        "title": "The Alchemist by Paulo Coelho",
        "ordered_qty": 40,
        "unit_rate": 1388.00,
        "total_amount": 55520.00
      }
    ],
    
    "po_total_amount": 55520.00,
    "po_status": "completed",
    "created_by": "purchase_dept",
    "approved_by": "manager"
  }
}
```

## 📋 3. GOODS RECEIPT NOTE (GRN) SCHEMA  
```json
{
  "collection": "goods_receipt_notes",
  "fields": {
    "grn_code": "GRN-2024-001",
    "grn_date": "2024-04-27", 
    "po_number": "PO-PRH-202509-001",
    "vendor_name": "Rupa Publications India",
    "purchase_invoice_no": "PI-RUP-2000",
    
    "received_items": [
      {
        "product_id": "BK-1001",
        "title": "The Alchemist by Paulo Coelho",
        "ordered_qty": 40,
        "received_qty": 40,
        "accepted_qty": 40,
        "rejected_qty": 0,
        "unit_rate": 1388.00,
        "total_value": 55520.00
      }
    ],
    
    "grn_total_value": 55520.00,
    "receiver_name": "Mr. Ramesh",
    "quality_check_status": "passed",
    "grn_status": "completed"
  }
}
```

## 📋 4. PURCHASE INVOICE SCHEMA
```json
{
  "collection": "purchase_invoices",
  "fields": {
    "invoice_no": "PI-RUP-2000",
    "invoice_date": "2024-04-27",
    "po_number": "PO-PRH-202509-001", 
    "grn_code": "GRN-2024-001",
    "vendor_name": "Rupa Publications India",
    "vendor_gstin": "29AAKCS7860D1ZY",
    
    "invoice_items": [
      {
        "product_id": "BK-1001",
        "title": "The Alchemist by Paulo Coelho",
        "quantity": 40,
        "unit_rate": 1388.00,
        "taxable_amount": 55520.00,
        "gst_rate": 18,
        "gst_amount": 9993.60,
        "total_amount": 65513.60
      }
    ],
    
    "subtotal": 55520.00,
    "total_gst": 9993.60,
    "invoice_total": 65513.60,
    "payment_terms": "30 days",
    "payment_status": "paid"
  }
}
```

## 📋 5. SALES INVOICE SCHEMA
```json
{
  "collection": "sales_invoices", 
  "fields": {
    "invoice_no": "INV-202510-003",
    "invoice_date": "2024-05-10",
    "customer_name": "Macmillan Publishers India",
    "customer_address": "Customer Address",
    "customer_gstin": "CUSTOMER_GST_NO",
    
    "sale_items": [
      {
        "sl_no": 1,
        "product_id": "BK-1001", 
        "title": "The Alchemist by Paulo Coelho",
        "author": "Paulo Coelho",
        "category": "Literature – Inspirational",
        "quantity": 25,
        "unit_rate": 2271.00,
        "amount": 56775.00,
        "cost_per_unit": 1388.00,
        "gross_profit": 22075.00,
        "profit_margin": 38.87
      }
    ],
    
    "subtotal": 205180.00,
    "gst_amount": 36932.40,
    "invoice_total": 242112.40,
    "payment_status": "pending"
  }
}
```

## 📋 6. FINANCIAL SUMMARY SCHEMA
```json
{
  "collection": "financial_summary",
  "fields": {
    "summary_id": "FS-202410-001",
    "period": "2024-10",
    "total_purchases": 2500000.00,
    "total_sales": 3200000.00,
    "total_gross_profit": 700000.00,
    "average_margin_pct": 21.87,
    "inventory_value": 1800000.00,
    "dead_stock_value": 150000.00,
    "inventory_turnover": 1.78,
    "top_selling_categories": ["Literature", "Self-help", "Finance"],
    "top_vendors": ["Rupa Publications", "HarperCollins", "Penguin"],
    "summary_date": "2024-10-04"
  }
}
```

## 🎯 KEY IMPROVEMENTS

### 1. **Relational Integrity**
- Each document type has clear primary keys
- Foreign key relationships maintained (po_number, grn_code, etc.)
- End-to-end traceability from PO → GRN → PI → Sales

### 2. **Complete Financial Data**
- Cost price, selling price, and profit calculations in every record
- No more NaN values - all financial fields have defaults
- Proper margin calculations at line item level

### 3. **Rich Analytics Context**
- Category, vendor, and product hierarchies
- Date-based analysis capabilities  
- Inventory movement tracking
- Financial performance metrics

### 4. **LLM-Ready Data Structure**
- Self-contained documents with full context
- Human-readable field names and values
- Rich metadata for intelligent analysis
- Complete business narrative in each record

## 🚀 IMPLEMENTATION BENEFITS

1. **Zero NaN Values** - Every field has meaningful data
2. **Complete Profitability** - Cost vs selling price in every transaction  
3. **Rich Analytics** - Category, vendor, temporal analysis possible
4. **LLM Integration** - Full context for AI-powered insights
5. **Scalable Design** - Easy to extend and modify

This schema will resolve all current analytics issues and provide rich, complete data for both traditional BI and LLM-powered analysis.