// The design system v1 shell shared by every generated teaching page: the two
// stylesheets and the two scripts.
//
// WHY THIS FILE EXISTS. These four literals were written inside
// teaching-content/week-3.mjs. Week 1 needs the identical four, and two copies
// of a stylesheet is the drift this whole directory exists to prevent — the
// palette swap of 28 September had to touch five published pages one at a time
// for exactly that reason. week-3.mjs now re-exports from here, so there is one
// copy and a change reaches every week at once.
//
// Design system v1: forest #183D32, ivory #F5F0E6, paper #FBF8F2, ink #172E26,
// Source Serif 4 for h1 and h2, Figtree for everything else, 6px and 12px radii,
// a 1px ring instead of a shadow. Gold is never text.

export const LEARNER_CSS = `
:root{
  --noir:#183D32;--ember:#B58A46;--sun:#183D32;--mist:#F5F0E6;--berry:#963D34;
  --paper-1:#FBF8F2;--paper-2:#E5EBE1;
  --ink-1:#172E26;--ink-2:#526259;--ink-3:#C6D4C8;
  --line-hair:#CBD1C8;--danger:#963D34;--danger-quiet:#F7E8E3;--accent-quiet:#F4E9CE;
  --text-loud:var(--ink-1);--text-body:var(--ink-1);--text-quiet:var(--ink-2);
  --text-on-invert:#FBF8F2;
  --font-display:"Source Serif 4","Iowan Old Style",Georgia,serif;
  --font-body:"Figtree","Avenir Next","Helvetica Neue",sans-serif;
  --font-mono:"JetBrains Mono",ui-monospace,Menlo,monospace;
  --font-features:"tnum" 1;
  --size-1:12px;--size-2:13px;--size-3:15px;--size-4:17px;--size-5:20px;
  --size-6:26px;--size-7:34px;--size-8:46px;
  --lh-normal:1.55;
  --space-1:4px;--space-2:8px;--space-3:12px;--space-4:16px;--space-5:24px;
  --space-6:32px;--space-7:48px;--space-8:72px;
  --measure-prose:62ch;
  --radius-inner:12px;--radius-panel:12px;--radius-card:12px;--radius-shell:12px;
  --radius-pill:6px;
  --shadow-raise:0 0 0 1px #CBD1C8;--shadow-lift:0 0 0 1px #758279;
  --unwritten:repeating-linear-gradient(90deg,var(--line-hair) 0 8px,transparent 8px 16px);
}
*{box-sizing:border-box}
body{margin:0;background:var(--mist);color:var(--text-body);font-family:var(--font-body);
  font-size:var(--size-3);line-height:var(--lh-normal);font-feature-settings:var(--font-features);
  -webkit-font-smoothing:antialiased}
.page{max-width:940px;margin:0 auto;padding:var(--space-6) var(--space-4) var(--space-8);
  display:flex;flex-direction:column;gap:var(--space-5)}
p{margin:0 0 var(--space-4);max-width:var(--measure-prose)}
p:last-child{margin-bottom:0}
ul,ol{margin:0 0 var(--space-4);padding-left:1.15em;max-width:var(--measure-prose)}
li{margin-bottom:var(--space-2)}
li:last-child{margin-bottom:0}
strong{font-weight:700}
a{color:var(--ink-1)}
:focus-visible{outline:2px solid var(--berry);outline-offset:2px}
h1,h2{font-family:var(--font-display);font-weight:400;letter-spacing:-.01em;
  line-height:1.14;margin:0;text-wrap:balance}
h3,h4{font-family:var(--font-body);font-weight:700;letter-spacing:-.015em;
  line-height:1.18;margin:0;text-wrap:balance}
.mono{font-family:var(--font-mono);font-feature-settings:var(--font-features)}
.hero{background:var(--noir);color:var(--text-on-invert);border-radius:var(--radius-shell);
  padding:var(--space-7) var(--space-6)}
.hero .eyebrow{font-family:var(--font-body);font-weight:700;font-size:var(--size-1);
  text-transform:uppercase;letter-spacing:.12em;color:var(--ink-3);margin-bottom:var(--space-5)}
.hero h1{font-size:clamp(34px,7vw,62px);margin-bottom:var(--space-5);max-width:16ch}
.hero .sub{font-size:var(--size-4);color:#C6D4C8;max-width:54ch;margin-bottom:var(--space-6)}
.facts{display:flex;flex-wrap:wrap;gap:var(--space-5) var(--space-7);
  border-top:1px solid #2C5346;padding-top:var(--space-5)}
.fact .n{font-family:var(--font-mono);font-size:var(--size-6);font-weight:500;
  display:block;line-height:1.1}
.fact .l{font-size:var(--size-2);color:var(--ink-3);display:block;margin-top:var(--space-1)}
.card{background:var(--paper-1);border-radius:var(--radius-card);padding:var(--space-6);
  box-shadow:var(--shadow-raise)}
.card>:last-child{margin-bottom:0}
.card h2{font-size:var(--size-6);margin-bottom:var(--space-4);max-width:26ch}
.card h3{font-size:var(--size-5);margin-bottom:var(--space-3)}
.card h4{font-size:var(--size-4);margin:var(--space-5) 0 var(--space-3)}
.lede{font-size:var(--size-4);color:var(--text-quiet)}
.step-label{font-family:var(--font-mono);font-size:var(--size-1);color:var(--text-quiet);
  display:block;margin-bottom:var(--space-3)}
.term{background:var(--paper-2);border-radius:var(--radius-inner);font-family:var(--font-mono);
  font-size:var(--size-2);line-height:1.75;padding:var(--space-4) var(--space-5);
  overflow-x:auto;white-space:pre;margin:0 0 var(--space-4);color:var(--ink-1)}
.term .q{color:var(--ink-2)}
.term .m{color:#765523}
.term .x{color:var(--danger)}
.writein{margin-top:var(--space-4)}
.writein .q{font-size:var(--size-2);color:var(--text-quiet);display:block;margin-bottom:var(--space-2)}
.writein .rule{height:1px;background:var(--unwritten)}
.writein .rule+.rule{margin-top:var(--space-5)}
details{margin-bottom:var(--space-3)}
details>summary{list-style:none;cursor:pointer;display:inline-block;background:var(--sun);
  color:#F5F0E6;border-radius:var(--radius-pill);padding:8px 18px;
  font-family:var(--font-mono);font-size:var(--size-1)}
details>summary::-webkit-details-marker{display:none}
details>summary:hover{background:#244F41}
details>summary:focus-visible{outline:2px solid var(--berry);outline-offset:2px}
details[open]>summary{margin-bottom:var(--space-4)}
.reveal>:last-child{margin-bottom:0}
.reveal h3,.reveal h4{margin-top:0}
/* Figures. Week 1 carries four SVG drawings; a page with none is unaffected.
   .figwrap scrolls horizontally on a phone rather than shrinking the drawing
   to unreadable, which is why the svg has a min-width. */
figure{margin:0 0 var(--space-5)}
figure svg{display:block;width:100%;height:auto;color:var(--ink-1)}
figcaption{font-size:var(--size-2);color:var(--text-quiet);margin-top:var(--space-3);
  max-width:var(--measure-prose)}
.figwrap{overflow-x:auto}
.figwrap>svg{min-width:620px}

.tw{overflow-x:auto;margin-bottom:var(--space-4)}
table{border-collapse:collapse;width:100%;min-width:560px;font-size:var(--size-2)}
th,td{text-align:left;padding:var(--space-3) var(--space-4) var(--space-3) 0;
  border-bottom:1px solid var(--line-hair);vertical-align:top}
th{color:var(--text-quiet);font-weight:500}
td.mono,th.mono{font-family:var(--font-mono);font-feature-settings:var(--font-features)}
tr:last-child td{border-bottom:none}
.ok{color:var(--ink-1)}
.bad{color:var(--danger);font-weight:500}
.builds{display:flex;flex-direction:column;gap:var(--space-4)}
.build{background:var(--paper-2);border-radius:var(--radius-panel);padding:var(--space-5)}
.build h3{font-size:var(--size-4);margin-bottom:var(--space-2)}
.build p{font-size:var(--size-3);margin-bottom:var(--space-3)}
.build .check{font-family:var(--font-mono);font-size:var(--size-1);color:var(--text-quiet);
  border-top:1px solid var(--line-hair);padding-top:var(--space-3)}
.ember{background:var(--ember);color:var(--ink-1);border-radius:var(--radius-card);
  padding:var(--space-6)}
.ember>:last-child{margin-bottom:0}
.ember h2{font-size:var(--size-6);margin-bottom:var(--space-4)}
.ember .term{background:rgba(255,255,255,.62)}
.qs{display:flex;flex-direction:column;gap:var(--space-5)}
.q-item{display:grid;grid-template-columns:2rem 1fr;gap:var(--space-3)}
.q-item .n{font-family:var(--font-mono);font-size:var(--size-2);color:var(--text-quiet);padding-top:3px}
.q-item p{margin-bottom:var(--space-3)}
.q-item h3{font-size:var(--size-4);margin-bottom:var(--space-2)}
.named{font-family:var(--font-mono);font-size:var(--size-1);color:var(--text-quiet)}
footer{font-family:var(--font-mono);font-size:var(--size-1);color:var(--text-quiet);
  padding:var(--space-5) var(--space-6);display:flex;flex-wrap:wrap;
  gap:var(--space-3) var(--space-6)}
details.topic{margin:0}
details.topic>summary{display:flex;align-items:baseline;gap:14px;width:100%;
  background:var(--paper-1);color:var(--ink-1);border-radius:12px;box-shadow:0 0 0 1px #CBD1C8;
  padding:20px 24px;font-family:inherit;font-size:17px;font-weight:700;
  letter-spacing:-.015em;cursor:pointer;list-style:none}
details.topic>summary::-webkit-details-marker{display:none}
details.topic>summary:hover{box-shadow:0 0 0 1px #758279}
details.topic>summary:focus-visible{outline:2px solid #963D34;outline-offset:2px}
details.topic>summary .num{font-family:var(--font-mono);font-size:12px;font-weight:500;
  color:#F5F0E6;background:#183D32;border-radius:6px;padding:4px 9px;flex:none}
details.topic>summary .when{font-family:var(--font-mono);font-size:12px;font-weight:400;
  color:#526259;margin-left:auto;text-align:right}
details.topic>summary .caret{flex:none;color:#526259;font-size:13px;
  display:inline-block;transition:transform 160ms}
details.topic[open]>summary{border-radius:12px 12px 0 0;box-shadow:0 0 0 1px #758279}
details.topic[open]>summary .caret{transform:rotate(90deg)}
.topicbody{display:flex;flex-direction:column;gap:24px;padding:24px 0 8px}
.sclock{background:var(--paper-1);border-radius:var(--radius-card);box-shadow:var(--shadow-raise);
  padding:var(--space-4) var(--space-5);display:flex;flex-wrap:wrap;align-items:baseline;
  gap:var(--space-3) var(--space-5);font-family:var(--font-mono);font-size:var(--size-2)}
.sclock .el{font-size:var(--size-5);font-weight:500;color:var(--ink-1)}
.sclock .now{color:var(--ink-1);font-family:var(--font-body);font-weight:700;font-size:var(--size-3)}
.sclock .hint{color:var(--text-quiet)}
tr.here td{background:var(--accent-quiet)}
@media (max-width:620px){
  .hero{padding:var(--space-6) var(--space-5);border-radius:var(--radius-panel)}
  .card,.ember{padding:var(--space-5)}
  details.topic>summary{flex-wrap:wrap;padding:16px 18px}
  details.topic>summary .when{margin-left:0;width:100%;text-align:left}
}
@media print{
  body{background:#fff}
  .page{padding:0;gap:18px}
  .card,.build,.ember,.hero{box-shadow:none;border:1px solid #ccc;break-inside:avoid}
  .hero{background:#fff;color:#000}
  .hero .sub,.fact .l,.hero .eyebrow{color:#333}
  .facts{border-top-color:#ccc}
  .ember{background:#fff}
  .sclock{display:none}
  details{display:block}
  details>summary{display:none}
  .reveal{display:block !important}
  details.topic>summary{box-shadow:none;border:1px solid #ccc}
  details.topic>.topicbody{display:flex !important}
}
@media (prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important}}
`;

