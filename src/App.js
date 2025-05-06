import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import FileUploader from './FileUploader';
import ResultTable from './ResultTable';
import FilterPanel from './FilterPanel';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Papa from 'papaparse';
import moment from 'moment';

function App() {
  const [results, setResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [successfulPaymentIds, setSuccessfulPaymentIds] = useState(null);
  const [fromStatus, setFromStatus] = useState(2); // Default from status
  const [toStatus, setToStatus] = useState(8);     // Default to status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Handle file upload and data processing
  const handleFileUpload = (file) => {
    setIsLoading(true);
    setError('');
    
    console.log("Starting file parse for:", file.name);
    console.log("File type:", file.type);
    console.log("File size:", file.size, "bytes");
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize headers by trimming whitespace
        const trimmed = header.trim().toLowerCase();
        console.log(`Header: "${header}" -> "${trimmed}"`);
        return trimmed;
      },
      complete: (results) => {
        try {
          console.log("CSV Parse results:", {
            rowCount: results.data.length,
            headers: results.meta.fields,
            firstRow: results.data[0]
          });
          
          if (results.data.length === 0) {
            setError("CSV file is empty or couldn't be parsed correctly");
            setIsLoading(false);
            return;
          }
          
          // Show exactly what column names we're working with for debugging
          const firstRow = results.data[0];
          console.log("First row keys:", Object.keys(firstRow));
          
          // Process the data with specific column handling for user's format
          const processedData = [];
          
          for (let row of results.data) {
            // Extract fields from the row using the specific column names
            const paymentId = row['payment id'] || '';
            const terminalId = row['terminal id'] || '';
            const merchantId = row['merchant id'] || '';
            const event = row['event'] || '';
            const eventBody = row['event body'] || '';
            
            // Use created at for timestamp, fall back to timestamp field if missing
            const timestamp = row['created at'] || row['timestamp'] || '';
            
            // Skip rows with missing essential data
            if (!paymentId || !timestamp) {
              console.log('Skipping row missing payment ID or timestamp:', row);
              continue;
            }
            
            // Extract status from the event body JSON
            let status = null;
            
            try {
              // The event body is a JSON string with a status field
              // Handle the case of double-escaped quotes
              const cleanedEventBody = eventBody.replace(/\\"/g, '"').replace(/"{/g, '{').replace(/}"/g, '}');
              console.log('Parsing event body:', cleanedEventBody);
              
              const eventBodyObj = JSON.parse(cleanedEventBody);
              if (eventBodyObj && typeof eventBodyObj.status !== 'undefined') {
                status = parseInt(eventBodyObj.status);
                console.log(`Extracted status ${status} from event body JSON`);
              }
            } catch (err) {
              console.warn(`Error parsing event body JSON:`, err);
              
              // Fallback: try to extract status using regex
              try {
                const statusMatch = eventBody.match(/"status"\s*:\s*(\d+)/);
                if (statusMatch && statusMatch[1]) {
                  status = parseInt(statusMatch[1]);
                  console.log(`Extracted status ${status} via regex from event body`);
                }
              } catch (regexErr) {
                console.warn('Failed to extract status via regex:', regexErr);
              }
            }
            
            // Skip if no status could be determined
            if (status === null) {
              console.log(`Skipping row - no status found:`, { event, eventBody });
              continue;
            }
            
            // Add to processed data
            processedData.push({
              paymentId,
              timestamp,
              status,
              terminalId,
              merchantId,
              date: moment(timestamp).format('DD/MM/YYYY')
            });
          }
          
          console.log(`Processed ${processedData.length} rows successfully`);
          
          if (processedData.length === 0) {
            setError('No valid data could be processed from the CSV. Please check the format.');
            setIsLoading(false);
            return;
          }
          
          // Group by payment ID and find matching status pairs
          const paymentGroups = {};
          processedData.forEach(item => {
            if (!paymentGroups[item.paymentId]) {
              paymentGroups[item.paymentId] = [];
            }
            paymentGroups[item.paymentId].push(item);
          });
          
          console.log(`Found ${Object.keys(paymentGroups).length} payment groups`);
          
          // Calculate time differences between status events
          const timeResults = [];
          
          Object.keys(paymentGroups).forEach(paymentId => {
            const events = paymentGroups[paymentId];
            
            // Log the statuses found for this payment ID
            console.log(`Payment ${paymentId} has statuses:`, events.map(e => e.status));
            
            // Find events with matching fromStatus and toStatus
            const fromEvent = events.find(e => e.status === fromStatus);
            const toEvent = events.find(e => e.status === toStatus);
            
            // Skip if we don't have both statuses
            if (!fromEvent || !toEvent) {
              console.log(`Payment ${paymentId} missing required status(es): ` + 
                          `${fromStatus}=${!!fromEvent}, ${toStatus}=${!!toEvent}`);
              return;
            }
            
            try {
              const fromTime = moment(fromEvent.timestamp);
              const toTime = moment(toEvent.timestamp);
              
              // Only calculate if toEvent is after fromEvent
              if (toTime.isAfter(fromTime)) {
                const timeDifferenceMs = toTime.diff(fromTime);
                
                timeResults.push({
                  paymentId,
                  fromStatusTime: fromEvent.timestamp,
                  toStatusTime: toEvent.timestamp,
                  timeDifferenceMs: timeDifferenceMs.toString(),
                  terminalId: fromEvent.terminalId,
                  merchantId: fromEvent.merchantId,
                  date: fromEvent.date,
                  fromStatus,
                  toStatus
                });
                
                console.log(`Payment ${paymentId}: Time difference = ${timeDifferenceMs}ms`);
              } else {
                console.log(`Payment ${paymentId}: Status ${toStatus} event occurred before status ${fromStatus} event`);
              }
            } catch (err) {
              console.error(`Error calculating time for payment ${paymentId}:`, err);
            }
          });
          
          console.log(`Final results: ${timeResults.length} valid time differences found`);
          
          if (timeResults.length === 0) {
            setError(`No payments found with both status ${fromStatus} and status ${toStatus} in the correct order.`);
          }
          
          setResults(timeResults);
          setFilteredResults(timeResults);
          setIsLoading(false);
        } catch (err) {
          console.error("Error processing file:", err);
          setError(`Error processing file: ${err.message}`);
          setIsLoading(false);
        }
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
        setError(`Error parsing CSV: ${err.message}`);
        setIsLoading(false);
      }
    });
  };
  
  // Handle second CSV with successful payment IDs
  const handleSuccessfulPaymentsUpload = (file) => {
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          // Extract payment IDs from the successful payments file
          const successfulIds = new Set();
          
          results.data.forEach(row => {
            if (row.paymentId) {
              successfulIds.add(row.paymentId);
            }
          });
          
          if (successfulIds.size === 0) {
            setError('No valid payment IDs found in the file');
          } else {
            setSuccessfulPaymentIds(successfulIds);
            // Filter results to only show successful payments
            const filtered = filteredResults.filter(result => 
              successfulIds.has(result.paymentId)
            );
            setFilteredResults(filtered);
          }
          
          setIsLoading(false);
        } catch (err) {
          setError(`Error processing successful payments file: ${err.message}`);
          setIsLoading(false);
        }
      },
      error: (err) => {
        setError(`Error parsing successful payments CSV: ${err.message}`);
        setIsLoading(false);
      }
    });
  };
  
  // Handle filter changes from the FilterPanel
  const handleFilterChange = (filters) => {
    // Apply filters to the original results
    let filtered = [...results];
    
    // Apply date filter
    if (filters.date) {
      filtered = filtered.filter(item => item.date === filters.date);
    }
    
    // Apply terminal ID filter
    if (filters.terminalId) {
      filtered = filtered.filter(item => 
        item.terminalId && item.terminalId.includes(filters.terminalId)
      );
    }
    
    // Apply payment ID filter
    if (filters.paymentId) {
      filtered = filtered.filter(item => 
        item.paymentId && item.paymentId.includes(filters.paymentId)
      );
    }
    
    // Apply time difference filter
    if (filters.timeDifference) {
      const threshold = parseInt(filters.timeDifference) * 1000; // Convert to ms
      filtered = filtered.filter(item => 
        parseInt(item.timeDifferenceMs) > threshold
      );
    }
    
    // Apply successful payments filter if we have successful payment IDs
    if (filters.onlySuccessful && successfulPaymentIds) {
      filtered = filtered.filter(item => 
        successfulPaymentIds.has(item.paymentId)
      );
    }
    
    setFilteredResults(filtered);
  };
  
  // Export filtered results to CSV
  const exportToCsv = () => {
    if (filteredResults.length === 0) {
      setError('No data to export');
      return;
    }
    
    try {
      // Create CSV header row
      const headers = ['Payment ID', 'From Status Time', 'To Status Time', 'Time Difference (ms)', 'Terminal ID', 'Merchant ID', 'Date'];
      
      // Convert data to CSV rows
      let csvContent = headers.join(',') + '\n';
      
      // Add data rows
      filteredResults.forEach(item => {
        const row = [
          item.paymentId || '',
          item.fromStatusTime || '',
          item.toStatusTime || '',
          item.timeDifferenceMs || '',
          item.terminalId || '',
          item.merchantId || '',
          item.date || ''
        ];
        
        // Enclose fields in quotes if they contain commas
        const formattedRow = row.map(field => {
          // If field contains commas, quotes, or newlines, enclose in quotes
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            // Double up any existing quotes
            return '"' + field.replace(/"/g, '""') + '"';
          }
          return field;
        });
        
        csvContent += formattedRow.join(',') + '\n';
      });
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      // Setup download link
      link.setAttribute('href', url);
      link.setAttribute('download', `payment_intervals_${moment().format('YYYYMMDD_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV export successful');
    } catch (err) {
      console.error('CSV export error:', err);
      setError(`Error exporting CSV: ${err.message}`);
    }
  };
  
  // Reset status values
  const handleStatusChange = (from, to) => {
    setFromStatus(from);
    setToStatus(to);
  };
  
  return (
    <div className="App">
      <Container fluid>
        <Row className="mb-4 mt-3">
          <Col>
            <h1 className="text-center">Payment Interval Analyzer</h1>
            <p className="text-center text-muted">
              Upload CSV with payment transaction data to analyze processing times
            </p>
          </Col>
        </Row>
        
        <Row className="mb-4">
          <Col md={6}>
            <Card className="mb-3">
              <Card.Header as="h5">Upload Payment Data</Card.Header>
              <Card.Body>
                <FileUploader 
                  onFileUpload={handleFileUpload}
                  label="Upload CSV with payment transactions"
                  accept=".csv"
                  isMain={true}
                />
                
                <div className="d-flex mt-3">
                  <div className="me-2">
                    <label className="form-label">From Status:</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={fromStatus}
                      onChange={(e) => handleStatusChange(parseInt(e.target.value), toStatus)}
                    />
                  </div>
                  <div>
                    <label className="form-label">To Status:</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={toStatus}
                      onChange={(e) => handleStatusChange(fromStatus, parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
            
            <Card className="mb-3">
              <Card.Header as="h5">Successful Payments (Optional)</Card.Header>
              <Card.Body>
                <FileUploader 
                  onFileUpload={handleSuccessfulPaymentsUpload}
                  label="Upload CSV with successful payment IDs"
                  accept=".csv"
                  isMain={false}
                />
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6}>
            <FilterPanel 
              onFilterChange={handleFilterChange}
              hasData={results.length > 0}
              paymentData={results}
            />
            
            {filteredResults.length > 0 && (
              <div className="text-end mb-3">
                <Button 
                  variant="success" 
                  onClick={exportToCsv}
                >
                  Export to CSV
                </Button>
              </div>
            )}
          </Col>
        </Row>
        
        {error && (
          <Row className="mb-4">
            <Col>
              <div className="alert alert-danger">{error}</div>
            </Col>
          </Row>
        )}
        
        {isLoading ? (
          <Row>
            <Col className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Processing data...</p>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col>
              <ResultTable results={filteredResults} />
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default App;
