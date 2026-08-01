import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import * as store from "./storage.js";

const C = {
  bg: "#0E1014", panel: "#171A21", panel2: "#1E222B", border: "#2A2F3A",
  text: "#E8EAED", dim: "#868D9C", accent: "#2FE0C0",
  protein: "#FF5C6C", carb: "#F5A623", fat: "#7C8CF8",
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const ACTIVIDADES = [
  { v: 1.375, t: "Ligero (poco movimiento)" },
  { v: 1.55, t: "Moderado (3-5 días)" },
  { v: 1.6, t: "Entreno 5-6 días" },
  { v: 1.725, t: "Alto (6-7 días + trabajo activo)" },
];

const OBJETIVOS = [
  { v: "definir", t: "Perder grasa / definir", factor: 0.82, prot: 2.0 },
  { v: "mantener", t: "Mantener / recomponer", factor: 1.0, prot: 1.8 },
  { v: "ganar", t: "Ganar músculo", factor: 1.1, prot: 2.0 },
];

const MEALS = [
  { id: "des", nombre: "Desayuno", items: [
    { id: "d1", n: "Avena 80 g", kcal: 300, p: 10, c: 51, f: 6 },
    { id: "d2", n: "Leche desnatada 200 ml", kcal: 70, p: 7, c: 10, f: 0 },
    { id: "d3", n: "Plátano", kcal: 105, p: 1, c: 27, f: 0 },
    { id: "d4", n: "Proteína whey 30 g", kcal: 120, p: 24, c: 3, f: 2 },
  ]},
  { id: "mm", nombre: "Media mañana", items: [
    { id: "m1", n: "Yogur griego 0% 200 g", kcal: 120, p: 20, c: 8, f: 0 },
    { id: "m2", n: "Almendras 30 g", kcal: 180, p: 6, c: 6, f: 15 },
  ]},
  { id: "com", nombre: "Comida", items: [
    { id: "c1", n: "Pechuga de pollo 150 g", kcal: 247, p: 46, c: 0, f: 5 },
    { id: "c2", n: "Arroz 80 g (en seco)", kcal: 285, p: 6, c: 62, f: 1 },
    { id: "c3", n: "Verduras 200 g", kcal: 70, p: 5, c: 12, f: 0 },
    { id: "c4", n: "Aceite de oliva 10 g", kcal: 90, p: 0, c: 0, f: 10 },
  ]},
  { id: "mer", nombre: "Merienda (post-entreno)", items: [
    { id: "e1", n: "Pan integral 40 g", kcal: 100, p: 4, c: 18, f: 1 },
    { id: "e2", n: "Pavo 100 g", kcal: 110, p: 22, c: 0, f: 2 },
    { id: "e3", n: "Manzana", kcal: 80, p: 0, c: 21, f: 0 },
  ]},
  { id: "cen", nombre: "Cena", items: [
    { id: "n1", n: "Salmón 120 g", kcal: 220, p: 24, c: 0, f: 14 },
    { id: "n2", n: "Patata/boniato 200 g", kcal: 150, p: 3, c: 34, f: 0 },
    { id: "n3", n: "Ensalada + aceite 10 g", kcal: 110, p: 1, c: 4, f: 10 },
  ]},
];
const BASE_KCAL = 2357;

const TRAIN_BY_DAYS = {
  3: [
    { dia: "Día 1", foco: "Cuerpo completo A", ej: ["Sentadilla — 3×8", "Press banca — 3×8", "Remo con barra — 3×10", "Press militar — 3×10", "Curl + extensión tríceps — 2×12"] },
    { dia: "Día 2", foco: "Cuerpo completo B", ej: ["Peso muerto rumano — 3×8", "Press inclinado mancuerna — 3×10", "Jalón al pecho — 3×10", "Elevaciones laterales — 3×12", "Plancha — 3×30 s"] },
    { dia: "Día 3", foco: "Cuerpo completo C", ej: ["Prensa — 3×10", "Fondos / press cerrado — 3×10", "Dominadas / remo polea — 3×10", "Face pull — 3×15", "Curl martillo — 2×12"] },
  ],
  4: [
    { dia: "Día 1", foco: "Torso A", ej: ["Press banca — 4×8", "Remo con barra — 4×8", "Press militar — 3×10", "Jalón al pecho — 3×10", "Curl con barra — 3×12"] },
    { dia: "Día 2", foco: "Pierna A", ej: ["Sentadilla — 4×8", "Peso muerto rumano — 3×10", "Prensa — 3×12", "Femoral — 3×12", "Gemelos — 3×15"] },
    { dia: "Día 3", foco: "Torso B", ej: ["Press inclinado — 4×8", "Dominadas — 4×8", "Aperturas — 3×12", "Elevaciones laterales — 4×12", "Extensión tríceps — 3×12"] },
    { dia: "Día 4", foco: "Pierna B", ej: ["Prensa — 4×10", "Zancadas — 3×12", "Extensión cuádriceps — 3×12", "Femoral — 3×12", "Gemelos — 3×15"] },
  ],
  5: [
    { dia: "Día 1", foco: "Empuje", ej: ["Press banca — 4×8", "Press militar — 3×10", "Press inclinado — 3×10", "Elevaciones laterales — 3×12", "Extensión tríceps — 3×12"] },
    { dia: "Día 2", foco: "Tirón", ej: ["Dominadas — 4×8", "Remo con barra — 4×8", "Remo en polea — 3×10", "Face pull — 3×15", "Curl con barra — 3×12"] },
    { dia: "Día 3", foco: "Pierna", ej: ["Sentadilla — 4×8", "Peso muerto rumano — 3×10", "Prensa — 3×12", "Femoral — 3×12", "Gemelos — 4×15"] },
    { dia: "Día 4", foco: "Torso", ej: ["Press inclinado — 3×10", "Remo con mancuerna — 3×10", "Elevaciones laterales — 4×12", "Curl + extensión — 3×12"] },
    { dia: "Día 5", foco: "Pierna + core", ej: ["Zancadas — 3×12", "Prensa — 3×12", "Femoral — 3×12", "Gemelos — 3×15", "Core — 3×15"] },
  ],
  6: [
    { dia: "Lunes / Jueves", foco: "Pecho y tríceps", ej: ["Press banca con mancuernas — 4×8-10", "Press inclinado — 3×10-12", "Aperturas o pec-deck — 3×12-15", "Fondos / press cerrado — 3×10-12", "Extensión tríceps en polea — 3×12-15", "Press francés — 3×10-12"] },
    { dia: "Martes / Viernes", foco: "Espalda y bíceps", ej: ["Dominadas o jalón al pecho — 4×8-10", "Remo con barra — 4×8-10", "Remo en polea baja — 3×10-12", "Face pull o pull-over — 3×12-15", "Curl con barra — 3×10-12", "Curl martillo — 3×12-15"] },
    { dia: "Miércoles / Sábado", foco: "Pierna y hombro", ej: ["Sentadilla — 4×8-10", "Prensa — 3×10-12", "Peso muerto rumano — 3×10-12", "Femoral + cuádriceps — 3×12-15", "Press militar — 4×8-10", "Elevaciones laterales — 4×12-15"] },
  ],
};

function calcGoals(p) {
  const s = p.sexo === "mujer" ? -161 : 5;
  const bmr = 10 * p.peso + 6.25 * p.altura - 5 * p.edad + s;
  const tdee = bmr * p.actividad;
  const obj = OBJETIVOS.find((o) => o.v === p.objetivo) || OBJETIVOS[0];
  const kcal = Math.round((tdee * obj.factor) / 10) * 10;
  const prot = Math.round(p.peso * obj.prot);
  const fat = Math.round(p.peso * 0.8);
  const carb = Math.round((kcal - prot * 4 - fat * 9) / 4);
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, prot, carb, fat, obj };
}

