import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

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
    { user_id: userId, language: langId, level: levelId, completed, streak, last_study: new Date().toISOString().slice(0, 10) },
    { onConflict: "user_id,language,level" }
  );
}

// ── Mensagens motivacionais ──────────────────────────────────────────────────
const MOTIVATION_MSGS = [
  "Cada lição conta. Você está construindo algo incrível! 🚀",
  "Consistência é tudo. Mais uma! 💪",
  "Seu cérebro está crescendo agora mesmo! 🧠✨",
  "30 minutos hoje = fluência amanhã! ⚡",
  "Você é mais incrível do que imagina! 🌟",
  "Foco total. Você consegue! 🎯",
  "Um passo de cada vez. Você já está no caminho! 🌱",
  "Mais uma lição? Claro que sim! 🔥",
  "Linguagens abrem mundos. O seu está crescendo! 🌍",
  "Pequenos passos, grandes conquistas! 👣",
  "Você já começou — isso é o mais difícil! 💜",
  "Seu futuro eu agradece cada lição! ✨",
];

const MILESTONES = {
  1:  "Primeira lição! A jornada começa agora! 🌱",
  5:  "5 lições! Você está pegando o ritmo! 🎵",
  10: "10 lições! Você é dedicada de verdade! 💜",
  15: "Metade do nível! Simplesmente incrível! 🔥",
  20: "20 lições! Quase lá, não para agora! ⚡",
  25: "25 lições! A linha de chegada está próxima! 🏁",
  27: "27 lições! Você está mandando muito bem! 🌟",
  30: "NÍVEL COMPLETO! Você arrasou demais! 🏆",
};

// ── NameScreen ───────────────────────────────────────────────────────────────
function NameScreen({ onSave }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await supabase.auth.updateUser({ data: { name: name.trim() } });
    onSave(name.trim());
  };

  const inp = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "16px 18px", color: "#e8e0f0", fontSize: 16, fontFamily: "inherit", outline: "none", textAlign: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#080810,#0d0d1c)", fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 28px" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,60,255,.1),transparent 70%)", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>👋</div>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 10 }}>Como posso te chamar?</div>
        <div style={{ fontSize: 13, opacity: 0.4, marginBottom: 36 }}>Seu nome aparecerá nos cumprimentos do app</div>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input type="text" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} required autoFocus style={inp} />
          <button type="submit" disabled={loading || !name.trim()} style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", color: "#fff", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed", opacity: name.trim() ? 1 : 0.45, boxShadow: "0 4px 20px rgba(124,58,237,.4)", fontFamily: "inherit" }}>
            {loading ? "Salvando..." : "Continuar →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── AuthScreen ───────────────────────────────────────────────────────────────
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
          <button type="submit" disabled={loading} style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", border: "none", color: "#fff", borderRadius: 14, padding: "16px", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px rgba(124,58,237,.4)", marginTop: 4, fontFamily: "inherit" }}>
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

// ── LangSelect ───────────────────────────────────────────────────────────────
function LangSelect({ progress, onSelect, user, onLogout, userName }) {
  const [hovered, setHovered] = useState(null);
  const totalLessons    = (langId) => CATALOG[langId].levels.reduce((s, lv) => s + lv.lessons, 0);
  const completedLessons = (langId) => CATALOG[langId].levels.reduce((s, lv) => s + (progress[langId]?.[lv.id]?.completed?.length ?? 0), 0);
  const totalDone = Object.keys(CATALOG).reduce((s, id) => s + completedLessons(id), 0);
  const totalStreak = Object.values(CATALOG).reduce((max, lang) =>
    Math.max(max, lang.levels.reduce((m, lv) => Math.max(m, progress[lang.id]?.[lv.id]?.streak ?? 0), 0)), 0);

  const motivoBanner = totalDone === 0
    ? "Pronta para começar? A primeira lição muda tudo! 🌱"
    : totalStreak >= 3
    ? `Você está em chamas! 🔥 ${totalStreak} dias seguidos!`
    : totalStreak === 1
    ? "Você voltou! Continue assim! 💪"
    : "Cada lição te aproxima da fluência! 🌟";

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#080810,#0d0d1c)", fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", padding: "56px 24px 40px", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "15%", left: "50%", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,60,255,.07),transparent 70%)", transform: "translateX(-50%)" }} />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎧</div>
            <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px" }}>Pimsleur Tracker</div>
            <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>Olá, {userName}! 👋</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, marginTop: 4 }}>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,.06)", border: "none", color: "rgba(255,255,255,.5)", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 11, fontFamily: "inherit" }}>Sair</button>
            {totalStreak > 0 && <div style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 10, padding: "5px 12px", fontSize: 12, fontWeight: 700 }}>🔥 {totalStreak} dias</div>}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "11px 16px", marginBottom: 22, border: "1px solid rgba(255,255,255,.06)", fontSize: 12, textAlign: "center", opacity: 0.85 }}>
          {motivoBanner}
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

