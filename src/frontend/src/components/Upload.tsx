// src/frontend/src/components/Upload.tsx
import React, { useState, useEffect } from 'react';

const Upload: React.FC = () => {
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  // Function to handle the submission
  const handleSubmit = async () => {
    const url = "https://github.com/nullivex/nodist"; // Hardcoded URL
    try {
      const response = await fetch(`http://localhost:3000/upload/${encodeURIComponent(url)}`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.text(); // Assuming the response is plain text
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
  };

  // Use effect to trigger handleSubmit when the component mounts
  useEffect(() => {
    handleSubmit();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      {/* Display the response message */}
      {responseMessage && (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default Upload;