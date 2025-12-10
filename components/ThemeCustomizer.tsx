import React, { useState } from 'react';
import { generateOrEditImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/imageUtils';
import { Loader2, Wand2, Upload, Image as ImageIcon, X } from 'lucide-react';

interface ThemeCustomizerProps {
  currentBackground: string | null;
  onThemeUpdate: (newBackground: string) => void;
  onClose: () => void;
}

const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ currentBackground, onThemeUpdate, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localImage, setLocalImage] = useState<string | null>(currentBackground);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // If we have a local image, we use it as a reference for editing
      const result = await generateOrEditImage({
        prompt: prompt,
        inputImageBase64: localImage || undefined
      });
      setLocalImage(result);
      onThemeUpdate(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setLocalImage(base64);
        onThemeUpdate(base64); // Preview immediately
      } catch (err) {
        setError("Failed to load file");
      }
    }
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Arena Designer
        </h2>
        
        <p className="text-slate-400 text-sm mb-6">
          Use AI to generate or edit your game background. Upload an image to start, or describe what you want!
        </p>

        {/* Preview Area */}
        <div className="mb-6 aspect-video rounded-lg overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700 relative group">
          {localImage ? (
            <img 
              src={localImage} 
              alt="Background preview" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <ImageIcon size={48} className="mb-2 opacity-50" />
              <p>No background selected</p>
            </div>
          )}
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin h-8 w-8 text-pink-500 mx-auto mb-2" />
                <p className="text-white font-medium">Magic in progress...</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors rounded-lg border border-slate-600 p-3 flex items-center justify-center gap-2 text-sm font-medium">
              <Upload size={16} />
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
            {localImage && (
              <button 
                onClick={() => { setLocalImage(null); onThemeUpdate(''); }}
                className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-900 rounded-lg hover:bg-red-900/50"
              >
                Clear
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">AI Prompt</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={localImage ? "e.g., 'Add a cyberpunk neon glow', 'Make it sketchy'" : "e.g., 'A futuristic stadium in space', 'Retro arcade grid'"}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder:text-slate-600"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                <Wand2 size={18} />
                {localImage ? 'Edit' : 'Create'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
