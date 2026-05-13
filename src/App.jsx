import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO
// ══════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL      = "https://ntqnpdhhtqpqainxqhub.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_QzV0MGBrxdhaFwBYfc-wUg_5OzlJW15";
const R2_BASE_URL       = "https://pub-a3e90518634149b8a4408ff50cb41178.r2.dev";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CATALOG = {
  mandarin: {
    id: "mandarin", name: "Mandarim", native: "普通话", flag: "🇨🇳",
    script: ["你", "好", "我", "是", "学", "习", "语", "言"],
    color1: "#7c3aed", color2: "#a855f7", accent: "#ec4899",
    glow: "rgba(124,58,237,0.4)", bg1: "#0a0a12", bg2: "#12091a",
    levels: [
      { id: 1, name: "Nível I",   lessons: 30 },
      { id: 2, name: "Nível II",  lessons: 30 },
      { id: 3, name: "Nível III", lessons: 30 },
    ],
  },
  french: {
    id: "french", name: "Francês", native: "Français", flag: "🇫🇷",
    script: ["Bonjour", "Merci", "Parler", "Oui", "Non", "Excusez", "Voulez", "Plaît"],
    color1: "#1d4ed8", color2: "#3b82f6", accent: "#ef4444",
    glow: "rgba(59,130,246,0.4)", bg1: "#00060f", bg2: "#000d1a",
    levels: [
      { id: 1, name: "Nível 1", lessons: 30 },
      { id: 2, name: "Nível 2", lessons: 30 },
      { id: 3, name: "Nível 3", lessons: 30 },
      { id: 4, name: "Nível 4", lessons: 30 },
      { id: 5, name: "Nível 5", lessons: 30 },
    ],
  },
  spanish: {
    id: "spanish", name: "Espanhol", native: "Español", flag: "🇪🇸",
    script: ["Hola", "Buenos", "Días", "Hablar", "¿Cómo", "Estás?", "Gracias", "Por favor"],
    color1: "#b45309", color2: "#f59e0b", accent: "#ef4444",
    glow: "rgba(245,158,11,0.4)", bg1: "#120a00", bg2: "#1a0f00",
    levels: [
      { id: 1, name: "Nível I",   lessons: 30 },
      { id: 2, name: "Nível II",  lessons: 30 },
      { id: 3, name: "Nível III", lessons: 30 },
      { id: 4, name: "Nível IV",  lessons: 27 },
      { id: 5, name: "Nível V",   lessons: 30 },
    ],
  },
};

const audioUrl = (langId, levelId, lessonNum) =>
  `${R2_BASE_URL}/${langId}/${levelId}/${String(lessonNum).padStart(2, "0")}.mp3`;

const buildDefaultProgress = () =>
  Object.fromEntries(
    Object.entries(CATALOG).map(([langId, lang]) => [
      langId,
      Object.fromEntries(lang.levels.map((lv) => [lv.id, { completed: [], streak: 0 }])),
    ])
  );

async function fetchProgress(userId) {
  const { data, error } = await supabase
    .from("user_progress")
    .select("language, level, completed, streak")
    .eq("user_id", userId);
  if (error || !data?.length) return null;
  const p = buildDefaultProgress();
  data.forEach(({ language, level, completed, streak }) => {
    if (p[language]?.[level]) {
      p[language][level] = { completed: completed ?? [], streak: streak ?? 0 };
    }
  });
  return p;
}

async function upsertProgress(userId, langId, levelId, completed, streak) {
  await supabase.from("user_progress").upsert(
    {
      user_id: userId,
      language: langId,
      level: levelId,
      completed,
      streak,
      last_study: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "user_id,language,level" }
  );
}

