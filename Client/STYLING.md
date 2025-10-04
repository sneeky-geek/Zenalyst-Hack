# Zenalyst Dashboard Styling Guide

This document outlines the styling approach used for the Zenalyst Finance Dashboard.

## Color Palette

- Primary Color: #1976d2 (Blue)
- Secondary Colors:
  - Green: #4caf50 (Total Value)
  - Blue: #2196f3 (Transactions)
  - Orange: #ff9800 (Vendors)
  - Purple: #9c27b0 (Documents)
- Background: #f5f5f5
- Text: rgba(0, 0, 0, 0.87)
- Error: #f44336
- Success: #4caf50

## Typography

- Primary Font: 'Roboto', 'Helvetica', 'Arial', sans-serif
- Headings:
  - Dashboard Title: 24px, 500 weight
  - Card Titles: 14px (0.875rem)
  - Chart Titles: 18px (1.125rem)
- Body Text: 16px (1rem)
- Small Text: 14px (0.875rem)

## Layout

- CSS Grid-based layout for responsive behavior
- Breakpoints:
  - Small: 0-600px (1 column layout)
  - Medium: 600px-960px (2 column layout)
  - Large: 960px+ (4 column layout)
- Cards have 8px border radius with subtle shadow
- Standard spacing increments: 8px, 16px, 24px

## Components

### Summary Cards

- Equal height cards with header area
- Icon circle with designated color per card type
- Large number display for key metric
- Optional trend indicator with color coding

### Charts

- Consistent height across all chart containers
- Padding: 16px
- Title at top, aligned left
- Responsive sizing with min-height: 300px

### Transaction Table

- Paper container with padding
- Search field at the top
- Status chips with color-coding
- Pagination controls at the bottom
- Responsive column hiding on smaller screens

## CSS Modules

The dashboard uses CSS Modules for component-scoped styling. Main modules include:

- Dashboard.module.css - Overall layout grid
- SummaryCard.module.css - Card-specific styles
- Chart.module.css - Shared chart container styles
- TransactionTable.module.css - Table and status styling

## Global Styles

Global styles defined in index.css provide base styling including:

- Font family and size settings
- Custom scrollbars
- Responsive adjustments
- Background colors

## Material UI Theme

The application uses Material UI components with light customization:
- Cards use elevation={2} for subtle shadows
- Primary color set to #1976d2
- Typography uses Roboto font family
- Custom styles applied to enhance the default Material UI appearance