export const INSTRUCTOR_CSS = `
:root{
  --noir:#183D32;--ember:#B58A46;--sun:#183D32;--mist:#F5F0E6;--berry:#963D34;
  --paper-1:#FBF8F2;--paper-2:#E5EBE1;
  --ink-1:#172E26;--ink-2:#526259;--ink-3:#C6D4C8;--ink-invert:#F5F0E6;
  --line-hair:#CBD1C8;--accent-hover:#244F41;--danger:#963D34;--danger-quiet:#F7E8E3;
  --accent-quiet:#F4E9CE;
  --font-body:"Figtree","Avenir Next","Helvetica Neue",sans-serif;
  --font-mono:"JetBrains Mono",ui-monospace,monospace;
  --s1:12px;--s2:13px;--s3:15px;--s4:17px;--s5:20px;--s6:26px;--s7:34px;
  --sp1:4px;--sp2:8px;--sp3:12px;--sp4:16px;--sp5:24px;--sp6:32px;--sp7:48px;--sp8:72px;
  --r-inner:12px;--r-panel:12px;--r-card:12px;--r-shell:12px;--r-pill:6px;
  --shadow-raise:0 0 0 1px #CBD1C8;--shadow-lift:0 0 0 1px #758279;
}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--mist);color:var(--ink-1);font-family:var(--font-body);
  font-size:var(--s3);line-height:1.55;font-variant-numeric:tabular-nums;
  -webkit-font-smoothing:antialiased}
h1,h2{margin:0;font-family:"Source Serif 4","Iowan Old Style",Georgia,serif;font-weight:400;
  letter-spacing:-.01em;line-height:1.14;text-wrap:balance}
h3,h4{margin:0;font-weight:700;letter-spacing:-.015em;line-height:1.18;text-wrap:balance}
p{margin:0}
a{color:var(--ink-1)}
:focus-visible{outline:2px solid var(--berry);outline-offset:2px}
.shell{max-width:1000px;margin:0 auto;padding:var(--sp6) var(--sp4) var(--sp8);
  display:flex;flex-direction:column;gap:var(--sp6)}
.mono{font-family:var(--font-mono);font-size:var(--s1);letter-spacing:-.01em}
.quiet{color:var(--ink-2)}
.hero{background:var(--noir);color:var(--ink-invert);border-radius:var(--r-shell);
  padding:var(--sp8) var(--sp7);display:flex;flex-direction:column;gap:var(--sp5)}
.hero .mono{color:var(--ink-3)}
.hero h1{font-size:clamp(32px,5.5vw,54px);max-width:15ch}
.hero .lead{font-size:var(--s4);color:#C6D4C8;max-width:60ch}
.facts{display:flex;flex-wrap:wrap;gap:var(--sp5) var(--sp7);padding-top:var(--sp4);
  border-top:1px solid rgba(255,255,255,.14)}
.facts div{display:flex;flex-direction:column;gap:var(--sp1)}
.facts .v{font-size:var(--s5);font-weight:700;letter-spacing:-.02em}
.teach{display:contents}
.pane{display:flex;flex-direction:column;gap:var(--sp6);min-width:0}
.panehead{display:flex;flex-direction:column;gap:var(--sp1)}
.railbtn{font-family:var(--font-mono);font-size:var(--s1);letter-spacing:-.01em;
  border:1px solid var(--line-hair);background:var(--paper-1);color:var(--ink-2);
  border-radius:var(--r-pill);padding:8px 16px;cursor:pointer;margin-left:auto;
  transition:background 160ms cubic-bezier(.22,.61,.36,1),color 160ms cubic-bezier(.22,.61,.36,1)}
.railbtn:hover{background:var(--paper-2);color:var(--ink-1)}
.railbtn[aria-pressed="true"]{background:var(--sun);color:#F5F0E6;border-color:var(--sun)}
@media (min-width:1200px){
  body.split .shell{max-width:1720px}
  body.split .shell>:not(.teach){width:100%;max-width:1000px;align-self:center}
  body.split .shell>details.topic{width:100%;max-width:none;align-self:stretch}
  body.split .topicbody>.teach{display:grid;
    grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--sp5);align-items:start}
  body.split .topicbody .pane-ref{position:sticky;top:var(--sp3);gap:var(--sp5);
    max-height:calc(100vh - var(--sp5));overflow-y:auto;overscroll-behavior:contain;
    padding:var(--sp2) var(--sp3) var(--sp6) 0;scrollbar-width:thin}
  body.split .topicbody .pane-ref .card{padding:var(--sp5)}
  body.split .topicbody .pane-ref .card h3{font-size:var(--s5)}
  body.split .topicbody .pane-script .beat{grid-template-columns:56px 1fr}
}
.beat[data-ref]{cursor:pointer;border-radius:var(--r-inner);
  transition:background 160ms cubic-bezier(.22,.61,.36,1)}
body.split .beat[data-ref]:hover{background:var(--paper-2)}
body.split .beat.here .t{color:var(--ink-1);font-weight:700}
body.split .beat.here{background:var(--paper-2)}
.pane-ref .card.lit{box-shadow:0 0 0 2px var(--sun)}
.rail{display:flex;flex-wrap:wrap;gap:var(--sp2);align-items:center}
.rail .lab{color:var(--ink-2);margin-right:var(--sp2)}
.rail a{font-family:var(--font-mono);font-size:var(--s1);text-decoration:none;
  background:var(--sun);color:#F5F0E6;border-radius:var(--r-pill);padding:8px 16px;
  transition:background 160ms cubic-bezier(.22,.61,.36,1)}
.rail a:hover{background:var(--accent-hover)}
.beats{background:var(--ember);color:var(--ink-1);border-radius:var(--r-card);
  padding:var(--sp7);display:flex;flex-direction:column;gap:var(--sp5)}
.beats h2{font-size:var(--s6)}
.head{display:flex;flex-direction:column;gap:var(--sp2);scroll-margin-top:var(--sp5)}
.head h2{font-size:var(--s7)}
.head .k{font-family:var(--font-mono);font-size:var(--s1);color:var(--ink-2)}
.head p{color:var(--ink-2);max-width:64ch}
.card{background:var(--paper-1);border-radius:var(--r-card);box-shadow:var(--shadow-raise);
  padding:var(--sp6);display:flex;flex-direction:column;gap:var(--sp4);
  scroll-margin-top:var(--sp5);transition:box-shadow 160ms cubic-bezier(.22,.61,.36,1)}
.card:hover{box-shadow:var(--shadow-lift)}
.card h3{font-size:var(--s6)}
.card h4{font-size:var(--s4);letter-spacing:-.015em}
.card p,.card li{font-size:var(--s3)}
.card ul,.card ol{margin:0;padding-left:1.15em;display:flex;flex-direction:column;gap:var(--sp2)}
.tag{align-self:flex-start;font-family:var(--font-mono);font-size:var(--s1);
  background:var(--paper-2);color:var(--ink-2);border-radius:var(--r-pill);padding:5px 12px}
.tag.warn{background:var(--danger-quiet);color:var(--danger)}
hr.hair{border:0;border-top:1px solid var(--line-hair);margin:var(--sp2) 0;width:100%}
pre{margin:0;background:var(--paper-2);border-radius:var(--r-inner);padding:var(--sp4);
  overflow-x:auto;font-family:var(--font-mono);font-size:var(--s1);line-height:1.6}
code{font-family:var(--font-mono);font-size:.92em}
p code,li code,td code{background:var(--paper-2);border-radius:6px;padding:1px 5px}
details{border-radius:var(--r-inner);background:var(--paper-2);padding:var(--sp3)}
summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:var(--sp2);
  background:var(--sun);color:#F5F0E6;border-radius:var(--r-pill);padding:8px 18px;
  font-family:var(--font-mono);font-size:var(--s1);
  transition:background 160ms cubic-bezier(.22,.61,.36,1)}
summary::-webkit-details-marker{display:none}
summary:hover{background:var(--accent-hover)}
summary .chev{transition:transform 160ms cubic-bezier(.22,.61,.36,1)}
details[open] summary .chev{transform:rotate(90deg)}
.dbody{display:flex;flex-direction:column;gap:var(--sp4);padding:var(--sp4) var(--sp2) var(--sp2)}
.dbody p,.dbody li{font-size:var(--s3)}
.dbody ul,.dbody ol{margin:0;padding-left:1.15em;display:flex;flex-direction:column;gap:var(--sp2)}
.scroller{overflow-x:auto}
/* Figures, same drawings as the learner page. They sit inside a reference card
   here, which is narrower, so the min-width matters more rather than less. */
figure{margin:0 0 var(--sp4)}
figure svg{display:block;width:100%;height:auto;color:var(--ink-1)}
figcaption{font-size:12px;color:var(--ink-2);margin-top:8px}
.figwrap{overflow-x:auto}
.figwrap>svg{min-width:560px}

table{border-collapse:collapse;width:100%;min-width:460px}
th,td{text-align:left;padding:var(--sp3) var(--sp4);vertical-align:top;font-size:var(--s2)}
th{font-family:var(--font-mono);font-size:var(--s1);font-weight:500;color:var(--ink-2);
  border-bottom:1px solid var(--line-hair)}
td{border-bottom:1px solid var(--line-hair)}
tr:last-child td{border-bottom:0}
blockquote{margin:0;padding-left:var(--sp4);border-left:3px solid var(--ember);
  color:var(--ink-1);font-size:var(--s4);line-height:1.45}
.pairs{align-self:flex-start;font-family:var(--font-mono);font-size:var(--s1);
  letter-spacing:-.01em;color:var(--ink-2);background:var(--paper-2);
  border-radius:var(--r-pill);padding:5px 12px}
.head .pairs{margin-top:var(--sp2)}
body.split .pane-ref .card.lit .pairs{background:var(--sun);color:#F5F0E6}
.qmeta{font-family:var(--font-mono);font-size:var(--s1);color:var(--ink-2)}
.opt{margin:0;padding-left:1.15em;display:flex;flex-direction:column;gap:var(--sp1)}
.ok{font-weight:700}
.beat{display:grid;grid-template-columns:64px 1fr;gap:var(--sp4);align-items:start}
.beat+.beat{border-top:1px solid var(--line-hair);padding-top:var(--sp4)}
.beat .t{font-family:var(--font-mono);font-size:var(--s2);color:var(--ink-2);padding-top:2px}
.beat .b{display:flex;flex-direction:column;gap:var(--sp2)}
.beat h4{font-size:var(--s4);letter-spacing:-.015em}
.beat p,.beat li{font-size:var(--s3)}
.beat ul,.beat ol{margin:0;padding-left:1.15em;display:flex;flex-direction:column;gap:var(--sp2)}
.beat pre{font-size:var(--s1)}
.qbadge{font-family:var(--font-mono);font-size:var(--s1);background:var(--paper-2);
  color:var(--ink-2);border-radius:var(--r-pill);padding:5px 12px;align-self:flex-start}
.qbadge.spend{background:var(--danger-quiet);color:var(--danger)}
.sclock{background:var(--paper-1);border-radius:var(--r-card);box-shadow:var(--shadow-raise);
  padding:var(--sp4) var(--sp5);display:flex;flex-wrap:wrap;align-items:baseline;
  gap:var(--sp3) var(--sp5);font-family:var(--font-mono);font-size:var(--s2)}
.sclock .el{font-size:var(--s5);font-weight:500}
.sclock .now{font-family:var(--font-body);font-weight:700;font-size:var(--s3)}
.sclock .hint{color:var(--ink-2)}
.sclock button{font-family:var(--font-mono);font-size:var(--s1);border:1px solid var(--line-hair);
  background:var(--paper-2);color:var(--ink-2);border-radius:var(--r-pill);
  padding:6px 12px;cursor:pointer}
.sclock button:hover{background:var(--sun);color:#F5F0E6;border-color:var(--sun)}
.sclock .drift{color:var(--danger);font-weight:700}
tr.here td{background:var(--accent-quiet)}
footer{color:var(--ink-2);font-size:var(--s2)}
details.topic{margin:0}
details.topic>summary{display:flex;align-items:baseline;gap:14px;width:100%;
  background:var(--paper-1);color:var(--ink-1);border-radius:12px;box-shadow:0 0 0 1px #CBD1C8;
  padding:20px 24px;font-family:inherit;font-size:17px;font-weight:700;
  letter-spacing:-.015em;cursor:pointer;list-style:none}
details.topic>summary::-webkit-details-marker{display:none}
details.topic>summary:hover{box-shadow:0 0 0 1px #758279}
details.topic>summary .num{font-family:var(--font-mono);font-size:12px;font-weight:500;
  color:#F5F0E6;background:#183D32;border-radius:6px;padding:4px 9px;flex:none}
details.topic>summary .when{font-family:var(--font-mono);font-size:12px;font-weight:400;
  color:#526259;margin-left:auto;text-align:right}
details.topic>summary .caret{flex:none;color:#526259;font-size:13px;
  display:inline-block;transition:transform 160ms}
details.topic[open]>summary{border-radius:12px 12px 0 0;box-shadow:0 0 0 1px #758279}
details.topic[open]>summary .caret{transform:rotate(90deg)}
.topicbody{display:flex;flex-direction:column;gap:24px;padding:24px 0 8px}
@media (max-width:620px){.beat{grid-template-columns:1fr;gap:var(--sp2)}
  details.topic>summary{flex-wrap:wrap;padding:16px 18px}
  details.topic>summary .when{margin-left:0;width:100%;text-align:left}}
@media (max-width:720px){
  .hero{padding:var(--sp7) var(--sp5);border-radius:var(--r-card)}
  .card{padding:var(--sp5)}
  .beats{padding:var(--sp5)}}
@media (prefers-reduced-motion:reduce){*{transition:none !important}}
@media print{
  body{background:#fff}
  .teach{display:contents}
  .railbtn,.rail,.sclock{display:none}
  .pane-ref{position:static;max-height:none;overflow:visible}
  .card{box-shadow:none;border:1px solid #ccc;break-inside:avoid}
  .hero{background:#fff;color:#000}
  .hero .lead,.hero .mono{color:#333}
  .beats{background:#fff;border:1px solid #ccc}
  summary{display:none}
  details{background:#fff;padding:0}
  details.topic>.topicbody{display:flex !important}}
`;

