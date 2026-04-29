import { useState, useEffect } from "react";

const INITIAL_STATE = {
  character: {
    name: "Hero",
    class: "Adventurer",
    level: 1,
    xp: 0,
    xpToNext: 100,
    stats: { strength: 5, wisdom: 5, endurance: 5, focus: 5 },
    totalXpEarned: 0,
  },
  habits: [
    { id: 1, name: "Morning Exercise", xpReward: 20, stat: "strength", completedToday: false, streak: 0 },
    { id: 2, name: "Read 20 mins", xpReward: 15, stat: "wisdom", completedToday: false, streak: 0 },
    { id: 3, name: "Meditate", xpReward: 10, stat: "focus", completedToday: false, streak: 0 },
  ],
  goals: [
    { id: 1, name: "Write a Novel", progress: 0, xpReward: 500, stat: "wisdom", milestones: ["Outline done", "Chapter 10", "Chapter 20", "First Draft"], completedMilestones: 0 },
    { id: 2, name: "Run a 5K", progress: 0, xpReward: 300, stat: "endurance", milestones: ["1km run", "2km run", "3km run", "5km run"], completedMilestones: 0 },
    { id: 3, name: "Learn Spanish", progress: 0, xpReward: 400, stat: "focus", milestones: ["A1 basics", "A2 level", "B1 level", "Conversational"], completedMilestones: 0 },
  ],
  milestones: [
    { id: 1, name: "First Blood", desc: "Complete your first habit", earned: false, icon: "⚔️" },
    { id: 2, name: "Streak Warrior", desc: "Maintain a 7-day streak", earned: false, icon: "🔥" },
    { id: 3, name: "Level 5 Sage", desc: "Reach level 5", earned: false, icon: "📜" },
    { id: 4, name: "Quest Keeper", desc: "Complete a long-term goal", earned: false, icon: "🏆" },
    { id: 5, name: "Iron Will", desc: "Complete all habits in a day", earned: false, icon: "🛡️" },
    { id: 6, name: "Arcane Scholar", desc: "Gain 1000 total XP", earned: false, icon: "✨" },
  ],
  log: [],
  lastResetDate: new Date().toLocaleDateString("en-CA"),
};

const STORAGE_KEY = "heros-path-save";
const APP_VERSION = "1.4.0";

function todayString() {
  return new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...INITIAL_STATE, lastResetDate: todayString() };
    const parsed = JSON.parse(saved);
    const today = todayString();
    // Only reset if lastResetDate exists AND is a past date
    if (parsed.lastResetDate && parsed.lastResetDate !== today) {
      const habits = parsed.habits.map(h => ({
        ...h,
        streak: h.completedToday ? h.streak : 0,
        completedToday: false,
      }));
      return { ...parsed, habits, lastResetDate: today };
    }
    // If lastResetDate is missing, just set it to today without resetting habits
    if (!parsed.lastResetDate) {
      return { ...parsed, lastResetDate: today };
    }
    return parsed;
  } catch {
    return { ...INITIAL_STATE, lastResetDate: todayString() };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const STAT_COLORS = {
  strength: "#e05c5c",
  wisdom: "#7b8cde",
  endurance: "#5cb85c",
  focus: "#d4a843",
};

const STAT_ICONS = { strength: "⚔️", wisdom: "📘", endurance: "🛡️", focus: "🎯" };
const CLASS_BY_LEVEL = [
  "Wanderer", "Apprentice", "Scout", "Seeker", "Adept",
  "Champion", "Veteran", "Elite", "Master", "Legend"
];

function XPBar({ current, max }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#a89060", letterSpacing: 1, textTransform: "uppercase" }}>Experience</span>
        <span style={{ fontSize: 11, color: "#d4a843" }}>{current} / {max} XP</span>
      </div>
      <div style={{ background: "#1a1510", border: "1px solid #3a2e1a", borderRadius: 4, height: 12, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: "linear-gradient(90deg, #c47c1a, #f0c040)",
          borderRadius: 4,
          transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: "0 0 8px #d4a843aa",
        }} />
      </div>
    </div>
  );
}

