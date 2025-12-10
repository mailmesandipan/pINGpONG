import React, { useState } from 'react';
import PongGame from './components/PongGame';
import ThemeCustomizer from './components/ThemeCustomizer';
import { Palette } from 'lucide-react';

const App: React.FC = () => {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [background, setBackground] = useState<string | null>(null);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white">
      {/* Main Game Layer */}
      <PongGame theme={{ backgroundImage: background }} />

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowCustomizer(true)}
          className="bg-slate-800/80 hover:bg-slate-700 backdrop-blur text-white p-3 rounded-full border border-slate-600 shadow-lg transition-all hover:scale-105 group"
          title="Customize Arena"
        >
          <Palette className="w-6 h-6 text-pink-400 group-hover:text-pink-300" />
        </button>
      </div>

      {/* Customizer Modal */}
      {showCustomizer && (
        <ThemeCustomizer 
          currentBackground={background} 
          onThemeUpdate={setBackground} 
          onClose={() => setShowCustomizer(false)} 
        />
      )}
      
      {/* Watermark / Credits */}
      <div className="absolute bottom-4 right-4 z-0 text-slate-600 text-xs pointer-events-none opacity-50">
        Powered by Gemini 2.5
      </div>
    </div>
  );
};

export default App;
