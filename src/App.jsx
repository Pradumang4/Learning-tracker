import React, { useEffect, useState } from "react";

const STORAGE_KEY = "simple-spring-learning-logs";

function todayDate() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function getDayName(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function calculateStreak(logs) {
  const dates = [...new Set(logs.map((log) => log.date))];
  let streak = 0;
  let current = new Date(todayDate());

  while (true) {
    const date = current.toISOString().slice(0, 10);

    if (dates.includes(date)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function App() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [topic, setTopic] = useState("Spring Boot");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const totalMinutes = logs.reduce((sum, log) => sum + Number(log.minutes), 0);
  const streak = calculateStreak(logs);
  const todayLog = logs.find((log) => log.date === todayDate());

  function saveLog(e) {
    e.preventDefault();

    if (!text.trim()) {
      alert("Bhai kuch to likho aaj kya padha 😄");
      return;
    }

    const newLog = {
      id: Date.now(),
      date: todayDate(),
      topic,
      text: text.trim(),
      minutes: Number(minutes) || 0,
    };

    setLogs([newLog, ...logs]);
    setText("");
    setMinutes("30");
    setTopic("Spring Boot");
  }

  function deleteLog(id) {
    setLogs(logs.filter((log) => log.id !== id));
  }

  return (
    <div className="app">
      <style>{css}</style>

      <div className="container">
        <header className="hero">
          <p className="small">Java + Spring Boot Daily Tracker</p>
          <h1>Bas daily thoda sa progress.</h1>
          <p className="sub">
            Consistency ke liye simple tracker. Roz 1 line likho aur save karo.
          </p>
        </header>

        <section className="stats">
          <div className="card">
            <span>Streak</span>
            <h2>{streak} days</h2>
          </div>

          <div className="card">
            <span>Total Logs</span>
            <h2>{logs.length}</h2>
          </div>

          <div className="card">
            <span>Total Time</span>
            <h2>{Math.round(totalMinutes / 60)} hrs</h2>
          </div>
        </section>

        {todayLog && (
          <div className="done-box">
            ✅ Aaj ka log already saved hai. Good job bhai!
          </div>
        )}

        <section className="main-card">
          <h2>Today&apos;s Log</h2>

          <form onSubmit={saveLog}>
            <label>Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option>Java</option>
              <option>Spring Boot</option>
              <option>REST API</option>
              <option>JPA / Hibernate</option>
              <option>MySQL</option>
              <option>Project Work</option>
              <option>GitHub</option>
            </select>

            <label>What did you learn today?</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Example: Aaj maine REST controller samjha aur ek simple GET API banaya..."
            />

            <label>Minutes</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="30"
            />

            <button type="submit">Save Today&apos;s Progress</button>
          </form>
        </section>

        <section className="logs">
          <h2>Recent Logs</h2>

          {logs.length === 0 ? (
            <div className="empty">
              Abhi koi log nahi hai. Aaj se start karo 🚀
            </div>
          ) : (
            logs.map((log) => (
              <div className="log" key={log.id}>
                <div>
                  <p className="date">{getDayName(log.date)}</p>
                  <h3>{log.topic}</h3>
                  <p>{log.text}</p>
                  <span>{log.minutes} min</span>
                </div>

                <button className="delete" onClick={() => deleteLog(log.id)}>
                  Delete
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

const css = `
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Inter, system-ui, Arial, sans-serif;
  background: #0f172a;
}

.app {
  min-height: 100vh;
  padding: 28px 16px;
  color: #e5e7eb;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.25), transparent 35%),
    radial-gradient(circle at top right, rgba(34, 197, 94, 0.15), transparent 30%),
    #0f172a;
}

.container {
  max-width: 850px;
  margin: auto;
}

.hero {
  margin-bottom: 24px;
}

.small {
  color: #38bdf8;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  font-size: 13px;
}

h1 {
  margin: 8px 0;
  font-size: clamp(34px, 6vw, 58px);
  line-height: 1;
  letter-spacing: -2px;
}

.sub {
  color: #94a3b8;
  font-size: 17px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.card,
.main-card,
.log,
.done-box,
.empty {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.card {
  padding: 18px;
}

.card span {
  color: #94a3b8;
  font-size: 14px;
}

.card h2 {
  margin: 8px 0 0;
  font-size: 28px;
}

.done-box {
  padding: 16px;
  margin-bottom: 18px;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}

.main-card {
  padding: 22px;
  margin-bottom: 24px;
}

.main-card h2,
.logs h2 {
  margin-top: 0;
}

form {
  display: grid;
  gap: 12px;
}

label {
  color: #cbd5e1;
  font-weight: 700;
  font-size: 14px;
}

input,
textarea,
select {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  padding: 14px;
  border-radius: 14px;
  outline: none;
  font-size: 15px;
}

textarea {
  min-height: 120px;
  resize: vertical;
  line-height: 1.6;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #38bdf8;
}

button {
  border: 0;
  border-radius: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #38bdf8, #2563eb);
  color: white;
  font-weight: 800;
  cursor: pointer;
  font-size: 15px;
}

button:hover {
  transform: translateY(-1px);
}

.logs {
  display: grid;
  gap: 14px;
}

.log {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.log h3 {
  margin: 4px 0;
}

.log p {
  color: #cbd5e1;
  line-height: 1.6;
  margin: 8px 0;
}

.log span {
  display: inline-block;
  margin-top: 6px;
  color: #38bdf8;
  font-weight: 700;
}

.date {
  color: #94a3b8 !important;
  font-size: 13px;
  margin: 0 !important;
}

.delete {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  padding: 10px 12px;
  height: fit-content;
}

.empty {
  padding: 28px;
  text-align: center;
  color: #94a3b8;
}

@media (max-width: 650px) {
  .stats {
    grid-template-columns: 1fr;
  }

  .log {
    flex-direction: column;
  }

  .delete {
    width: 100%;
  }
}
`;