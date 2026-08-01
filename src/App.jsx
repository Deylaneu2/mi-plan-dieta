import React, { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import * as store from "./storage.js";

/* ---------- Paleta (lenguaje de macros como firma visual) ---------- */
const C = {
  bg: "#0E1014",
  panel: "#171A21",
  panel2: "#1E222B",
  border: "#2A2F3A",
  text: "#E8EAED",
  dim: "#868D9C",
  accent: "#2FE0C0",
  protein: "#FF5C6C",
  carb: "#F5A623",
  fat: "#7C8CF8",
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const DEFAULT_PROFILE = {
  edad: 24, altura: 175, peso: 78, sexo: "hombre",
  actividad: 1.6, deficit: 0.18,
};

const ACTIVIDADES = [
  { v: 1.375, t: "Ligero (poco movimiento)" },
  { v: 1.55, t: "Moderado (3-5 días)" },
  { v: 1.6, t: "Entreno 5-6 días" },
  { v: 1.725, t: "Alto (6-7 días + trabajo activo)" },
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

const TRAIN = [
  { dia: "Lunes / Jueves", foco: "Pecho y tríceps", ej: [
    "Press banca con mancuernas — 4×8-10",
    "Press inclinado — 3×10-12",
    "Aperturas o pec-deck — 3×12-15",
    "Fondos en paralelas / press cerrado — 3×10-12",
    "Extensión tríceps en polea — 3×12-15",
    "Press francés — 3×10-12",
  ]},
  { dia: "Martes / Viernes", foco: "Espalda y bíceps", ej: [
    "Dominadas o jalón al pecho — 4×8-10",
    "Remo con barra — 4×8-10",
    "Remo en polea baja — 3×10-12",
    "Face pull o pull-over — 3×12-15",
    "Curl con barra — 3×10-12",
    "Curl martillo — 3×12-15",
  ]},
  { dia: "Miércoles / Sábado", foco: "Pierna y hombro", ej: [
    "Sentadilla — 4×8-10",
    "Prensa — 3×10-12",
    "Peso muerto rumano — 3×10-12",
    "Femoral + cuádriceps en máquina — 3×12-15",
    "Press militar — 4×8-10",
    "Elevaciones laterales — 4×12-15",
  ]},
];

function Ring({ value, target, color, label, unit, size = 96 }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circ * (1 - pct);
  const over = value > target * 1.02;
  return (
    <div className="flex flex-col items-center">
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth="7" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={over ? "#FF8A5C" : color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset .5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0 }} className="flex flex-col items-center justify-center">
          <span style={{ color: C.text, fontVariantNumeric: "tabular-nums" }} className="text-lg font-bold leading-none">
            {Math.round(value)}
          </span>
          <span style={{ color: C.dim }} className="text-[10px] mt-0.5">/ {Math.round(target)}{unit}</span>
        </div>
      </div>
      <span style={{ color }} className="text-xs font-semibold mt-2 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("hoy");
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [log, setLog] = useState({ checked: {}, custom: [] });
  const [weights, setWeights] = useState([]);
  const [ready, setReady] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [cf, setCf] = useState({ n: "", kcal: "", p: "", c: "", f: "" });
  const day = todayKey();

  useEffect(() => {
    (async () => {
      const p = await store.get("profile");
      const w = await store.get("weights");
      const l = await store.get(`log:${day}`);
      if (p) setProfile({ ...DEFAULT_PROFILE, ...p });
      if (w) setWeights(w);
      if (l) setLog(l);
      setReady(true);
    })();
  }, [day]);

  const saveProfile = (np) => { setProfile(np); store.set("profile", np); };
  const saveLog = (nl) => { setLog(nl); store.set(`log:${day}`, nl); };

  const goals = useMemo(() => {
    const { edad, altura, peso, actividad, deficit } = profile;
    const bmr = 10 * peso + 6.25 * altura - 5 * edad + 5;
    const tdee = bmr * actividad;
    const kcal = Math.round((tdee * (1 - deficit)) / 10) * 10;
    const prot = Math.round(peso * 2.0);
    const fat = Math.round(peso * 0.8);
    const carb = Math.round((kcal - prot * 4 - fat * 9) / 4);
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, prot, carb, fat };
  }, [profile]);

  const eaten = useMemo(() => {
    let k = 0, p = 0, c = 0, f = 0;
    MEALS.forEach((m) => m.items.forEach((it) => {
      if (log.checked[it.id]) { k += it.kcal; p += it.p; c += it.c; f += it.f; }
    }));
    log.custom.forEach((it) => { k += it.kcal; p += it.p; c += it.c; f += it.f; });
    return { k, p, c, f };
  }, [log]);

  const toggle = (id) => saveLog({ ...log, checked: { ...log.checked, [id]: !log.checked[id] } });

  const addCustom = () => {
    if (!cf.n) return;
    const item = { id: "cust" + Date.now(), n: cf.n, kcal: +cf.kcal || 0, p: +cf.p || 0, c: +cf.c || 0, f: +cf.f || 0 };
    saveLog({ ...log, custom: [...log.custom, item] });
    setCf({ n: "", kcal: "", p: "", c: "", f: "" });
  };
  const delCustom = (id) => saveLog({ ...log, custom: log.custom.filter((i) => i.id !== id) });

  const addPeso = () => {
    const kg = parseFloat(nuevoPeso.replace(",", "."));
    if (!kg) return;
    const nw = [...weights.filter((x) => x.date !== day), { date: day, kg }].sort((a, b) => a.date.localeCompare(b.date));
    setWeights(nw); store.set("weights", nw);
    saveProfile({ ...profile, peso: kg });
    setNuevoPeso("");
  };

  const restante = Math.max(goals.kcal - eaten.k, 0);

  if (!ready) return <div style={{ background: C.bg, color: C.dim }} className="min-h-screen flex items-center justify-center">Cargando…</div>;

  const tabs = [["hoy", "Hoy"], ["dieta", "Dieta"], ["progreso", "Progreso"], ["entreno", "Entreno"], ["perfil", "Perfil"]];

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
        <header className="mb-5">
          <div style={{ color: C.accent }} className="text-[11px] font-bold tracking-[0.2em] uppercase">Fase de definición</div>
          <h1 className="text-2xl font-bold mt-1" style={{ letterSpacing: "-0.02em" }}>Mi plan</h1>
          <p style={{ color: C.dim }} className="text-xs mt-1">
            {day} · Objetivo {goals.kcal} kcal · déficit {Math.round(profile.deficit * 100)}%
          </p>
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
                <span className="font-bold" style={{ color: restante > 0 ? C.accent : "#FF8A5C", fontVariantNumeric: "tabular-nums" }}>
                  {restante} kcal
                </span>
              </div>
            </div>

            {MEALS.map((m) => (
              <div key={m.id} style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
                <div className="text-sm font-semibold mb-2">{m.nombre}</div>
                <div className="space-y-1.5">
                  {m.items.map((it) => {
                    const on = !!log.checked[it.id];
                    return (
                      <button key={it.id} onClick={() => toggle(it.id)}
                        className="w-full flex items-center gap-3 text-left rounded-lg px-2 py-1.5"
                        style={{ background: on ? C.panel2 : "transparent" }}>
                        <span className="flex items-center justify-center rounded-md flex-shrink-0"
                          style={{ width: 20, height: 20, border: `1.5px solid ${on ? C.accent : C.border}`, background: on ? C.accent : "transparent" }}>
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
                <input value={cf.n} onChange={(e) => setCf({ ...cf, n: e.target.value })} placeholder="Alimento"
                  style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} className="w-full rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-4 gap-2">
                  {[["kcal", "kcal"], ["p", "P"], ["c", "C"], ["f", "G"]].map(([k, ph]) => (
                    <input key={k} value={cf[k]} onChange={(e) => setCf({ ...cf, [k]: e.target.value })} placeholder={ph} inputMode="numeric"
                      style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} className="rounded-lg px-2 py-2 text-sm text-center" />
                  ))}
                </div>
                <button onClick={addCustom} style={{ background: C.accent, color: C.bg }} className="w-full rounded-lg py-2 text-sm font-semibold">
                  Añadir
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "dieta" && (
          <div className="space-y-4">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-5">
              <div className="text-sm font-semibold mb-3">Tus objetivos diarios</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[["Calorías", `${goals.kcal} kcal`, C.accent], ["Proteína", `${goals.prot} g`, C.protein],
                  ["Carbohidratos", `${goals.carb} g`, C.carb], ["Grasa", `${goals.fat} g`, C.fat]].map(([l, v, col]) => (
                  <div key={l} style={{ background: C.panel2 }} className="rounded-xl p-3">
                    <div style={{ color: C.dim }} className="text-xs">{l}</div>
                    <div style={{ color: col }} className="text-lg font-bold">{v}</div>
                  </div>
                ))}
              </div>
              <p style={{ color: C.dim }} className="text-xs mt-3 leading-relaxed">
                Proteína a 2 g/kg y grasa a 0,8 g/kg de tu peso; el resto en carbohidratos. Se recalcula solo cuando actualizas tu peso.
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
                  {m.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm py-0.5">
                      <span style={{ color: C.dim }}>{it.n}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            <p style={{ color: C.dim }} className="text-xs leading-relaxed px-1">
              Es una plantilla: puedes intercambiar alimentos por otros de macros parecidos (pollo↔pavo↔pescado blanco, arroz↔pasta↔patata). Lo que manda es cuadrar los totales del día.
            </p>
          </div>
        )}

        {tab === "progreso" && (
          <div className="space-y-4">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <div className="text-sm font-semibold mb-1">Registrar peso de hoy</div>
              <div className="flex gap-2 mt-2">
                <input value={nuevoPeso} onChange={(e) => setNuevoPeso(e.target.value)} placeholder="kg" inputMode="decimal"
                  style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} className="flex-1 rounded-lg px-3 py-2 text-sm" />
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
                  <span className="font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {(weights[weights.length - 1].kg - weights[0].kg).toFixed(1)} kg
                  </span>
                </div>
              )}
            </div>
            <p style={{ color: C.dim }} className="text-xs leading-relaxed px-1">
              Objetivo: bajar ~0,3-0,5 kg por semana. Si en 2-3 semanas no baja, resta 150-200 kcal (menos carbos). Si bajas muy rápido o pierdes fuerza, súmalas.
            </p>
          </div>
        )}

        {tab === "entreno" && (
          <div className="space-y-4">
            <div style={{ background: C.panel2, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
              <p style={{ color: C.text }} className="text-sm leading-relaxed">
                <span style={{ color: C.accent }} className="font-semibold">La definición no viene de "ejercicios de definir"</span>, viene del déficit + proteína alta manteniendo la fuerza. Por eso el plan sigue tu split y busca <b>progresar en cargas</b>, no repeticiones infinitas.
              </p>
            </div>
            {TRAIN.map((t, i) => (
              <div key={i} style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4">
                <div style={{ color: C.dim }} className="text-[11px] uppercase tracking-wide">{t.dia}</div>
                <div className="text-base font-bold mb-2">{t.foco}</div>
                <ul className="space-y-1">
                  {t.ej.map((e, j) => (
                    <li key={j} className="text-sm flex gap-2">
                      <span style={{ color: C.accent }}>·</span>
                      <span>{e}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 space-y-2 text-sm">
              <div className="font-semibold">Detalles clave</div>
              <p style={{ color: C.dim }} className="leading-relaxed">
                <b style={{ color: C.text }}>Calentamiento:</b> movilidad y 1-2 series de aproximación antes de cada ejercicio. Deja los estiramientos estáticos de piernas y brazos para <b>después</b> de entrenar.
              </p>
              <p style={{ color: C.dim }} className="leading-relaxed">
                <b style={{ color: C.text }}>Descanso:</b> 90-120 s en básicos, 45-60 s en aislamientos.
              </p>
              <p style={{ color: C.dim }} className="leading-relaxed">
                <b style={{ color: C.text }}>Cardio:</b> 8-10k pasos/día y 2 sesiones de 20-30 min, mejor después de pesas.
              </p>
            </div>
          </div>
        )}

        {tab === "perfil" && (
          <div className="space-y-4">
            <div style={{ background: C.panel, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 space-y-3">
              {[["edad", "Edad", "años"], ["altura", "Altura", "cm"], ["peso", "Peso", "kg"]].map(([k, l, u]) => (
                <div key={k} className="flex items-center justify-between">
                  <label style={{ color: C.dim }} className="text-sm">{l}</label>
                  <div className="flex items-center gap-2">
                    <input value={profile[k]} onChange={(e) => saveProfile({ ...profile, [k]: +e.target.value || 0 })} inputMode="decimal"
                      style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} className="w-20 rounded-lg px-3 py-2 text-sm text-right" />
                    <span style={{ color: C.dim }} className="text-xs w-8">{u}</span>
                  </div>
                </div>
              ))}
              <div>
                <label style={{ color: C.dim }} className="text-sm block mb-1">Nivel de actividad</label>
                <select value={profile.actividad} onChange={(e) => saveProfile({ ...profile, actividad: +e.target.value })}
                  style={{ background: C.panel2, border: `1px solid ${C.border}`, color: C.text }} className="w-full rounded-lg px-3 py-2 text-sm">
                  {ACTIVIDADES.map((a) => <option key={a.v} value={a.v}>{a.t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: C.dim }} className="text-sm block mb-1">Agresividad del déficit: {Math.round(profile.deficit * 100)}%</label>
                <input type="range" min="0.1" max="0.25" step="0.01" value={profile.deficit}
                  onChange={(e) => saveProfile({ ...profile, deficit: +e.target.value })} className="w-full" style={{ accentColor: C.accent }} />
                <div className="flex justify-between text-[10px] mt-0.5" style={{ color: C.dim }}>
                  <span>Suave (10%)</span><span>Agresivo (25%)</span>
                </div>
              </div>
            </div>
            <div style={{ background: C.panel2, border: `1px solid ${C.border}` }} className="rounded-2xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span style={{ color: C.dim }}>Metabolismo basal (BMR)</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{goals.bmr} kcal</span></div>
              <div className="flex justify-between"><span style={{ color: C.dim }}>Gasto total (TDEE)</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{goals.tdee} kcal</span></div>
              <div className="flex justify-between font-semibold"><span>Objetivo (déficit)</span><span style={{ color: C.accent, fontVariantNumeric: "tabular-nums" }}>{goals.kcal} kcal</span></div>
            </div>
          </div>
        )}
      </div>

      <nav style={{ background: C.panel, borderTop: `1px solid ${C.border}` }} className="fixed bottom-0 left-0 right-0">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="flex-1 py-3 text-xs font-medium"
              style={{ color: tab === k ? C.accent : C.dim, borderTop: tab === k ? `2px solid ${C.accent}` : "2px solid transparent" }}>
              {l}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
