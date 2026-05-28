import { useState, useEffect } from 'react';
import { Heart, Activity, Wind, Music, Smile, Meh, Frown, Mic, Sparkles, Volume2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MoodLog {
  id: string;
  timestamp: string;
  score: number;
  note: string;
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_key') || '');
  const [aiAnalysis, setAiAnalysis] = useState('Enter an API key to enable instant cognitive feedback loop.');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [moods, setMoods] = useState<MoodLog[]>(() => {
    const saved = localStorage.getItem('mind_check_moods');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentNote, setCurrentNote] = useState('');
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const [negativeThought, setNegativeThought] = useState('');
  const [positiveReframe, setPositiveReframe] = useState('');
  const [reframes, setReframes] = useState<{ original: string; positive: string }[]>(() => {
    const saved = localStorage.getItem('mind_check_reframes');
    return saved ? JSON.parse(saved) : [];
  });

  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold (Full)' | 'Exhale' | 'Hold (Empty)'>('Inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  useEffect(() => {
    localStorage.setItem('mind_check_moods', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem('mind_check_reframes', JSON.stringify(reframes));
  }, [reframes]);

  useEffect(() => {
    if (apiKey) localStorage.setItem('gemini_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    let interval: any;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathCount((prev) => {
          if (prev === 1) {
            setBreathPhase((current) => {
              if (current === 'Inhale') return 'Hold (Full)';
              if (current === 'Hold (Full)') return 'Exhale';
              if (current === 'Exhale') return 'Hold (Empty)';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathCount(4);
      setBreathPhase('Inhale');
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const speakText = (textToSpeak: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9; 
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceAssistant = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice interface speech engine not supported in this browser version.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      speakText("I am listening. Tell me what you are feeling right now.");
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      setIsListening(false);
      const transcript = event.results[0][0].transcript;
      if (!transcript) return;

      setIsAiLoading(true);
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `The following user is experiencing acute situational anxiety or stress. They said: "${transcript}". Act immediately as a calm, warm, grounding psychological first-aid assistant. Respond in 2 short, soothing sentences maximum. Provide breathing guidance or anchoring instructions. Keep language gentle and deeply clear.`;
        
        const response = await model.generateContent(prompt);
        const textResponse = response.response.text();
        setAiAnalysis(textResponse);
        speakText(textResponse);
      } catch (err) {
        setAiAnalysis("Failed to access Gemini. Verify your connection or API configuration matrix.");
      } finally {
        setIsAiLoading(false);
      }
    };

    recognition.start();
  };

  const triggerGeminiAnalysis = async () => {
    if (!apiKey || moods.length === 0) return;
    setIsAiLoading(true);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const logsSummary = moods.slice(0, 5).map(m => m.note).join(' | ');
      
      const prompt = `Analyze these recent subjective headspace data points: "${logsSummary}". Synthesize a professional, concise mental clarity metric. Give 2 highly applicable cognitive reframing suggestions in a bulleted format. Do not use markdown codeblocks.`;
      
      const response = await model.generateContent(prompt);
      setAiAnalysis(response.response.text());
    } catch (err) {
      setAiAnalysis("Error running data trend evaluation framework.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addMood = () => {
    if (selectedMood === null) return;
    const newLog: MoodLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toLocaleDateString('en-US', { hour: '2-digit', minute: '2-digit' }),
      score: selectedMood,
      note: currentNote,
    };
    setMoods([newLog, ...moods]);
    setCurrentNote('');
    setSelectedMood(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-2">
          <Heart className="text-emerald-500 fill-emerald-500" size={24} />
          <span className="font-bold text-xl text-slate-900 tracking-tight">MindCheck Dashboard</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="Paste Gemini API Key..." 
            className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 w-full sm:w-48 outline-none focus:border-emerald-500"
          />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900"><Smile size={20} className="text-emerald-600" /> Log Daily Mood</h2>
            <div className="flex justify-around mb-4">
              <button onClick={() => setSelectedMood(1)} className={`p-3 rounded-xl border transition ${selectedMood === 1 ? 'bg-red-50 border-red-500 scale-105' : 'border-slate-100'}`}><Frown className="text-red-500" size={32} /></button>
              <button onClick={() => setSelectedMood(2)} className={`p-3 rounded-xl border transition ${selectedMood === 2 ? 'bg-amber-50 border-amber-500 scale-105' : 'border-slate-100'}`}><Meh className="text-amber-500" size={32} /></button>
              <button onClick={() => setSelectedMood(3)} className={`p-3 rounded-xl border transition ${selectedMood === 3 ? 'bg-emerald-50 border-emerald-500 scale-105' : 'border-slate-100'}`}><Smile className="text-emerald-500" size={32} /></button>
            </div>
            <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="What's contributing to your mental headspace?..." className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50/50 resize-none h-20 mb-3 focus:outline-emerald-500" />
            <button onClick={addMood} disabled={selectedMood === null} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-xl text-sm transition disabled:opacity-50">Save Entry</button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mood Logs Tracker</h3>
            {moods.length === 0 ? <p className="text-slate-400 text-sm italic text-center mt-12">No logs recorded yet.</p> : (
              <div className="space-y-2">
                {moods.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                    <p className="text-xs text-slate-400">{log.timestamp}</p>
                    <p className="text-slate-700 font-medium">{log.note || "Logged general headspace shift"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[340px]">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900"><Activity size={20} className="text-violet-600" /> Cognitive Reframing</h2>
              <div className="space-y-3 mb-4">
                <input type="text" value={negativeThought} onChange={(e) => setNegativeThought(e.target.value)} placeholder="Automatic Negative Thought..." className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:border-violet-500" />
                <input type="text" value={positiveReframe} onChange={(e) => setPositiveReframe(e.target.value)} placeholder="Rational Positive Reframe..." className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50/50 outline-none focus:border-violet-500" />
                <button onClick={() => { if(negativeThought && positiveReframe) { setReframes([{original: negativeThought, positive: positiveReframe}, ...reframes]); setNegativeThought(''); setPositiveReframe(''); } }} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 rounded-xl text-sm transition">Log Transformation</button>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 flex-1 overflow-y-auto space-y-2 mt-2">
              {reframes.map((ref, idx) => (
                <div key={idx} className="p-3 bg-violet-50/50 border border-violet-100 rounded-xl text-xs">
                  <p className="text-slate-400 line-through">“{ref.original}”</p>
                  <p className="text-violet-700 font-semibold">➔ “{ref.positive}”</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[225px] flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-slate-900">
                <Sparkles size={20} className="text-amber-500 fill-amber-500" /> Gemini Insights
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[100px] whitespace-pre-line">
                {aiAnalysis}
              </p>
            </div>
            <button 
              onClick={triggerGeminiAnalysis} 
              disabled={!apiKey || moods.length === 0 || isAiLoading} 
              className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-xl text-sm transition disabled:opacity-40"
            >
              {isAiLoading ? 'Synthesizing Trends...' : 'Generate Cognitive Insight Report'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl text-white shadow-md shadow-rose-100 flex flex-col justify-between h-[230px]">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><Mic size={20} /> Anxiety Grounding Shield</h2>
              <p className="text-xs opacity-90 mt-2 leading-relaxed">
                Experiencing rapid breathing or rising anxiety? Hit the mic below. Speak freely, and Gemini will talk back instantly with supportive grounding guidance.
              </p>
            </div>
            <button 
              onClick={startVoiceAssistant}
              disabled={!apiKey || isListening || isAiLoading}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition ${isListening ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-white text-rose-600 hover:bg-rose-50'}`}
            >
              {isListening ? <Volume2 size={16} /> : <Mic size={16} />}
              {isListening ? 'Listening System Engaged...' : 'Activate Voice Assist'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 w-full justify-start"><Wind size={20} className="text-sky-600" /> Box Breathing Pacer</h2>
            <div className="my-6 relative flex items-center justify-center">
              <div className={`rounded-full border-4 flex items-center justify-center transition-all duration-[1000ms] w-28 h-28 ${isBreathingActive ? 'border-sky-500 bg-sky-50 scale-105' : 'border-slate-200'}`}>
                <div>
                  <p className="text-xs font-bold text-slate-900">{isBreathingActive ? breathPhase : 'Ready'}</p>
                  {isBreathingActive && <p className="text-lg font-black text-slate-700 mt-0.5">{breathCount}s</p>}
                </div>
              </div>
            </div>
            <button onClick={() => setIsBreathingActive(!isBreathingActive)} className="w-full bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 rounded-xl text-sm transition">
              {isBreathingActive ? 'Halt Loop' : 'Start Routine (4-4-4-4)'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900"><Music size={20} className="text-blue-600" /> Ambient Mixer</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-sm"><span>🌧️ Rainfall Audio</span><input type="range" className="w-24 accent-emerald-600" /></div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-sm"><span>🌲 Forest Sounds</span><input type="range" className="w-24 accent-emerald-600" /></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
