import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Compass, Music, Radio, ListMusic, CloudRain
} from 'lucide-react';

interface AudioTrack {
  id: string;
  title: string;
  reciter: string;
  url: string;
  description: string;
}

// Solid streaming high-quality open-source links for Quran recitation and serene Islamic devotions
const POPULAR_TRACKS: AudioTrack[] = [
  {
    id: 'serene-quran-1',
    title: 'سورة الملك المنجية (تأمل هادئ)',
    reciter: 'الشيخ ميثم التمار',
    url: 'https://download.surahquran.com/maytham-altamar/067.mp3',
    description: 'قراءة خاشعة بصوت الشيخ ميثم التمار لسورة الملك المستحبة قبل النوم للطمأنينة وحفظ النفس.'
  },
  {
    id: 'serene-quran-2',
    title: 'سورة يس (قلب القرآن العظيم)',
    reciter: 'الشيخ عبد الباسط عبد الصمد رحمه الله',
    url: 'https://server13.mp3quran.net/basit_mjwd/036.mp3',
    description: 'تلاوة مجودة خاشعة تريح الصدر والوجدان من سورة يس لقضاء الحوائج.'
  },
  {
    id: 'serene-adhan',
    title: 'أذان المدينة المنورة الخاشع 🕌',
    reciter: 'مؤذني المسجد النبوي الشريف',
    url: 'https://download.tvquran.com/download/selections/1/Adhan-01.mp3',
    description: 'الأذان الندي للمسجد النبوي الشريف لبث الطمأنينة الروحية في أرجاء المكان.'
  },
  {
    id: 'serene-dua-kumayl',
    title: 'دعاء كميل بن زياد (مقطع العفو)',
    reciter: 'أدعية وزيارات مختارة خاشعة',
    url: 'https://www.islamicinvitation.org/downloads/Dua_Kumail.mp3',
    description: 'دعاء كميل المنير للاستغفار والتضرع لرب السكينة وبث الخشوع.'
  }
];

