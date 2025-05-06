import React from 'react';
import { Table, Card, Accordion, Badge } from 'react-bootstrap';

const ResultTable = ({ results }) => {
  // Get status values from first result (if available)
  const fromStatus = results && results.length > 0 ? results[0].fromStatus : 2;
  const toStatus = results && results.length > 0 ? results[0].toStatus : 8;

  // Group results by payment ID
  const groupedResults = {};
  results.forEach(item => {
    if (!groupedResults[item.paymentId]) {
      groupedResults[item.paymentId] = [];
    }
    groupedResults[item.paymentId].push(item);
  });

  // Convert grouped results to array for rendering and sort by payment ID
  const paymentGroups = Object.keys(groupedResults)
    .sort()
    .map(paymentId => ({
      paymentId,
      items: groupedResults[paymentId]
    }));

  return (
    <div>
      <div className="mt-4">
        {results.length > 0 ? (
          <>
            <h5 className="mb-3">
              Payment Transaction Results 
              <Badge bg="primary" className="ms-2">
                {paymentGroups.length} Payment IDs, {results.length} Transactions
              </Badge>
            </h5>
            <Accordion defaultActiveKey="0">
              {paymentGroups.map((group, groupIndex) => {
                // Check if any time difference is above 10 seconds
                const hasLongTransaction = group.items.some(item => 
                  parseFloat(item.timeDifferenceMs) > 10000
                );
                
                return (
                  <Card key={groupIndex} className={`mb-2 ${hasLongTransaction ? 'border-danger' : ''}`}>
                    <Accordion.Item eventKey={groupIndex.toString()}>
                      <Accordion.Header>
                        <div className="d-flex w-100 justify-content-between align-items-center">
                          <div>
                            <strong>Payment ID: {group.paymentId}</strong> 
                            <span className="ms-3 text-muted">
                              ({group.items.length} transaction{group.items.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          {hasLongTransaction && (
                            <Badge bg="danger">Processing Time 10s</Badge>
                          )}
                        </div>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="table-responsive">
                          <Table striped bordered hover>
                            <thead className="table-primary">
                              <tr>
                                <th className="text-center">Status {fromStatus} Timestamp</th>
                                <th className="text-center">Status {toStatus} Timestamp</th>
                                <th className="text-center">Time Difference (ms)</th>
                                <th className="text-center">Terminal ID</th>
                                <th className="text-center">Merchant ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((item, itemIndex) => {
                                // Check if the time difference is above 10 seconds (10000 ms)
                                const isHighlighted = parseFloat(item.timeDifferenceMs) > 10000;
                                
                                return (
                                  <tr 
                                    key={itemIndex} 
                                    style={isHighlighted ? { backgroundColor: '#ffcccc' } : {}}
                                  >
                                    <td>{item.fromStatusTime}</td>
                                    <td>{item.toStatusTime}</td>
                                    <td style={isHighlighted ? { fontWeight: 'bold', color: 'red' } : {}}>
                                      {item.timeDifferenceMs}
                                    </td>
                                    <td>{item.terminalId || 'N/A'}</td>
                                    <td>{item.merchantId || 'N/A'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Card>
                );
              })}
            </Accordion>
          </>
        ) : (
          <div className="alert alert-info">
            No payment transactions found with both status {fromStatus} and status {toStatus}.
            <hr />
            <p className="mb-0">
              Make sure your CSV file contains the correct payment data format with status values in the eventBody field.
            </p>
          </div>
        )}
      </div>
      
      {results.length > 0 && (
        <div className="text-muted mt-2">
          Found {results.length} payment transactions across {paymentGroups.length} payment IDs
        </div>
      )}
    </div>
  );
};

export default ResultTable;