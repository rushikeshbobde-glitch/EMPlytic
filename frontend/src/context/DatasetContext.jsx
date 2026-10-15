import { createContext, useContext, useState, useEffect, useCallback } from "react";

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => {
    const saved = localStorage.getItem("emplytic_selected_dataset_id");
    return saved ? parseInt(saved, 10) : null;
  });
  const [loading, setLoading] = useState(true);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const res = await fetch(`${apiUrl}/api/datasets`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setDatasets(json.data);

        // Determine active dataset ID
        const savedId = localStorage.getItem("emplytic_selected_dataset_id");
        const parsedSavedId = savedId ? parseInt(savedId, 10) : null;
        const exists = json.data.some(d => d.id === parsedSavedId);

        if (exists && parsedSavedId) {
          setSelectedDatasetId(parsedSavedId);
        } else if (json.data.length > 0) {
          const firstId = json.data[0].id;
          setSelectedDatasetId(firstId);
          localStorage.setItem("emplytic_selected_dataset_id", firstId.toString());
        } else {
          setSelectedDatasetId(null);
          localStorage.removeItem("emplytic_selected_dataset_id");
        }
      }
    } catch (err) {
      console.warn("Could not fetch datasets list:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const selectDataset = useCallback((id) => {
    const numericId = typeof id === "string" ? parseInt(id, 10) : id;
    setSelectedDatasetId(numericId);
    if (numericId) {
      localStorage.setItem("emplytic_selected_dataset_id", numericId.toString());
    } else {
      localStorage.removeItem("emplytic_selected_dataset_id");
    }
  }, []);

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId) || (datasets.length > 0 ? datasets[0] : null);

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        selectedDatasetId: selectedDataset?.id || selectedDatasetId,
        selectedDataset,
        loading,
        selectDataset,
        refreshDatasets: fetchDatasets
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}