// ── the live "now" marker, on both pages ───────────────────────────────────
// Both devices read their own wall clock against ONE declared start time, so they
// stay aligned with no network call and no server.
//
// THE START TIME IS NOT IN THIS FILE, and that is deliberate. `startsAt` in
// src/content/sessions/week-3.md is unset until Sunil enters the timetable, and
// guessing when a session starts is inventing a fact. So the clock is off until a
// `?start=` is in the URL, and it says so rather than showing a plausible time.
//
//   ...week-3-learner.html?start=2026-10-11T09:00+05:30
//
// NOTHING IS STORED. The offset lives in a closure and dies with the tab, which is
// the same rule the Ask widget's history follows. A pause that survived a reload
// would be a pause nobody remembers setting.
export const SESSION_CLOCK_JS = `
(function () {
  var host = document.getElementById('sclock');
  if (!host) return;
  var elEl = host.querySelector('.el');
  var nowEl = host.querySelector('.now');
  var hintEl = host.querySelector('.hint');
  var driftEl = host.querySelector('.drift');
  var rows = [].slice.call(document.querySelectorAll('#clocktable tbody tr'));
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var qs = new URLSearchParams(location.search);
  var startedAt = null;
  var raw = qs.get('start');
  if (raw) {
    var t = Date.parse(raw);
    if (!isNaN(t)) startedAt = t;
  }

  // Minutes of local offset, set by the instructor buttons. Not stored anywhere.
  var offset = 0;
  var paused = false;
  var pausedAt = 0;

  function mins(hhmm) {
    var p = hhmm.split(':');
    return Number(p[0]) * 60 + Number(p[1]);
  }
  function hhmm(m) {
    var s = m < 0 ? '-' : '';
    m = Math.abs(m);
    return s + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  var times = rows.map(function (r) {
    return mins(r.querySelector('td').textContent.trim());
  });
  var LAST = 300;

  function paint() {
    if (startedAt === null) {
      elEl.textContent = '--:--';
      nowEl.textContent = 'Clock off';
      hintEl.textContent = 'Add ?start=2026-10-11T09:00+05:30 to this URL and the clock follows the room.';
      return;
    }
    var elapsed = paused ? pausedAt : Math.floor((Date.now() - startedAt) / 60000);
    elapsed += offset;
    if (elapsed < 0) {
      elEl.textContent = hhmm(0);
      nowEl.textContent = 'Starts at ' + new Date(startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      hintEl.textContent = Math.abs(elapsed) + ' minutes to go.';
      rows.forEach(function (r) { r.classList.remove('here'); });
      return;
    }
    if (elapsed > LAST) {
      elEl.textContent = hhmm(elapsed);
      nowEl.textContent = 'Session ended';
      hintEl.textContent = '';
      rows.forEach(function (r) { r.classList.remove('here'); });
      return;
    }
    var i = -1;
    for (var k = 0; k < times.length; k++) if (times[k] <= elapsed) i = k;
    elEl.textContent = hhmm(elapsed);
    rows.forEach(function (r, n) { r.classList.toggle('here', n === i); });
    if (i >= 0) {
      var cells = rows[i].querySelectorAll('td');
      nowEl.textContent = cells[1].textContent.trim();
      var next = times[i + 1];
      hintEl.textContent = next === undefined
        ? 'last row'
        : 'next at ' + hhmm(next) + ', in ' + (next - elapsed) + ' min';
      if (driftEl) {
        var d = elapsed - times[i];
        var ran = next === undefined ? 0 : elapsed - next;
        driftEl.textContent = ran > 0 ? 'running ' + ran + ' min over' : '';
      }
      if (!reduce && rows[i].scrollIntoViewIfNeeded) rows[i].scrollIntoViewIfNeeded();
    }
  }

  var minus = host.querySelector('[data-off="-1"]');
  var plus = host.querySelector('[data-off="1"]');
  var pause = host.querySelector('[data-pause]');
  if (minus) minus.addEventListener('click', function () { offset -= 1; paint(); });
  if (plus) plus.addEventListener('click', function () { offset += 1; paint(); });
  if (pause) pause.addEventListener('click', function () {
    if (startedAt === null) return;
    if (!paused) { pausedAt = Math.floor((Date.now() - startedAt) / 60000) + offset; offset = 0; }
    paused = !paused;
    pause.textContent = paused ? 'Resume' : 'Pause';
    paint();
  });

  paint();
  setInterval(paint, 10000);
})();
`;

