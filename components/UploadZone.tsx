import React, { useRef, useState } from 'react';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, WEBP).');
      return;
    }
    // Limit size to ~5MB roughly to be safe with base64 overhead
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Please upload an image under 5MB.');
      return;
    }
    onFileSelected(file);
  };

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-64 border-4 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300
        ${disabled ? 'opacity-50 cursor-not-allowed border-gray-600 bg-gray-800' : ''}
        ${isDragging 
          ? 'border-pink-500 bg-pink-500/10 scale-[1.02]' 
          : 'border-slate-600 hover:border-pink-400 hover:bg-slate-800/50 bg-slate-800/20'
        }
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      
      <div className="text-center p-6">
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mx-auto mb-4 ${isDragging ? 'text-pink-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-semibold text-slate-200">
          {isDragging ? 'Drop it like it\'s hot!' : 'Click or Drag Image Here'}
        </p>
        <p className="text-sm text-slate-400 mt-2">
          Supports JPG, PNG, WEBP (Max 5MB)
        </p>
      </div>
    </div>
  );
};

export default UploadZone;