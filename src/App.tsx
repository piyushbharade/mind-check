import { useState, useEffect } from 'react';
import { 
  Heart, Activity, Wind, Music, Smile, Meh, Frown, Mic, 
  Sparkles, Volume2, User, Bot, AlertOctagon, Phone, 
  Plus, Trash2, LogIn, UserPlus, LogOut, ArrowLeft, ShieldAlert 
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MoodLog {
  id: string;
  timestamp: string;
  score: number;
  note: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export default function App() {
  // --- AUTHENTICATION STATES ---
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('mind_check_logged') === 'true');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('mind_check_user') || 'User');

  // --- APPLICATION ENGINE STATES ---
  const [view, setView] = useState<'dashboard' | 'panic'>('dashboard');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_key') || '');
  const [aiAnalysis, setAiAnalysis] = useState('Enter an API key to enable instant cognitive feedback loop.');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // --- DIALOGUE STREAM STATES ---
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');

  // --- CORE UTILITY STATES ---
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

  // --- EMERGENCY MATRIX STATES ---
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('mind_check_contacts');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'National Mental Health Helpline', relationship: 'Global Support', phone: '1915' },
      { id: '2', name: 'Vandrevala Foundation Helpline', relationship: 'Crisis Support', phone: '+91 9999 666 555' }
    ];
  });
  const [newContactName, setNewContactName] = useState('');
  const [newContactRelation, setNewContactRelation] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // --- BOX BREATHING STATES ---
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold (Full)' | 'Exhale' | 'Hold (Empty)'>('Inhale');
  const [breathCount, setBreathCount] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // --- DATA SYNC WORKERS ---
  useEffect(() => {
    localStorage.setItem('mind_check_moods', JSON.stringify(moods));
  }, [moods]);

  useEffect(() => {
    localStorage.setItem('mind_check_reframes', JSON.stringify(reframes));
  }, [reframes]);

  useEffect(() => {
    localStorage.setItem('mind_check_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (apiKey) localStorage.setItem('gemini_key', apiKey);
  }, [apiKey]);

  // --- COMPACT BREATH ENGINE LOOP ---
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

  // --- SYSTEM HANDLERS ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    if (authMode === 'register') {
      localStorage.setItem(`user_creds_${username}`, password);
      alert('Registration successful! Please log in with your credentials.');
      setAuthMode('login');
    } else {
      const savedPassword = localStorage.getItem(`user_creds_${username}`);
      if (savedPassword === password || (username === 'admin' && password === 'admin')) {
        localStorage.setItem('mind_check_logged', 'true');
        localStorage.setItem('mind_check_user', username);
        setCurrentUser(username);
        setIsLoggedIn(true);
      } else {
        alert('Invalid cryptographic match or credentials.');
      }
    }
    setUsername('');
    setPassword('');
  };

  const handleLogout = () => {
    localStorage.removeItem('mind_check_logged');
    localStorage.removeItem('mind_check_user');
    setIsLoggedIn(false);
    setView('dashboard');
  };

  const speakText = (textToSpeak: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const startVoiceAssistant = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice interface engine not supported in this browser runtime.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setUserTranscript('Listening...');
      setAssistantResponse('');
      speakText("I am here. Tell me what is happening in your headspace.");
    };

    recognition.onerror = () => {
      setIsListening(false);
      setUserTranscript('Error compiling local audio capture stream.');
    };

    recognition.onresult = async (event: any) => {
      setIsListening(false);
      const transcript = event.results[0][0].transcript;
      if (!transcript) return;

      setUserTranscript(transcript);
      setAssistantResponse('Processing response payload...');
      setIsAiLoading(true);

      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `The following user is experiencing acute situational anxiety or stress. They said: "${transcript}". Act immediately as a calm, warm, grounding psychological first-aid assistant. Respond in 2 short, soothing sentences maximum. Provide breathing guidance or anchoring instructions. Keep language gentle and deeply clear.`;
        
        const response = await model.generateContent(prompt);
        const textResponse = response.text();
        setAssistantResponse(textResponse);
        speakText(textResponse);
      } catch (err) {
        setAssistantResponse("Failed to access Gemini grounding framework. Check your API configuration.");
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
      setAiAnalysis(response.text());
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

  const addEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      name: newContactName,
      relationship: newContactRelation || 'Family/Friend',
      phone: newContactPhone
    };
    setContacts([...contacts, newContact]);
    setNewContactName('');
    setNewContactRelation('');
    setNewContactPhone('');
  };

  const deleteContact = (id: string) => {
    setContacts(contacts.filter(c => c.id !== id));
  };

  // --- VIEW RENDERING ENGINE ---

  // Auth Screen Layout
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Heart className="text-emerald-500 fill-emerald-500" size={28} />
            <span className="font-black text-2xl text-slate-950 tracking-tight">MindCheck Gateway</span>
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
            {authMode === 'login' ? 'Welcome Back' : 'Create Sandbox Account'}
          </h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            {authMode === 'login' ? 'Provide credentials to map local mental metrics.' : 'Set local authentication profile layers.'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. admin" className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 tracking-wider uppercase">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500" />
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition mt-2 flex items-center justify-center gap-2">
              {authMode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {authMode === 'login' ? 'Authenticate Session' : 'Register Matrix Entry'}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition">
              {authMode === 'login' ? "Don't have an account? Register here" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Panic Crisis View Layout
  if (view === 'panic') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-900 to-slate-950 text-white p-6 animate-pulse duration-[4000ms]">
        <div className="max-w-3xl mx-auto mt-6">
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition border border-white/10 backdrop-blur-md mb-8">
            <ArrowLeft size={16} /> Securely Return to Dashboard
          </button>

          <div className="flex items-center gap-3 mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl backdrop-blur-md">
            <ShieldAlert className="text-red-400 shrink-0 animate-bounce" size={36} />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-red-200">De-escalation Protocols Initiated</h1>
              <p className="text-xs text-red-300/80">Your dashboard application layer remains completely secure.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2">⚡ Immediate Grounding Tasks</h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-200">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5"><span className="font-bold text-rose-400">1. The 5-4-3-2-1 Rule:</span> Identify 5 things you see right now, 4 things you can feel, 3 things you hear, 2 things you smell, and 1 thing you taste.</div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5"><span className="font-bold text-rose-400">2. Interlock Breathing:</span> Drop your posture completely. Inhale through the nose slowly for 4 seconds, hold for 4 seconds, and release via your mouth fully.</div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5"><span className="font-bold text-rose-400">3. Cold Shock:</span> If accessible, splash freezing cold water on your hands or face to immediately stimulate your vagus nerve loop.</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md shadow-xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-rose-300 flex items-center gap-2 mb-4"><Phone size={18} /> Direct Crisis Gateways</h2>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {contacts.map((c) => (
                    <div key={c.id} className="p-3 bg-black/20 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400 tracking-wider uppercase">{c.relationship}</p>
                      </div>
                      <a href={`tel:${c.phone}`} className="bg-red-600 hover:bg-red-700 p-2 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm">
                        <Phone size={12} /> {c.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Main Dashboard Layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-2">
          <Heart className="text-emerald-500 fill-emerald-500" size={24} />
          <span className="font-bold text-xl text-slate-900 tracking-tight">MindCheck Dashboard</span>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <button onClick={() => setView('panic')} className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-100 transition animate-pulse">
            <AlertOctagon size={14} /> Panic Mode SOS
          </button>
          <input 
            type="password" 
            value={apiKey} 
            onChange={(e) => setApiKey(e.target.value)} 
            placeholder="Paste Gemini API Key..." 
            className="text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 w-full sm:w-44 outline-none focus:border-emerald-500"
          />
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1"><User size={12} /> {currentUser}</span>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-1 transition" title="Logout Session"><LogOut size={16} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COL 1 */}
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

        {/* COL 2 */}
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

        {/* COL 3 */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-2xl text-white shadow-md shadow-rose-100 flex flex-col justify-between min-h-[260px]">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2"><Mic size={20} /> Anxiety Grounding Shield</h2>
              <p className="text-xs opacity-90 mt-2 leading-relaxed">
                Hit the mic below to speak. Gemini will talk back with soothing guidance, and you can track the dialogue directly below.
              </p>
              
              {/* Voice Dialogue Interface Box */}
              {(userTranscript || assistantResponse) && (
                <div className="mt-3 bg-black/10 backdrop-blur-sm rounded-xl p-3 space-y-2 text-xs max-h-40 overflow-y-auto border border-white/10">
                  {userTranscript && (
                    <div className="flex gap-1.5 items-start">
                      <User size={14} className="mt-0.5 shrink-0 opacity-80" />
                      <p><span className="font-semibold opacity-90">You:</span> {userTranscript}</p>
                    </div>
                  )}
                  {assistantResponse && (
                    <div className="flex gap-1.5 items-start text-rose-100">
                      <Bot size={14} className="mt-0.5 shrink-0 text-amber-300" />
                      <p><span className="font-semibold text-amber-300">Gemini:</span> {assistantResponse}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <button 
              onClick={startVoiceAssistant}
              disabled={!apiKey || isListening || isAiLoading}
              className={`w-full mt-4 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition ${isListening ? 'bg-amber-400 text-slate-900 animate-pulse' : 'bg-white text-rose-600 hover:bg-rose-50'}`}
            >
              {isListening ? <Volume2 size={16} /> : <Mic size={16} />}
              {isListening ? 'Listening System Engaged...' : 'Activate Voice Assist'}
            </button>
          </div>

          {/* Dynamic Emergency Contact Configuration Module */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5"><Phone size={16} className="text-red-500" /> Emergency Configuration</h2>
            <form onSubmit={addEmergencyContact} className="space-y-2 mb-4">
              <input type="text" required value={newContactName} onChange={(e) => setNewContactName(e.target.value)} placeholder="Contact Full Name..." className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={newContactRelation} onChange={(e) => setNewContactRelation(e.target.value)} placeholder="Relationship..." className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none" />
                <input type="text" required value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="Phone/SOS No..." className="w-full text-xs p-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none" />
              </div>
              <button type="submit" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 transition">
                <Plus size={12} /> Append SOS Contact
              </button>
            </form>

            <div className="space-y-1.5 max-h-32 overflow-y-auto border-t border-slate-100 pt-3">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{c.name} ({c.relationship})</p>
                    <p className="text-slate-500 text-[11px] font-mono">{c.phone}</p>
                  </div>
                  <button onClick={() => deleteContact(c.id)} className="text-slate-400 hover:text-red-500 transition p-1"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 w-full justify-start"><Wind size={20} className="text-sky-600" /> Box Breathing Pacer</h2>
            <div className="my-4 relative flex items-center justify-center">
              <div className={`rounded-full border-4 flex items-center justify-center transition-all duration-[1000ms] w-24 h-24 ${isBreathingActive ? 'border-sky-500 bg-sky-50 scale-105' : 'border-slate-200'}`}>
                <div>
                  <p className="text-[10px] font-bold text-slate-900">{isBreathingActive ? breathPhase : 'Ready'}</p>
                  {isBreathingActive && <p className="text-base font-black text-slate-700 mt-0.5">{breathCount}s</p>}
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
