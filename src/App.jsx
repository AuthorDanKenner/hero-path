import { useState, useEffect } from "react";

// ─── INITIAL STATE ───────────────────────────────────────────────────────────
const INITIAL_STATE = {
  character: {
    name: "Dan",
    class: "Author-Mage",
    level: 1,
    xp: 0,
    xpToNext: 100,
    stats: { creativity: 5, discipline: 5, endurance: 5, focus: 5 },
    totalXpEarned: 0,
  },
  habits: [
    { id: 1, name: "Edit Session (15+ min)", xpReward: 30, stat: "discipline", completedToday: false, streak: 0, icon: "✍️", desc: "One focused Pomodoro on Fairy Blooded" },
    { id: 2, name: "Parking Lot Brain Dump", xpReward: 10, stat: "focus", completedToday: false, streak: 0, icon: "🧠", desc: "Write down distracting thoughts before editing" },
    { id: 3, name: "Distraction Blocker On", xpReward: 10, stat: "focus", completedToday: false, streak: 0, icon: "🔒", desc: "Apps/sites blocked during edit session" },
    { id: 4, name: "Scene Goal Set", xpReward: 15, stat: "discipline", completedToday: false, streak: 0, icon: "🎯", desc: "Wrote down exactly what to edit before starting" },
    { id: 5, name: "Body Double / Co-work", xpReward: 20, stat: "endurance", completedToday: false, streak: 0, icon: "👥", desc: "Edited alongside someone (in person or virtual)" },
    { id: 6, name: "Reward Claimed", xpReward: 10, stat: "creativity", completedToday: false, streak: 0, icon: "🎁", desc: "Treated yourself after hitting today's edit goal" },
  ],
  goals: [
    {
      id: 1, name: "Fairy Blooded — First Pass Edit", stat: "discipline",
      xpReward: 800, progress: 0,
      milestones: ["Ch 1–5 edited", "Ch 6–10 edited", "Ch 11–15 edited", "Ch 16–20 edited", "Ch 21–25 edited", "Full first pass done"],
      completedMilestones: 0, icon: "📖"
    },
    {
      id: 2, name: "Fairy Blooded — Polish Pass", stat: "creativity",
      xpReward: 600, progress: 0,
      milestones: ["Opening hook tightened", "Pacing pass done", "Dialogue polish done", "Final proofread done"],
      completedMilestones: 0, icon: "✨"
    },
    {
      id: 3, name: "Publication Readiness", stat: "endurance",
      xpReward: 1000, progress: 0,
      milestones: ["Cover finalized", "Back cover blurb locked", "ARCs sent", "Launch date set", "Book published 🎉"],
      completedMilestones: 0, icon: "🏆"
    },
    {
      id: 4, name: "Next Book — Groundwork", stat: "creativity",
      xpReward: 400, progress: 0,
      milestones: ["Concept outlined", "Characters sketched", "World notes started", "First chapter drafted"],
      completedMilestones: 0, icon: "🌱"
    },
  ],
  milestones: [
    { id: 1, name: "First Words", desc: "Complete your first edit session", earned: false, icon: "⚔️" },
    { id: 2, name: "Focused Mind", desc: "Complete all 4 focus habits in one day", earned: false, icon: "🔥" },
    { id: 3, name: "Seven-Day Scribe", desc: "Maintain a 7-day edit streak", earned: false, icon: "📜" },
    { id: 4, name: "Chapter Champion", desc: "Hit the first quest milestone", earned: false, icon: "🛡️" },
    { id: 5, name: "Author-Mage Lv 5", desc: "Reach level 5", earned: false, icon: "🧙" },
    { id: 6, name: "Arcane Scholar", desc: "Earn 1,000 total XP", earned: false, icon: "✨" },
    { id: 7, name: "Published!", desc: "Complete the Publication Readiness quest", earned: false, icon: "🎊" },
    { id: 8, name: "Iron Quill", desc: "30 edit sessions logged", earned: false, icon: "🖋️" },
  ],
  log: [],
  totalEditSessions: 0,
};

