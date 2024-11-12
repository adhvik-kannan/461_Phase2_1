// src/frontend/src/components/Search.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Interface for the search query parameters.
 */
interface PackagesQuery {
  searchTerm: string;
}

/**
 * Interface for a Package object.
 */
interface Package {
  name: string;
  url: string;
  score: string;
  version: string;
  prev_versions: string[];
}

const Search: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();

  // Parse the query parameter from the URL
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get('query') || '';

  useEffect(() => {
    const fetchPackages = async () => {
      if (!searchTerm.trim()) {
        setPackages([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/packages?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
          throw new Error(`Error fetching packages: ${response.statusText}`);
        }
        const data: Package[] = await response.json();
        setPackages(data);
      } catch (err: any) {
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [searchTerm]);

  return (
    <div>
      <h2>Search Results for "{searchTerm}"</h2>
      {loading && <p>Loading packages...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <>
          {packages.length > 0 ? (
            <ul>
              {packages.map((pkg) => (
                <li key={pkg.name} style={{ marginBottom: '20px' }}>
                  <a href={pkg.url} target="_blank" rel="noopener noreferrer">
                    <strong>{pkg.name}</strong>
                  </a>
                  <p>Score: {pkg.score}</p>
                  <p>Version: {pkg.version}</p>
                  {pkg.prev_versions.length > 0 && (
                    <p>Previous Versions: {pkg.prev_versions.join(', ')}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>No packages found matching your search.</p>
          )}
        </>
      )}
    </div>
  );
};

export default Search;