function AuthScreen({ onAuth }) {
  const [mode, setMode]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 16px", color: "#e8e0f0", fontSize: 14, fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#080810,#0d0d1c)", fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,60,255,.08),transparent 70%)", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎧</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Pimsleur Tracker</div>
          <div style={{ fontSize: 11, opacity: 0.35, letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 6 }}>
            {mode === "login" ? "Entre na sua conta" : "Crie sua conta"}
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={inp} />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required style={inp} />
          {error   && <div style={{ background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#fca5a5" }}>{error}</div>}
          {success && <div style={{ background: "rgba(34,197,94,.12)",  border: "1px solid rgba(34,197,94,.3)",  borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#86efac" }}>{success}</div>}
          <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", color: "#fff", borderRadius: 14, padding: "16px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px rgba(124,58,237,.4)", marginTop: 4 }}>
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 12 }}>
          <span style={{ opacity: 0.4 }}>{mode === "login" ? "Ainda não tem conta? " : "Já tem conta? "}</span>
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }} style={{ background: "none", border: "none", color: "#a855f7", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
            {mode === "login" ? "Cadastre-se" : "Fazer login"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LangSelect({ progress, onSelect, user, onLogout }) {
  const [hovered, setHovered] = useState(null);
  const totalLessons = (langId) => CATALOG[langId].levels.reduce((s, lv) => s + lv.lessons, 0);
  const completedLessons = (langId) => CATALOG[langId].levels.reduce((s, lv) => s + (progress[langId]?.[lv.id]?.completed?.length ?? 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#080810,#0d0d1c)", fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", padding: "56px 24px 40px", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "15%", left: "50%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,60,255,.07),transparent 70%)", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎧</div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px" }}>Pimsleur Tracker</div>
            <div style={{ fontSize: 11, opacity: 0.3, marginTop: 4 }}>{user?.email}</div>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,.06)", border: "none", color: "rgba(255,255,255,.5)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 11, fontFamily: "inherit", marginTop: 8 }}>Sair</button>
        </div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: "rgba(255,255,255,.3)", textTransform: "uppercase", marginBottom: 18 }}>Escolha o idioma</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Object.values(CATALOG).map(lang => {
            const done  = completedLessons(lang.id);
            const total = totalLessons(lang.id);
            const pct   = Math.round((done / total) * 100);
            const isHov = hovered === lang.id;
            return (
              <div key={lang.id} onMouseEnter={() => setHovered(lang.id)} onMouseLeave={() => setHovered(null)} onClick={() => onSelect(lang.id)}
                style={{ background: isHov ? `linear-gradient(135deg,${lang.color1}22,${lang.color2}18)` : "rgba(255,255,255,.04)", border: `1px solid ${isHov ? lang.color2+"55" : "rgba(255,255,255,.07)"}`, borderRadius: 20, padding: "18px 20px", cursor: "pointer", transition: "all .25s", transform: isHov ? "translateY(-2px)" : "none", boxShadow: isHov ? `0 8px 32px ${lang.glow}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 36 }}>{lang.flag}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 700 }}>{lang.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>{lang.levels.length} níveis · {total} lições</div>
                  </div>
                  <div style={{ fontSize: lang.id === "mandarin" ? 26 : 14, background: `linear-gradient(135deg,${lang.color1},${lang.color2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>{lang.native}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 6, height: 4, overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${lang.color1},${lang.color2})`, borderRadius: 6, transition: "width .5s" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, opacity: 0.38 }}>
                  <span>{done}/{total} lições concluídas</span><span>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LevelSelect({ langId, progress, onSelect, onBack }) {
  const lang = CATALOG[langId];
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${lang.bg1},${lang.bg2})`, fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", padding: "56px 24px 40px", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        {lang.script.map((c, i) => (
          <div key={i} style={{ position: "absolute", fontSize: i%3===0?68:i%3===1?44:28, color: `${lang.color2}${Math.round((.03+i*.006)*255).toString(16).padStart(2,"0")}`, top: `${(i*13)%88}%`, left: `${(i*17+5)%88}%`, transform: `rotate(${i%2===0?12:-12}deg)`, userSelect: "none" }}>{c}</div>
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: lang.color2+"bb", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 28, display: "flex", alignItems: "center", gap: 4 }}>‹ Idiomas</button>
        <div style={{ fontSize: 36, marginBottom: 4 }}>{lang.flag}</div>
        <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 4 }}>{lang.name}</div>
        <div style={{ fontSize: 11, opacity: 0.35, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 32 }}>Escolha o nível</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {lang.levels.map(lv => {
            const done = progress[langId]?.[lv.id]?.completed?.length ?? 0;
            const pct  = Math.round((done / lv.lessons) * 100);
            const isHov = hovered === lv.id;
            const isUnlocked = lv.id === 1 || (progress[langId]?.[lv.id - 1]?.completed?.length ?? 0) >= CATALOG[langId].levels[lv.id - 2]?.lessons;
            return (
              <div key={lv.id} onMouseEnter={() => isUnlocked && setHovered(lv.id)} onMouseLeave={() => setHovered(null)} onClick={() => isUnlocked && onSelect(lv.id)}
                style={{ background: isHov ? `linear-gradient(135deg,${lang.color1}28,${lang.color2}18)` : "rgba(255,255,255,.04)", border: `1px solid ${isHov ? lang.color2+"55" : done > 0 ? lang.color2+"25" : "rgba(255,255,255,.07)"}`, borderRadius: 18, padding: "16px 20px", cursor: isUnlocked ? "pointer" : "default", opacity: isUnlocked ? 1 : 0.4, transition: "all .2s", transform: isHov ? "translateY(-1px)" : "none", boxShadow: isHov ? `0 6px 24px ${lang.glow}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: pct === 100 ? `linear-gradient(135deg,${lang.color1},${lang.color2})` : isUnlocked ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: pct === 100 ? `0 4px 14px ${lang.glow}` : "none" }}>
                    {pct === 100 ? "✓" : isUnlocked ? lv.id : "🔒"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{lv.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.4, marginTop: 2 }}>{lv.lessons} lições · {done} concluídas</div>
                  </div>
                  <div style={{ fontSize: 22, opacity: 0.18 }}>›</div>
                </div>
                {done > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ background: "rgba(255,255,255,.07)", borderRadius: 5, height: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${lang.color1},${lang.color2})`, borderRadius: 5 }} />
                    </div>
                    <div style={{ fontSize: 9, opacity: 0.35, marginTop: 4 }}>{pct}%</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LessonApp({ langId, levelId, progress, setProgress, userId, onBack }) {
  const lang   = CATALOG[langId];
  const level  = lang.levels.find(lv => lv.id === levelId);
  const lvProg = progress[langId]?.[levelId] ?? { completed: [], streak: 0 };
  const completed = lvProg.completed;
  const streak    = lvProg.streak;

  const lessons = Array.from({ length: level.lessons }, (_, i) => ({
    id: i + 1, title: `Lição ${i + 1}`, unit: `Unidade ${Math.ceil((i + 1) / 5)}`,
  }));

  const saveProgress = async (newCompleted, newStreak) => {
    setProgress(p => ({ ...p, [langId]: { ...p[langId], [levelId]: { completed: newCompleted, streak: newStreak } } }));
    if (userId) await upsertProgress(userId, langId, levelId, newCompleted, newStreak);
  };

  const [activeTab,     setActiveTab]     = useState("home");
  const [currentLesson, setCurrentLesson] = useState(null);
  const [showPlayer,    setShowPlayer]    = useState(false);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [elapsed,       setElapsed]       = useState(0);
  const [audioDur,      setAudioDur]      = useState(1800);
  const [audioReady,    setAudioReady]    = useState(false);
  const [audioStatus,   setAudioStatus]   = useState("idle");

  const audioRef     = useRef(null);
  const fileInputRef = useRef(null);
  const intervalRef  = useRef(null);

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current && audioReady) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        intervalRef.current = setInterval(() => {
          setElapsed(e => { const n = e + 1; if (n >= 1800) { clearInterval(intervalRef.current); setIsPlaying(false); } return n; });
        }, 1000);
      }
    } else {
      clearInterval(intervalRef.current);
      if (audioRef.current && audioReady) audioRef.current.pause();
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, audioReady]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const attachEvents = (audio) => {
    audio.onloadedmetadata = () => { setAudioDur(Math.floor(audio.duration)||1800); setElapsed(0); };
    audio.ontimeupdate = () => { setElapsed(Math.floor(audio.currentTime)); };
    audio.onended = () => { setIsPlaying(false); };
    audio.onerror = () => { setAudioStatus("error"); setAudioReady(false); };
  };

  const openLesson = async (lesson) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    clearInterval(intervalRef.current);
    setAudioReady(false); setAudioStatus("loading");
    setCurrentLesson(lesson); setElapsed(0); setAudioDur(1800);
    setIsPlaying(false); setShowPlayer(true);
    const url = audioUrl(langId, levelId, lesson.id);
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (!res.ok) throw new Error("not found");
      const audio = new Audio(url);
      attachEvents(audio);
      audio.oncanplaythrough = () => { setAudioReady(true); setAudioStatus("ready"); };
      audioRef.current = audio;
    } catch { setAudioStatus("error"); }
  };

  const handleFileImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    clearInterval(intervalRef.current); setIsPlaying(false);
    const audio = new Audio(URL.createObjectURL(file));
    attachEvents(audio);
    audio.oncanplaythrough = () => { setAudioReady(true); setAudioStatus("ready"); };
    audioRef.current = audio;
    setAudioStatus("ready"); setAudioReady(true);
    e.target.value = "";
  };

  const closePlayer = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    clearInterval(intervalRef.current);
    setShowPlayer(false); setIsPlaying(false); setAudioReady(false); setAudioStatus("idle");
  };

  const markComplete = async () => {
    const newCompleted = completed.includes(currentLesson.id) ? completed : [...completed, currentLesson.id];
    const newStreak    = completed.includes(currentLesson.id) ? streak : streak + 1;
    await saveProgress(newCompleted, newStreak);
    closePlayer();
  };

  const seekBack    = () => { if (audioRef.current && audioReady) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); };
  const seekForward = () => { if (audioRef.current && audioReady) audioRef.current.currentTime = Math.min(audioRef.current.duration||1800, audioRef.current.currentTime + 30); };

  const total = completed.length;
  const pct   = Math.round((total / level.lessons) * 100);
  const next  = lessons.find(l => !completed.includes(l.id)) ?? lessons[0];
  const bgRgb = langId === "mandarin" ? "10,10,18" : langId === "spanish" ? "18,10,0" : "0,6,15";

  const PBar = ({ val, max, h = 4 }) => (
    <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, height: h, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.round((val/max)*100)}%`, background: `linear-gradient(90deg,${lang.color1},${lang.color2})`, borderRadius: 8, transition: "width .5s" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${lang.bg1},${lang.bg2})`, fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {lang.script.map((c, i) => (
          <div key={i} style={{ position: "absolute", fontSize: i%3===0?68:i%3===1?44:28, color: `${lang.color2}${Math.round((.03+i*.006)*255).toString(16).padStart(2,"00")}`, top: `${(i*13)%88}%`, left: `${(i*17+5)%88}%`, transform: `rotate(${i%2===0?12:-12}deg)`, userSelect: "none" }}>{c}</div>
        ))}
      </div>

      <div style={{ position: "relative", zIndex: 1, paddingBottom: 90 }}>
        <div style={{ padding: "50px 24px 18px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <button onClick={onBack} style={{ background: "none", border: "none", color: lang.color2+"bb", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 8 }}>‹ Níveis</button>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: lang.color2, textTransform: "uppercase", marginBottom: 4 }}>{lang.flag} {lang.name} · {level.name}</div>
              <div style={{ fontSize: 21, fontWeight: 700 }}>Olá, Pâmela 👋</div>
            </div>
            <div style={{ background: `linear-gradient(135deg,${lang.color1},${lang.color2})`, borderRadius: 14, padding: "10px 14px", textAlign: "center", boxShadow: `0 4px 20px ${lang.glow}` }}>
              <div style={{ fontSize: 20 }}>🔥</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{streak}</div>
              <div style={{ fontSize: 9, opacity: 0.8, letterSpacing: "0.1em" }}>DIAS</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 16 }}>
            {["S","T","Q","Q","S","S","D"].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 26, borderRadius: 7, background: i < (streak%7||0) ? `linear-gradient(180deg,${lang.color2},${lang.color1})` : "rgba(255,255,255,.06)", marginBottom: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{i < (streak%7||0) ? "✓" : ""}</div>
                <div style={{ fontSize: 8, opacity: 0.35 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {activeTab === "home" && (
          <div style={{ padding: "18px 24px" }}>
            <div style={{ background: `linear-gradient(135deg,${lang.color1}22,${lang.color1}38)`, borderRadius: 20, padding: 18, marginBottom: 18, border: `1px solid ${lang.color2}38`, boxShadow: `0 8px 28px ${lang.color1}28` }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: lang.color2, textTransform: "uppercase", marginBottom: 8 }}>📅 Próxima lição</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{next.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{next.unit} · 30 min</div>
                </div>
                <div onClick={() => openLesson(next)} style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${lang.color1},${lang.color2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", boxShadow: `0 4px 18px ${lang.glow}` }}>▶</div>
              </div>
              <PBar val={total} max={level.lessons} />
              <div style={{ fontSize: 10, opacity: 0.4, marginTop: 5 }}>{total}/{level.lessons} lições · {pct}%</div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              {[{ icon: "✅", label: "Feitas", val: total }, { icon: "⏱", label: "Horas", val: `${(total*.5).toFixed(1)}h` }, { icon: "🎯", label: "Restam", val: level.lessons - total }].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "12px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,.05)" }}>
                  <div style={{ fontSize: 17 }}>{s.icon}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{s.val}</div>
                  <div style={{ fontSize: 9, opacity: 0.4, textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "lessons" && (
          <div style={{ padding: "18px 24px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", color: lang.color2+"bb", textTransform: "uppercase", marginBottom: 14 }}>Todas as lições — {level.name}</div>
            {lessons.map(lesson => {
              const done  = completed.includes(lesson.id);
              const isCur = lesson.id === (next?.id);
              return (
                <div key={lesson.id} onClick={() => openLesson(lesson)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 14, marginBottom: 7, background: done ? `${lang.color1}22` : isCur ? `${lang.color1}10` : "rgba(255,255,255,.025)", border: done ? `1px solid ${lang.color2}35` : isCur ? `1px solid ${lang.color2}50` : "1px solid rgba(255,255,255,.04)", cursor: "pointer" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: done ? `linear-gradient(135deg,${lang.color1},${lang.color2})` : "rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: done ? "#fff" : lang.color2, boxShadow: done ? `0 4px 12px ${lang.glow}` : "none" }}>{done ? "✓" : lesson.id}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{lesson.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.4 }}>{lesson.unit} · 30 min</div>
                  </div>
                  <div style={{ fontSize: 16, opacity: 0.2 }}>›</div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "progress" && (
          <div style={{ padding: "18px 24px" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", color: lang.color2+"bb", textTransform: "uppercase", marginBottom: 14 }}>Progresso — {level.name}</div>
            <div style={{ background: `linear-gradient(135deg,${lang.color1}22,${lang.color1}35)`, borderRadius: 20, padding: "28px 24px", textAlign: "center", border: `1px solid ${lang.color2}30`, marginBottom: 16 }}>
              <div style={{ fontSize: 56, fontWeight: 800, background: `linear-gradient(135deg,${lang.color2},${lang.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pct}%</div>
              <div style={{ fontSize: 12, opacity: 0.45, marginTop: 4 }}>do nível concluído</div>
              <div style={{ marginTop: 14 }}><PBar val={total} max={level.lessons} h={7} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[{ icon: "🔥", label: "Sequência", val: `${streak} dias` }, { icon: "📚", label: "Lições", val: `${total}/${level.lessons}` }, { icon: "⏱", label: "Horas", val: `${(total*.5).toFixed(1)}h` }, { icon: lang.flag, label: "Nível", val: level.name }].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,.04)", borderRadius: 16, padding: 14, border: "1px solid rgba(255,255,255,.05)" }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, marginTop: 6 }}>{s.val}</div>
                  <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: `rgba(${bgRgb},.96)`, borderTop: "1px solid rgba(255,255,255,.07)", backdropFilter: "blur(20px)", display: "flex", zIndex: 10 }}>
        {[{ id: "home", label: "Início", icon: "🏠" }, { id: "lessons", label: "Lições", icon: "📖" }, { id: "progress", label: "Progresso", icon: "📊" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, background: "none", border: "none", color: activeTab === tab.id ? lang.color2 : "rgba(255,255,255,.3)", padding: "14px 0 20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "color .2s" }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tab.label}</span>
          </button>
        ))}
      </div>

      {showPlayer && currentLesson && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(4,4,12,.96)", backdropFilter: "blur(24px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28, maxWidth: 420, margin: "0 auto", left: "50%", transform: "translateX(-50%)" }}>
          <button onClick={closePlayer} style={{ position: "absolute", top: 54, right: 24, background: "rgba(255,255,255,.08)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>✕ Fechar</button>
          <div style={{ width: 110, height: 110, borderRadius: "50%", background: `linear-gradient(135deg,${lang.color1},${lang.color2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, marginBottom: 24, boxShadow: isPlaying ? `0 0 0 18px ${lang.color1}18, 0 0 0 36px ${lang.color1}0a` : `0 8px 32px ${lang.glow}`, transition: "box-shadow .5s" }}>{lang.flag}</div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", color: lang.color2, textTransform: "uppercase", marginBottom: 6 }}>{level.name} · {currentLesson.unit}</div>
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{currentLesson.title}</div>
          <div style={{ fontSize: 12, opacity: 0.42, marginBottom: 28 }}>{lang.name} · 30 min</div>
          <div style={{ width: "100%", marginBottom: 8 }}>
            <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, height: 5, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round((elapsed/audioDur)*100)}%`, background: `linear-gradient(90deg,${lang.color1},${lang.accent})`, borderRadius: 8, transition: "width 1s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <span style={{ fontSize: 10, opacity: 0.35 }}>{fmt(elapsed)}</span>
              <span style={{ fontSize: 10, opacity: 0.35 }}>{fmt(audioDur)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 24 }}>
            <button onClick={seekBack} style={{ background: "rgba(255,255,255,.07)", border: "none", color: "#fff", borderRadius: 14, padding: "12px 16px", cursor: "pointer", fontSize: 13 }}>⏪ 10s</button>
            <button onClick={() => setIsPlaying(p => !p)} disabled={!audioReady}
              style={{ width: 64, height: 64, borderRadius: "50%", background: !audioReady ? "rgba(255,255,255,.08)" : isPlaying ? `linear-gradient(135deg,${lang.accent},${lang.color1})` : `linear-gradient(135deg,${lang.color1},${lang.color2})`, border: "none", color: "#fff", fontSize: 22, cursor: audioReady ? "pointer" : "not-allowed", opacity: audioReady ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: audioReady ? `0 6px 24px ${lang.glow}` : "none", transition: "all .2s" }}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={seekForward} style={{ background: "rgba(255,255,255,.07)", border: "none", color: "#fff", borderRadius: 14, padding: "12px 16px", cursor: "pointer", fontSize: 13 }}>30s ⏩</button>
          </div>
          <input ref={fileInputRef} type="file" accept=".mp3,audio/*" style={{ display: "none" }} onChange={handleFileImport} />
          {audioStatus === "loading" && (
            <div style={{ background: `${lang.color1}14`, border: `1px solid ${lang.color2}40`, borderRadius: 14, padding: "14px 18px", width: "100%", textAlign: "center", marginBottom: 14, boxSizing: "border-box" }}>
              <div style={{ fontSize: 11, opacity: 0.6 }}>⏳ Carregando do servidor...</div>
            </div>
          )}
          {audioStatus === "ready" && (
            <div onClick={() => fileInputRef.current?.click()} style={{ background: `${lang.color1}20`, border: `1px solid ${lang.color2}55`, borderRadius: 14, padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, marginBottom: 14, width: "100%", cursor: "pointer", boxSizing: "border-box" }}>
              <div style={{ fontSize: 18 }}>🎵</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: lang.color2, fontWeight: 700 }}>Áudio carregado do R2</div>
                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>Clique para trocar</div>
              </div>
            </div>
          )}
          {(audioStatus === "idle" || audioStatus === "error") && (
            <div style={{ width: "100%" }}>
              {audioStatus === "error" && (
                <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 8, fontSize: 10, color: "#fca5a5", textAlign: "center" }}>
                  Arquivo não encontrado no R2 — importe manualmente
                </div>
              )}
              <div onClick={() => fileInputRef.current?.click()} style={{ background: `${lang.color1}14`, border: `1.5px dashed ${lang.color2}55`, borderRadius: 14, padding: "16px 18px", textAlign: "center", marginBottom: 14, width: "100%", cursor: "pointer", boxSizing: "border-box" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🎵</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>Importar .mp3 manualmente</div>
                <div style={{ fontSize: 10, opacity: 0.38 }}>Ou configure o R2 para auto-load</div>
              </div>
            </div>
          )}
          <button onClick={markComplete} style={{ width: "100%", background: completed.includes(currentLesson.id) ? "rgba(255,255,255,.05)" : `linear-gradient(135deg,${lang.color1},${lang.color2})`, border: "none", color: "#fff", borderRadius: 16, padding: "16px", cursor: "pointer", fontSize: 14, fontWeight: 700, boxShadow: completed.includes(currentLesson.id) ? "none" : `0 4px 20px ${lang.glow}` }}>
            {completed.includes(currentLesson.id) ? "✓ Lição já concluída" : "✅ Marcar como concluída"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user,          setUser]          = useState(null);
  const [authChecked,   setAuthChecked]   = useState(false);
  const [selectedLang,  setSelectedLang]  = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [progress,      setProgress]      = useState(buildDefaultProgress);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const p = await fetchProgress(session.user.id);
        if (p) setProgress(p);
      }
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
        const p = await fetchProgress(session.user.id);
        if (p) setProgress(p);
      } else if (event === "SIGNED_OUT") {
        setUser(null); setProgress(buildDefaultProgress());
        setSelectedLang(null); setSelectedLevel(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", color: "rgba(255,255,255,.3)", fontSize: 12 }}>
      Carregando...
    </div>
  );

  if (!user) return <AuthScreen onAuth={setUser} />;
  if (!selectedLang) return <LangSelect progress={progress} user={user} onSelect={setSelectedLang} onLogout={() => supabase.auth.signOut()} />;
  if (!selectedLevel) return <LevelSelect langId={selectedLang} progress={progress} onSelect={setSelectedLevel} onBack={() => setSelectedLang(null)} />;

  return (
    <LessonApp
      langId={selectedLang}
      levelId={selectedLevel}
      progress={progress}
      setProgress={setProgress}
      userId={user.id}
      onBack={() => setSelectedLevel(null)}
    />
  );
}