const STORAGE_KEY = "heros-path-save-v2";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...INITIAL_STATE, ...JSON.parse(saved) } : INITIAL_STATE;
  } catch {
    return INITIAL_STATE;
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ─── XP / LEVEL HELPERS ──────────────────────────────────────────────────────
function xpForLevel(level) { return Math.floor(100 * Math.pow(level, 1.4)); }

function applyXP(char, amount) {
  let { xp, level, xpToNext, stats, totalXpEarned } = char;
  const prevClass = getClassForLevel(level);
  xp += amount;
  totalXpEarned += amount;
  let leveledUp = false;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = xpForLevel(level);
    leveledUp = true;
  }
  const newClass = getClassForLevel(level);
  const classChanged = newClass.title !== prevClass.title;
  return { ...char, xp, level, xpToNext, totalXpEarned, leveledUp, classChanged, newClassName: newClass.title };
}

// ─── STAT COLORS ─────────────────────────────────────────────────────────────
const STAT_COLORS = {
  creativity: "#f59e0b",
  discipline: "#6366f1",
  endurance:  "#10b981",
  focus:      "#06b6d4",
};

// ─── CLASS PROGRESSION ───────────────────────────────────────────────────────
const CLASS_PROGRESSION = [
  { level: 1,   title: "Apprentice Scribe",    icon: "📝", color: "#a0a0b0", desc: "The journey begins. Every word is a step forward." },
  { level: 20,  title: "Author-Mage",          icon: "🧙", color: "#a78bfa", desc: "The craft awakens. You bend words to your will." },
  { level: 40,  title: "Lorekeeper",           icon: "📖", color: "#6366f1", desc: "Worlds live inside you. Your stories outlast stone." },
  { level: 60,  title: "Wordsmith Adept",      icon: "⚔️", color: "#06b6d4", desc: "Your prose cuts clean. Readers cannot look away." },
  { level: 80,  title: "Arcane Chronicler",    icon: "🌌", color: "#10b981", desc: "You channel something older than language itself." },
  { level: 100, title: "Grandmaster of Tales", icon: "👑", color: "#f59e0b", desc: "Legend. Your name echoes through the halls of story." },
];

function getClassForLevel(level) {
  let current = CLASS_PROGRESSION[0];
  for (const tier of CLASS_PROGRESSION) {
    if (level >= tier.level) current = tier;
    else break;
  }
  return current;
}

