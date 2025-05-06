import React, { useRef } from 'react';
import { Form, Button } from 'react-bootstrap';

const FileUploader = ({ onFileUpload, label, accept, isMain }) => {
  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("File selected:", file.name); // Debug log
      onFileUpload(file);
      // Reset the file input
      e.target.value = null;
    }
  };

  return (
    <div className="file-uploader">
      <Form.Group>
        <Form.Label>{label}</Form.Label>
        
        <div className="d-flex">
          <Form.Control
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={accept}
            className="d-none"
          />
          <Button 
            variant={isMain ? "primary" : "outline-secondary"} 
            onClick={handleButtonClick}
            className="w-100"
          >
            Select File
          </Button>
        </div>
        
        <Form.Text className="text-muted mt-2">
          {isMain 
            ? "CSV data should contain: id, terminal id, event, event body, merchant id, payment id, reference id, timestamp, created at"
            : "CSV data should contain Payment ID column for successful payments"
          }
        </Form.Text>
      </Form.Group>
    </div>
  );
};

export default FileUploader;