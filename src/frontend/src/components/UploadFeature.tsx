import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadFeature: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false); // To control visibility

  // Handle file upload through drag and drop
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      console.log('File uploaded:', acceptedFiles[0]);
    }
  };

  // Setting up react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/gzip': ['.tar.gz']
    }, // Accept only npm package formats
  });

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      {/* Upload Button to reveal the input options */}
      <button
        type="button"
        style={{ padding: '10px 20px', marginBottom: '20px' }}
        onClick={() => setShowOptions(!showOptions)}
      >
        Upload
      </button>

      {/* Show URL or Drag-and-Drop options if the upload button is clicked */}
      {showOptions && (
        <div>
          {/* URL Input */}
          <div>
            <label htmlFor="url">Enter URL:</label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a URL"
              style={{ width: '100%', padding: '10px', marginTop: '10px' }}
            />
          </div>

          {/* Drag and Drop for file */}
          <div
            {...getRootProps()}
            style={{
              border: '2px dashed #ccc',
              padding: '20px',
              textAlign: 'center',
              marginTop: '20px',
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the npm package here...</p>
            ) : (
              <p>Upload an npm-style package (.zip or .tar.gz) here</p>
            )}
          </div>

          {/* Display the file name */}
          {file && (
            <div style={{ marginTop: '10px' }}>
              <strong>File:</strong> {file.name}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            style={{ marginTop: '20px', padding: '10px 20px' }}
            onClick={() => {
              console.log('URL:', url);
              if (file) {
                console.log('File ready to be processed:', file.name);
              }
            }}
          >
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadFeature;
