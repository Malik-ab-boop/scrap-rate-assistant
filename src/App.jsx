import { useState, useEffect, useMemo } from "react";

const ITEMS = [
  { id: "iron", name: "Iron", icon: "⚙️", defaultRate: 35 },
  { id: "copper", name: "Copper", icon: "🔶", defaultRate: 850 },
  { id: "aluminum", name: "Aluminum", icon: "🪙", defaultRate: 150 },
  { id: "brass", name: "Brass", icon: "🟡", defaultRate: 500 },
  { id: "plastic", name: "Plastic", icon: "♻️", defaultRate: 25 },
  { id: "batteries", name: "Batteries", icon: "🔋", defaultRate: 80 },
];

const DEFAULT_RATES = Object.fromEntries(ITEMS.map((i) => [i.id, i.defaultRate]));

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

function fmt(n) { return Number(n).toLocaleString("en-PK"); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

const NAV = [
  { id: "dashboard", label: "Rates", icon: "📊" },
  { id: "calc", label: "Calculate", icon: "🧮" },
  { id: "history", label: "History", icon: "📋" },
  { id: "admin", label: "Admin", icon: "🔐" },
];

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [rates, setRates] = useLocalStorage("sra_rates", DEFAULT_RATES);
  const [transactions, setTransactions] = useLocalStorage("sra_tx", []);
  // ✅ FIX: persist custom items added via Admin
  const [customItems, setCustomItems] = useLocalStorage("sra_custom_items", []);

  function addTransaction(tx) {
    setTransactions((prev) => [{ ...tx, id: Date.now(), date: todayStr() }, ...prev]);
  }

  function deleteTransaction(id) {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", background: "#f0f4f8", minHeight: "100vh", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#1a3a2a", padding: "16px 20px 12px", color: "#fff" }}>
        <div style={{ fontSize: 11, color: "#7ecba0", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>Scrap Rate</div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Assistant</div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
        {tab === "dashboard" && <Dashboard rates={rates} customItems={customItems} />}
        {tab === "calc" && <Calculator rates={rates} customItems={customItems} onSave={addTransaction} />}
        {tab === "history" && <History transactions={transactions} onDelete={deleteTransaction} />}
        {tab === "admin" && <Admin rates={rates} setRates={setRates} customItems={customItems} setCustomItems={setCustomItems} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex" }}>
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setTab(n.id)}
            style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
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
function Dashboard({ rates, customItems }) {
  const [lookup, setLookup] = useState(null);
  const allItems = [...ITEMS, ...customItems];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#1a3a2a" }}>Today's Rates</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}</div>
        </div>
        <div style={{ fontSize: 11, background: "#dcfce7", color: "#166534", padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>PKR / kg</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {allItems.map((item) => (
          <div key={item.id} onClick={() => setLookup(lookup === item.id ? null : item.id)}
            style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", border: lookup === item.id ? "2px solid #2d7a4f" : "1.5px solid #e2e8f0", cursor: "pointer" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 2 }}>{item.name}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#1a3a2a" }}>{fmt(rates[item.id] ?? item.defaultRate)}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>per kg</div>
          </div>
        ))}
      </div>

      {lookup && (
        <div style={{ background: "#1a3a2a", color: "#fff", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#7ecba0", marginBottom: 4 }}>Current Rate</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }}>₨ {fmt(rates[lookup] ?? allItems.find(i => i.id === lookup)?.defaultRate)}</div>
          <div style={{ fontSize: 14, color: "#a7f3d0", marginTop: 2 }}>per kg of {allItems.find(i => i.id === lookup)?.name}</div>
        </div>
      )}

      <div style={{ background: "#fff8ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>
        💡 Tap any card to quickly check rate while dealing with a customer
      </div>
    </div>
  );
}

// ─── Calculator ──────────────────────────────────────────────────────────────
function newRow() {
  return { id: Date.now() + Math.random(), itemId: "iron", weight: "", discount: 0 };
}

function Calculator({ rates, customItems, onSave }) {
  const [custName, setCustName] = useState("");
  const [rows, setRows] = useState([newRow()]);
  const [sellRates, setSellRates] = useState({});
  const [saved, setSaved] = useState(false);

  const allItems = [...ITEMS, ...customItems];

  function updateRow(id, field, value) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function addRow() {
    setRows(prev => [...prev, newRow()]);
  }

  function removeRow(id) {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  }

  const rowCalcs = rows.map(r => {
    const rate = rates[r.itemId] || 0;
    const gross = parseFloat(r.weight || 0) * rate;
    const discountAmt = (gross * r.discount) / 100;
    const total = Math.round(gross - discountAmt);
    const sell = parseFloat(sellRates[r.itemId] || 0);
    const profit = sell ? Math.round((sell - rate) * parseFloat(r.weight || 0)) : null;
    return { rate, gross, discountAmt, total, profit };
  });

  const grandTotal = rowCalcs.reduce((s, c) => s + c.total, 0);
  const grandProfit = rowCalcs.every(c => c.profit !== null)
    ? rowCalcs.reduce((s, c) => s + (c.profit || 0), 0)
    : null;

  function handleSave() {
    const validRows = rows.filter((r, i) => r.weight && rowCalcs[i].total > 0);
    if (validRows.length === 0) return;
    const items = validRows.map((r, i) => ({
      itemId: r.itemId,
      itemName: allItems.find(it => it.id === r.itemId)?.name,
      weight: parseFloat(r.weight),
      rate: rates[r.itemId],
      discount: r.discount,
      total: rowCalcs[rows.indexOf(r)].total,
    }));
    onSave({ customerName: custName || "Walk-in", items, grandTotal });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setRows([newRow()]);
      setCustName("");
      setSellRates({});
    }, 1800);
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 17, color: "#1a3a2a", marginBottom: 14 }}>Purchase Calculator</div>

      {/* Customer Name */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Customer Name (Optional)</div>
        <input type="text" value={custName} onChange={e => setCustName(e.target.value)} placeholder="Walk-in customer"
          style={{ width: "100%", fontSize: 15, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Item Rows */}
      {rows.map((row, idx) => {
        const calc = rowCalcs[idx];
        const itm = allItems.find(i => i.id === row.itemId);
        return (
          <div key={row.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: 14, marginBottom: 12, position: "relative" }}>

            {/* Row Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a3a2a" }}>Item {idx + 1}</div>
              {rows.length > 1 && (
                <button onClick={() => removeRow(row.id)}
                  style={{ background: "#fef2f2", border: "none", color: "#dc2626", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  ✕ Remove
                </button>
              )}
            </div>

            {/* Item Select */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              {allItems.map((i) => (
                <button key={i.id} onClick={() => updateRow(row.id, "itemId", i.id)}
                  style={{ padding: "8px 4px", borderRadius: 8, border: row.itemId === i.id ? "2px solid #2d7a4f" : "1.5px solid #e2e8f0", background: row.itemId === i.id ? "#f0fdf4" : "#f8fafc", cursor: "pointer", fontSize: 11, fontWeight: row.itemId === i.id ? 700 : 400, color: row.itemId === i.id ? "#1a3a2a" : "#475569" }}>
                  <div style={{ fontSize: 16 }}>{i.icon}</div>
                  {i.name}
                </button>
              ))}
            </div>

            {/* Rate */}
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "8px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#166534" }}>Rate</span>
              <span style={{ fontWeight: 700, color: "#1a3a2a" }}>₨ {fmt(calc.rate)} / kg</span>
            </div>

            {/* Weight */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>WEIGHT (KG)</div>
              <input type="number" value={row.weight} onChange={e => updateRow(row.id, "weight", e.target.value)} placeholder="Enter kg"
                style={{ width: "100%", fontSize: 18, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box", fontWeight: 600 }} />
            </div>

            {/* Discount */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
                DISCOUNT — <span style={{ color: "#d97706" }}>{row.discount}%</span>
                {row.discount > 0 && <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: 6 }}>(-₨{fmt(Math.round(calc.discountAmt))})</span>}
              </div>
              <input type="range" min="0" max="30" value={row.discount} onChange={e => updateRow(row.id, "discount", Number(e.target.value))}
                style={{ width: "100%", accentColor: "#2d7a4f" }} />
            </div>

            {/* Sell Rate for Profit */}
            <div style={{ marginBottom: row.weight ? 10 : 0 }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>SELLING RATE (OPTIONAL)</div>
              <input type="number" value={sellRates[row.itemId] || ""} onChange={e => setSellRates(p => ({ ...p, [row.itemId]: e.target.value }))} placeholder="₨ per kg to estimate profit"
                style={{ width: "100%", fontSize: 14, padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
            </div>

            {/* Row Total */}
            {row.weight && (
              <div style={{ marginTop: 10, background: "#f8fafc", borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{itm?.name} subtotal</div>
                  {calc.profit !== null && (
                    <div style={{ fontSize: 11, color: calc.profit >= 0 ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      Profit: {calc.profit >= 0 ? "+" : ""}₨{fmt(calc.profit)}
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1a3a2a" }}>₨ {fmt(calc.total)}</div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Item Button */}
      <button onClick={addRow}
        style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, background: "#f0fdf4", color: "#2d7a4f", border: "2px dashed #86efac", borderRadius: 12, cursor: "pointer", marginBottom: 14 }}>
        ＋ Add Another Item
      </button>

      {/* Grand Total */}
      {rows.some((r, i) => r.weight && rowCalcs[i].total > 0) && (
        <div style={{ background: "#1a3a2a", color: "#fff", borderRadius: 16, padding: "20px", marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#7ecba0", marginBottom: 4 }}>
            Grand Total — {custName || "Walk-in"} ({rows.filter((r, i) => r.weight && rowCalcs[i].total > 0).length} item{rows.filter((r, i) => r.weight && rowCalcs[i].total > 0).length > 1 ? "s" : ""})
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>₨ {fmt(grandTotal)}</div>
          {grandProfit !== null && (
            <div style={{ fontSize: 14, color: grandProfit >= 0 ? "#86efac" : "#fca5a5", marginTop: 6, fontWeight: 600 }}>
              Total Profit Estimate: {grandProfit >= 0 ? "+" : ""}₨ {fmt(grandProfit)}
            </div>
          )}

          {/* Bill Breakdown */}
          <div style={{ marginTop: 14, borderTop: "1px solid #2d5a3d", paddingTop: 12 }}>
            {rows.map((r, i) => {
              const calc = rowCalcs[i];
              if (!r.weight || calc.total <= 0) return null;
              const itm = allItems.find(it => it.id === r.itemId);
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: "#a7f3d0" }}>{itm?.icon} {itm?.name} ({r.weight}kg)</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>₨{fmt(calc.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button onClick={handleSave} disabled={saved}
        style={{ width: "100%", padding: "16px", fontSize: 16, fontWeight: 700, background: saved ? "#15803d" : "#2d7a4f", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer" }}>
        {saved ? "✅ Bill Saved!" : "💾 Save Complete Bill"}
      </button>
    </div>
  );
}

// ─── History ─────────────────────────────────────────────────────────────────
function History({ transactions, onDelete }) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const itemNames = (tx.items || []).map(i => i.itemName?.toLowerCase()).join(" ");
      const legacy = tx.item || "";
      const matchSearch = !search ||
        itemNames.includes(search.toLowerCase()) ||
        legacy.toLowerCase().includes(search.toLowerCase()) ||
        (tx.customerName || "").toLowerCase().includes(search.toLowerCase());
      const matchDate = !dateFilter || tx.date === dateFilter;
      return matchSearch && matchDate;
    });
  }, [transactions, search, dateFilter]);

  const totalSpent = filtered.reduce((s, tx) => s + (tx.grandTotal || tx.total || 0), 0);

  function handleDelete(id) {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  }

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
        filtered.map((tx) => {
          const isMulti = tx.items && tx.items.length > 0;
          const total = tx.grandTotal || tx.total || 0;
          const isConfirming = confirmDelete === tx.id;

          return (
            <div key={tx.id} style={{ background: "#fff", border: `1.5px solid ${isConfirming ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>

              {/* Header Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1a3a2a", fontSize: 15 }}>{tx.customerName || "Walk-in"}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{tx.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: "#1a3a2a" }}>₨ {fmt(total)}</div>
                </div>
              </div>

              {/* Items */}
              {isMulti ? (
                <div style={{ marginBottom: 10 }}>
                  {tx.items.map((item, idx) => {
                    const itm = [...ITEMS].find(i => i.id === item.itemId);
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: idx < tx.items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 16 }}>{itm?.icon || "📦"}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a3a2a" }}>{item.itemName}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{item.weight}kg × ₨{fmt(item.rate)}{item.discount > 0 ? ` − ${item.discount}%` : ""}</div>
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1a3a2a" }}>₨{fmt(item.total)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 99 }}>{tx.item}</span>
                  <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 99 }}>{tx.weight}kg</span>
                  <span style={{ fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 8px", borderRadius: 99 }}>₨{fmt(tx.rate)}/kg</span>
                  {tx.discount > 0 && <span style={{ fontSize: 11, background: "#fef9c3", color: "#854d0e", padding: "3px 8px", borderRadius: 99 }}>{tx.discount}% off</span>}
                </div>
              )}

              {/* Delete Button */}
              <button onClick={() => handleDelete(tx.id)}
                style={{ width: "100%", padding: "8px", fontSize: 13, fontWeight: 600, background: isConfirming ? "#dc2626" : "#fef2f2", color: isConfirming ? "#fff" : "#dc2626", border: `1px solid ${isConfirming ? "#dc2626" : "#fecaca"}`, borderRadius: 8, cursor: "pointer" }}>
                {isConfirming ? "⚠️ Tap again to confirm delete" : "🗑️ Delete"}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Admin ───────────────────────────────────────────────────────────────────
function Admin({ rates, setRates, customItems, setCustomItems }) {
  const [pin, setPin] = useState("");
  const [auth, setAuth] = useState(false);
  const [draft, setDraft] = useState({ ...rates });
  const [saved, setSaved] = useState(false);
  const [wrongPin, setWrongPin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", icon: "📦", rate: "" });
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const ADMIN_PIN = "1234";

  const ICONS = ["📦", "🔩", "🪝", "🧲", "⚡", "🛢️", "🔧", "🪜", "🏗️", "♻️", "🧱", "💡"];

  function handlePin() {
    if (pin === ADMIN_PIN) { setAuth(true); setDraft({ ...rates }); setWrongPin(false); }
    else { setWrongPin(true); setPin(""); }
  }

  function handleSave() {
    setRates({ ...draft });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAddItem() {
    if (!newItem.name.trim() || !newItem.rate) return;
    const id = "custom_" + newItem.name.trim().toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const item = { id, name: newItem.name.trim(), icon: newItem.icon, defaultRate: Number(newItem.rate) };
    setCustomItems(prev => [...prev, item]);
    setDraft(d => ({ ...d, [id]: Number(newItem.rate) }));
    setNewItem({ name: "", icon: "📦", rate: "" });
    setShowAddForm(false);
  }

  function handleDeleteCustomItem(id) {
    if (confirmDeleteItem === id) {
      setCustomItems(prev => prev.filter(i => i.id !== id));
      setDraft(d => { const copy = { ...d }; delete copy[id]; return copy; });
      setConfirmDeleteItem(null);
    } else {
      setConfirmDeleteItem(id);
      setTimeout(() => setConfirmDeleteItem(null), 3000);
    }
  }

  const allItems = [...ITEMS, ...customItems];

  if (!auth) return (
    <div style={{ padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
      <div style={{ fontSize: 48 }}>🔐</div>
      <div style={{ fontWeight: 700, fontSize: 18, color: "#1a3a2a" }}>Admin Access</div>
      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>Enter PIN to edit rates<br />(Default: 1234)</div>
      <input type="password" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handlePin()} placeholder="Enter PIN"
        style={{ fontSize: 24, textAlign: "center", letterSpacing: 8, padding: "12px 20px", border: `2px solid ${wrongPin ? "#ef4444" : "#e2e8f0"}`, borderRadius: 12, outline: "none", width: 160 }} />
      {wrongPin && <div style={{ color: "#dc2626", fontSize: 13 }}>Wrong PIN. Try again.</div>}
      <button onClick={handlePin}
        style={{ background: "#2d7a4f", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 700, cursor: "pointer", width: "100%" }}>
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

      {allItems.map((itm) => {
        const isCustom = itm.id.startsWith("custom_");
        const isConfirming = confirmDeleteItem === itm.id;
        return (
          <div key={itm.id} style={{ background: "#fff", border: `1.5px solid ${isConfirming ? "#fca5a5" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{itm.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{ fontWeight: 600, color: "#1a3a2a" }}>{itm.name}</div>
                  {isCustom && <span style={{ fontSize: 10, background: "#ede9fe", color: "#6d28d9", padding: "1px 7px", borderRadius: 99, fontWeight: 600 }}>Custom</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "#475569" }}>₨</span>
                  <input type="number" value={draft[itm.id] ?? itm.defaultRate}
                    onChange={e => setDraft(d => ({ ...d, [itm.id]: Number(e.target.value) }))}
                    style={{ flex: 1, fontSize: 18, fontWeight: 700, padding: "6px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", color: "#1a3a2a" }} />
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>/kg</span>
                </div>
              </div>
              {isCustom && (
                <button onClick={() => handleDeleteCustomItem(itm.id)}
                  style={{ background: isConfirming ? "#dc2626" : "#fef2f2", border: "none", color: isConfirming ? "#fff" : "#dc2626", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {isConfirming ? "⚠️ Sure?" : "🗑️"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* ✅ FIX: Add New Item Rate button & form */}
      {showAddForm ? (
        <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a3a2a", marginBottom: 12 }}>➕ New Item</div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>ITEM NAME</div>
            <input type="text" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Steel, Rubber..."
              style={{ width: "100%", fontSize: 15, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>ICON</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setNewItem(p => ({ ...p, icon: ic }))}
                  style={{ fontSize: 20, padding: "6px 10px", borderRadius: 8, border: newItem.icon === ic ? "2px solid #2d7a4f" : "1.5px solid #e2e8f0", background: newItem.icon === ic ? "#dcfce7" : "#fff", cursor: "pointer" }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>RATE (₨ per kg)</div>
            <input type="number" value={newItem.rate} onChange={e => setNewItem(p => ({ ...p, rate: e.target.value }))} placeholder="Enter rate"
              style={{ width: "100%", fontSize: 18, fontWeight: 700, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAddItem}
              style={{ flex: 1, padding: "12px", fontSize: 14, fontWeight: 700, background: "#2d7a4f", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" }}>
              ✅ Add Item
            </button>
            <button onClick={() => { setShowAddForm(false); setNewItem({ name: "", icon: "📦", rate: "" }); }}
              style={{ flex: 1, padding: "12px", fontSize: 14, fontWeight: 600, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 10, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddForm(true)}
          style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, background: "#f0fdf4", color: "#2d7a4f", border: "2px dashed #86efac", borderRadius: 12, cursor: "pointer", marginBottom: 12 }}>
          ➕ Add New Item Rate
        </button>
      )}

      <button onClick={handleSave}
        style={{ width: "100%", marginTop: 4, padding: "16px", fontSize: 16, fontWeight: 700, background: saved ? "#15803d" : "#2d7a4f", color: "#fff", border: "none", borderRadius: 14, cursor: "pointer" }}>
        {saved ? "✅ Rates Updated!" : "💾 Save All Rates"}
      </button>

      <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
        Default PIN: 1234 · Change it in the code for security
      </div>
    </div>
  );
}