export default function AudioAtmosphere() {
  const [activeTrack, setActiveTrack] = useState<AudioTrack>(POPULAR_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(false);

  // Sound generator variables (pure Web Audio API oscillations for soundscapes)
  const [activeToneMode, setActiveToneMode] = useState<'none' | '528hz' | 'rain_alpha' | 'deep_zen'>('none');
  const toneAudioCtxRef = useRef<AudioContext | null>(null);
  const toneNodesRef = useRef<any[]>([]);

  // HTML Audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sync HTML audio player
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn("Autoplay blocked by browser. User approval required.", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeTrack]);

  // Handle loop sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = loopEnabled;
    }
  }, [loopEnabled]);

  const handleTrackChange = (track: AudioTrack) => {
    // Shut down synthesized tones first to avoid overlay noise
    handleStopTones();
    setActiveTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (activeToneMode !== 'none') {
      handleStopTones();
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  };

  // Pure Web Audio API Synthesizer section
  const handleStopTones = () => {
    setActiveToneMode('none');
    if (toneAudioCtxRef.current) {
      try {
        toneNodesRef.current.forEach(node => {
          if (node.stop) node.stop();
          node.disconnect();
        });
        toneNodesRef.current = [];
        toneAudioCtxRef.current.close();
      } catch (e) {}
      toneAudioCtxRef.current = null;
    }
  };

  const handlePlayAtmosphericTone = (mode: '528hz' | 'rain_alpha' | 'deep_zen') => {
    // 1. stop everything first
    setIsPlaying(false); // Stop HTML audio track
    handleStopTones();

    setActiveToneMode(mode);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      toneAudioCtxRef.current = ctx;

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0.08, ctx.currentTime);
      mainGain.connect(ctx.destination);

      if (mode === '528hz') {
        // Solfeggio 528Hz healing/soothing sound generator
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();

        // 528 Hz - Solfeggio Relax frequency
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctx.currentTime);

        // Sub frequency for resonance (264 Hz octave below)
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(264, ctx.currentTime);

        // Modulator for slow pulsing wave (Alpha wave 8Hz amplitude modulation)
        modulator.frequency.setValueAtTime(8, ctx.currentTime);
        modGain.gain.setValueAtTime(0.3, ctx.currentTime);

        modulator.connect(modGain);
        modGain.connect(osc.frequency); // adjust pitch wobbles

        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.3, ctx.currentTime);

        osc.connect(mainGain);
        subOsc.connect(subGain);
        subGain.connect(mainGain);

        osc.start();
        subOsc.start();
        modulator.start();

        toneNodesRef.current = [osc, subOsc, modulator, mainGain, subGain, modGain];

      } else if (mode === 'rain_alpha') {
        // Programmatic Organic Rain & Pink noise generation
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink noise filter algorithm
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11; // normalise volume
          b6 = white * 0.115926;
        }

        const whiteNoiseNode = ctx.createBufferSource();
        whiteNoiseNode.buffer = noiseBuffer;
        whiteNoiseNode.loop = true;

        // Bandpass to simulate soothing storm raindrops falling with filter sweep
        const biquadFilter = ctx.createBiquadFilter();
        biquadFilter.type = 'lowpass';
        biquadFilter.frequency.setValueAtTime(450, ctx.currentTime);

        whiteNoiseNode.connect(biquadFilter);
        biquadFilter.connect(mainGain);

        whiteNoiseNode.start();
        toneNodesRef.current = [whiteNoiseNode, biquadFilter, mainGain];

      } else if (mode === 'deep_zen') {
        // Deep meditation choir chord (330Hz, 440Hz, 220Hz harmonies)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const osc3 = ctx.createOscillator();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(220, ctx.currentTime); // E3

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(330, ctx.currentTime); // A3

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(440, ctx.currentTime); // E4

        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.25, ctx.currentTime);

        const feedback = ctx.createGain();
        feedback.gain.setValueAtTime(0.4, ctx.currentTime);

        // Echo feedback route
        osc1.connect(mainGain);
        osc2.connect(mainGain);
        osc3.connect(mainGain);

        mainGain.connect(delay);
        delay.connect(feedback);
        feedback.connect(mainGain);

        osc1.start();
        osc2.start();
        osc3.start();

        toneNodesRef.current = [osc1, osc2, osc3, delay, feedback, mainGain];
      }
    } catch (e) {
      console.error("Web Audio API failed initiation:", e);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 text-right" id="audio-atmosphere">
      {/* Invisible HTML Audio Element */}
      <audio
        ref={audioRef}
        src={activeTrack.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Upper branding element */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-emerald-950 to-emerald-900 border border-amber-300/20 p-5 rounded-3xl text-white gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-end sm:justify-start">
            <Radio className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif text-lg font-extrabold text-amber-300">مستمع المعارف والأجواء الصوتية المهدئة</h3>
          </div>
          <p className="text-xs text-emerald-200">
            تلاوات قرآنية خاشعة ومستحبات مسموعة، بالإضافة لمولد موجات صوتية مهدئة ومحفزة للتركيز والصلاة والسكينة التامة.
          </p>
        </div>

        <div className="p-2 bg-emerald-900/60 text-amber-300 rounded-xl flex items-center gap-1 text-[10px] font-bold border border-emerald-800">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>تكامل صوتي ذكي (Web Audio)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left column: List of recitation streams (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <h4 className="font-serif font-bold text-stone-850 text-xs border-b border-stone-100 pb-2 flex items-center gap-1 justify-end">
              <span>قائمة التلاوات والأدعية الخاشعة</span>
              <Radio className="w-4 h-4 text-[#2E7D32]" />
            </h4>

            {/* Track list widgets */}
            <div className="space-y-2">
              {POPULAR_TRACKS.map(t => {
                const isActive = activeTrack.id === t.id && activeToneMode === 'none';
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTrackChange(t)}
                    className={`w-full p-3.5 rounded-xl border text-right transition-all flex items-start gap-3 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-500/10'
                        : 'bg-white border-stone-150 hover:bg-stone-50 text-stone-750'
                    }`}
                  >
                    <div className="flex-1 py-0.5 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        {isActive && isPlaying ? (
                          <span className="flex items-center gap-1 select-none">
                            <span className="w-1.5 h-3 bg-emerald-600 rounded-full animate-pulse" />
                            <span className="w-1.5 h-4 bg-emerald-600 rounded-full animate-pulse delay-75" />
                            <span className="w-1.5 h-2 bg-emerald-600 rounded-full animate-pulse delay-150" />
                          </span>
                        ) : (
                          <span />
                        )}
                        <h5 className="font-serif font-extrabold text-xs text-stone-850">{t.title}</h5>
                      </div>
                      <p className="text-[10px] text-stone-500">{t.reciter}</p>
                      <p className="text-[9px] text-stone-400 font-sans leading-relaxed pt-1 border-t border-stone-100">{t.description}</p>
                    </div>

                    <div className={`p-2 rounded-lg shrink-0 ${
                      isActive ? 'bg-[#022c22] text-amber-300' : 'bg-stone-100 text-stone-500'
                    }`}>
                      <Music className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Browser synthesized generator module */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
            <h4 className="font-serif font-bold text-stone-850 text-xs border-b border-stone-100 pb-2 flex items-center gap-1 justify-end">
              <span>بث موجات السكينة العضوية (مُخلّق الترددات)</span>
              <CloudRain className="w-4 h-4 text-[#2E7D32]" />
            </h4>
            <p className="text-[10px] text-stone-400 leading-normal">
              توليد أصوات خلفية مريحة تعين على التركيز وقراءة الأوراد، مصممة تقنياً وبشكل خالص ومباشر بداخل جهازك.
            </p>

            {/* Synthed tones grids button */}
            <div className="space-y-2">
              <button
                onClick={() => handlePlayAtmosphericTone('528hz')}
                className={`w-full p-2.5 rounded-xl border text-right text-xs font-serif font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                  activeToneMode === '528hz'
                    ? 'bg-indigo-950 border-indigo-400 text-amber-300 font-black'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-750'
                }`}
              >
                <span className="text-[9px] text-stone-400 font-sans">شدة هادئة 528 هرتز</span>
                <span className="flex items-center gap-1.5">
                  <span>تردد الطمأنينة والهدوء 🧘</span>
                </span>
              </button>

              <button
                onClick={() => handlePlayAtmosphericTone('rain_alpha')}
                className={`w-full p-2.5 rounded-xl border text-right text-xs font-serif font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                  activeToneMode === 'rain_alpha'
                    ? 'bg-indigo-950 border-indigo-400 text-amber-300 font-black'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-750'
                }`}
              >
                <span className="text-[9px] text-stone-400 font-sans">حجب الضوضاء بالوردي</span>
                <span className="flex items-center gap-1.5">
                  <span>أصوات المطر والانسجام 🌧️</span>
                </span>
              </button>

              <button
                onClick={() => handlePlayAtmosphericTone('deep_zen')}
                className={`w-full p-2.5 rounded-xl border text-right text-xs font-serif font-extrabold flex items-center justify-between transition-all cursor-pointer ${
                  activeToneMode === 'deep_zen'
                    ? 'bg-indigo-950 border-indigo-400 text-amber-300 font-black'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-750'
                }`}
              >
                <span className="text-[9px] text-stone-400 font-sans">رنين الصفاء المتناغم</span>
                <span className="flex items-center gap-1.5">
                  <span>صدى التأمل والعمق الروحي 🌌</span>
                </span>
              </button>

              {activeToneMode !== 'none' && (
                <button
                  onClick={handleStopTones}
                  className="w-full py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-[10px] font-bold transition-all border border-red-200"
                >
                  إيقاف توليد الموجات الصوتية ×
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Main player panel display UI (7 cols) */}
        <div className="md:col-span-12 lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between items-center min-h-[440px]">
          
          <div className="w-full text-center space-y-4 select-none">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">الـمقـطع الصـوتي المـصاحب الآن</span>
            
            {/* Visual audio disc look */}
            <div className="relative w-36 h-36 rounded-full border-4 border-stone-100 shadow-lg mx-auto overflow-hidden flex items-center justify-center bg-stone-55">
              <div className={`w-32 h-32 rounded-full border border-stone-200 bg-gradient-to-br from-emerald-950 to-emerald-900 flex items-center justify-center text-white ${
                isPlaying || activeToneMode !== 'none' ? 'animate-spin animate-duration-10000' : ''
              }`}>
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-emerald-950 font-black">
                  🕌
                </div>
              </div>
              <div className="absolute w-4 h-4 rounded-full bg-[#1c1917] border border-white" />
            </div>

            {/* Track Info text */}
            <div className="space-y-1">
              <h4 className="font-serif text-lg font-extrabold text-stone-900">
                {activeToneMode !== 'none' 
                  ? activeToneMode === '528hz' ? 'تردد السكينة 528 هرتز' : activeToneMode === 'rain_alpha' ? 'عزف المطر المولد كلاسيكياً' : 'صدى الخشوع والعمق والمجال الموسع'
                  : activeTrack.title}
              </h4>
              <p className="text-xs text-stone-500 font-sans">
                {activeToneMode !== 'none' ? 'موجات صوتية تعبدية مدمجة بالبرنامج' : activeTrack.reciter}
              </p>
            </div>
          </div>

          {/* Slider and player progress controllers (Only when streaming audio tracks) */}
          {activeToneMode === 'none' && (
            <div className="w-full space-y-2 mt-4">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSliderChange}
                className="w-full h-1.5 bg-stone-100 active:bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-800"
              />
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-mono">
                <span>{formatTime(duration)}</span>
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
          )}

          {/* Primary Controls toolbar */}
          <div className="w-full flex justify-center items-center gap-6 mt-4 select-none">
            
            {/* Repeat button */}
            <button
              onClick={() => setLoopEnabled(!loopEnabled)}
              className={`p-2.5 rounded-full transition-all cursor-pointer ${
                loopEnabled ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-stone-50 text-stone-400 hover:text-stone-700'
              }`}
              title="تعديل صفة تكرار تشغيل المقطع تلقائياً بانتهاء تلاوته"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Core Play/Pause Circular button */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-[#022c22] text-amber-300 hover:text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-[0.97] transition-all cursor-pointer"
              title={isPlaying || activeToneMode !== 'none' ? 'إيقاف مؤقت' : 'البدء بالتلاوة أو بث التردد المريح'}
            >
              {isPlaying || activeToneMode !== 'none' ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Play speed badge */}
            <div className="flex flex-col items-center gap-1">
              <select
                value={playbackRate}
                onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
                className="h-8 px-2 bg-stone-50 border border-stone-200 rounded-lg outline-none text-[10px] text-stone-600 cursor-pointer font-bold"
                title="تعديل سرعة الإلقاء الصوتي والتلاوة"
              >
                <option value="0.75">x0.75 بطيء</option>
                <option value="1.0">x1.0 عادي</option>
                <option value="1.25">x1.25 سريع</option>
                <option value="1.5">x1.5 أسرع</option>
              </select>
            </div>

          </div>

          {/* Volume control block */}
          <div className="w-full flex items-center gap-3 border-t border-stone-100 pt-4 mt-4 select-none">
            <button
              onClick={toggleMute}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={changeVolume}
              className="flex-1 h-1 bg-stone-150 rounded-lg appearance-none cursor-pointer accent-emerald-800"
            />
            
            <span className="text-[10px] font-mono text-stone-400 font-bold">{Math.round(volume * 100)}%</span>
          </div>

        </div>

      </div>

    </div>
  );
}
