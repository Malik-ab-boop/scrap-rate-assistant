import { useState, useEffect, useMemo } from "react";

const DEFAULT_ITEMS = [
  { id: "iron", name: "Iron", icon: "⚙️", defaultRate: 35 },
  { id: "copper", name: "Copper", icon: "🔶", defaultRate: 850 },
  { id: "aluminum", name: "Aluminum", icon: "🪙", defaultRate: 150 },
  { id: "brass", name: "Brass", icon: "🟡", defaultRate: 500 },
  { id: "plastic", name: "Plastic", icon: "♻️", defaultRate: 25 },
  { id: "batteries", name: "Batteries", icon: "🔋", defaultRate: 80 },
];

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// Format number with up to 2 decimal places, no trailing zeros
function fmt(n) {
  const num = parseFloat(n);
  if (isNaN(num)) return "0";
  // Show decimals only if present
  const rounded = Math.round(num * 100) / 100;
  return rounded.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function today() { return new Date().toISOString().split("T")[0]; }

const NAV = [
  { id: "dashboard", label: "Rates", icon: "📊" },
  { id: "calc", label: "Calculate", icon: "🧮" },
  { id: "history", label: "History", icon: "📋" },
  { id: "admin", label: "Admin", icon: "🔐" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [customItems, setCustomItems] = useLocalStorage("sra_custom_items", []);
  const [rates, setRates] = useLocalStorage("sra_rates", Object.fromEntries(DEFAULT_ITEMS.map(i => [i.id, i.defaultRate])));
  const [transactions, setTransactions] = useLocalStorage("sra_tx", []);

  // All items = defaults + custom
  const allItems = useMemo(() => [...DEFAULT_ITEMS, ...customItems], [customItems]);

  function addTransaction(tx) {
    setTransactions(prev => [{ ...tx, id: Date.now(), date: today() }, ...prev]);
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", background: "#f0f4f8", minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#1a3a2a", padding: "16px 20px 12px", color: "#fff" }}>
        <div style={{ fontSize: 11, color: "#7ecba0", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Scrap Rate</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Assistant</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "dashboard" && <Dashboard rates={rates} allItems={allItems} />}
        {tab === "calc" && <Calculator rates={rates} allItems={allItems} onSave={addTransaction} />}
        {tab === "history" && <History transactions={transactions} allItems={allItems} />}
        {tab === "admin" && (
          <Admin
            rates={rates} setRates={setRates}
            allItems={allItems}
            customItems={customItems} setCustomItems={setCustomItems}
          />
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === n.id ? 700 : 400, color: tab === n.id ? "#1a3a2a" : "#94a3b8" }}>{n.label}</span>
            {tab === n.id && <div style={{ width: 20, height: 2, background: "#2d7a4f", borderRadius: 99 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ rates, allItems }) {
  const [lookup, setLookup] = useState(null);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#1a3a2a" }}>Today's Rates</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <div style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>PKR / kg</div>
      </div>

      {/* Rate Cards — all items including custom */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {allItems.map(item => {
          const rate = rates[item.id];
          if (rate === undefined) return null;
          return (
            <div key={item.id} onClick={() => setLookup(lookup === item.id ? null : item.id)}
              style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: lookup === item.id ? "2px solid #2d7a4f" : "1.5px solid #e2e8f0", cursor: "pointer", transition: "all 0.15s", position: "relative" }}>
              {/* Custom badge */}
              {!DEFAULT_ITEMS.find(d => d.id === item.id) && (
                <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>NEW</div>
              )}
              <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>{item.name}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#1a3a2a" }}>₨ {fmt(rate)}</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>per kg</div>
            </div>
          );
        })}
      </div>

      {/* Quick Lookup Result */}
      {lookup && (
        <div style={{ background: "#1a3a2a", color: "#fff", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#7ecba0", marginBottom: 4 }}>Current Rate</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>₨ {fmt(rates[lookup])}</div>
          <div style={{ fontSize: 14, color: "#a7f3d0", marginTop: 2 }}>per kg of {allItems.find(i => i.id === lookup)?.name}</div>
        </div>
      )}

      <div style={{ background: "#fff8ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
        💡 Tap any card to quickly check rate while dealing with a customer
      </div>
    </div>
  );
}

// ─── Calculator ─────────────────────────────────────────────────────────────
function Calculator({ rates, allItems, onSave }) {
  const [item, setItem] = useState(allItems[0]?.id || "iron");
  const [weight, setWeight] = useState("");
  const [discount, setDiscount] = useState(0);
  const [sellRate, setSellRate] = useState("");
  const [custName, setCustName] = useState("");
  const [saved, setSaved] = useState(false);

  const rate = rates[item] || 0;
  const w = parseFloat(weight) || 0;

  // Float calculations — no rounding until display
  const gross = w * rate;
  const discountAmt = (gross * discount) / 100;
  const total = gross - discountAmt;
  const profit = sellRate ? (parseFloat(sellRate) - rate) * w : null;

  function handleSave() {
    if (!weight || total <= 0) return;
    onSave({ item, weight: w, rate, discount, total, customerName: custName || "Walk-in" });
    setSaved(true);
    setTimeout(() => { setSaved(false); setWeight(""); setDiscount(0); setCustName(""); setSellRate(""); }, 1500);
  }

  // Make sure selected item exists in allItems
  const validItem = allItems.find(i => i.id === item);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 17, color: "#1a3a2a", marginBottom: 16 }}>Purchase Calculator</div>

      {/* Item Select */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Scrap Item</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {allItems.map(i => (
            <button key={i.id} onClick={() => setItem(i.id)}
              style={{ padding: "10px 6px", borderRadius: 10, border: item === i.id ? "2px solid #2d7a4f" : "1.5px solid #e2e8f0", background: item === i.id ? "#f0fdf4" : "#fff", cursor: "pointer", fontSize: 12, fontWeight: item === i.id ? 700 : 400, color: item === i.id ? "#1a3a2a" : "#475569" }}>
              <div style={{ fontSize: 18 }}>{i.icon}</div>
              {i.name}
            </button>
          ))}
        </div>
      </div>

      {/* Rate Display */}
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "#166534" }}>Today's Rate</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#1a3a2a" }}>₨ {fmt(rate)} / kg</span>
      </div>

      {/* Weight */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Weight (kg)</div>
        <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Enter weight in kg (e.g. 12.5)"
          style={{ width: "100%", fontSize: 20, padding: "12px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
      </div>

      {/* Discount Slider */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Bargaining Discount — <span style={{ color: "#d97706" }}>{discount}%</span>
          {discount > 0 && <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>(-₨ {fmt(discountAmt)})</span>}
        </div>
        <input type="range" min="0" max="30" value={discount} onChange={e => setDiscount(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#2d7a4f" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
          <span>0% (No discount)</span><span>30% (Max)</span>
        </div>
      </div>

      {/* Calculation Breakdown + Total */}
      {weight && w > 0 && (
        <div style={{ background: "#1a3a2a", color: "#fff", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#7ecba0", marginBottom: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Calculation Breakdown</div>

          {/* Step by step */}
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#a7f3d0" }}>
              <span>Weight</span>
              <span style={{ fontWeight: 600 }}>{fmt(w)} kg</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#a7f3d0" }}>
              <span>Rate</span>
              <span style={{ fontWeight: 600 }}>₨ {fmt(rate)} / kg</span>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 7, display: "flex", justifyContent: "space-between", fontSize: 13, color: "#d1fae5" }}>
              <span>{fmt(w)} × {fmt(rate)}</span>
              <span style={{ fontWeight: 700 }}>= ₨ {fmt(gross)}</span>
            </div>
            {discount > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#fca5a5" }}>
                  <span>Discount ({discount}%)</span>
                  <span style={{ fontWeight: 600 }}>− ₨ {fmt(discountAmt)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
                  <span>{fmt(gross)} × {discount} ÷ 100</span>
                  <span>= ₨ {fmt(discountAmt)}</span>
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: 12, color: "#7ecba0", marginBottom: 4 }}>Total to Pay Customer</div>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>₨ {fmt(total)}</div>
          {discount > 0 && (
            <div style={{ fontSize: 13, color: "#a7f3d0", marginTop: 4 }}>
              ₨ {fmt(gross)} − ₨ {fmt(discountAmt)} (discount)
            </div>
          )}
        </div>
      )}

      {/* Profit Estimate */}
      <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a3a2a", marginBottom: 8 }}>📈 Profit Estimate (Optional)</div>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Your expected selling rate</div>
        <input type="number" step="0.01" value={sellRate} onChange={e => setSellRate(e.target.value)} placeholder="₨ per kg"
          style={{ width: "100%", fontSize: 16, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        {profit !== null && w > 0 && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: profit >= 0 ? "#f0fdf4" : "#fef2f2", borderRadius: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: profit >= 0 ? "#166534" : "#991b1b" }}>Profit/kg</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: profit >= 0 ? "#15803d" : "#dc2626" }}>
                {profit >= 0 ? "+" : ""}₨ {fmt((parseFloat(sellRate) - rate))} /kg
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>{fmt(parseFloat(sellRate))} − {fmt(rate)} × {fmt(w)} kg</span>
              <span style={{ fontWeight: 700, fontSize: 15, color: profit >= 0 ? "#15803d" : "#dc2626" }}>
                {profit >= 0 ? "+" : ""}₨ {fmt(profit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Customer Name */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Customer Name (Optional)</div>
        <input type="text" value={custName} onChange={e => setCustName(e.target.value)} placeholder="Walk-in customer"
          style={{ width: "100%", fontSize: 15, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
      </div>

      <button onClick={handleSave} disabled={!weight || total <= 0 || saved}
        style={{ width: "100%", padding: "16px", fontSize: 16, fontWeight: 700, background: saved ? "#15803d" : "#2d7a4f", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer", letterSpacing: 0.3 }}>
        {saved ? "✅ Deal Saved!" : "💾 Save Deal"}
      </button>
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────────
function History({ transactions, allItems }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const itemName = allItems.find(i => i.id === tx.item)?.name.toLowerCase() || "";
      const matchSearch = !search || itemName.includes(search.toLowerCase()) || (tx.customerName || "").toLowerCase().includes(search.toLowerCase());
      const matchDate = !dateFilter || tx.date === dateFilter;
      return matchSearch && matchDate;
    });
  }, [transactions, search, dateFilter, allItems]);

  const totalSpent = filtered.reduce((s, tx) => s + tx.total, 0);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 17, color: "#1a3a2a", marginBottom: 12 }}>Transaction History</div>

      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by item or customer..."
        style={{ width: "100%", fontSize: 14, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
      <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
        style={{ width: "100%", fontSize: 14, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />

      {filtered.length > 0 && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#166534" }}>{filtered.length} deals</span>
          <span style={{ fontWeight: 700, color: "#1a3a2a" }}>Total: ₨ {fmt(totalSpent)}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 15 }}>No transactions found</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Start by saving a deal in the Calculator</div>
        </div>
      ) : (
        filtered.map(tx => {
          const itm = allItems.find(i => i.id === tx.item);
          return (
            <div key={tx.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>{itm?.icon || "📦"}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1a3a2a" }}>{itm?.name || tx.item}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{tx.customerName || "Walk-in"}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#1a3a2a" }}>₨ {fmt(tx.total)}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{tx.date}</div>
                </div>
              </div>
              {/* Calculation detail in history */}
              <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", marginBottom: 6, fontSize: 12, color: "#475569" }}>
                {fmt(tx.weight)} kg × ₨{fmt(tx.rate)} = ₨{fmt(tx.weight * tx.rate)}
                {tx.discount > 0 && <span style={{ color: "#d97706" }}> − {tx.discount}% (₨{fmt((tx.weight * tx.rate * tx.discount) / 100)}) = ₨{fmt(tx.total)}</span>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 99 }}>{fmt(tx.weight)} kg</span>
                <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 99 }}>₨{fmt(tx.rate)}/kg</span>
                {tx.discount > 0 && <span style={{ fontSize: 11, background: "#fef9c3", color: "#854d0e", padding: "3px 8px", borderRadius: 99 }}>{tx.discount}% off</span>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Admin ──────────────────────────────────────────────────────────────────
function Admin({ rates, setRates, allItems, customItems, setCustomItems }) {
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState(false);
  const [draft, setDraft] = useState({});
  const [saved, setSaved] = useState(false);
  const [wrongPin, setWrongPin] = useState(false);

  // Add new item form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📦");
  const [newRate, setNewRate] = useState("");
  const [addError, setAddError] = useState("");

  const ADMIN_PIN = "1234";

  function handlePin() {
    if (pin === ADMIN_PIN) {
      setAuth(true);
      // Build draft from all items
      const d = {};
      allItems.forEach(i => { d[i.id] = rates[i.id] ?? i.defaultRate; });
      setDraft(d);
      setWrongPin(false);
    } else {
      setWrongPin(true);
      setPin("");
    }
  }

  function handleSave() {
    setRates({ ...draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAddItem() {
    setAddError("");
    const trimmedName = newName.trim();
    if (!trimmedName) { setAddError("Please enter an item name."); return; }
    const rate = parseFloat(newRate);
    if (!newRate || isNaN(rate) || rate <= 0) { setAddError("Please enter a valid rate greater than 0."); return; }

    // Check duplicate name
    if (allItems.find(i => i.name.toLowerCase() === trimmedName.toLowerCase())) {
      setAddError("An item with this name already exists.");
      return;
    }

    const newId = "custom_" + Date.now();
    const newItem = { id: newId, name: trimmedName, icon: newIcon, defaultRate: rate };

    setCustomItems(prev => [...prev, newItem]);
    setRates(prev => ({ ...prev, [newId]: rate }));
    setDraft(prev => ({ ...prev, [newId]: rate }));

    // Reset form
    setNewName("");
    setNewIcon("📦");
    setNewRate("");
    setShowAddForm(false);
  }

  function handleDeleteCustomItem(id) {
    setCustomItems(prev => prev.filter(i => i.id !== id));
    setRates(prev => { const n = { ...prev }; delete n[id]; return n; });
    setDraft(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  const EMOJI_OPTIONS = ["📦", "🔩", "🪝", "🧲", "🔧", "🪜", "🥫", "🪣", "💡", "🔌", "📺", "🖨️", "⚡", "🔴", "🟢", "🔵", "⬛", "🟫"];

  if (!auth) return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
      <div style={{ fontSize: 48 }}>🔐</div>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#1a3a2a" }}>Admin Access</div>
      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>Enter PIN to edit rates<br />(Default: 1234)</div>
      <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handlePin()} placeholder="Enter PIN"
        style={{ fontSize: 24, textAlign: "center", letterSpacing: 8, padding: "12px 20px", border: `2px solid ${wrongPin ? "#ef4444" : "#e2e8f0"}`, borderRadius: 12, outline: "none", width: 160 }} />
      {wrongPin && <div style={{ color: "#dc2626", fontSize: 13 }}>Wrong PIN. Try again.</div>}
      <button onClick={handlePin} style={{ background: "#2d7a4f", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%" }}>
        Unlock
      </button>
    </div>
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#1a3a2a" }}>Edit Rates</div>
        <button onClick={() => setAuth(false)} style={{ fontSize: 12, color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>🔒 Lock</button>
      </div>

      <div style={{ background: "#fff8ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400e" }}>
        📅 Set today's buying rates (₨ per kg). Changes affect all calculations immediately.
      </div>

      {/* Default Items */}
      <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Default Items</div>
      {DEFAULT_ITEMS.map(itm => (
        <div key={itm.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{itm.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#1a3a2a", marginBottom: 4 }}>{itm.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, color: "#475569" }}>₨</span>
              <input type="number" step="0.01" value={draft[itm.id] ?? ""} onChange={e => setDraft(d => ({ ...d, [itm.id]: parseFloat(e.target.value) || 0 }))}
                style={{ flex: 1, fontSize: 18, fontWeight: 700, padding: "6px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", color: "#1a3a2a" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>/kg</span>
            </div>
          </div>
        </div>
      ))}

      {/* Custom Items */}
      {customItems.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>Custom Items</div>
          {customItems.map(itm => (
            <div key={itm.id} style={{ background: "#fff", border: "1.5px solid #fde68a", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{itm.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: "#1a3a2a", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  {itm.name}
                  <span style={{ fontSize: 9, background: "#fef3c7", color: "#92400e", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>CUSTOM</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "#475569" }}>₨</span>
                  <input type="number" step="0.01" value={draft[itm.id] ?? ""} onChange={e => setDraft(d => ({ ...d, [itm.id]: parseFloat(e.target.value) || 0 }))}
                    style={{ flex: 1, fontSize: 18, fontWeight: 700, padding: "6px 10px", border: "1.5px solid #fde68a", borderRadius: 8, outline: "none", color: "#1a3a2a" }} />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>/kg</span>
                </div>
              </div>
              <button onClick={() => handleDeleteCustomItem(itm.id)}
                style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: "#dc2626" }}
                title="Delete this item">🗑️</button>
            </div>
          ))}
        </>
      )}

      {/* Add New Item Button */}
      {!showAddForm ? (
        <button onClick={() => setShowAddForm(true)}
          style={{ width: "100%", marginTop: 8, padding: "14px", fontSize: 15, fontWeight: 700, background: "#fff", color: "#2d7a4f", border: "2px dashed #2d7a4f", borderRadius: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          ➕ Add New Item
        </button>
      ) : (
        <div style={{ background: "#f0fdf4", border: "2px solid #2d7a4f", borderRadius: 14, padding: "16px", marginTop: 8 }}>
          <div style={{ fontWeight: 700, color: "#1a3a2a", marginBottom: 14, fontSize: 14 }}>➕ Add New Item</div>

          {/* Icon picker */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Pick Icon</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EMOJI_OPTIONS.map(em => (
                <button key={em} onClick={() => setNewIcon(em)}
                  style={{ fontSize: 20, padding: "6px 8px", borderRadius: 8, border: newIcon === em ? "2px solid #2d7a4f" : "1.5px solid #e2e8f0", background: newIcon === em ? "#dcfce7" : "#fff", cursor: "pointer" }}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Item name */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Item Name</div>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Steel, Lead, Glass..."
              style={{ width: "100%", fontSize: 15, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Rate */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Rate (₨ per kg)</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, color: "#475569" }}>₨</span>
              <input type="number" step="0.01" value={newRate} onChange={e => setNewRate(e.target.value)} placeholder="0.00"
                style={{ flex: 1, fontSize: 18, fontWeight: 700, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, outline: "none", color: "#1a3a2a" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>/kg</span>
            </div>
          </div>

          {addError && <div style={{ color: "#dc2626", fontSize: 12, marginBottom: 10 }}>⚠️ {addError}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAddItem}
              style={{ flex: 1, padding: "12px", fontSize: 14, fontWeight: 700, background: "#2d7a4f", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" }}>
              ✅ Add Item
            </button>
            <button onClick={() => { setShowAddForm(false); setAddError(""); setNewName(""); setNewRate(""); setNewIcon("📦"); }}
              style={{ flex: 1, padding: "12px", fontSize: 14, fontWeight: 600, background: "#fff", color: "#64748b", border: "1.5px solid #e2e8f0", borderRadius: 10, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Save All */}
      <button onClick={handleSave}
        style={{ width: "100%", marginTop: 14, padding: "16px", fontSize: 16, fontWeight: 700, background: saved ? "#15803d" : "#2d7a4f", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer" }}>
        {saved ? "✅ Rates Updated!" : "💾 Save All Rates"}
      </button>

      <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        Default PIN: 1234 · Change it in the code for security
      </div>
    </div>
  );
}
