// Generates region one-pager + social-card HTML into marketing/build/.
// Run: node marketing/generate.mjs   then render with Chrome (see marketing/build.sh).
import { readFileSync, writeFileSync } from 'node:fs';

const portrait = 'data:image/jpeg;base64,' + readFileSync('public/sunil-profile.jpeg').toString('base64');

const regions = [
  { key: 'india', label: 'India', price: '₹1,50,000', hybrid: ' · Bangalore hybrid' },
  { key: 'dubai', label: 'Dubai', price: 'AED 8,000', hybrid: '' },
  { key: 'australia', label: 'Australia', price: 'AUD 3,000', hybrid: '' },
];

const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">`;

const palette = `--paper:#F4EEE2;--ink:#221C15;--soft:#5C5345;--faint:#8C8170;--line:#DCD2BE;--clay:#B0512E;--ochre:#C2914A`;

const onePager = (r) => `<!doctype html><html lang="en"><head><meta charset="utf-8">${fonts}<style>
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
:root{${palette}}
body{width:210mm;height:297mm;overflow:hidden;background:var(--paper);color:var(--ink);font-family:Inter,system-ui,sans-serif;padding:14mm 15mm;font-size:9.5pt;line-height:1.45}
.serif{font-family:Fraunces,Georgia,serif}
header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:9px}
.wm{font-family:Fraunces,serif;font-size:13pt;font-weight:600;display:flex;align-items:center;gap:6px}
.dot{width:7px;height:7px;border-radius:50%;background:var(--clay)}
.tag{font-family:'JetBrains Mono',monospace;font-size:8pt;letter-spacing:.12em;text-transform:uppercase;background:var(--clay);color:#FBF7EE;padding:5px 11px;border-radius:999px}
h1{font-family:Fraunces,serif;font-weight:380;font-size:27pt;line-height:1.04;margin:15px 0 7px;letter-spacing:-.01em}
h1 em{font-style:italic;color:var(--clay)}
.sub{color:var(--soft);font-size:10.5pt;max-width:160mm}
.maker{display:flex;gap:13px;align-items:center;margin:13px 0;padding:11px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.maker img{width:19mm;height:19mm;border-radius:50%;object-fit:cover;object-position:50% 32%;border:1px solid var(--line)}
.maker b{font-family:Fraunces,serif;font-size:11.5pt;font-weight:600}
.maker .role{color:var(--soft)}
.maker p{font-size:8.8pt;color:var(--soft);margin-top:3px;line-height:1.4}
.stats{display:flex;margin:13px 0}
.stat{flex:1;border-right:1px solid var(--line);padding-right:8px}
.stat:last-child{border-right:0}
.stat .n{font-family:Fraunces,serif;font-size:17pt;color:var(--clay);line-height:1}
.stat .c{font-size:7pt;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;font-family:'JetBrains Mono',monospace;margin-top:5px}
.cols{display:flex;gap:16px;margin-top:4px}
.col{flex:1}
h2{font-family:'JetBrains Mono',monospace;font-size:8pt;letter-spacing:.14em;text-transform:uppercase;color:var(--clay);margin:11px 0 6px}
ul{list-style:none}
li{position:relative;padding-left:13px;margin-bottom:5px;font-size:9pt}
li::before{content:'—';position:absolute;left:0;color:var(--ochre)}
li b{font-weight:600}
li span{color:var(--soft)}
.band{margin-top:13px;border:1px solid var(--line);border-radius:4px;display:flex;overflow:hidden}
.band .seg{padding:11px 13px;border-right:1px solid var(--line);flex:1}
.band .seg:last-child{border-right:0}
.band .l{font-family:'JetBrains Mono',monospace;font-size:7pt;text-transform:uppercase;letter-spacing:.1em;color:var(--faint)}
.band .v{font-size:9.5pt;font-weight:600;margin-top:4px}
.price .v{font-family:Fraunces,serif;font-size:16pt;color:var(--clay);font-weight:500}
footer{margin-top:13px;display:flex;justify-content:space-between;align-items:center;background:var(--ink);color:#EDE6D7;border-radius:4px;padding:13px 15px}
footer .cta{font-family:Fraunces,serif;font-size:11.5pt}
footer .url{font-family:'JetBrains Mono',monospace;font-size:8.5pt;color:var(--ochre);text-align:right}
</style></head><body>
<header><div class="wm"><span class="dot"></span>the living craft</div><div class="tag">${r.label} cohort</div></header>
<h1>Build systems that <em>outlive</em> their makers.</h1>
<div class="sub">An application-only, 5-week program in agentic &amp; systems architecture — taught in a small cohort, on your real systems, by someone who has shipped them at scale.</div>
<div class="maker">
  <img src="${portrait}" alt="Sunil Mathew">
  <div><b>Sunil Mathew</b> <span class="role">— Engineering leader · Google, Amazon, Walmart</span>
  <p>26 years building &amp; leading engineering on systems serving up to 100M+ users — a Google Workspace platform at ~31B weekly executions, Amazon Prime's core, 300+ products at Walmart. Now leading agentic-AI work and teaching the craft.</p></div>
</div>
<div class="stats">
  <div class="stat"><div class="n">26+</div><div class="c">Years building</div></div>
  <div class="stat"><div class="n">3</div><div class="c">Fortune-100s</div></div>
  <div class="stat"><div class="n">100M+</div><div class="c">Users served</div></div>
  <div class="stat"><div class="n">150</div><div class="c">Engineers led</div></div>
</div>
<div class="cols">
  <div class="col">
    <h2>Who it's for</h2>
    <ul>
      <li><b>Senior &amp; staff engineers</b> <span>— making architectural calls that stick</span></li>
      <li><b>Architects &amp; tech leads</b> <span>— designing agentic &amp; distributed systems</span></li>
      <li><b>Engineering managers</b> <span>— setting technical direction with depth</span></li>
    </ul>
    <h2>What you'll be able to do</h2>
    <ul>
      <li>Design agentic systems that hold up in production</li>
      <li>Make the irreversible decisions with confidence</li>
      <li>Reason about scale before it bites you</li>
      <li>Carry the craft forward to your team</li>
    </ul>
  </div>
  <div class="col">
    <h2>Inside the program — 5 weeks, live</h2>
    <ul>
      <li><b>Wk 1</b> <span>— Foundations of durable architecture</span></li>
      <li><b>Wk 2–3</b> <span>— Agentic systems in production: multi-agent, RAG, evals, cost</span></li>
      <li><b>Wk 4</b> <span>— Scale, consistency &amp; the hard trade-offs</span></li>
      <li><b>Wk 5</b> <span>— Your system, reviewed live in the room</span></li>
    </ul>
    <h2>Live experience</h2>
    <ul>
      <li>100+ senior engineers, architects &amp; EMs mentored</li>
      <li>~100 engineering managers trained on agentic systems</li>
      <li>Building an agentic-AI system, as a startup, right now</li>
    </ul>
  </div>
</div>
<div class="band">
  <div class="seg"><div class="l">Format</div><div class="v">5 weeks · live · 15 seats${r.hybrid}</div></div>
  <div class="seg"><div class="l">Admission</div><div class="v">By application</div></div>
  <div class="seg price"><div class="l">Investment</div><div class="v">${r.price}</div></div>
</div>
<footer><div class="cta">Apply for the ${r.label} cohort →</div><div class="url">learning.thelivingcraft.ai/?region=${r.key}<br>greetsunshine@gmail.com</div></footer>
</body></html>`;

