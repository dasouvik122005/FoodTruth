const API_BASE = 'http://localhost:8000/api';

export const fetchSamples = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE}/samples`);
  if (!res.ok) throw new Error("Failed to load samples");
  const data = await res.json();
  return data;
};

export const auditDemo = async (sampleName: string): Promise<any> => {
  const formData = new FormData();
  formData.append('payload_name', sampleName);
  const res = await fetch(`${API_BASE}/audit/demo`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Audit failed');
  return data;
};

export const auditUpload = async (apiKey: string, frontImage: File | null, backImage: File | null): Promise<any> => {
  const formData = new FormData();
  if (frontImage) formData.append('front_image', frontImage);
  if (backImage) formData.append('back_image', backImage);
  
  // Sanitize API key to remove trailing whitespace, newlines, or hidden unicode characters 
  // that can cause fetch to throw the "non ISO-8859-1 code point" error
  const sanitizedApiKey = apiKey.trim().replace(/[^\x20-\x7E]/g, '');

  const headers: Record<string, string> = {};
  if (sanitizedApiKey) {
    headers['x-api-key'] = sanitizedApiKey;
  }

  const res = await fetch(`${API_BASE}/audit/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  
  if (res.status === 422) {
    const data = await res.json();
    throw { status: 422, detail: data.detail };
  }
  
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Audit failed');
  return data;
};
