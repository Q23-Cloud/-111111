import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { TreeState } from './types';
import { analyzeGesture } from './services/geminiService';

const App = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [status, setStatus] = useState<string>("Initializing Camera...");
  const [debug, setDebug] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Use a ref to track if we should keep processing to prevent memory leaks/race conditions
  const isRunningRef = useRef(true);
  
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            facingMode: 'user',
            width: { ideal: 320 }, // Reduce requested resolution to save bandwidth/processing
            height: { ideal: 240 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStatus("Camera Active. Raise your hand!");
        // Start the recursive loop
        processLoop();
      }
    } catch (err) {
      console.error(err);
      setStatus("Camera Error. Please allow permissions.");
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return null;

    // Draw small for performance and to reduce token usage
    const width = 240; 
    const height = 180;

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.drawImage(videoRef.current, 0, 0, width, height);
    return canvasRef.current.toDataURL('image/jpeg', 0.6);
  }, []);

  const processLoop = async () => {
    if (!isRunningRef.current) return;

    const base64 = captureFrame();
    let nextDelay = 2000; // Default poll (2s) to be safe with rate limits

    if (base64) {
      setStatus("Analyzing Gesture...");
      const result = await analyzeGesture(base64);
      
      if (result.error) {
          setStatus("API Limit/Error. Retrying in 5s...");
          setDebug("Backing off (Rate Limit)");
          nextDelay = 5000; // Backoff significantly on error
      } else {
          setTreeState(result.state);
          setHandPosition({ x: -result.handPosition.x, y: result.handPosition.y });
          setStatus(result.state === TreeState.CHAOS ? "✨ UNLEASHED! ✨" : "🎄 FORMED 🎄");
          setDebug(`Pos: ${result.handPosition.x.toFixed(2)}, ${result.handPosition.y.toFixed(2)}`);
          // If successful, poll at a reasonable interactive rate (1.5s)
          nextDelay = 1500;
      }
    }

    if (isRunningRef.current) {
        setTimeout(processLoop, nextDelay);
    }
  };

  useEffect(() => {
    isRunningRef.current = true;
    startVideo();
    return () => {
      isRunningRef.current = false;
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-black">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Scene treeState={treeState} handPosition={handPosition} />
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <h1 className="text-4xl font-serif text-yellow-400 tracking-wider drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
          GRAND CHRISTMAS
        </h1>
        <div className="mt-2 text-emerald-300 text-sm font-mono tracking-widest uppercase border-l-2 border-yellow-500 pl-3">
            Interact with Gestures
        </div>
        <div className="mt-4 bg-black/50 backdrop-blur-md p-4 rounded border border-yellow-500/30 text-white max-w-sm">
           <p className="font-bold text-yellow-200">Instructions:</p>
           <ul className="list-disc pl-5 text-sm space-y-1 mt-1 text-gray-300">
               <li>🖐️ <span className="text-white font-bold">Open Hand:</span> Explode the tree (Chaos)</li>
               <li>✊ <span className="text-white font-bold">Fist/Closed:</span> Reform the tree</li>
               <li>Move hand Left/Right/Up/Down to control camera angle.</li>
           </ul>
        </div>
        
        <div className="mt-4">
            <span className={`px-3 py-1 rounded text-xs font-bold ${treeState === TreeState.CHAOS ? 'bg-red-900 text-red-100' : 'bg-green-900 text-green-100'}`}>
                STATUS: {status}
            </span>
            <div className="text-xs text-gray-500 mt-1 font-mono">{debug}</div>
        </div>
      </div>

      {/* Hidden processing elements */}
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Decorative Border */}
      <div className="absolute inset-0 border-[10px] border-yellow-600/20 pointer-events-none z-20" />
      <div className="absolute bottom-4 right-4 z-10 text-yellow-600/40 text-xs font-serif italic">
        Powered by Gemini 2.5 Flash
      </div>
    </div>
  );
};

export default App;