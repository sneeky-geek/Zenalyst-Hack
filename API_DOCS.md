# API Documentation for Zenalyst Dashboard

This document describes the REST API endpoints that provide data for the Zenalyst Dashboard.

## Base URL

When running locally, the API base URL is:
```
http://localhost:5000
```

## Authentication

Currently, the API does not require authentication for local development.

## API Endpoints

### Health Check

**Endpoint:** `GET /api/health`

**Description:** Check if the API server is running and connected to MongoDB.

**Response:**
```json
{
  "status": "healthy",
  "message": "API server is running and connected to MongoDB"
}
```

### Summary Statistics

**Endpoint:** `GET /api/summary`

**Description:** Get summary statistics of all transactions in the database.

**Response:**
```json
{
  "total_records": 261,
  "document_types": {
    "Invoice": 120,
    "Purchase Order": 80,
    "Goods Receipt": 61
  },
  "financial_summary": {
    "total_amount": 456789.23,
    "total_tax": 45678.92,
    "total_invoices": 261,
    "avg_amount": 1750.15,
    "max_amount": 15000.00,
    "min_amount": 50.00
  }
}
```

### Transactions

**Endpoint:** `GET /api/transactions`

**Description:** Get transactions with optional filtering and pagination.

**Parameters:**
- `limit` (optional): Maximum number of records to return (default: 100)
- `skip` (optional): Number of records to skip (default: 0)
- `document_type` (optional): Filter by document type (e.g., "Invoice", "Purchase Order")

**Response:**
```json
{
  "total": 120,
  "results": [
    {
      "_id": "5f9d88b9c7f5d2a1b034e5a1",
      "Invoice_No": "INV-2024-001",
      "Date": "2024-09-15",
      "Vendor": "ABC Corp",
      "Amount": "1500.00",
      "Tax": "150.00",
      "Total": "1650.00",
      "Status": "Paid",
      "document_type": "Invoice",
      "source_file": "Hackathon/Inputs/Sales Invoices/invoice_INV-202510-001.pdf"
    },
    // More transactions...
  ]
}
```

### Monthly Transactions

**Endpoint:** `GET /api/transactions/monthly`

**Description:** Get monthly transaction totals for time-series charts.

**Response:**
```json
[
  {
    "_id": {
      "year": 2024,
      "month": 8
    },
    "count": 45,
    "total_amount": 78500.00
  },
  {
    "_id": {
      "year": 2024,
      "month": 9
    },
    "count": 120,
    "total_amount": 156000.00
  },
  // More months...
]
```

### Vendor Statistics

**Endpoint:** `GET /api/vendors`

**Description:** Get vendor statistics for charts and analysis.

**Response:**
```json
[
  {
    "_id": "ABC Corp",
    "count": 15,
    "total_amount": 45000.00,
    "transactions": ["5f9d88b9c7f5d2a1b034e5a1", "..."]
  },
  {
    "_id": "XYZ Inc",
    "count": 10,
    "total_amount": 35000.00,
    "transactions": ["5f9d88b9c7f5d2a1b034e5a2", "..."]
  },
  // More vendors...
]
```

### Status Summary

**Endpoint:** `GET /api/transactions/status`

**Description:** Get transaction status summary for charts.

**Response:**
```json
[
  {
    "_id": "Paid",
    "count": 180,
    "total_amount": 320000.00
  },
  {
    "_id": "Pending",
    "count": 45,
    "total_amount": 85000.00
  },
  {
    "_id": "Cancelled",
    "count": 36,
    "total_amount": 51789.23
  }
]
```

### Search Transactions

**Endpoint:** `GET /api/search`

**Description:** Search transactions by keyword.

**Parameters:**
- `query` (required): Search query string

**Response:**
```json
[
  {
    "_id": "5f9d88b9c7f5d2a1b034e5a1",
    "Invoice_No": "INV-2024-001",
    "Date": "2024-09-15",
    "Vendor": "ABC Corp",
    "Amount": "1500.00",
    "Tax": "150.00",
    "Total": "1650.00",
    "Status": "Paid",
    "document_type": "Invoice",
    "source_file": "Hackathon/Inputs/Sales Invoices/invoice_INV-202510-001.pdf"
  },
  // More matching transactions...
]
```

## Error Responses

All endpoints will return a standard error format:

```json
{
  "error": "Error message description"
}
```

HTTP status codes will appropriately indicate the type of error:
- 400: Bad request (e.g., missing required parameter)
- 404: Resource not found
- 500: Server error