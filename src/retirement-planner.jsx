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

  // Lifted state for sub-calculators — persists across tab switches
  const [pvdData, setPvdData] = useState({ salary: 30000, empRate: 5, empBalance: 0, compRate: 5, compBalance: 0, returnRate: 4, yearsLeft: 30 });
  const [ssoData, setSsoData] = useState({ salary: 15000, yearsContrib: 15 });
  const [svData, setSvData] = useState({ lastSalary: 30000, yearsWorked: 10 });
  const [assetsData, setAssetsData] = useState({ rmf:0,rmfRet:5,ltf:0,ltfRet:5,ssf:0,ssfRet:5,esg:0,esgRet:5,mutualFund:0,mutualFundRet:5,stocks:0,stocksRet:7,gold:0,goldRet:5,crypto:0,cryptoRet:10,other:0,otherRet:3 });

  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState("firework");
  const bannerRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [picker, setPicker] = useState(null);
  const [pickerVal, setPickerVal] = useState(0);

  const set = (k, v) => {
    const ageFields = ["currentAge", "retireAge", "lifeExpectancy"];
    const num = parseFloat(v) || 0;
    const val = ageFields.includes(k) ? Math.round(num) : num;
    setForm((f) => {
      const next = { ...f, [k]: val };
      // Keep pvdData.yearsLeft in sync with retireAge/currentAge
      if (k === "retireAge" || k === "currentAge") {
        const yrs = Math.max(1, (k === "retireAge" ? val : f.retireAge) - (k === "currentAge" ? val : f.currentAge));
        setPvdData(p => ({ ...p, yearsLeft: yrs }));
      }
      // Keep pvdData.salary in sync with incomeSalary
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
      const colors = ["#f4a261","#2a9d8f","#e9c46a","#e76f51","#a8dadc","#ff6b9d","#c77dff","#48cae4"];
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
        ctx.fillStyle = `rgba(80,80,80,${Math.min(frame / 80, 0.25)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      particles = particles.filter(p => p.type === "rain" || p.alpha > 0.02);
      particles.forEach(p => {
        if (p.type === "firework") {
          if (frame < p.delay) return;
          ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.shadowBlur = 8; ctx.shadowColor = p.color;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.vx *= 0.98; p.alpha -= 0.016; p.size *= 0.98;
        } else if (p.type === "rain") {
          ctx.save(); ctx.globalAlpha = p.alpha; ctx.strokeStyle = "#999999"; ctx.lineWidth = p.width;
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
    const rPre = expectedReturn / 100;   // อัตราผลตอบแทนก่อนเกษียณ (ต่อปี)
    const rPost = retireReturn / 100;    // อัตราผลตอบแทนหลังเกษียณ (ต่อปี)
    const inf = inflationRate / 100;
    const infM = inf / 12; // เงินเฟ้อรายเดือน
    const infYearFactor = (yrs) => Math.pow(1 + infM, yrs * 12) * (1 + infM); // ทบต้นเงินเฟ้อรายเดือน คิดจากต้นงวด

    // ── FV ณ วันเกษียณ (ใช้สำหรับ pie/milestones เท่านั้น) ─────────────────
    const fvCurrentSavings = currentSavings * Math.pow(1 + rPre, yearsToRetire);
    const fvContributions = rPre > 0
      ? annualContribution * (Math.pow(1 + rPre, yearsToRetire) - 1) / rPre
      : annualContribution * yearsToRetire;
    const lumpSum = providentFund + severancePay + otherLumpsum;
    const totalAtRetirement = fvCurrentSavings + fvContributions + lumpSum;

    // ── ค่าใช้จ่ายหลังเกษียณ (ปรับเงินเฟ้อ) ─────────────────────────────
    // ค่าใช้จ่ายปีแรกหลังเกษียณ (ปลายปีที่ 1 หลังเกษียณ)
    const retireExpenseAdj = retireMonthlyExpense * 12 * infYearFactor(yearsToRetire); // annual (เงินเฟ้อทบรายเดือน)
    const retireMonthlyExpenseAdj = retireExpenseAdj / 12; // monthly for display
    const totalMonthlyIncome = monthlyPension + monthlySSOPension + monthlyInsurancePension;
    const totalAnnualPassive = totalMonthlyIncome * 12;
    // ค่าใช้จ่ายสุทธิปีแรกหลังเกษียณ (รายปี)
    const netAnnualNeed = Math.max(0, retireExpenseAdj - totalAnnualPassive);
    // ใช้ netMonthlyNeed สำหรับ display (หาร 12)
    const netMonthlyNeed = netAnnualNeed / 12;

    // ── requiredNestEgg: คำนวณแบบ loop รายปี ตรงกับ projection ─────────────
    // ค่าใช้จ่ายปี k หลังเกษียณ = netAnnualNeed × (1+inf)^k  (k = 0..yearsInRetirement)
    // discount กลับมา ณ วันเกษียณด้วย rPost (ทบต้นปลายปี)
    let requiredNestEgg = 0;
    if (netAnnualNeed > 0) {
      for (let k = 0; k <= yearsInRetirement; k++) {
        const expenseK = netAnnualNeed * infYearFactor(k);
        requiredNestEgg += expenseK / Math.pow(1 + rPost, k);
      }
    }

    const surplus = totalAtRetirement - requiredNestEgg;
    const readyPercent = requiredNestEgg > 0 ? Math.min((totalAtRetirement / requiredNestEgg) * 100, 200) : 200;

    // ── จำนวนเงินที่ต้องออมต่อปี (ordinary annuity) ──────────────────────
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
      // เป้าหมาย = PV ของ requiredNestEgg ย้อนกลับ yearsLeft ปี (ปลายปี)
      const targetAtAge = requiredNestEgg / Math.pow(1 + rPre, yearsLeft);
      // ที่ทำได้จริง = FV ordinary annuity ปลายปี
      const fvS = currentSavings * Math.pow(1 + rPre, y);
      const fvC = rPre > 0
        ? annualContribution * (Math.pow(1 + rPre, y) - 1) / rPre
        : annualContribution * y;
      const actualAtAge = Math.round(fvS + fvC);
      milestones.push({ อายุ: `${age} ปี`, เป้าหมายออม: Math.round(targetAtAge), ทำได้จริง: actualAtAge });
    }
    const projection = [];
    let balance = currentSavings;
    for (let y = 0; y <= yearsToRetire + yearsInRetirement; y++) {
      const age = currentAge + y;
      let annualIncome, annualExpense;
      if (y < yearsToRetire) {
        // ช่วงทำงาน (ปลายปี): balance ทบต้น แล้วรับเงินออมปลายปี
        annualIncome = monthlyIncome * 12;
        annualExpense = null;
        balance = balance * (1 + rPre) + annualContribution;
      } else if (y === yearsToRetire) {
        // ปีเกษียณ: balance ทบต้นครบจาก loop ก่อนหน้าแล้ว (= FV formula)
        // แค่รับก้อนเงิน lumpSum — ยังไม่ทบต้น/ออม/หักค่าใช้จ่ายในปีนี้
        annualIncome = totalAnnualPassive;
        annualExpense = retireMonthlyExpense * 12 * infYearFactor(y);
        balance = balance + lumpSum;
      } else {
        // ช่วงเกษียณ (ปลายปี): ทบต้นก่อน แล้วหักค่าใช้จ่ายสุทธิปลายปี
        const inflExp = retireMonthlyExpense * 12 * infYearFactor(y);
        const net = Math.max(0, inflExp - totalAnnualPassive);
        annualIncome = totalAnnualPassive;
        annualExpense = inflExp;
        balance = Math.max(0, balance * (1 + rPost) - net);
      }
      // คงเหลือ = ช่วงทำงาน: เท่ากับเงินออม / ช่วงเกษียณ: เงินออม + รายรับ - ค่าใช้จ่าย
      const cashflow = annualExpense !== null ? balance + annualIncome - annualExpense : balance;
      projection.push({
        อายุ: age,
        เงินออม: Math.round(balance),
        รายรับ: Math.round(annualIncome),
        ค่าใช้จ่าย: annualExpense !== null ? Math.round(annualExpense) : null,
        คงเหลือ: Math.round(cashflow),
      });
    }
    // legacyAmount = balance สุดท้าย ณ สิ้นอายุขัย
    const legacyAmount = projection.length > 0 ? projection[projection.length - 1].เงินออม : 0;

    const pie = [
      { name: "เงินออมปัจจุบัน (FV)", value: Math.round(fvCurrentSavings) },
      { name: "ออมรายเดือน (FV)", value: Math.round(fvContributions) },
      { name: "กองทุนสำรอง/เงินชดเชย", value: lumpSum },
      { name: "บำนาญ (PV)", value: Math.round(monthlyPension * 12 * yearsInRetirement) },
      { name: "ประกันสังคม (PV)", value: Math.round(monthlySSOPension * 12 * yearsInRetirement) },
      { name: "ประกันบำนาญ (PV)", value: Math.round(monthlyInsurancePension * 12 * yearsInRetirement) },
    ].filter((d) => d.value > 0);
    setResult({ totalAtRetirement, requiredNestEgg, surplus, readyPercent, monthlyContribution, retireExpenseAdj, retireMonthlyExpenseAdj: retireExpenseAdj / 12, netMonthlyNeed, totalMonthlyIncome, requiredMonthlySaving, requiredSavingRate, savingGap, projection, pie, milestones, yearsToRetire, yearsInRetirement, legacyAmount });
    setActiveTab("result");
  }, [form]);

  const exportPDF = () => {
    if (!result) return;
    const f = form;
    const r = result;
    const fmtN = n => new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
    const today = new Date().toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
    const surplusColor = r.surplus >= 0 ? "#2e7d52" : "#c0392b";
    const readyColor = r.readyPercent >= 100 ? "#2e7d52" : r.readyPercent >= 70 ? "#c0922a" : "#c0392b";

    const milestoneRows = r.milestones.map(m =>
      `<tr><td>${m.อายุ}</td><td style="text-align:right;color:#c0722a;font-weight:700">฿${fmtN(m.เป้าหมายออม)}</td></tr>`
    ).join("");

    const pieRows = r.pie.map(p =>
      `<tr><td>${p.name}</td><td style="text-align:right;font-weight:700">฿${fmtN(p.value)}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"/>
<title>แผนเกษียณสุข – Happy Retirement</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&family=Mitr:wght@400;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', sans-serif; font-size: 14px; color: #3a2a1a; background: white; padding: 32px; }
  h1 { font-family: 'Mitr', sans-serif; font-size: 26px; color: #c0722a; margin-bottom: 4px; }
  h2 { font-family: 'Mitr', sans-serif; font-size: 16px; color: #c0722a; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #ede0cc; }
  .subtitle { color: #8a7060; font-size: 13px; margin-bottom: 24px; }
  .date { color: #8a7060; font-size: 12px; margin-top: 4px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; }
  .card { border: 1.5px solid #ede0cc; border-radius: 10px; padding: 12px 14px; }
  .card-label { font-size: 11px; color: #8a7060; margin-bottom: 4px; }
  .card-value { font-family: 'Mitr', sans-serif; font-size: 20px; font-weight: 700; color: #3a2a1a; }
  .card-sub { font-size: 11px; color: #8a7060; margin-top: 4px; }
  .highlight { background: #fff8f0; border-color: #c0722a; }
  .highlight .card-value { color: #c0722a; }
  .green { border-color: #2e7d52; }
  .green .card-value { color: #2e7d52; }
  .red { border-color: #c0392b; }
  .red .card-value { color: #c0392b; }
  .teal { border-color: #2a9d8f; }
  .teal .card-value { color: #2a9d8f; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f5e6d0; color: #c0722a; font-weight: 700; padding: 8px 10px; font-size: 12px; text-align: left; }
  td { padding: 7px 10px; border-bottom: 1px solid #f0e8dc; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .progress-wrap { height: 10px; background: #ede0cc; border-radius: 5px; overflow: hidden; margin: 8px 0; }
  .progress-fill { height: 100%; border-radius: 5px; }
  .banner { border-radius: 12px; padding: 20px; text-align: center; margin-top: 20px; }
  .banner-title { font-family: 'Mitr', sans-serif; font-size: 22px; font-weight: 700; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f0e8dc; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .section-box { border: 1.5px solid #ede0cc; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  @media print {
    body { padding: 16px; }
    button { display: none; }
    @page { margin: 15mm; size: A4; }
  }
</style>
</head><body>

<h1>🌅 แผนเกษียณสุข — Happy Retirement</h1>
<div class="subtitle">วิเคราะห์โดย Claude AI · แผนเกษียณส่วนตัว</div>
<div class="date">วันที่พิมพ์: ${today}</div>

<h2>📋 ข้อมูลส่วนตัว</h2>
<div class="grid3">
  <div class="card"><div class="card-label">อายุปัจจุบัน</div><div class="card-value">${f.currentAge} ปี</div></div>
  <div class="card"><div class="card-label">อายุเกษียณ</div><div class="card-value">${f.retireAge} ปี</div></div>
  <div class="card"><div class="card-label">อายุขัยที่คาดไว้</div><div class="card-value">${f.lifeExpectancy} ปี</div></div>
</div>
<div class="grid3">
  <div class="card highlight"><div class="card-label">เวลาสะสม</div><div class="card-value">${r.yearsToRetire} ปี</div></div>
  <div class="card"><div class="card-label">ช่วงเกษียณ</div><div class="card-value">${r.yearsInRetirement} ปี</div></div>
  <div class="card"><div class="card-label">เงินออมปัจจุบัน</div><div class="card-value">฿${fmtN(f.currentSavings)}</div></div>
</div>

<h2>💰 รายได้และการออม</h2>
<div class="grid2">
  <div class="card"><div class="card-label">รายได้ต่อเดือน</div><div class="card-value">฿${fmtN(f.monthlyIncome)}</div></div>
  <div class="card highlight"><div class="card-label">อัตราการออม</div><div class="card-value">${f.monthlySavingRate}%</div><div class="card-sub">= ฿${fmtN(r.monthlyContribution)}/เดือน</div></div>
  <div class="card"><div class="card-label">ผลตอบแทนก่อนเกษียณ</div><div class="card-value">${f.expectedReturn}% ต่อปี</div></div>
  <div class="card"><div class="card-label">ผลตอบแทนหลังเกษียณ</div><div class="card-value">${f.retireReturn}% ต่อปี</div></div>
  <div class="card"><div class="card-label">อัตราเงินเฟ้อ</div><div class="card-value">${f.inflationRate}% ต่อปี</div></div>
  <div class="card"><div class="card-label">รายจ่ายหลังเกษียณ (ปัจจุบัน)</div><div class="card-value">฿${fmtN(f.retireMonthlyExpense)}/เดือน</div><div class="card-sub">ปรับเงินเฟ้อแล้ว ฿${fmtN(r.retireMonthlyExpenseAdj)}/เดือน</div></div>
</div>

${(f.monthlyPension + f.monthlySSOPension + f.monthlyInsurancePension) > 0 ? `
<h2>🏦 รายรับหลังเกษียณ</h2>
<div class="grid3">
  ${f.monthlyPension > 0 ? `<div class="card teal"><div class="card-label">บำนาญ/เดือน</div><div class="card-value">฿${fmtN(f.monthlyPension)}</div></div>` : ""}
  ${f.monthlySSOPension > 0 ? `<div class="card teal"><div class="card-label">ประกันสังคม/เดือน</div><div class="card-value">฿${fmtN(f.monthlySSOPension)}</div></div>` : ""}
  ${f.monthlyInsurancePension > 0 ? `<div class="card teal"><div class="card-label">ประกันบำนาญ/เดือน</div><div class="card-value">฿${fmtN(f.monthlyInsurancePension)}</div></div>` : ""}
  <div class="card"><div class="card-label">รวมรายรับ/เดือน</div><div class="card-value">฿${fmtN(r.totalMonthlyIncome)}</div></div>
  <div class="card highlight"><div class="card-label">ต้องดึงจากเงินออม/เดือน</div><div class="card-value">฿${fmtN(r.netMonthlyNeed)}</div></div>
</div>` : ""}

${(f.providentFund + f.severancePay + f.otherLumpsum) > 0 ? `
<h2>💼 เงินก้อนเมื่อเกษียณ</h2>
<div class="grid3">
  ${f.providentFund > 0 ? `<div class="card"><div class="card-label">กองทุนสำรองเลี้ยงชีพ</div><div class="card-value">฿${fmtN(f.providentFund)}</div></div>` : ""}
  ${f.severancePay > 0 ? `<div class="card"><div class="card-label">เงินชดเชย (หักภาษี)</div><div class="card-value">฿${fmtN(f.severancePay)}</div></div>` : ""}
  ${f.otherLumpsum > 0 ? `<div class="card"><div class="card-label">สินทรัพย์และการลงทุน</div><div class="card-value">฿${fmtN(f.otherLumpsum)}</div></div>` : ""}
</div>` : ""}

<h2>📊 ผลการวิเคราะห์แผนเกษียณ</h2>
<div class="grid3">
  <div class="card highlight"><div class="card-label">เงินออมที่จะมี ณ เกษียณ</div><div class="card-value">฿${fmtN(r.totalAtRetirement)}</div><div class="card-sub">อายุ ${f.retireAge} ปี</div></div>
  <div class="card teal"><div class="card-label">เงินที่ต้องเตรียม (ไม่ลงทุน · เงินเฟ้อ ${f.inflationRate}%)</div><div class="card-value">฿${fmtN(r.requiredNestEgg)}</div><div class="card-sub">สำหรับ ${r.yearsInRetirement} ปีหลังเกษียณ</div></div>
  <div class="card ${r.surplus >= 0 ? "green" : "red"}"><div class="card-label">${r.surplus >= 0 ? "✅ ส่วนเกิน" : "⚠️ ขาดเงิน"}</div><div class="card-value">${r.surplus >= 0 ? "+" : ""}฿${fmtN(r.surplus)}</div></div>
</div>

<div class="section-box">
  <div class="card-label" style="margin-bottom:8px;font-weight:700">ความพร้อมสู่การเกษียณ</div>
  <div style="font-family:'Mitr',sans-serif;font-size:28px;font-weight:800;color:${readyColor}">${r.readyPercent.toFixed(1)}%</div>
  <div class="progress-wrap"><div class="progress-fill" style="width:${Math.min(r.readyPercent,100)}%;background:${readyColor}"></div></div>
</div>

<h2>🏦 เงินมรดก ณ สิ้นอายุขัย</h2>
<div class="section-box" style="background:${r.legacyAmount > 0 ? 'linear-gradient(135deg,#f0fff8,#d4f5e2)' : 'linear-gradient(135deg,#fff8f0,#fce8cc)'};border:2px solid ${r.legacyAmount > 0 ? '#2e7d52' : '#c0722a'}">
  <div style="font-size:12px;color:#8a7060;margin-bottom:6px">อายุ ${f.lifeExpectancy} ปี · ผลตอบแทน ${f.retireReturn}% · เงินเฟ้อ ${f.inflationRate}%</div>
  <div style="font-family:Mitr,sans-serif;font-size:28px;font-weight:800;color:${r.legacyAmount > 0 ? '#2e7d52' : '#c0392b'}">${r.legacyAmount > 0 ? `฿${fmtN(r.legacyAmount)}` : 'เงินหมดก่อนสิ้นอายุขัย'}</div>
</div>

<h2>💡 แผนการออม</h2>
<div class="grid2">
  <div class="card"><div class="card-label">ออมอยู่ตอนนี้</div><div class="card-value">฿${fmtN(r.monthlyContribution)}/เดือน</div><div class="card-sub">${f.monthlySavingRate}% ของรายได้</div></div>
  <div class="card ${r.surplus >= 0 ? "green" : "red"}"><div class="card-label">ต้องออมเพื่อถึงเป้า</div><div class="card-value">฿${fmtN(r.requiredMonthlySaving)}/เดือน</div><div class="card-sub">${r.requiredSavingRate.toFixed(1)}% ของรายได้</div></div>
  <div class="card"><div class="card-label">${r.savingGap <= 0 ? "🟢 ออมเกินเป้า" : "🔴 ต้องออมเพิ่ม"}</div><div class="card-value" style="color:${r.savingGap <= 0 ? "#2e7d52" : "#c0392b"}">${r.savingGap <= 0 ? "+" : ""}฿${fmtN(Math.abs(r.savingGap))}/เดือน</div></div>
  <div class="card"><div class="card-label">เวลาก่อนเกษียณ</div><div class="card-value">${r.yearsToRetire} ปี</div><div class="card-sub">อีก ${r.yearsToRetire * 12} เดือน</div></div>
</div>

<h2>🎯 เป้าหมายเงินออมรายทาง</h2>
<table>
  <thead><tr><th>อายุ</th><th style="text-align:right">เป้าหมายเงินออม</th></tr></thead>
  <tbody>
    ${milestoneRows}
    <tr style="background:#fff8f0"><td><strong>อายุ ${f.retireAge} ปี 🏁 (เกษียณ)</strong></td><td style="text-align:right;color:#c0722a;font-weight:800">฿${fmtN(r.requiredNestEgg)}</td></tr>
  </tbody>
</table>

<h2>🥧 แหล่งที่มาเงินเกษียณ</h2>
<table>
  <thead><tr><th>แหล่งที่มา</th><th style="text-align:right">มูลค่า</th></tr></thead>
  <tbody>${pieRows}</tbody>
</table>

<div class="banner" style="background:${r.surplus >= 0 ? "linear-gradient(135deg,#f0fff8,#d4f5e2)" : "linear-gradient(135deg,#fff8f0,#fce8cc)"};border:2px solid ${r.surplus >= 0 ? "#3a8c6e" : "#c0722a"}">
  <div style="font-size:40px;margin-bottom:8px">${r.surplus >= 0 ? "🎉" : "💪"}</div>
  <div class="banner-title" style="color:${r.surplus >= 0 ? "#3a8c6e" : "#c0722a"}">${r.surplus >= 0 ? "ขอแสดงความยินดี! แผนการออมเพียงพอแล้ว" : "พยายามต่อไป! ทุกบาทที่ออมวันนี้มีค่า"}</div>
  <div style="margin-top:10px;font-size:13px;color:#8a7060">${r.surplus >= 0 ? `มีส่วนเกิน ฿${fmtN(r.surplus)} · เกษียณอายุ ${f.retireAge} ปี ใช้เงิน ${r.yearsInRetirement} ปี` : `ขาดอีก ฿${fmtN(Math.abs(r.surplus))} · ต้องออมเพิ่ม ฿${fmtN(Math.round(r.savingGap))}/เดือน`}</div>
</div>

<div style="margin-top:32px;text-align:center;font-size:11px;color:#b0a090;border-top:1px solid #ede0cc;padding-top:16px">
  สร้างโดย แผนเกษียณสุข Happy Retirement · ข้อมูลนี้เป็นการประมาณการเท่านั้น ควรปรึกษาผู้เชี่ยวชาญทางการเงินก่อนตัดสินใจ
</div>

<div style="margin-top:16px;text-align:center">
  <button onclick="window.print()" style="padding:12px 32px;background:#c0722a;color:white;border:none;border-radius:10px;font-size:16px;font-family:'Mitr',sans-serif;font-weight:600;cursor:pointer">🖨️ พิมพ์ / บันทึก PDF</button>
</div>

</body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 800);
  };

  const openPicker = (name, min, max, step, unit, label) => {
    setPickerVal(form[name]);
    setPicker({ name, min, max, step, unit, label });
  };

  // ── Slider Input Field ──
  const InputField = ({ label, name, min, max, step, unit, note, color }) => {
    const isInt = step === 1;
    const autoStep = isInt ? 1 : (step !== undefined ? step : (max - min) / 1000);
    const thumbColor = color || "#c0722a";
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
          <span style={{ fontSize: 14, fontWeight: 600, color: "#3a2a1a" }}>{label}</span>
          {note && <span style={{ fontSize: 12, color: "#3a8c6e", fontWeight: 600 }}>{note}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, position: "relative", height: 36, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, right: 0, height: 5, borderRadius: 3, background: "#ede0cc" }}>
              <div style={{ width: `${Math.min(pct,100)}%`, height: "100%", background: thumbColor, borderRadius: 3, transition: "width 0.1s" }} />
            </div>
            <input type="range" min={min} max={max} step={autoStep} value={form[name]}
              onChange={(e) => applyVal(e.target.value)}
              style={{ position: "absolute", width: "100%", height: 36, WebkitAppearance: "none", appearance: "none", background: "transparent", outline: "none", cursor: "pointer", margin: 0, padding: 0, touchAction: "manipulation" }}
            />
          </div>
          <div onClick={() => openPicker(name, min, max, step, unit, label)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5e6d0", border: `2px solid ${thumbColor}30`, borderRadius: 10, padding: "7px 12px", minWidth: 110, cursor: "pointer", userSelect: "none" }}>
            <span style={{ flex: 1, textAlign: "right", fontSize: 16, fontWeight: 700, color: "#3a2a1a" }}>{isInt ? form[name] : fmt(form[name])}</span>
            <span style={{ fontSize: 12, color: thumbColor, fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
        <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:${thumbColor};box-shadow:0 2px 8px rgba(0,0,0,0.18);border:3px solid white;cursor:pointer;}input[type=range]:active::-webkit-slider-thumb{width:30px;height:30px;}input[type=range]::-webkit-slider-runnable-track{background:transparent;}`}</style>
      </div>
    );
  };

  // ── Wheel / Keypad Picker Modal ──
  const WheelPicker = () => {
    if (!picker) return null;
    const { name, min, max, step, unit, label } = picker;
    const isInt = step === 1;
    const items = [];
    if (isInt) for (let i = min; i <= max; i++) items.push(i);
    const confirmPicker = () => { set(name, Math.max(0, pickerVal)); setPicker(null); };
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setPicker(null)}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "white", borderRadius: "24px 24px 0 0", padding: "0 0 32px", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}><div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 12px" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#3a2a1a", fontFamily: "Mitr" }}>{label}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPicker(null)} style={{ padding: "8px 18px", borderRadius: 10, border: "2px solid #ede0cc", background: "white", fontSize: 15, fontWeight: 600, color: "#8a7060", cursor: "pointer" }}>ยกเลิก</button>
              <button onClick={confirmPicker} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#c0722a", fontSize: 15, fontWeight: 600, color: "white", cursor: "pointer" }}>ตกลง</button>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "8px 24px", background: "#f5e6d0", margin: "0 24px 16px", borderRadius: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "#c0722a", fontFamily: "Mitr" }}>{isInt ? pickerVal : fmt(pickerVal)}</span>
            <span style={{ fontSize: 18, color: "#8a7060", marginLeft: 8 }}>{unit}</span>
          </div>
          {isInt ? (
            <div style={{ position: "relative", height: 220, overflow: "hidden", margin: "0 24px" }}>
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 44, transform: "translateY(-50%)", background: "rgba(192,114,42,0.1)", border: "2px solid #c0722a", borderRadius: 10, pointerEvents: "none", zIndex: 2 }} />
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, white, transparent)", zIndex: 1, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, white, transparent)", zIndex: 1, pointerEvents: "none" }} />
              <div style={{ overflowY: "scroll", height: "100%", scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" }}
                ref={el => { if (el) { const idx = items.indexOf(Math.round(pickerVal)); el.scrollTop = idx * 44; el.onscroll = () => { const i = Math.round(el.scrollTop / 44); const v = items[Math.max(0, Math.min(items.length - 1, i))]; if (v !== undefined) setPickerVal(v); }; } }}>
                <div style={{ height: 88 }} />
                {items.map(v => <div key={v} onClick={() => setPickerVal(v)} style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: v === pickerVal ? 22 : 18, fontWeight: v === pickerVal ? 800 : 400, color: v === pickerVal ? "#c0722a" : "#8a7060", scrollSnapAlign: "center", cursor: "pointer" }}>{v} {unit}</div>)}
                <div style={{ height: 88 }} />
              </div>
            </div>
          ) : (
            <div style={{ padding: "0 20px 8px" }}>
              <div style={{ background: "#f5e6d0", borderRadius: 14, padding: "12px 16px", marginBottom: 16, border: "2px solid #c0722a" }}>
                <input type="number" value={pickerVal} onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setPickerVal(Math.min(max, Math.max(0, v))); }} autoFocus inputMode="numeric"
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 28, fontWeight: 800, color: "#c0722a", fontFamily: "Mitr", textAlign: "right" }} />
                <div style={{ fontSize: 13, color: "#8a7060", marginTop: 4 }}>ช่วง: {fmt(min)} – {fmt(max)} {unit}</div>
              </div>
              {(() => {
                const cfg = { monthlyIncome:{step:1000,presets:[15000,20000,30000,50000,80000,100000]}, monthlySavingRate:{step:1,presets:[5,10,15,20,30]}, retireMonthlyExpense:{step:1000,presets:[10000,15000,20000,30000,50000]}, expectedReturn:{step:0.5,presets:[0,3,5,7,10]}, retireReturn:{step:0.5,presets:[0,2,3,5,7]}, inflationRate:{step:1,presets:[1,2,3,4,5]}, providentFund:{step:5000,presets:[0,100000,500000,1000000,5000000]}, severancePay:{step:5000,presets:[0,50000,100000,200000,500000]}, otherLumpsum:{step:10000,presets:[0,100000,500000,1000000,3000000]}, currentSavings:{step:10000,presets:[0,100000,500000,1000000,2000000]}, monthlyPension:{step:500,presets:[0,3000,5000,10000,20000]}, monthlySSOPension:{step:100,presets:[0,1000,3000,5000,7500]}, monthlyInsurancePension:{step:500,presets:[0,2000,5000,10000,20000]} };
                const c = cfg[name] || { step: step || 1, presets: [] };
                const s = c.step;
                return (<div>
                  <div style={{ fontSize: 13, color: "#8a7060", marginBottom: 8, fontWeight: 600 }}>เลือกค่าด่วน</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                    {c.presets.filter(p => p >= min && p <= max).map(p => (
                      <button key={p} onClick={() => setPickerVal(p)} style={{ padding: "8px 14px", borderRadius: 10, border: pickerVal === p ? "2px solid #c0722a" : "2px solid #ede0cc", background: pickerVal === p ? "rgba(192,114,42,0.1)" : "white", fontSize: 14, fontWeight: 600, color: pickerVal === p ? "#c0722a" : "#3a2a1a", cursor: "pointer" }}>{fmt(p)}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setPickerVal(v => Math.max(0, parseFloat((v - s).toFixed(4))))} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid #ffd5d5", background: "#fff5f5", fontSize: 18, fontWeight: 800, color: "#c0392b", cursor: "pointer" }}>− {fmt(s)}</button>
                    <button onClick={() => setPickerVal(v => Math.min(max, parseFloat((v + s).toFixed(4))))} style={{ flex: 1, padding: "14px 0", borderRadius: 12, border: "2px solid #d5f5e3", background: "#f0fff4", fontSize: 18, fontWeight: 800, color: "#2e7d52", cursor: "pointer" }}>+ {fmt(s)}</button>
                  </div>
                </div>);
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
      <div style={{ background: "white", border: "2px solid #ede0cc", borderRadius: 10, padding: "12px 16px", fontFamily: "Sarabun, sans-serif", fontSize: 14, boxShadow: "0 4px 12px rgba(150,100,50,0.12)" }}>
        <p style={{ fontWeight: 700, color: "#c0722a", marginBottom: 5 }}>อายุ {label} ปี</p>
        {payload.map(p => <p key={p.name} style={{ color: p.color }}>฿{fmt(p.value)}</p>)}
      </div>
    );
  };

  // ── Savings Box (inline, editable) ──
  const SavingsBox = () => {
    const ref = useRef(null);
    const presets = [0, 100000, 500000, 1000000, 2000000, 5000000];
    useEffect(() => {
      if (ref.current && document.activeElement !== ref.current) {
        ref.current.value = form.currentSavings > 0 ? new Intl.NumberFormat("th-TH").format(form.currentSavings) : "";
      }
    }, [form.currentSavings]);
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#3a2a1a", marginBottom: 10 }}>เงินออมปัจจุบัน</div>
        <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid #c0722a", borderRadius: 12, padding: "12px 16px", marginBottom: 8, overflow: "hidden" }}>
          <div style={{ fontSize: 11, color: "#8a7060", marginBottom: 6 }}>เงินออมที่มีอยู่ตอนนี้</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 20, color: "#c0722a", fontWeight: 800, fontFamily: "Mitr", flexShrink: 0 }}>฿</span>
            <input
              ref={ref}
              type="text"
              inputMode="numeric"
              placeholder="0"
              defaultValue=""
              onFocus={e => { e.target.value = form.currentSavings > 0 ? String(form.currentSavings) : ""; e.target.select(); }}
              onBlur={e => {
                const n = parseInt(e.target.value.replace(/[^0-9]/g, "") || "0", 10);
                set("currentSavings", n);
                e.target.value = n > 0 ? new Intl.NumberFormat("th-TH").format(n) : "";
              }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: "clamp(18px,5vw,26px)", fontWeight: 800, color: "#c0722a", fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: "#c0722a", fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>บาท</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {presets.map(p => (
            <button key={p}
              onClick={() => { set("currentSavings", p); if (ref.current) ref.current.value = p > 0 ? new Intl.NumberFormat("th-TH").format(p) : "0"; }}
              style={{ padding: "6px 12px", borderRadius: 8, border: form.currentSavings === p ? "2px solid #c0722a" : "1.5px solid #ede0cc", background: form.currentSavings === p ? "rgba(192,114,42,0.1)" : "white", fontSize: 13, fontWeight: 600, color: form.currentSavings === p ? "#c0722a" : "#8a7060", cursor: "pointer" }}>
              {p === 0 ? "0" : new Intl.NumberFormat("th-TH").format(p)}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ── Expense Box (inline, editable) ──
  const ExpenseBox = () => {
    const ref = useRef(null);
    const presets = [10000, 15000, 20000, 30000, 50000, 80000, 100000];
    useEffect(() => {
      if (ref.current && document.activeElement !== ref.current) {
        ref.current.value = form.retireMonthlyExpense > 0 ? new Intl.NumberFormat("th-TH").format(form.retireMonthlyExpense) : "";
      }
    }, [form.retireMonthlyExpense]);
    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#3a2a1a", marginBottom: 10 }}>
          รายจ่ายหลังเกษียณ/เดือน <span style={{ fontSize: 12, color: "#8a7060", fontWeight: 400 }}>(Lifestyle)</span>
        </div>
        <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid #c0722a", borderRadius: 12, padding: "12px 16px", marginBottom: 8, overflow: "hidden" }}>
          <div style={{ fontSize: 11, color: "#8a7060", marginBottom: 6 }}>ค่าใช้จ่ายต่อเดือน</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
            <span style={{ fontSize: 20, color: "#c0722a", fontWeight: 800, fontFamily: "Mitr", flexShrink: 0 }}>฿</span>
            <input
              ref={ref}
              type="text"
              inputMode="numeric"
              placeholder="0"
              defaultValue=""
              onFocus={e => { e.target.value = form.retireMonthlyExpense > 0 ? String(form.retireMonthlyExpense) : ""; e.target.select(); }}
              onBlur={e => {
                const n = parseInt(e.target.value.replace(/[^0-9]/g, "") || "0", 10);
                set("retireMonthlyExpense", n);
                e.target.value = n > 0 ? new Intl.NumberFormat("th-TH").format(n) : "";
              }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none", fontSize: "clamp(18px,5vw,26px)", fontWeight: 800, color: "#c0722a", fontFamily: "Mitr", textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: "#c0722a", fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>บาท</span>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {presets.map(p => (
            <button key={p}
              onClick={() => { set("retireMonthlyExpense", p); if (ref.current) ref.current.value = new Intl.NumberFormat("th-TH").format(p); }}
              style={{ padding: "6px 12px", borderRadius: 8, border: form.retireMonthlyExpense === p ? "2px solid #c0722a" : "1.5px solid #ede0cc", background: form.retireMonthlyExpense === p ? "rgba(192,114,42,0.1)" : "white", fontSize: 13, fontWeight: 600, color: form.retireMonthlyExpense === p ? "#c0722a" : "#8a7060", cursor: "pointer" }}>
              {new Intl.NumberFormat("th-TH").format(p)}
            </button>
          ))}
        </div>
      </div>
    );
  };


  // ── Income Calculator ──
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
        <div style={{ marginBottom: 16, background: "white", border: `1.5px solid ${inc[field] > 0 ? color + "50" : "#ede0cc"}`, borderRadius: 12, padding: "14px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#3a2a1a", marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 11, color: "#8a7060", marginBottom: 8 }}>{desc}</div>
          <div style={{ background: "#f5e6d0", border: `1.5px solid ${inc[field] > 0 ? color : "#ede0cc"}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <input type="text" inputMode="numeric" value={displayVal} placeholder="0"
              onFocus={() => { setEditing(true); setRaw(inc[field] > 0 ? String(inc[field]) : ""); }}
              onChange={e => setRaw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setEditing(false); const n = parseInt(raw || "0", 10); setRaw(n > 0 ? String(n) : ""); si(field, n); }}
              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, color: "#3a2a1a", fontFamily: "Mitr", textAlign: "right" }} />
            <span style={{ fontSize: 13, color, fontWeight: 700 }}>{unit}</span>
          </div>
        </div>
      );
    };
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid #ede0cc", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#8a7060" }}>← กลับ</button>
          <h2 style={{ fontFamily: "Mitr", fontSize: 18, color: "#3a2a1a", fontWeight: 600 }}>💰 กรอกข้อมูลรายได้</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 16 }}>
          <div>
            <NumInc label="เงินเดือน" field="salary" unit="บาท/เดือน" desc="เงินเดือนประจำก่อนหักภาษี" color="#c0722a" />
            <NumInc label="ค่าตอบแทน / OT" field="compensation" unit="บาท/เดือน" desc="รายได้เพิ่มเติม" color="#e76f51" />
            <NumInc label="รายได้อื่นๆ" field="other" unit="บาท/เดือน" desc="ฟรีแลนซ์ / ธุรกิจ ฯลฯ" color="#2980b9" />
          </div>
          <div>
            <div style={{ marginBottom: 16, background: "white", border: `1.5px solid ${inc.bonusMonths > 0 ? "#c0922a60" : "#ede0cc"}`, borderRadius: 12, padding: "14px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#3a2a1a", marginBottom: 8 }}>🎁 โบนัสประจำปี</div>
              <div style={{ background: "#f5e6d0", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <input type="number" inputMode="decimal" step="0.5" min="0" max="12" value={inc.bonusMonths} onChange={e => si("bonusMonths", e.target.value)} style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 18, fontWeight: 700, fontFamily: "Mitr", textAlign: "right" }} />
                <span style={{ fontSize: 13, color: "#c0922a", fontWeight: 700 }}>เดือน/ปี</span>
              </div>
              {inc.bonusMonths > 0 && <div style={{ fontSize: 12, color: "#8a7060", marginTop: 6 }}>= เฉลี่ย ฿{fmt(Math.round(bonusMonthly))}/เดือน</div>}
            </div>
            <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid #c0722a", borderRadius: 14, padding: "18px" }}>
              <div style={{ fontFamily: "Mitr", fontSize: 14, fontWeight: 600, color: "#c0722a", marginBottom: 10 }}>💰 รวมรายได้</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#c0722a", fontFamily: "Mitr", textAlign: "center" }}>฿{fmt(Math.round(totalMonthly))}<span style={{ fontSize: 14, color: "#8a7060" }}>/เดือน</span></div>
            </div>
          </div>
        </div>
        <button onClick={() => onSave(Math.round(totalMonthly), Math.round(inc.salary))} style={{ width: "100%", marginTop: 20, padding: "14px", background: "linear-gradient(135deg,#c0722a,#a05a20)", border: "none", borderRadius: 12, color: "white", fontFamily: "Mitr", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>✅ ใช้รายได้รวม ฿{fmt(Math.round(totalMonthly))}</button>
      </div>
    );
  };

  // ── PVD Calculator ──
  const PVDCalculator = ({ onSave, data: pvd, onChange: setPvdExt }) => {
    const sp = (k, v) => { let n = parseFloat(v); if (isNaN(n)) n = 0; if (k === "yearsLeft") n = Math.round(Math.max(1, n)); setPvdExt(p => ({ ...p, [k]: n })); };
    const me = pvd.salary * pvd.empRate / 100, mc = pvd.salary * pvd.compRate / 100;
    const r = pvd.returnRate / 100, mn = pvd.yearsLeft * 12, mr = r / 12;
    const fvE = pvd.empBalance * Math.pow(1 + r, pvd.yearsLeft) + (mr > 0 ? me * ((Math.pow(1 + mr, mn) - 1) / mr) : me * mn);
    const fvC = pvd.compBalance * Math.pow(1 + r, pvd.yearsLeft) + (mr > 0 ? mc * ((Math.pow(1 + mr, mn) - 1) / mr) : mc * mn);
    const total = fvE + fvC;
    const NR = ({ label, field, unit }) => {
      const [ed, setEd] = useState(false); const [rw, setRw] = useState("");
      return (<div style={{ marginBottom: 18 }}><div style={{ fontSize: 14, fontWeight: 600, color: "#3a2a1a", marginBottom: 8 }}>{label}</div>
        <div style={{ background: "#f5e6d0", border: "2px solid #c0722a", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <input type="text" inputMode="numeric" value={ed ? rw : (pvd[field] > 0 ? new Intl.NumberFormat("th-TH").format(pvd[field]) : "")} placeholder="0"
            onFocus={() => { setEd(true); setRw(pvd[field] > 0 ? String(pvd[field]) : ""); }}
            onChange={e => setRw(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={() => { setEd(false); sp(field, parseInt(rw || "0", 10)); }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 20, fontWeight: 700, fontFamily: "Mitr", textAlign: "right" }} />
          <span style={{ fontSize: 13, color: "#c0922a", fontWeight: 700 }}>{unit}</span></div></div>);
    };
    return (<div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid #ede0cc", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#8a7060" }}>← กลับ</button>
        <h2 style={{ fontFamily: "Mitr", fontSize: 18, fontWeight: 600 }}>🏦 คำนวณกองทุนสำรองเลี้ยงชีพ</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div><NR label="เงินเดือน" field="salary" unit="บาท" /><NR label="ยอดสะสมพนักงาน" field="empBalance" unit="บาท" /><NR label="ยอดสะสมนายจ้าง" field="compBalance" unit="บาท" /><NR label="ปีที่เหลือก่อนเกษียณ" field="yearsLeft" unit="ปี" /></div>
        <div>
          <div style={{ marginBottom: 12 }}><span>อัตราพนักงาน: {pvd.empRate}%</span><input type="range" min={2} max={15} value={pvd.empRate} onChange={e => sp("empRate", e.target.value)} style={{ width: "100%" }} /></div>
          <div style={{ marginBottom: 12 }}><span>อัตรานายจ้าง: {pvd.compRate}%</span><input type="range" min={2} max={15} value={pvd.compRate} onChange={e => sp("compRate", e.target.value)} style={{ width: "100%" }} /></div>
          <div style={{ marginBottom: 12 }}><span>ผลตอบแทนกองทุน: {pvd.returnRate}%</span><input type="range" min={1} max={15} step={0.5} value={pvd.returnRate} onChange={e => sp("returnRate", e.target.value)} style={{ width: "100%" }} /></div>
        </div>
      </div>
      <div style={{ background: "linear-gradient(135deg,#fff8e6,#fdf0cc)", border: "2px solid #c0922a", borderRadius: 16, padding: "20px", marginTop: 20, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#8a7060", marginBottom: 6 }}>💰 มูลค่ากองทุนเมื่อเกษียณ</div>
        <div style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, color: "#c0922a", fontFamily: "Mitr" }}>฿{fmt(Math.round(total))}</div>
        <button onClick={() => onSave(Math.round(total))} style={{ marginTop: 16, width: "100%", padding: "14px", background: "linear-gradient(135deg,#c0922a,#b8891e)", border: "none", borderRadius: 12, color: "white", fontFamily: "Mitr", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>✅ ใช้ค่านี้</button>
      </div>
    </div>);
  };

  // ── SSO Calculator ──
  const SSOCalculator = ({ onSave, data: sso, onChange: setSsoExt }) => {
    const ss = (k, v) => { let n = parseFloat(v); if (isNaN(n)) n = 0; setSsoExt(p => ({ ...p, [k]: Math.round(n) })); };
    const base = Math.min(sso.salary, 15000), mc = base * 0.05;
    const mp = sso.yearsContrib >= 15 ? Math.min(base * 0.20 + base * 0.015 * Math.max(0, sso.yearsContrib - 15), 7500) : 0;
    return (<div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid #ede0cc", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#8a7060" }}>← กลับ</button>
        <h2 style={{ fontFamily: "Mitr", fontSize: 18, fontWeight: 600 }}>🛡️ ประกันสังคม ม.33</h2>
      </div>
      <div style={{ marginBottom: 18 }}><span>เงินเดือน: </span><input type="number" value={sso.salary} onChange={e => ss("salary", e.target.value)} style={{ width: 120, fontSize: 18, fontWeight: 700, fontFamily: "Mitr", textAlign: "right", border: "2px solid #3a8c6e", borderRadius: 8, padding: "6px 10px" }} /> บาท <span style={{ fontSize: 12, color: "#8a7060" }}>(ฐานสูงสุด 15,000)</span></div>
      <div style={{ marginBottom: 18 }}><span>ปีที่ส่งสมทบ: {sso.yearsContrib} ปี</span><input type="range" min={1} max={40} value={sso.yearsContrib} onChange={e => ss("yearsContrib", e.target.value)} style={{ width: "100%" }} /></div>
      <div style={{ background: sso.yearsContrib >= 15 ? "linear-gradient(135deg,#f0fff8,#e0f5ec)" : "#fff8f0", border: `2px solid ${sso.yearsContrib >= 15 ? "#3a8c6e" : "#c0722a"}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
        {sso.yearsContrib >= 15 ? (<><div style={{ color: "#3a8c6e", fontWeight: 600, marginBottom: 6 }}>🎉 ได้บำนาญรายเดือน</div><div style={{ fontSize: 36, fontWeight: 800, color: "#3a8c6e", fontFamily: "Mitr" }}>฿{fmt(Math.round(mp))}<span style={{ fontSize: 14, color: "#8a7060" }}>/เดือน</span></div></>) : <div style={{ color: "#c0722a" }}>⚠️ ต้องส่งอีก {15 - sso.yearsContrib} ปี จึงจะได้บำนาญ</div>}
      </div>
      {sso.yearsContrib >= 15 && <button onClick={() => onSave(Math.round(mp))} style={{ width: "100%", marginTop: 16, padding: "14px", background: "linear-gradient(135deg,#3a8c6e,#2a6e54)", border: "none", borderRadius: 12, color: "white", fontFamily: "Mitr", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>✅ ใช้ค่านี้ ฿{fmt(Math.round(mp))}/เดือน</button>}
    </div>);
  };

  // ── Severance Calculator ──
  const SeveranceCalculator = ({ onSave, data: sv, onChange: setSvExt }) => {
    const ss = (k, v) => setSvExt(p => ({ ...p, [k]: parseFloat(v) || 0 }));
    const getDays = y => { if (y < 1) return 30; if (y < 3) return 90; if (y < 6) return 180; if (y < 10) return 240; if (y < 20) return 300; return 400; };
    const days = getDays(sv.yearsWorked), daily = sv.lastSalary / 30, gross = daily * days;
    const ex = Math.min(gross, 600000), d1 = 7000 * sv.yearsWorked, d2 = Math.max(0, gross - ex - d1) * 0.5;
    const taxable = Math.max(0, gross - ex - d1 - d2);
    const calcTax = inc => { const br = [[300000,.05],[200000,.10],[250000,.15],[250000,.20],[1e6,.25],[3e6,.30],[Infinity,.35]]; let t=0,r=inc; for(const [l,rt] of br){if(r<=0)break;t+=Math.min(r,l)*rt;r-=l;} return t; };
    const net = gross - calcTax(taxable);
    return (<div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid #ede0cc", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#8a7060" }}>← กลับ</button>
        <h2 style={{ fontFamily: "Mitr", fontSize: 18, fontWeight: 600 }}>💼 เงินชดเชย</h2>
      </div>
      <div style={{ marginBottom: 18 }}><span>เงินเดือนสุดท้าย: </span><input type="number" value={sv.lastSalary} onChange={e => ss("lastSalary", e.target.value)} style={{ width: 140, fontSize: 18, fontWeight: 700, fontFamily: "Mitr", textAlign: "right", border: "2px solid #c0722a", borderRadius: 8, padding: "6px 10px" }} /> บาท</div>
      <div style={{ marginBottom: 18 }}><span>อายุงาน: {sv.yearsWorked} ปี ({days} วัน)</span><input type="range" min={1} max={40} value={sv.yearsWorked} onChange={e => ss("yearsWorked", e.target.value)} style={{ width: "100%" }} /></div>
      <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid #c0722a", borderRadius: 12, padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#c0722a", fontWeight: 600, marginBottom: 6 }}>💰 เงินชดเชยสุทธิ</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#c0722a", fontFamily: "Mitr" }}>฿{fmt(Math.round(net))}</div>
      </div>
      <button onClick={() => onSave(Math.round(net))} style={{ width: "100%", marginTop: 16, padding: "14px", background: "linear-gradient(135deg,#c0722a,#a05a20)", border: "none", borderRadius: 12, color: "white", fontFamily: "Mitr", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>✅ ใช้ค่านี้ ฿{fmt(Math.round(net))}</button>
    </div>);
  };

  // ── Assets Calculator ──
  const AssetsCalculator = ({ onSave, data: assets, onChange: setAssetsExt }) => {
    const sa = (k, v) => setAssetsExt(p => ({ ...p, [k]: parseFloat(v) || 0 }));
    const list = [
      { key:"rmf",rk:"rmfRet",label:"RMF",emoji:"🏦",color:"#2980b9" },
      { key:"ssf",rk:"ssfRet",label:"SSF",emoji:"🛡️",color:"#8e44ad" },
      { key:"stocks",rk:"stocksRet",label:"หุ้น",emoji:"📊",color:"#c0392b" },
      { key:"gold",rk:"goldRet",label:"ทองคำ",emoji:"🥇",color:"#c0922a" },
      { key:"crypto",rk:"cryptoRet",label:"คริปโต",emoji:"₿",color:"#e67e22" },
      { key:"other",rk:"otherRet",label:"อื่นๆ",emoji:"🏠",color:"#7f8c8d" },
    ];
    const yrs = form.retireAge - form.currentAge;
    const totalFV = list.reduce((s, a) => s + assets[a.key] * Math.pow(1 + assets[a.rk] / 100, yrs), 0);
    const AR = ({ item }) => {
      const [ed, setEd] = useState(false); const [rw, setRw] = useState("");
      return (<div style={{ marginBottom: 12, background: "white", border: `1.5px solid ${assets[item.key] > 0 ? item.color + "50" : "#ede0cc"}`, borderRadius: 12, padding: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span>{item.emoji}</span><strong>{item.label}</strong></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><div style={{ fontSize: 11, color: "#8a7060", marginBottom: 4 }}>มูลค่า</div>
            <input type="text" inputMode="numeric" value={ed ? rw : (assets[item.key] > 0 ? fmt(assets[item.key]) : "")} placeholder="0"
              onFocus={() => { setEd(true); setRw(assets[item.key] > 0 ? String(assets[item.key]) : ""); }}
              onChange={e => setRw(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => { setEd(false); sa(item.key, parseInt(rw || "0", 10)); }}
              style={{ width: "100%", background: "#f5e6d0", border: `1.5px solid ${item.color}40`, borderRadius: 8, padding: "8px", fontSize: 14, fontWeight: 700, fontFamily: "Mitr", textAlign: "right" }} /></div>
          <div><div style={{ fontSize: 11, color: "#8a7060", marginBottom: 4 }}>ผลตอบแทน/ปี</div>
            <input type="number" step="0.5" value={assets[item.rk]} onChange={e => sa(item.rk, e.target.value)}
              style={{ width: "100%", background: "#f5e6d0", border: `1.5px solid ${item.color}40`, borderRadius: 8, padding: "8px", fontSize: 14, fontWeight: 700, color: item.color, fontFamily: "Mitr", textAlign: "right" }} /></div>
        </div>
      </div>);
    };
    return (<div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => setActiveTab("input")} style={{ padding: "8px 16px", borderRadius: 10, border: "2px solid #ede0cc", background: "white", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#8a7060" }}>← กลับ</button>
        <h2 style={{ fontFamily: "Mitr", fontSize: 18, fontWeight: 600 }}>📊 สินทรัพย์</h2>
      </div>
      {list.map(item => <AR key={item.key} item={item} />)}
      <div style={{ background: "linear-gradient(135deg,#f0f8ff,#e8f4fd)", border: "2px solid #2980b9", borderRadius: 16, padding: "20px", marginTop: 16, textAlign: "center" }}>
        <div style={{ fontSize: 13, color: "#8a7060", marginBottom: 6 }}>มูลค่าเมื่อเกษียณ (FV)</div>
        <div style={{ fontSize: "clamp(24px,5vw,36px)", fontWeight: 800, color: "#2980b9", fontFamily: "Mitr" }}>฿{fmt(Math.round(totalFV))}</div>
        <button onClick={() => onSave(Math.round(totalFV))} style={{ marginTop: 16, width: "100%", padding: "14px", background: "linear-gradient(135deg,#2980b9,#1a5f8a)", border: "none", borderRadius: 12, color: "white", fontFamily: "Mitr", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>✅ ใช้มูลค่า ฿{fmt(Math.round(totalFV))}</button>
      </div>
    </div>);
  };

  // ── Main Render ──
  const readyColor = result ? (result.readyPercent >= 100 ? "#2e7d52" : result.readyPercent >= 70 ? "#c0922a" : "#c0392b") : "#c0722a";

  return (
    <div style={{ minHeight: "100vh", background: "#fdf8f2", fontFamily: "Sarabun, sans-serif" }}>
      <WheelPicker />
      {showAnimation && <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none", width: "100%", height: "100%" }} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Mitr:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .section-title { font-family: 'Mitr', sans-serif; font-size: 15px; font-weight: 500; color: #c0722a; margin: 28px 0 16px; padding-bottom: 10px; border-bottom: 2px solid #ede0cc; }
        .tab-btn { padding: 9px 14px; border-radius: 10px 10px 0 0; border: 2px solid rgba(180,120,60,0.15); border-bottom: none; background: #f5e6d0; color: #8a7060; cursor: pointer; font-family: 'Sarabun'; font-size: 13px; font-weight: 600; white-space: nowrap; }
        .tab-btn.active { background: #fff; color: #c0722a; border-color: #c0722a; border-bottom: 2px solid #fff; margin-bottom: -2px; }
        .card-sm { background: white; border: 1.5px solid #ede0cc; border-radius: 12px; padding: 14px 16px; }
        @media (max-width:640px) { .two-col { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Header */}
      <div style={{ padding: "24px 16px 0", borderBottom: "2px solid #ede0cc", background: "linear-gradient(135deg,#fff8ef,#fdf3e7)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: "#c0722a", textTransform: "uppercase", marginBottom: 8 }}>🌅 วางแผนชีวิตหลังเกษียณ</div>
              <h1 style={{ fontFamily: "Mitr", fontSize: "clamp(24px,4vw,40px)", fontWeight: 600, color: "#3a2a1a" }}>แผนเกษียณสุข <span style={{ color: "#c0722a" }}>Happy Retirement</span></h1>
            </div>
            <button onClick={() => setHelpOpen(true)} style={{ padding: "9px 16px", borderRadius: 10, background: "linear-gradient(135deg,#c0722a,#a05a20)", border: "none", color: "white", cursor: "pointer", fontFamily: "Mitr", fontSize: 13, fontWeight: 600 }}>❓ วิธีใช้</button>
          </div>
          {result && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "white", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "#8a7060", fontWeight: 600 }}>ความพร้อม</span>
              <div style={{ flex: 1, height: 8, background: "#ede0cc", borderRadius: 4, overflow: "hidden" }}><div style={{ width: `${Math.min(result.readyPercent,100)}%`, height: "100%", background: readyColor, borderRadius: 4 }} /></div>
              <span style={{ fontSize: 16, fontWeight: 800, color: readyColor, fontFamily: "Mitr" }}>{result.readyPercent.toFixed(1)}%</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[{id:"input",label:"📋 กรอกข้อมูล"},{id:"income",label:"💰 รายได้"},{id:"pvd",label:"🏦 กองทุนสำรองเลี้ยงชีพ"},{id:"sso",label:"🛡️ ประกันสังคม"},{id:"severance",label:"💼 เงินชดเชย"},{id:"assets",label:"📊 สินทรัพย์"},...(result ? [{id:"result",label:"📊 ผลวิเคราะห์"}] : [])].map(t => (
              <button key={t.id} className={`tab-btn${activeTab === t.id ? " active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 60px" }}>
        <div style={{ background: "white", border: "2px solid rgba(180,120,60,0.15)", borderTop: "2px solid #c0722a", borderRadius: "0 16px 16px 16px", padding: "20px 16px 24px" }}>

          {activeTab === "income" && <IncomeCalculator data={incomeData} onChange={setIncomeData} onSave={(val, sal) => { set("monthlyIncome", val); set("incomeSalary", sal); setActiveTab("input"); }} />}
          {activeTab === "pvd" && <PVDCalculator data={pvdData} onChange={setPvdData} onSave={val => { set("providentFund", val); setActiveTab("input"); }} />}
          {activeTab === "sso" && <SSOCalculator data={ssoData} onChange={setSsoData} onSave={val => { set("monthlySSOPension", val); setActiveTab("input"); }} />}
          {activeTab === "severance" && <SeveranceCalculator data={svData} onChange={setSvData} onSave={val => { set("severancePay", val); setActiveTab("input"); }} />}
          {activeTab === "assets" && <AssetsCalculator data={assetsData} onChange={setAssetsData} onSave={val => { set("otherLumpsum", val); setActiveTab("input"); }} />}

          {/* ── Input Tab ── */}
          {activeTab === "input" && (
            <div>
              <div className="section-title" style={{ marginTop: 0 }}>ข้อมูลส่วนตัว</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }} className="two-col">
                <InputField label="อายุปัจจุบัน" name="currentAge" min={20} max={70} step={1} unit="ปี" />
                <InputField label="อายุเกษียณ" name="retireAge" min={40} max={75} step={1} unit="ปี" />
                <InputField label="อายุขัยที่คาดไว้" name="lifeExpectancy" min={60} max={100} step={1} unit="ปี" />
              </div>

              <div className="section-title">รายได้และการออม</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }} className="two-col">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#3a2a1a", marginBottom: 10 }}>รายได้ต่อเดือน</div>
                  {form.monthlyIncome > 0 ? (
                    <div style={{ background: "linear-gradient(135deg,#fff8f0,#fdf0e0)", border: "2px solid #c0722a", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: "#8a7060", marginBottom: 4 }}>รายได้รวม</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#c0722a", fontFamily: "Mitr" }}>฿{fmt(form.monthlyIncome)}/เดือน</div>
                    </div>
                  ) : <div style={{ background: "#f5e6d0", border: "2px dashed #ede0cc", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "#8a7060", fontSize: 13 }}>ยังไม่ได้กรอก (ไม่บังคับ)</div>}
                  <button onClick={() => setActiveTab("income")} style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#c0722a,#a05a20)", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "Mitr" }}>💰 กรอกข้อมูลรายได้</button>
                </div>
                <InputField label="อัตราการออม" name="monthlySavingRate" min={0} max={80} unit="%" note={`= ฿${fmt((form.monthlyIncome * form.monthlySavingRate) / 100)}/เดือน`} />
                <SavingsBox />
                <ExpenseBox />
              </div>

              <div className="section-title">การลงทุน</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }} className="two-col">
                <InputField label="ผลตอบแทนก่อนเกษียณ" name="expectedReturn" min={0} max={20} step={0.5} unit="% ต่อปี" note="(การลงทุนเพื่อสร้างผลตอบแทน)" />
                <InputField label="ผลตอบแทนหลังเกษียณ" name="retireReturn" min={0} max={20} step={0.5} unit="% ต่อปี" note="(การลงทุนเพื่อรักษาพอร์ทหลังเกษียณ)" color="#3a8c6e" />
                <InputField label="อัตราเงินเฟ้อ" name="inflationRate" min={0} max={10} step={0.5} unit="% ต่อปี" />
              </div>



              {/* เงินก้อน */}
              <div style={{ background: "rgba(212,168,67,0.05)", border: "2px solid rgba(212,168,67,0.2)", borderRadius: 14, padding: "20px", marginTop: 20 }}>
                <div className="section-title" style={{ marginTop: 0, color: "#c0922a", borderColor: "rgba(212,168,67,0.2)" }}>เงินก้อนเมื่อเกษียณ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="two-col">
                  {[{label:"สินทรัพย์และการลงทุน",key:"otherLumpsum",tab:"assets",btn:"📊 กรอกสินทรัพย์",color:"#2980b9"},{label:"กองทุนสำรองเลี้ยงชีพ",key:"providentFund",tab:"pvd",btn:"🧮 คำนวณ PVD",color:"#c0922a"},{label:"เงินชดเชย",key:"severancePay",tab:"severance",btn:"🧮 คำนวณ",color:"#c0722a"}].map(item => (
                    <div key={item.key}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{item.label}</div>
                      {form[item.key] > 0 ? <div style={{ background: "linear-gradient(135deg,#fff8e6,#fdf0cc)", border: `2px solid ${item.color}`, borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}><div style={{ fontSize: 22, fontWeight: 800, color: item.color, fontFamily: "Mitr" }}>฿{fmt(form[item.key])}</div></div> : <div style={{ background: "#f5e6d0", border: "2px dashed #ede0cc", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "#8a7060", fontSize: 13 }}>ยังไม่ได้กรอก (ไม่บังคับ)</div>}
                      <button onClick={() => setActiveTab(item.tab)} style={{ width: "100%", padding: "11px", background: `linear-gradient(135deg,${item.color},${item.color}cc)`, border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Mitr" }}>{item.btn}</button>
                    </div>
                  ))}
                </div>
              {/* รายรับหลังเกษียณ */}
              <div style={{ background: "rgba(58,140,110,0.05)", border: "2px solid rgba(58,140,110,0.2)", borderRadius: 14, padding: "20px", marginTop: 24 }}>
                <div className="section-title" style={{ marginTop: 0, color: "#3a8c6e", borderColor: "rgba(58,140,110,0.2)" }}>รายรับรายเดือนหลังเกษียณ</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }} className="two-col">
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>ประกันสังคม ชราภาพ</div>
                    {form.monthlySSOPension > 0 ? <div style={{ background: "linear-gradient(135deg,#f0fff8,#e0f5ec)", border: "2px solid #3a8c6e", borderRadius: 12, padding: "12px 16px", marginBottom: 8 }}><div style={{ fontSize: 22, fontWeight: 800, color: "#3a8c6e", fontFamily: "Mitr" }}>฿{fmt(form.monthlySSOPension)}/เดือน</div></div> : <div style={{ background: "#f5e6d0", border: "2px dashed #ede0cc", borderRadius: 12, padding: "12px 16px", marginBottom: 8, textAlign: "center", color: "#8a7060", fontSize: 13 }}>ยังไม่ได้คำนวณ (ไม่บังคับ)</div>}
                    <button onClick={() => setActiveTab("sso")} style={{ width: "100%", padding: "11px", background: "linear-gradient(135deg,#3a8c6e,#2a6e54)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "Mitr" }}>🧮 คำนวณประกันสังคม</button>
                  </div>
                  <InputField label="บำนาญ/เดือน" name="monthlyPension" min={0} max={100000} step={500} unit="บาท" color="#3a8c6e" />
                  <InputField label="ประกันบำนาญ/เดือน" name="monthlyInsurancePension" min={0} max={100000} step={500} unit="บาท" color="#3a8c6e" />
                </div>
              </div>

              </div>

              <button onClick={calculate} style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg,#c0722a,#a05a20)", border: "none", borderRadius: 14, color: "white", fontFamily: "Mitr", fontSize: 18, fontWeight: 500, cursor: "pointer", marginTop: 28 }}>🔍 คำนวณแผนเกษียณ</button>
            </div>
          )}

          {/* ── Result Tab ── */}
          {activeTab === "result" && result && (
            <div>
              {/* Timeline */}
              <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", marginBottom: 24, height: 44 }}>
                <div style={{ flex: result.yearsToRetire, background: "linear-gradient(135deg,#2a9d8f,#264653)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 600 }}>สะสมทรัพย์ {result.yearsToRetire} ปี</div>
                <div style={{ flex: result.yearsInRetirement, background: "linear-gradient(135deg,#f4a261,#e76f51)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 13, fontWeight: 600 }}>เกษียณ {result.yearsInRetirement} ปี</div>
              </div>

              {/* Inflation card */}
              <div style={{ background: "rgba(233,196,106,0.06)", border: "1px solid rgba(233,196,106,0.3)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
                  <div><div style={{ fontSize: 11, color: "#8a7060", fontWeight: 600, marginBottom: 4 }}>รายจ่ายวันนี้</div><div style={{ fontSize: 20, fontWeight: 800 }}>฿{fmt(form.retireMonthlyExpense)}</div><div style={{ fontSize: 11, color: "#8a7060" }}>ต่อเดือน</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: 11, color: "#c0922a", fontWeight: 700 }}>เงินเฟ้อ {form.inflationRate}%/ปี<br/>(ทบรายเดือน × {result.yearsToRetire} ปี)</div><div style={{ fontSize: 18 }}>→</div></div>
                  <div><div style={{ fontSize: 11, color: "#c0922a", fontWeight: 600, marginBottom: 4 }}>รายจ่ายตอนเกษียณ</div><div style={{ fontSize: 20, fontWeight: 800, color: "#c0922a" }}>฿{fmt(result.retireMonthlyExpenseAdj)}</div><div style={{ fontSize: 11, color: "#8a7060" }}>ต่อเดือน</div></div>
                </div>
              </div>

              {/* Income after retire */}
              {result.totalMonthlyIncome > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#8a7060", marginBottom: 10, fontWeight: 700 }}>📥 รายรับประจำหลังเกษียณ</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="card-sm" style={{ borderTop: "3px solid #3a8c6e" }}>
                      <div style={{ fontSize: 12, color: "#8a7060", marginBottom: 6 }}>รวมรายรับ/เดือน</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#3a8c6e", fontFamily: "Mitr" }}>฿{fmt(result.totalMonthlyIncome)}</div>
                      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
                        {form.monthlyPension > 0 && <div style={{ fontSize: 11, color: "#8a7060", display: "flex", justifyContent: "space-between" }}><span>· บำนาญ</span><span style={{ fontWeight: 700 }}>฿{fmt(form.monthlyPension)}</span></div>}
                        {form.monthlySSOPension > 0 && <div style={{ fontSize: 11, color: "#8a7060", display: "flex", justifyContent: "space-between" }}><span>· ประกันสังคม</span><span style={{ fontWeight: 700 }}>฿{fmt(form.monthlySSOPension)}</span></div>}
                        {form.monthlyInsurancePension > 0 && <div style={{ fontSize: 11, color: "#8a7060", display: "flex", justifyContent: "space-between" }}><span>· ประกันบำนาญ</span><span style={{ fontWeight: 700 }}>฿{fmt(form.monthlyInsurancePension)}</span></div>}
                      </div>
                    </div>
                    <div className="card-sm" style={{ borderTop: "3px solid #c0722a" }}>
                      <div style={{ fontSize: 12, color: "#8a7060", marginBottom: 6 }}>ต้องดึงจากเงินออม/เดือน</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#c0722a", fontFamily: "Mitr" }}>฿{fmt(result.netMonthlyNeed)}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3 summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 16 }} className="two-col">
                <div className="card-sm" style={{ borderTop: "3px solid #c0722a" }}><div style={{ fontSize: 12, color: "#8a7060", marginBottom: 6 }}>เงินออมที่จะมี ณ เกษียณ</div><div style={{ fontSize: "clamp(14px,2.5vw,22px)", fontWeight: 800, fontFamily: "Mitr" }}>฿{fmt(result.totalAtRetirement)}</div><div style={{ fontSize: 12, color: "#8a7060", marginTop: 4 }}>อายุ {form.retireAge} ปี</div></div>
                <div className="card-sm" style={{ borderTop: "3px solid #2a9d8f" }}><div style={{ fontSize: 12, color: "#8a7060", marginBottom: 6 }}>เงินที่ต้องเตรียม (ผลตอบแทน {form.retireReturn}% · เงินเฟ้อ {form.inflationRate}%)</div><div style={{ fontSize: "clamp(14px,2.5vw,22px)", fontWeight: 800, fontFamily: "Mitr" }}>฿{fmt(result.requiredNestEgg)}</div><div style={{ fontSize: 12, color: "#8a7060", marginTop: 4 }}>สำหรับ {result.yearsInRetirement} ปีหลังเกษียณ</div></div>
                <div className="card-sm" style={{ borderTop: `3px solid ${result.surplus >= 0 ? "#2e7d52" : "#c0392b"}` }}><div style={{ fontSize: 12, color: "#8a7060", marginBottom: 6 }}>{result.surplus >= 0 ? "✅ ส่วนเกิน" : "⚠️ ขาดเงิน"}</div><div style={{ fontSize: "clamp(14px,2.5vw,22px)", fontWeight: 800, color: result.surplus >= 0 ? "#2e7d52" : "#c0392b", fontFamily: "Mitr" }}>{result.surplus >= 0 ? "+" : ""}฿{fmt(result.surplus)}</div><div style={{ fontSize: 12, color: "#8a7060", marginTop: 4 }}>{result.surplus >= 0 ? "อยู่ในเส้นทางที่ดี!" : "ต้องปรับแผน"}</div></div>
              </div>

              {/* Legacy card */}
              <div style={{ background: result.legacyAmount > 0 ? "linear-gradient(135deg,#f0fff8,#d4f5e2)" : "linear-gradient(135deg,#fff8f0,#fce8cc)", border: `2px solid ${result.legacyAmount > 0 ? "#2e7d52" : "#c0722a"}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#8a7060", fontWeight: 600, marginBottom: 4 }}>🏦 เงินมรดก ณ สิ้นอายุขัย (อายุ {form.lifeExpectancy} ปี)</div>
                    <div style={{ fontFamily: "Mitr", fontSize: "clamp(22px,5vw,32px)", fontWeight: 800, color: result.legacyAmount > 0 ? "#2e7d52" : "#c0392b" }}>{result.legacyAmount > 0 ? `฿${fmt(result.legacyAmount)}` : "เงินหมดก่อนสิ้นอายุขัย"}</div>
                    <div style={{ fontSize: 12, color: "#8a7060", marginTop: 4 }}>{result.legacyAmount > 0 ? `หลังใช้จ่าย ${result.yearsInRetirement} ปี · ผลตอบแทน ${form.retireReturn}% · เงินเฟ้อ ${form.inflationRate}%` : `เงินออมไม่พอตลอด ${result.yearsInRetirement} ปี`}</div>
                  </div>
                  <div style={{ fontSize: 40 }}>{result.legacyAmount > 0 ? "🎁" : "⚠️"}</div>
                </div>
              </div>

              {/* Saving recommendation */}
              <div style={{ background: result.surplus >= 0 ? "linear-gradient(135deg,#f0fff4,#e6f9ef)" : "linear-gradient(135deg,#fff8f0,#fff0e6)", border: `2px solid ${result.surplus >= 0 ? "#2e7d52" : "#c0722a"}`, borderRadius: 16, padding: "22px 24px", marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: result.surplus >= 0 ? "#2e7d52" : "#c0722a", marginBottom: 16, fontFamily: "Mitr" }}>{result.surplus >= 0 ? "✅ แผนการออมเพียงพอแล้ว!" : "📌 เป้าหมายที่ต้องออม"}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="two-col">
                  <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid #ede0cc" }}><div style={{ fontSize: 12, color: "#8a7060", fontWeight: 600, marginBottom: 6 }}>💳 ออมอยู่ตอนนี้</div><div style={{ fontSize: "clamp(18px,3.5vw,24px)", fontWeight: 800, fontFamily: "Mitr" }}>฿{fmt(result.monthlyContribution)}</div><div style={{ fontSize: 12, color: "#8a7060", marginTop: 4 }}>{form.monthlySavingRate}%/เดือน</div></div>
                  <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", border: `2px solid ${result.surplus >= 0 ? "#2e7d52" : "#c0392b"}` }}><div style={{ fontSize: 12, color: "#8a7060", fontWeight: 600, marginBottom: 6 }}>🎯 ต้องออม</div><div style={{ fontSize: "clamp(18px,3.5vw,24px)", fontWeight: 800, color: result.surplus >= 0 ? "#2e7d52" : "#c0392b", fontFamily: "Mitr" }}>฿{fmt(result.requiredMonthlySaving)}</div><div style={{ fontSize: 12, color: "#8a7060", marginTop: 4 }}>{result.requiredSavingRate.toFixed(1)}%/เดือน</div></div>
                </div>
              </div>

              {/* Milestones */}
              <div style={{ border: `1px solid ${result.savingGap <= 0 ? "#2e7d52" : "#c0392b"}`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#8a7060", marginBottom: 10, fontWeight: 700 }}>🎯 เป้าหมายเงินออมรายทาง (ทุก 5 ปี)</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {result.milestones.map((m,i) => { const ok = m.ทำได้จริง >= m.เป้าหมายออม; return (
                    <div key={i} style={{ background: "white", border: `1.5px solid ${ok ? "#2e7d52" : "#ede0cc"}`, borderRadius: 10, padding: "10px 14px", minWidth: 130, flex: "1 1 130px" }}>
                      <div style={{ fontSize: 12, color: "#c0722a", fontWeight: 700, marginBottom: 6 }}>{m.อายุ}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 10, color: "#8a7060" }}>เป้าหมาย</span><span style={{ fontSize: 12, fontWeight: 700 }}>฿{fmt(m.เป้าหมายออม)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10, color: "#8a7060" }}>ที่ทำได้</span><span style={{ fontSize: 12, fontWeight: 700, color: ok ? "#2e7d52" : "#c0392b" }}>฿{fmt(m.ทำได้จริง)}</span></div>
                      <div style={{ height: 4, background: "#ede0cc", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min((m.ทำได้จริง / m.เป้าหมายออม) * 100, 100)}%`, background: ok ? "#2e7d52" : "#c0722a", borderRadius: 2 }} /></div>
                      <div style={{ fontSize: 10, color: ok ? "#2e7d52" : "#c0392b", fontWeight: 700, marginTop: 4, textAlign: "right" }}>{ok ? `+฿${fmt(m.ทำได้จริง - m.เป้าหมายออม)}` : `-฿${fmt(m.เป้าหมายออม - m.ทำได้จริง)}`}</div>
                    </div>
                  ); })}
                  {/* Last milestone */}
                  <div style={{ background: result.surplus >= 0 ? "linear-gradient(135deg,#f0fff8,#d4f5e2)" : "linear-gradient(135deg,rgba(244,162,97,0.12),rgba(231,111,81,0.12))", border: `2px solid ${result.surplus >= 0 ? "#2e7d52" : "#c0722a"}`, borderRadius: 10, padding: "10px 14px", minWidth: 130, flex: "1 1 130px" }}>
                    <div style={{ fontSize: 12, color: "#c0722a", fontWeight: 700, marginBottom: 6 }}>อายุ {form.retireAge} ปี 🏁</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}><span style={{ fontSize: 10, color: "#8a7060" }}>เป้าหมาย</span><span style={{ fontSize: 12, fontWeight: 800, color: "#c0722a" }}>฿{fmt(result.requiredNestEgg)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 10, color: "#8a7060" }}>ที่ทำได้</span><span style={{ fontSize: 12, fontWeight: 800, color: result.surplus >= 0 ? "#2e7d52" : "#c0392b" }}>฿{fmt(result.totalAtRetirement)}</span></div>
                    <div style={{ height: 4, background: "#ede0cc", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(result.readyPercent, 100)}%`, background: result.surplus >= 0 ? "#2e7d52" : "#c0722a", borderRadius: 2 }} /></div>
                    <div style={{ fontSize: 10, color: result.surplus >= 0 ? "#2e7d52" : "#c0392b", fontWeight: 700, marginTop: 4, textAlign: "right" }}>{result.surplus >= 0 ? `+฿${fmt(result.surplus)}` : `-฿${fmt(Math.abs(result.surplus))}`}</div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 16, marginBottom: 20 }} className="two-col">
                <div style={{ background: "#fdf8f2", border: "2px solid #ede0cc", borderRadius: 14, padding: "18px 16px" }}>
                  <div style={{ fontFamily: "Mitr", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>📈 รายรับ · ค่าใช้จ่าย · เงินออม</div>
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                    {[["เงินออม","#c0722a"],["รายรับ","#2a9d8f"],["ค่าใช้จ่าย","#e76f51"],["คงเหลือ","#2980b9"]].map(([k,c]) => (<div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#8a7060" }}><div style={{ width: 14, height: 3, background: c, borderRadius: 2 }} />{k}</div>))}
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={result.projection} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="gSav" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c0722a" stopOpacity={0.2} /><stop offset="95%" stopColor="#c0722a" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2a9d8f" stopOpacity={0.15} /><stop offset="95%" stopColor="#2a9d8f" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#e76f51" stopOpacity={0.15} /><stop offset="95%" stopColor="#e76f51" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gCF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2980b9" stopOpacity={0.18} /><stop offset="95%" stopColor="#2980b9" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,120,60,0.08)" />
                      <XAxis dataKey="อายุ" stroke="#8a7060" tick={{ fontSize: 11 }} tickFormatter={v => `${v}ปี`} />
                      <YAxis stroke="#8a7060" tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const find = k => payload.find(p => p.dataKey === k);
                        const cf = find("คงเหลือ"); const cfVal = cf ? cf.value : 0;
                        return (<div style={{ background: "white", border: "2px solid #ede0cc", borderRadius: 10, padding: "12px 16px", fontSize: 13, minWidth: 190 }}>
                          <div style={{ fontWeight: 700, color: "#c0722a", marginBottom: 8, fontFamily: "Mitr" }}>อายุ {label} ปี</div>
                          {[["เงินออม","#c0722a"],["รายรับ","#2a9d8f"],["ค่าใช้จ่าย","#e76f51"]].map(([key,color]) => { const p = find(key); return p ? <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 4 }}><span style={{ color: "#8a7060" }}>{key}</span><span style={{ fontWeight: 700, color }}>฿{fmt(p.value)}</span></div> : null; })}
                          <div style={{ borderTop: "1px solid #ede0cc", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}><span style={{ color: "#8a7060", fontWeight: 600 }}>คงเหลือ</span><span style={{ fontWeight: 800, color: cfVal >= 0 ? "#2e7d52" : "#c0392b", fontFamily: "Mitr" }}>{cfVal >= 0 ? "+" : ""}฿{fmt(cfVal)}</span></div>
                        </div>);
                      }} />
                      <Area type="monotone" dataKey="เงินออม" stroke="#c0722a" strokeWidth={2.5} fill="url(#gSav)" dot={false} />
                      <Area type="monotone" dataKey="รายรับ" stroke="#2a9d8f" strokeWidth={2} fill="url(#gInc)" dot={false} />
                      <Area type="monotone" dataKey="ค่าใช้จ่าย" stroke="#e76f51" strokeWidth={2} fill="url(#gExp)" dot={false} />
                      <Area type="monotone" dataKey="คงเหลือ" stroke="#2980b9" strokeWidth={1.5} fill="url(#gCF)" dot={false} strokeDasharray="5 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: "#fdf8f2", border: "2px solid #ede0cc", borderRadius: 14, padding: "18px 16px" }}>
                  <div style={{ fontFamily: "Mitr", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🥧 สัดส่วนแหล่งที่มา</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart><Pie data={result.pie} cx="50%" cy="44%" outerRadius={82} dataKey="value" label={({percent}) => `${(percent*100).toFixed(0)}%`} labelLine={false}>{result.pie.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Legend wrapperStyle={{ fontSize: 11 }} /><Tooltip formatter={v => `฿${fmt(v)}`} /></PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Banner */}
              {result.surplus >= 0 ? (
                <div ref={bannerRef} style={{ marginTop: 28, borderRadius: 18, background: "linear-gradient(135deg,#f0fff8,#d4f5e2)", border: "2px solid #3a8c6e", textAlign: "center", padding: "28px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(20px,4vw,28px)", fontWeight: 700, color: "#3a8c6e" }}>ขอแสดงความยินดี!</div>
                  <div style={{ fontSize: 14, color: "#2a8a65", marginTop: 12 }}>แผนการออมเพียงพอ · มีส่วนเกิน <strong>฿{fmt(result.surplus)}</strong></div>
                </div>
              ) : (
                <div ref={bannerRef} style={{ marginTop: 28, borderRadius: 18, background: "linear-gradient(135deg,#fff8f0,#fce8cc)", border: "2px solid #c0722a", textAlign: "center", padding: "28px 20px" }}>
                  <div style={{ fontSize: 56, marginBottom: 8 }}>💪</div>
                  <div style={{ fontFamily: "Mitr", fontSize: "clamp(20px,4vw,28px)", fontWeight: 700, color: "#c0722a" }}>พยายามต่อไป!</div>
                  <div style={{ fontSize: 14, color: "#8a6040", marginTop: 12 }}>ขาดอีก <strong style={{ color: "#c0392b" }}>฿{fmt(Math.abs(result.surplus))}</strong> · ต้องออมเพิ่ม <strong>฿{fmt(Math.round(result.savingGap))}</strong>/เดือน</div>
                </div>
              )}

              {/* Export PDF */}
              <button onClick={() => exportPDF()} style={{ width: "100%", marginTop: 24, padding: "16px", background: "linear-gradient(135deg,#264653,#2a9d8f)", border: "none", borderRadius: 14, color: "white", fontFamily: "Mitr", fontSize: 16, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>🖨️ พิมพ์ / บันทึก PDF</button>
            </div>
          )}

        </div>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setHelpOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 560, maxHeight: "85vh", overflow: "auto", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "Mitr", fontSize: 18, fontWeight: 600 }}>❓ วิธีการใช้งาน</div>
              <button onClick={() => setHelpOpen(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid #ede0cc", background: "white", cursor: "pointer", fontSize: 18, color: "#8a7060" }}>×</button>
            </div>
            {[
              { tab: "📋 กรอกข้อมูล", color: "#c0722a", steps: ["กรอกอายุ, เงินออม, รายได้, รายจ่าย", "กรอกผลตอบแทนและเงินเฟ้อ", "กด 'คำนวณแผนเกษียณ'"] },
              { tab: "💰 รายได้", color: "#c0722a", steps: ["กรอกเงินเดือน, ค่าตอบแทน, โบนัส", "ระบบรวมรายได้อัตโนมัติ", "กด ✅ เพื่อใช้ในแผน"] },
              { tab: "🏦 กองทุนสำรองเลี้ยงชีพ", color: "#c0922a", steps: ["กรอกอัตรานำส่ง, ยอดสะสม", "กรอกผลตอบแทนกองทุน", "กด ✅ เพื่อใช้ค่า FV"] },
              { tab: "🛡️ ประกันสังคม", color: "#3a8c6e", steps: ["กรอกเงินเดือน, ปีที่ส่งสมทบ", "ส่งครบ 15 ปี = ได้บำนาญ", "กด ✅ เพื่อใช้ค่า"] },
              { tab: "💼 เงินชดเชย", color: "#c0722a", steps: ["กรอกเงินเดือนและอายุงาน", "ระบบคำนวณตาม พ.ร.บ.", "กด ✅ เพื่อใช้ค่าสุทธิ"] },
              { tab: "📊 สินทรัพย์", color: "#2980b9", steps: ["กรอกมูลค่าแต่ละสินทรัพย์", "ตั้งผลตอบแทน/ปี", "กด ✅ เพื่อใช้มูลค่า FV"] },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 16, padding: "12px 14px", background: "#fdf8f2", borderRadius: 10, borderLeft: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 6 }}>{s.tab}</div>
                {s.steps.map((step, j) => <div key={j} style={{ fontSize: 12, color: "#8a7060", lineHeight: 1.8 }}>{j+1}. {step}</div>)}
              </div>
            ))}
            <div style={{ background: "linear-gradient(135deg,#f0fff8,#e0f5ec)", borderRadius: 12, padding: "14px", marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#3a8c6e", marginBottom: 6 }}>💡 เคล็ดลับ</div>
              <div style={{ fontSize: 12, color: "#8a7060", lineHeight: 1.8 }}>เริ่มจาก รายได้ → ประกันสังคม → กองทุนสำรองเลี้ยงชีพ → เงินชดเชย → สินทรัพย์ แล้วกลับมากรอกข้อมูลแล้วกดคำนวณ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
