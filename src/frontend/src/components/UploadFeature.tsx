import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';

const UploadFeature: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false); // To control visibility
  const [responseMessage, setResponseMessage] = useState<string | null>(null); // State to store response message

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

  // Function to handle the submission
  const handleSubmit = async () => {
    if (url) {
      try {
        const response = await fetch(`https://localhost:3000/upload/${encodeURIComponent(url)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setResponseMessage(`Package uploaded successfully with score: ${data}`);
          console.log('Package uploaded successfully:', data);
        } else {
          const errorText = await response.text();
          setResponseMessage(`Error uploading package: ${errorText}`);
          console.error('Error uploading package:', response.statusText);
        }
      } catch (error) {
        setResponseMessage(`Error uploading package: ${(error as Error).message}`);
        console.error('Error uploading package:', error);
      }
    } else {
      setResponseMessage('URL is required');
      console.error('URL is required');
    }
  };

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
            onClick={handleSubmit}
          >
            Submit
          </button>
        </div>
      )}

      {/* Display the response message */}
      {responseMessage && (
        <div style={{ marginTop: '20px', color: 'blue' }}>
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default UploadFeature;