function StatBar({ stat, value }) {
  const color = STAT_COLORS[stat];
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#a89060", display: "flex", alignItems: "center", gap: 4 }}>
          {STAT_ICONS[stat]} {stat.charAt(0).toUpperCase() + stat.slice(1)}
        </span>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ background: "#1a1510", border: "1px solid #2a2010", borderRadius: 2, height: 6, overflow: "hidden" }}>
        <div style={{
          width: `${Math.min(value * 4, 100)}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 2,
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #1e1a10 0%, #16130c 100%)",
      border: "1px solid #3a2e1a",
      borderRadius: 8,
      padding: "18px 20px",
      position: "relative",
      ...style,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, #d4a84340, transparent)", borderRadius: "8px 8px 0 0" }} />
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #3a2e1a, transparent)" }} />
      <span style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#d4a843", fontFamily: "'Cinzel', serif" }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, #3a2e1a)" }} />
    </div>
  );
}

function FloatingXP({ amount, id }) {
  return (
    <div key={id} style={{
      position: "fixed", top: "40%", left: "50%", transform: "translateX(-50%)",
      color: "#f0c040", fontSize: 28, fontWeight: 900, fontFamily: "'Cinzel', serif",
      textShadow: "0 0 20px #d4a843",
      animation: "floatUp 1.4s ease-out forwards",
      pointerEvents: "none", zIndex: 9999,
    }}>
      +{amount} XP
    </div>
  );
}

function ResetModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#00000090", zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: "linear-gradient(160deg, #1e1a10, #16130c)",
        border: "1px solid #8b0000",
        borderRadius: 10, padding: "28px 24px", maxWidth: 320, width: "100%",
        textAlign: "center",
        boxShadow: "0 0 40px #8b000040",
      }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💀</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: "#e05c5c", marginBottom: 8 }}>
          Abandon Your Journey?
        </div>
        <div style={{ fontSize: 13, color: "#a89060", marginBottom: 24, lineHeight: 1.6 }}>
          All progress, XP, levels, and achievements will be lost forever. This cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "10px", background: "transparent",
            border: "1px solid #3a2e1a", borderRadius: 6, color: "#a89060",
            fontFamily: "'Cinzel', serif", fontSize: 11, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "10px", background: "#3a0000",
            border: "1px solid #8b0000", borderRadius: 6, color: "#e05c5c",
            fontFamily: "'Cinzel', serif", fontSize: 11, cursor: "pointer",
            letterSpacing: 1,
          }}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState("habits");
  const [xpPopups, setXpPopups] = useState([]);
  const [newHabit, setNewHabit] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newGoalMilestones, setNewGoalMilestones] = useState([""]);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check for new day every minute (handles app left open past midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      const today = todayString();
      setState(prev => {
        if (prev.lastResetDate === today) return prev;
        const habits = prev.habits.map(h => ({
          ...h,
          streak: h.completedToday ? h.streak : 0,
          completedToday: false,
        }));
        return { ...prev, habits, lastResetDate: today };
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const gainXP = (amount, stat) => {
    const popupId = Date.now();
    setXpPopups(p => [...p, { id: popupId, amount }]);
    setTimeout(() => setXpPopups(p => p.filter(x => x.id !== popupId)), 1500);

    setState(prev => {
      const char = { ...prev.character };
      char.xp += amount;
      char.totalXpEarned += amount;
      if (stat) char.stats = { ...char.stats, [stat]: char.stats[stat] + 1 };

      while (char.xp >= char.xpToNext) {
        char.xp -= char.xpToNext;
        char.level += 1;
        char.xpToNext = Math.floor(char.xpToNext * 1.4);
        char.class = CLASS_BY_LEVEL[Math.min(char.level - 1, 9)];
      }

      const milestones = prev.milestones.map(m => {
        if (m.earned) return m;
        if (m.id === 6 && char.totalXpEarned >= 1000) return { ...m, earned: true };
        if (m.id === 3 && char.level >= 5) return { ...m, earned: true };
        return m;
      });

      const logEntry = { id: Date.now(), text: `Gained ${amount} XP`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      return { ...prev, character: char, milestones, log: [logEntry, ...prev.log].slice(0, 10) };
    });
  };

  const completeHabit = (id) => {
    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit || habit.completedToday) return prev;

      const habits = prev.habits.map(h => h.id === id
        ? { ...h, completedToday: true, streak: h.streak + 1 }
        : h
      );
      const allDone = habits.every(h => h.completedToday);
      const milestones = prev.milestones.map(m => {
        if (m.earned) return m;
        if (m.id === 1) return { ...m, earned: true };
        if (m.id === 5 && allDone) return { ...m, earned: true };
        if (m.id === 2 && habits.some(h => h.streak >= 7)) return { ...m, earned: true };
        return m;
      });

      // Handle XP inline to avoid stale state
      const char = { ...prev.character };
      char.xp += habit.xpReward;
      char.totalXpEarned += habit.xpReward;
      char.stats = { ...char.stats, [habit.stat]: char.stats[habit.stat] + 1 };
      while (char.xp >= char.xpToNext) {
        char.xp -= char.xpToNext;
        char.level += 1;
        char.xpToNext = Math.floor(char.xpToNext * 1.4);
        char.class = CLASS_BY_LEVEL[Math.min(char.level - 1, 9)];
      }
      const updatedMilestones = milestones.map(m => {
        if (m.earned) return m;
        if (m.id === 6 && char.totalXpEarned >= 1000) return { ...m, earned: true };
        if (m.id === 3 && char.level >= 5) return { ...m, earned: true };
        return m;
      });
      const logEntry = { id: Date.now(), text: `Gained ${habit.xpReward} XP`, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };

      return { ...prev, habits, milestones: updatedMilestones, character: char, log: [logEntry, ...prev.log].slice(0, 10) };
    });

    // Show floating XP popup (purely visual, doesn't need exact state)
    const habit = state.habits.find(h => h.id === id);
    if (habit) {
      const popupId = Date.now();
      setXpPopups(p => [...p, { id: popupId, amount: habit.xpReward }]);
      setTimeout(() => setXpPopups(p => p.filter(x => x.id !== popupId)), 1500);
    }
  };

  const advanceGoal = (id) => {
    setState(prev => {
      const goals = prev.goals.map(g => {
        if (g.id !== id) return g;
        const newCompleted = Math.min(g.completedMilestones + 1, g.milestones.length);
        const newProgress = Math.round((newCompleted / g.milestones.length) * 100);
        return { ...g, completedMilestones: newCompleted, progress: newProgress };
      });
      const goal = prev.goals.find(g => g.id === id);
      const isComplete = goal && goal.completedMilestones + 1 >= goal.milestones.length;
      const milestones = prev.milestones.map(m => m.id === 4 && isComplete ? { ...m, earned: true } : m);
      return { ...prev, goals, milestones };
    });
    const goal = state.goals.find(g => g.id === id);
    if (goal) gainXP(Math.floor(goal.xpReward / goal.milestones.length), goal.stat);
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, { id: Date.now(), name: newHabit, xpReward: 15, stat: "focus", completedToday: false, streak: 0 }]
    }));
    setNewHabit("");
    setShowAddHabit(false);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const filledMilestones = newGoalMilestones.filter(m => m.trim());
    const milestones = filledMilestones.length > 0 ? filledMilestones : ["Phase 1", "Phase 2", "Phase 3", "Complete"];
    setState(prev => ({
      ...prev,
      goals: [...prev.goals, { id: Date.now(), name: newGoal, progress: 0, xpReward: 200, stat: "wisdom", milestones, completedMilestones: 0 }]
    }));
    setNewGoal("");
    setNewGoalMilestones([""]);
    setShowAddGoal(false);
  };

  const deleteHabit = (id) => {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
  };

  const deleteGoal = (id) => {
    setState(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STATE);
    setShowResetModal(false);
    setTab("habits");
  };

  const char = state.character;

  const tabs = [
    { id: "habits", label: "Daily Rites" },
    { id: "goals", label: "Quests" },
    { id: "milestones", label: "Achievements" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0b07; color: #c8b07a; font-family: 'EB Garamond', serif; min-height: 100vh; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d0b07; }
        ::-webkit-scrollbar-thumb { background: #3a2e1a; border-radius: 3px; }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-80px); }
        }
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        .habit-btn:hover { background: #2a2010 !important; border-color: #d4a843 !important; }
        .tab-btn:hover { color: #d4a843 !important; }
        .action-btn:hover { background: #c47c1a !important; transform: translateY(-1px); box-shadow: 0 4px 16px #d4a84340 !important; }
        .complete-btn:hover { opacity: 0.85; transform: scale(1.05); }
        .reset-btn:hover { color: #e05c5c !important; border-color: #e05c5c !important; }
        input { outline: none; }
        input:focus { border-color: #d4a843 !important; }
      `}</style>

      {showResetModal && <ResetModal onConfirm={handleReset} onCancel={() => setShowResetModal(false)} />}
      {xpPopups.map(p => <FloatingXP key={p.id} amount={p.amount} id={p.id} />)}

      <div style={{ maxWidth: 460, margin: "0 auto", padding: "20px 16px 40px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24, position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#6a5030", textTransform: "uppercase", marginBottom: 4 }}>Chronicles of</div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 900, color: "#d4a843", letterSpacing: 2, textShadow: "0 0 30px #d4a84360" }}>
            The Hero's Path
          </h1>
          <div style={{ fontSize: 10, color: "#3a2e1a", letterSpacing: 1, marginTop: 3 }}>v{APP_VERSION}</div>
          <button
            onClick={() => setShowResetModal(true)}
            className="reset-btn"
            style={{
              position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
              background: "transparent", border: "1px solid #3a2e1a", borderRadius: 6,
              color: "#4a3820", fontSize: 10, fontFamily: "'Cinzel', serif",
              letterSpacing: 1, padding: "5px 8px", cursor: "pointer",
              textTransform: "uppercase", transition: "all 0.2s",
            }}
          >↺ Reset</button>
        </div>

        {/* Character Card */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 8, flexShrink: 0,
              background: "linear-gradient(135deg, #2a1f08, #1a1508)",
              border: "2px solid #3a2e1a",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, position: "relative",
              boxShadow: "inset 0 0 20px #00000060",
            }}>
              ⚔️
              <div style={{
                position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
                background: "#d4a843", color: "#0d0b07", fontSize: 10, fontWeight: 900,
                padding: "1px 7px", borderRadius: 10, fontFamily: "'Cinzel', serif",
                whiteSpace: "nowrap",
              }}>LV {char.level}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: "#f0d890", fontWeight: 600 }}>{char.name}</span>
              </div>
              <div style={{ fontSize: 12, color: "#a89060", marginBottom: 10, letterSpacing: 1 }}>
                {CLASS_BY_LEVEL[Math.min(char.level - 1, 9)]}
              </div>
              <XPBar current={char.xp} max={char.xpToNext} />
            </div>
          </div>

          <SectionTitle>Attributes</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            {Object.entries(char.stats).map(([stat, val]) => (
              <StatBar key={stat} stat={stat} value={val} />
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 14, background: "#0d0b07", border: "1px solid #3a2e1a", borderRadius: 8, padding: 3 }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "8px 4px", background: tab === t.id ? "#1e1a10" : "transparent",
              border: tab === t.id ? "1px solid #3a2e1a" : "1px solid transparent",
              borderRadius: 6, color: tab === t.id ? "#d4a843" : "#6a5030",
              fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 1,
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Habits Tab */}
        {tab === "habits" && (
          <div>
            <Card style={{ marginBottom: 10 }}>
              <SectionTitle>Daily Rites</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {state.habits.map(h => (
                  <div key={h.id} className="habit-btn" style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    border: `1px solid ${h.completedToday ? "#3a5a2a" : "#2a2010"}`,
                    borderRadius: 6, background: h.completedToday ? "#0f1e0c" : "#13100a",
                    transition: "all 0.2s", cursor: h.completedToday ? "default" : "pointer",
                  }}>
                    <button onClick={() => !h.completedToday && completeHabit(h.id)} className="complete-btn" style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${h.completedToday ? "#5cb85c" : STAT_COLORS[h.stat]}`,
                      background: h.completedToday ? "#5cb85c20" : "transparent",
                      color: h.completedToday ? "#5cb85c" : STAT_COLORS[h.stat],
                      fontSize: 14, cursor: h.completedToday ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                      {h.completedToday ? "✓" : "○"}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: h.completedToday ? "#6a8a5a" : "#c8b07a", textDecoration: h.completedToday ? "line-through" : "none" }}>{h.name}</div>
                      <div style={{ fontSize: 11, color: "#6a5030", marginTop: 2 }}>
                        {STAT_ICONS[h.stat]} +{h.xpReward} XP · {h.stat}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 16 }}>🔥</div>
                      <div style={{ fontSize: 10, color: "#d4a843", fontWeight: 700 }}>{h.streak}d</div>
                      <button onClick={() => deleteHabit(h.id)}
                        onMouseOver={e => e.currentTarget.style.color = "#e05c5c"}
                        onMouseOut={e => e.currentTarget.style.color = "#4a2a2a"}
                        style={{ background: "transparent", border: "none", color: "#4a2a2a", fontSize: 13, cursor: "pointer", padding: "2px 4px", lineHeight: 1, transition: "color 0.2s" }}
                        title="Delete habit">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {showAddHabit ? (
              <Card>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newHabit}
                    onChange={e => setNewHabit(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addHabit()}
                    placeholder="New daily rite..."
                    style={{
                      flex: 1, background: "#0d0b07", border: "1px solid #3a2e1a", borderRadius: 6,
                      color: "#c8b07a", padding: "8px 12px", fontFamily: "'EB Garamond', serif", fontSize: 14,
                      transition: "border-color 0.2s",
                    }}
                  />
                  <button onClick={addHabit} className="action-btn" style={{
                    background: "#c47c1a", border: "none", borderRadius: 6, color: "#0d0b07",
                    padding: "8px 14px", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>Add</button>
                  <button onClick={() => setShowAddHabit(false)} style={{
                    background: "transparent", border: "1px solid #3a2e1a", borderRadius: 6, color: "#6a5030",
                    padding: "8px 10px", cursor: "pointer", fontSize: 14,
                  }}>✕</button>
                </div>
              </Card>
            ) : (
              <button onClick={() => setShowAddHabit(true)} className="action-btn" style={{
                width: "100%", padding: "10px", background: "#1a1508",
                border: "1px dashed #3a2e1a", borderRadius: 6, color: "#6a5030",
                fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 1,
                textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
              }}>+ Add Daily Rite</button>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {tab === "goals" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
              {state.goals.map(g => {
                const pct = g.progress;
                const done = g.completedMilestones >= g.milestones.length;
                return (
                  <Card key={g.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: "#f0d890", marginBottom: 2 }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: "#6a5030" }}>{STAT_ICONS[g.stat]} +{g.xpReward} XP total · {g.stat}</div>
                      </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#d4a843", fontFamily: "'Cinzel', serif" }}>{pct}%</div>
                      <button onClick={() => deleteGoal(g.id)}
                        onMouseOver={e => e.currentTarget.style.color = "#e05c5c"}
                        onMouseOut={e => e.currentTarget.style.color = "#4a2a2a"}
                        style={{ background: "transparent", border: "none", color: "#4a2a2a", fontSize: 13, cursor: "pointer", padding: "2px 4px", lineHeight: 1, transition: "color 0.2s", marginTop: 2 }}
                        title="Delete quest">✕</button>
                    </div>
                    </div>

                    <div style={{ background: "#0d0b07", border: "1px solid #2a2010", borderRadius: 4, height: 8, overflow: "hidden", marginBottom: 12 }}>
                      <div style={{
                        width: `${pct}%`, height: "100%",
                        background: `linear-gradient(90deg, ${STAT_COLORS[g.stat]}88, ${STAT_COLORS[g.stat]})`,
                        transition: "width 0.6s ease",
                        boxShadow: `0 0 6px ${STAT_COLORS[g.stat]}80`,
                      }} />
                    </div>

                    <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                      {g.milestones.map((m, i) => (
                        <div key={i} style={{
                          flex: 1, textAlign: "center", fontSize: 9, padding: "4px 2px", borderRadius: 4,
                          background: i < g.completedMilestones ? "#1a3a10" : "#13100a",
                          border: `1px solid ${i < g.completedMilestones ? "#3a6a20" : "#2a2010"}`,
                          color: i < g.completedMilestones ? "#5cb85c" : "#4a3820",
                          letterSpacing: 0.5,
                        }}>
                          {i < g.completedMilestones ? "✓" : `${i + 1}`}
                          <div style={{ marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m}</div>
                        </div>
                      ))}
                    </div>

                    {!done && (
                      <button onClick={() => advanceGoal(g.id)} className="action-btn" style={{
                        width: "100%", padding: "7px", background: "#1e1408",
                        border: `1px solid ${STAT_COLORS[g.stat]}60`, borderRadius: 6,
                        color: STAT_COLORS[g.stat], fontFamily: "'Cinzel', serif", fontSize: 10,
                        letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
                      }}>Complete Next Milestone</button>
                    )}
                    {done && <div style={{ textAlign: "center", color: "#5cb85c", fontSize: 12, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>✦ Quest Complete ✦</div>}
                  </Card>
                );
              })}
            </div>

            {showAddGoal ? (
              <Card>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: "#a89060", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Cinzel', serif" }}>Quest Name</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={newGoal}
                      onChange={e => setNewGoal(e.target.value)}
                      placeholder="Name your quest..."
                      style={{
                        flex: 1, background: "#0d0b07", border: "1px solid #3a2e1a", borderRadius: 6,
                        color: "#c8b07a", padding: "8px 12px", fontFamily: "'EB Garamond', serif", fontSize: 14,
                        transition: "border-color 0.2s",
                      }}
                    />
                    <button onClick={() => { setShowAddGoal(false); setNewGoal(""); setNewGoalMilestones([""]); }} style={{
                      background: "transparent", border: "1px solid #3a2e1a", borderRadius: 6, color: "#6a5030",
                      padding: "8px 10px", cursor: "pointer", fontSize: 14,
                    }}>✕</button>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#a89060", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Cinzel', serif" }}>Milestones</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {newGoalMilestones.map((m, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 10, color: "#4a3820", width: 16, textAlign: "center", flexShrink: 0 }}>{i + 1}</div>
                        <input
                          value={m}
                          onChange={e => {
                            const updated = [...newGoalMilestones];
                            updated[i] = e.target.value;
                            setNewGoalMilestones(updated);
                          }}
                          placeholder={`Milestone ${i + 1}...`}
                          style={{
                            flex: 1, background: "#0d0b07", border: "1px solid #2a2010", borderRadius: 6,
                            color: "#c8b07a", padding: "6px 10px", fontFamily: "'EB Garamond', serif", fontSize: 13,
                            transition: "border-color 0.2s",
                          }}
                        />
                        {newGoalMilestones.length > 1 && (
                          <button
                            onClick={() => setNewGoalMilestones(newGoalMilestones.filter((_, idx) => idx !== i))}
                            onMouseOver={e => e.currentTarget.style.color = "#e05c5c"}
                            onMouseOut={e => e.currentTarget.style.color = "#4a2a2a"}
                            style={{ background: "transparent", border: "none", color: "#4a2a2a", fontSize: 13, cursor: "pointer", padding: "2px 4px", flexShrink: 0, transition: "color 0.2s" }}
                          >✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setNewGoalMilestones([...newGoalMilestones, ""])}
                    style={{
                      marginTop: 8, width: "100%", padding: "6px", background: "transparent",
                      border: "1px dashed #2a2010", borderRadius: 6, color: "#4a3820",
                      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 1,
                      textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#d4a843"; e.currentTarget.style.color = "#d4a843"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#2a2010"; e.currentTarget.style.color = "#4a3820"; }}
                  >+ Add Milestone</button>
                </div>
                <button onClick={addGoal} className="action-btn" style={{
                  width: "100%", background: "#c47c1a", border: "none", borderRadius: 6, color: "#0d0b07",
                  padding: "9px", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.2s", letterSpacing: 1,
                }}>Begin Quest</button>
              </Card>
            ) : (
              <button onClick={() => setShowAddGoal(true)} className="action-btn" style={{
                width: "100%", padding: "10px", background: "#1a1508",
                border: "1px dashed #3a2e1a", borderRadius: 6, color: "#6a5030",
                fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: 1,
                textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
              }}>+ Add Quest</button>
            )}
          </div>
        )}

        {/* Milestones Tab */}
        {tab === "milestones" && (
          <div>
            <Card style={{ marginBottom: 10 }}>
              <SectionTitle>Achievements</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {state.milestones.map(m => (
                  <div key={m.id} style={{
                    padding: "12px 10px", borderRadius: 6, textAlign: "center",
                    background: m.earned ? "#1a1508" : "#0f0d08",
                    border: `1px solid ${m.earned ? "#d4a84340" : "#1a1510"}`,
                    opacity: m.earned ? 1 : 0.5,
                    transition: "all 0.3s",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4, filter: m.earned ? "none" : "grayscale(1)", animation: m.earned ? "shimmer 3s infinite" : "none" }}>{m.icon}</div>
                    <div style={{ fontSize: 11, fontFamily: "'Cinzel', serif", color: m.earned ? "#d4a843" : "#4a3820", marginBottom: 3 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: "#6a5030" }}>{m.desc}</div>
                    {m.earned && <div style={{ fontSize: 9, color: "#5cb85c", marginTop: 4, letterSpacing: 1 }}>✓ EARNED</div>}
                  </div>
                ))}
              </div>
            </Card>

            {state.log.length > 0 && (
              <Card>
                <SectionTitle>Recent Deeds</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {state.log.map(entry => (
                    <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6a5030", borderBottom: "1px solid #1a1510", paddingBottom: 5 }}>
                      <span>{entry.text}</span>
                      <span style={{ color: "#3a2e1a" }}>{entry.time}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