function getNextClass(level) {
  for (const tier of CLASS_PROGRESSION) {
    if (tier.level > level) return tier;
  }
  return null;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const ICONS = ["✍️","🧠","🔒","🎯","👥","🎁","💪","🏃","📚","🌿","🎮","🍳","🛠️","🎨","🧘","💧","🌅","🔥","⚔️","🌱"];

export default function HeroPath() {
  const [state, setState] = useState(loadState);
  const [activeTab, setActiveTab] = useState("habits");
  const [notification, setNotification] = useState(null);
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [showNewRite, setShowNewRite] = useState(false);
  const [newRite, setNewRite] = useState({ name: "", desc: "", stat: "discipline", xpReward: 15, icon: "✍️" });

  useEffect(() => { saveState(state); }, [state]);

  // Reset daily habits at midnight
  useEffect(() => {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem("last-reset");
    if (lastReset !== today) {
      setState(prev => ({
        ...prev,
        habits: prev.habits.map(h => ({
          ...h,
          streak: h.completedToday ? h.streak : Math.max(0, h.streak - 1),
          completedToday: false,
        }))
      }));
      localStorage.setItem("last-reset", today);
    }
  }, []);

  function notify(msg, color = "#6366f1") {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 2500);
  }

  function completeHabit(id) {
    setState(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit || habit.completedToday) return prev;

      const newHabits = prev.habits.map(h =>
        h.id === id ? { ...h, completedToday: true, streak: h.streak + 1 } : h
      );

      let newChar = applyXP({ ...prev.character }, habit.xpReward);
      const newStats = { ...newChar.stats };
      if (newStats[habit.stat] !== undefined) newStats[habit.stat] += 1;
      newChar.stats = newStats;

      let newMilestones = [...prev.milestones];

      // First edit session
      if (id === 1) {
        const totalSessions = (prev.totalEditSessions || 0) + 1;
        if (totalSessions === 1) {
          newMilestones = newMilestones.map(m => m.id === 1 ? { ...m, earned: true } : m);
          notify("🏅 Achievement: First Words!", "#f59e0b");
        }
        if (totalSessions >= 30) {
          newMilestones = newMilestones.map(m => m.id === 8 ? { ...m, earned: true } : m);
        }
        setState(s => ({ ...s, totalEditSessions: totalSessions }));
      }

      // 7-day streak
      const newStreak = newHabits.find(h => h.id === id)?.streak || 0;
      if (id === 1 && newStreak >= 7) {
        newMilestones = newMilestones.map(m => m.id === 3 ? { ...m, earned: true } : m);
      }

      // All focus habits
      const focusHabits = [2, 3, 4];
      const allFocusDone = focusHabits.every(fid => newHabits.find(h => h.id === fid)?.completedToday);
      if (allFocusDone) {
        newMilestones = newMilestones.map(m => m.id === 2 ? { ...m, earned: true } : m);
      }

      // Level 5
      if (newChar.level >= 5) {
        newMilestones = newMilestones.map(m => m.id === 5 ? { ...m, earned: true } : m);
      }

      // 1000 XP
      if (newChar.totalXpEarned >= 1000) {
        newMilestones = newMilestones.map(m => m.id === 6 ? { ...m, earned: true } : m);
      }

      if (newChar.classChanged) {
        setLevelUpAnim(true);
        setTimeout(() => setLevelUpAnim(false), 1500);
        notify(`✨ CLASS PROMOTION! You are now a ${newChar.newClassName}!`, "#f59e0b");
      } else if (newChar.leveledUp) {
        setLevelUpAnim(true);
        setTimeout(() => setLevelUpAnim(false), 1500);
        notify(`⬆️ LEVEL UP! You are now Level ${newChar.level}!`, "#f59e0b");
      } else {
        notify(`+${habit.xpReward} XP — ${habit.name}!`, STAT_COLORS[habit.stat] || "#6366f1");
      }

      const newLog = [
        { text: `✅ ${habit.name} (+${habit.xpReward} XP)`, time: new Date().toLocaleTimeString() },
        ...prev.log.slice(0, 19)
      ];

      const { leveledUp: _, ...charToSave } = newChar;

      return {
        ...prev,
        character: charToSave,
        habits: newHabits,
        milestones: newMilestones,
        log: newLog,
        totalEditSessions: id === 1 ? (prev.totalEditSessions || 0) + 1 : prev.totalEditSessions,
      };
    });
  }

  function advanceMilestone(goalId) {
    setState(prev => {
      const goal = prev.goals.find(g => g.id === goalId);
      if (!goal || goal.completedMilestones >= goal.milestones.length) return prev;

      const newCompleted = goal.completedMilestones + 1;
      const newProgress = Math.round((newCompleted / goal.milestones.length) * 100);
      const isComplete = newCompleted >= goal.milestones.length;

      const xpGain = isComplete ? goal.xpReward : Math.floor(goal.xpReward / goal.milestones.length);
      let newChar = applyXP({ ...prev.character }, xpGain);

      let newMilestones = [...prev.milestones];
      if (goal.id === 1 && newCompleted === 1) {
        newMilestones = newMilestones.map(m => m.id === 4 ? { ...m, earned: true } : m);
        notify("🏅 Achievement: Chapter Champion!", "#f59e0b");
      }
      if (goal.id === 3 && isComplete) {
        newMilestones = newMilestones.map(m => m.id === 7 ? { ...m, earned: true } : m);
        notify("🎊 ACHIEVEMENT UNLOCKED: Published!", "#f59e0b");
      }

      if (newChar.classChanged) {
        setLevelUpAnim(true);
        setTimeout(() => setLevelUpAnim(false), 1500);
        notify(`✨ CLASS PROMOTION! You are now a ${newChar.newClassName}!`, "#f59e0b");
      } else if (newChar.leveledUp) {
        setLevelUpAnim(true);
        setTimeout(() => setLevelUpAnim(false), 1500);
        notify(`⬆️ LEVEL UP! Level ${newChar.level}!`, "#f59e0b");
      } else {
        const milestoneName = goal.milestones[newCompleted - 1];
        notify(`Quest progress: ${milestoneName} ✓ (+${xpGain} XP)`, "#10b981");
      }

      const newLog = [
        { text: `🗺️ ${goal.name}: "${goal.milestones[newCompleted - 1]}" (+${xpGain} XP)`, time: new Date().toLocaleTimeString() },
        ...prev.log.slice(0, 19)
      ];

      const { leveledUp: _, ...charToSave } = newChar;

      return {
        ...prev,
        character: charToSave,
        goals: prev.goals.map(g =>
          g.id === goalId ? { ...g, completedMilestones: newCompleted, progress: newProgress } : g
        ),
        milestones: newMilestones,
        log: newLog,
      };
    });
  }

  function createHabit() {
    if (!newRite.name.trim()) return;
    setState(prev => ({
      ...prev,
      habits: [...prev.habits, {
        id: Date.now(),
        name: newRite.name.trim(),
        desc: newRite.desc.trim() || "",
        stat: newRite.stat,
        xpReward: newRite.xpReward,
        icon: newRite.icon,
        completedToday: false,
        streak: 0,
        custom: true,
      }]
    }));
    setNewRite({ name: "", desc: "", stat: "discipline", xpReward: 15, icon: "✍️" });
    setShowNewRite(false);
    notify("New rite added to your practice!", STAT_COLORS[newRite.stat]);
  }

  function deleteHabit(id) {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== id) }));
    notify("Rite removed.", "#6b5a80");
  }

  function resetGame() {
    if (window.confirm("Reset all progress? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("last-reset");
      setState(INITIAL_STATE);
      notify("Game reset. Your quest begins anew.", "#6366f1");
    }
  }

  const { character: char, habits, goals, milestones, log } = state;
  const xpPct = Math.min(100, Math.round((char.xp / char.xpToNext) * 100));
  const completedToday = habits.filter(h => h.completedToday).length;
  const currentClass = getClassForLevel(char.level);
  const nextClass = getNextClass(char.level);
  const levelsToNext = nextClass ? nextClass.level - char.level : 0;
  const classProgressPct = nextClass
    ? Math.round(((char.level - currentClass.level) / (nextClass.level - currentClass.level)) * 100)
    : 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f0c1a 0%, #1a1028 50%, #0c1220 100%)",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      color: "#e8d5b0",
      padding: "0 0 60px 0",
    }}>

      {/* NOTIFICATION */}
      {notification && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: notification.color, color: "#fff", padding: "10px 20px",
          borderRadius: 30, fontWeight: "bold", fontSize: 14, zIndex: 1000,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          animation: "fadeIn 0.3s ease",
        }}>{notification.msg}</div>
      )}

      {/* LEVEL UP FLASH */}
      {levelUpAnim && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(245,158,11,0.15)",
          zIndex: 999, pointerEvents: "none",
          animation: "pulse 1.5s ease",
        }} />
      )}

      {/* ── HEADER / CHARACTER CARD ── */}
      <div style={{
        background: "linear-gradient(180deg, #1e1535 0%, #150f28 100%)",
        borderBottom: "1px solid #3a2a5a",
        padding: "20px 16px 16px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>The Hero's Path</div>
            <div style={{ fontSize: 22, fontWeight: "bold", color: "#f8e8c0" }}>{char.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ fontSize: 16 }}>{currentClass.icon}</span>
              <span style={{ fontSize: 13, color: currentClass.color, fontWeight: "bold" }}>{currentClass.title}</span>
              <span style={{ fontSize: 12, color: "#6b5a80" }}>· Lv {char.level}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, marginBottom: 2 }}>TOTAL XP</div>
            <div style={{ fontSize: 18, color: "#f59e0b", fontWeight: "bold" }}>{char.totalXpEarned.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#6b5a80", marginTop: 2 }}>{completedToday}/{habits.length} today</div>
          </div>
        </div>

        {/* XP Bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8b7aaa", marginBottom: 4 }}>
            <span>XP to Level {char.level + 1}</span>
            <span>{char.xp} / {char.xpToNext}</span>
          </div>
          <div style={{ height: 8, background: "#2a1f40", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${xpPct}%`,
              background: "linear-gradient(90deg, #6366f1, #a78bfa)",
              borderRadius: 4, transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Class Progression Bar */}
        {nextClass && (
          <div style={{ marginBottom: 12, padding: "8px 10px", background: "#120d20", borderRadius: 8, border: `1px solid ${currentClass.color}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8b7aaa", marginBottom: 4 }}>
              <span style={{ color: currentClass.color }}>{currentClass.icon} {currentClass.title}</span>
              <span>{levelsToNext} levels to <span style={{ color: nextClass.color }}>{nextClass.icon} {nextClass.title}</span></span>
            </div>
            <div style={{ height: 5, background: "#2a1f40", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${classProgressPct}%`,
                background: `linear-gradient(90deg, ${currentClass.color}, ${nextClass.color})`,
                borderRadius: 3, transition: "width 0.5s ease",
              }} />
            </div>
          </div>
        )}
        {!nextClass && (
          <div style={{ marginBottom: 12, padding: "8px 10px", background: "#120d20", borderRadius: 8, border: "1px solid #f59e0b33", textAlign: "center" }}>
            <span style={{ fontSize: 11, color: "#f59e0b" }}>👑 Grandmaster of Tales — Maximum Class Achieved</span>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {Object.entries(char.stats).map(([stat, val]) => (
            <div key={stat} style={{
              background: "#1a1030",
              border: `1px solid ${STAT_COLORS[stat]}33`,
              borderRadius: 8, padding: "6px 4px", textAlign: "center"
            }}>
              <div style={{ fontSize: 16, fontWeight: "bold", color: STAT_COLORS[stat] }}>{val}</div>
              <div style={{ fontSize: 9, color: "#8b7aaa", textTransform: "uppercase", letterSpacing: 1 }}>{stat.slice(0,4)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #2a1f40" }}>
        {[
          { id: "habits", label: "✍️ Rites" },
          { id: "goals",  label: "🗺️ Quests" },
          { id: "badges", label: "🏅 Badges" },
          { id: "log",    label: "📜 Log" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "12px 4px", fontSize: 12, border: "none", cursor: "pointer",
            background: activeTab === tab.id ? "#1e1535" : "transparent",
            color: activeTab === tab.id ? "#c4a8ff" : "#6b5a80",
            borderBottom: activeTab === tab.id ? "2px solid #6366f1" : "2px solid transparent",
            transition: "all 0.2s",
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "16px 16px" }}>

        {/* DAILY RITES */}
        {activeTab === "habits" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, textTransform: "uppercase" }}>Daily Rites</div>
              <button onClick={() => setShowNewRite(v => !v)} style={{
                background: showNewRite ? "#2a1f40" : "transparent",
                border: "1px solid #3a2a5a", color: "#a07ac0", fontSize: 12,
                padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
              }}>{showNewRite ? "✕ Cancel" : "+ New Rite"}</button>
            </div>

            {/* CREATE RITE FORM */}
            {showNewRite && (
              <div style={{ marginBottom: 14, padding: 14, background: "#1a1030", border: "1px solid #3a2a5a", borderRadius: 10 }}>
                <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Forge a New Rite</div>

                {/* Name */}
                <input
                  value={newRite.name}
                  onChange={e => setNewRite(r => ({ ...r, name: e.target.value }))}
                  placeholder="Rite name..."
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "8px 10px",
                    background: "#120d20", border: "1px solid #3a2a5a", borderRadius: 8,
                    color: "#e8d5b0", fontSize: 13, fontFamily: "inherit", marginBottom: 8,
                  }}
                />

                {/* Description */}
                <input
                  value={newRite.desc}
                  onChange={e => setNewRite(r => ({ ...r, desc: e.target.value }))}
                  placeholder="Short description (optional)..."
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "8px 10px",
                    background: "#120d20", border: "1px solid #3a2a5a", borderRadius: 8,
                    color: "#e8d5b0", fontSize: 13, fontFamily: "inherit", marginBottom: 10,
                  }}
                />

                {/* Stat Picker */}
                <div style={{ fontSize: 11, color: "#8b7aaa", marginBottom: 6 }}>ATTRIBUTE</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                  {Object.entries(STAT_COLORS).map(([stat, color]) => (
                    <button key={stat} onClick={() => setNewRite(r => ({ ...r, stat }))} style={{
                      padding: "6px 4px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                      border: `2px solid ${newRite.stat === stat ? color : "#2a1f40"}`,
                      background: newRite.stat === stat ? `${color}22` : "#120d20",
                      color: newRite.stat === stat ? color : "#6b5a80", fontSize: 11,
                      textTransform: "capitalize",
                    }}>{stat}</button>
                  ))}
                </div>

                {/* XP Slider */}
                <div style={{ fontSize: 11, color: "#8b7aaa", marginBottom: 6 }}>
                  XP REWARD: <span style={{ color: STAT_COLORS[newRite.stat], fontWeight: "bold" }}>{newRite.xpReward}</span>
                </div>
                <input type="range" min="5" max="50" step="5" value={newRite.xpReward}
                  onChange={e => setNewRite(r => ({ ...r, xpReward: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: STAT_COLORS[newRite.stat], marginBottom: 10 }}
                />

                {/* Icon Picker */}
                <div style={{ fontSize: 11, color: "#8b7aaa", marginBottom: 6 }}>ICON</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setNewRite(r => ({ ...r, icon }))} style={{
                      width: 34, height: 34, borderRadius: 8, fontSize: 16, cursor: "pointer",
                      border: `2px solid ${newRite.icon === icon ? STAT_COLORS[newRite.stat] : "#2a1f40"}`,
                      background: newRite.icon === icon ? `${STAT_COLORS[newRite.stat]}22` : "#120d20",
                    }}>{icon}</button>
                  ))}
                </div>

                <button onClick={createHabit} style={{
                  width: "100%", padding: "10px 0", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                  background: `${STAT_COLORS[newRite.stat]}22`,
                  border: `1px solid ${STAT_COLORS[newRite.stat]}88`,
                  color: STAT_COLORS[newRite.stat], fontSize: 14, fontWeight: "bold",
                }}>⚔️ Forge Rite</button>
              </div>
            )}

            {habits.map(h => (
              <div key={h.id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", marginBottom: 8,
                background: h.completedToday ? "#1a2a1a" : "#1a1030",
                border: `1px solid ${h.completedToday ? "#2a5a2a" : "#2a1f40"}`,
                borderRadius: 10, transition: "all 0.2s",
              }}>
                <div onClick={() => completeHabit(h.id)} style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                  background: h.completedToday ? "#2a5a2a" : "#2a1f40",
                  border: `2px solid ${h.completedToday ? "#4a9a4a" : STAT_COLORS[h.stat] || "#6366f1"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, cursor: h.completedToday ? "default" : "pointer",
                }}>
                  {h.completedToday ? "✓" : h.icon}
                </div>
                <div onClick={() => completeHabit(h.id)} style={{ flex: 1, cursor: h.completedToday ? "default" : "pointer", opacity: h.completedToday ? 0.6 : 1 }}>
                  <div style={{ fontSize: 14, color: h.completedToday ? "#6a8a6a" : "#e8d5b0", fontWeight: "bold" }}>{h.name}</div>
                  {h.desc && <div style={{ fontSize: 11, color: "#6b5a80", marginTop: 2 }}>{h.desc}</div>}
                  <div style={{ fontSize: 10, color: STAT_COLORS[h.stat], marginTop: 2, textTransform: "capitalize" }}>{h.stat}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 13, color: STAT_COLORS[h.stat] || "#6366f1", fontWeight: "bold" }}>+{h.xpReward}</div>
                  {h.streak > 0 && <div style={{ fontSize: 11, color: "#f59e0b" }}>🔥{h.streak}</div>}
                  <button onClick={() => deleteHabit(h.id)} style={{
                    background: "transparent", border: "none", color: "#3a2a4a",
                    fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                  }} title="Remove rite">✕</button>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 16, padding: 12, background: "#1a1030", borderRadius: 10, border: "1px solid #2a1f40" }}>
              <div style={{ fontSize: 11, color: "#8b7aaa", marginBottom: 4 }}>💡 ADHD TIP</div>
              <div style={{ fontSize: 12, color: "#a09080", lineHeight: 1.5 }}>
                Set a 15-min timer before you begin. Your only goal: open the manuscript and change one sentence. Everything else is a bonus.
              </div>
            </div>
          </div>
        )}

        {/* QUESTS */}
        {activeTab === "goals" && (
          <div>
            <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Active Quests
            </div>
            {goals.map(g => {
              const isComplete = g.completedMilestones >= g.milestones.length;
              const nextMilestone = g.milestones[g.completedMilestones];
              return (
                <div key={g.id} style={{
                  marginBottom: 16, padding: "14px",
                  background: "#1a1030",
                  border: `1px solid ${isComplete ? "#2a5a2a" : "#2a1f40"}`,
                  borderRadius: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 20 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: "bold", color: "#e8d5b0" }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: "#6b5a80" }}>{g.completedMilestones}/{g.milestones.length} milestones · {g.xpReward} XP total</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, background: "#2a1f40", borderRadius: 3, overflow: "hidden", marginBottom: 10 }}>
                    <div style={{
                      height: "100%", width: `${g.progress}%`,
                      background: `linear-gradient(90deg, ${STAT_COLORS[g.stat]}, ${STAT_COLORS[g.stat]}99)`,
                      borderRadius: 3, transition: "width 0.5s ease",
                    }} />
                  </div>

                  {/* Milestone list */}
                  <div style={{ marginBottom: 10 }}>
                    {g.milestones.map((m, i) => (
                      <div key={i} style={{
                        fontSize: 12, padding: "3px 0",
                        color: i < g.completedMilestones ? "#4a8a4a" : i === g.completedMilestones ? "#e8d5b0" : "#4a3a60",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span>{i < g.completedMilestones ? "✓" : i === g.completedMilestones ? "▶" : "○"}</span>
                        {m}
                      </div>
                    ))}
                  </div>

                  {!isComplete && (
                    <button onClick={() => advanceMilestone(g.id)} style={{
                      width: "100%", padding: "9px 0", borderRadius: 8,
                      background: `linear-gradient(135deg, ${STAT_COLORS[g.stat]}33, ${STAT_COLORS[g.stat]}22)`,
                      border: `1px solid ${STAT_COLORS[g.stat]}66`,
                      color: STAT_COLORS[g.stat], fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      ✓ Complete: "{nextMilestone}"
                    </button>
                  )}
                  {isComplete && (
                    <div style={{ textAlign: "center", color: "#4a8a4a", fontSize: 13 }}>⚔️ Quest Complete!</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* BADGES */}
        {activeTab === "badges" && (
          <div>
            {/* Class Progression Timeline */}
            <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Class Progression</div>
            <div style={{ marginBottom: 20 }}>
              {CLASS_PROGRESSION.map((tier, i) => {
                const unlocked = char.level >= tier.level;
                const isCurrent = currentClass.title === tier.title;
                return (
                  <div key={tier.level} style={{ display: "flex", gap: 12, marginBottom: 6, alignItems: "flex-start" }}>
                    {/* Line + dot */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: unlocked ? `${tier.color}22` : "#120d20",
                        border: `2px solid ${isCurrent ? tier.color : unlocked ? tier.color + "88" : "#2a1f40"}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                        boxShadow: isCurrent ? `0 0 10px ${tier.color}66` : "none",
                      }}>{tier.icon}</div>
                      {i < CLASS_PROGRESSION.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 10, background: unlocked ? tier.color + "44" : "#1e1530", margin: "3px 0" }} />
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ paddingTop: 4, opacity: unlocked ? 1 : 0.4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: "bold", color: isCurrent ? tier.color : unlocked ? "#e8d5b0" : "#4a3a60" }}>{tier.title}</span>
                        {isCurrent && <span style={{ fontSize: 10, color: tier.color, background: tier.color + "22", padding: "1px 6px", borderRadius: 10 }}>CURRENT</span>}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b5a80", marginTop: 1 }}>Level {tier.level} · {tier.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Achievements</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {milestones.map(m => (
                <div key={m.id} style={{
                  padding: "12px 10px",
                  background: m.earned ? "#1a2030" : "#120d1e",
                  border: `1px solid ${m.earned ? "#3a4a6a" : "#1e1530"}`,
                  borderRadius: 10, textAlign: "center",
                  opacity: m.earned ? 1 : 0.4,
                }}>
                  <div style={{ fontSize: 28 }}>{m.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: m.earned ? "#c4a8ff" : "#6b5a80", marginTop: 4 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: "#6b5a80", marginTop: 2 }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOG */}
        {activeTab === "log" && (
          <div>
            <div style={{ fontSize: 11, color: "#8b7aaa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Adventure Log
            </div>
            {log.length === 0 && (
              <div style={{ color: "#4a3a60", fontSize: 14, textAlign: "center", marginTop: 40 }}>
                No entries yet. Complete your first rite to begin the chronicle.
              </div>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{
                padding: "10px 12px", marginBottom: 8,
                background: "#1a1030", borderRadius: 8,
                border: "1px solid #2a1f40",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, color: "#c4a8ff" }}>{entry.text}</span>
                <span style={{ fontSize: 11, color: "#4a3a60", flexShrink: 0, marginLeft: 8 }}>{entry.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RESET BUTTON ── */}
      <div style={{ textAlign: "center", marginTop: 20 }}>
        <button onClick={resetGame} style={{
          background: "transparent", border: "1px solid #3a2a4a",
          color: "#4a3a60", fontSize: 11, padding: "6px 16px",
          borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
        }}>Reset Progress</button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 0; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