// The side-by-side toggle and the beat-to-card link. Kept identical to
// scripts/teaching-pane.js, which is the version in the repo and the one that
// fixed the bare-id bug: data-ref holds an id, and querySelector read it as an
// element name and matched nothing on all seven published pages at once.
export const PANE_JS = `
(function () {
  var body = document.body;
  var btn = document.getElementById('splitbtn');
  var beats = [].slice.call(document.querySelectorAll('.beat[data-ref]'));
  var wide = matchMedia('(min-width:1200px)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cardFor(beat) {
    var ref = (beat.getAttribute('data-ref') || '').replace(/^#/, '');
    return ref ? document.getElementById(ref) : null;
  }
  function paneFor(el) { return el ? el.closest('.pane-ref') : null; }

  function lightUp(beat) {
    var card = cardFor(beat);
    if (!card) return;
    var pane = paneFor(card);
    var scope = pane || document;
    var was = scope.querySelector('.card.lit');
    if (was) was.classList.remove('lit');
    card.classList.add('lit');
    var here = document.querySelector('.beat.here');
    if (here && here !== beat) here.classList.remove('here');
    beat.classList.add('here');
    var behaviour = reduce ? 'auto' : 'smooth';
    if (pane && body.classList.contains('split') && wide.matches &&
        pane.scrollHeight > pane.clientHeight) {
      var top = card.getBoundingClientRect().top
              - pane.getBoundingClientRect().top + pane.scrollTop;
      pane.scrollTo({ top: Math.max(0, top - 8), behavior: behaviour });
    } else {
      card.scrollIntoView({ behavior: behaviour, block: 'start' });
    }
  }

  beats.forEach(function (beat) {
    beat.addEventListener('click', function (e) {
      if (e.target.closest('a, summary, button, pre, code')) return;
      lightUp(beat);
    });
  });

  function setSplit(on) {
    body.classList.toggle('split', on);
    if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (!on) {
      [].forEach.call(document.querySelectorAll('.card.lit'), function (c) {
        c.classList.remove('lit');
      });
    }
  }
  if (btn) btn.addEventListener('click', function () {
    setSplit(!body.classList.contains('split'));
  });
  setSplit(wide.matches);
})();
`;
