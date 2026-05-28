import React, { useState, useEffect } from 'react';
import { Heart, Activity, Wind, Music, Smile, Meh, Frown } from 'lucide-react';

interface MoodLog {
  id: string;
  timestamp: string;
  score: number;
  note: string;
}

export default function App() {
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
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Heart className="text-emerald-500 fill-emerald-500" size={24} />
          <span className="font-bold text-xl text-slate-900 tracking-tight">MindCheck Dashboard</span>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200">Local Security Active</span>
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
            <textarea value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} placeholder="What's contributing to your mental headspace?..." className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50/50 resize-none h-20 mb-3" />
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

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-[590px]">
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900"><Activity size={20} className="text-violet-600" /> Cognitive Reframing</h2>
            <div className="space-y-3 mb-4">
              <input type="text" value={negativeThought} onChange={(e) => setNegativeThought(e.target.value)} placeholder="Automatic Negative Thought..." className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50/50" />
              <input type="text" value={positiveReframe} onChange={(e) => setPositiveReframe(e.target.value)} placeholder="Rational Positive Reframe..." className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50/50" />
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

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 w-full justify-start"><Wind size={20} className="text-sky-600" /> Box Breathing Pacer</h2>
            <div className="my-10 relative flex items-center justify-center">
              <div className={`rounded-full border-4 flex items-center justify-center transition-all duration-[1000ms] w-36 h-36 ${isBreathingActive ? 'border-sky-500 bg-sky-50 scale-110' : 'border-slate-200'}`}>
                <div>
                  <p className="text-sm font-bold text-slate-900">{isBreathingActive ? breathPhase : 'Ready'}</p>
                  {isBreathingActive && <p className="text-xl font-black text-slate-700 mt-0.5">{breathCount}s</p>}
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
