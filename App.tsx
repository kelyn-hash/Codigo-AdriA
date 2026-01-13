
import React, { useState, useRef, useCallback } from 'react';
import { Play, Square, Loader2, Volume2, Mic2, Sunset, Info } from 'lucide-react';
import { generateCaribbeanSpeech, VoiceName } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audio';

const VOICES: { name: VoiceName; label: string; desc: string }[] = [
  { name: 'Kore', label: 'Island Warmth', desc: 'Deep and resonant' },
  { name: 'Puck', label: 'Breezy Spirit', desc: 'Light and energetic' },
  { name: 'Charon', label: 'Coastal Wisdom', desc: 'Mature and steady' },
  { name: 'Fenrir', label: 'Tropical Depth', desc: 'Bold and clear' },
  { name: 'Zephyr', label: 'Ocean Mist', desc: 'Smooth and melodic' },
];

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) {
        // Already stopped or not started
      }
      sourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text first.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    stopPlayback();

    try {
      const base64Audio = await generateCaribbeanSpeech({ 
        text, 
        voiceName: selectedVoice 
      });

      if (!base64Audio) {
        throw new Error("Failed to generate audio data.");
      }

      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000
        });
      }

      const ctx = audioContextRef.current;
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
      };

      sourceRef.current = source;
      source.start();
      setIsPlaying(true);
    } catch (err: any) {
      console.error("TTS Error:", err);
      setError(err.message || "An error occurred during speech generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-yellow-400 rounded-2xl shadow-lg shadow-yellow-400/20 mr-4">
            <Volume2 className="w-8 h-8 text-slate-900" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white font-outfit tracking-tight">
            Caribbean <span className="text-yellow-400">Voice</span> Gen
          </h1>
        </div>
        <p className="text-slate-400 text-lg max-w-xl mx-auto">
          Convert your text into high-fidelity Caribbean English speech using Gemini's advanced TTS technology.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl">
            <label className="block text-slate-300 font-medium mb-3 ml-1">
              Message to Speak
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="E.g. Wah gwan! Hope you have a beautiful day in paradise..."
              className="w-full h-48 bg-slate-900/50 text-white border border-slate-700 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all resize-none text-lg leading-relaxed placeholder:text-slate-600"
            />
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-bold text-lg transition-all transform active:scale-95 ${
                  isGenerating || !text.trim()
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-yellow-400 text-slate-900 hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/20'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Mic2 className="w-6 h-6" />
                    Generate Caribbean Voice
                  </>
                )}
              </button>

              {isPlaying && (
                <button
                  onClick={stopPlayback}
                  className="flex items-center justify-center gap-2 py-4 px-8 rounded-2xl font-bold text-lg bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
                >
                  <Square className="w-6 h-6 fill-current" />
                  Stop
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
          
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4 flex items-center gap-4 text-slate-400">
            <Sunset className="w-10 h-10 text-orange-400 opacity-80" />
            <p className="text-sm">
              <span className="text-orange-300 font-semibold block">Styling Hint:</span>
              We prepend "Say in a rich, warm Caribbean English accent" to your text to ensure the model captures the right cadence and tone.
            </p>
          </div>
        </div>

        {/* Right Column: Voice Selection */}
        <div className="lg:col-span-4">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 shadow-2xl sticky top-8">
            <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
              <Sunset className="w-5 h-5 text-yellow-400" />
              Choose Voice
            </h3>
            <div className="space-y-3">
              {VOICES.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setSelectedVoice(v.name)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 group ${
                    selectedVoice === v.name
                      ? 'bg-yellow-400/10 border-yellow-400/50 ring-1 ring-yellow-400/50'
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold ${selectedVoice === v.name ? 'text-yellow-400' : 'text-slate-200'}`}>
                      {v.label}
                    </span>
                    {selectedVoice === v.name && (
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                    {v.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <footer className="mt-20 text-center border-t border-slate-800 pt-10">
        <div className="inline-flex items-center gap-2 text-slate-500 font-medium">
          <Sunset className="w-4 h-4" />
          Powered by Gemini 2.5 Flash TTS
        </div>
      </footer>
    </div>
  );
};

export default App;
