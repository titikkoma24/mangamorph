import React, { useState, useEffect } from 'react';
import UploadZone from './components/UploadZone';
import { transformImageToManga, fileToGenerativePart } from './services/geminiService';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Helper to determine aspect ratio
  const getAspectRatio = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        URL.revokeObjectURL(img.src);
        
        // Supported by Gemini: 1:1, 3:4, 4:3, 9:16, 16:9
        const ratios = [
          { id: "1:1", val: 1 },
          { id: "3:4", val: 0.75 },
          { id: "4:3", val: 1.333 },
          { id: "9:16", val: 0.5625 },
          { id: "16:9", val: 1.777 }
        ];
        
        // Find closest ratio
        const closest = ratios.reduce((prev, curr) => {
          return (Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev);
        });
        
        resolve(closest.id);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection
  const handleFileSelected = async (file: File) => {
    setAppState(AppState.IDLE);
    setErrorMessage('');
    setGeneratedImage(null);
    setOriginalFile(file);
    
    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl);
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
    };
  }, [originalImage]);

  const handleGenerate = async () => {
    if (!originalFile) return;

    setAppState(AppState.PROCESSING);
    setErrorMessage('');
    // Clear previous result if regenerating
    if (appState === AppState.SUCCESS) {
      setGeneratedImage(null); 
    }

    try {
      const base64Data = await fileToGenerativePart(originalFile);
      const mimeType = originalFile.type;
      
      // Calculate best aspect ratio to prevent cropping
      const aspectRatio = await getAspectRatio(originalFile);

      const resultImage = await transformImageToManga(base64Data, mimeType, aspectRatio);
      setGeneratedImage(resultImage);
      setAppState(AppState.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      
      setErrorMessage(error.message || "Something went wrong during transformation.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setOriginalImage(null);
    setOriginalFile(null);
    setGeneratedImage(null);
    setErrorMessage('');
  };

  // -------------------------------------------------------------------------
  // RENDER: Main App
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white">
      {/* Header */}
      <header className="py-6 px-4 border-b border-slate-800 bg-[#1e293b]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-4xl">✨</span>
            <h1 className="text-3xl comic-font tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
              MangaMorph AI
            </h1>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">
            Powered by Gemini
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Intro Text */}
        {appState === AppState.IDLE && !originalImage && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3 text-slate-200">Turn Reality into Anime</h2>
            <p className="text-slate-400">
              Upload a realistic photo and watch our AI transform it into a stunning high-quality manga illustration. 
              Perfect for stylized portraits and character art.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!originalImage && (
          <div className="max-w-xl mx-auto">
            <UploadZone onFileSelected={handleFileSelected} />
          </div>
        )}

        {/* Workspace */}
        {originalImage && (
          <div className="flex flex-col gap-8 animate-fade-in">
            
            {/* Controls */}
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
                disabled={appState === AppState.PROCESSING}
              >
                ← Upload New Image
              </button>

              <button
                 onClick={handleGenerate}
                 disabled={appState === AppState.PROCESSING}
                 className={`
                   px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2
                   ${appState === AppState.PROCESSING 
                     ? 'bg-slate-600 cursor-not-allowed opacity-70' 
                     : 'bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white shadow-pink-500/25'
                   }
                 `}
               >
                 {appState === AppState.PROCESSING ? (
                   <>
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                     <span>Drawing...</span>
                   </>
                 ) : appState === AppState.SUCCESS ? (
                   <>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                     </svg>
                     <span>Regenerate</span>
                   </>
                 ) : (
                   'Manga-fy It!'
                 )}
               </button>
            </div>

            {/* Error Message */}
            {appState === AppState.ERROR && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-lg text-center">
                <p className="font-semibold">Error</p>
                <p>{errorMessage}</p>
                {errorMessage.includes("API Key") && (
                   <div className="mt-2 text-sm text-slate-400">
                     Check your Vercel Project Settings {'>'} Environment Variables.
                   </div>
                )}
              </div>
            )}

            {/* Comparison Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Original */}
              <div className="relative group">
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-white uppercase tracking-wider z-10">
                  Original
                </div>
                <div className="rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-2xl aspect-[3/4] md:aspect-auto h-full min-h-[400px]">
                   <img 
                    src={originalImage} 
                    alt="Original" 
                    className="w-full h-full object-contain bg-[#1a202c]"
                  />
                </div>
              </div>

              {/* Generated Result */}
              <div className="relative">
                {appState === AppState.SUCCESS && generatedImage ? (
                  <div className="relative h-full group">
                     <div className="absolute top-4 left-4 bg-pink-600/80 backdrop-blur-md px-3 py-1 rounded-md text-xs font-bold text-white uppercase tracking-wider z-10 shadow-lg">
                      Manga Version
                    </div>
                    {/* Changed bg to white to match output better and show crop issues clearly */}
                    <div className="rounded-xl overflow-hidden border-2 border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.3)] h-full min-h-[400px] bg-white">
                      <img 
                        src={generatedImage} 
                        alt="Manga Result" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                     {/* Download Button */}
                     <a 
                      href={generatedImage} 
                      download="manga-morph-result.png"
                      className="absolute bottom-6 right-6 bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download
                    </a>
                  </div>
                ) : (
                  // Placeholder State
                  <div className="h-full min-h-[400px] rounded-xl border-2 border-slate-700 border-dashed bg-slate-800/30 flex flex-col items-center justify-center text-slate-500">
                    {appState === AppState.PROCESSING ? (
                       <div className="flex flex-col items-center gap-4 animate-pulse">
                         <div className="w-16 h-16 rounded-full bg-slate-700"></div>
                         <div className="w-48 h-4 bg-slate-700 rounded"></div>
                         <div className="w-32 h-4 bg-slate-700 rounded"></div>
                       </div>
                    ) : (
                      <div className="text-center p-8">
                        <span className="text-6xl opacity-20 block mb-4">🎨</span>
                        <p>Result will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-500 text-sm border-t border-slate-800">
        <p>&copy; {new Date().getFullYear()} MangaMorph AI. Create Art.</p>
      </footer>
    </div>
  );
};

export default App;