import React, { useState, useEffect } from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';

const FilterPanel = ({ onFilterChange, hasData, paymentData }) => {
  // State for each filter
  const [date, setDate] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [timeDifference, setTimeDifference] = useState('');
  const [onlySuccessful, setOnlySuccessful] = useState(false);
  
  // Available dates for the dropdown
  const [availableDates, setAvailableDates] = useState([]);
  
  // Extract unique dates from payment data
  useEffect(() => {
    if (paymentData && paymentData.length > 0) {
      const uniqueDates = [...new Set(paymentData.map(item => item.date))].filter(Boolean).sort();
      setAvailableDates(uniqueDates);
    }
  }, [paymentData]);
  
  // Update filters when any value changes
  useEffect(() => {
    if (hasData) {
      onFilterChange({
        date,
        terminalId,
        paymentId,
        timeDifference,
        onlySuccessful
      });
    }
  }, [date, terminalId, paymentId, timeDifference, onlySuccessful, hasData, onFilterChange]);
  
  // Reset all filters
  const resetFilters = () => {
    setDate('');
    setTerminalId('');
    setPaymentId('');
    setTimeDifference('');
    setOnlySuccessful(false);
  };
  
  return (
    <Card className="mb-3">
      <Card.Header as="h5">Filter Results</Card.Header>
      <Card.Body>
        {hasData ? (
          <Form>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date</Form.Label>
                  <Form.Select 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                  >
                    <option value="">All Dates</option>
                    {availableDates.map((date, index) => (
                      <option key={index} value={date}>{date}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Terminal ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by terminal ID"
                    value={terminalId}
                    onChange={(e) => setTerminalId(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Payment ID</Form.Label>
                  <Form.Control 
                    type="text" 
                    placeholder="Filter by payment ID"
                    value={paymentId}
                    onChange={(e) => setPaymentId(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Time Difference (seconds)</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Minimum time (seconds)"
                    value={timeDifference}
                    onChange={(e) => setTimeDifference(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Filter transactions above this threshold
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Show only successful payments (requires uploaded success file)" 
                checked={onlySuccessful}
                onChange={(e) => setOnlySuccessful(e.target.checked)}
                disabled={!hasData}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <button 
                type="button" 
                className="btn btn-outline-secondary" 
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </Form>
        ) : (
          <div className="alert alert-secondary">
            Upload payment data to enable filtering
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default FilterPanel;