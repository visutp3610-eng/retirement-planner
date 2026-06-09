import { useState, useCallback, useRef, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";

const fmt = (n) => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
const COLORS = ["#f4a261", "#2a9d8f", "#e76f51", "#264653", "#e9c46a", "#a8dadc"];

export default function RetirementPlanner() {
  const [form, setForm] = useState({
    currentAge: 30,
    retireAge: 60,
    lifeExpectancy: 85,
    currentSavings: 500000,
    monthlyIncome: 15000,
    incomeSalary: 15000, // เงินเดือนอย่างเดียว
    monthlySavingRate: 0,
    retireMonthlyExpense: 20000,
    expectedReturn: 1,
    inflationRate: 3,
    // รายรับรายเดือนหลังเกษียณ
    monthlyPension: 0,
    monthlySSOPension: 0,
    monthlyInsurancePension: 0,
    // ก้อนเงินครั้งเดียว
    providentFund: 0,
    severancePay: 0,
    otherLumpsum: 0,
  });

  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("input");
  const [incomeData, setIncomeData] = useState({ salary: 15000, compensation: 0, bonusMonths: 0, other: 0 });
  const [helpOpen, setHelpOpen] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState("firework"); // firework | stars
  const bannerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [picker, setPicker] = useState(null); // { name, min, max, step, unit, label }
  const [pickerVal, setPickerVal] = useState(0);

  const set = (k, v) => {
    const ageFields = ["currentAge", "retireAge", "lifeExpectancy"];
    const num = parseFloat(v) || 0;
    setForm((f) => ({ ...f, [k]: ageFields.includes(k) ? Math.round(num) : num }));
  };

  // Trigger animation when banner scrolls into view
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

  // Canvas animation
  useEffect(() => {
    if (!showAnimation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];

    if (animationType === "firework") {
      // Create multiple firework bursts
      const colors = ["#f4a261","#2a9d8f","#e9c46a","#e76f51","#a8dadc","#ff6b9d","#c77dff","#48cae4"];
      for (let b = 0; b < 8; b++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height * 0.6 + 50;
        const color = colors[b % colors.length];
        for (let i = 0; i < 60; i++) {
          const angle = (Math.PI * 2 * i) / 60;
          const speed = 3 + Math.random() * 6;
          particles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1, size: 3 + Math.random() * 4,
            color, gravity: 0.12, delay: b * 12,
            type: "firework",
          });
        }
      }
    } else {
      // Rain drops - sad rain 12000 lines straight down
      for (let i = 0; i < 12000; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -Math.random() * canvas.height * 2,
          vy: 8 + Math.random() * 10,
          vx: 0,
          length: 8 + Math.random() * 16,
          alpha: 0.15 + Math.random() * 0.35,
          width: 0.5 + Math.random() * 0.8,
          type: "rain",
        });
      }
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame++;

      // Grey overlay for sad rain
      if (animationType === "stars") {
        ctx.fillStyle = `rgba(80,80,80,${Math.min(frame / 80, 0.25)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      particles = particles.filter(p => p.type === "rain" || p.type === "cloud" || p.alpha > 0.02);

      particles.forEach(p => {
        if (p.type === "firework") {
          if (frame < p.delay) return;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.vx *= 0.98;
          p.alpha -= 0.016;
          p.size *= 0.98;
        } else if (p.type === "rain") {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.strokeStyle = "#999999";
          ctx.lineWidth = p.width;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.length);
          ctx.stroke();
          ctx.restore();
          p.y += p.vy;
          if (p.y > canvas.height) {
            p.y = -Math.random() * 20;
            p.x = Math.random() * canvas.width;
          }
        }
      });

      if (frame < 280) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Fade out
        let fadeFrame = 0;
        const fadeOut = () => {
          fadeFrame++;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (fadeFrame < 30) {
            requestAnimationFrame(fadeOut);
          } else {
            setShowAnimation(false);
          }
        };
        requestAnimationFrame(fadeOut);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showAnimation, animationType]);

  const calculate = useCallback(() => {
    const {
      currentAge, retireAge, lifeExpectancy, currentSavings,
      monthlyIncome, monthlySavingRate, retireMonthlyExpense,
      expectedReturn, inflationRate,
      monthlyPension, monthlySSOPension, monthlyInsurancePension,
      providentFund, severancePay, otherLumpsum,
    } = form;

    const yearsToRetire = retireAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retireAge;
    const monthlyContribution = (monthlyIncome * monthlySavingRate) / 100;
    const realReturn = (expectedReturn - inflationRate) / 100;
    const monthlyReturn = expectedReturn / 100 / 12;
    const months = yearsToRetire * 12;

    // FV ของเงินออมปัจจุบัน + ออมรายเดือน + ก้อนเงินครั้งเดียว
    const fvCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetire);
    const fvContributions = monthlyContribution * ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn);
    const lumpSum = providentFund + severancePay + otherLumpsum;
    const totalAtRetirement = fvCurrentSavings + fvContributions + lumpSum;

    // รายจ่ายสุทธิหลังเกษียณ (ปรับเงินเฟ้อ) หักรายรับรายเดือนที่ได้
    const retireExpenseAdj = retireMonthlyExpense * Math.pow(1 + inflationRate / 100, yearsToRetire);
    const totalMonthlyIncome = monthlyPension + monthlySSOPension + monthlyInsurancePension;
    // รายรับก็ต้องปรับเงินเฟ้อบางส่วน (สมมติบำนาญ fixed, ปรับ 50%)
    const netMonthlyNeed = Math.max(0, retireExpenseAdj - totalMonthlyIncome);

    // Required nest egg สำหรับส่วนที่ต้องดึงจากเงินออม
    const r = realReturn / 12;
    const n = yearsInRetirement * 12;
    const requiredNestEgg = netMonthlyNeed > 0
      ? (r > 0 ? netMonthlyNeed * ((1 - Math.pow(1 + r, -n)) / r) : netMonthlyNeed * n)
      : 0;

    const surplus = totalAtRetirement - requiredNestEgg;
    const readyPercent = requiredNestEgg > 0 ? Math.min((totalAtRetirement / requiredNestEgg) * 100, 200) : 200;

    // คำนวณว่าต้องออมเดือนละเท่าไรถึงจะถึงเป้า
    // requiredNestEgg = fvCurrentSavings + lumpSum + PMT * ((1+r)^n - 1)/r * (1+r)
    const targetFromSaving = Math.max(0, requiredNestEgg - fvCurrentSavings - lumpSum);
    const requiredMonthlySaving = months > 0 && monthlyReturn > 0
      ? targetFromSaving / (((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn) * (1 + monthlyReturn))
      : targetFromSaving / months;
    const requiredSavingRate = monthlyIncome > 0 ? (requiredMonthlySaving / monthlyIncome) * 100 : 0;
    const savingGap = requiredMonthlySaving - monthlyContribution; // บวก=ต้องออมเพิ่ม, ลบ=ออมเกินแล้ว

    // milestone: เงินออมเป้าทุก 5 ปี
    const milestones = [];
    for (let y = 5; y <= yearsToRetire; y += 5) {
      const age = currentAge + y;
      const mv = monthlyReturn;
      const m = y * 12;
      const fvS = currentSavings * Math.pow(1 + expectedReturn / 100, y);
      const fvC = monthlyContribution * ((Math.pow(1 + mv, m) - 1) / mv) * (1 + mv);
      milestones.push({ อายุ: `${age} ปี`, เป้าหมายออม: Math.round(fvS + fvC) });
    }

    // Projection yearly
    const projection = [];
    let balance = currentSavings;
    for (let y = 0; y <= yearsToRetire + yearsInRetirement; y++) {
      const age = currentAge + y;
      if (y < yearsToRetire) {
        balance = balance * (1 + expectedReturn / 100) + monthlyContribution * 12;
      } else if (y === yearsToRetire) {
        balance = balance * (1 + expectedReturn / 100) + monthlyContribution * 12 + lumpSum;
      } else {
        const inflExp = retireMonthlyExpense * Math.pow(1 + inflationRate / 100, y) * 12;
        const annualPassive = totalMonthlyIncome * 12;
        const net = Math.max(0, inflExp - annualPassive);
        balance = Math.max(0, balance * (1 + expectedReturn / 100) - net);
      }
      projection.push({ อายุ: age, เงินออม: Math.round(balance) });
    }

    // Pie: แหล่งที่มาเงินเกษียณ
    const pie = [
      { name: "เงินออมปัจจุบัน (FV)", value: Math.round(fvCurrentSavings) },
      { name: "ออมรายเดือน (FV)", value: Math.round(fvContributions) },
      { name: "กองทุนสำรอง/เงินชดเชย", value: lumpSum },
      { name: "บำนาญ (PV)", value: Math.round(monthlyPension * 12 * yearsInRetirement) },
      { name: "ประกันสังคม (PV)", value: Math.round(monthlySSOPension * 12 * yearsInRetirement) },
      { name: "ประกันบำนาญ (PV)", value: Math.round(monthlyInsurancePension * 12 * yearsInRetirement) },
    ].filter((d) => d.value > 0);

    setResult({
      totalAtRetirement, requiredNestEgg, surplus, readyPercent,
      monthlyContribution, retireExpenseAdj, netMonthlyNeed, totalMonthlyIncome,
      requiredMonthlySaving, requiredSavingRate, savingGap,
      projection, pie, milestones, yearsToRetire, yearsInRetirement,
    });
    setActiveTab("result");
  }, [form]);

  const openPicker = (name, min, max, step, unit, label) => {
    setPickerVal(form[name]);
    setPicker({ name, min, max, step, unit, label });
  };

  const InputField = ({ label, name, min, max, step, unit, note, color }) => {
    const isInt = step === 1;
    const autoStep = isInt ? 1 : (step !== undefined ? step : (max - min) / 1000);
    const thumbColor = color || "var(--accent)";
    const pct = ((form[name] - min) / (max - min)) * 100;
    const applyVal = (raw) => {
      let n = parseFloat(raw);
      if (isNaN(n) || raw === "") { set(name, 0); return; }
      if (isInt) n = Math.round(n);
      set(name, Math.min(max, Math.max(0, n)));
    };
    return (
      <div className="input-group">
        <div className="input-label">
          <span>{label}</span>
          {note && <span className="input-note">{note}</span>}
        </div>
        <div className="input-row">
          {/* Slider */}
          <div style={{ flex: 1, position: "relative", height: 32, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--warm2)" }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: thumbColor, borderRadius: 2 }} />
            </div>
            <input
              type="range" min={min} max={max} step={autoStep} value={form[name]}
              onChange={(e) => applyVal(e.target.value)}
              style={{
                position: "absolute", width: "100%", height: 32,
                WebkitAppearance: "none", appearance: "none",
                background: "transparent", outline: "none",
                cursor: "pointer", margin: 0, padding: 0,
                touchAction: "manipulation",
              }}
            />
          </div>
          {/* Value box — กดเพื่อเปิด picker */}
          <div
            className="input-value-box"
            onClick={() => openPicker(name, min, max, step, unit, label)}
            style={{ cursor: "pointer", userSelect: "none", minWidth: 110 }}
          >
            <span style={{ flex: 1, textAlign: "right", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
              {isInt ? form[name] : fmt(form[name])}
            </span>
            <span className="unit" style={color ? { color } : {}}>{unit}</span>
          </div>
        </div>
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 24px; height: 24px; border-radius: 50%;
            background: ${thumbColor};
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            border: 3px solid white;
            cursor: pointer;
          }
          input[type=range]:active::-webkit-slider-thumb {
            width: 28px; height: 28px;
          }
          input[type=range]::-webkit-slider-runnable-track { background: transparent; }
        `}</style>
      </div>
    );
  };

  /* ===== Wheel Picker Modal ===== */
  const WheelPicker = () => {
    if (!picker) return null;
    const { name, min, max, step, unit, label } = picker;
    const isInt = step === 1;
    const autoStep = isInt ? 1 : (step !== undefined ? step : (max - min) / 1000);

    // generate items for integer pickers, use slider for float
    const items = [];
    if (isInt) {
      for (let i = min; i <= max; i++) items.push(i);
    }

    const confirmPicker = () => {
      set(name, Math.max(0, pickerVal));
      setPicker(null);
    };

    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }} onClick={() => setPicker(null)}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: "100%", maxWidth: 480,
          background: "white", borderRadius: "24px 24px 0 0",
          padding: "0 0 32px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
        }}>
          {/* Handle bar */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} />
          </div>

          {/* Title */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr" }}>{label}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPicker(null)} style={{ padding: "8px 18px", borderRadius: 10, border: "2px solid var(--warm2)", background: "white", fontSize: 15, fontWeight: 600, color: "var(--muted)", cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={confirmPicker} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "var(--accent)", fontSize: 15, fontWeight: 600, color: "white", cursor: "pointer" }}>ตกลง</button>
            </div>
          </div>

          {/* Current value display */}
          <div style={{ textAlign: "center", padding: "8px 24px", background: "var(--warm1)", margin: "0 24px 16px", borderRadius: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", fontFamily: "Mitr" }}>
              {isInt ? pickerVal : fmt(pickerVal)}
            </span>
            <span style={{ fontSize: 18, color: "var(--muted)", marginLeft: 8 }}>{unit}</span>
          </div>

          {isInt ? (
            /* Scroll wheel for integers */
            <div style={{ position: "relative", height: 220, overflow: "hidden", margin: "0 24px" }}>
              <div style={{
                position: "absolute", top: "50%", left: 0, right: 0,
                height: 44, transform: "translateY(-50%)",
                background: "rgba(192,114,42,0.1)", border: "2px solid var(--accent)",
                borderRadius: 10, pointerEvents: "none", zIndex: 2,
              }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, white, transparent)", zIndex: 1, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, white, transparent)", zIndex: 1, pointerEvents: "none" }} />
              <div style={{ overflowY: "scroll", height: "100%", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
                ref={(el) => {
                  if (el) {
                    const idx = items.indexOf(Math.round(pickerVal));
                    el.scrollTop = idx * 44;
                    el.onscroll = () => {
                      const i = Math.round(el.scrollTop / 44);
                      const v = items[Math.max(0, Math.min(items.length - 1, i))];
                      if (v !== undefined) setPickerVal(v);
                    };
                  }
                }}
              >
                <div style={{ height: 88 }} />
                {items.map((v) => (
                  <div key={v} onClick={() => setPickerVal(v)}
                    style={{
                      height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: v === pickerVal ? 22 : 18,
                      fontWeight: v === pickerVal ? 800 : 400,
                      color: v === pickerVal ? "var(--accent)" : "var(--muted)",
                      scrollSnapAlign: "center", cursor: "pointer", transition: "all 0.1s",
                    }}
                  >{v} {unit}</div>
                ))}
                <div style={{ height: 88 }} />
              </div>
            </div>
          ) : (
            /* Number keypad for money/percent fields */
            <div style={{ padding: "0 20px 8px" }}>
              {/* Big editable input */}
              <div style={{ background: "var(--warm1)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, textAlign: "right", border: "2px solid var(--accent)" }}>
                <input
                  type="number"
                  value={pickerVal}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (e.target.value === "" || e.target.value === "-") { setPickerVal(0); return; }
                    if (!isNaN(v)) setPickerVal(Math.min(max, Math.max(0, v)));
                  }}
                  autoFocus
                  inputMode="numeric"
                  style={{
                    width: "100%", background: "transparent", border: "none", outline: "none",
                    fontSize: 28, fontWeight: 800, color: "var(--accent)",
                    fontFamily: "Mitr", textAlign: "right",
                  }}
                />
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                  ช่วง: {fmt(min)} – {fmt(max)} {unit}
                </div>
              </div>
              {/* Quick preset buttons + stepper */}
              {(() => {
                // field-specific config
                const cfg = {
                  monthlyIncome:          { step: 1000,  presets: [15000,20000,30000,50000,80000,100000] },
                  monthlySavingRate:      { step: 1,     presets: [5,10,15,20,30] },
                  retireMonthlyExpense:   { step: 1000,  presets: [10000,15000,20000,30000,50000] },
                  expectedReturn:         { step: 0.5,   presets: [0,3,5,7,10] },
                  inflationRate:          { step: 1,     presets: [1,2,3,4,5] },
                  providentFund:          { step: 5000,  presets: [0,100000,500000,1000000,5000000,10000000] },
                  severancePay:           { step: 5000,  presets: [0,50000,100000,200000,500000] },
                  otherLumpsum:           { step: 10000, presets: [0,100000,500000,1000000,3000000] },
                  currentSavings:         { step: 10000, presets: [0,100000,500000,1000000,2000000] },
                  monthlyPension:         { step: 500,   presets: [0,3000,5000,10000,20000] },
                  monthlySSOPension:      { step: 100,   presets: [0,1000,3000,5000,7500] },
                  monthlyInsurancePension:{ step: 500,   presets: [0,2000,5000,10000,20000] },
                };
                const c = cfg[name] || { step: step || 1, presets: [] };
                const s = c.step;
                return (
                  <div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>เลือกค่าด่วน</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      {c.presets.filter(p => p >= min && p <= max).map(p => (
                        <button key={p} onClick={() => setPickerVal(p)}
                          style={{
                            padding: "8px 14px", borderRadius: 10,
                            border: pickerVal === p ? "2px solid var(--accent)" : "2px solid var(--warm2)",
                            background: pickerVal === p ? "rgba(192,114,42,0.1)" : "white",
                            fontSize: 14, fontWeight: 600,
                            color: pickerVal === p ? "var(--accent)" : "var(--text)",
                            cursor: "pointer",
                          }}
                        >{fmt(p)}</button>
                      ))}
                    </div>
                    {/* +/- stepper */}
                    <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>ปรับค่า</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button onClick={() => setPickerVal(v => Math.max(0, parseFloat((v - s).toFixed(4))))}
                        style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid #ffd5d5", background: "#fff5f5", fontSize: 20, fontWeight: 800, color: "var(--red)", cursor: "pointer" }}>
                        − {fmt(s)}
                      </button>
                      <button onClick={() => setPickerVal(v => Math.min(max, parseFloat((v + s).toFixed(4))))}
                        style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid #d5f5e3", background: "#f0fff4", fontSize: 20, fontWeight: 800, color: "var(--green)", cursor: "pointer" }}>
                        + {fmt(s)}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const customTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="tt-label">อายุ {label} ปี</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>฿{fmt(p.value)}</p>
        ))}
      </div>
    );
  };


  const IncomeCalculator = ({ onSave, data, onChange }) => {
    const inc = data;
    const si = (k, v) => onChange(p => ({ ...p, [k]: parseFloat(v) || 0 }));

    const bonusMonthly = (inc.salary * inc.bonusMonths) / 12;
    const totalMonthly = inc.salary + inc.compensation + bonusMonthly + inc.other;

    const incomeList = [
      { key: "salary",       label: "เงินเดือน",     emoji: "💼", color: "var(--accent)",  desc: "เงินเดือนประจำ" },
      { key: "compensation", label: "ค่าตอบแทน",    emoji: "🏆", color: "var(--accent2)", desc: "ค่าคอม / OT / เบี้ยเลี้ยง" },
      { key: "other",        label: "รายได้อื่นๆ",  emoji: "💡", color: "var(--blue)",    desc: "ฟรีแลนซ์ / ธุรกิจ ฯลฯ" },
    ];

    const NumInc = ({ label, field, unit, desc, color }) => {
      const [editing, setEditing] = useState(false);
      const [raw, setRaw] = useState(inc[field] > 0 ? String(inc[field]) : "");
      const displayVal = !editing && inc[field] > 0
        ? new Intl.NumberFormat("th-TH").format(inc[field]) : raw;
      return (
        <div style={{ marginBottom: 16, background: "white", border: `1px solid ${inc[field] > 0 ? color + "60" : "var(--warm2)"}`, borderRadius: 12, padding: "14px", boxSizing: "border-box" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>{desc}</div>
          <div style={{ background: "var(--warm1)", border: `1.5px solid ${inc[field] > 0 ? color : "var(--warm2)"}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="text" inputMode="numeric" pattern="[0-9]*"
              value={displayVal} placeholder="0"
              onFocus={() => { setEditing(true); setRaw(inc[field] > 0 ? String(inc[field]) : ""); }}
              onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setEditing(false); const n = parseInt(raw || "0", 10); setRaw(n > 0 ? String(n) : ""); si(field, n); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color, fontWeight: 700, flexShrink: 0 }}>{unit}</span>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid var(--warm2)", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 18, color: "var(--text)", fontWeight: 600 }}>💰 กรอกข้อมูลรายได้</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>รายได้ประจำ</div>
            <NumInc label="เงินเดือน" field="salary" unit="บาท/เดือน" desc="เงินเดือนประจำก่อนหักภาษี" color="var(--accent)" />
            <NumInc label="ค่าตอบแทน / OT / เบี้ยเลี้ยง" field="compensation" unit="บาท/เดือน" desc="รายได้เพิ่มเติมนอกเหนือเงินเดือน" color="var(--accent2)" />
            <NumInc label="รายได้อื่นๆ" field="other" unit="บาท/เดือน" desc="ฟรีแลนซ์ / ธุรกิจ / เช่า ฯลฯ" color="var(--blue)" />
          </div>

          <div>
            <div className="section-title" style={{ marginTop: 0 }}>โบนัส</div>
            <div style={{ marginBottom: 16, background: "white", border: `1px solid ${inc.bonusMonths > 0 ? "var(--gold)60" : "var(--warm2)"}`, borderRadius: 12, padding: "14px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>🎁 โบนัสประจำปี</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>จำนวนเดือนที่ได้รับโบนัส</div>
              <div style={{ background: "var(--warm1)", border: `1.5px solid ${inc.bonusMonths > 0 ? "var(--gold)" : "var(--warm2)"}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <input type="number" inputMode="decimal" step="0.5" min="0" max="12" value={inc.bonusMonths}
                  onChange={e => si("bonusMonths", e.target.value)}
                  style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
                />
                <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700 }}>เดือน/ปี</span>
              </div>
              {inc.bonusMonths > 0 && (
                <div style={{ fontSize: 12, color: "var(--muted)", background: "var(--warm1)", borderRadius: 8, padding: "6px 10px" }}>
                  = ฿{fmt(Math.round(inc.salary * inc.bonusMonths))} /ปี → เฉลี่ย ฿{fmt(Math.round(bonusMonthly))} /เดือน
                </div>
              )}
            </div>

            {/* สรุป */}
            <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid var(--accent)", borderRadius: 14, padding: "18px" }}>
              <div style={{ fontFamily: "Mitr", fontSize: 14, fontWeight: 600, color: "var(--accent)", marginBottom: 14 }}>💰 สรุปรายได้รวมต่อเดือน</div>
              {[
                { label: "เงินเดือน", val: inc.salary, color: "var(--accent)" },
                { label: "ค่าตอบแทน", val: inc.compensation, color: "var(--accent2)" },
                { label: "โบนัส (เฉลี่ย)", val: bonusMonthly, color: "var(--gold)" },
                { label: "รายได้อื่นๆ", val: inc.other, color: "var(--blue)" },
              ].filter(r => r.val > 0).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
                  <span>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.color }}>฿{fmt(Math.round(r.val))}</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--warm2)", marginTop: 8, paddingTop: 10, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>รวมทั้งหมด</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent)", fontFamily: "Mitr" }}>฿{fmt(Math.round(totalMonthly))}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>บาท/เดือน</div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => onSave(Math.round(totalMonthly), Math.round(inc.salary))} style={{
          width: "100%", marginTop: 20, padding: "14px",
          background: "linear-gradient(135deg,var(--accent),#a05a20)",
          border: "none", borderRadius: 12, color: "white",
          fontFamily: "Mitr", fontSize: 16, fontWeight: 600,
          cursor: "pointer", boxShadow: "0 4px 12px rgba(192,114,42,0.35)",
        }}>
          ✅ ใช้รายได้รวม ฿{fmt(Math.round(totalMonthly))} ในแผนเกษียณ
        </button>
      </div>
    );
  };

  const PVDCalculator = ({ onSave, salary }) => {
    const [pvd, setPvd] = useState({
      salary: salary || 30000,
      empRate: 5,
      empBalance: 0,
      compRate: 5,
      compBalance: 0,
      returnRate: 4,
      yearsLeft: form.retireAge - form.currentAge,
    });

    const sp = (k, v) => {
      if (v === "" || v === null) { setPvd(p => ({ ...p, [k]: 0 })); return; }
      let n = parseFloat(v);
      if (isNaN(n)) return;
      if (k === "yearsLeft") n = Math.round(Math.max(1, n));
      setPvd(p => ({ ...p, [k]: n }));
    };

    const monthlyEmp = pvd.salary * pvd.empRate / 100;
    const monthlyComp = pvd.salary * pvd.compRate / 100;
    const r = pvd.returnRate / 100;
    const n = pvd.yearsLeft;
    const mr = r / 12;
    const mn = n * 12;
    const fvEmpExist = pvd.empBalance * Math.pow(1 + r, n);
    const fvCompExist = pvd.compBalance * Math.pow(1 + r, n);
    const fvEmpNew = mr > 0 ? monthlyEmp * ((Math.pow(1 + mr, mn) - 1) / mr) * (1 + mr) : monthlyEmp * mn;
    const fvCompNew = mr > 0 ? monthlyComp * ((Math.pow(1 + mr, mn) - 1) / mr) * (1 + mr) : monthlyComp * mn;
    const total = fvEmpExist + fvCompExist + fvEmpNew + fvCompNew;

    const SliderRow = ({ label, field, min, max, step, unit, decimals = 0 }) => {
      const pct = ((pvd[field] - min) / (max - min)) * 100;
      const displayVal = decimals > 0 ? parseFloat(pvd[field]).toFixed(decimals) : Math.round(pvd[field]);
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            <span>{label}</span>
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>{displayVal} {unit}</span>
          </div>
          <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--warm2)" }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: "var(--gold)", borderRadius: 2 }} />
            </div>
            <input type="range" min={min} max={max} step={step} value={pvd[field]}
              onChange={e => sp(field, e.target.value)}
              style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }}
            />
          </div>
          <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--gold);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
        </div>
      );
    };

    const NumberRow = ({ label, field, unit }) => {
      const [editing, setEditing] = useState(false);
      const [raw, setRaw] = useState(pvd[field] > 0 ? String(pvd[field]) : "");
      const displayVal = !editing && pvd[field] > 0
        ? new Intl.NumberFormat("th-TH").format(pvd[field])
        : raw;
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{label}</div>
          <div style={{ background: "var(--warm1)", border: "2px solid var(--accent)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={displayVal}
              placeholder="0"
              onFocus={() => { setEditing(true); setRaw(pvd[field] > 0 ? String(pvd[field]) : ""); }}
              onChange={e => { const v = e.target.value.replace(/[^0-9]/g, ""); setRaw(v); }}
              onBlur={e => { setEditing(false); const n = parseInt(raw || "0", 10); setRaw(n > 0 ? String(n) : ""); sp(field, n); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid var(--warm2)", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 18, color: "var(--text)", fontWeight: 600 }}>🏦 คำนวณกองทุนสำรองเลี้ยงชีพ</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>ข้อมูลเงินเดือนและอัตรานำส่ง</div>
            <NumberRow label="เงินเดือนปัจจุบัน" field="salary" unit="บาท" />
            <SliderRow label="อัตราส่วนพนักงาน" field="empRate" min={2} max={15} step={1} unit="%" />
            <SliderRow label="อัตราส่วนนายจ้าง" field="compRate" min={2} max={15} step={1} unit="%" />
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>ผลตอบแทนกองทุน</div>
              <div style={{ background: "var(--warm1)", border: "2px solid var(--accent)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number" inputMode="decimal" value={pvd.returnRate} min={0} max={20} step={0.5}
                  onChange={e => sp("returnRate", e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
                />
                <span style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700 }}>% ต่อปี</span>
              </div>
              <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center", marginTop: 8 }}>
                <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--warm2)" }}>
                  <div style={{ width: `${Math.min(((pvd.returnRate-1)/14)*100,100)}%`, height: "100%", background: "var(--gold)", borderRadius: 2 }} />
                </div>
                <input type="range" min={1} max={15} step={0.5} value={pvd.returnRate}
                  onChange={e => sp("returnRate", e.target.value)}
                  style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }}
                />
              </div>
              <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--gold);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
            </div>
            <NumberRow label="จำนวนปีที่เหลือก่อนเกษียณ" field="yearsLeft" unit="ปี" />
          </div>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>ยอดสะสมปัจจุบัน</div>
            <NumberRow label="ยอดสะสมส่วนพนักงาน" field="empBalance" unit="บาท" />
            <NumberRow label="ยอดสะสมส่วนนายจ้าง" field="compBalance" unit="บาท" />
          </div>
        </div>
        <div style={{ background: "linear-gradient(135deg,#fff8e6,#fdf0cc)", border: "2px solid var(--gold)", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
          <div style={{ fontFamily: "Mitr", fontSize: 16, fontWeight: 600, color: "var(--gold)", marginBottom: 16 }}>📊 คาดการณ์เงินกองทุนเมื่อเกษียณ</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { label: "นำส่ง/เดือน (พนักงาน)", val: monthlyEmp, color: "var(--accent)" },
              { label: "นำส่ง/เดือน (นายจ้าง)", val: monthlyComp, color: "var(--accent2)" },
              { label: "รวมนำส่ง/เดือน", val: monthlyEmp + monthlyComp, color: "var(--text)" },
            ].map((item, i) => (
              <div key={i} style={{ background: "white", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--warm2)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "Mitr" }}>฿{fmt(item.val)}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", textAlign: "center", border: "2px solid var(--gold)" }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>💰 มูลค่ากองทุนรวมเมื่อเกษียณ (อีก {pvd.yearsLeft} ปี)</div>
            <div style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, color: "var(--gold)", fontFamily: "Mitr" }}>฿{fmt(Math.round(total))}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
              ส่วนพนักงาน ฿{fmt(Math.round(fvEmpExist + fvEmpNew))} · ส่วนนายจ้าง ฿{fmt(Math.round(fvCompExist + fvCompNew))}
            </div>
          </div>
          <button onClick={() => onSave(Math.round(total))} style={{
            width: "100%", marginTop: 16, padding: "14px",
            background: "linear-gradient(135deg,var(--gold),#b8891e)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "Mitr", fontSize: 16, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(180,130,30,0.35)",
          }}>
            ✅ ใช้ค่านี้ ฿{fmt(Math.round(total))} ในแผนเกษียณ
          </button>
        </div>
      </div>
    );
  };

  const SSOCalculator = ({ onSave }) => {
    const [sso, setSso] = useState({
      salary: 15000,        // เงินเดือน (ฐานคำนวณ max 15,000)
      yearsContrib: 15,     // ปีที่ส่งสมทบ
      retireAge: form.retireAge,
    });
    const ss = (k, v) => {
      let n = parseFloat(v); if (isNaN(n)) n = 0;
      if (k === "yearsContrib" || k === "retireAge") n = Math.round(n);
      setSso(p => ({ ...p, [k]: n }));
    };

    // คำนวณตามกฎประกันสังคม
    const base = Math.min(sso.salary, 15000);
    const monthlyContrib = base * 0.05; // พนักงานส่ง 5%
    const totalContrib = monthlyContrib * 12 * sso.yearsContrib;
    // เงินชราภาพ: 20% ของค่าจ้าง 60 เดือนสุดท้าย + 1.5%/ปี ที่เกิน 15 ปี
    const baseMonthly15 = base * 0.20;
    const extraYears = Math.max(0, sso.yearsContrib - 15);
    const extraMonthly = base * 0.015 * extraYears;
    const monthlyPension = sso.yearsContrib >= 15 ? Math.min(baseMonthly15 + extraMonthly, 7500) : 0;
    // กรณีส่งไม่ครบ 15 ปี ได้เงินก้อนคืน
    const lumpsum = sso.yearsContrib < 15 ? totalContrib * 1.5 : 0;

    const SliderSSO = ({ label, field, min, max, step, unit }) => {
      const pct = ((sso[field] - min) / (max - min)) * 100;
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            <span>{label}</span>
            <span style={{ color: "var(--accent2)", fontWeight: 700 }}>{fmt(sso[field])} {unit}</span>
          </div>
          <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--warm2)" }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: "var(--accent2)", borderRadius: 2 }} />
            </div>
            <input type="range" min={min} max={max} step={step} value={sso[field]}
              onChange={e => ss(field, e.target.value)}
              style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }}
            />
          </div>
          <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--accent2);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
        </div>
      );
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid var(--warm2)", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 18, color: "var(--text)", fontWeight: 600 }}>🛡️ คำนวณประกันสังคม ม.33 ชราภาพ</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>ข้อมูลการส่งสมทบ</div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>เงินเดือน (ใช้คำนวณฐาน)</div>
              <div style={{ background: "var(--warm1)", border: "2px solid var(--accent2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={sso.salary} min={0} max={100000}
                  onChange={e => ss("salary", e.target.value)}
                  inputMode="numeric"
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
                />
                <span style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 700 }}>บาท/เดือน</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>ฐานสูงสุดที่ใช้คำนวณ 15,000 บาท · ส่งสมทบ 5% = ฿{fmt(monthlyContrib)}/เดือน</div>
            </div>
            <SliderSSO label="จำนวนปีที่ส่งสมทบ" field="yearsContrib" min={1} max={40} step={1} unit="ปี" />
            <div style={{ background: "rgba(58,140,110,0.08)", border: "1px solid rgba(58,140,110,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
              📌 <strong>เงื่อนไขชราภาพ:</strong><br/>
              • ส่งสมทบ <strong>≥ 180 เดือน (15 ปี)</strong> → ได้บำนาญรายเดือน<br/>
              • ส่งสมทบ <strong>{"<"} 15 ปี</strong> → ได้เงินก้อนคืนพร้อมดอกเบี้ย<br/>
              • บำนาญสูงสุด <strong>7,500 บาท/เดือน</strong>
            </div>
          </div>

          <div>
            <div className="section-title" style={{ marginTop: 0 }}>ผลการคำนวณ</div>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ background: "white", border: "1px solid var(--warm2)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>ส่งสมทบรวมทั้งหมด</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)", fontFamily: "Mitr" }}>฿{fmt(Math.round(totalContrib))}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>฿{fmt(monthlyContrib)}/เดือน × {sso.yearsContrib * 12} เดือน</div>
              </div>

              {sso.yearsContrib >= 15 ? (
                <div style={{ background: "linear-gradient(135deg,#f0fff8,#e0f5ec)", border: "2px solid var(--accent2)", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--accent2)", fontWeight: 600, marginBottom: 8 }}>🎉 ส่งครบ 15 ปี → ได้บำนาญรายเดือน</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
                    20% × ฿{fmt(base)} {extraYears > 0 ? `+ 1.5% × ${extraYears} ปี` : ""}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent2)", fontFamily: "Mitr" }}>฿{fmt(Math.round(monthlyPension))}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>บาท/เดือน (ตลอดชีวิต)</div>
                  {monthlyPension >= 7500 && <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6, fontWeight: 600 }}>⚠️ สูงสุดที่ได้ 7,500 บาท/เดือน</div>}
                </div>
              ) : (
                <div style={{ background: "linear-gradient(135deg,#fff8f0,#fff0e6)", border: "2px solid var(--accent)", borderRadius: 12, padding: "16px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 8 }}>⚠️ ส่งไม่ครบ 15 ปี → ได้เงินก้อนคืน</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent)", fontFamily: "Mitr" }}>฿{fmt(Math.round(lumpsum))}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>ก้อนเดียว (ต้องส่งอีก {15 - sso.yearsContrib} ปี จึงจะได้บำนาญ)</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {sso.yearsContrib >= 15 && (
          <button onClick={() => onSave(Math.round(monthlyPension))} style={{
            width: "100%", marginTop: 24, padding: "14px",
            background: "linear-gradient(135deg,var(--accent2),#2a6e54)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "Mitr", fontSize: 16, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(58,140,110,0.35)",
          }}>
            ✅ ใช้ค่านี้ ฿{fmt(Math.round(monthlyPension))}/เดือน ในแผนเกษียณ
          </button>
        )}
      </div>
    );
  };

  const AssetsCalculator = ({ onSave }) => {
    const [assets, setAssets] = useState({
      rmf: 0, rmfRet: 1,
      ltf: 0, ltfRet: 1,
      ssf: 0, ssfRet: 1,
      esg: 0, esgRet: 1,
      mutualFund: 0, mutualFundRet: 1,
      stocks: 0, stocksRet: 1,
      gold: 0, goldRet: 1,
      crypto: 0, cryptoRet: 1,
      other: 0, otherRet: 1,
    });
    const sa = (k, v) => setAssets(p => ({ ...p, [k]: parseFloat(v) || 0 }));

    const assetList = [
      { key: "rmf",        retKey: "rmfRet",        label: "กองทุน RMF",      emoji: "🏦", color: "#2980b9", desc: "Retirement Mutual Fund" },
      { key: "ltf",        retKey: "ltfRet",        label: "กองทุน LTF",      emoji: "📈", color: "#27ae60", desc: "Long Term Equity Fund" },
      { key: "ssf",        retKey: "ssfRet",        label: "กองทุน SSF",      emoji: "🛡️", color: "#8e44ad", desc: "Super Savings Fund" },
      { key: "esg",        retKey: "esgRet",        label: "กองทุน ESG",      emoji: "🌱", color: "#16a085", desc: "ESG Fund" },
      { key: "mutualFund", retKey: "mutualFundRet", label: "กองทุนรวมอื่นๆ", emoji: "💼", color: "#d35400", desc: "Mutual Fund ทั่วไป" },
      { key: "stocks",     retKey: "stocksRet",     label: "หุ้น",            emoji: "📊", color: "#c0392b", desc: "หุ้นไทย/ต่างประเทศ" },
      { key: "gold",       retKey: "goldRet",       label: "ทองคำ",           emoji: "🥇", color: "#c0922a", desc: "ทองแท่ง/ทองคำดิจิทัล" },
      { key: "crypto",     retKey: "cryptoRet",     label: "คริปโต",          emoji: "₿",  color: "#e67e22", desc: "Bitcoin/Altcoin" },
      { key: "other",      retKey: "otherRet",      label: "อื่นๆ",           emoji: "🏠", color: "#7f8c8d", desc: "อสังหาฯ / พันธบัตร ฯลฯ" },
    ];

    const yearsLeft = form.retireAge - form.currentAge;
    // คำนวณมูลค่าอนาคตของแต่ละสินทรัพย์
    const fvAssets = assetList.map(a => ({
      ...a,
      current: assets[a.key],
      ret: assets[a.retKey],
      fv: assets[a.key] * Math.pow(1 + assets[a.retKey] / 100, yearsLeft),
    }));
    const totalCurrent = assetList.reduce((s, a) => s + assets[a.key], 0);
    const totalFV = fvAssets.reduce((s, a) => s + a.fv, 0);

    const AssetRow = ({ item }) => {
      const [editing, setEditing] = useState(false);
      const [raw, setRaw] = useState(assets[item.key] > 0 ? String(assets[item.key]) : "");
      const displayVal = !editing && assets[item.key] > 0
        ? new Intl.NumberFormat("th-TH").format(assets[item.key])
        : raw;
      const fv = assets[item.key] * Math.pow(1 + assets[item.retKey] / 100, yearsLeft);
      return (
        <div style={{ marginBottom: 12, background: "white", border: `1px solid ${assets[item.key] > 0 ? item.color + "60" : "var(--warm2)"}`, borderRadius: 12, padding: "12px 14px", boxSizing: "border-box", width: "100%" }}>
          {/* หัว */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{item.desc}</div>
            </div>
            {assets[item.key] > 0 && (
              <div style={{ fontSize: 11, color: item.color, fontWeight: 700, flexShrink: 0 }}>
                FV ฿{fmt(Math.round(fv))}
              </div>
            )}
          </div>
          {/* ช่องกรอกเงิน */}
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>มูลค่าปัจจุบัน</div>
          <div style={{ background: "var(--warm1)", border: `1.5px solid ${assets[item.key] > 0 ? item.color : "var(--warm2)"}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, marginBottom: 8, boxSizing: "border-box", width: "100%" }}>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={displayVal} placeholder="0"
              onFocus={() => { setEditing(true); setRaw(assets[item.key] > 0 ? String(assets[item.key]) : ""); }}
              onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setEditing(false); const n = parseInt(raw || "0", 10); setRaw(n > 0 ? String(n) : ""); sa(item.key, n); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: item.color, fontWeight: 700, flexShrink: 0 }}>บาท</span>
          </div>
          {/* ผลตอบแทน % */}
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, fontWeight: 600 }}>ผลตอบแทน/ปี</div>
          <div style={{ background: "var(--warm1)", border: `1.5px solid ${item.color}60`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, boxSizing: "border-box", width: "100%" }}>
            <input
              type="number" inputMode="decimal" step="0.5" min="0" max="100"
              value={assets[item.retKey]}
              onChange={e => sa(item.retKey, e.target.value)}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: 16, fontWeight: 700, color: item.color, fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: item.color, fontWeight: 700, flexShrink: 0 }}>% ต่อปี</span>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid var(--warm2)", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 18, color: "var(--text)", fontWeight: 600 }}>📊 สินทรัพย์และการลงทุน</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16, boxSizing: "border-box", width: "100%" }}>
          <div style={{ minWidth: 0 }}>
            <div className="section-title" style={{ marginTop: 0 }}>กองทุนภาษี</div>
            {assetList.slice(0, 4).map(item => <AssetRow key={item.key} item={item} />)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="section-title" style={{ marginTop: 0 }}>การลงทุนและสินทรัพย์อื่น</div>
            {assetList.slice(4).map(item => <AssetRow key={item.key} item={item} />)}
          </div>
        </div>

        {/* สรุปมูลค่ารวม */}
        <div style={{ background: "linear-gradient(135deg,#f0f8ff,#e8f4fd)", border: "2px solid var(--blue)", borderRadius: 16, padding: "20px 24px", marginTop: 20 }}>
          <div style={{ fontFamily: "Mitr", fontSize: 15, fontWeight: 600, color: "var(--blue)", marginBottom: 14 }}>📊 สรุปมูลค่าสินทรัพย์ทั้งหมด</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {assetList.filter(a => assets[a.key] > 0).map(a => (
              <div key={a.key} style={{ background: "white", border: `1px solid ${a.color}30`, borderRadius: 8, padding: "6px 12px", display: "flex", gap: 6, alignItems: "center" }}>
                <span>{a.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{a.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: a.color, fontFamily: "Mitr" }}>฿{fmt(assets[a.key])}</span>
              </div>
            ))}
            {totalCurrent === 0 && <div style={{ fontSize: 13, color: "var(--muted)" }}>ยังไม่ได้กรอกข้อมูล</div>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", textAlign: "center", border: "1px solid var(--warm2)" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>มูลค่าปัจจุบันรวม</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", fontFamily: "Mitr" }}>฿{fmt(Math.round(totalCurrent))}</div>
            </div>
            <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", textAlign: "center", border: "2px solid var(--blue)" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>มูลค่าเมื่อเกษียณ (FV)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--blue)", fontFamily: "Mitr" }}>฿{fmt(Math.round(totalFV))}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>อีก {yearsLeft} ปีข้างหน้า</div>
            </div>
          </div>
          <button onClick={() => onSave(Math.round(totalFV))} style={{
            width: "100%", marginTop: 16, padding: "14px",
            background: "linear-gradient(135deg,var(--blue),#1a5f8a)",
            border: "none", borderRadius: 12, color: "white",
            fontFamily: "Mitr", fontSize: 16, fontWeight: 600,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(41,128,185,0.35)",
          }}>
            ✅ ใช้มูลค่าเมื่อเกษียณ ฿{fmt(Math.round(totalFV))} ในแผนเกษียณ
          </button>
        </div>
      </div>
    );
  };

  const SeveranceCalculator = ({ onSave }) => {
    const [sv, setSv] = useState({
      lastSalary: 30000,
      yearsWorked: 10,
    });
    const ss = (k, v) => { let n = k === "severanceType" ? v : (parseFloat(v) || 0); setSv(p => ({ ...p, [k]: n })); };

    // คำนวณเงินชดเชยตามกฎหมายแรงงาน พ.ร.บ. 2562
    const getDays = (y) => {
      if (y < 1/3) return 0;      // ไม่ถึง 120 วัน
      if (y < 1) return 30;       // 120 วัน – ไม่ถึง 1 ปี = 30 วัน
      if (y < 3) return 90;       // 1–2 ปี = 90 วัน
      if (y < 6) return 180;      // 3–5 ปี = 180 วัน
      if (y < 10) return 240;     // 6–9 ปี = 240 วัน
      if (y < 20) return 300;     // 10–19 ปี = 300 วัน
      return 400;                  // 20 ปีขึ้นไป = 400 วัน
    };
    const severanceDays = getDays(sv.yearsWorked);
    const dailySalary = sv.lastSalary / 30;
    const grossSeverance = dailySalary * severanceDays;

    // ขั้นตอนที่ 1: หักส่วนที่ยกเว้นภาษีตามกฎหมาย สูงสุด 600,000 บาท
    const exempt1 = Math.min(grossSeverance, 600000);
    const afterExempt1 = Math.max(0, grossSeverance - exempt1);

    // ขั้นตอนที่ 2: หักค่าใช้จ่ายส่วนแรก = 7,000 × อายุงาน
    const deduct1 = 7000 * sv.yearsWorked;
    const afterDeduct1 = Math.max(0, afterExempt1 - deduct1);

    // ขั้นตอนที่ 3: หักค่าใช้จ่ายส่วนที่สอง = 50% ของที่เหลือ
    const deduct2 = afterDeduct1 * 0.5;
    const taxableIncome = Math.max(0, afterDeduct1 - deduct2);

    // ขั้นตอนที่ 4: คำนวณภาษีขั้นบันไดไทย (ยื่นแบบแยก "ใบแนบ")
    // ไม่มีการยกเว้น 150,000 แรก → เริ่มคิดทันที
    const calcTax = (income) => {
      if (income <= 0) return 0;
      const brackets = [
        [300000, 0.05],
        [200000, 0.10],
        [250000, 0.15],
        [250000, 0.20],
        [1000000, 0.25],
        [3000000, 0.30],
        [Infinity, 0.35],
      ];
      let tax = 0;
      let remaining = income;
      for (const [limit, rate] of brackets) {
        if (remaining <= 0) break;
        const taxable = Math.min(remaining, limit);
        tax += taxable * rate;
        remaining -= taxable;
      }
      return tax;
    };
    const totalTax = calcTax(taxableIncome);
    const netSeverance = grossSeverance - totalTax;

    // สรุปขั้นตอน
    const steps = [
      { no: 1, label: "เงินชดเชยทั้งหมด", val: grossSeverance, desc: `${severanceDays} วัน × ฿${fmt(Math.round(dailySalary))}/วัน` },
      { no: 2, label: "หักยกเว้นภาษี (สูงสุด 600,000)", val: -exempt1, desc: "ตามกฎหมายใหม่" },
      { no: 3, label: "หักค่าใช้จ่ายส่วนแรก", val: -deduct1, desc: `7,000 × ${sv.yearsWorked} ปี` },
      { no: 4, label: "หักค่าใช้จ่ายส่วนที่สอง (50%)", val: -deduct2, desc: "50% ของยอดที่เหลือ" },
      { no: 5, label: "เงินได้สุทธิเพื่อคิดภาษี", val: taxableIncome, desc: "", highlight: true },
      { no: 6, label: "ภาษีที่ต้องจ่าย", val: -totalTax, desc: "อัตราขั้นบันได ยื่นแบบแยก" },
    ];

    const SliderSV = ({ label, field, min, max, step, unit }) => {
      const pct = ((sv[field] - min) / (max - min)) * 100;
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            <span>{label}</span>
            <span style={{ color: "var(--accent)", fontWeight: 700 }}>{fmt(sv[field])} {unit}</span>
          </div>
          <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 4, borderRadius: 2, background: "var(--warm2)" }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
            </div>
            <input type="range" min={min} max={max} step={step} value={sv[field]}
              onChange={e => ss(field, e.target.value)}
              style={{ position: "absolute", width: "100%", height: 32, WebkitAppearance: "none", appearance: "none", background: "transparent", cursor: "pointer", touchAction: "manipulation" }}
            />
          </div>
          <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--accent);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.2);cursor:pointer;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
        </div>
      );
    };

    const NumSV = ({ label, field, unit }) => {
      const [editing, setEditing] = useState(false);
      const [raw, setRaw] = useState(sv[field] > 0 ? String(sv[field]) : "");
      return (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{label}</div>
          <div style={{ background: "var(--warm1)", border: "2px solid var(--accent)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <input type="text" inputMode="numeric" pattern="[0-9]*"
              value={editing ? raw : (sv[field] > 0 ? new Intl.NumberFormat("th-TH").format(sv[field]) : "")}
              placeholder="0"
              onFocus={() => { setEditing(true); setRaw(sv[field] > 0 ? String(sv[field]) : ""); }}
              onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setEditing(false); const n = parseInt(raw || "0", 10); setRaw(n > 0 ? String(n) : ""); ss(field, n); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, color: "var(--text)", fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid var(--warm2)", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "var(--muted)" }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 18, color: "var(--text)", fontWeight: 600 }}>💼 คำนวณเงินชดเชยหักภาษี</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          <div>
            <div className="section-title" style={{ marginTop: 0 }}>ข้อมูลการทำงาน</div>
            <NumSV label="เงินเดือนสุดท้าย" field="lastSalary" unit="บาท" />
            <SliderSV label="อายุงาน" field="yearsWorked" min={1} max={40} step={1} unit="ปี" />

            <div style={{ background: "rgba(192,114,42,0.06)", border: "1px solid rgba(192,114,42,0.2)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
              📌 <strong>อัตราเงินชดเชย (พ.ร.บ. คุ้มครองแรงงาน ฉบับล่าสุด):</strong><br/>
              • ทำงาน 120 วัน แต่ไม่ถึง 1 ปี → <strong>30 วัน</strong><br/>
              • 1–2 ปี → <strong>90 วัน</strong> · 3–5 ปี → <strong>180 วัน</strong><br/>
              • 6–9 ปี → <strong>240 วัน</strong> · 10–19 ปี → <strong>300 วัน</strong><br/>
              • 20 ปีขึ้นไป → <strong>400 วัน</strong><br/>
              📊 <strong>ภาษีขั้นบันได (ยื่นใบแนบ):</strong> 5% / 10% / 15% / 20% / 25% / 30% / 35%
            </div>
          </div>

          <div>
            <div className="section-title" style={{ marginTop: 0 }}>ขั้นตอนการคำนวณ</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  background: s.highlight ? "linear-gradient(135deg,#fff8f0,#fdf0e0)" : "white",
                  border: `1px solid ${s.highlight ? "var(--accent)" : "var(--warm2)"}`,
                  borderRadius: 10, padding: "12px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8
                }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
                      <strong style={{ color: "var(--accent)" }}>ขั้นที่ {s.no}</strong> {s.label}
                    </div>
                    {s.desc && <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.desc}</div>}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "Mitr", whiteSpace: "nowrap",
                    color: s.val < 0 ? "var(--red)" : s.highlight ? "var(--accent)" : "var(--text)" }}>
                    {s.val < 0 ? "-" : ""}฿{fmt(Math.abs(Math.round(s.val)))}
                  </div>
                </div>
              ))}
              <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid var(--accent)", borderRadius: 12, padding: "16px 18px", textAlign: "center", marginTop: 4 }}>
                <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 6 }}>💰 เงินชดเชยสุทธิหลังหักภาษี</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: "var(--accent)", fontFamily: "Mitr" }}>฿{fmt(Math.round(netSeverance))}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>รับจริง ณ วันเกษียณ</div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={() => onSave(Math.round(netSeverance))} style={{
          width: "100%", marginTop: 24, padding: "14px",
          background: "linear-gradient(135deg,var(--accent),#a05a20)",
          border: "none", borderRadius: 12, color: "white",
          fontFamily: "Mitr", fontSize: 16, fontWeight: 600,
          cursor: "pointer", boxShadow: "0 4px 12px rgba(192,114,42,0.35)",
        }}>
          ✅ ใช้ค่านี้ ฿{fmt(Math.round(netSeverance))} ในแผนเกษียณ
        </button>
      </div>
    );
  };

  return (
    <div className="app">
      <WheelPicker />
      {showAnimation && (
        <canvas ref={canvasRef} style={{
          position: "fixed", inset: 0, zIndex: 9999,
          pointerEvents: "none", width: "100%", height: "100%",
        }} />
      )}
      {/* Help Modal */}
      {helpOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setHelpOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: 20, width: "100%", maxWidth: 560,
            maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            {/* Modal Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--warm2)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg,#fff8ef,#fdf3e7)", flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: "Mitr", fontSize: 18, fontWeight: 600, color: "var(--text)" }}>❓ วิธีการใช้งาน</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>แผนเกษียณสุข Happy Retirement</div>
              </div>
              <button onClick={() => setHelpOpen(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--warm2)", background: "white", cursor: "pointer", fontSize: 18, color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            {/* Modal Body */}
            <div style={{ overflowY: "auto", padding: "20px 24px", WebkitOverflowScrolling: "touch" }}>
              {[
                {
                  tab: "📋 กรอกข้อมูล",
                  color: "var(--accent)",
                  desc: "หน้าหลักสำหรับกรอกข้อมูลส่วนตัว",
                  steps: [
                    "กรอกอายุปัจจุบัน, อายุเกษียณ และอายุขัยที่คาดไว้",
                    "กรอกเงินออมปัจจุบัน และอัตราการออม (%)",
                    "กรอกรายจ่ายหลังเกษียณที่คาดไว้ต่อเดือน",
                    "กรอกผลตอบแทนการลงทุนและอัตราเงินเฟ้อ",
                    "กด '🔍 คำนวณแผนเกษียณ' เพื่อดูผล",
                  ]
                },
                {
                  tab: "💰 รายได้",
                  color: "var(--accent)",
                  desc: "กรอกรายได้แต่ละประเภทแยกกัน",
                  steps: [
                    "กรอกเงินเดือน, ค่าตอบแทน, โบนัส (จำนวนเดือน) และรายได้อื่นๆ",
                    "ระบบจะรวมรายได้ทั้งหมดเป็นยอดรวมต่อเดือน",
                    "กด ✅ เพื่อนำรายได้รวมไปใช้ในแผนเกษียณ",
                    "เงินเดือนจะถูกส่งไปยัง Tab กองทุนสำรองฯ อัตโนมัติ",
                  ]
                },
                {
                  tab: "🏦 กองทุนสำรองฯ",
                  color: "var(--gold)",
                  desc: "คำนวณมูลค่ากองทุนสำรองเลี้ยงชีพเมื่อเกษียณ",
                  steps: [
                    "เงินเดือนดึงมาจาก Tab รายได้อัตโนมัติ",
                    "กรอกอัตรานำส่งพนักงาน และนายจ้าง (%)",
                    "กรอกยอดสะสมปัจจุบัน และผลตอบแทนกองทุน",
                    "กรอกจำนวนปีที่เหลือก่อนเกษียณ",
                    "กด ✅ เพื่อนำมูลค่า FV ไปใช้ในแผนเกษียณ",
                  ]
                },
                {
                  tab: "🛡️ ประกันสังคม",
                  color: "var(--accent2)",
                  desc: "คำนวณเงินบำนาญชราภาพจากประกันสังคม",
                  steps: [
                    "กรอกเงินเดือน (ฐานสูงสุด 15,000 บาท)",
                    "กรอกจำนวนปีที่ส่งสมทบ",
                    "ส่งครบ 15 ปี → ได้บำนาญรายเดือนตลอดชีวิต",
                    "ส่งไม่ครบ 15 ปี → ได้เงินก้อนคืน",
                    "กด ✅ เพื่อนำบำนาญ/เดือนไปใช้ในแผนเกษียณ",
                  ]
                },
                {
                  tab: "💼 เงินชดเชย",
                  color: "var(--accent)",
                  desc: "คำนวณเงินชดเชยตามกฎหมายแรงงาน หักภาษีแล้ว",
                  steps: [
                    "กรอกเงินเดือนสุดท้าย และอายุงาน",
                    "ระบบคำนวณตาม พ.ร.บ. คุ้มครองแรงงานฉบับล่าสุด",
                    "แสดงขั้นตอนหักภาษีตามกรมสรรพากร (ยื่นใบแนบ)",
                    "กด ✅ เพื่อนำเงินชดเชยสุทธิไปใช้ในแผนเกษียณ",
                  ]
                },
                {
                  tab: "📊 สินทรัพย์",
                  color: "var(--blue)",
                  desc: "กรอกมูลค่าสินทรัพย์และการลงทุนทุกประเภท",
                  steps: [
                    "กรอกมูลค่าปัจจุบันของแต่ละสินทรัพย์ (RMF, LTF, SSF, ESG, หุ้น, ทอง, คริปโต ฯลฯ)",
                    "ตั้งผลตอบแทนต่อปี (%) ของแต่ละสินทรัพย์",
                    "ระบบคำนวณมูลค่าอนาคต (FV) เมื่อถึงอายุเกษียณ",
                    "กด ✅ เพื่อนำมูลค่า FV รวมไปใช้ในแผนเกษียณ",
                  ]
                },
                {
                  tab: "📊 ผลการวิเคราะห์",
                  color: "var(--accent2)",
                  desc: "ดูผลการวิเคราะห์แผนเกษียณแบบครบครัน",
                  steps: [
                    "ดูความพร้อมเกษียณเป็น % และจำนวนเงินที่ต้องการ",
                    "ดูคำแนะนำว่าต้องออมเดือนละเท่าไรถึงจะพอ",
                    "ดูกราฟการเติบโตของเงินออมตลอดช่วงชีวิต",
                    "ดูสัดส่วนแหล่งที่มาเงินเกษียณแบบ Pie Chart",
                    "ดูเป้าหมายเงินออมรายทางทุก 5 ปี",
                  ]
                },
              ].map((section, i) => (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ background: section.color, borderRadius: 8, padding: "3px 10px", fontSize: 13, fontWeight: 700, color: "white", fontFamily: "Mitr", flexShrink: 0 }}>{section.tab}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{section.desc}</div>
                  <div style={{ background: "var(--warm1)", borderRadius: 10, padding: "12px 14px" }}>
                    {section.steps.map((step, j) => (
                      <div key={j} style={{ display: "flex", gap: 8, marginBottom: j < section.steps.length - 1 ? 6 : 0 }}>
                        <span style={{ color: section.color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{j + 1}.</span>
                        <span style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ background: "linear-gradient(135deg,#f0fff8,#e0f5ec)", border: "1px solid var(--accent2)", borderRadius: 12, padding: "14px 16px", marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent2)", marginBottom: 6 }}>💡 เคล็ดลับการใช้งาน</div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
                  • เริ่มจาก Tab <strong>รายได้</strong> → <strong>ประกันสังคม</strong> → <strong>กองทุนสำรองฯ</strong> → <strong>เงินชดเชย</strong> → <strong>สินทรัพย์</strong> แล้วค่อยกลับมา <strong>กรอกข้อมูล</strong><br/>
                  • กด <strong>คำนวณแผนเกษียณ</strong> เมื่อกรอกข้อมูลครบแล้ว<br/>
                  • ปรับ slider หรือพิมพ์ตัวเลขในช่องได้เลย
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Mitr:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #fdf8f2; --surface: #ffffff; --surface2: #fef9f4;
          --border: rgba(180,120,60,0.15);
          --accent: #c0722a; --accent2: #3a8c6e; --accent3: #d4a843;
          --text: #3a2a1a; --muted: #8a7060;
          --green: #2e7d52; --red: #c0392b; --gold: #c0922a; --blue: #2980b9;
          --warm1: #f5e6d0; --warm2: #ede0cc; --shadow: rgba(150,100,50,0.12);
        }
        body { background: var(--bg); color: var(--text); font-family: 'Sarabun', sans-serif; font-size: 16px; }
        .app { min-height: 100vh; background: var(--bg);
          background-image: radial-gradient(ellipse at 10% 0%, rgba(240,210,160,0.5) 0%, transparent 50%),
                            radial-gradient(ellipse at 90% 100%, rgba(180,220,200,0.3) 0%, transparent 50%); }
        .header { padding: 28px 16px 18px; border-bottom: 2px solid var(--warm2);
          background: linear-gradient(135deg, #fff8ef 0%, #fdf3e7 100%);
          box-shadow: 0 2px 12px var(--shadow); }
        @media (min-width: 640px) { .header { padding: 40px 32px 24px; } }
        .header-inner { max-width: 1100px; margin: 0 auto; }
        .brand-tag { font-size: 13px; font-weight: 600; letter-spacing: 2px; color: var(--accent); text-transform: uppercase; margin-bottom: 10px; }
        .title { font-family: 'Mitr', sans-serif; font-size: clamp(28px,4vw,46px); font-weight: 600; color: var(--text); line-height: 1.2; }
        .title span { color: var(--accent); }
        .subtitle { color: var(--muted); font-size: 16px; margin-top: 8px; font-weight: 400; line-height: 1.6; }
        .tabs { display: flex; gap: 6px; max-width: 1100px; margin: 24px auto 0; flex-wrap: wrap; }
        .tab { padding: 10px 16px; border-radius: 12px 12px 0 0; border: 2px solid var(--border); border-bottom: none;
          background: var(--warm1); color: var(--muted); cursor: pointer; font-family: 'Sarabun', sans-serif;
          font-size: 14px; font-weight: 600; transition: all 0.2s; }
        .tab.active { background: var(--surface); color: var(--accent); border-color: var(--accent); border-bottom: 2px solid var(--surface); margin-bottom: -2px; }
        .tab:hover:not(.active) { background: var(--warm2); color: var(--text); }
        .main { max-width: 1100px; margin: 0 auto; padding: 0 16px 60px; }
        @media (min-width: 640px) { .main { padding: 0 32px 60px; } }
        .content-area { background: var(--surface); border: 2px solid var(--border); border-top: 2px solid var(--accent);
          border-radius: 0 16px 16px 16px; padding: 20px 16px 24px; box-shadow: 0 4px 24px var(--shadow); }
        .section-title { font-family: 'Mitr', sans-serif; font-size: 15px; font-weight: 500; letter-spacing: 1px;
          color: var(--accent); margin: 32px 0 18px; padding-bottom: 10px; border-bottom: 2px solid var(--warm2); }
        .section-title:first-child { margin-top: 0; }
        .section-subtitle { font-size: 14px; color: var(--muted); margin-top: -12px; margin-bottom: 16px; line-height: 1.5; }
        .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
        @media (max-width: 640px) { .input-grid { grid-template-columns: 1fr; } }
        .input-group { display: flex; flex-direction: column; gap: 10px; }
        .input-label { display: flex; justify-content: space-between; align-items: baseline; font-size: 15px; font-weight: 600; color: var(--text); }
        .input-note { font-size: 13px; color: var(--accent2); font-weight: 500; }
        .input-row { display: flex; align-items: center; gap: 14px; }
        .input-value-box { display: flex; align-items: center; gap: 6px; background: var(--warm1); border: 2px solid var(--warm2); border-radius: 10px; padding: 7px 12px; min-width: 120px; }
        .number-input { width: 72px; background: transparent; border: none; outline: none; color: var(--text); font-family: 'Sarabun', sans-serif; font-size: 16px; font-weight: 700; text-align: right; }
        .unit { font-size: 13px; color: var(--accent); font-weight: 700; white-space: nowrap; }
        .income-box { background: rgba(58,140,110,0.06); border: 2px solid rgba(58,140,110,0.2); border-radius: 14px; padding: 22px 26px; margin-bottom: 8px; }
        .income-box .section-title { color: var(--accent2); border-color: rgba(58,140,110,0.2); }
        .lumpsum-box { background: rgba(212,168,67,0.06); border: 2px solid rgba(212,168,67,0.2); border-radius: 14px; padding: 22px 26px; }
        .lumpsum-box .section-title { color: var(--gold); border-color: rgba(212,168,67,0.2); }
        .calc-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, var(--accent) 0%, #a05a20 100%);
          border: none; border-radius: 14px; color: white; font-family: 'Mitr', sans-serif; font-size: 18px; font-weight: 500;
          cursor: pointer; letter-spacing: 1px; transition: all 0.3s; box-shadow: 0 4px 16px rgba(192,114,42,0.35); margin-top: 32px; }
        .calc-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(192,114,42,0.45); }
        .summary-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 16px; }
        @media (max-width: 700px) { .summary-cards { grid-template-columns: 1fr; } }
        .card { background: var(--surface2); border: 2px solid var(--warm2); border-radius: 14px; padding: 14px 16px;
          position: relative; overflow: hidden; box-shadow: 0 2px 10px var(--shadow); }
        .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 2px 2px 0 0; }
        .card.orange::before { background: linear-gradient(90deg,var(--accent),transparent); }
        .card.teal::before { background: linear-gradient(90deg,var(--accent2),transparent); }
        .card.green::before { background: linear-gradient(90deg,var(--green),transparent); }
        .card.red::before { background: linear-gradient(90deg,var(--red),transparent); }
        .card.gold::before { background: linear-gradient(90deg,var(--gold),transparent); }
        .card.blue::before { background: linear-gradient(90deg,var(--blue),transparent); }
        .card-label { font-size: 13px; color: var(--muted); font-weight: 600; margin-bottom: 8px; }
        .card-value { font-size: clamp(15px,2.5vw,24px); font-weight: 700; color: var(--text); line-height: 1.2; word-break: break-all; }
        .card-sub { font-size: 13px; color: var(--muted); margin-top: 6px; }
        .income-row-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap: 10px; margin-bottom: 20px; }
        .progress-bar { height: 10px; background: var(--warm2); border-radius: 5px; overflow: hidden; margin: 10px 0 6px; }
        .progress-fill { height: 100%; border-radius: 5px; transition: width 1s ease; }
        .ready-pct { font-size: clamp(24px,5vw,32px); font-weight: 800; margin-top: 4px; font-family: 'Mitr', sans-serif; }
        .charts-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 18px; margin: 20px 0; }
        @media (max-width: 800px) { .charts-grid { grid-template-columns: 1fr; } }
        .chart-box { background: var(--surface2); border: 2px solid var(--warm2); border-radius: 16px; padding: 20px 18px; box-shadow: 0 2px 10px var(--shadow); }
        .chart-title { font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 14px; font-family: 'Mitr', sans-serif; }
        .custom-tooltip { background: white; border: 2px solid var(--warm2); border-radius: 10px; padding: 12px 16px; font-family: 'Sarabun', sans-serif; font-size: 14px; box-shadow: 0 4px 12px var(--shadow); }
        .tt-label { font-weight: 700; color: var(--accent); margin-bottom: 5px; }
        .timeline { display: flex; border-radius: 12px; overflow: hidden; margin-bottom: 22px; height: 48px; box-shadow: 0 2px 8px var(--shadow); }
        .tl-segment { display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: white; padding: 0 12px; transition: flex 0.8s ease; }
        .tl-segment span { white-space: nowrap; overflow: hidden; }
        .advice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 22px; }
        @media (max-width: 640px) { .advice-grid { grid-template-columns: 1fr; } }
        .advice-card { background: var(--warm1); border: 2px solid var(--warm2); border-radius: 14px; padding: 18px; box-shadow: 0 2px 8px var(--shadow); }
        .advice-icon { font-size: 26px; margin-bottom: 8px; }
        .advice-title { font-size: 14px; font-weight: 700; color: var(--accent); margin-bottom: 6px; font-family: 'Mitr', sans-serif; }
        .advice-text { font-size: 14px; color: var(--muted); line-height: 1.7; }
        .advice-highlight { color: var(--text); font-weight: 700; }
        .net-need-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(58,140,110,0.1); border: 2px solid rgba(58,140,110,0.25); border-radius: 20px; padding: 6px 14px; font-size: 14px; color: var(--accent2); font-weight: 600; margin-top: 10px; }
      `}</style>

      <div className="header">
        <div className="header-inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div className="brand-tag">🌅 วางแผนชีวิตหลังเกษียณ</div>
              <h1 className="title">แผนเกษียณสุข <span>Happy Retirement</span> 😊</h1>
              <p className="subtitle">คำนวณเงินออมที่ต้องการ · วิเคราะห์รายรับหลังเกษียณ · วางแผนอนาคตอย่างมีความสุข</p>
            </div>
            <button onClick={() => setHelpOpen(true)} style={{
              marginTop: 4, marginLeft: 12, flexShrink: 0,
              padding: "10px 16px", borderRadius: 12,
              background: "linear-gradient(135deg,var(--accent),#a05a20)",
              border: "none", color: "white", cursor: "pointer",
              fontFamily: "Mitr", fontSize: 14, fontWeight: 600,
              boxShadow: "0 2px 8px rgba(192,114,42,0.3)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ color: "white", fontSize: 16, fontWeight: 800 }}>?</span> วิธีใช้
            </button>
          </div>
          <div className="tabs">
            <button className={`tab${activeTab === "input" ? " active" : ""}`} onClick={() => setActiveTab("input")}>📋 กรอกข้อมูล</button>
            <button className={`tab${activeTab === "income" ? " active" : ""}`} onClick={() => setActiveTab("income")}>💰 รายได้</button>
            {result && <button className={`tab${activeTab === "result" ? " active" : ""}`} onClick={() => setActiveTab("result")}>📊 ผลการวิเคราะห์</button>}
            <button className={`tab${activeTab === "pvd" ? " active" : ""}`} onClick={() => setActiveTab("pvd")}>🏦 กองทุนสำรองฯ</button>
            <button className={`tab${activeTab === "sso" ? " active" : ""}`} onClick={() => setActiveTab("sso")}>🛡️ ประกันสังคม</button>
            <button className={`tab${activeTab === "severance" ? " active" : ""}`} onClick={() => setActiveTab("severance")}>💼 เงินชดเชย</button>
            <button className={`tab${activeTab === "assets" ? " active" : ""}`} onClick={() => setActiveTab("assets")}>📊 สินทรัพย์</button>
          </div>
        </div>
      </div>

      <div className="main">
        <div className="content-area">
          {activeTab === "income" && <IncomeCalculator data={incomeData} onChange={setIncomeData} onSave={(val, sal) => { set("monthlyIncome", val); set("incomeSalary", sal); setActiveTab("input"); }} />}
          {activeTab === "pvd" && <PVDCalculator salary={form.incomeSalary} onSave={(val) => { set("providentFund", val); setActiveTab("input"); }} />}
          {activeTab === "sso" && <SSOCalculator onSave={(val) => { set("monthlySSOPension", val); setActiveTab("input"); }} />}
          {activeTab === "severance" && <SeveranceCalculator onSave={(val) => { set("severancePay", val); setActiveTab("input"); }} />}
          {activeTab === "assets" && <AssetsCalculator onSave={(val) => { set("otherLumpsum", val); setActiveTab("input"); }} />}

          {activeTab === "input" && (
            <div>
              <div className="section-title">ข้อมูลส่วนตัว</div>
              <div className="input-grid">
                <InputField label="อายุปัจจุบัน" name="currentAge" min={20} max={70} step={1} unit="ปี" />
                <InputField label="อายุเกษียณที่ต้องการ" name="retireAge" min={40} max={75} step={1} unit="ปี" />
                <InputField label="อายุขัยที่คาดไว้" name="lifeExpectancy" min={60} max={100} step={1} unit="ปี" />
                <InputField label="เงินออมปัจจุบัน" name="currentSavings" min={0} max={10000000} step={10000} unit="บาท" />
              </div>

              <div className="section-title">รายได้และการออมระหว่างทำงาน</div>
              <div className="input-grid">
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>รายได้ต่อเดือน</div>
                    {form.monthlyIncome > 0 ? (
                      <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid var(--accent)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>รายได้รวมต่อเดือน</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)", fontFamily: "Mitr" }}>฿{fmt(form.monthlyIncome)}</div>
                      </div>
                    ) : (
                      <div style={{ background: "var(--warm1)", border: "2px dashed var(--warm2)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        ยังไม่ได้กรอกข้อมูล
                      </div>
                    )}
                    <button onClick={() => setActiveTab("income")} style={{
                      width: "100%", padding: "12px 14px",
                      background: "linear-gradient(135deg,var(--accent),#a05a20)",
                      border: "none", borderRadius: 10, color: "white",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Mitr", boxShadow: "0 2px 8px rgba(192,114,42,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      💰 กรอกข้อมูลรายได้
                    </button>
                  </div>
                <InputField label="อัตราการออม" name="monthlySavingRate" min={0} max={80} unit="%" note={`= ฿${fmt((form.monthlyIncome * form.monthlySavingRate) / 100)}/เดือน`} />
                <InputField label="รายจ่ายหลังเกษียณ/เดือน" name="retireMonthlyExpense" min={0} max={200000} step={1000} unit="บาท" />
              </div>

              <div className="section-title">ผลตอบแทนและอัตราเงินเฟ้อ</div>
              <div className="input-grid">
                <InputField label="ผลตอบแทนการลงทุน" name="expectedReturn" min={1} max={20} step={0.5} unit="% ต่อปี" note="หุ้น/กองทุน" />
                <InputField label="อัตราเงินเฟ้อ" name="inflationRate" min={0} max={10} step={0.5} unit="% ต่อปี" />
              </div>

              <div className="income-box">
                <div className="section-title">รายรับรายเดือนหลังเกษียณ</div>
                <p className="section-subtitle">รายได้ประจำที่จะได้รับทุกเดือนหลังเกษียณ (หักออกจากรายจ่ายที่ต้องใช้เงินออม)</p>
                <div className="input-grid">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>ประกันสังคม ชราภาพ/เดือน</div>
                    {form.monthlySSOPension > 0 ? (
                      <div style={{ background: "linear-gradient(135deg,#f0fff8,#e0f5ec)", border: "2px solid var(--accent2)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>เงินชราภาพที่จะได้รับ/เดือน</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent2)", fontFamily: "Mitr" }}>฿{fmt(form.monthlySSOPension)}</div>
                      </div>
                    ) : (
                      <div style={{ background: "var(--warm1)", border: "2px dashed var(--warm2)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        ยังไม่ได้คำนวณ
                      </div>
                    )}
                    <button onClick={() => setActiveTab("sso")} style={{
                      width: "100%", padding: "12px 14px",
                      background: "linear-gradient(135deg,#3a8c6e,#2a6e54)",
                      border: "none", borderRadius: 10, color: "white",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Mitr", boxShadow: "0 2px 8px rgba(58,140,110,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      🧮 คำนวณประกันสังคมชราภาพ
                    </button>
                  </div>
                  <InputField label="บำนาญที่ได้รับ/เดือน" name="monthlyPension" min={0} max={100000} step={500} unit="บาท/เดือน" note="บำนาญราชการ/รัฐวิสาหกิจ" color="var(--accent2)" />
                  <InputField label="ประกันบำนาญ/เดือน" name="monthlyInsurancePension" min={0} max={100000} step={500} unit="บาท/เดือน" note="ประกันชีวิตแบบบำนาญ" color="var(--accent2)" />
                </div>
                {(form.monthlyPension + form.monthlySSOPension + form.monthlyInsurancePension) > 0 && (
                  <div className="net-need-badge">
                    ✅ รายรับรวม ฿{fmt(form.monthlyPension + form.monthlySSOPension + form.monthlyInsurancePension)}/เดือน
                    &nbsp;→&nbsp; ต้องการจากเงินออมเพิ่ม ฿{fmt(Math.max(0, form.retireMonthlyExpense - form.monthlyPension - form.monthlySSOPension - form.monthlyInsurancePension))}/เดือน
                  </div>
                )}
              </div>

              <div className="lumpsum-box" style={{ marginTop: 20 }}>
                <div className="section-title">เงินก้อนเมื่อเกษียณ</div>
                <p className="section-subtitle">เงินก้อนที่จะได้รับ ณ วันเกษียณ (หักภาษีแล้ว)</p>
                <div className="input-grid">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>กองทุนสำรองเลี้ยงชีพ</div>
                    {form.providentFund > 0 ? (
                      <div style={{ background: "linear-gradient(135deg,#fff8e6,#fdf0cc)", border: "2px solid var(--gold)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>มูลค่าคาดการณ์เมื่อเกษียณ</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)", fontFamily: "Mitr" }}>฿{fmt(form.providentFund)}</div>
                      </div>
                    ) : (
                      <div style={{ background: "var(--warm1)", border: "2px dashed var(--warm2)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        ยังไม่ได้คำนวณ
                      </div>
                    )}
                    <button onClick={() => setActiveTab("pvd")} style={{
                      width: "100%", padding: "12px 14px",
                      background: "linear-gradient(135deg,#d4a843,#b8891e)",
                      border: "none", borderRadius: 10, color: "white",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Mitr", boxShadow: "0 2px 8px rgba(180,130,30,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      🧮 คำนวณกองทุนสำรองเลี้ยงชีพ
                    </button>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>เงินชดเชย (หักภาษีแล้ว)</div>
                    {form.severancePay > 0 ? (
                      <div style={{ background: "linear-gradient(135deg,#fff8e6,#fdf0cc)", border: "2px solid var(--gold)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>เงินชดเชยสุทธิหลังหักภาษี</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)", fontFamily: "Mitr" }}>฿{fmt(form.severancePay)}</div>
                      </div>
                    ) : (
                      <div style={{ background: "var(--warm1)", border: "2px dashed var(--warm2)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        ยังไม่ได้คำนวณ
                      </div>
                    )}
                    <button onClick={() => setActiveTab("severance")} style={{
                      width: "100%", padding: "12px 14px",
                      background: "linear-gradient(135deg,#c0722a,#a05a20)",
                      border: "none", borderRadius: 10, color: "white",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Mitr", boxShadow: "0 2px 8px rgba(192,114,42,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      🧮 คำนวณเงินชดเชย
                    </button>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>สินทรัพย์และการลงทุน</div>
                    {form.otherLumpsum > 0 ? (
                      <div style={{ background: "linear-gradient(135deg,#fff8e6,#fdf0cc)", border: "2px solid var(--gold)", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>มูลค่ารวมสินทรัพย์</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "var(--gold)", fontFamily: "Mitr" }}>฿{fmt(form.otherLumpsum)}</div>
                      </div>
                    ) : (
                      <div style={{ background: "var(--warm1)", border: "2px dashed var(--warm2)", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        ยังไม่ได้กรอกข้อมูล
                      </div>
                    )}
                    <button onClick={() => setActiveTab("assets")} style={{
                      width: "100%", padding: "12px 14px",
                      background: "linear-gradient(135deg,#2980b9,#1a5f8a)",
                      border: "none", borderRadius: 10, color: "white",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                      fontFamily: "Mitr", boxShadow: "0 2px 8px rgba(41,128,185,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      📊 กรอกข้อมูลสินทรัพย์และการลงทุน
                    </button>
                  </div>
                </div>
              </div>

              <button className="calc-btn" onClick={calculate}>🔍 คำนวณแผนเกษียณ</button>
            </div>
          )}

          {activeTab === "result" && result && (
            <div>
              <div className="timeline">
                <div className="tl-segment" style={{ flex: result.yearsToRetire, background: "linear-gradient(135deg,#2a9d8f,#264653)" }}>
                  <span>สะสมทรัพย์ {result.yearsToRetire} ปี</span>
                </div>
                <div className="tl-segment" style={{ flex: result.yearsInRetirement, background: "linear-gradient(135deg,#f4a261,#e76f51)" }}>
                  <span>เกษียณ {result.yearsInRetirement} ปี</span>
                </div>
              </div>

              {result.totalMonthlyIncome > 0 && (
                <>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>📥 รายรับประจำหลังเกษียณ</div>
                  <div className="income-row-cards">
                    {form.monthlyPension > 0 && (
                      <div className="card teal"><div className="card-label">บำนาญ/เดือน</div><div className="card-value" style={{ color: "var(--accent2)" }}>฿{fmt(form.monthlyPension)}</div><div className="card-sub">ราชการ/รัฐวิสาหกิจ</div></div>
                    )}
                    {form.monthlySSOPension > 0 && (
                      <div className="card teal"><div className="card-label">ประกันสังคม/เดือน</div><div className="card-value" style={{ color: "var(--accent2)" }}>฿{fmt(form.monthlySSOPension)}</div><div className="card-sub">เงินชราภาพ</div></div>
                    )}
                    {form.monthlyInsurancePension > 0 && (
                      <div className="card teal"><div className="card-label">ประกันบำนาญ/เดือน</div><div className="card-value" style={{ color: "var(--accent2)" }}>฿{fmt(form.monthlyInsurancePension)}</div><div className="card-sub">ประกันชีวิต</div></div>
                    )}
                    <div className="card blue"><div className="card-label">รวมรายรับ/เดือน</div><div className="card-value" style={{ color: "var(--blue)" }}>฿{fmt(result.totalMonthlyIncome)}</div><div className="card-sub">จากทุกแหล่ง</div></div>
                    <div className="card orange"><div className="card-label">ต้องดึงจากเงินออม/เดือน</div><div className="card-value">฿{fmt(result.netMonthlyNeed)}</div><div className="card-sub">หลังหักรายรับ (ปรับเงินเฟ้อ)</div></div>
                  </div>
                </>
              )}

              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>📊 รายจ่ายหลังเกษียณ (ปรับอัตราเงินเฟ้อ {form.inflationRate}% ต่อปี)</div>
              <div style={{ background: "rgba(233,196,106,0.06)", border: "1px solid rgba(233,196,106,0.2)", borderRadius: 12, padding: "18px 24px", marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 5 }}>รายจ่ายวันนี้</div><div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>฿{fmt(form.retireMonthlyExpense)}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>ต่อเดือน (มูลค่าปัจจุบัน)</div></div>
                  <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, marginBottom: 4 }}>เงินเฟ้อ {form.inflationRate}% × {result.yearsToRetire} ปี</div><div style={{ fontSize: 24 }}>→</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>× {Math.pow(1 + form.inflationRate / 100, result.yearsToRetire).toFixed(2)} เท่า</div></div>
                  <div><div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600, marginBottom: 5 }}>รายจ่ายตอนเกษียณ (อายุ {form.retireAge} ปี)</div><div style={{ fontSize: 20, fontWeight: 800, color: "var(--gold)" }}>฿{fmt(result.retireExpenseAdj)}</div><div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>ต่อเดือน (มูลค่าอนาคต)</div></div>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>รายจ่ายที่คาดการณ์ทุก 5 ปี</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Array.from({ length: Math.floor(result.yearsToRetire / 5) + 1 }, (_, i) => {
                    const y = i * 5;
                    const age = form.currentAge + y;
                    const exp = form.retireMonthlyExpense * Math.pow(1 + form.inflationRate / 100, y);
                    return (
                      <div key={i} style={{ background: "var(--surface)", border: `1px solid ${y === result.yearsToRetire ? "var(--gold)" : "var(--border)"}`, borderRadius: 8, padding: "7px 12px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: y === result.yearsToRetire ? "var(--gold)" : "var(--muted)", fontWeight: 700 }}>อายุ {age} ปี</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: y === result.yearsToRetire ? "var(--gold)" : "var(--text)", marginTop: 2 }}>฿{fmt(Math.round(exp))}</div>
                      </div>
                    );
                  })}
                </div>
                {result.totalMonthlyIncome > 0 && (
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--surface)", borderRadius: 8, fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                    รายจ่าย <span style={{ color: "var(--gold)", fontWeight: 700 }}>฿{fmt(result.retireExpenseAdj)}</span>/เดือน − รายรับประจำ <span style={{ color: "var(--accent2)", fontWeight: 700 }}>฿{fmt(result.totalMonthlyIncome)}</span>/เดือน = ต้องดึงจากเงินออม <span style={{ color: "var(--text)", fontWeight: 700 }}>฿{fmt(result.netMonthlyNeed)}</span>/เดือน
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>💼 ภาพรวมแผนเกษียณ</div>
              <div className="summary-cards">
                <div className="card orange"><div className="card-label">เงินออมที่จะมี ณ เกษียณ</div><div className="card-value">฿{fmt(result.totalAtRetirement)}</div><div className="card-sub">อายุ {form.retireAge} ปี (รวมก้อนเงินครั้งเดียว)</div></div>
                <div className="card teal"><div className="card-label">เงินออมที่ต้องการ</div><div className="card-value">฿{fmt(result.requiredNestEgg)}</div><div className="card-sub">สำหรับรายจ่ายส่วนที่เงินออมต้องรับ</div></div>
                <div className={`card ${result.surplus >= 0 ? "green" : "red"}`}>
                  <div className="card-label">{result.surplus >= 0 ? "✅ ส่วนเกิน" : "⚠️ ขาดเงิน"}</div>
                  <div className="card-value" style={{ color: result.surplus >= 0 ? "var(--green)" : "var(--red)" }}>{result.surplus >= 0 ? "+" : ""}฿{fmt(result.surplus)}</div>
                  <div className="card-sub">{result.surplus >= 0 ? "อยู่ในเส้นทางที่ดี!" : "ต้องปรับแผน"}</div>
                </div>
              </div>

              <div className="card gold" style={{ marginBottom: 20 }}>
                <div className="card-label">ความพร้อมสู่การเกษียณ</div>
                <div className="ready-pct" style={{ color: result.readyPercent >= 100 ? "var(--green)" : result.readyPercent >= 70 ? "var(--gold)" : "var(--red)" }}>{result.readyPercent.toFixed(1)}%</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(result.readyPercent, 100)}%`, background: result.readyPercent >= 100 ? "linear-gradient(90deg,var(--accent2),var(--green))" : result.readyPercent >= 70 ? "linear-gradient(90deg,var(--gold),var(--accent))" : "linear-gradient(90deg,var(--red),var(--accent3))" }} /></div>
                <div className="card-sub">ออมเดือนละ ฿{fmt(result.monthlyContribution)} ({form.monthlySavingRate}% ของรายได้)</div>
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>💡 คำแนะนำการออมเพื่อเป้าหมาย</div>
              <div style={{ background: result.surplus >= 0 ? "linear-gradient(135deg,#f0fff4,#e6f9ef)" : "linear-gradient(135deg,#fff8f0,#fff0e6)", border: `2px solid ${result.surplus >= 0 ? "var(--green)" : "var(--accent)"}`, borderRadius: 16, padding: "22px 24px", marginBottom: 16, boxShadow: "0 2px 12px var(--shadow)" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: result.surplus >= 0 ? "var(--green)" : "var(--accent)", marginBottom: 16, fontFamily: "Mitr" }}>
                  {result.surplus >= 0 ? "✅ แผนการออมของคุณเพียงพอแล้ว!" : "📌 คุณต้องออมเดือนละเท่านี้เพื่อให้พอก่อนเกษียณ"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--warm2)" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>💳 ออมอยู่ตอนนี้</div>
                    <div style={{ fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, color: "var(--text)", fontFamily: "Mitr" }}>฿{fmt(result.monthlyContribution)}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{form.monthlySavingRate}% ของรายได้/เดือน</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: `2px solid ${result.surplus >= 0 ? "var(--green)" : "var(--red)"}` }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>🎯 ต้องออมเพื่อถึงเป้า</div>
                    <div style={{ fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, color: result.surplus >= 0 ? "var(--green)" : "var(--red)", fontFamily: "Mitr" }}>฿{fmt(result.requiredMonthlySaving)}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{result.requiredSavingRate.toFixed(1)}% ของรายได้/เดือน</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--warm2)" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>{result.savingGap <= 0 ? "🟢 ออมเกินเป้า" : "🔴 ต้องออมเพิ่ม"}</div>
                    <div style={{ fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, fontFamily: "Mitr", color: result.savingGap <= 0 ? "var(--green)" : "var(--red)" }}>{result.savingGap <= 0 ? "+" : ""}฿{fmt(Math.abs(result.savingGap))}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>ต่อเดือน</div>
                  </div>
                  <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid var(--warm2)" }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, marginBottom: 6 }}>⏳ เวลาก่อนเกษียณ</div>
                    <div style={{ fontSize: "clamp(18px,4vw,26px)", fontWeight: 800, fontFamily: "Mitr", color: "var(--accent)" }}>{result.yearsToRetire} ปี</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>อีก {result.yearsToRetire * 12} เดือน · เกษียณอายุ {form.retireAge} ปี</div>
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "12px 16px", background: "white", borderRadius: 10, fontSize: 14, color: "var(--text)", lineHeight: 1.8, borderLeft: `4px solid ${result.surplus >= 0 ? "var(--green)" : "var(--accent)"}` }}>
                  {result.surplus >= 0
                    ? <>คุณออม <strong>฿{fmt(result.monthlyContribution)}/เดือน</strong> ซึ่ง<strong style={{color:"var(--green)"}}>เพียงพอแล้ว</strong> มีเวลาสะสมอีก <strong>{result.yearsToRetire} ปี</strong> ({result.yearsToRetire * 12} เดือน) ก่อนเกษียณอายุ {form.retireAge} ปี</>
                    : <>คุณต้องออมอย่างน้อย <strong style={{color:"var(--red)"}}>฿{fmt(result.requiredMonthlySaving)}/เดือน</strong> ภายใน <strong>{result.yearsToRetire} ปี</strong> ข้างหน้า ({result.yearsToRetire * 12} เดือน) เพื่อให้มีเงินพอใช้หลังเกษียณอายุ {form.retireAge} ปี — ปัจจุบันออมอยู่ ฿{fmt(result.monthlyContribution)}/เดือน ต้องเพิ่มอีก <strong style={{color:"var(--red)"}}>฿{fmt(result.savingGap)}/เดือน</strong></>}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>💡 คำแนะนำการออมรายทาง</div>
              <div style={{ background: result.savingGap <= 0 ? "rgba(63,185,80,0.06)" : "rgba(248,81,73,0.06)", border: `1px solid ${result.savingGap <= 0 ? "var(--green)" : "var(--red)"}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, fontWeight: 600 }}>🎯 เป้าหมายเงินออมรายทาง (ทุก 5 ปี)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.milestones.map((m, i) => (
                    <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>{m.อายุ}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 2 }}>฿{fmt(m.เป้าหมายออม)}</div>
                    </div>
                  ))}
                  <div style={{ background: "linear-gradient(135deg,rgba(244,162,97,0.15),rgba(231,111,81,0.15))", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700 }}>อายุ {form.retireAge} ปี 🏁</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", marginTop: 2 }}>฿{fmt(result.requiredNestEgg)}</div>
                  </div>
                </div>
              </div>

              <div className="charts-grid">
                <div className="chart-box">
                  <div className="chart-title">📈 กราฟการเติบโตของเงินออมตลอดช่วงชีวิต</div>
                  <ResponsiveContainer width="100%" height={270}>
                    <AreaChart data={result.projection} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c0722a" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#c0722a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,120,60,0.1)" />
                      <XAxis dataKey="อายุ" stroke="#8a7060" tick={{ fontSize: 11, fontFamily: 'Sarabun' }} tickFormatter={(v) => `${v}ปี`} />
                      <YAxis stroke="#8a7060" tick={{ fontSize: 11, fontFamily: 'Sarabun' }} tickFormatter={(v) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : `${(v/1000).toFixed(0)}K`} />
                      <Tooltip content={customTooltip} />
                      <Legend wrapperStyle={{ fontFamily: 'Sarabun', fontSize: 12 }} />
                      <Area type="monotone" dataKey="เงินออม" stroke="#c0722a" strokeWidth={2} fill="url(#gS)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-box">
                  <div className="chart-title">🥧 สัดส่วนแหล่งที่มาเงินเกษียณ</div>
                  <ResponsiveContainer width="100%" height={270}>
                    <PieChart>
                      <Pie data={result.pie} cx="50%" cy="44%" outerRadius={88} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {result.pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend wrapperStyle={{ fontFamily: 'Sarabun', fontSize: 11 }} />
                      <Tooltip formatter={(v) => `฿${fmt(v)}`} wrapperStyle={{ fontFamily: 'Sarabun' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="section-title" style={{ marginTop: 28 }}>คำแนะนำการวางแผน</div>
              <div className="advice-grid">
                <div className="advice-card"><div className="advice-icon">📅</div><div className="advice-title">ระยะเวลาสะสมทรัพย์</div><div className="advice-text">มีเวลาออม <span className="advice-highlight">{result.yearsToRetire} ปี</span> ({result.yearsToRetire * 12} เดือน) หลังเกษียณใช้เงิน <span className="advice-highlight">{result.yearsInRetirement} ปี</span> รายจ่ายจริงปรับเงินเฟ้อแล้ว ฿{fmt(result.retireExpenseAdj)}/เดือน</div></div>
                <div className="advice-card"><div className="advice-icon">🏦</div><div className="advice-title">รายรับประจำหลังเกษียณ</div><div className="advice-text">{result.totalMonthlyIncome > 0 ? <><span className="advice-highlight">฿{fmt(result.totalMonthlyIncome)}/เดือน</span> ช่วยลดภาระเงินออม เหลือ <span className="advice-highlight">฿{fmt(result.netMonthlyNeed)}/เดือน</span></> : "ยังไม่มีรายรับประจำ ควรพิจารณาประกันบำนาญหรือสิทธิประกันสังคม"}</div></div>
                <div className="advice-card"><div className="advice-icon">📊</div><div className="advice-title">กลยุทธ์การลงทุน</div><div className="advice-text">ผลตอบแทนสุทธิหลังเงินเฟ้อ <span className="advice-highlight">{(form.expectedReturn - form.inflationRate).toFixed(1)}%</span>/ปี ควรกระจายลงทุนในกองทุนรวม หุ้น และพันธบัตร</div></div>
                <div className="advice-card"><div className="advice-icon">🎯</div><div className="advice-title">เป้าหมายถัดไป</div><div className="advice-text">{result.surplus >= 0 ? "เยี่ยม! ลองเพิ่มการออมสร้างกันชนฉุกเฉิน หรือเกษียณก่อนกำหนดได้เลย" : `ควรเพิ่มอัตราออมเป็น ${result.requiredSavingRate.toFixed(1)}% หรือลดรายจ่ายหลังเกษียณ เพื่อปิดช่องว่าง ฿${fmt(Math.abs(result.surplus))}`}</div></div>
              </div>

              {/* Result Banner */}
              {result.surplus >= 0 ? (
                <div ref={bannerRef} style={{ marginTop: 32, borderRadius: 20, background: "linear-gradient(135deg,#f0fff8,#d4f5e2)", border: "2px solid var(--accent2)", textAlign: "center", padding: "32px 24px" }}>
                  <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                    {["🥂","🌟","🏆","✨","🎊"].map((e,i) => (
                      <span key={i} style={{ fontSize: 28, display: "inline-block", animation: `bop${i} 0.8s ease-in-out ${i*0.15}s infinite alternate` }}>{e}</span>
                    ))}
                  </div>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, color: "var(--accent2)", marginBottom: 8 }}>ขอแสดงความยินดี! 🎉</div>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(15px,3vw,20px)", fontWeight: 600, color: "#1a7a55", marginBottom: 12 }}>คุณบรรลุเป้าหมายการเกษียณแล้ว!</div>
                  <div style={{ fontSize: 15, color: "#2a8a65", lineHeight: 1.9, maxWidth: 420, margin: "0 auto 20px" }}>
                    แผนการออมของคุณ <strong>เพียงพอแล้ว</strong> สำหรับการเกษียณอายุ {form.retireAge} ปี คุณจะมีเงินพอใช้ตลอด {result.yearsInRetirement} ปีหลังเกษียณ และยังมีส่วนเกิน <strong>฿{fmt(result.surplus)}</strong> อีกด้วย! 🌈
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                    {[["🌴","เกษียณสบาย"],["💪","วางแผนดีเยี่ยม"],["😊","มีความสุข"]].map(([ic,tx],i) => (
                      <div key={i} style={{ background: "white", borderRadius: 12, padding: "10px 18px", border: "1px solid rgba(42,157,143,0.3)", fontSize: 14, fontWeight: 600, color: "var(--accent2)" }}>{ic} {tx}</div>
                    ))}
                  </div>
                  <style>{`
                    @keyframes bop0{from{transform:translateY(0)}to{transform:translateY(-8px)}}
                    @keyframes bop1{from{transform:translateY(0)}to{transform:translateY(-12px)}}
                    @keyframes bop2{from{transform:translateY(0)}to{transform:translateY(-6px)}}
                    @keyframes bop3{from{transform:translateY(0)}to{transform:translateY(-10px)}}
                    @keyframes bop4{from{transform:translateY(0)}to{transform:translateY(-8px)}}
                  `}</style>
                </div>
              ) : (
                <div ref={bannerRef} style={{ marginTop: 32, borderRadius: 20, background: "linear-gradient(135deg,#fff8f0,#fce8cc)", border: "2px solid var(--accent)", textAlign: "center", padding: "32px 24px" }}>
                  <div style={{ fontSize: 64, marginBottom: 8 }}>💪</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                    {["🌱","⭐","🔥","🌤️","🚀"].map((e,i) => <span key={i} style={{ fontSize: 28 }}>{e}</span>)}
                  </div>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>พยายามต่อไป! 💪</div>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(15px,3vw,20px)", fontWeight: 600, color: "#a05a20", marginBottom: 12 }}>ทุกบาทที่ออมวันนี้คือก้าวสู่เกษียณที่สุขสบาย</div>
                  <div style={{ fontSize: 15, color: "#8a6040", lineHeight: 1.9, maxWidth: 420, margin: "0 auto 20px" }}>
                    ตอนนี้ขาดเงินอีก <strong style={{ color: "var(--red)" }}>฿{fmt(Math.abs(result.surplus))}</strong> จากเป้าหมาย ลองเพิ่มการออมอีกเพียง <strong>฿{fmt(Math.round(result.savingGap))}</strong>/เดือน หรือเริ่มลงทุนในสินทรัพย์ที่ให้ผลตอบแทนสูงขึ้น คุณทำได้แน่นอน! 🌟
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
                    {[["📈","เพิ่มการออม"],["🎯","ตั้งเป้าหมาย"],["🌱","เริ่มต้นวันนี้"],["💡","ปรึกษาผู้เชี่ยวชาญ"]].map(([ic,tx],i) => (
                      <div key={i} style={{ background: "white", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(192,114,42,0.3)", fontSize: 13, fontWeight: 600, color: "var(--accent)" }}>{ic} {tx}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