// ── LevelSelect ──────────────────────────────────────────────────────────────
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

// ── LessonApp ────────────────────────────────────────────────────────────────
function LessonApp({ langId, levelId, progress, onBack, onOpenLesson, userName }) {
  const lang    = CATALOG[langId];
  const level   = lang.levels.find(lv => lv.id === levelId);
  const lvProg  = progress[langId]?.[levelId] ?? { completed: [], streak: 0 };
  const completed = lvProg.completed;
  const streak    = lvProg.streak;
  const lessons   = Array.from({ length: level.lessons }, (_, i) => ({ id: i + 1, title: `Lição ${i + 1}`, unit: `Unidade ${Math.ceil((i + 1) / 5)}` }));
  const [activeTab, setActiveTab] = useState("home");
  const total = completed.length;
  const pct   = Math.round((total / level.lessons) * 100);
  const next  = lessons.find(l => !completed.includes(l.id)) ?? lessons[0];
  const bgRgb = langId === "mandarin" ? "10,10,18" : langId === "spanish" ? "18,10,0" : "0,6,15";

  const PBar = ({ val, max, h = 4 }) => (
    <div style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, height: h, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.round((val/max)*100)}%`, background: `linear-gradient(90deg,${lang.color1},${lang.color2})`, borderRadius: 8, transition: "width .5s" }} />
    </div>
  );

  const motivoBanner = streak >= 3
    ? `🔥 ${streak} dias seguidos! Você está arrasando!`
    : total === 0
    ? "Pronta para a primeira lição? Vai lá! 🌱"
    : total < 5
    ? "Você está começando bem! Não para agora! 💪"
    : `${total} lições concluídas! Continue assim! ⭐`;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${lang.bg1},${lang.bg2})`, fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        {lang.script.map((c, i) => (
          <div key={i} style={{ position: "absolute", fontSize: i%3===0?68:i%3===1?44:28, color: `${lang.color2}${Math.round((.03+i*.006)*255).toString(16).padStart(2,"0")}`, top: `${(i*13)%88}%`, left: `${(i*17+5)%88}%`, transform: `rotate(${i%2===0?12:-12}deg)`, userSelect: "none" }}>{c}</div>
        ))}
      </div>
      <div style={{ position: "relative", zIndex: 1, paddingBottom: 90 }}>
        <div style={{ padding: "50px 24px 18px", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <button onClick={onBack} style={{ background: "none", border: "none", color: lang.color2+"bb", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", padding: 0, marginBottom: 8 }}>‹ Níveis</button>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: lang.color2, textTransform: "uppercase", marginBottom: 4 }}>{lang.flag} {lang.name} · {level.name}</div>
              <div style={{ fontSize: 21, fontWeight: 700 }}>Olá, {userName}! 👋</div>
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
            <div style={{ background: `linear-gradient(135deg,${lang.color1}18,${lang.color2}10)`, borderRadius: 14, padding: "11px 16px", marginBottom: 16, border: `1px solid ${lang.color2}25`, fontSize: 12, textAlign: "center", color: lang.color2 }}>
              {motivoBanner}
            </div>
            <div style={{ background: `linear-gradient(135deg,${lang.color1}22,${lang.color1}38)`, borderRadius: 20, padding: 18, marginBottom: 18, border: `1px solid ${lang.color2}38`, boxShadow: `0 8px 28px ${lang.color1}28` }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", color: lang.color2, textTransform: "uppercase", marginBottom: 8 }}>📅 Próxima lição</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{next.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>{next.unit} · 30 min</div>
                </div>
                <div onClick={() => onOpenLesson(next)} style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${lang.color1},${lang.color2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer", boxShadow: `0 4px 18px ${lang.glow}` }}>▶</div>
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
              const isCur = lesson.id === next?.id;
              return (
                <div key={lesson.id} onClick={() => onOpenLesson(lesson)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 14, marginBottom: 7, background: done ? `${lang.color1}22` : isCur ? `${lang.color1}10` : "rgba(255,255,255,.025)", border: done ? `1px solid ${lang.color2}35` : isCur ? `1px solid ${lang.color2}50` : "1px solid rgba(255,255,255,.04)", cursor: "pointer" }}>
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
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, background: "none", border: "none", color: activeTab === tab.id ? lang.color2 : "rgba(255,255,255,.3)", padding: "14px 0 20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "color .2s", fontFamily: "inherit" }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── LessonPlayer (tela completa) ─────────────────────────────────────────────
function LessonPlayer({ langId, levelId, lesson, progress, setProgress, userId, onBack }) {
  const lang    = CATALOG[langId];
  const level   = lang.levels.find(lv => lv.id === levelId);
  const lvProg  = progress[langId]?.[levelId] ?? { completed: [], streak: 0 };
  const completed = lvProg.completed;
  const streak    = lvProg.streak;

  const saveProgress = async (newCompleted, newStreak) => {
    setProgress(p => ({ ...p, [langId]: { ...p[langId], [levelId]: { completed: newCompleted, streak: newStreak } } }));
    if (userId) await upsertProgress(userId, langId, levelId, newCompleted, newStreak);
  };

  const [isPlaying,   setIsPlaying]   = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [audioDur,    setAudioDur]    = useState(1800);
  const [audioReady,  setAudioReady]  = useState(false);
  const [audioStatus, setAudioStatus] = useState("loading");
  const [celebrating, setCelebrating] = useState(false);
  const [celebMsg,    setCelebMsg]    = useState("");
  const [motivoMsg]   = useState(() => MOTIVATION_MSGS[Math.floor(Math.random() * MOTIVATION_MSGS.length)]);

  const audioRef     = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const url = audioUrl(langId, levelId, lesson.id);
    fetch(url, { method: "HEAD" })
      .then(res => {
        if (!res.ok) throw new Error();
        const audio = new Audio(url);
        audio.onloadedmetadata = () => { setAudioDur(Math.floor(audio.duration) || 1800); setElapsed(0); };
        audio.ontimeupdate    = () => setElapsed(Math.floor(audio.currentTime));
        audio.onended         = () => setIsPlaying(false);
        audio.onerror         = () => { setAudioStatus("error"); setAudioReady(false); };
        audio.oncanplaythrough = () => { setAudioReady(true); setAudioStatus("ready"); };
        audioRef.current = audio;
      })
      .catch(() => setAudioStatus("error"));
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current || !audioReady) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying, audioReady]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const seekBack    = () => { if (audioRef.current && audioReady) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); };
  const seekForward = () => { if (audioRef.current && audioReady) audioRef.current.currentTime = Math.min(audioRef.current.duration || 1800, audioRef.current.currentTime + 30); };

  const handleFileImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    const audio = new Audio(URL.createObjectURL(file));
    audio.onloadedmetadata = () => { setAudioDur(Math.floor(audio.duration) || 1800); setElapsed(0); };
    audio.ontimeupdate    = () => setElapsed(Math.floor(audio.currentTime));
    audio.onended         = () => setIsPlaying(false);
    audio.oncanplaythrough = () => { setAudioReady(true); setAudioStatus("ready"); };
    audioRef.current = audio;
    setAudioStatus("ready"); setAudioReady(true);
    e.target.value = "";
  };

  const markComplete = async () => {
    const alreadyDone  = completed.includes(lesson.id);
    const newCompleted = alreadyDone ? completed : [...completed, lesson.id];
    const newStreak    = alreadyDone ? streak : streak + 1;
    await saveProgress(newCompleted, newStreak);
    if (!alreadyDone) {
      setCelebMsg(MILESTONES[newCompleted.length] || `Lição ${lesson.id} concluída! Continue assim! 💪`);
      setCelebrating(true);
      setTimeout(() => { setCelebrating(false); onBack(); }, 2800);
    } else {
      onBack();
    }
  };

  const isDone = completed.includes(lesson.id);
  const pct    = Math.round((elapsed / audioDur) * 100);

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${lang.bg1},${lang.bg2})`, fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e0f0", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

      {/* Fundo decorativo */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "25%", left: "50%", width: 380, height: 380, borderRadius: "50%", background: `radial-gradient(circle,${lang.color1}20,transparent 70%)`, transform: "translateX(-50%)" }} />
        {lang.script.slice(0, 4).map((c, i) => (
          <div key={i} style={{ position: "absolute", fontSize: [80, 50, 70, 45][i], color: `${lang.color2}07`, top: [`8%`, `68%`, `15%`, `72%`][i], left: [`4%`, `72%`, `76%`, `8%`][i], transform: `rotate(${[15, -12, 8, -18][i]}deg)`, userSelect: "none" }}>{c}</div>
        ))}
      </div>

      {/* Celebração */}
      {celebrating && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: `linear-gradient(135deg,${lang.color1},${lang.color2})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 88, marginBottom: 24 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>{celebMsg}</div>
          <div style={{ fontSize: 12, opacity: 0.65 }}>Voltando às lições...</div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, padding: "0 24px 40px" }}>

        {/* Header */}
        <div style={{ paddingTop: 54, paddingBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: lang.color2+"bb", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>‹ Lições</button>
          {isDone && <div style={{ fontSize: 11, color: lang.color2, background: `${lang.color1}28`, borderRadius: 20, padding: "4px 12px", border: `1px solid ${lang.color2}40` }}>✓ Concluída</div>}
        </div>

        {/* Mensagem motivacional */}
        <div style={{ background: `${lang.color1}18`, borderRadius: 14, padding: "10px 16px", marginBottom: 24, border: `1px solid ${lang.color2}20`, fontSize: 11, textAlign: "center", color: lang.color2, lineHeight: 1.5 }}>
          {motivoMsg}
        </div>

        {/* Album art */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div style={{
            width: 170, height: 170, borderRadius: "50%",
            background: `linear-gradient(135deg,${lang.color1},${lang.color2})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 76,
            boxShadow: isPlaying
              ? `0 0 0 18px ${lang.color1}22, 0 0 0 36px ${lang.color1}0c, 0 20px 56px ${lang.glow}`
              : `0 14px 44px ${lang.glow}`,
            transition: "box-shadow 1s ease",
          }}>
            {lang.flag}
          </div>
        </div>

        {/* Info da faixa */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: lang.color2, textTransform: "uppercase", marginBottom: 8, opacity: 0.8 }}>{level.name} · {lesson.unit}</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 4 }}>{lesson.title}</div>
          <div style={{ fontSize: 13, opacity: 0.38 }}>{lang.name} · ~30 min</div>
        </div>

        {/* Barra de progresso */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, height: 5, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${lang.color1},${lang.accent})`, borderRadius: 8, transition: "width 1s linear" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, opacity: 0.38 }}>{fmt(elapsed)}</span>
            <span style={{ fontSize: 11, opacity: 0.38 }}>{fmt(audioDur)}</span>
          </div>
        </div>

        {/* Controles */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 28 }}>
          <button onClick={seekBack} style={{ background: "rgba(255,255,255,.08)", border: "none", color: "#fff", borderRadius: 18, padding: "15px 22px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>⏪ 10s</button>
          <button
            onClick={() => setIsPlaying(p => !p)}
            disabled={!audioReady}
            style={{
              width: 76, height: 76, borderRadius: "50%", border: "none", color: "#fff", fontSize: 26,
              background: !audioReady ? "rgba(255,255,255,.08)" : isPlaying ? `linear-gradient(135deg,${lang.accent},${lang.color1})` : `linear-gradient(135deg,${lang.color1},${lang.color2})`,
              cursor: audioReady ? "pointer" : "not-allowed", opacity: audioReady ? 1 : 0.4,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: audioReady ? `0 8px 28px ${lang.glow}` : "none", transition: "all .25s", fontFamily: "inherit",
            }}>
            {audioStatus === "loading" ? "⏳" : isPlaying ? "⏸" : "▶"}
          </button>
          <button onClick={seekForward} style={{ background: "rgba(255,255,255,.08)", border: "none", color: "#fff", borderRadius: 18, padding: "15px 22px", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600 }}>30s ⏩</button>
        </div>

        {/* Status do áudio */}
        <input ref={fileInputRef} type="file" accept=".mp3,audio/*" style={{ display: "none" }} onChange={handleFileImport} />
        {audioStatus === "error" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 10, padding: "8px 14px", marginBottom: 8, fontSize: 10, color: "#fca5a5", textAlign: "center" }}>
              Arquivo não encontrado no R2 — importe manualmente
            </div>
            <div onClick={() => fileInputRef.current?.click()} style={{ background: `${lang.color1}14`, border: `1.5px dashed ${lang.color2}45`, borderRadius: 14, padding: "14px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>🎵</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Importar .mp3 manualmente</div>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Botão concluir */}
        <button onClick={markComplete} style={{ width: "100%", background: isDone ? "rgba(255,255,255,.07)" : `linear-gradient(135deg,${lang.color1},${lang.color2})`, border: "none", color: "#fff", borderRadius: 18, padding: "18px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: isDone ? "none" : `0 6px 24px ${lang.glow}`, fontFamily: "inherit" }}>
          {isDone ? "✓ Lição já concluída" : "✅ Marcar como concluída"}
        </button>
      </div>
    </div>
  );
}

// ── App (root) ───────────────────────────────────────────────────────────────
export default function App() {
  const [user,          setUser]          = useState(null);
  const [authChecked,   setAuthChecked]   = useState(false);
  const [needsName,     setNeedsName]     = useState(false);
  const [selectedLang,  setSelectedLang]  = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedLesson,setSelectedLesson]= useState(null);
  const [progress,      setProgress]      = useState(buildDefaultProgress);

  const handleAuth = async (u) => {
    setUser(u);
    if (!u.user_metadata?.name) setNeedsName(true);
    const p = await fetchProgress(u.id);
    if (p) setProgress(p);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await handleAuth(session.user);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) await handleAuth(session.user);
      else if (event === "SIGNED_OUT") {
        setUser(null); setProgress(buildDefaultProgress());
        setSelectedLang(null); setSelectedLevel(null); setSelectedLesson(null); setNeedsName(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authChecked) return (
    <div style={{ minHeight: "100vh", background: "#080810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", color: "rgba(255,255,255,.3)", fontSize: 12 }}>
      Carregando...
    </div>
  );

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  if (needsName) return (
    <NameScreen onSave={(name) => { setUser(u => ({ ...u, user_metadata: { ...u.user_metadata, name } })); setNeedsName(false); }} />
  );

  const userName = user.user_metadata?.name || user.email.split("@")[0];

  if (selectedLesson) return (
    <LessonPlayer
      langId={selectedLang} levelId={selectedLevel} lesson={selectedLesson}
      progress={progress} setProgress={setProgress} userId={user.id}
      onBack={() => setSelectedLesson(null)}
    />
  );

  if (selectedLevel) return (
    <LessonApp
      langId={selectedLang} levelId={selectedLevel}
      progress={progress} userId={user.id}
      onBack={() => setSelectedLevel(null)}
      onOpenLesson={setSelectedLesson}
      userName={userName}
    />
  );

  if (selectedLang) return (
    <LevelSelect langId={selectedLang} progress={progress} onSelect={setSelectedLevel} onBack={() => setSelectedLang(null)} />
  );

  return (
    <LangSelect progress={progress} user={user} userName={userName} onSelect={setSelectedLang} onLogout={() => supabase.auth.signOut()} />
  );
}
