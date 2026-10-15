const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";


export async function analyzeEDA(file) {

  const formData = new FormData();

  formData.append("file", file);


  const response = await fetch(
    `${API_URL}/api/eda/analyze`,
    {
      method: "POST",
      body: formData,
    }
  );


  if (!response.ok) {

    const error = await response.json();

    throw new Error(
      error.detail || "EDA analysis failed."
    );
  }


  return response.json();
}