const social = (r) => `<!doctype html><html lang="en"><head><meta charset="utf-8">${fonts}<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
:root{${palette}}
body{width:1200px;height:630px;overflow:hidden;background:var(--paper);color:var(--ink);font-family:Inter,sans-serif;display:flex}
.left{flex:1;padding:64px 56px;display:flex;flex-direction:column;justify-content:space-between}
.right{width:430px;position:relative;overflow:hidden;border-left:1px solid var(--line)}
.right img{width:100%;height:100%;object-fit:cover;object-position:50% 28%;filter:sepia(.12) saturate(1.08)}
.right .ov{position:absolute;inset:0;background:linear-gradient(120deg,rgba(244,238,226,.5),transparent 40%)}
.wm{font-family:Fraunces,serif;font-size:26px;font-weight:600;display:flex;align-items:center;gap:10px}
.dot{width:12px;height:12px;border-radius:50%;background:var(--clay)}
.tag{font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:var(--clay);margin-top:6px}
h1{font-family:Fraunces,serif;font-weight:380;font-size:62px;line-height:1.02;letter-spacing:-.015em}
h1 em{font-style:italic;color:var(--clay)}
.cred{font-size:21px;color:var(--soft);max-width:560px;line-height:1.45}
.cred b{color:var(--ink);font-weight:600}
.foot{display:flex;justify-content:space-between;align-items:flex-end}
.foot .price{font-family:Fraunces,serif;font-size:30px;color:var(--clay)}
.foot .url{font-family:'JetBrains Mono',monospace;font-size:15px;color:var(--faint)}
</style></head><body>
<div class="left">
  <div><div class="wm"><span class="dot"></span>the living craft</div><div class="tag">${r.label} · agentic &amp; systems architecture</div></div>
  <h1>Build systems that <em>outlive</em> their makers.</h1>
  <div class="cred"><b>Sunil Mathew</b> — 26 years building &amp; leading engineering at Google, Amazon &amp; Walmart. An application-only, 5-week cohort.</div>
  <div class="foot"><div class="price">${r.price} <span style="font-size:16px;color:var(--faint)">/ seat</span></div><div class="url">learning.thelivingcraft.ai</div></div>
</div>
<div class="right"><img src="${portrait}" alt="Sunil Mathew"><div class="ov"></div></div>
</body></html>`;

for (const r of regions) {
  writeFileSync(`marketing/build/onepager-${r.key}.html`, onePager(r));
  writeFileSync(`marketing/build/social-${r.key}.html`, social(r));
}
console.log('Generated HTML for:', regions.map((r) => r.key).join(', '));
