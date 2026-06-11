import { useState, useCallback, useRef, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

const fmt = (n) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
const COLORS = ["#f4a261", "#2a9d8f", "#e76f51", "#3ac9b5", "#e9c46a", "#52d9c5"];

// ── Dark Theme Tokens ──
const T = {
  bg:        "#0a0a0a",
  surface:   "#111111",
  surface2:  "#1a1a1a",
  surface3:  "#222222",
  border:    "#2a2a2a",
  border2:   "#383838",
  orange:    "#ffb07a",
  orange2:   "#ff7c5c",
  orange3:   "#d0832a",
  green:     "#2ebfaf",
  green2:    "#4de8d0",
  green3:    "#1a6e64",
  text:      "#ffffff",
  textSub:   "#aaa090",
  textMuted: "#707070",
  red:       "#ff6060",
  gold:      "#ffd97a",
};

export default function RetirementPlanner() {
  const [form, setForm] = useState({
    currentAge: 30,
    retireAge: 60,
    lifeExpectancy: 85,
    currentSavings: 0,
    monthlyIncome: 30000,
    incomeSalary: 30000,
    monthlySavingRate: 10,
    retireMonthlyExpense: 0,
    expectedReturn: 5,
    retireReturn: 3,
    inflationRate: 3,
    monthlyPension: 0,
    monthlySSOPension: 0,
    monthlyInsurancePension: 0,
    providentFund: 0,
    severancePay: 0,
    otherLumpsum: 0,
  });

  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [incomeData, setIncomeData] = useState({ salary: 30000, compensation: 0, bonusMonths: 0, other: 0 });
  const [helpOpen, setHelpOpen] = useState(false);

  const [pvdData, setPvdData] = useState({ salary: 30000, empRate: 5, empBalance: 0, compRate: 5, compBalance: 0, returnRate: 4, yearsLeft: 30 });
  const [ssoData, setSsoData] = useState({ salary: 15000, yearsContrib: 15 });
  const [svData, setSvData] = useState({ lastSalary: 30000, yearsWorked: 10 });
  const [assetsData, setAssetsData] = useState({ rmf:0,rmfRet:5,esg:0,esgRet:5,ssf:0,ssfRet:5,mutualFund:0,mutualFundRet:5,stocks:0,stocksRet:7,gold:0,goldRet:5,crypto:0,cryptoRet:10,other:0,otherRet:3 });

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState("firework");
  const bannerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [picker, setPicker] = useState(null);
  const [pickerVal, setPickerVal] = useState(0);
  const [subPicker, setSubPicker] = useState(null);
  const [subPickerVal, setSubPickerVal] = useState(0);
  const openSubPicker = (label, val, min, max, step, unit, onConfirm) => {
    setSubPickerVal(val); setSubPicker({ label, val, min, max, step, unit, onConfirm });
  };

  const set = (k, v) => {
    const ageFields = ["currentAge", "retireAge", "lifeExpectancy"];
    const num = parseFloat(v) || 0;
    const val = ageFields.includes(k) ? Math.round(num) : num;
    setForm((f) => {
      const next = { ...f, [k]: val };
      if (k === "retireAge" || k === "currentAge") {
        const yrs = Math.max(1, (k === "retireAge" ? val : f.retireAge) - (k === "currentAge" ? val : f.currentAge));
        setPvdData(p => ({ ...p, yearsLeft: yrs }));
      }
      if (k === "incomeSalary") {
        setPvdData(p => ({ ...p, salary: val }));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!result) return;
    setShowAnimation(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimationType(result.surplus >= 0 ? "firework" : "stars");
          setShowAnimation(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    const el = bannerRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [result]);

  useEffect(() => {
    if (!showAnimation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];

    if (animationType === "firework") {
      const colors = ["#f4a261","#2a9d8f","#e9c46a","#e76f51","#3ac9b5","#ff6b9d","#c77dff","#48cae4"];
      for (let b = 0; b < 8; b++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height * 0.6 + 50;
        const color = colors[b % colors.length];
        for (let i = 0; i < 60; i++) {
          const angle = (Math.PI * 2 * i) / 60;
          const speed = 3 + Math.random() * 6;
          particles.push({ x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, alpha: 1, size: 3 + Math.random() * 4, color, gravity: 0.12, delay: b * 12, type: "firework" });
        }
      }
    } else {
      for (let i = 0; i < 12000; i++) {
        particles.push({ x: Math.random() * canvas.width, y: -Math.random() * canvas.height * 2, vy: 8 + Math.random() * 10, vx: 0, length: 8 + Math.random() * 16, alpha: 0.15 + Math.random() * 0.35, width: 0.5 + Math.random() * 0.8, type: "rain" });
      }
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;
      if (animationType === "stars") {
        ctx.fillStyle = `rgba(30,30,30,${Math.min(frame / 80, 0.25)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      particles = particles.filter(p => p.type === "rain" || p.alpha > 0.02);
      particles.forEach(p => {
        if (p.type === "firework") {
          if (frame < p.delay) return;
          ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.shadowBlur = 12; ctx.shadowColor = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.98; p.alpha -= 0.016; p.size *= 0.98;
        } else if (p.type === "rain") {
          ctx.save(); ctx.globalAlpha = p.alpha; ctx.strokeStyle = "#666"; ctx.lineWidth = p.width;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.length); ctx.stroke(); ctx.restore();
          p.y += p.vy;
          if (p.y > canvas.height) { p.y = -Math.random() * 20; p.x = Math.random() * canvas.width; }
        }
      });
      if (frame < 280) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        let fadeFrame = 0;
        const fadeOut = () => { fadeFrame++; ctx.clearRect(0, 0, canvas.width, canvas.height); if (fadeFrame < 30) requestAnimationFrame(fadeOut); else setShowAnimation(false); };
        requestAnimationFrame(fadeOut);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [showAnimation, animationType]);

  const calculate = useCallback(() => {
    const { currentAge, retireAge, lifeExpectancy, currentSavings, monthlyIncome, monthlySavingRate, retireMonthlyExpense, expectedReturn, retireReturn, inflationRate, monthlyPension, monthlySSOPension, monthlyInsurancePension, providentFund, severancePay, otherLumpsum } = form;
    const yearsToRetire = retireAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retireAge;
    const monthlyContribution = (monthlyIncome * monthlySavingRate) / 100;
    const annualContribution = monthlyContribution * 12;
    const rPre = expectedReturn / 100;
    const rPost = retireReturn / 100;
    const inf = inflationRate / 100;
    const infM = inf / 12;
    const infYearFactor = (yrs) => Math.pow(1 + infM, yrs * 12) * (1 + infM);

    const fvCurrentSavings = currentSavings * Math.pow(1 + rPre, yearsToRetire);
    const fvContributions = rPre > 0
      ? annualContribution * (Math.pow(1 + rPre, yearsToRetire) - 1) / rPre
      : annualContribution * yearsToRetire;
    const lumpSum = providentFund + severancePay + otherLumpsum;
    const totalAtRetirement = fvCurrentSavings + fvContributions + lumpSum;

    const retireExpenseAdj = retireMonthlyExpense * 12 * infYearFactor(yearsToRetire);
    const retireMonthlyExpenseAdj = retireExpenseAdj / 12;
    const totalMonthlyIncome = monthlyPension + monthlySSOPension + monthlyInsurancePension;
    const totalAnnualPassive = totalMonthlyIncome * 12;
    const netAnnualNeed = Math.max(0, retireExpenseAdj - totalAnnualPassive);
    const netMonthlyNeed = netAnnualNeed / 12;

    let requiredNestEgg = 0;
    let grossTotalExpense = 0;
    if (netAnnualNeed > 0) {
      for (let k = 0; k <= yearsInRetirement; k++) {
        const expenseK = netAnnualNeed * infYearFactor(k);
        requiredNestEgg += expenseK / Math.pow(1 + rPost, k);
      }
    }
    // Gross total expense after retirement, inflation-adjusted year by year, no deductions
    for (let k = 0; k <= yearsInRetirement; k++) {
      grossTotalExpense += retireMonthlyExpense * 12 * infYearFactor(yearsToRetire + k);
    }

    const surplus = totalAtRetirement - requiredNestEgg;
    const readyPercent = requiredNestEgg > 0 ? Math.min((totalAtRetirement / requiredNestEgg) * 100, 200) : 200;

    const targetFromSaving = Math.max(0, requiredNestEgg - fvCurrentSavings - lumpSum);
    const requiredAnnualSaving = rPre > 0
      ? targetFromSaving * rPre / (Math.pow(1 + rPre, yearsToRetire) - 1)
      : targetFromSaving / yearsToRetire;
    const requiredMonthlySaving = requiredAnnualSaving / 12;
    const requiredSavingRate = monthlyIncome > 0 ? (requiredMonthlySaving / monthlyIncome) * 100 : 0;
    const savingGap = requiredMonthlySaving - monthlyContribution;

    const milestones = [];
    for (let y = 5; y <= yearsToRetire; y += 5) {
      const age = currentAge + y;
      const yearsLeft = yearsToRetire - y;
      const targetAtAge = requiredNestEgg / Math.pow(1 + rPre, yearsLeft);
      const fvS = currentSavings * Math.pow(1 + rPre, y);
      const fvC = rPre > 0
        ? annualContribution * (Math.pow(1 + rPre, y) - 1) / rPre
        : annualContribution * y;
      const actualAtAge = Math.round(fvS + fvC);
      // คำนวณรายละเอียดเพิ่มเติม
      const totalSavedSoFar = monthlyContribution * 12 * y; // เงินออมสะสม (ไม่รวมผลตอบแทน)
      const investmentGain = actualAtAge - currentSavings - totalSavedSoFar; // กำไรจากการลงทุน
      const progressPct = Math.min((actualAtAge / targetAtAge) * 100, 200);
      const ageRaw = age;
      milestones.push({
        อายุ: `${age} ปี`,
        ageRaw,
        เป้าหมายออม: Math.round(targetAtAge),
        ทำได้จริง: actualAtAge,
        totalSavedSoFar: Math.round(totalSavedSoFar + currentSavings),
        investmentGain: Math.round(investmentGain),
        progressPct,
        yearsFromNow: y,
        yearsLeft,
        monthlyOm: Math.round(monthlyContribution),
      });
    }

    const projection = [];
    let balance = currentSavings;
    for (let y = 0; y <= yearsToRetire + yearsInRetirement; y++) {
      const age = currentAge + y;
      let annualIncome, annualExpense;
      if (y < yearsToRetire) {
        annualIncome = monthlyIncome * 12;
        annualExpense = null;
        balance = balance * (1 + rPre) + annualContribution;
      } else if (y === yearsToRetire) {
        annualIncome = totalAnnualPassive;
        annualExpense = retireMonthlyExpense * 12 * infYearFactor(y);
        balance = balance + lumpSum;
      } else {
        const inflExp = retireMonthlyExpense * 12 * infYearFactor(y);
        const net = Math.max(0, inflExp - totalAnnualPassive);
        annualIncome = totalAnnualPassive;
        annualExpense = inflExp;
        balance = Math.max(0, balance * (1 + rPost) - net);
      }
      const cashflow = annualExpense !== null ? balance + annualIncome - annualExpense : balance;
      projection.push({
        อายุ: age,
        เงินออม: Math.round(balance),
        รายรับ: Math.round(annualIncome),
        ค่าใช้จ่าย: annualExpense !== null ? Math.round(annualExpense) : null,
        คงเหลือ: Math.round(cashflow),
      });
    }
    const legacyAmount = projection.length > 0 ? projection[projection.length - 1].เงินออม : 0;

    const pie = [
      { name: "เงินออมปัจจุบัน (FV)", value: Math.round(fvCurrentSavings) },
      { name: "ออมรายเดือน (FV)", value: Math.round(fvContributions) },
      { name: "กองทุนสำรอง/เงินชดเชย", value: lumpSum },
      { name: "บำนาญ (PV)", value: Math.round(monthlyPension * 12 * yearsInRetirement) },
      { name: "ประกันสังคม (PV)", value: Math.round(monthlySSOPension * 12 * yearsInRetirement) },
      { name: "ประกันบำนาญ (PV)", value: Math.round(monthlyInsurancePension * 12 * yearsInRetirement) },
    ].filter((d) => d.value > 0);

    setResult({ totalAtRetirement, requiredNestEgg, grossTotalExpense: Math.round(grossTotalExpense), surplus, readyPercent, monthlyContribution, retireExpenseAdj, retireMonthlyExpenseAdj: retireExpenseAdj / 12, netMonthlyNeed, totalMonthlyIncome, requiredMonthlySaving, requiredSavingRate, savingGap, projection, pie, milestones, yearsToRetire, yearsInRetirement, legacyAmount });
    setActiveTab("result");
  }, [form]);

  const openPicker = (name, min, max, step, unit, label) => {
    setPickerVal(form[name]);
    setPicker({ name, min, max, step, unit, label });
  };

  // ── Slider Input Field (dark) ──
  const InputField = ({ label, name, min, max, step, unit, note, color }) => {
    const isInt = step === 1;
    const autoStep = isInt ? 1 : 0.01;
    const thumbColor = color || T.orange;
    const pct = ((form[name] - min) / (max - min)) * 100;
    const applyVal = (raw) => {
      let n = parseFloat(raw);
      if (isNaN(n) || raw === "") { set(name, 0); return; }
      if (isInt) n = Math.round(n);
      set(name, Math.min(max, Math.max(0, n)));
    };
    return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{label}</span>
          {note && <span style={{ fontSize: 11, color: T.green2, fontWeight: 600 }}>{note}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, position: "relative", height: 36, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: T.border2 }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: `linear-gradient(90deg, ${thumbColor}80, ${thumbColor})`, borderRadius: 2, transition: "width 0.1s", boxShadow: `0 0 8px ${thumbColor}60` }} />
            </div>
            <input type="range" min={min} max={max} step={autoStep} value={form[name]}
              onChange={(e) => applyVal(e.target.value)}
              style={{ position: "absolute", width: "100%", height: 36, WebkitAppearance: "none", appearance: "none", background: "transparent", outline: "none", cursor: "pointer", margin: 0, padding: 0, touchAction: "manipulation" }}
            />
          </div>
          <div onClick={() => openPicker(name, min, max, step, unit, label)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: T.surface3, border: `1.5px solid ${thumbColor}40`, borderRadius: 10, padding: "7px 12px", minWidth: 80, cursor: "pointer", userSelect: "none" }}>
            <span style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.text }}>{isInt ? form[name] : fmt(form[name])}</span>
            <span style={{ fontSize: 13, color: thumbColor, fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
        <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;border-radius:50%;background:${thumbColor};box-shadow:0 0 10px ${thumbColor}80,0 2px 6px rgba(0,0,0,0.5);border:2px solid ${T.surface};cursor:pointer;}input[type=range]:active::-webkit-slider-thumb{width:28px;height:28px;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
      </div>
    );
  };

  // ── Picker Modal (dark) ──
  const WheelPicker = () => {
    if (!picker) return null;
    const { name, min, max, step, unit, label } = picker;
    const isInt = step === 1;
    const items = [];
    if (isInt) for (let i = min; i <= max; i++) items.push(i);
    const confirmPicker = () => { set(name, Math.max(0, pickerVal)); setPicker(null); };
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setPicker(null)}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: T.surface, borderRadius: "20px 20px 0 0", padding: "0 0 32px", boxShadow: `0 -8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${T.border}`, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}><div style={{ width: 40, height: 3, borderRadius: 2, background: T.border2 }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: "Mitr" }}>{label}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPicker(null)} style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 13, fontWeight: 600, color: T.textSub, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={confirmPicker} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.orange}, ${T.orange2})`, fontSize: 13, fontWeight: 600, color: "#000", cursor: "pointer" }}>ตกลง</button>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 24px", background: T.surface2, margin: "0 24px 16px", borderRadius: 12, border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>{isInt ? pickerVal : fmt(pickerVal)}</span>
            <span style={{ fontSize: 13, color: T.textSub, marginLeft: 8 }}>{unit}</span>
          </div>
          {isInt ? (
            <div style={{ position: "relative", height: 220, overflow: "hidden", margin: "0 24px" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 44, transform: "translateY(-50%)", background: `${T.orange}15`, border: `1.5px solid ${T.orange}`, borderRadius: 10, pointerEvents: "none", zIndex: 2 }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, ${T.surface}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top, ${T.surface}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
              <div style={{ overflowY: "scroll", height: "100%", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
                ref={el => { if (el) { const idx = items.indexOf(Math.round(pickerVal)); el.scrollTop = idx * 44; el.onscroll = () => { const i = Math.round(el.scrollTop / 44); const v = items[Math.max(0, Math.min(items.length - 1, i))]; if (v !== undefined) setPickerVal(v); }; } }}>
                <div style={{ height: 88 }} />
                {items.map(v => <div key={v} onClick={() => setPickerVal(v)} style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: v === pickerVal ? 22 : 18, fontWeight: v === pickerVal ? 800 : 400, color: v === pickerVal ? T.orange : T.textSub, scrollSnapAlign: "center", cursor: "pointer" }}>{v} {unit}</div>)}
                <div style={{ height: 88 }} />
              </div>
            </div>
          ) : (
            <div style={{ padding: "0 20px 8px" }}>
              <div style={{ background: T.surface2, borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: `1.5px solid ${T.orange}` }}>
                <input type="number" value={pickerVal} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setPickerVal(Math.min(max, Math.max(0, v))); }} autoFocus inputMode="numeric"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 28, fontWeight: 800, color: T.orange, fontFamily: "Mitr", textAlign: "right" }} />
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 4 }}>ช่วง: {fmt(min)} – {fmt(max)} {unit}</div>
              </div>
              {(() => {
                const cfg = { monthlyIncome:{step:1000,presets:[15000,20000,30000,50000,80000,100000]}, monthlySavingRate:{step:1,presets:[5,10,15,20,30]}, retireMonthlyExpense:{step:1000,presets:[10000,15000,20000,30000,50000]}, expectedReturn:{step:0.5,presets:[0,3,5,7,10]}, retireReturn:{step:0.5,presets:[0,2,3,5,7]}, inflationRate:{step:1,presets:[1,2,3,4,5]}, providentFund:{step:5000,presets:[0,100000,500000,1000000,5000000]}, severancePay:{step:5000,presets:[0,50000,100000,200000,500000]}, otherLumpsum:{step:10000,presets:[0,100000,500000,1000000,3000000]}, currentSavings:{step:10000,presets:[0,100000,500000,1000000,2000000]}, monthlyPension:{step:500,presets:[0,3000,5000,10000,20000]}, monthlySSOPension:{step:100,presets:[0,1000,3000,5000,7500]}, monthlyInsurancePension:{step:500,presets:[0,2000,5000,10000,20000]} };
                const c = cfg[name] || { step: step || 1, presets: [] };
                const s = c.step;
                return (<div>
                  <div style={{ fontSize: 13, color: T.textSub, marginBottom: 8, fontWeight: 600 }}>เลือกค่าด่วน</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {c.presets.filter(p => p >= min && p <= max).map(p => (
                      <button key={p} onClick={() => setPickerVal(p)} style={{ padding: "7px 13px", borderRadius: 10, border: pickerVal === p ? `1.5px solid ${T.orange}` : `1px solid ${T.border2}`, background: pickerVal === p ? `${T.orange}20` : T.surface2, fontSize: 11, fontWeight: 600, color: pickerVal === p ? T.orange : T.text, cursor: "pointer" }}>{fmt(p)}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPickerVal(v => Math.max(0, parseFloat((v - s).toFixed(4))))} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: `1px solid ${T.red}40`, background: `${T.red}12`, fontSize: 13, fontWeight: 800, color: T.red, cursor: "pointer" }}>− {fmt(s)}</button>
                    <button onClick={() => setPickerVal(v => Math.min(max, parseFloat((v + s).toFixed(4))))} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: `1px solid ${T.green}40`, background: `${T.green}12`, fontSize: 13, fontWeight: 800, color: T.green2, cursor: "pointer" }}>+ {fmt(s)}</button>
                  </div>
                </div>);
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Sub Picker (dark) ──
  const SubPicker = () => {
    if (!subPicker) return null;
    const { label, min, max, step, unit, onConfirm } = subPicker;
    const isInt = step === 1;
    const items = [];
    if (isInt) for (let i = min; i <= max; i++) items.push(i);
    const confirm = () => { onConfirm(subPickerVal); setSubPicker(null); };
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSubPicker(null)}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: T.surface, borderRadius: "20px 20px 0 0", padding: "0 0 32px", boxShadow: `0 -8px 40px rgba(0,0,0,0.6)`, border: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}><div style={{ width: 40, height: 3, borderRadius: 2, background: T.border2 }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 12px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: "Mitr" }}>{label}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSubPicker(null)} style={{ padding: "8px 18px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 13, fontWeight: 600, color: T.textSub, cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={confirm} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.orange}, ${T.orange2})`, fontSize: 13, fontWeight: 600, color: "#000", cursor: "pointer" }}>ตกลง</button>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 24px", background: T.surface2, margin: "0 24px 16px", borderRadius: 12, border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>{isInt ? subPickerVal : subPickerVal.toFixed(step < 1 ? 1 : 0)}</span>
            <span style={{ fontSize: 13, color: T.textSub, marginLeft: 8 }}>{unit}</span>
          </div>
          {isInt ? (
            <div style={{ position: "relative", height: 220, overflow: "hidden", margin: "0 24px" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 44, transform: "translateY(-50%)", background: `${T.orange}15`, border: `1.5px solid ${T.orange}`, borderRadius: 10, pointerEvents: "none", zIndex: 2 }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, ${T.surface}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top, ${T.surface}, transparent)`, zIndex: 1, pointerEvents: "none" }} />
              <div style={{ overflowY: "scroll", height: "100%", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
                ref={el => { if (el) { const idx = items.indexOf(Math.round(subPickerVal)); el.scrollTop = idx * 44; el.onscroll = () => { const i = Math.round(el.scrollTop / 44); const v = items[Math.max(0, Math.min(items.length - 1, i))]; if (v !== undefined) setSubPickerVal(v); }; } }}>
                <div style={{ height: 88 }} />
                {items.map(v => <div key={v} onClick={() => setSubPickerVal(v)} style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: v === subPickerVal ? 22 : 18, fontWeight: v === subPickerVal ? 800 : 400, color: v === subPickerVal ? T.orange : T.textSub, scrollSnapAlign: "center", cursor: "pointer" }}>{v} {unit}</div>)}
                <div style={{ height: 88 }} />
              </div>
            </div>
          ) : (
            <div style={{ padding: "0 20px 8px" }}>
              <div style={{ background: T.surface2, borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: `1.5px solid ${T.orange}` }}>
                <input type="number" value={subPickerVal} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setSubPickerVal(Math.min(max, Math.max(min, v))); }} autoFocus inputMode="numeric"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 28, fontWeight: 800, color: T.orange, fontFamily: "Mitr", textAlign: "right" }} />
                <div style={{ fontSize: 11, color: T.textSub, marginTop: 4 }}>ช่วง: {min} – {max} {unit}</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSubPickerVal(v => Math.max(min, parseFloat((v - step).toFixed(4))))} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: `1px solid ${T.red}40`, background: `${T.red}12`, fontSize: 13, fontWeight: 800, color: T.red, cursor: "pointer" }}>− {step}</button>
                <button onClick={() => setSubPickerVal(v => Math.min(max, parseFloat((v + step).toFixed(4))))} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: `1px solid ${T.green}40`, background: `${T.green}12`, fontSize: 13, fontWeight: 800, color: T.green2, cursor: "pointer" }}>+ {step}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Savings Box (dark) — controlled, persists across tab switches ──
  const [savingsRaw, setSavingsRaw] = useState(form.currentSavings > 0 ? new Intl.NumberFormat("th-TH").format(form.currentSavings) : "");
  const [savingsFocused, setSavingsFocused] = useState(false);
  const SavingsBox = () => {
    const presets = [0, 100000, 500000, 1000000, 2000000, 5000000];
    return (
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 10 }}>เงินออมปัจจุบัน</div>
        <div style={{ background: T.surface2, border: `1.5px solid ${T.orange}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, overflow: "hidden", boxShadow: `0 0 20px ${T.orange}15` }}>
          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>เงินออมที่มีอยู่ตอนนี้</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 16, color: T.orange, fontWeight: 800, fontFamily: "Mitr", flexShrink: 0 }}>฿</span>
            <input type="text" inputMode="numeric" placeholder="0"
              value={savingsFocused ? savingsRaw : (form.currentSavings > 0 ? new Intl.NumberFormat("th-TH").format(form.currentSavings) : "")}
              onFocus={() => { setSavingsFocused(true); setSavingsRaw(form.currentSavings > 0 ? String(form.currentSavings) : ""); }}
              onChange={e => setSavingsRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setSavingsFocused(false); const n = parseInt(savingsRaw || "0", 10); set("currentSavings", n); setSavingsRaw(n > 0 ? new Intl.NumberFormat("th-TH").format(n) : ""); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: "clamp(18px,5vw,26px)", fontWeight: 800, color: T.orange, fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 11, color: T.orange, fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>บาท</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {presets.map(p => (
            <button key={p} onClick={() => { set("currentSavings", p); setSavingsRaw(p > 0 ? new Intl.NumberFormat("th-TH").format(p) : "0"); }}
              style={{ padding: "5px 10px", borderRadius: 8, border: form.currentSavings === p ? `1.5px solid ${T.orange}` : `1px solid ${T.border2}`, background: form.currentSavings === p ? `${T.orange}20` : T.surface2, fontSize: 13, fontWeight: 600, color: form.currentSavings === p ? T.orange : T.textSub, cursor: "pointer" }}>
              {p === 0 ? "0" : new Intl.NumberFormat("th-TH").format(p)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Expense Box (dark) — controlled, persists across tab switches ──
  const [expenseRaw, setExpenseRaw] = useState(form.retireMonthlyExpense > 0 ? new Intl.NumberFormat("th-TH").format(form.retireMonthlyExpense) : "");
  const [expenseFocused, setExpenseFocused] = useState(false);
  const ExpenseBox = () => {
    const presets = [10000, 15000, 20000, 30000, 50000, 80000, 100000];
    return (
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 10 }}>
          รายจ่ายหลังเกษียณ/เดือน <span style={{ fontSize: 13, color: T.textSub, fontWeight: 400 }}>(Lifestyle)</span>
        </div>
        <div style={{ background: T.surface2, border: `1.5px solid ${T.orange}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, overflow: "hidden", boxShadow: `0 0 20px ${T.orange}15` }}>
          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>ค่าใช้จ่ายต่อเดือน</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 16, color: T.orange, fontWeight: 800, fontFamily: "Mitr", flexShrink: 0 }}>฿</span>
            <input type="text" inputMode="numeric" placeholder="0"
              value={expenseFocused ? expenseRaw : (form.retireMonthlyExpense > 0 ? new Intl.NumberFormat("th-TH").format(form.retireMonthlyExpense) : "")}
              onFocus={() => { setExpenseFocused(true); setExpenseRaw(form.retireMonthlyExpense > 0 ? String(form.retireMonthlyExpense) : ""); }}
              onChange={e => setExpenseRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setExpenseFocused(false); const n = parseInt(expenseRaw || "0", 10); set("retireMonthlyExpense", n); setExpenseRaw(n > 0 ? new Intl.NumberFormat("th-TH").format(n) : ""); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: "clamp(18px,5vw,26px)", fontWeight: 800, color: T.orange, fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 11, color: T.orange, fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>บาท</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {presets.map(p => (
            <button key={p} onClick={() => { set("retireMonthlyExpense", p); setExpenseRaw(new Intl.NumberFormat("th-TH").format(p)); }}
              style={{ padding: "5px 10px", borderRadius: 8, border: form.retireMonthlyExpense === p ? `1.5px solid ${T.orange}` : `1px solid ${T.border2}`, background: form.retireMonthlyExpense === p ? `${T.orange}20` : T.surface2, fontSize: 13, fontWeight: 600, color: form.retireMonthlyExpense === p ? T.orange : T.textSub, cursor: "pointer" }}>
              {new Intl.NumberFormat("th-TH").format(p)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Income Calculator (dark) ──
  const IncomeCalculator = ({ onSave, data, onChange }) => {
    const inc = data;
    const si = (k, v) => onChange(p => ({ ...p, [k]: parseFloat(v) || 0 }));
    const bonusMonthly = (inc.salary * inc.bonusMonths) / 12;
    const totalMonthly = inc.salary + inc.compensation + bonusMonthly + inc.other;
    const NumInc = ({ label, field, unit, desc, color }) => {
      const [editing, setEditing] = useState(false);
      const [raw, setRaw] = useState(inc[field] > 0 ? String(inc[field]) : "");
      const displayVal = !editing && inc[field] > 0 ? new Intl.NumberFormat("th-TH").format(inc[field]) : raw;
      return (
        <div style={{ marginBottom: 14, background: T.surface2, border: `1px solid ${inc[field] > 0 ? color + "50" : T.border}`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8 }}>{desc}</div>
          <div style={{ background: T.surface3, border: `1px solid ${inc[field] > 0 ? color : T.border2}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="text" inputMode="numeric" value={displayVal} placeholder="0"
              onFocus={() => { setEditing(true); setRaw(inc[field] > 0 ? String(inc[field]) : ""); }}
              onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setEditing(false); const n = parseInt(raw || "0", 10); setRaw(n > 0 ? String(n) : ""); si(field, n); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "Mitr", textAlign: "right" }} />
            <span style={{ fontSize: 11, color, fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
      );
    };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 11, fontWeight: 600, cursor: "pointer", color: T.textSub }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 14, color: T.orange, fontWeight: 600 }}>💰 กรอกข้อมูลรายได้</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
          <div>
            <NumInc label="เงินเดือน" field="salary" unit="บาท/เดือน" desc="เงินเดือนประจำก่อนหักภาษี" color={T.orange} />
            <NumInc label="ค่าตอบแทน / OT" field="compensation" unit="บาท/เดือน" desc="รายได้เพิ่มเติม" color={T.orange2} />
            <NumInc label="รายได้อื่นๆ" field="other" unit="บาท/เดือน" desc="ฟรีแลนซ์ / ธุรกิจ ฯลฯ" color={T.green} />
          </div>
          <div>
            <div style={{ marginBottom: 14, background: T.surface2, border: `1px solid ${inc.bonusMonths > 0 ? T.gold + "50" : T.border}`, borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>🎁 โบนัสประจำปี</div>
              <div style={{ background: T.surface3, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" inputMode="decimal" step="0.5" min="0" max="12" value={inc.bonusMonths} onChange={e => si("bonusMonths", e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: T.text, fontFamily: "Mitr", textAlign: "right" }} />
                <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>เดือน/ปี</span>
              </div>
              {inc.bonusMonths > 0 && <div style={{ fontSize: 13, color: T.textSub, marginTop: 6 }}>= เฉลี่ย ฿{fmt(Math.round(bonusMonthly))}/เดือน</div>}
            </div>
            <div style={{ background: T.surface2, border: `2px solid ${T.orange}`, borderRadius: 14, padding: "18px", boxShadow: `0 0 24px ${T.orange}20` }}>
              <div style={{ fontFamily: "Mitr", fontSize: 11, fontWeight: 600, color: T.orange, marginBottom: 10 }}>💰 รวมรายได้</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.orange, fontFamily: "Mitr", textAlign: "center" }}>฿{fmt(Math.round(totalMonthly))}<span style={{ fontSize: 15, color: T.textSub }}>/เดือน</span></div>
            </div>
          </div>
        </div>
        <button onClick={() => onSave(Math.round(totalMonthly), Math.round(inc.salary))} style={{ width: "100%", marginTop: 20, padding: "14px", background: `linear-gradient(135deg, ${T.orange}, ${T.orange2})`, border: "none", borderRadius: 12, color: "#000", fontFamily: "Mitr", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>✅ ใช้รายได้รวม ฿{fmt(Math.round(totalMonthly))}</button>
      </div>
    );
  };

  // ── PVD Calculator (dark) ──
  const PVDCalculator = ({ onSave, data: pvd, onChange: setPvdExt }) => {
    const sp = (k, v) => { let n = parseFloat(v); if (isNaN(n)) n = 0; if (k === "yearsLeft") n = Math.round(Math.max(1, n)); setPvdExt(p => ({ ...p, [k]: n })); };
    const me = pvd.salary * pvd.empRate / 100, mc = pvd.salary * pvd.compRate / 100;
    const r = pvd.returnRate / 100, mn = pvd.yearsLeft * 12, mr = r / 12;
    const fvE = pvd.empBalance * Math.pow(1 + r, pvd.yearsLeft) + (mr > 0 ? me * ((Math.pow(1 + mr, mn) - 1) / mr) : me * mn);
    const fvC = pvd.compBalance * Math.pow(1 + r, pvd.yearsLeft) + (mr > 0 ? mc * ((Math.pow(1 + mr, mn) - 1) / mr) : mc * mn);
    const total = fvE + fvC;
    const NR = ({ label, field, unit, note }) => {
      const ref = useRef(null);
      useEffect(() => {
        if (ref.current && document.activeElement !== ref.current)
          ref.current.value = pvd[field] > 0 ? new Intl.NumberFormat("th-TH").format(pvd[field]) : "";
      }, [pvd[field]]);
      return (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 2 }}>{label}</div>
          {note && <div style={{ fontSize: 13, color: T.textSub, marginBottom: 8 }}>{note}</div>}
          <div style={{ background: T.surface3, border: `1.5px solid ${T.orange}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <input ref={ref} type="text" inputMode="numeric" placeholder="0" defaultValue=""
              onFocus={e => { e.target.value = pvd[field] > 0 ? String(pvd[field]) : ""; e.target.select(); }}
              onBlur={e => { const n = parseInt(e.target.value.replace(/[^0-9]/g,"") || "0", 10); sp(field, n); e.target.value = n > 0 ? new Intl.NumberFormat("th-TH").format(n) : ""; }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, fontFamily: "Mitr", textAlign: "right", color: T.text }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
      );
    };
    const SliderRow = ({ label, field, min, max, step, unit }) => {
      const pct = ((pvd[field] - min) / (max - min)) * 100;
      const dispVal = Number.isInteger(pvd[field]) ? pvd[field] : pvd[field].toFixed(1);
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>{label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, position: "relative", height: 32, display: "flex", alignItems: "center" }}>
              <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: T.border2 }}>
                <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: T.gold, borderRadius: 2 }} />
              </div>
              <input type="range" min={min} max={max} step={step || 0.1} value={pvd[field]}
                onChange={e => sp(field, e.target.value)}
                style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }} />
            </div>
            <div onClick={() => openSubPicker(label, pvd[field], min, max, step, unit, v => sp(field, v))}
              style={{ display: "flex", alignItems: "center", gap: 5, background: T.surface3, border: `1.5px solid ${T.gold}30`, borderRadius: 10, padding: "7px 12px", minWidth: 80, cursor: "pointer", userSelect: "none" }}>
              <span style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.text }}>{dispVal}</span>
              <span style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{unit}</span>
            </div>
          </div>
          <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${T.gold};border:2px solid ${T.surface};box-shadow:0 0 8px ${T.gold}60;cursor:pointer;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
        </div>
      );
    };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 11, fontWeight: 600, cursor: "pointer", color: T.textSub }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 14, color: T.gold, fontWeight: 600 }}>🏦 คำนวณกองทุนสำรองเลี้ยงชีพ</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "Mitr", fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>ข้อมูลเงินเดือนและอัตรานำส่ง</div>
            <NR label="เงินเดือนปัจจุบัน" field="salary" unit="บาท" note="ใช้คำนวณยอดนำส่งรายเดือน" />
            <SliderRow label="อัตราส่วนพนักงาน" field="empRate" min={2} max={15} step={0.1} unit="%" />
            <SliderRow label="อัตราส่วนนายจ้าง" field="compRate" min={2} max={15} step={0.1} unit="%" />
            <SliderRow label="ผลตอบแทนกองทุน" field="returnRate" min={1} max={15} step={0.5} unit="% ต่อปี" />
            <NR label="จำนวนปีที่เหลือก่อนเกษียณ" field="yearsLeft" unit="ปี" />
          </div>
          <div>
            <div style={{ fontFamily: "Mitr", fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>ยอดสะสมปัจจุบัน</div>
            <NR label="ยอดสะสมส่วนพนักงาน" field="empBalance" unit="บาท" note="ยอดที่สะสมมาแล้ว ณ ปัจจุบัน" />
            <NR label="ยอดสะสมส่วนนายจ้าง" field="compBalance" unit="บาท" note="ยอดที่นายจ้างสะสมให้ ณ ปัจจุบัน" />
            <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px", marginTop: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ label: "นำส่ง/เดือน (พนักงาน)", val: me, color: T.orange }, { label: "นำส่ง/เดือน (นายจ้าง)", val: mc, color: T.orange2 }, { label: "รวมนำส่ง/เดือน", val: me + mc, color: T.text }].map((item, i) => (
                  <div key={i} style={{ background: T.surface3, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: item.color, fontFamily: "Mitr" }}>฿{fmt(Math.round(item.val))}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: T.surface2, border: `2px solid ${T.gold}`, borderRadius: 16, padding: "20px 24px", marginTop: 24, boxShadow: `0 0 24px ${T.gold}15` }}>
          <div style={{ fontFamily: "Mitr", fontSize: 14, fontWeight: 600, color: T.gold, marginBottom: 12 }}>📊 คาดการณ์เงินกองทุนเมื่อเกษียณ (อีก {pvd.yearsLeft} ปี)</div>
          <div style={{ background: T.surface3, borderRadius: 12, padding: "16px 20px", textAlign: "center", border: `1.5px solid ${T.gold}`, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>💰 มูลค่ากองทุนรวมเมื่อเกษียณ</div>
            <div style={{ fontSize: "clamp(22px,5vw,34px)", fontWeight: 800, color: T.gold, fontFamily: "Mitr" }}>฿{fmt(Math.round(total))}</div>
          </div>
          <button onClick={() => onSave(Math.round(total))} style={{ width: "100%", padding: "14px", background: `linear-gradient(135deg, ${T.gold}, #c0922a)`, border: "none", borderRadius: 12, color: "#000", fontFamily: "Mitr", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✅ ใช้ค่านี้ ฿{fmt(Math.round(total))} ในแผนเกษียณ</button>
        </div>
      </div>
    );
  };

  // ── SSO Calculator (dark) ──
  const SSOCalculator = ({ onSave, data: sso, onChange: setSsoExt }) => {
    const ss = (k, v) => { let n = parseFloat(v); if (isNaN(n)) n = 0; setSsoExt(p => ({ ...p, [k]: Math.round(n) })); };
    const base = Math.min(sso.salary, 15000);
    const mc = base * 0.05;
    const totalContrib = mc * 12 * sso.yearsContrib;
    const extraYears = Math.max(0, sso.yearsContrib - 15);
    const mp = sso.yearsContrib >= 15 ? Math.min(base * 0.20 + base * 0.015 * extraYears, 7500) : 0;
    const lumpsum = sso.yearsContrib < 15 ? totalContrib * 1.5 : 0;
    const pct = ((sso.yearsContrib - 1) / 39) * 100;
    const SsoSalaryBox = ({ sso, ss }) => {
      const ref = useRef(null);
      useEffect(() => {
        if (ref.current && document.activeElement !== ref.current)
          ref.current.value = sso.salary > 0 ? new Intl.NumberFormat("th-TH").format(sso.salary) : "";
      }, [sso.salary]);
      return (
        <div style={{ background: T.surface3, border: `1.5px solid ${T.green}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <input ref={ref} type="text" inputMode="numeric" placeholder="0" defaultValue=""
            onFocus={e => { e.target.value = sso.salary > 0 ? String(sso.salary) : ""; e.target.select(); }}
            onBlur={e => { const n = parseInt(e.target.value.replace(/[^0-9]/g,"") || "0", 10); ss("salary", n); e.target.value = n > 0 ? new Intl.NumberFormat("th-TH").format(n) : ""; }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, fontFamily: "Mitr", textAlign: "right", color: T.text }} />
          <span style={{ fontSize: 11, color: T.green2, fontWeight: 700 }}>บาท/เดือน</span>
        </div>
      );
    };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 11, fontWeight: 600, cursor: "pointer", color: T.textSub }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 11, color: T.green2, fontWeight: 600 }}>🛡️ คำนวณประกันสังคม ม.33 ชราภาพ</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "Mitr", fontSize: 11, color: T.green2, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>ข้อมูลการส่งสมทบ</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 2 }}>เงินเดือน (ใช้คำนวณฐาน)</div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 8 }}>ฐานสูงสุดที่ใช้คำนวณ 15,000 บาท</div>
              <SsoSalaryBox sso={sso} ss={ss} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>จำนวนปีที่ส่งสมทบ</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, position: "relative", height: 32, display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: T.border2 }}>
                    <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: sso.yearsContrib >= 15 ? T.green2 : T.orange, borderRadius: 2 }} />
                  </div>
                  <input type="range" min={1} max={40} step={1} value={sso.yearsContrib} onChange={e => ss("yearsContrib", e.target.value)}
                    style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }} />
                </div>
                <div onClick={() => openSubPicker("ปีที่ส่งสมทบ", sso.yearsContrib, 1, 40, 1, "ปี", v => ss("yearsContrib", v))}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: T.surface3, border: `1.5px solid ${sso.yearsContrib >= 15 ? T.green : T.orange}30`, borderRadius: 10, padding: "7px 12px", minWidth: 80, cursor: "pointer", userSelect: "none" }}>
                  <span style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.text }}>{sso.yearsContrib}</span>
                  <span style={{ fontSize: 13, color: sso.yearsContrib >= 15 ? T.green2 : T.orange, fontWeight: 700 }}>ปี</span>
                </div>
              </div>
            </div>
            <div style={{ background: `${T.green3}30`, border: `1px solid ${T.green3}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: T.textSub, lineHeight: 1.9 }}>
              📌 <strong style={{ color: T.green2 }}>เงื่อนไขชราภาพ:</strong><br/>
              • ส่งสมทบ <strong style={{ color: T.text }}>≥ 15 ปี</strong> → ได้บำนาญรายเดือนตลอดชีวิต<br/>
              • ส่งสมทบ <strong style={{ color: T.text }}>{"<"} 15 ปี</strong> → ได้เงินก้อนคืนพร้อมดอกเบี้ย
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "Mitr", fontSize: 11, color: T.green2, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>ผลการคำนวณ</div>
            {sso.yearsContrib >= 15 ? (
              <div style={{ background: T.surface2, border: `2px solid ${T.green}`, borderRadius: 12, padding: "16px 18px", textAlign: "center", boxShadow: `0 0 24px ${T.green}20` }}>
                <div style={{ fontSize: 13, color: T.green2, fontWeight: 600, marginBottom: 8 }}>🎉 ส่งครบ 15 ปี → ได้บำนาญ/เดือน</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>฿{fmt(Math.round(mp))}</div>
              </div>
            ) : (
              <div style={{ background: T.surface2, border: `2px solid ${T.orange}`, borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: T.orange, fontWeight: 600, marginBottom: 8 }}>⚠️ ยังไม่ครบ 15 ปี → ได้เงินก้อนคืน</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>฿{fmt(Math.round(lumpsum))}</div>
                <div style={{ fontSize: 13, color: T.textSub, marginTop: 4 }}>ต้องส่งอีก {15 - sso.yearsContrib} ปี จึงจะได้บำนาญ</div>
              </div>
            )}
          </div>
        </div>
        {sso.yearsContrib >= 15 && (
          <button onClick={() => onSave(Math.round(mp))} style={{ width: "100%", marginTop: 24, padding: "14px", background: `linear-gradient(135deg, ${T.green}, ${T.green3})`, border: "none", borderRadius: 12, color: "#000", fontFamily: "Mitr", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            ✅ ใช้ค่านี้ ฿{fmt(Math.round(mp))}/เดือน ในแผนเกษียณ
          </button>
        )}
      </div>
    );
  };

  // ── Severance Calculator (dark) ──
  const SeveranceCalculator = ({ onSave, data: sv, onChange: setSvExt }) => {
    const ss = (k, v) => setSvExt(p => ({ ...p, [k]: parseFloat(v) || 0 }));
    const getDays = y => { if (y < 1/3) return 0; if (y < 1) return 30; if (y < 3) return 90; if (y < 6) return 180; if (y < 10) return 240; if (y < 20) return 300; return 400; };
    const days = getDays(sv.yearsWorked), daily = sv.lastSalary / 30, gross = daily * days;
    const ex = Math.min(gross, 600000), d1 = 7000 * sv.yearsWorked;
    const afterEx = Math.max(0, gross - ex), afterD1 = Math.max(0, afterEx - d1), d2 = afterD1 * 0.5;
    const taxable = Math.max(0, afterD1 - d2);
    const calcTax = inc => { const br = [[300000,.05],[200000,.10],[250000,.15],[250000,.20],[1e6,.25],[3e6,.30],[Infinity,.35]]; let t=0,r=inc; for(const [l,rt] of br){if(r<=0)break;t+=Math.min(r,l)*rt;r-=l;} return t; };
    const totalTax = calcTax(taxable);
    const net = gross - totalTax;
    const pct = ((sv.yearsWorked - 1) / 39) * 100;
    const steps = [
      { no: 1, label: "เงินชดเชยทั้งหมด", val: gross, desc: `${days} วัน × ฿${fmt(Math.round(daily))}/วัน` },
      { no: 2, label: "หักยกเว้นภาษี (สูงสุด 600,000)", val: -ex, desc: "ตามกฎหมายใหม่" },
      { no: 3, label: "หักค่าใช้จ่ายส่วนแรก", val: -d1, desc: `7,000 × ${sv.yearsWorked} ปี` },
      { no: 4, label: "หักค่าใช้จ่ายส่วนที่สอง (50%)", val: -d2, desc: "50% ของยอดที่เหลือ" },
      { no: 5, label: "เงินได้สุทธิเพื่อคิดภาษี", val: taxable, desc: "", highlight: true },
      { no: 6, label: "ภาษีที่ต้องจ่าย", val: -totalTax, desc: "อัตราขั้นบันได ยื่นแบบแยก" },
    ];
    const SvSalaryBox = ({ sv, ss }) => {
      const ref = useRef(null);
      useEffect(() => {
        if (ref.current && document.activeElement !== ref.current)
          ref.current.value = sv.lastSalary > 0 ? new Intl.NumberFormat("th-TH").format(sv.lastSalary) : "";
      }, [sv.lastSalary]);
      return (
        <div style={{ background: T.surface3, border: `1.5px solid ${T.orange}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <input ref={ref} type="text" inputMode="numeric" placeholder="0" defaultValue=""
            onFocus={e => { e.target.value = sv.lastSalary > 0 ? String(sv.lastSalary) : ""; e.target.select(); }}
            onBlur={e => { const n = parseInt(e.target.value.replace(/[^0-9]/g,"") || "0", 10); ss("lastSalary", n); e.target.value = n > 0 ? new Intl.NumberFormat("th-TH").format(n) : ""; }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, fontFamily: "Mitr", textAlign: "right", color: T.text }} />
          <span style={{ fontSize: 11, color: T.orange, fontWeight: 700 }}>บาท</span>
        </div>
      );
    };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 11, fontWeight: 600, cursor: "pointer", color: T.textSub }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 11, color: T.orange, fontWeight: 600 }}>💼 คำนวณเงินชดเชยหักภาษี</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <div style={{ fontFamily: "Mitr", fontSize: 11, color: T.orange, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>ข้อมูลการทำงาน</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>เงินเดือนสุดท้าย</div>
              <SvSalaryBox sv={sv} ss={ss} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>อายุงาน <span style={{ color: T.textSub, fontWeight: 400 }}>({days} วัน)</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, position: "relative", height: 32, display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: T.border2 }}>
                    <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: T.orange, borderRadius: 2 }} />
                  </div>
                  <input type="range" min={1} max={40} step={1} value={sv.yearsWorked} onChange={e => ss("yearsWorked", e.target.value)}
                    style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }} />
                </div>
                <div onClick={() => openSubPicker("อายุงาน", sv.yearsWorked, 1, 40, 1, "ปี", v => ss("yearsWorked", v))}
                  style={{ display: "flex", alignItems: "center", gap: 5, background: T.surface3, border: `1.5px solid ${T.orange}30`, borderRadius: 10, padding: "7px 12px", minWidth: 80, cursor: "pointer", userSelect: "none" }}>
                  <span style={{ flex: 1, textAlign: "right", fontSize: 13, fontWeight: 700, color: T.text }}>{sv.yearsWorked}</span>
                  <span style={{ fontSize: 13, color: T.orange, fontWeight: 700 }}>ปี</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "Mitr", fontSize: 11, color: T.orange, fontWeight: 600, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>ขั้นตอนการคำนวณ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s, i) => (
                <div key={i} style={{ background: s.highlight ? T.surface2 : T.surface3, border: `1px solid ${s.highlight ? T.orange : T.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, color: T.textSub }}><strong style={{ color: T.orange }}>ขั้นที่ {s.no}</strong> {s.label}</div>
                    {s.desc && <div style={{ fontSize: 11, color: T.textMuted }}>{s.desc}</div>}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "Mitr", color: s.val < 0 ? T.red : s.highlight ? T.orange : T.text }}>
                    {s.val < 0 ? "-" : ""}฿{fmt(Math.abs(Math.round(s.val)))}
                  </div>
                </div>
              ))}
              <div style={{ background: T.surface2, border: `2px solid ${T.orange}`, borderRadius: 12, padding: "16px 18px", textAlign: "center", boxShadow: `0 0 20px ${T.orange}20` }}>
                <div style={{ fontSize: 13, color: T.orange, fontWeight: 600, marginBottom: 6 }}>💰 เงินชดเชยสุทธิหลังหักภาษี</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>฿{fmt(Math.round(net))}</div>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => onSave(Math.round(net))} style={{ width: "100%", marginTop: 24, padding: "14px", background: `linear-gradient(135deg, ${T.orange}, ${T.orange2})`, border: "none", borderRadius: 12, color: "#000", fontFamily: "Mitr", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          ✅ ใช้ค่านี้ ฿{fmt(Math.round(net))} ในแผนเกษียณ
        </button>
      </div>
    );
  };

  // ── Assets Calculator (dark) ──
  const AssetsCalculator = ({ onSave, data: assets, onChange: setAssetsExt }) => {
    const sa = (k, v) => setAssetsExt(p => ({ ...p, [k]: parseFloat(v) || 0 }));
    const list = [
      { key:"rmf", rk:"rmfRet", label:"กองทุน RMF", emoji:"🏦", color:"#2980b9", badge:"ลดหย่อนภาษีได้", badgeColor:"#2980b9" },
      { key:"esg", rk:"esgRet", label:"กองทุน ESG", emoji:"🌱", color:"#16a085", badge:"ลดหย่อนภาษีได้", badgeColor:"#16a085" },
      { key:"ssf", rk:"ssfRet", label:"กองทุน SSF", emoji:"🛡️", color:"#8e44ad", badge:"ลดหย่อนภาษีได้", badgeColor:"#8e44ad" },
      { key:"stocks", rk:"stocksRet", label:"หุ้น", emoji:"📊", color:T.red, badge:"ความเสี่ยงสูง", badgeColor:T.red },
      { key:"gold", rk:"goldRet", label:"ทองคำ", emoji:"🥇", color:T.gold, badge:"ความเสี่ยงปานกลาง", badgeColor:T.gold },
      { key:"crypto", rk:"cryptoRet", label:"คริปโทเคอร์เรนซี", emoji:"₿", color:T.orange2, badge:"ความเสี่ยงสูงมาก", badgeColor:T.red },
      { key:"other", rk:"otherRet", label:"อสังหาริมทรัพย์ / อื่นๆ", emoji:"🏠", color:"#7f8c8d", badge:"ความเสี่ยงต่ำ", badgeColor:T.green },
    ];
    const yrs = form.retireAge - form.currentAge;
    const totalFV = list.reduce((s, a) => s + assets[a.key] * Math.pow(1 + assets[a.rk] / 100, yrs), 0);
    const totalCurrent = list.reduce((s, a) => s + assets[a.key], 0);
    const AR = ({ item }) => {
      const valRef = useRef(null);
      useEffect(() => {
        if (valRef.current && document.activeElement !== valRef.current)
          valRef.current.value = assets[item.key] > 0 ? new Intl.NumberFormat("th-TH").format(assets[item.key]) : "";
      }, [assets[item.key]]);
      const fv = assets[item.key] * Math.pow(1 + assets[item.rk] / 100, yrs);
      const pct = (assets[item.rk] / 30) * 100;
      return (
        <div style={{ marginBottom: 12, background: T.surface2, border: `1px solid ${assets[item.key] > 0 ? item.color + "50" : T.border}`, borderRadius: 14, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text, fontFamily: "Mitr" }}>{item.label}</div>
            </div>
            <div style={{ background: item.badgeColor + "20", border: `1px solid ${item.badgeColor}40`, borderRadius: 20, padding: "2px 8px", fontSize: 13, fontWeight: 700, color: item.badgeColor }}>{item.badge}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>มูลค่าปัจจุบัน</div>
              <div style={{ background: T.surface3, border: `1px solid ${assets[item.key] > 0 ? item.color : T.border2}`, borderRadius: 8, padding: "8px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                <input ref={valRef} type="text" inputMode="numeric" placeholder="0" defaultValue=""
                  onFocus={e => { e.target.value = assets[item.key] > 0 ? String(assets[item.key]) : ""; e.target.select(); }}
                  onBlur={e => { const n = parseInt(e.target.value.replace(/[^0-9]/g,"") || "0", 10); sa(item.key, n); e.target.value = n > 0 ? new Intl.NumberFormat("th-TH").format(n) : ""; }}
                  onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 11, fontWeight: 700, fontFamily: "Mitr", textAlign: "right", color: T.text }} />
                <span style={{ fontSize: 11, color: item.color, fontWeight: 700 }}>฿</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>ผลตอบแทน/ปี</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, position: "relative", height: 26, display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: 3, borderRadius: 2, background: T.border2 }}>
                    <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: item.color, borderRadius: 2 }} />
                  </div>
                  <input type="range" min={0} max={30} step={0.1} value={assets[item.rk]} onChange={e => sa(item.rk, e.target.value)}
                    style={{ position: "absolute", width: "100%", height: 26, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }} />
                  <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:${item.color};border:2px solid ${T.surface};box-shadow:0 0 6px ${item.color}60;cursor:pointer;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
                </div>
                <div onClick={() => openSubPicker(`${item.label}`, assets[item.rk], 0, 30, 0.5, "%", v => sa(item.rk, v))}
                  style={{ background: T.surface3, border: `1px solid ${item.color}30`, borderRadius: 6, padding: "4px 8px", cursor: "pointer", minWidth: 50, textAlign: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.color }}>{parseFloat(assets[item.rk]).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          {assets[item.key] > 0 && (
            <div style={{ marginTop: 8, background: item.color + "12", borderRadius: 6, padding: "5px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: T.textSub }}>FV เมื่อเกษียณ</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: item.color, fontFamily: "Mitr" }}>฿{fmt(Math.round(fv))}</span>
            </div>
          )}
        </div>
      );
    };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: `1px solid ${T.border2}`, background: T.surface2, fontSize: 11, fontWeight: 600, cursor: "pointer", color: T.textSub }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 11, color: "#2980b9", fontWeight: 600 }}>📊 สินทรัพย์และการลงทุน</h2>
        </div>
        {list.map(item => <AR key={item.key} item={item} />)}
        <div style={{ background: T.surface2, border: `2px solid #2980b9`, borderRadius: 16, padding: "18px", marginTop: 8, boxShadow: `0 0 24px #2980b920` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: T.surface3, borderRadius: 10, padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>มูลค่าปัจจุบัน</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: "Mitr" }}>฿{fmt(Math.round(totalCurrent))}</div>
            </div>
            <div style={{ background: T.surface3, borderRadius: 10, padding: "12px", textAlign: "center", border: `1.5px solid #2980b9` }}>
              <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>มูลค่าเมื่อเกษียณ (FV)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#2980b9", fontFamily: "Mitr" }}>฿{fmt(Math.round(totalFV))}</div>
            </div>
          </div>
          <button onClick={() => onSave(Math.round(totalFV))} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#2980b9,#1a5f8a)", border: "none", borderRadius: 12, color: "white", fontFamily: "Mitr", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            ✅ ใช้มูลค่าเมื่อเกษียณ ฿{fmt(Math.round(totalFV))}
          </button>
        </div>
      </div>
    );
  };

  const readyColor = result ? (result.readyPercent >= 100 ? T.green2 : result.readyPercent >= 70 ? T.gold : T.red) : T.orange;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "Sarabun, sans-serif", color: T.text }}>
      <WheelPicker />
      <SubPicker />
      {showAnimation && <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", width: "100%", height: "100%" }} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Mitr:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a !important; }
        .sec-title { font-family: 'Mitr', sans-serif; font-size: 13px; font-weight: 700; color: ${T.orange}; margin: 24px 0 14px; padding-bottom: 8px; border-bottom: 1px solid ${T.border}; letter-spacing: 0.5px; text-transform: uppercase; }
        .tab-btn { padding: 8px 12px; border-radius: 10px 10px 0 0; border: 1px solid ${T.border}; border-bottom: none; background: ${T.surface2}; color: ${T.textSub}; cursor: pointer; font-family: 'Sarabun'; font-size: 12px; font-weight: 600; white-space: nowrap; transition: all 0.15s; }
        .tab-btn.active { background: ${T.surface}; color: ${T.orange}; border-color: ${T.orange}; border-bottom: 2px solid ${T.surface}; margin-bottom: -2px; font-weight: 800; }
        .tab-btn:hover:not(.active) { color: ${T.text}; border-color: ${T.border2}; }
        .card-sm { background: ${T.surface2}; border: 1px solid ${T.border}; border-radius: 12px; padding: 12px 14px; }
        @media (max-width:640px) { .two-col { grid-template-columns: 1fr !important; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: ${T.surface}; } ::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 2px; }
        input::placeholder { color: ${T.textMuted}; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 16px 0", borderBottom: `1px solid ${T.border}`, background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: T.orange, textTransform: "uppercase", marginBottom: 6, opacity: 0.8 }}>🌅 วางแผนชีวิตหลังเกษียณ</div>
              <h1 style={{ fontFamily: "Mitr", fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 700, lineHeight: 1.2 }}>
                <span style={{ color: T.text }}>แผนเกษียณสุข </span>
                <span style={{ background: `linear-gradient(90deg, ${T.orange}, ${T.green2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Happy Retirement</span>
              </h1>
            </div>
            <button onClick={() => setHelpOpen(true)} style={{ padding: "7px 14px", borderRadius: 8, background: T.surface2, border: `1px solid ${T.border2}`, color: T.textSub, cursor: "pointer", fontFamily: "Mitr", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>❓ วิธีใช้</button>
          </div>
          {result && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: T.surface2, borderRadius: 10, display: "flex", alignItems: "center", gap: 12, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 11, color: T.textSub, fontWeight: 600, whiteSpace: "nowrap" }}>ความพร้อม</span>
              <div style={{ flex: 1, height: 6, background: T.border2, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${Math.min(result.readyPercent,100)}%`, height: "100%", background: `linear-gradient(90deg, ${readyColor}80, ${readyColor})`, borderRadius: 3, boxShadow: `0 0 8px ${readyColor}60`, transition: "width 0.5s" }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: readyColor, fontFamily: "Mitr", whiteSpace: "nowrap" }}>{result.readyPercent.toFixed(1)}%</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            {[{id:"input",label:"📋 กรอกข้อมูล"},{id:"income",label:"💰 รายได้"},{id:"pvd",label:"🏦 PVD"},{id:"sso",label:"🛡️ ประกันสังคม"},{id:"severance",label:"💼 เงินชดเชย"},{id:"assets",label:"📊 สินทรัพย์"},...(result ? [{id:"result",label:"📊 ผลวิเคราะห์"},{id:"milestone",label:"🎯 แผนทุก 5 ปี"}] : [])].map(t => (
              <button key={t.id} className={`tab-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 60px" }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderTop: `2px solid ${T.orange}`, borderRadius: "0 16px 16px 16px", padding: "20px 16px 24px" }}>

          {activeTab === "income" && <IncomeCalculator data={incomeData} onChange={setIncomeData} onSave={(val, sal) => { set("monthlyIncome", val); set("incomeSalary", sal); setActiveTab("input"); }} />}
          {activeTab === "pvd" && <PVDCalculator data={pvdData} onChange={setPvdData} onSave={val => { set("providentFund", val); setActiveTab("input"); }} />}
          {activeTab === "sso" && <SSOCalculator data={ssoData} onChange={setSsoData} onSave={val => { set("monthlySSOPension", val); setActiveTab("input"); }} />}
          {activeTab === "severance" && <SeveranceCalculator data={svData} onChange={setSvData} onSave={val => { set("severancePay", val); setActiveTab("input"); }} />}
          {activeTab === "assets" && <AssetsCalculator data={assetsData} onChange={setAssetsData} onSave={val => { set("otherLumpsum", val); setActiveTab("input"); }} />}

          {/* ── Input Tab ── */}
          {activeTab === "input" && (
            <div>
              <div className="sec-title" style={{ marginTop: 0 }}>ข้อมูลส่วนตัว</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }} className="two-col">
                <InputField label="อายุปัจจุบัน" name="currentAge" min={20} max={70} step={1} unit="ปี" />
                <InputField label="อายุเกษียณ" name="retireAge" min={40} max={75} step={1} unit="ปี" />
                <InputField label="อายุขัยที่คาดไว้" name="lifeExpectancy" min={60} max={100} step={1} unit="ปี" />
              </div>

              <div className="sec-title">รายได้และการออม</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }} className="two-col">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 10 }}>รายได้ต่อเดือน</div>
                  {form.monthlyIncome > 0 ? (
                    <div style={{ background: T.surface2, border: `1.5px solid ${T.orange}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, boxShadow: `0 0 16px ${T.orange}15` }}>
                      <div style={{ fontSize: 11, color: T.textSub, marginBottom: 4 }}>รายได้รวม</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>฿{fmt(form.monthlyIncome)}/เดือน</div>
                    </div>
                  ) : <div style={{ background: T.surface2, border: `1px dashed ${T.border2}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: T.textMuted, fontSize: 13 }}>ยังไม่ได้กรอก</div>}
                  <button onClick={() => setActiveTab("income")} style={{ width: "100%", padding: "11px", background: `linear-gradient(135deg, ${T.orange}, ${T.orange2})`, border: "none", borderRadius: 10, color: "#000", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "Mitr" }}>💰 กรอกข้อมูลรายได้</button>
                </div>
                <InputField label="อัตราการออม" name="monthlySavingRate" min={0} max={80} unit="%" note={`= ฿${fmt((form.monthlyIncome * form.monthlySavingRate) / 100)}/เดือน`} />
                <SavingsBox />
                <ExpenseBox />
              </div>

              <div className="sec-title">การลงทุน</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }} className="two-col">
                <InputField label="ผลตอบแทนก่อนเกษียณ" name="expectedReturn" min={0} max={20} step={0.5} unit="% ต่อปี" />
                <InputField label="ผลตอบแทนหลังเกษียณ" name="retireReturn" min={0} max={20} step={0.5} unit="% ต่อปี" color={T.green2} />
                <InputField label="อัตราเงินเฟ้อ" name="inflationRate" min={0} max={10} step={0.5} unit="% ต่อปี" color={T.gold} />
              </div>

              {/* เงินก้อน */}
              <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px", marginTop: 16 }}>
                <div className="sec-title" style={{ marginTop: 0, color: T.gold, borderColor: T.border }}>เงินก้อนเมื่อเกษียณ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="two-col">
                  {[{label:"สินทรัพย์และการลงทุน",key:"otherLumpsum",tab:"assets",btn:"📊 กรอกสินทรัพย์",color:"#2980b9"},{label:"กองทุนสำรองเลี้ยงชีพ",key:"providentFund",tab:"pvd",btn:"🧮 คำนวณ PVD",color:T.gold},{label:"เงินชดเชย",key:"severancePay",tab:"severance",btn:"🧮 คำนวณ",color:T.orange}].map(item => (
                    <div key={item.key}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>{item.label}</div>
                      {form[item.key] > 0 ? <div style={{ background: T.surface3, border: `1.5px solid ${item.color}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}><div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontFamily: "Mitr" }}>฿{fmt(form[item.key])}</div></div> : <div style={{ background: T.surface3, border: `1px dashed ${T.border2}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8, textAlign: "center", color: T.textMuted, fontSize: 12 }}>ไม่บังคับ</div>}
                      <button onClick={() => setActiveTab(item.tab)} style={{ width: "100%", padding: "9px", background: item.color, border: "none", borderRadius: 8, color: item.color === T.gold ? "#000" : "white", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Mitr" }}>{item.btn}</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* รายรับหลังเกษียณ */}
              <div style={{ background: T.surface2, border: `1px solid ${T.green3}`, borderRadius: 14, padding: "18px", marginTop: 12 }}>
                <div className="sec-title" style={{ marginTop: 0, color: T.green2, borderColor: T.green3 }}>รายรับรายเดือนหลังเกษียณ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px" }} className="two-col">
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>ประกันสังคม ชราภาพ</div>
                    {form.monthlySSOPension > 0 ? <div style={{ background: T.surface3, border: `1.5px solid ${T.green}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}><div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>฿{fmt(form.monthlySSOPension)}/เดือน</div></div> : <div style={{ background: T.surface3, border: `1px dashed ${T.border2}`, borderRadius: 10, padding: "10px 14px", marginBottom: 8, textAlign: "center", color: T.textMuted, fontSize: 12 }}>ไม่บังคับ</div>}
                    <button onClick={() => setActiveTab("sso")} style={{ width: "100%", padding: "9px", background: T.green3, border: `1px solid ${T.green}`, borderRadius: 8, color: T.green2, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "Mitr" }}>🧮 คำนวณประกันสังคม</button>
                  </div>
                  <InputField label="บำนาญ/เดือน" name="monthlyPension" min={0} max={100000} step={500} unit="บาท" color={T.green2} />
                  <InputField label="ประกันบำนาญ/เดือน" name="monthlyInsurancePension" min={0} max={100000} step={500} unit="บาท" color={T.green2} />
                </div>
              </div>

              <button onClick={calculate} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg, ${T.orange}, ${T.orange2})`, border: "none", borderRadius: 14, color: "#000", fontFamily: "Mitr", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 24, boxShadow: `0 4px 20px ${T.orange}40`, letterSpacing: 0.5 }}>🔍 คำนวณแผนเกษียณ</button>
            </div>
          )}

          {/* ── Result Tab ── */}
          {activeTab === "result" && result && (
            <div>
              {/* Timeline */}
              <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", marginBottom: 20, height: 38 }}>
                <div style={{ flex: result.yearsToRetire, background: `linear-gradient(135deg, ${T.green3}, ${T.green})`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 600 }}>สะสมทรัพย์ {result.yearsToRetire} ปี</div>
                <div style={{ flex: result.yearsInRetirement, background: `linear-gradient(135deg, ${T.orange2}, ${T.orange})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: 13, fontWeight: 600 }}>เกษียณ {result.yearsInRetirement} ปี</div>
              </div>

              {/* Inflation + Required card */}
              <div style={{ background: T.surface2, border: `1px solid ${T.gold}30`, borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
                {/* Row 1: expense inflation arrow */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, marginBottom: 4 }}>รายจ่ายวันนี้</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>฿{fmt(form.retireMonthlyExpense)}</div>
                    <div style={{ fontSize: 11, color: T.textSub }}>ต่อเดือน</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>เงินเฟ้อ {form.inflationRate}%</div>
                    <div style={{ fontSize: 13, color: T.gold }}>→</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 4 }}>รายจ่ายตอนเกษียณ</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: T.gold }}>฿{fmt(result.retireMonthlyExpenseAdj)}</div>
                    <div style={{ fontSize: 11, color: T.textSub }}>ต่อเดือน</div>
                  </div>
                </div>

                {/* Row 2: gross total + net required */}
                <div style={{ fontSize: 11, color: T.textSub, fontWeight: 700, marginBottom: 10 }}>💼 เงินที่ต้องใช้หลังเกษียณ (ปรับเงินเฟ้อแล้ว)</div>

                {/* Gross total — full width, prominent */}
                <div style={{ background: T.surface3, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${T.gold}`, boxShadow: `0 0 16px ${T.gold}18`, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 6 }}>💰 รายจ่ายรวมทั้งหมด {result.yearsInRetirement} ปี <span style={{ color: T.textMuted, fontWeight: 400 }}>(ไม่หักค่าใดๆ)</span></div>
                      <div style={{ fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, color: T.gold, fontFamily: "Mitr", lineHeight: 1 }}>฿{fmt(result.grossTotalExpense)}</div>
                      <div style={{ fontSize: 11, color: T.textSub, marginTop: 6 }}>รายจ่าย {result.yearsInRetirement} ปี · ปรับเงินเฟ้อ {form.inflationRate}%/ปี ทบรายเดือน</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 3 }}>เฉลี่ย/ปี</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: T.gold, fontFamily: "Mitr" }}>฿{fmt(Math.round(result.grossTotalExpense / result.yearsInRetirement))}</div>
                      <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>เฉลี่ย/เดือน</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, fontFamily: "Mitr" }}>฿{fmt(Math.round(result.grossTotalExpense / result.yearsInRetirement / 12))}</div>
                    </div>
                  </div>
                </div>

                {/* Net required after passive income */}
                <div style={{ display: "grid", gridTemplateColumns: result.totalMonthlyIncome > 0 ? "1fr 1fr" : "1fr", gap: 8 }}>
                  {result.totalMonthlyIncome > 0 && (
                    <div style={{ background: T.surface3, borderRadius: 10, padding: "10px 12px", border: `1px solid ${T.green3}` }}>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 4 }}>📥 หักรายรับ (บำนาญ/ประกันสังคม)</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>-฿{fmt(Math.round(result.totalMonthlyIncome * 12 * result.yearsInRetirement))}</div>
                      <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>{result.yearsInRetirement} ปี × ฿{fmt(result.totalMonthlyIncome)}/เดือน</div>
                    </div>
                  )}
                  <div style={{ background: T.surface3, borderRadius: 10, padding: "10px 12px", border: `1.5px solid ${T.green2}`, boxShadow: `0 0 10px ${T.green2}18` }}>
                    <div style={{ fontSize: 13, color: T.green2, fontWeight: 700, marginBottom: 4 }}>🎯 ต้องเตรียมในพอร์ตลงทุน</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>฿{fmt(result.requiredNestEgg)}</div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>ลงทุน {form.retireReturn}% หลังเกษียณ</div>
                  </div>
                </div>
              </div>

              {result.totalMonthlyIncome > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, color: T.textSub, marginBottom: 8, fontWeight: 700 }}>📥 รายรับประจำหลังเกษียณ</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="card-sm" style={{ borderTop: `2px solid ${T.green2}` }}>
                      <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>รวมรายรับ/เดือน</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>฿{fmt(result.totalMonthlyIncome)}</div>
                    </div>
                    <div className="card-sm" style={{ borderTop: `2px solid ${T.orange}` }}>
                      <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>ต้องดึงจากเงินออม/เดือน</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>฿{fmt(result.netMonthlyNeed)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3 summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 14 }}>
                <div className="card-sm" style={{ borderTop: `2px solid ${T.orange}` }}>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>เงินออมที่จะมี ณ เกษียณ</div>
                  <div style={{ fontSize: "clamp(13px,2vw,20px)", fontWeight: 800, fontFamily: "Mitr", color: T.orange }}>฿{fmt(result.totalAtRetirement)}</div>
                </div>
                <div className="card-sm" style={{ borderTop: `2px solid ${T.green2}` }}>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>เงินที่ต้องเตรียม</div>
                  <div style={{ fontSize: "clamp(13px,2vw,20px)", fontWeight: 800, fontFamily: "Mitr", color: T.green2 }}>฿{fmt(result.requiredNestEgg)}</div>
                </div>
                <div className="card-sm" style={{ borderTop: `2px solid ${result.surplus >= 0 ? T.green2 : T.red}` }}>
                  <div style={{ fontSize: 11, color: T.textSub, marginBottom: 6 }}>{result.surplus >= 0 ? "✅ ส่วนเกิน" : "⚠️ ขาดเงิน"}</div>
                  <div style={{ fontSize: "clamp(13px,2vw,20px)", fontWeight: 800, color: result.surplus >= 0 ? T.green2 : T.red, fontFamily: "Mitr" }}>{result.surplus >= 0 ? "+" : ""}฿{fmt(result.surplus)}</div>
                </div>
              </div>

              {/* Legacy */}
              <div style={{ background: result.legacyAmount > 0 ? `${T.green3}40` : `${T.orange2}15`, border: `2px solid ${result.legacyAmount > 0 ? T.green2 : T.red}`, borderRadius: 16, padding: "20px", marginBottom: 18, boxShadow: `0 4px 20px ${result.legacyAmount > 0 ? T.green : T.red}20` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 40 }}>{result.legacyAmount > 0 ? "🎁" : "⚠️"}</div>
                  <div>
                    <div style={{ fontFamily: "Mitr", fontSize: 14, fontWeight: 700, color: result.legacyAmount > 0 ? T.green2 : T.red }}>{result.legacyAmount > 0 ? "💚 มีเงินเหลือเป็นมรดก" : "🔴 เงินหมดก่อนสิ้นอายุขัย"}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>อายุ {form.lifeExpectancy} ปี</div>
                  </div>
                </div>
                <div style={{ background: T.surface3, borderRadius: 12, padding: "16px", textAlign: "center", border: `1px solid ${result.legacyAmount > 0 ? T.green : T.red}30` }}>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(24px,5vw,38px)", fontWeight: 800, color: result.legacyAmount > 0 ? T.green2 : T.red }}>
                    {result.legacyAmount > 0 ? `฿${fmt(result.legacyAmount)}` : "เงินหมดก่อนกำหนด"}
                  </div>
                </div>
              </div>

              {/* Saving recommendation */}
              <div style={{ background: T.surface2, border: `1px solid ${result.surplus >= 0 ? T.green : T.orange}`, borderRadius: 14, padding: "18px", marginBottom: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: result.surplus >= 0 ? T.green2 : T.orange, marginBottom: 14, fontFamily: "Mitr" }}>{result.surplus >= 0 ? "✅ แผนการออมเพียงพอแล้ว!" : "📌 เป้าหมายที่ต้องออม"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }} className="two-col">
                  <div className="card-sm"><div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, marginBottom: 6 }}>💳 ออมอยู่ตอนนี้</div><div style={{ fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, fontFamily: "Mitr", color: T.text }}>฿{fmt(result.monthlyContribution)}</div><div style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}>{form.monthlySavingRate}%/เดือน</div></div>
                  <div className="card-sm" style={{ border: `1px solid ${result.surplus >= 0 ? T.green : T.red}` }}><div style={{ fontSize: 11, color: T.textSub, fontWeight: 600, marginBottom: 6 }}>🎯 ต้องออม</div><div style={{ fontSize: "clamp(16px,3vw,22px)", fontWeight: 800, color: result.surplus >= 0 ? T.green2 : T.red, fontFamily: "Mitr" }}>฿{fmt(result.requiredMonthlySaving)}</div><div style={{ fontSize: 11, color: T.textSub, marginTop: 3 }}>{result.requiredSavingRate.toFixed(1)}%/เดือน</div></div>
                </div>
              </div>


              {/* Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 14, marginBottom: 18 }} className="two-col">
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 14px" }}>
                  <div style={{ fontFamily: "Mitr", fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 8 }}>📈 รายรับ · ค่าใช้จ่าย · เงินออม</div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={result.projection} margin={{ top: 5, right: 8, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.orange} stopOpacity={0.3}/><stop offset="95%" stopColor={T.orange} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.green2} stopOpacity={0.2}/><stop offset="95%" stopColor={T.green2} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.red} stopOpacity={0.2}/><stop offset="95%" stopColor={T.red} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                      <XAxis dataKey="อายุ" stroke={T.textSub} tick={{ fontSize: 13, fill: T.textSub }} tickFormatter={v => `${v}ปี`} />
                      <YAxis stroke={T.textSub} tick={{ fontSize: 13, fill: T.textSub }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                      <Tooltip contentStyle={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.text }} labelFormatter={v => `อายุ ${v} ปี`} formatter={(v, name) => [`฿${fmt(v)}`, name]} />
                      <Area type="monotone" dataKey="เงินออม" stroke={T.orange} strokeWidth={2} fill="url(#gSav)" dot={false} />
                      <Area type="monotone" dataKey="รายรับ" stroke={T.green2} strokeWidth={1.5} fill="url(#gInc)" dot={false} />
                      <Area type="monotone" dataKey="ค่าใช้จ่าย" stroke={T.red} strokeWidth={1.5} fill="url(#gExp)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 14px" }}>
                  <div style={{ fontFamily: "Mitr", fontSize: 11, fontWeight: 600, color: T.text, marginBottom: 10 }}>🥧 สัดส่วนแหล่งที่มา</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={result.pie} cx="50%" cy="44%" outerRadius={78} dataKey="value" label={({percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {result.pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontSize: 13, color: T.textSub }} />
                      <Tooltip contentStyle={{ background: T.surface2, border: `1px solid ${T.border}`, fontSize: 12 }} formatter={v => `฿${fmt(v)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Banner */}
              {result.surplus >= 0 ? (
                <div ref={bannerRef} style={{ marginTop: 24, borderRadius: 20, background: `linear-gradient(135deg, ${T.green3}60, ${T.green3}30)`, border: `2px solid ${T.green2}`, textAlign: "center", padding: "32px 20px", boxShadow: `0 8px 32px ${T.green}25`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${T.green}15 0%, transparent 60%)` }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: 60, marginBottom: 8, filter: `drop-shadow(0 0 20px ${T.green2})` }}>🏆</div>
                    <div style={{ fontFamily: "Mitr", fontSize: "clamp(20px,4vw,30px)", fontWeight: 700, color: T.green2, marginBottom: 6 }}>ขอแสดงความยินดี! 🎉</div>
                    <div style={{ fontFamily: "Mitr", fontSize: "clamp(14px,2.5vw,18px)", color: T.green, marginBottom: 18 }}>คุณบรรลุเป้าหมายการเกษียณแล้ว!</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, maxWidth: 440, margin: "0 auto 16px" }}>
                      {[{emoji:"💰",label:"มีเงินออม",val:`฿${fmt(result.totalAtRetirement)}`},{emoji:"✅",label:"ส่วนเกิน",val:`+฿${fmt(result.surplus)}`},{emoji:"📅",label:"เกษียณอายุ",val:`${form.retireAge} ปี`}].map((item,i) => (
                        <div key={i} style={{ background: `${T.green}15`, border: `1px solid ${T.green}40`, borderRadius: 12, padding: "12px 8px" }}>
                          <div style={{ fontSize: 13, marginBottom: 3 }}>{item.emoji}</div>
                          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 3 }}>{item.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: T.green, lineHeight: 1.8 }}>
                      มีเงินเหลือเป็นมรดก <strong style={{ color: T.green2, fontSize: 15 }}>฿{fmt(result.legacyAmount)}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div ref={bannerRef} style={{ marginTop: 24, borderRadius: 20, background: `linear-gradient(135deg, ${T.orange2}20, ${T.orange}10)`, border: `2px solid ${T.orange}`, textAlign: "center", padding: "32px 20px", boxShadow: `0 8px 32px ${T.orange}20`, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${T.orange}12 0%, transparent 60%)` }} />
                  <div style={{ position: "relative" }}>
                    <div style={{ fontSize: 60, marginBottom: 8, filter: `drop-shadow(0 0 20px ${T.orange})` }}>💪</div>
                    <div style={{ fontFamily: "Mitr", fontSize: "clamp(20px,4vw,30px)", fontWeight: 700, color: T.orange, marginBottom: 6 }}>อย่าหยุดพยายาม!</div>
                    <div style={{ fontFamily: "Mitr", fontSize: "clamp(14px,2.5vw,18px)", color: T.orange2, marginBottom: 18 }}>ทุกบาทที่ออมวันนี้มีค่า</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8, maxWidth: 440, margin: "0 auto 16px" }}>
                      {[{emoji:"⚠️",label:"ขาดเงิน",val:`-฿${fmt(Math.abs(result.surplus))}`,color:T.red},{emoji:"📈",label:"ต้องออมเพิ่ม",val:`฿${fmt(Math.round(result.savingGap))}/เดือน`,color:T.orange},{emoji:"⏳",label:"เวลาที่เหลือ",val:`${result.yearsToRetire} ปี`,color:T.text}].map((item,i) => (
                        <div key={i} style={{ background: `${T.orange}10`, border: `1px solid ${T.orange}30`, borderRadius: 12, padding: "12px 8px" }}>
                          <div style={{ fontSize: 13, marginBottom: 3 }}>{item.emoji}</div>
                          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 3 }}>{item.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: item.color, fontFamily: "Mitr" }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: T.orange, lineHeight: 1.8 }}>
                      เพิ่มการออมอีกเพียง <strong style={{ color: T.orange, fontSize: 15 }}>฿{fmt(Math.round(result.savingGap))}/เดือน</strong><br/>
                      ภายใน {result.yearsToRetire} ปี คุณทำได้แน่นอน! 🌟
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Milestone Tab ── */}
          {activeTab === "milestone" && result && (
            <div>
              {/* Header summary strip */}
              <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                {[
                  { label: "ออมต่อเดือน", val: `฿${fmt(result.monthlyContribution)}`, color: T.orange },
                  { label: "ผลตอบแทน", val: `${form.expectedReturn}% / ปี`, color: T.gold },
                  { label: "เวลาสะสม", val: `${result.yearsToRetire} ปี`, color: T.green2 },
                  { label: "เป้าเกษียณ", val: `฿${fmt(result.requiredNestEgg)}`, color: T.green2 },
                ].map((s, i) => (
                  <div key={i} style={{ flex: "1 1 100px", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: T.textSub, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: s.color, fontFamily: "Mitr" }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Timeline track */}
              <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 12px", marginBottom: 16, overflowX: "auto" }}>
                <div style={{ fontSize: 11, color: T.textSub, marginBottom: 12, fontWeight: 700 }}>เส้นทางเงินออม</div>
                <div style={{ position: "relative", minWidth: 320 }}>
                  <div style={{ position: "absolute", top: 16, left: 16, right: 16, height: 2, background: T.border2, borderRadius: 1 }} />
                  <div style={{ position: "absolute", top: 16, left: 16, height: 2, background: `linear-gradient(90deg, ${T.green2}, ${T.orange})`, borderRadius: 1, width: "100%", opacity: 0.25 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: T.green2, border: `2px solid ${T.bg}`, boxShadow: `0 0 8px ${T.green2}` }} />
                      <div style={{ fontSize: 10, color: T.green2, fontWeight: 700, whiteSpace: "nowrap" }}>อายุ {form.currentAge} ปี</div>
                      <div style={{ fontSize: 11, color: T.textSub }}>เริ่มต้น</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>฿{fmt(form.currentSavings)}</div>
                    </div>
                    {result.milestones.map((m, i) => {
                      const ok = m.ทำได้จริง >= m.เป้าหมายออม;
                      const dc = ok ? T.green2 : T.orange;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: dc, border: `2px solid ${T.bg}`, boxShadow: `0 0 8px ${dc}80` }} />
                          <div style={{ fontSize: 10, color: dc, fontWeight: 700, whiteSpace: "nowrap" }}>{m.อายุ}</div>
                          <div style={{ fontSize: 11, color: T.textSub }}>{ok ? "✅" : "⚠️"}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: dc, whiteSpace: "nowrap" }}>฿{m.ทำได้จริง >= 1e6 ? `${(m.ทำได้จริง/1e6).toFixed(1)}M` : fmt(m.ทำได้จริง)}</div>
                        </div>
                      );
                    })}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: result.surplus >= 0 ? T.green2 : T.red, border: `2px solid ${T.bg}`, boxShadow: `0 0 12px ${result.surplus >= 0 ? T.green2 : T.red}` }} />
                      <div style={{ fontSize: 10, color: result.surplus >= 0 ? T.green2 : T.red, fontWeight: 700, whiteSpace: "nowrap" }}>อายุ {form.retireAge} ปี 🏁</div>
                      <div style={{ fontSize: 11, color: T.textSub }}>เกษียณ</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: result.surplus >= 0 ? T.green2 : T.red, whiteSpace: "nowrap" }}>฿{result.totalAtRetirement >= 1e6 ? `${(result.totalAtRetirement/1e6).toFixed(1)}M` : fmt(result.totalAtRetirement)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail cards per 5-year interval */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {result.milestones.map((m, i) => {
                  const ok = m.ทำได้จริง >= m.เป้าหมายออม;
                  const gap = m.ทำได้จริง - m.เป้าหมายออม;
                  const pct = Math.min((m.ทำได้จริง / m.เป้าหมายออม) * 100, 100);
                  const dc = ok ? T.green2 : T.orange;
                  return (
                    <div key={i} style={{ background: T.surface2, border: `1px solid ${ok ? T.green : T.border}`, borderRadius: 14, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: `1px solid ${T.border}`, background: ok ? `${T.green3}35` : `${T.orange}0d` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: dc, boxShadow: `0 0 6px ${dc}` }} />
                          <span style={{ fontFamily: "Mitr", fontSize: 11, fontWeight: 700, color: dc }}>อายุ {m.ageRaw} ปี</span>
                          <span style={{ fontSize: 11, color: T.textSub }}>อีก {m.yearsFromNow} ปี · เหลือ {m.yearsLeft} ปีก่อนเกษียณ</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: ok ? T.green2 : T.red }}>{ok ? "+" : ""}฿{fmt(gap)}</span>
                          <div style={{ background: ok ? `${T.green}22` : `${T.red}18`, border: `1px solid ${ok ? T.green : T.red}40`, borderRadius: 20, padding: "2px 9px", fontSize: 10, fontWeight: 700, color: ok ? T.green2 : T.red, whiteSpace: "nowrap" }}>{ok ? "✅ ตามเป้า" : "⚠️ ต่ำกว่าเป้า"}</div>
                        </div>
                      </div>

                      {/* 4 stat cells */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: T.border }}>
                        <div style={{ background: T.surface2, padding: "11px 14px" }}>
                          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>💰 เงินต้นที่ออมสะสม</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: "Mitr" }}>฿{fmt(m.totalSavedSoFar)}</div>
                          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>รวมเงินออมเดิม + ออมใหม่</div>
                        </div>
                        <div style={{ background: T.surface2, padding: "11px 14px" }}>
                          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>📈 กำไรจากผลตอบแทน</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>+฿{fmt(Math.abs(m.investmentGain))}</div>
                          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>ดอกเบี้ยทบต้น {form.expectedReturn}% / ปี</div>
                        </div>
                        <div style={{ background: T.surface3, padding: "11px 14px" }}>
                          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>🏦 มูลค่ารวม ณ อายุนี้</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: dc, fontFamily: "Mitr" }}>฿{fmt(m.ทำได้จริง)}</div>
                          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>เงินต้น + กำไรจากการลงทุน</div>
                        </div>
                        <div style={{ background: T.surface3, padding: "11px 14px" }}>
                          <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>🎯 เป้าหมาย ณ จุดนี้</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: T.text, fontFamily: "Mitr" }}>฿{fmt(m.เป้าหมายออม)}</div>
                          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 2 }}>ต้องมีเพื่อเกษียณตามแผน</div>
                        </div>
                      </div>

                      {/* Progress + advice */}
                      <div style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, color: T.textSub }}>ความคืบหน้าสู่เป้าหมาย</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: dc }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: 7, background: T.border2, borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: ok ? `linear-gradient(90deg, ${T.green}70, ${T.green2})` : `linear-gradient(90deg, ${T.orange2}70, ${T.orange})`, borderRadius: 4, boxShadow: `0 0 8px ${dc}50`, transition: "width 0.6s" }} />
                        </div>
                        {!ok ? (
                          <div style={{ marginTop: 8, background: `${T.orange}12`, border: `1px solid ${T.orange}30`, borderRadius: 8, padding: "7px 10px", fontSize: 11, color: T.orange, lineHeight: 1.7 }}>
                            ⚡ ต้องออมเพิ่มอีก <strong>฿{fmt(Math.round((m.เป้าหมายออม - m.ทำได้จริง) / ((m.yearsLeft > 0 ? m.yearsLeft : 1) * 12)))}</strong> /เดือน ในช่วง {m.yearsLeft} ปีข้างหน้า จึงจะถึงเป้าวันเกษียณ
                          </div>
                        ) : (
                          <div style={{ marginTop: 8, background: `${T.green}12`, border: `1px solid ${T.green}30`, borderRadius: 8, padding: "7px 10px", fontSize: 11, color: T.green2, lineHeight: 1.7 }}>
                            ✨ เกินเป้า ฿{fmt(gap)} · ยังคงออมต่อเนื่องเพื่อสร้างส่วนเกินเมื่อเกษียณ
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Final retirement card */}
                <div style={{ background: result.surplus >= 0 ? `${T.green3}35` : `${T.orange2}12`, border: `2px solid ${result.surplus >= 0 ? T.green2 : T.orange}`, borderRadius: 14, overflow: "hidden", boxShadow: `0 4px 20px ${result.surplus >= 0 ? T.green : T.orange}20` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${result.surplus >= 0 ? T.green3 : T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>🏁</span>
                      <span style={{ fontFamily: "Mitr", fontSize: 11, fontWeight: 700, color: result.surplus >= 0 ? T.green2 : T.orange }}>อายุ {form.retireAge} ปี — วันเกษียณ</span>
                    </div>
                    <div style={{ background: result.surplus >= 0 ? `${T.green}22` : `${T.red}18`, border: `1px solid ${result.surplus >= 0 ? T.green : T.red}40`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700, color: result.surplus >= 0 ? T.green2 : T.red, whiteSpace: "nowrap" }}>
                      {result.surplus >= 0 ? "🎉 เพียงพอแล้ว!" : "⚠️ ยังไม่ถึงเป้า"}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, background: T.border }}>
                    <div style={{ background: T.surface2, padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>💰 เงินออมที่จะมี</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.orange, fontFamily: "Mitr" }}>฿{fmt(result.totalAtRetirement)}</div>
                    </div>
                    <div style={{ background: T.surface2, padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>🎯 เงินที่ต้องเตรียม</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.green2, fontFamily: "Mitr" }}>฿{fmt(result.requiredNestEgg)}</div>
                    </div>
                    <div style={{ background: T.surface2, padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>{result.surplus >= 0 ? "✅ ส่วนเกิน" : "⚠️ ขาดเงิน"}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: result.surplus >= 0 ? T.green2 : T.red, fontFamily: "Mitr" }}>{result.surplus >= 0 ? "+" : ""}฿{fmt(result.surplus)}</div>
                    </div>
                    <div style={{ background: T.surface2, padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 5 }}>🎁 เงินมรดก อายุ {form.lifeExpectancy} ปี</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: result.legacyAmount > 0 ? T.green2 : T.red, fontFamily: "Mitr" }}>{result.legacyAmount > 0 ? `฿${fmt(result.legacyAmount)}` : "เงินหมด"}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: T.textSub }}>ความพร้อมรวม</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: result.surplus >= 0 ? T.green2 : T.red }}>{result.readyPercent.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 7, background: T.border2, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(result.readyPercent, 100)}%`, background: result.surplus >= 0 ? `linear-gradient(90deg, ${T.green}70, ${T.green2})` : `linear-gradient(90deg, ${T.orange2}70, ${T.orange})`, borderRadius: 4, boxShadow: `0 0 8px ${result.surplus >= 0 ? T.green2 : T.orange}60` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setHelpOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto", padding: "22px", boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ fontFamily: "Mitr", fontSize: 11, fontWeight: 600, color: T.orange }}>❓ วิธีการใช้งาน</div>
              <button onClick={() => setHelpOpen(false)} style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${T.border2}`, background: T.surface2, cursor: "pointer", fontSize: 13, color: T.textSub }}>×</button>
            </div>
            {[
              { tab: "📋 กรอกข้อมูล", color: T.orange, steps: ["กรอกอายุ, เงินออม, รายได้, รายจ่าย", "กรอกผลตอบแทนและเงินเฟ้อ", "กด 'คำนวณแผนเกษียณ'"] },
              { tab: "💰 รายได้", color: T.orange, steps: ["กรอกเงินเดือน, ค่าตอบแทน, โบนัส", "กด ✅ เพื่อใช้ในแผน"] },
              { tab: "🏦 กองทุนสำรองเลี้ยงชีพ", color: T.gold, steps: ["กรอกอัตรานำส่ง, ยอดสะสม", "กด ✅ เพื่อใช้ค่า FV"] },
              { tab: "🛡️ ประกันสังคม", color: T.green2, steps: ["กรอกเงินเดือน, ปีที่ส่งสมทบ", "ส่งครบ 15 ปี = ได้บำนาญ"] },
              { tab: "💼 เงินชดเชย", color: T.orange, steps: ["กรอกเงินเดือนและอายุงาน", "กด ✅ เพื่อใช้ค่าสุทธิ"] },
              { tab: "📊 สินทรัพย์", color: "#2980b9", steps: ["กรอกมูลค่าแต่ละสินทรัพย์", "กด ✅ เพื่อใช้มูลค่า FV"] },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 12, padding: "12px 14px", background: T.surface2, borderRadius: 10, borderLeft: `2px solid ${s.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 5 }}>{s.tab}</div>
                {s.steps.map((step, j) => <div key={j} style={{ fontSize: 13, color: T.textSub, lineHeight: 1.8 }}>{j+1}. {step}</div>)}
              </div>
            ))}
            <div style={{ background: `${T.green3}40`, border: `1px solid ${T.green3}`, borderRadius: 10, padding: "12px", marginTop: 6, fontSize: 13, color: T.textSub, lineHeight: 1.8 }}>
              💡 เริ่มจาก <span style={{ color: T.green2 }}>รายได้ → ประกันสังคม → PVD → เงินชดเชย → สินทรัพย์</span> แล้วกลับมากดคำนวณ
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