function Ring({ value, target, color, label, unit, size = 96 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const over = value > target * 1.02;
  return (
    <div className="flex flex-col items-center">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth="7" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={over ? "#FF8A5C" : color}
            strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset .5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0 }} className="flex flex-col items-center justify-center">
          <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }} className="text-lg font-bold leading-none">{Math.round(value)}</span>
          <span style={{ color: C.dim }} className="text-[10px] mt-0.5">/ {Math.round(target)}{unit}</span>
        </div>
      </div>
      <span style={{ color }} className="text-xs font-semibold mt-2 uppercase tracking-wide">{label}</span>
    </div>
  );
}

const inp = { background: C.panel2, border: `1px solid ${C.border}`, color: C.text };

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className="rounded-lg px-3 py-2 text-sm font-medium"
      style={{ background: active ? C.accent : C.panel2, color: active ? C.bg : C.dim, border: `1px solid ${active ? C.accent : C.border}` }}>
      {children}
    </button>
  );
}

function Onboarding({ existing, onDone, onCancel }) {
  const [f, setF] = useState({ nombre: "", sexo: "hombre", edad: "", altura: "", peso: "", actividad: 1.6, objetivo: "definir", dias: 6 });
  const set = (k, v) => setF((o) => ({ ...o, [k]: v }));
  const valid = f.nombre.trim() && +f.edad > 0 && +f.altura > 0 && +f.peso > 0;
  const generar = () => onDone({
    id: "p" + Date.now(), nombre: f.nombre.trim(), sexo: f.sexo,
    edad: +f.edad, altura: +f.altura, peso: +f.peso,
    actividad: +f.actividad, objetivo: f.objetivo, dias: +f.dias,
  });

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
        <div>
          <div style={{ color: C.accent }} className="text-[11px] font-bold tracking-[0.2em] uppercase">Bienvenido</div>
          <h1 className="text-2xl font-bold mt-1">Vamos a crear tu plan</h1>
          <p style={{ color: C.dim }} className="text-sm mt-1">Unos datos y te genero dieta y entreno a medida.</p>
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 space-y-4">
          <div>
            <label style={{ color: C.dim }} className="text-sm block mb-1">Nombre</label>
            <input value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Tu nombre" style={inp} className="w-full rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label style={{ color: C.dim }} className="text-sm block mb-1">Sexo</label>
            <div className="grid grid-cols-2 gap-2">
              <Chip active={f.sexo === "hombre"} onClick={() => set("sexo", "hombre")}>Hombre</Chip>
              <Chip active={f.sexo === "mujer"} onClick={() => set("sexo", "mujer")}>Mujer</Chip>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[["edad", "Edad"], ["altura", "Altura (cm)"], ["peso", "Peso (kg)"]].map(([k, l]) => (
              <div key={k}>
                <label style={{ color: C.dim }} className="text-xs block mb-1">{l}</label>
                <input value={f[k]} onChange={(e) => set(k, e.target.value)} inputMode="decimal" style={inp} className="w-full rounded-lg px-2 py-2 text-sm text-center" />
              </div>
            ))}
          </div>

          <div>
            <label style={{ color: C.dim }} className="text-sm block mb-1">Nivel de actividad</label>
            <select value={f.actividad} onChange={(e) => set("actividad", +e.target.value)} style={inp} className="w-full rounded-lg px-3 py-2 text-sm">
              {ACTIVIDADES.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: C.dim }} className="text-sm block mb-1">Objetivo</label>
            <div className="space-y-2">
              {OBJETIVOS.map((o) => (
                <button key={o.v} onClick={() => set("objetivo", o.v)} className="w-full rounded-lg px-3 py-2 text-sm text-left font-medium"
                  style={{ background: f.objetivo === o.v ? C.accent : C.panel2, color: f.objetivo === o.v ? C.bg : C.text, border: `1px solid ${f.objetivo === o.v ? C.accent : C.border}` }}>
                  {o.t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ color: C.dim }} className="text-sm block mb-1">Días de entreno por semana</label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((d) => <Chip key={d} active={f.dias === d} onClick={() => set("dias", d)}>{d} días</Chip>)}
            </div>
          </div>
        </div>

        <button onClick={generar} disabled={!valid} className="w-full rounded-xl py-3 text-base font-bold"
          style={{ background: valid ? C.accent : C.panel2, color: valid ? C.bg : C.dim }}>
          Generar mi plan
        </button>
        {existing && <button onClick={onCancel} style={{ color: C.dim }} className="w-full text-sm py-1">Cancelar</button>}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("hoy");
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [readyP, setReadyP] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [log, setLog] = useState({ checked: {}, custom: [] });
  const [weights, setWeights] = useState([]);
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [cf, setCf] = useState({ n: "", kcal: "", p: "", c: "", f: "" });
  const day = todayKey();

  useEffect(() => {
    (async () => {
      const ps = (await store.get("profiles")) || [];
      const aid = await store.get("activeId");
      setProfiles(ps);
      setActiveId(aid && ps.find((p) => p.id === aid) ? aid : (ps[0]?.id ?? null));
      setReadyP(true);
    })();
  }, []);

  useEffect(() => {
    if (!activeId) { setWeights([]); setLog({ checked: {}, custom: [] }); return; }
    (async () => {
      setWeights((await store.get(`weights:${activeId}`)) || []);
      setLog((await store.get(`log:${activeId}:${day}`)) || { checked: {}, custom: [] });
    })();
  }, [activeId, day]);

  const active = profiles.find((p) => p.id === activeId) || null;
  const goals = useMemo(() => (active ? calcGoals(active) : null), [active]);

  const saveProfiles = (arr) => { setProfiles(arr); store.set("profiles", arr); };
  const updateActive = (patch) => saveProfiles(profiles.map((p) => (p.id === activeId ? { ...p, ...patch } : p)));
  const saveLog = (nl) => { setLog(nl); store.set(`log:${activeId}:${day}`, nl); };

  const onOnboardDone = (np) => {
    saveProfiles([...profiles, np]);
    setActiveId(np.id); store.set("activeId", np.id);
    setShowOnboarding(false); setTab("hoy");
  };
  const switchProfile = (id) => { setActiveId(id); store.set("activeId", id); };
  const borrarActive = () => {
    if (!window.confirm(`¿Eliminar el perfil de ${active.nombre}? Se borran sus datos.`)) return;
    store.remove(`weights:${activeId}`); store.remove(`log:${activeId}:${day}`);
    const arr = profiles.filter((p) => p.id !== activeId);
    saveProfiles(arr);
    const next = arr[0]?.id ?? null;
    setActiveId(next); store.set("activeId", next || "");
  };

  const eaten = useMemo(() => {
    let k = 0, p = 0, c = 0, f = 0;
    MEALS.forEach((m) => m.items.forEach((it) => { if (log.checked[it.id]) { k += it.kcal; p += it.p; c += it.c; f += it.f; } }));
    log.custom.forEach((it) => { k += it.kcal; p += it.p; c += it.c; f += it.f; });
    return { k, p, c, f };
  }, [log]);

  const toggle = (id) => saveLog({ ...log, checked: { ...log.checked, [id]: !log.checked[id] } });
  const addCustom = () => {
    if (!cf.n) return;
    saveLog({ ...log, custom: [...log.custom, { id: "cust" + Date.now(), n: cf.n, kcal: +cf.kcal || 0, p: +cf.p || 0, c: +cf.c || 0, f: +cf.f || 0 }] });
    setCf({ n: "", kcal: "", p: "", c: "", f: "" });
  };
  const delCustom = (id) => saveLog({ ...log, custom: log.custom.filter((i) => i.id !== id) });
  const addPeso = () => {
    const kg = parseFloat(nuevoPeso.replace(",", "."));
    if (!kg) return;
    const nw = [...weights.filter((x) => x.date !== day), { date: day, kg }].sort((a, b) => a.date.localeCompare(b.date));
    setWeights(nw); store.set(`weights:${activeId}`, nw);
    updateActive({ peso: kg });
    setNuevoPeso("");
  };

  if (!readyP) return <div style={{ background: C.bg, color: C.dim }} className="min-h-screen flex items-center justify-center">Cargando…</div>;
  if (showOnboarding || !active)
    return <Onboarding existing={profiles.length > 0} onDone={onOnboardDone} onCancel={() => setShowOnboarding(false)} />;

  const restante = Math.max(goals.kcal - eaten.k, 0);
  const factor = goals.kcal / BASE_KCAL;
  const train = TRAIN_BY_DAYS[active.dias] || TRAIN_BY_DAYS[6];
  const tabs = [["hoy", "Hoy"], ["dieta", "Dieta"], ["progreso", "Progreso"], ["entreno", "Entreno"], ["perfil", "Perfil"]];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
        <header className="mb-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div style={{ color: C.accent }} className="text-[11px] font-bold tracking-[0.2em] uppercase">{goals.obj.t}</div>
              <h1 className="text-2xl font-bold mt-1" style={{ letterSpacing: "-0.02em" }}>Plan de {active.nombre}</h1>
            </div>
            <div className="flex items-center gap-2">
              {profiles.length > 1 && (
                <select value={activeId} onChange={(e) => switchProfile(e.target.value)} style={inp} className="rounded-lg px-2 py-1.5 text-xs">
                  {profiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              )}
              <button onClick={() => setShowOnboarding(true)} title="Añadir persona"
                style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.accent }} className="rounded-lg w-8 h-8 text-lg font-bold leading-none">+</button>
            </div>
          </div>
          <p style={{ color: C.dim }} className="text-xs mt-2">{day} · Objetivo {goals.kcal} kcal</p>
        </header>

        {tab === "hoy" && (
          <div className="space-y-5">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-5">
              <div className="grid grid-cols-4 gap-1">
                <Ring value={eaten.k} target={goals.kcal} color={C.accent} label="kcal" unit="" />
                <Ring value={eaten.p} target={goals.prot} color={C.protein} label="Prot" unit="g" />
                <Ring value={eaten.c} target={goals.carb} color={C.carb} label="Carb" unit="g" />
                <Ring value={eaten.f} target={goals.fat} color={C.fat} label="Grasa" unit="g" />
              </div>
              <div style={{ borderTop: `1px solid ${C.border}` }} className="mt-4 pt-3 flex justify-between text-sm">
                <span style={{ color: C.dim }}>Te quedan hoy</span>
                <span className="font-bold" style={{ color: restante > 0 ? C.accent : "#FF8A5C", fontVariantNumeric: "tabular-nums" }}>{restante} kcal</span>
              </div>
            </div>

            {MEALS.map((m) => (
              <div key={m.id} style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
                <div className="text-sm font-semibold mb-2">{m.nombre}</div>
                <div className="space-y-1.5">
                  {m.items.map((it) => {
                    const on = !!log.checked[it.id];
                    return (
                      <button key={it.id} onClick={() => toggle(it.id)} className="w-full flex items-center gap-3 text-left rounded-lg px-2 py-1.5" style={{ background: on ? C.panel2 : "transparent" }}>
                        <span className="flex items-center justify-center rounded-md flex-shrink-0" style={{ width: 20, height: 20, border: `1.5px solid ${on ? C.accent : C.border}`, background: on ? C.accent : "transparent" }}>
                          {on && <span style={{ color: C.bg }} className="text-xs font-bold">✓</span>}
                        </span>
                        <span className="flex-1 text-sm" style={{ color: on ? C.text : C.dim }}>{it.n}</span>
                        <span style={{ color: C.dim, fontVariantNumeric: "tabular-nums" }} className="text-xs">{it.kcal} kcal</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <div className="text-sm font-semibold mb-2">Añadir algo extra</div>
              {log.custom.map((it) => (
                <div key={it.id} className="flex items-center gap-2 py-1 text-sm">
                  <span className="flex-1">{it.n}</span>
                  <span style={{ color: C.dim }} className="text-xs">{it.kcal} kcal</span>
                  <button onClick={() => delCustom(it.id)} style={{ color: C.dim }} className="text-xs px-1">✕</button>
                </div>
              ))}
              <div className="mt-2 space-y-2">
                <input value={cf.n} onChange={(e) => setCf({ ...cf, n: e.target.value })} placeholder="Alimento" style={inp} className="w-full rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-4 gap-2">
                  {[["kcal", "kcal"], ["p", "P"], ["c", "C"], ["f", "G"]].map(([k, ph]) => (
                    <input key={k} value={cf[k]} onChange={(e) => setCf({ ...cf, [k]: e.target.value })} placeholder={ph} inputMode="numeric" style={inp} className="rounded-lg px-2 py-2 text-sm text-center" />
                  ))}
                </div>
                <button onClick={addCustom} style={{ background: C.accent, color: C.bg }} className="w-full rounded-lg py-2 text-sm font-semibold">Añadir</button>
              </div>
            </div>
          </div>
        )}

        {tab === "dieta" && (
          <div className="space-y-4">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3">Objetivos diarios de {active.nombre}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[["Calorías", `${goals.kcal} kcal`, C.accent], ["Proteína", `${goals.prot} g`, C.protein], ["Carbohidratos", `${goals.carb} g`, C.carb], ["Grasa", `${goals.fat} g`, C.fat]].map(([l, v, col]) => (
                  <div key={l} style={{ background: C.panel2 }} className="rounded-xl p-3">
                    <div style={{ color: C.dim }} className="text-xs">{l}</div>
                    <div style={{ color: col }} className="text-lg font-bold">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.panel2, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <p style={{ color: C.dim }} className="text-xs leading-relaxed">
                La plantilla de abajo está calibrada a ~{BASE_KCAL} kcal. El objetivo de {active.nombre} son {goals.kcal} kcal, así que
                <b style={{ color: C.text }}> multiplica las cantidades por ~{factor.toFixed(2)}</b> (o quita/añade una toma). Puedes intercambiar alimentos por otros de macros parecidos.
              </p>
            </div>

            {MEALS.map((m) => {
              const tot = m.items.reduce((a, it) => ({ k: a.k + it.kcal, p: a.p + it.p, c: a.c + it.c, f: a.f + it.f }), { k: 0, p: 0, c: 0, f: 0 });
              return (
                <div key={m.id} style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-sm font-semibold">{m.nombre}</span>
                    <span style={{ color: C.dim }} className="text-xs">{tot.k} kcal · {tot.p}P {tot.c}C {tot.f}G</span>
                  </div>
                  {m.items.map((it) => <div key={it.id} className="text-sm py-0.5" style={{ color: C.dim }}>{it.n}</div>)}
                </div>
              );
            })}
          </div>
        )}

        {tab === "progreso" && (
          <div className="space-y-4">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <div className="text-sm font-semibold mb-1">Registrar peso de hoy</div>
              <div className="flex gap-2 mt-2">
                <input value={nuevoPeso} onChange={(e) => setNuevoPeso(e.target.value)} placeholder="kg" inputMode="decimal" style={inp} className="flex-1 rounded-lg px-3 py-2 text-sm" />
                <button onClick={addPeso} style={{ background: C.accent, color: C.bg }} className="rounded-lg px-5 text-sm font-semibold">Guardar</button>
              </div>
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <div className="text-sm font-semibold mb-3">Evolución del peso</div>
              {weights.length < 2 ? (
                <p style={{ color: C.dim }} className="text-sm py-8 text-center">Registra tu peso unos días para ver la tendencia.</p>
              ) : (
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weights} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fill: C.dim, fontSize: 10 }} tickFormatter={(d) => d.slice(5)} stroke={C.border} />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fill: C.dim, fontSize: 10 }} stroke={C.border} />
                      <Tooltip contentStyle={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text }} labelStyle={{ color: C.dim }} />
                      <Line type="monotone" dataKey="kg" stroke={C.accent} strokeWidth={2.5} dot={{ r: 3, fill: C.accent }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {weights.length >= 2 && (
                <div style={{ borderTop: `1px solid ${C.border}` }} className="mt-3 pt-3 flex justify-between text-sm">
                  <span style={{ color: C.dim }}>Cambio total</span>
                  <span className="font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>{(weights[weights.length - 1].kg - weights[0].kg).toFixed(1)} kg</span>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "entreno" && (
          <div className="space-y-4">
            <div style={{ background: C.panel2, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <p style={{ color: C.text }} className="text-sm leading-relaxed">
                Rutina de <b>{active.dias} días</b>. La definición viene del déficit + proteína alta manteniendo la fuerza: busca <b style={{ color: C.accent }}>progresar en cargas</b>. Calentamiento antes, estiramientos estáticos después.
              </p>
            </div>
            {train.map((t, i) => (
              <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
                <div style={{ color: C.dim }} className="text-[11px] uppercase tracking-wide">{t.dia}</div>
                <div className="text-base font-bold mb-2">{t.foco}</div>
                <ul className="space-y-1">
                  {t.ej.map((e, j) => <li key={j} className="text-sm flex gap-2"><span style={{ color: C.accent }}>·</span><span>{e}</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === "perfil" && (
          <div className="space-y-4">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label style={{ color: C.dim }} className="text-sm">Nombre</label>
                <input value={active.nombre} onChange={(e) => updateActive({ nombre: e.target.value })} style={inp} className="w-40 rounded-lg px-3 py-2 text-sm text-right" />
              </div>
              {[["edad", "Edad", "años"], ["altura", "Altura", "cm"], ["peso", "Peso", "kg"]].map(([k, l, u]) => (
                <div key={k} className="flex items-center justify-between">
                  <label style={{ color: C.dim }} className="text-sm">{l}</label>
                  <div className="flex items-center gap-2">
                    <input value={active[k]} onChange={(e) => updateActive({ [k]: +e.target.value || 0 })} inputMode="decimal" style={inp} className="w-20 rounded-lg px-3 py-2 text-sm text-right" />
                    <span style={{ color: C.dim }} className="text-xs w-8">{u}</span>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ color: C.dim }} className="text-sm block mb-1">Actividad</label>
                <select value={active.actividad} onChange={(e) => updateActive({ actividad: +e.target.value })} style={inp} className="w-full rounded-lg px-3 py-2 text-sm">
                  {ACTIVIDADES.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: C.dim }} className="text-sm block mb-1">Objetivo</label>
                <select value={active.objetivo} onChange={(e) => updateActive({ objetivo: e.target.value })} style={inp} className="w-full rounded-lg px-3 py-2 text-sm">
                  {OBJETIVOS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: C.dim }} className="text-sm block mb-1">Días de entreno</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((d) => <Chip key={d} active={active.dias === d} onClick={() => updateActive({ dias: d })}>{d} días</Chip>)}
                </div>
              </div>
            </div>

            <div style={{ background: C.panel2, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span style={{ color: C.dim }}>Metabolismo basal (BMR)</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{goals.bmr} kcal</span></div>
              <div className="flex justify-between"><span style={{ color: C.dim }}>Gasto total (TDEE)</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{goals.tdee} kcal</span></div>
              <div className="flex justify-between font-semibold"><span>Objetivo</span><span style={{ color: C.accent, fontVariantNumeric: "tabular-nums" }}>{goals.kcal} kcal</span></div>
            </div>

            <button onClick={() => setShowOnboarding(true)} style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} className="w-full rounded-xl py-2.5 text-sm font-semibold">+ Añadir otra persona</button>
            <button onClick={borrarActive} style={{ color: "#FF8A5C" }} className="w-full text-xs py-1">Eliminar este perfil</button>
          </div>
        )}
      </div>

      <nav style={{ background: C.panel, borderTop: `1px solid ${C.border}` }} className="fixed bottom-0 left-0 right-0">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="flex-1 py-3 text-xs font-medium" style={{ color: tab === k ? C.accent : C.dim, borderTop: tab === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>{l}</button>
          ))}
        </div>
      </nav>
    </div>
  );
}
