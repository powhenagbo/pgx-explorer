import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';

const cardStyle = {
  border: '1px solid #e5e7eb',
  borderRadius: 20,
  boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
};

const FileList = ({ files, selectedFile, onSelectFile, onClear }) => {
  return (
    <Card className="border-0" style={cardStyle}>
      <Card.Header className="bg-white py-3" style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>Available Data</h5>
          {selectedFile && (
            <Badge pill style={{ background: '#e2e8f0', color: '#0f172a' }}>
              {selectedFile.name}
            </Badge>
          )}
        </div>
      </Card.Header>
      <ListGroup variant="flush">
        {files.map((file) => {
          const isSelected = selectedFile?.id === file.id;

          return (
            <ListGroup.Item
              key={file.id}
              action
              active={false}
              onClick={() => onSelectFile(file)}
              className="py-3"
              style={{
                cursor: 'pointer',
                background: isSelected ? '#eff6ff' : 'white',
                borderLeft: isSelected ? '4px solid #1e3a8a' : '4px solid transparent',
              }}
            >
              <div className="d-flex align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="fw-semibold" style={{ color: '#0f172a' }}>{file.name}</div>
                    <Badge pill style={{ background: '#e2e8f0', color: '#0f172a' }}>{file.recordCount || '?'}</Badge>
                  </div>
                  <small className="d-block mt-1" style={{ color: '#64748b' }}>{file.description}</small>
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
      {selectedFile && (
        <Card.Footer className="bg-white py-2" style={{ borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
          <button
            className="btn btn-sm w-100"
            onClick={onClear}
            style={{
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              background: 'white',
              color: '#0f172a',
              fontWeight: 600,
            }}
          >
            Clear Selection
          </button>
        </Card.Footer>
      )}
    </Card>
  );
};

export default FileList;
