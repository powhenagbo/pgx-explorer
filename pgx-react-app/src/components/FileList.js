import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';

const FileList = ({ files, selectedFile, onSelectFile, onClear }) => {
    return (
        <Card className="shadow-sm border-0">
            <Card.Header className="bg-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">📁 Available Data</h5>
                    {selectedFile && (
                        <Badge bg="primary" pill className="px-3">
                            {selectedFile.name}
                        </Badge>
                    )}
                </div>
            </Card.Header>
            <ListGroup variant="flush">
                {files.map((file) => (
                    <ListGroup.Item
                        key={file.id}
                        action
                        active={selectedFile?.id === file.id}
                        onClick={() => onSelectFile(file)}
                        className="py-3"
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="d-flex align-items-center">
                            <span className="fs-4 me-3">{file.icon || (file.id === 1 ? '🧬' : '📚')}</span>
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="fw-semibold">{file.name}</div>
                                    <Badge bg="secondary" pill>{file.recordCount || '?'}</Badge>
                                </div>
                                <small className="text-muted d-block">{file.description}</small>
                                <small className="text-muted">
                                    {file.columns?.length || 0} columns
                                </small>
                            </div>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            {selectedFile && (
                <Card.Footer className="bg-white py-2">
                    <button 
                        className="btn btn-outline-secondary btn-sm w-100"
                        onClick={onClear}
                    >
                        ← Clear Selection
                    </button>
                </Card.Footer>
            )}
        </Card>
    );
};

export default FileList;