import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "java-spring-learning-logs-v1";
const SETTINGS_KEY = "java-spring-learning-settings-v1";

const topics = [
  "Core Java",
  "Spring Boot",
  "REST API",
  "Spring MVC",
  "Spring Data JPA",
  "Hibernate",
  "MySQL",
  "Security",
  "JWT",
  "Validation",
  "Exception Handling",
  "Testing",
  "Git/GitHub",
  "Deployment",
  "Project Work",
];

const statuses = ["Learning", "Practiced", "Completed", "Stuck", "Revision"];
const moods = ["Focused", "Normal", "Tired", "Confused", "Confident"];
const difficulties = ["Easy", "Medium", "Hard"];

function getToday() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDayName(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getEmptyForm() {
  return {
    date: getToday(),
    title: "",
    topic: "Spring Boot",
    duration: 60,
    status: "Learning",
    difficulty: "Medium",
    mood: "Focused",
    tags: "",
    learned: "",
    blockers: "",
    nextStep: "",
    resource: "",
  };
}

function getUniqueDates(logs) {
  return [...new Set(logs.map((log) => log.date))].sort().reverse();
}

function calculateStreak(logs) {
  const dates = new Set(logs.map((log) => log.date));
  let streak = 0;
  const current = new Date(getToday() + "T00:00:00");

  while (true) {
    const date = current.toISOString().slice(0, 10);
    if (dates.has(date)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function getLast7Days() {
  const days = [];
  const today = new Date(getToday() + "T00:00:00");

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  return days;
}

export default function App() {
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved
        ? JSON.parse(saved)
        : {
            mode: "dark",
            accent: "blue",
            dailyGoal: 60,
            weeklyGoal: 420,
          };
    } catch {
      return {
        mode: "dark",
        accent: "blue",
        dailyGoal: 60,
        weeklyGoal: 420,
      };
    }
  });

  const [form, setForm] = useState(getEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((log) => {
        return (
          log.title.toLowerCase().includes(q) ||
          log.topic.toLowerCase().includes(q) ||
          log.learned.toLowerCase().includes(q) ||
          log.tags.toLowerCase().includes(q) ||
          log.nextStep.toLowerCase().includes(q)
        );
      });
    }

    if (topicFilter !== "All") {
      result = result.filter((log) => log.topic === topicFilter);
    }

    if (statusFilter !== "All") {
      result = result.filter((log) => log.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "newest") return b.date.localeCompare(a.date);
      if (sortBy === "oldest") return a.date.localeCompare(b.date);
      if (sortBy === "duration") return Number(b.duration) - Number(a.duration);
      return 0;
    });

    return result;
  }, [logs, search, topicFilter, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const today = getToday();
    const todayLogs = logs.filter((log) => log.date === today);
    const totalMinutes = logs.reduce((sum, log) => sum + Number(log.duration || 0), 0);
    const todayMinutes = todayLogs.reduce((sum, log) => sum + Number(log.duration || 0), 0);

    const last7Days = getLast7Days();
    const weekMinutes = logs
      .filter((log) => last7Days.includes(log.date))
      .reduce((sum, log) => sum + Number(log.duration || 0), 0);

    const completed = logs.filter((log) => log.status === "Completed").length;
    const stuck = logs.filter((log) => log.status === "Stuck").length;

    return {
      totalLogs: logs.length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      todayMinutes,
      weekMinutes,
      completed,
      stuck,
      streak: calculateStreak(logs),
    };
  }, [logs]);

  const chartData = useMemo(() => {
    const days = getLast7Days();
    return days.map((day) => {
      const minutes = logs
        .filter((log) => log.date === day)
        .reduce((sum, log) => sum + Number(log.duration || 0), 0);

      return {
        day,
        label: getDayName(day),
        minutes,
      };
    });
  }, [logs]);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter title.");
      return;
    }

    const cleanLog = {
      ...form,
      title: form.title.trim(),
      learned: form.learned.trim(),
      blockers: form.blockers.trim(),
      nextStep: form.nextStep.trim(),
      resource: form.resource.trim(),
      tags: form.tags.trim(),
      duration: Number(form.duration) || 0,
      updatedAt: new Date().toISOString(),
    };

    if (editingId) {
      setLogs((prev) =>
        prev.map((log) =>
          log.id === editingId
            ? {
                ...log,
                ...cleanLog,
              }
            : log
        )
      );
      setEditingId(null);
    } else {
      setLogs((prev) => [
        {
          id: createId(),
          createdAt: new Date().toISOString(),
          ...cleanLog,
        },
        ...prev,
      ]);
    }

    setForm(getEmptyForm());
  }

  function handleEdit(log) {
    setForm({
      date: log.date,
      title: log.title,
      topic: log.topic,
      duration: log.duration,
      status: log.status,
      difficulty: log.difficulty,
      mood: log.mood,
      tags: log.tags,
      learned: log.learned,
      blockers: log.blockers,
      nextStep: log.nextStep,
      resource: log.resource,
    });

    setEditingId(log.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) {
    const ok = confirm("Delete this log?");
    if (!ok) return;

    setLogs((prev) => prev.filter((log) => log.id !== id));

    if (editingId === id) {
      setEditingId(null);
      setForm(getEmptyForm());
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(getEmptyForm());
  }

  function exportLogs() {
    const data = {
      app: "Java Spring Boot Learning Tracker",
      exportedAt: new Date().toISOString(),
      logs,
      settings,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "spring-boot-learning-logs.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importLogs(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const importedLogs = Array.isArray(parsed) ? parsed : parsed.logs;

        if (!Array.isArray(importedLogs)) {
          alert("Invalid file format.");
          return;
        }

        const ok = confirm("Import logs? This will add logs to your current list.");
        if (!ok) return;

        const logsWithIds = importedLogs.map((log) => ({
          ...log,
          id: log.id || createId(),
        }));

        setLogs((prev) => [...logsWithIds, ...prev]);
      } catch {
        alert("Could not import file.");
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  }

  function clearAllLogs() {
    const ok = confirm("This will delete all logs from this browser. Continue?");
    if (!ok) return;
    setLogs([]);
    setEditingId(null);
    setForm(getEmptyForm());
  }

  const todayProgress = Math.min(100, Math.round((stats.todayMinutes / settings.dailyGoal) * 100));
  const weeklyProgress = Math.min(100, Math.round((stats.weekMinutes / settings.weeklyGoal) * 100));
  const maxChartValue = Math.max(...chartData.map((d) => d.minutes), settings.dailyGoal, 1);

  return (
    <main className={`app ${settings.mode} accent-${settings.accent}`}>
      <style>{css}</style>

      <section className="hero">
        <div>
          <p className="eyebrow">Java + Spring Boot Journey</p>
          <h1>Daily Learning Tracker</h1>
          <p className="subtitle">
            Track what you learned, manage daily logs, measure consistency, and keep your GitHub-worthy
            learning progress organized.
          </p>

          <div className="hero-actions">
            <button className="btn primary" onClick={() => setForm(getEmptyForm())}>
              + New Log
            </button>
            <button className="btn ghost" onClick={() => setShowSettings((v) => !v)}>
              Customize
            </button>
            <button className="btn ghost" onClick={exportLogs}>
              Export Backup
            </button>

            <label className="btn ghost file-btn">
              Import
              <input type="file" accept="application/json" onChange={importLogs} />
            </label>
          </div>
        </div>

        <div className="hero-card">
          <div className="streak">{stats.streak}</div>
          <p>day streak</p>
          <span>Keep pushing daily. Small logs become big proof.</span>
        </div>
      </section>

      {showSettings && (
        <section className="panel settings-panel">
          <div className="section-head">
            <div>
              <h2>Customization</h2>
              <p>Personalize your tracker look and goals.</p>
            </div>
          </div>

          <div className="settings-grid">
            <div className="field">
              <label>Theme Mode</label>
              <select
                value={settings.mode}
                onChange={(e) => setSettings((s) => ({ ...s, mode: e.target.value }))}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div className="field">
              <label>Accent Color</label>
              <select
                value={settings.accent}
                onChange={(e) => setSettings((s) => ({ ...s, accent: e.target.value }))}
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="purple">Purple</option>
                <option value="orange">Orange</option>
              </select>
            </div>

            <div className="field">
              <label>Daily Goal Minutes</label>
              <input
                type="number"
                value={settings.dailyGoal}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    dailyGoal: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div className="field">
              <label>Weekly Goal Minutes</label>
              <input
                type="number"
                value={settings.weeklyGoal}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    weeklyGoal: Number(e.target.value) || 1,
                  }))
                }
              />
            </div>
          </div>
        </section>
      )}

      <section className="stats-grid">
        <StatCard label="Total Logs" value={stats.totalLogs} hint="All learning entries" />
        <StatCard label="Total Hours" value={`${stats.totalHours}h`} hint="Overall practice time" />
        <StatCard label="Today" value={`${stats.todayMinutes}m`} hint={`${todayProgress}% of daily goal`} />
        <StatCard label="This Week" value={`${stats.weekMinutes}m`} hint={`${weeklyProgress}% of weekly goal`} />
      </section>

      <section className="dashboard-grid">
        <section className="panel form-panel">
          <div className="section-head">
            <div>
              <h2>{editingId ? "Edit Learning Log" : "Add New Learning Log"}</h2>
              <p>Write what you actually learned today.</p>
            </div>

            {editingId && (
              <button className="btn danger-soft" onClick={cancelEdit}>
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="log-form">
            <div className="form-row">
              <div className="field">
                <label>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Topic</label>
                <select value={form.topic} onChange={(e) => handleChange("topic", e.target.value)}>
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Title / What did you work on?</label>
              <input
                type="text"
                placeholder="e.g. Built my first REST controller"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            <div className="form-row three">
              <div className="field">
                <label>Duration</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Minutes"
                  value={form.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Status</label>
                <select value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Difficulty</label>
                <select
                  value={form.difficulty}
                  onChange={(e) => handleChange("difficulty", e.target.value)}
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>What did you learn?</label>
              <textarea
                placeholder="Write in simple language. Example: Today I understood how @RestController returns JSON response..."
                value={form.learned}
                onChange={(e) => handleChange("learned", e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Blockers / Doubts</label>
                <textarea
                  placeholder="e.g. Confused between @Controller and @RestController"
                  value={form.blockers}
                  onChange={(e) => handleChange("blockers", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Next Step</label>
                <textarea
                  placeholder="e.g. Tomorrow I will create CRUD APIs"
                  value={form.nextStep}
                  onChange={(e) => handleChange("nextStep", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Tags</label>
                <input
                  type="text"
                  placeholder="rest, jpa, mysql, jwt"
                  value={form.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                />
              </div>

              <div className="field">
                <label>Mood</label>
                <select value={form.mood} onChange={(e) => handleChange("mood", e.target.value)}>
                  {moods.map((mood) => (
                    <option key={mood} value={mood}>
                      {mood}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Resource / Link</label>
              <input
                type="text"
                placeholder="YouTube, docs, GitHub repo, article link..."
                value={form.resource}
                onChange={(e) => handleChange("resource", e.target.value)}
              />
            </div>

            <button className="btn primary full" type="submit">
              {editingId ? "Update Log" : "Save Today's Log"}
            </button>
          </form>
        </section>

        <aside className="panel side-panel">
          <div className="section-head">
            <div>
              <h2>Progress</h2>
              <p>Your consistency overview.</p>
            </div>
          </div>

          <div className="progress-box">
            <div className="progress-top">
              <span>Daily Goal</span>
              <b>{todayProgress}%</b>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${todayProgress}%` }} />
            </div>
            <p>
              {stats.todayMinutes} / {settings.dailyGoal} minutes today
            </p>
          </div>

          <div className="progress-box">
            <div className="progress-top">
              <span>Weekly Goal</span>
              <b>{weeklyProgress}%</b>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${weeklyProgress}%` }} />
            </div>
            <p>
              {stats.weekMinutes} / {settings.weeklyGoal} minutes this week
            </p>
          </div>

          <div className="mini-chart">
            <h3>Last 7 Days</h3>

            <div className="bars">
              {chartData.map((item) => {
                const height = Math.max(8, Math.round((item.minutes / maxChartValue) * 100));

                return (
                  <div className="bar-item" key={item.day}>
                    <div className="bar-wrap">
                      <div className="bar" style={{ height: `${height}%` }} />
                    </div>
                    <span>{item.label}</span>
                    <small>{item.minutes}m</small>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="quick-tips">
            <h3>Daily Writing Formula</h3>
            <p>
              <b>Learned:</b> What concept?
            </p>
            <p>
              <b>Built:</b> What small feature?
            </p>
            <p>
              <b>Stuck:</b> What doubt?
            </p>
            <p>
              <b>Next:</b> Tomorrow's action.
            </p>
          </div>
        </aside>
      </section>

      <section className="panel logs-panel">
        <div className="section-head logs-head">
          <div>
            <h2>Log Management</h2>
            <p>Search, filter, edit, delete, export, and manage your learning history.</p>
          </div>

          {logs.length > 0 && (
            <button className="btn danger-soft" onClick={clearAllLogs}>
              Clear All
            </button>
          )}
        </div>

        <div className="filters">
          <input
            type="text"
            placeholder="Search logs, tags, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
            <option value="All">All Topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">Highest Duration</option>
          </select>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            <h3>No logs found</h3>
            <p>Add your first Spring Boot learning log and start building consistency.</p>
          </div>
        ) : (
          <div className="log-list">
            {filteredLogs.map((log) => (
              <article className="log-card" key={log.id}>
                <div className="log-top">
                  <div>
                    <div className="date-pill">
                      {getDayName(log.date)} · {formatDate(log.date)}
                    </div>
                    <h3>{log.title}</h3>
                  </div>

                  <div className="log-actions">
                    <button className="small-btn" onClick={() => handleEdit(log)}>
                      Edit
                    </button>
                    <button className="small-btn danger" onClick={() => handleDelete(log.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="badges">
                  <span>{log.topic}</span>
                  <span>{log.duration} min</span>
                  <span>{log.status}</span>
                  <span>{log.difficulty}</span>
                  <span>{log.mood}</span>
                </div>

                {log.learned && (
                  <div className="log-section">
                    <b>Learned</b>
                    <p>{log.learned}</p>
                  </div>
                )}

                {log.blockers && (
                  <div className="log-section warning">
                    <b>Blockers</b>
                    <p>{log.blockers}</p>
                  </div>
                )}

                {log.nextStep && (
                  <div className="log-section">
                    <b>Next Step</b>
                    <p>{log.nextStep}</p>
                  </div>
                )}

                {log.resource && (
                  <div className="resource">
                    <b>Resource:</b>{" "}
                    {log.resource.startsWith("http") ? (
                      <a href={log.resource} target="_blank" rel="noreferrer">
                        {log.resource}
                      </a>
                    ) : (
                      <span>{log.resource}</span>
                    )}
                  </div>
                )}

                {log.tags && (
                  <div className="tag-list">
                    {log.tags.split(",").map((tag) => {
                      const clean = tag.trim();
                      if (!clean) return null;
                      return <span key={clean}>#{clean}</span>;
                    })}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="footer">
        <p>
          Built for daily Java + Spring Boot progress. Push this to GitHub and deploy on Vercel.
        </p>
      </footer>
    </main>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <p>{label}</p>
      <h2>{value}</h2>
      <span>{hint}</span>
    </div>
  );
}

const css = `
* {
  box-sizing: border-box;
}

:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  margin: 0;
}

.app {
  min-height: 100vh;
  padding: 28px;
  transition: 0.25s ease;
}

.app.dark {
  --bg: #070b14;
  --panel: rgba(255,255,255,0.075);
  --panel-strong: rgba(255,255,255,0.11);
  --text: #f7f8fb;
  --muted: #a5adbd;
  --border: rgba(255,255,255,0.12);
  --input: rgba(255,255,255,0.08);
  --shadow: 0 24px 80px rgba(0,0,0,0.35);
  background:
    radial-gradient(circle at top left, rgba(74,144,226,0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(111,66,193,0.20), transparent 28%),
    var(--bg);
  color: var(--text);
}

.app.light {
  --bg: #f4f7fb;
  --panel: rgba(255,255,255,0.92);
  --panel-strong: #ffffff;
  --text: #111827;
  --muted: #667085;
  --border: rgba(17,24,39,0.10);
  --input: #ffffff;
  --shadow: 0 24px 80px rgba(16,24,40,0.10);
  background:
    radial-gradient(circle at top left, rgba(74,144,226,0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(111,66,193,0.15), transparent 28%),
    var(--bg);
  color: var(--text);
}

.accent-blue {
  --accent: #4f8cff;
  --accent-2: #7c5cff;
  --accent-soft: rgba(79, 140, 255, 0.16);
}

.accent-green {
  --accent: #22c55e;
  --accent-2: #14b8a6;
  --accent-soft: rgba(34, 197, 94, 0.16);
}

.accent-purple {
  --accent: #a855f7;
  --accent-2: #ec4899;
  --accent-soft: rgba(168, 85, 247, 0.16);
}

.accent-orange {
  --accent: #f97316;
  --accent-2: #f59e0b;
  --accent-soft: rgba(249, 115, 22, 0.16);
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: stretch;
  max-width: 1240px;
  margin: 0 auto 24px;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 12px;
}

h1 {
  margin: 0;
  font-size: clamp(34px, 6vw, 68px);
  line-height: 0.96;
  letter-spacing: -0.06em;
}

.subtitle {
  max-width: 760px;
  margin: 18px 0 0;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 26px;
}

.hero-card,
.panel,
.stat-card {
  background: var(--panel);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
  border-radius: 28px;
}

.hero-card {
  padding: 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.streak {
  width: 108px;
  height: 108px;
  display: grid;
  place-items: center;
  border-radius: 32px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  font-size: 48px;
  font-weight: 900;
  color: white;
  box-shadow: 0 20px 50px var(--accent-soft);
}

.hero-card p {
  margin: 18px 0 4px;
  font-size: 24px;
  font-weight: 850;
}

.hero-card span {
  color: var(--muted);
  line-height: 1.6;
}

.btn {
  border: 0;
  cursor: pointer;
  border-radius: 16px;
  padding: 13px 18px;
  font-weight: 800;
  color: var(--text);
  background: var(--panel-strong);
  border: 1px solid var(--border);
  transition: transform 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.btn:hover,
.small-btn:hover {
  transform: translateY(-2px);
}

.btn.primary {
  color: white;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  border-color: transparent;
}

.btn.ghost {
  background: var(--panel);
}

.btn.danger-soft {
  background: rgba(239, 68, 68, 0.12);
  color: #ff6b6b;
  border-color: rgba(239, 68, 68, 0.22);
}

.btn.full {
  width: 100%;
  padding: 15px 18px;
}

.file-btn {
  position: relative;
  overflow: hidden;
}

.file-btn input {
  display: none;
}

.stats-grid {
  max-width: 1240px;
  margin: 0 auto 24px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.stat-card {
  padding: 22px;
}

.stat-card p {
  margin: 0;
  color: var(--muted);
  font-weight: 700;
}

.stat-card h2 {
  margin: 8px 0;
  font-size: 34px;
}

.stat-card span {
  color: var(--muted);
  font-size: 14px;
}

.dashboard-grid {
  max-width: 1240px;
  margin: 0 auto 24px;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.7fr);
  gap: 24px;
}

.panel {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.section-head h2 {
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.03em;
}

.section-head p {
  margin: 6px 0 0;
  color: var(--muted);
  line-height: 1.5;
}

.log-form {
  display: grid;
  gap: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.form-row.three {
  grid-template-columns: repeat(3, 1fr);
}

.field {
  display: grid;
  gap: 8px;
}

.field label {
  color: var(--muted);
  font-size: 14px;
  font-weight: 800;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--input);
  color: var(--text);
  border-radius: 16px;
  padding: 13px 14px;
  outline: none;
  font: inherit;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
}

textarea {
  min-height: 118px;
  resize: vertical;
  line-height: 1.6;
}

select option {
  color: #111827;
}

.settings-panel {
  max-width: 1240px;
  margin: 0 auto 24px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.progress-box {
  background: var(--panel-strong);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px;
  margin-bottom: 16px;
}

.progress-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-top span {
  color: var(--muted);
  font-weight: 800;
}

.progress-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(128,128,128,0.18);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
}

.progress-box p {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 14px;
}

.mini-chart {
  background: var(--panel-strong);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px;
  margin-top: 16px;
}

.mini-chart h3,
.quick-tips h3 {
  margin: 0 0 14px;
}

.bars {
  height: 190px;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: end;
}

.bar-item {
  height: 100%;
  display: grid;
  grid-template-rows: 1fr auto auto;
  gap: 7px;
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

.bar-wrap {
  height: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
  background: rgba(128,128,128,0.12);
  border-radius: 999px;
  overflow: hidden;
}

.bar {
  width: 100%;
  border-radius: inherit;
  background: linear-gradient(180deg, var(--accent), var(--accent-2));
}

.quick-tips {
  margin-top: 16px;
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 18px;
}

.quick-tips p {
  margin: 8px 0;
  color: var(--muted);
}

.logs-panel {
  max-width: 1240px;
  margin: 0 auto;
}

.filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 180px 160px 170px;
  gap: 12px;
  margin-bottom: 20px;
}

.empty-state {
  text-align: center;
  padding: 54px 18px;
  background: var(--panel-strong);
  border: 1px dashed var(--border);
  border-radius: 24px;
}

.empty-state h3 {
  margin: 0 0 8px;
  font-size: 26px;
}

.empty-state p {
  margin: 0;
  color: var(--muted);
}

.log-list {
  display: grid;
  gap: 16px;
}

.log-card {
  background: var(--panel-strong);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 20px;
}

.log-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.date-pill {
  display: inline-flex;
  background: var(--accent-soft);
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 900;
  margin-bottom: 12px;
}

.log-card h3 {
  margin: 0;
  font-size: 22px;
}

.log-actions {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.small-btn {
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  border-radius: 12px;
  cursor: pointer;
  padding: 9px 11px;
  font-weight: 800;
}

.small-btn.danger {
  color: #ff6b6b;
  background: rgba(239, 68, 68, 0.10);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}

.badges span {
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(128,128,128,0.13);
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.log-section {
  margin-top: 14px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(128,128,128,0.10);
  border: 1px solid var(--border);
}

.log-section.warning {
  background: rgba(245,158,11,0.10);
}

.log-section b {
  display: block;
  margin-bottom: 6px;
  color: var(--accent);
}

.log-section p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
  white-space: pre-wrap;
}

.resource {
  margin-top: 14px;
  color: var(--muted);
  line-height: 1.6;
}

.resource a {
  color: var(--accent);
  word-break: break-all;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-list span {
  color: var(--accent);
  background: var(--accent-soft);
  border-radius: 999px;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 900;
}

.footer {
  max-width: 1240px;
  margin: 24px auto 0;
  text-align: center;
  color: var(--muted);
}

@media (max-width: 980px) {
  .hero,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid,
  .settings-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .app {
    padding: 18px;
  }

  .stats-grid,
  .settings-grid,
  .form-row,
  .form-row.three,
  .filters {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .log-top {
    flex-direction: column;
  }

  .log-actions {
    width: 100%;
  }

  .small-btn {
    flex: 1;
  }
}
`;