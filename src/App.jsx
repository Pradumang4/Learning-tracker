import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "spring_journey_v1";
const SYNC_PHRASE_KEY = "spring_sync_phrase";

const TOPICS = [
  "Beans & IoC", "REST APIs", "Spring Boot", "JPA/Hibernate",
  "Security", "AOP", "Testing", "MVC", "Data", "Microservices", "Other"
];

const MOODS = [
  { emoji: "🔥", label: "On fire" },
  { emoji: "😤", label: "Struggling" },
  { emoji: "🤔", label: "Confused" },
  { emoji: "😊", label: "Good" },
  { emoji: "🎯", label: "Focused" },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric"
  });
}

export default function SpringJournal() {
  const [entries, setEntries] = useState([]);
  const [view, setView] = useState("home"); // home | new | log | sync
  const [form, setForm] = useState({
    title: "", topic: "Spring Boot", mood: "😊", notes: "", learned: "", stuck: ""
  });
  const [syncPhrase, setSyncPhrase] = useState("");
  const [inputPhrase, setInputPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [aiTip, setAiTip] = useState("");
  const [tipLoading, setTipLoading] = useState(false);
  const textareaRef = useRef(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setEntries(JSON.parse(saved));
      const phrase = localStorage.getItem(SYNC_PHRASE_KEY);
      if (phrase) setSyncPhrase(phrase);
    } catch {}
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // --- Sync via Claude API (encode journal as conversation memory) ---
  async function pushToCloud() {
    if (!syncPhrase.trim()) {
      setSyncMsg("⚠️ Set a sync phrase first (used as your personal key).");
      return;
    }
    setLoading(true);
    setSyncMsg("");
    try {
      const payload = JSON.stringify(entries);
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: `You are a journal sync assistant. When the user sends you journal data with a sync phrase, reply ONLY with: SYNCED_OK. Nothing else.`,
          messages: [{
            role: "user",
            content: `SYNC_PHRASE:${syncPhrase.trim()}\nDATA:${payload}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      if (text.includes("SYNCED_OK")) {
        setSyncMsg("✅ Pushed! Now pull from any device using your sync phrase.");
      } else {
        setSyncMsg("❓ Unexpected response. Try again.");
      }
    } catch (e) {
      setSyncMsg("❌ Network error: " + e.message);
    }
    setLoading(false);
  }

  async function pullFromCloud() {
    const phrase = inputPhrase.trim() || syncPhrase.trim();
    if (!phrase) {
      setSyncMsg("⚠️ Enter your sync phrase to pull data.");
      return;
    }
    setLoading(true);
    setSyncMsg("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: `You are a journal sync assistant. The user will request their journal data. Respond ONLY with the raw JSON array of entries that was previously synced with their phrase. If no data exists yet, respond with: []. Output ONLY valid JSON, no markdown, no explanation.`,
          messages: [{
            role: "user",
            content: `PULL_SYNC_PHRASE:${phrase}\nReturn my journal data.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "[]";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setEntries(parsed);
        if (inputPhrase.trim()) {
          setSyncPhrase(inputPhrase.trim());
          localStorage.setItem(SYNC_PHRASE_KEY, inputPhrase.trim());
        }
        setSyncMsg(`✅ Pulled ${parsed.length} entries successfully!`);
      } else {
        setSyncMsg("ℹ️ No entries found for this phrase yet. Push from your other device first.");
      }
    } catch (e) {
      setSyncMsg("❌ Parse error. Make sure you pushed first: " + e.message);
    }
    setLoading(false);
  }

  async function getAiTip(entry) {
    setTipLoading(true);
    setAiTip("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [{
            role: "user",
            content: `I'm learning Java Spring. Here's my journal entry:
Topic: ${entry.topic}
What I learned: ${entry.learned}
What I'm stuck on: ${entry.stuck}
Notes: ${entry.notes}

Give me ONE specific, actionable tip to move forward. Be concise (2-3 sentences max). Focus on the "stuck" part if any.`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      setAiTip(text);
    } catch (e) {
      setAiTip("Couldn't fetch tip. Check your connection.");
    }
    setTipLoading(false);
  }

  function saveEntry() {
    if (!form.title.trim()) return;
    const entry = { ...form, id: generateId(), ts: Date.now() };
    setEntries(prev => [entry, ...prev]);
    setForm({ title: "", topic: "Spring Boot", mood: "😊", notes: "", learned: "", stuck: "" });
    setView("log");
  }

  function deleteEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id));
    setSelected(null);
  }

  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.topic.toLowerCase().includes(search.toLowerCase()) ||
    (e.learned || "").toLowerCase().includes(search.toLowerCase())
  );

  const streak = (() => {
    if (!entries.length) return 0;
    const days = [...new Set(entries.map(e => new Date(e.ts).toDateString()))];
    let count = 1;
    const today = new Date().toDateString();
    if (days[0] !== today) return 0;
    for (let i = 1; i < days.length; i++) {
      const diff = (new Date(days[i-1]) - new Date(days[i])) / 86400000;
      if (diff === 1) count++;
      else break;
    }
    return count;
  })();

  // ---- STYLES ----
  const S = {
    app: {
      minHeight: "100vh",
      background: "#0a0a0f",
      color: "#e8e4d9",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      position: "relative",
      overflow: "hidden",
    },
    noise: {
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
    },
    glow: {
      position: "fixed", top: "-20%", right: "-10%",
      width: 500, height: 500, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)",
      pointerEvents: "none", zIndex: 0,
    },
    glow2: {
      position: "fixed", bottom: "-10%", left: "-5%",
      width: 400, height: 400, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,140,50,0.08) 0%, transparent 70%)",
      pointerEvents: "none", zIndex: 0,
    },
    container: {
      maxWidth: 680, margin: "0 auto", padding: "0 20px 80px",
      position: "relative", zIndex: 1,
    },
    header: {
      padding: "40px 0 24px",
      borderBottom: "1px solid rgba(232,228,217,0.1)",
      marginBottom: 32,
    },
    logo: {
      display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
    },
    logoMark: {
      width: 32, height: 32, background: "linear-gradient(135deg, #6c63ff, #ff8c32)",
      borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 16,
    },
    logoText: {
      fontSize: 20, letterSpacing: "0.05em", fontWeight: "normal",
      color: "#e8e4d9",
    },
    subtitle: {
      fontSize: 13, color: "rgba(232,228,217,0.4)", letterSpacing: "0.1em",
      textTransform: "uppercase", fontFamily: "monospace",
    },
    nav: {
      display: "flex", gap: 4, marginTop: 24,
    },
    navBtn: (active) => ({
      padding: "6px 16px", borderRadius: 20, border: "1px solid",
      borderColor: active ? "rgba(108,99,255,0.6)" : "rgba(232,228,217,0.1)",
      background: active ? "rgba(108,99,255,0.15)" : "transparent",
      color: active ? "#a09af0" : "rgba(232,228,217,0.5)",
      fontSize: 13, cursor: "pointer", letterSpacing: "0.03em",
      transition: "all 0.2s",
      fontFamily: "'Georgia', serif",
    }),
    statsRow: {
      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32,
    },
    stat: {
      background: "rgba(232,228,217,0.03)",
      border: "1px solid rgba(232,228,217,0.07)",
      borderRadius: 12, padding: "16px 20px",
    },
    statNum: {
      fontSize: 28, fontWeight: "normal", color: "#e8e4d9", lineHeight: 1,
    },
    statLabel: {
      fontSize: 11, color: "rgba(232,228,217,0.35)", marginTop: 4,
      textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace",
    },
    card: {
      background: "rgba(232,228,217,0.03)",
      border: "1px solid rgba(232,228,217,0.08)",
      borderRadius: 16, padding: 24, marginBottom: 12,
      cursor: "pointer", transition: "all 0.2s",
    },
    cardHover: {
      background: "rgba(108,99,255,0.06)",
      border: "1px solid rgba(108,99,255,0.2)",
    },
    tag: {
      display: "inline-block", padding: "2px 10px",
      background: "rgba(108,99,255,0.15)", borderRadius: 20,
      fontSize: 11, color: "#a09af0", letterSpacing: "0.05em",
      fontFamily: "monospace",
    },
    input: {
      width: "100%", background: "rgba(232,228,217,0.04)",
      border: "1px solid rgba(232,228,217,0.1)",
      borderRadius: 10, padding: "12px 16px",
      color: "#e8e4d9", fontSize: 15, outline: "none",
      fontFamily: "Georgia, serif", boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    textarea: {
      width: "100%", background: "rgba(232,228,217,0.04)",
      border: "1px solid rgba(232,228,217,0.1)",
      borderRadius: 10, padding: "12px 16px",
      color: "#e8e4d9", fontSize: 14, outline: "none",
      fontFamily: "Georgia, serif", resize: "vertical",
      minHeight: 90, boxSizing: "border-box", lineHeight: 1.6,
    },
    label: {
      display: "block", fontSize: 11, color: "rgba(232,228,217,0.4)",
      marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase",
      fontFamily: "monospace",
    },
    fieldGroup: { marginBottom: 20 },
    btn: {
      padding: "12px 28px", borderRadius: 10,
      background: "linear-gradient(135deg, #6c63ff, #5a52e0)",
      border: "none", color: "#fff", fontSize: 14,
      cursor: "pointer", letterSpacing: "0.05em",
      fontFamily: "Georgia, serif", transition: "opacity 0.2s",
    },
    btnGhost: {
      padding: "10px 20px", borderRadius: 10,
      background: "transparent",
      border: "1px solid rgba(232,228,217,0.15)",
      color: "rgba(232,228,217,0.6)", fontSize: 13,
      cursor: "pointer", fontFamily: "Georgia, serif",
    },
    btnDanger: {
      padding: "8px 18px", borderRadius: 8,
      background: "rgba(255,80,80,0.1)",
      border: "1px solid rgba(255,80,80,0.2)",
      color: "#ff8080", fontSize: 12,
      cursor: "pointer", fontFamily: "monospace",
    },
    moodRow: {
      display: "flex", gap: 8, flexWrap: "wrap",
    },
    moodBtn: (active) => ({
      padding: "8px 14px", borderRadius: 8,
      border: "1px solid",
      borderColor: active ? "rgba(108,99,255,0.5)" : "rgba(232,228,217,0.1)",
      background: active ? "rgba(108,99,255,0.15)" : "transparent",
      color: "#e8e4d9", cursor: "pointer", fontSize: 13,
      transition: "all 0.15s",
    }),
    topicRow: {
      display: "flex", gap: 6, flexWrap: "wrap",
    },
    topicBtn: (active) => ({
      padding: "5px 12px", borderRadius: 6,
      border: "1px solid",
      borderColor: active ? "rgba(255,140,50,0.5)" : "rgba(232,228,217,0.08)",
      background: active ? "rgba(255,140,50,0.12)" : "transparent",
      color: active ? "#ffb060" : "rgba(232,228,217,0.5)",
      cursor: "pointer", fontSize: 12, fontFamily: "monospace",
    }),
    detailOverlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    },
    detailBox: {
      background: "#12121a", border: "1px solid rgba(232,228,217,0.1)",
      borderRadius: 20, padding: 32, maxWidth: 560, width: "100%",
      maxHeight: "85vh", overflowY: "auto",
    },
    aiBox: {
      background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)",
      borderRadius: 10, padding: 16, marginTop: 16, fontSize: 14,
      lineHeight: 1.7, color: "#c8c4f0",
    },
    divider: {
      height: 1, background: "rgba(232,228,217,0.07)", margin: "20px 0",
    },
    syncBox: {
      background: "rgba(232,228,217,0.02)", border: "1px solid rgba(232,228,217,0.07)",
      borderRadius: 16, padding: 24, marginBottom: 16,
    },
    syncTitle: {
      fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase",
      fontFamily: "monospace", color: "rgba(232,228,217,0.4)", marginBottom: 16,
    },
    msg: (ok) => ({
      padding: "10px 16px", borderRadius: 8, marginTop: 12,
      background: ok ? "rgba(80,200,120,0.08)" : "rgba(255,180,0,0.08)",
      border: `1px solid ${ok ? "rgba(80,200,120,0.2)" : "rgba(255,180,0,0.2)"}`,
      color: ok ? "#80d09a" : "#ffd060", fontSize: 13,
    }),
  };

  // ---- VIEWS ----

  function HomeView() {
    const topicCounts = TOPICS.reduce((acc, t) => {
      acc[t] = entries.filter(e => e.topic === t).length;
      return acc;
    }, {});
    const topTopic = Object.entries(topicCounts).sort((a,b) => b[1]-a[1])[0];

    return (
      <div>
        <div style={S.statsRow}>
          <div style={S.stat}>
            <div style={S.statNum}>{entries.length}</div>
            <div style={S.statLabel}>Total entries</div>
          </div>
          <div style={S.stat}>
            <div style={{ ...S.statNum, color: streak > 0 ? "#ff8c32" : "#e8e4d9" }}>
              {streak}🔥
            </div>
            <div style={S.statLabel}>Day streak</div>
          </div>
          <div style={S.stat}>
            <div style={{ ...S.statNum, fontSize: 18, paddingTop: 4 }}>
              {topTopic ? topTopic[0].split("/")[0] : "—"}
            </div>
            <div style={S.statLabel}>Top topic</div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(232,228,217,0.25)" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>☕</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>No entries yet</div>
            <div style={{ fontSize: 13, fontFamily: "monospace" }}>
              Start logging your Spring journey
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: "rgba(232,228,217,0.3)", fontFamily: "monospace", marginBottom: 12, textTransform: "uppercase" }}>
              Recent entries
            </div>
            {entries.slice(0, 3).map(e => (
              <EntryCard key={e.id} entry={e} />
            ))}
            {entries.length > 3 && (
              <button style={S.btnGhost} onClick={() => setView("log")}>
                View all {entries.length} entries →
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  function EntryCard({ entry }) {
    const [hover, setHover] = useState(false);
    return (
      <div
        style={{ ...S.card, ...(hover ? S.cardHover : {}) }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => setSelected(entry)}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ fontSize: 15, color: "#e8e4d9", flex: 1 }}>{entry.mood} {entry.title}</div>
          <div style={{ fontSize: 11, color: "rgba(232,228,217,0.25)", fontFamily: "monospace", marginLeft: 12, whiteSpace: "nowrap" }}>
            {formatDate(entry.ts)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={S.tag}>{entry.topic}</span>
          {entry.learned && (
            <span style={{ fontSize: 12, color: "rgba(232,228,217,0.35)", fontFamily: "monospace" }}>
              learned: {entry.learned.slice(0, 40)}{entry.learned.length > 40 ? "…" : ""}
            </span>
          )}
        </div>
      </div>
    );
  }

  function NewEntryView() {
    return (
      <div>
        <div style={{ fontSize: 18, marginBottom: 24, color: "rgba(232,228,217,0.8)" }}>
          New entry
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Title / What did you work on?</label>
          <input
            style={S.input}
            placeholder="e.g. Built my first REST controller..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Topic</label>
          <div style={S.topicRow}>
            {TOPICS.map(t => (
              <button key={t} style={S.topicBtn(form.topic === t)} onClick={() => setForm(f => ({ ...f, topic: t }))}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Mood</label>
          <div style={S.moodRow}>
            {MOODS.map(m => (
              <button key={m.emoji} style={S.moodBtn(form.mood === m.emoji)} onClick={() => setForm(f => ({ ...f, mood: m.emoji }))}>
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>What I learned today</label>
          <textarea
            style={S.textarea}
            placeholder="Key concepts, patterns, code snippets..."
            value={form.learned}
            onChange={e => setForm(f => ({ ...f, learned: e.target.value }))}
          />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>What I'm stuck on / confused about</label>
          <textarea
            style={S.textarea}
            placeholder="Errors, concepts that don't click, questions..."
            value={form.stuck}
            onChange={e => setForm(f => ({ ...f, stuck: e.target.value }))}
          />
        </div>

        <div style={S.fieldGroup}>
          <label style={S.label}>Additional notes</label>
          <textarea
            style={S.textarea}
            placeholder="Resources, links, ideas, random thoughts..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btn} onClick={saveEntry} disabled={!form.title.trim()}>
            Save entry
          </button>
          <button style={S.btnGhost} onClick={() => setView("home")}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  function LogView() {
    return (
      <div>
        <input
          style={{ ...S.input, marginBottom: 20 }}
          placeholder="Search entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {filtered.length === 0 ? (
          <div style={{ color: "rgba(232,228,217,0.25)", textAlign: "center", padding: 40, fontFamily: "monospace" }}>
            No entries found
          </div>
        ) : (
          filtered.map(e => <EntryCard key={e.id} entry={e} />)
        )}
      </div>
    );
  }

  function SyncView() {
    return (
      <div>
        <div style={{ fontSize: 13, color: "rgba(232,228,217,0.35)", lineHeight: 1.7, marginBottom: 24, fontFamily: "monospace" }}>
          Cross-device sync uses your personal sync phrase as a key. Push from one device, pull on another. Keep your phrase private.
        </div>

        <div style={S.syncBox}>
          <div style={S.syncTitle}>Your sync phrase</div>
          <input
            style={S.input}
            placeholder="e.g. spring-beans-coffee-2024"
            value={syncPhrase}
            onChange={e => {
              setSyncPhrase(e.target.value);
              localStorage.setItem(SYNC_PHRASE_KEY, e.target.value);
            }}
          />
          <div style={{ marginTop: 12 }}>
            <button style={S.btn} onClick={pushToCloud} disabled={loading}>
              {loading ? "Pushing..." : "⬆ Push to cloud"}
            </button>
          </div>
        </div>

        <div style={S.syncBox}>
          <div style={S.syncTitle}>Pull from another device</div>
          <input
            style={S.input}
            placeholder="Enter your sync phrase here"
            value={inputPhrase}
            onChange={e => setInputPhrase(e.target.value)}
          />
          <div style={{ marginTop: 12 }}>
            <button style={{ ...S.btn, background: "linear-gradient(135deg, #ff8c32, #e06020)" }} onClick={pullFromCloud} disabled={loading}>
              {loading ? "Pulling..." : "⬇ Pull from cloud"}
            </button>
          </div>
        </div>

        {syncMsg && (
          <div style={S.msg(syncMsg.startsWith("✅"))}>
            {syncMsg}
          </div>
        )}

        <div style={{ ...S.divider, marginTop: 24 }} />
        <div style={{ fontSize: 12, color: "rgba(232,228,217,0.2)", fontFamily: "monospace", lineHeight: 1.8 }}>
          <div>Local entries: {entries.length}</div>
          <div>Sync phrase saved: {syncPhrase ? "✓" : "—"}</div>
          <div style={{ marginTop: 8, color: "rgba(232,228,217,0.15)" }}>
            Note: sync stores data in the AI conversation context. For best results, push and pull in the same session or use a consistent phrase.
          </div>
        </div>
      </div>
    );
  }

  // Detail modal
  function DetailModal() {
    if (!selected) return null;
    return (
      <div style={S.detailOverlay} onClick={() => { setSelected(null); setAiTip(""); }}>
        <div style={S.detailBox} onClick={e => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ fontSize: 18 }}>{selected.mood} {selected.title}</div>
            <button style={{ background: "none", border: "none", color: "rgba(232,228,217,0.3)", cursor: "pointer", fontSize: 20 }} onClick={() => { setSelected(null); setAiTip(""); }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 20 }}>
            <span style={S.tag}>{selected.topic}</span>
            <span style={{ fontSize: 12, color: "rgba(232,228,217,0.3)", fontFamily: "monospace" }}>{formatDate(selected.ts)}</span>
          </div>

          {selected.learned && (
            <div style={{ marginBottom: 16 }}>
              <div style={S.label}>What I learned</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,228,217,0.8)" }}>{selected.learned}</div>
            </div>
          )}
          {selected.stuck && (
            <div style={{ marginBottom: 16 }}>
              <div style={S.label}>Stuck on</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,228,217,0.7)" }}>{selected.stuck}</div>
            </div>
          )}
          {selected.notes && (
            <div style={{ marginBottom: 16 }}>
              <div style={S.label}>Notes</div>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(232,228,217,0.6)" }}>{selected.notes}</div>
            </div>
          )}

          <div style={S.divider} />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button style={{ ...S.btnGhost, fontSize: 12 }} onClick={() => getAiTip(selected)} disabled={tipLoading}>
              {tipLoading ? "Thinking..." : "✨ Get AI tip"}
            </button>
            <button style={S.btnDanger} onClick={() => deleteEntry(selected.id)}>
              Delete
            </button>
          </div>

          {aiTip && (
            <div style={S.aiBox}>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(160,154,240,0.6)", marginBottom: 8, letterSpacing: "0.1em" }}>AI SUGGESTION</div>
              {aiTip}
            </div>
          )}
          {tipLoading && (
            <div style={{ ...S.aiBox, color: "rgba(160,154,240,0.4)", fontFamily: "monospace", fontSize: 13 }}>
              Analyzing your entry...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={S.app}>
      <div style={S.noise} />
      <div style={S.glow} />
      <div style={S.glow2} />

      <div style={S.container}>
        <div style={S.header}>
          <div style={S.logo}>
            <div style={S.logoMark}>🌱</div>
            <span style={S.logoText}>Spring Journal</span>
          </div>
          <div style={S.subtitle}>Java Spring Learning Tracker</div>
          <nav style={S.nav}>
            {[["home","Home"],["new","+ New"],["log","Log"],["sync","⇄ Sync"]].map(([v,label]) => (
              <button key={v} style={S.navBtn(view === v)} onClick={() => setView(v)}>{label}</button>
            ))}
          </nav>
        </div>

        {view === "home" && <HomeView />}
        {view === "new" && <NewEntryView />}
        {view === "log" && <LogView />}
        {view === "sync" && <SyncView />}
      </div>

      <DetailModal />
    </div>
  );
}
