import React from 'react';

interface UploaderProps {
  title: string;
  file: File | null;
  setFile: (file: File | null) => void;
  subTitle?: string;
}

export const Uploader: React.FC<UploaderProps> = ({ title, file, setFile, subTitle }) => (
  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
    <h3 className="font-semibold mb-2">{title}</h3>
    {subTitle && <p className="text-xs text-slate-400 mb-2">{subTitle}</p>}
    <input 
      type="file" 
      accept="image/*" 
      capture="environment"
      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
      onChange={(e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
      }}
    />
    {file && <p className="text-xs text-green-400 mt-2">Loaded: {file.name}</p>}
  </div>
);
