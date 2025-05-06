# Payment Interval Analyzer

## Project Overview

This application helps analyze payment transaction data to identify potential delays in payment processing. It calculates the time difference between key status events (status 2 and status 8) in a payment transaction lifecycle, highlighting transactions with time differences exceeding 10 seconds.

## Problem Solved

In payment processing systems, transactions go through multiple status changes as they progress. When the time between status transitions is too long, it may indicate issues in the payment pipeline. This tool helps identify and analyze these delays by:

- Parsing transaction data from CSV files
- Calculating time differences between specific status events
- Highlighting potentially problematic transactions
- Providing filtering capabilities to focus on specific transaction sets

## Features

- **CSV Data Processing**: Upload and parse payment transaction CSV files
- **Automated Calculations**: Determine time differences between status 2 and status 8 events
- **Visual Indicators**: Red highlighting for transactions with time differences over 10 seconds
- **Robust Filtering**: Filter by date, terminal ID, merchant ID, payment ID, reference ID, and status
- **Secondary Filtering**: Upload a list of successful payment IDs to further narrow results
- **Data Export**: Export filtered results to CSV with preserved timestamp formats

## Data Requirements

The application expects CSV files with the following columns:
- id
- terminal_id
- event
- event_body (contains JSON with status information)
- merchant_id
- payment_id
- reference_id
- timestamp
- created_at

## How It Works

1. **Data Upload**: User uploads a CSV file containing payment transaction data
2. **Processing Logic**:
   - The application parses the CSV data
   - It extracts status values from the event_body field (JSON parsing)
   - For each payment_id, it identifies corresponding status 2 and status 8 events
   - It calculates the time difference between these events in seconds
3. **Visualization**:
   - Results are displayed in a sortable table
   - Time differences over 10 seconds are highlighted in red
4. **Analysis Tools**:
   - Users can filter results using various criteria
   - Filtered data can be exported to CSV for further analysis

## Technical Implementation

The application is built using:
- **React**: For the user interface and component architecture
- **Bootstrap**: For responsive styling and UI components
- **PapaParse**: For CSV parsing and processing
- **Moment.js**: For accurate time difference calculations

## Getting Started

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the development server
4. Access the application at http://localhost:3000
