import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "simple-spring-learning-logs";

function todayDate() {
  const d = new Date();
  return formatDate(d);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDayName(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function getMonthTitle(date) {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function calculateStreak(logs) {
  const dates = [...new Set(logs.map((log) => log.date))];
  let streak = 0;
  let current = new Date(todayDate() + "T00:00:00");

  while (true) {
    const date = formatDate(current);

    if (dates.includes(date)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const emptyDays = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];

  for (let i = 0; i < emptyDays; i++) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export default function App() {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [topic, setTopic] = useState("Spring Boot");

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const totalMinutes = logs.reduce((sum, log) => sum + Number(log.minutes), 0);
  const streak = calculateStreak(logs);
  const todayLog = logs.find((log) => log.date === todayDate());

  const loggedDates = useMemo(() => {
    return new Set(logs.map((log) => log.date));
  }, [logs]);

  const calendarDays = getCalendarDays(calendarMonth);

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

  function previousMonth() {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCalendarMonth(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    );
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
          <button
            className="card clickable-card"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <span>Streak</span>
            <h2>{streak} days</h2>
            <small>Click to view calendar</small>
          </button>

          <div className="card">
            <span>Total Logs</span>
            <h2>{logs.length}</h2>
          </div>

          <div className="card">
            <span>Total Time</span>
            <h2>{Math.round(totalMinutes / 60)} hrs</h2>
          </div>
        </section>

        {showCalendar && (
          <section className="calendar-card">
            <div className="calendar-head">
              <button onClick={previousMonth}>←</button>
              <h2>{getMonthTitle(calendarMonth)}</h2>
              <button onClick={nextMonth}>→</button>
            </div>

            <div className="calendar-info">
              <span className="dot green"></span> Log done
              <span className="dot red"></span> Missed
              <span className="dot grey"></span> Future
            </div>

            <div className="week-days">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <div className="calendar-day empty-day" key={index}></div>;
                }

                const dateString = formatDate(day);
                const hasLog = loggedDates.has(dateString);
                const isFuture = dateString > todayDate();
                const isToday = dateString === todayDate();

                let className = "calendar-day";

                if (hasLog) className += " done";
                else if (isFuture) className += " future";
                else className += " missed";

                if (isToday) className += " today";

                return (
                  <div className={className} key={dateString}>
                    <span>{day.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

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
.empty,
.calendar-card {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 22px;
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
}

.card {
  padding: 18px;
  text-align: left;
}

.clickable-card {
  width: 100%;
  cursor: pointer;
}

.card span {
  color: #94a3b8;
  font-size: 14px;
}

.card h2 {
  margin: 8px 0 0;
  font-size: 28px;
}

.card small {
  display: block;
  margin-top: 8px;
  color: #38bdf8;
  font-weight: 700;
}

.done-box {
  padding: 16px;
  margin-bottom: 18px;
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.12);
}

.calendar-card {
  padding: 20px;
  margin-bottom: 18px;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.calendar-head h2 {
  margin: 0;
  font-size: 22px;
}

.calendar-head button {
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: 50%;
}

.calendar-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #cbd5e1;
  font-size: 13px;
  margin: 16px 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.dot.green {
  background: #22c55e;
}

.dot.red {
  background: #ef4444;
}

.dot.grey {
  background: #64748b;
}

.week-days,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.week-days span {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 700;
}

.calendar-grid {
  margin-top: 8px;
}

.calendar-day {
  min-height: 48px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.calendar-day.done {
  background: rgba(34, 197, 94, 0.2);
  color: #bbf7d0;
  border-color: rgba(34, 197, 94, 0.45);
}

.calendar-day.missed {
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
  border-color: rgba(239, 68, 68, 0.35);
}

.calendar-day.future {
  background: rgba(100, 116, 139, 0.15);
  color: #94a3b8;
}

.calendar-day.today {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}

.empty-day {
  background: transparent;
  border: none;
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

  .calendar-day {
    min-height: 40px;
    font-size: 13px;
  }
}
`;