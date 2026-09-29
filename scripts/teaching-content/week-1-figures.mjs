// Week 1's four drawings.
//
// WHERE THEY CAME FROM. These were on the hand-built learner page of August and
// were lost when week 1 was regenerated from a content module on 29 September —
// the module was written from the session file, and the session file has never
// held an SVG. Sunil asked for them back. They are the original artwork,
// unchanged, not a redraw.
//
// They are already on design system v1: every fill is #FBF8F2, #E5EBE1, #526259,
// #963D34 or #765523, plus `currentColor`. Nothing here uses #C6D4C8, which is
// the on-dark muted colour and is about 1.4:1 on paper — the trap the 28
// September palette conversion had to work around.
//
// EACH IS A COMPLETE <figure>: the figwrap scroller, the svg, and the caption.
// The caption carries the teaching point, so do not drop it when placing one.
// Every svg has a real aria-label describing the mechanism rather than naming
// the picture, because a diagram nobody can read aloud is not an explanation.
//
// A figure appears on BOTH pages of the pair. The learner reads it; the
// instructor has the same drawing on screen while talking to it, which is the
// whole reason check:teaching compares headings between the two.


// The ReAct loop, named at 00:31 in topic 0.
export const REACT_LOOP = `
  <figure>
    <div class="figwrap">
    <svg viewBox="0 0 900 292" role="img" font-family="Figtree, sans-serif"
         aria-label="The ReAct loop: Thought, then Action, then Observation, repeating. The model's thought is printed and then discarded rather than carried forward, which is where this implementation departs from the paper. The loop exits at the Action phase when the model resolves or escalates.">
      <defs>
        <marker id="lp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
        </marker>
        <marker id="lpr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#963D34"/>
        </marker>
      </defs>

      <rect x="6" y="90" width="100" height="36" rx="16" fill="#E5EBE1"/>
      <text x="56" y="113" text-anchor="middle" font-size="12" font-family="JetBrains Mono, monospace" fill="#526259">the ticket</text>
      <line x1="108" y1="108" x2="124" y2="108" stroke="currentColor" stroke-width="1.5" marker-end="url(#lp)"/>

      <rect x="130" y="56" width="230" height="104" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".32"/>
      <text x="150" y="88" font-size="15" font-weight="700" fill="currentColor">Thought</text>
      <text x="150" y="110" font-size="11.5" fill="currentColor">the model's reasoning</text>
      <text x="150" y="129" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">llm.py · "thought"</text>
      <text x="150" y="147" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#963D34">used here, never carried on</text>

      <line x1="362" y1="108" x2="386" y2="108" stroke="currentColor" stroke-width="1.5" marker-end="url(#lp)"/>

      <rect x="390" y="56" width="230" height="104" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".32"/>
      <text x="410" y="88" font-size="15" font-weight="700" fill="currentColor">Action</text>
      <text x="410" y="110" font-size="11.5" fill="currentColor">one tool, and its arguments</text>
      <text x="410" y="129" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">llm.py · "action" + "args"</text>
      <text x="410" y="147" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#765523">prints ▸ tool</text>

      <line x1="622" y1="108" x2="646" y2="108" stroke="currentColor" stroke-width="1.5" marker-end="url(#lp)"/>

      <rect x="650" y="56" width="230" height="104" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".32"/>
      <text x="670" y="88" font-size="15" font-weight="700" fill="currentColor">Observation</text>
      <text x="670" y="110" font-size="11.5" fill="currentColor">what the tool returned</text>
      <text x="670" y="129" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">agent.py · history.append</text>
      <text x="670" y="147" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">prints nothing</text>

      <path d="M 765 162 L 765 240 L 245 240 L 245 166" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#lp)"/>
      <text x="505" y="262" text-anchor="middle" font-size="11.5" fill="#526259">the next step rebuilds the whole prompt from the ticket and every observation so far</text>
      <text x="505" y="280" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">llm.py · _build_prompt · at most 6 steps</text>

      <line x1="505" y1="54" x2="505" y2="26" stroke="#963D34" stroke-width="1.5" marker-end="url(#lpr)"/>
      <text x="519" y="24" font-size="11.5" fill="#963D34">resolve or escalate ends the run here</text>
    </svg>
    </div>
    <figcaption>One step. <span class="mono">▸ plan</span> at the top of a run is the ticket being announced once, before any of this — it is not a phase. Note the red line under Thought. The reasoning is written before the action in the same reply, so it shapes that action — but it is never passed on, so no later step can use it. The paper carries it forward; this code does not.</figcaption>
  </figure>
`;

// The whole agent with the three tools it can reach, 00:31 in topic 0.
export const WHOLE_SYSTEM = `
  <figure>
    <div class="figwrap">
    <svg viewBox="0 0 960 344" role="img" font-family="Figtree, sans-serif"
         aria-label="The agent is a loop: it builds a prompt from the ticket and history, asks the model, reads back an action and its arguments, and runs one of three tools. The result goes back into the prompt. One of the three tools moves money and cannot be undone.">
      <defs>
        <marker id="a1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
        </marker>
        <marker id="a2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#963D34"/>
        </marker>
      </defs>

      <!-- pipeline -->
      <rect x="6" y="90" width="96" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="54" y="115" text-anchor="middle" font-size="13" fill="currentColor">the ticket</text>
      <text x="54" y="132" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="#526259">#4471</text>

      <line x1="104" y1="118" x2="130" y2="118" stroke="currentColor" stroke-width="1.5" marker-end="url(#a1)"/>

      <rect x="134" y="90" width="152" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="210" y="115" text-anchor="middle" font-size="13" fill="currentColor">build the prompt</text>
      <text x="210" y="132" text-anchor="middle" font-size="11" fill="#526259">from scratch, every step</text>

      <line x1="288" y1="118" x2="314" y2="118" stroke="currentColor" stroke-width="1.5" marker-end="url(#a1)"/>

      <rect x="318" y="90" width="124" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="380" y="123" text-anchor="middle" font-size="13" fill="currentColor">ask the model</text>

      <line x1="444" y1="118" x2="470" y2="118" stroke="currentColor" stroke-width="1.5" marker-end="url(#a1)"/>

      <rect x="474" y="90" width="152" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="550" y="115" text-anchor="middle" font-size="13" fill="currentColor">read the reply</text>
      <text x="550" y="132" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="#526259">action + args</text>

      <line x1="550" y1="150" x2="550" y2="166" stroke="currentColor" stroke-opacity=".4" stroke-width="1"/>
      <text x="546" y="182" text-anchor="middle" font-size="11" fill="#526259">the thought is printed here, then dropped</text>

      <!-- fan out to the three tools -->
      <path d="M 630 118 C 656 118 658 48 682 48" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#a1)"/>
      <path d="M 630 118 L 682 118" fill="none" stroke="#963D34" stroke-width="2" marker-end="url(#a2)"/>
      <path d="M 630 118 C 656 118 658 190 682 190" fill="none" stroke="currentColor" stroke-width="1.5" marker-end="url(#a1)"/>

      <rect x="686" y="22" width="262" height="52" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="702" y="44" font-size="12.5" font-family="JetBrains Mono, monospace" fill="currentColor">lookup_account</text>
      <text x="702" y="61" font-size="11" fill="#526259">reads the account. Safe to repeat.</text>

      <rect x="686" y="92" width="262" height="52" rx="16" fill="#FBF8F2" stroke="#963D34" stroke-width="2"/>
      <text x="702" y="114" font-size="12.5" font-family="JetBrains Mono, monospace" fill="#963D34">issue_credit</text>
      <text x="702" y="131" font-size="11" fill="#963D34">Moves money. Cannot be undone.</text>

      <rect x="686" y="164" width="262" height="52" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="702" y="186" font-size="12.5" font-family="JetBrains Mono, monospace" fill="currentColor">escalate</text>
      <text x="702" y="203" font-size="11" fill="#526259">Hands the case to a person.</text>

      <!-- the loop back -->
      <path d="M 817 218 L 817 266 L 210 266 L 210 150" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-dasharray="0" marker-end="url(#a1)"/>
      <text x="513" y="286" text-anchor="middle" font-size="11.5" fill="#526259">whatever the tool returned goes back in as plain text, and the loop runs again</text>

      <!-- the trace -->
      <rect x="6" y="300" width="942" height="38" rx="16" fill="#E5EBE1"/>
      <text x="24" y="324" font-size="12" fill="#526259">The trace prints every one of these steps as it happens. It is the only window you have.</text>
    </svg>
    </div>
    <figcaption>The whole agent. Four steps in a loop, three tools it may call, and one of those three moves real money with nothing standing in front of it.</figcaption>
  </figure>
`;

// One step as an interaction diagram, 00:46 in topic 1.
export const ONE_STEP = `
  <figure>
    <div class="figwrap">
    <svg viewBox="0 0 970 652" role="img" font-family="Figtree, sans-serif"
         aria-label="One step of the loop as an interaction diagram. The loop in agent.py asks llm.py for the next action; llm.py rebuilds the prompt from scratch and sends two messages to the model; the model returns one JSON object holding a thought, an action and its arguments; the loop prints the thought, calls the named tool, gets a result back, prints it, and saves the action, arguments and result to history. The thought is not saved. The loop then runs again, at most six times.">
      <defs>
        <marker id="sqa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
        </marker>
        <marker id="sqr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#963D34"/>
        </marker>
      </defs>

      <!-- ── participants ── -->
      <rect x="20" y="8" width="140" height="48" rx="16" fill="#E5EBE1" stroke="currentColor"
            stroke-opacity=".45" stroke-dasharray="5 4"/>
      <text x="90" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">the model</text>
      <text x="90" y="46" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">over the network</text>

      <rect x="260" y="8" width="140" height="48" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="330" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">builds the prompt</text>
      <text x="330" y="46" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">llm.py</text>

      <rect x="490" y="8" width="140" height="48" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="560" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">the loop</text>
      <text x="560" y="46" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">agent.py</text>

      <rect x="660" y="8" width="140" height="48" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="730" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">the tools</text>
      <text x="730" y="46" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">tools.py</text>

      <rect x="820" y="8" width="140" height="48" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="890" y="30" text-anchor="middle" font-size="13" font-weight="700" fill="currentColor">the trace</text>
      <text x="890" y="46" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">trace.py</text>

      <text x="20" y="74" font-size="11" fill="#963D34">not the harness — the only part you did not write</text>
      <text x="960" y="74" text-anchor="end" font-size="11" fill="#526259">the other four are the harness · all of it ordinary code · time runs downward</text>

      <!-- ── lifelines ── -->
      <line x1="90"  y1="86" x2="90"  y2="590" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 5"/>
      <line x1="330" y1="86" x2="330" y2="590" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 5"/>
      <line x1="560" y1="86" x2="560" y2="590" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 5"/>
      <line x1="730" y1="86" x2="730" y2="590" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 5"/>
      <line x1="890" y1="86" x2="890" y2="590" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 5"/>

      <!-- 1 · the loop asks for the next action -->
      <line x1="560" y1="112" x2="336" y2="112" stroke="currentColor" stroke-width="1.5" marker-end="url(#sqa)"/>
      <text x="448" y="104" text-anchor="middle" font-size="11.5" fill="currentColor">1 · what should I do next?</text>
      <text x="448" y="128" text-anchor="middle" font-size="10.5" fill="#526259">the ticket, and every tool result so far</text>

      <!-- 2 · the rebuild -->
      <rect x="250" y="142" width="160" height="40" rx="14" fill="#E5EBE1"/>
      <text x="330" y="159" text-anchor="middle" font-size="11.5" fill="currentColor">2 · write the prompt</text>
      <text x="330" y="174" text-anchor="middle" font-size="10.5" fill="#526259">from scratch, every turn</text>

      <!-- 3 · out to the model -->
      <line x1="330" y1="206" x2="96" y2="206" stroke="currentColor" stroke-width="1.5" marker-end="url(#sqa)"/>
      <text x="212" y="198" text-anchor="middle" font-size="11.5" fill="currentColor">3 · two messages: the rules, then the case</text>
      <text x="208" y="222" text-anchor="middle" font-size="10.5" fill="#526259">temperature 0 · no memory of last turn</text>

      <!-- 4 · back from the model -->
      <line x1="90" y1="254" x2="324" y2="254" stroke="currentColor" stroke-width="1.5" marker-end="url(#sqa)"/>
      <text x="208" y="246" text-anchor="middle" font-size="11.5" fill="currentColor">4 · one JSON object comes back</text>
      <text x="208" y="270" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#765523">thought · action · args</text>

      <!-- 5 · back to the loop -->
      <line x1="330" y1="302" x2="554" y2="302" stroke="currentColor" stroke-width="1.5" marker-end="url(#sqa)"/>
      <text x="444" y="294" text-anchor="middle" font-size="11.5" fill="currentColor">5 · the reply, passed straight through</text>

      <!-- 6 · print the thought -->
      <line x1="560" y1="350" x2="884" y2="350" stroke="currentColor" stroke-width="1.5" marker-end="url(#sqa)"/>
      <text x="700" y="342" text-anchor="middle" font-size="11.5" fill="currentColor">6 · print the thought</text>
      <text x="700" y="366" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">▸ think</text>

      <!-- 7 · call the tool -->
      <line x1="560" y1="398" x2="724" y2="398" stroke="#963D34" stroke-width="2" marker-end="url(#sqr)"/>
      <text x="644" y="390" text-anchor="middle" font-size="11.5" fill="#963D34">7 · run the named tool</text>
      <text x="644" y="414" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#963D34">issue_credit('4471', 1200)</text>

      <!-- 8 · the result -->
      <line x1="730" y1="446" x2="566" y2="446" stroke="#963D34" stroke-width="2" marker-end="url(#sqr)"/>
      <text x="644" y="438" text-anchor="middle" font-size="11.5" fill="#963D34">8 · the money has moved</text>
      <text x="644" y="462" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#963D34">{'credited': True, ...}</text>

      <!-- 9 · print the call -->
      <line x1="560" y1="494" x2="884" y2="494" stroke="currentColor" stroke-width="1.5" marker-end="url(#sqa)"/>
      <text x="700" y="486" text-anchor="middle" font-size="11.5" fill="currentColor">9 · print the call and its result</text>
      <text x="700" y="510" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">▸ tool</text>

      <!-- 10 · what is kept -->
      <rect x="478" y="524" width="164" height="40" rx="14" fill="#E5EBE1"/>
      <text x="560" y="541" text-anchor="middle" font-size="11.5" fill="currentColor">10 · keep for next turn</text>
      <text x="560" y="556" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">action, args, result</text>
      <text x="560" y="582" text-anchor="middle" font-size="11" fill="#963D34">the thought is not kept — no later turn ever sees it</text>

      <line x1="20" y1="600" x2="950" y2="600" stroke="currentColor" stroke-opacity=".18"/>
      <text x="485" y="622" text-anchor="middle" font-size="11.5" fill="#526259">then the whole thing runs again, carrying one more result — at most six times</text>
      <text x="485" y="640" text-anchor="middle" font-size="10.5" font-family="JetBrains Mono, monospace" fill="#526259">unless the model said resolve or escalate, which end the run here</text>
    </svg>
    </div>
    <figcaption>One step, and everything that crosses between the five parts. Read it twice:
      once down the left, where <strong>nothing but the ticket and past results reaches the model</strong> — it
      is handed a fresh conversation each turn and remembers nothing; and once down the right, where
      <strong>only <span class="mono">action</span> and <span class="mono">args</span> move money</strong>. The tool result at step 8
      goes back into step 2's prompt as plain text, with nothing marking where it came from.</figcaption>
  </figure>
`;

// What week 2 builds, 03:12 in topic 4 — the shape of what they are NOT building today.
export const WEEK_2_SHAPE = `
  <figure>
    <div class="figwrap">
    <svg viewBox="0 0 960 268" role="img" font-family="Figtree, sans-serif"
         aria-label="What week 2 builds: the same money path with four checks in front of it. The arguments are checked for shape, then the account must exist, then the amount must be under a ceiling, then the dispute must not already have been paid. The limits come from a written policy, and a ledger records every credit.">
      <defs>
        <marker id="b1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/>
        </marker>
        <marker id="b2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#963D34"/>
        </marker>
      </defs>

      <rect x="8" y="52" width="132" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="74" y="77" text-anchor="middle" font-size="12.5" fill="currentColor">the model says</text>
      <text x="74" y="94" text-anchor="middle" font-size="11" font-family="JetBrains Mono, monospace" fill="#526259">pay 250000</text>

      <line x1="142" y1="80" x2="164" y2="80" stroke="currentColor" stroke-width="1.5" marker-end="url(#b1)"/>

      <rect x="168" y="52" width="150" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="184" y="72" font-size="11" font-family="JetBrains Mono, monospace" fill="#526259">drill 3 · today</text>
      <text x="184" y="92" font-size="13" fill="currentColor">Right shape?</text>

      <line x1="320" y1="80" x2="342" y2="80" stroke="currentColor" stroke-width="1.5" marker-end="url(#b1)"/>

      <rect x="346" y="52" width="150" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="362" y="72" font-size="11" font-family="JetBrains Mono, monospace" fill="#963D34">week 2</text>
      <text x="362" y="92" font-size="13" fill="currentColor">Account real?</text>

      <line x1="498" y1="80" x2="520" y2="80" stroke="currentColor" stroke-width="1.5" marker-end="url(#b1)"/>

      <rect x="524" y="52" width="150" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="540" y="72" font-size="11" font-family="JetBrains Mono, monospace" fill="#963D34">week 2</text>
      <text x="540" y="92" font-size="13" fill="currentColor">Under the ceiling?</text>

      <line x1="676" y1="80" x2="698" y2="80" stroke="currentColor" stroke-width="1.5" marker-end="url(#b1)"/>

      <rect x="702" y="52" width="150" height="56" rx="16" fill="#FBF8F2" stroke="currentColor" stroke-opacity=".35"/>
      <text x="718" y="72" font-size="11" font-family="JetBrains Mono, monospace" fill="#963D34">week 2</text>
      <text x="718" y="92" font-size="13" fill="currentColor">Already paid?</text>

      <line x1="854" y1="80" x2="876" y2="80" stroke="#963D34" stroke-width="2" marker-end="url(#b2)"/>
      <text x="916" y="70" text-anchor="middle" font-size="11.5" font-family="JetBrains Mono, monospace" fill="#963D34">issue</text>
      <text x="916" y="86" text-anchor="middle" font-size="11.5" font-family="JetBrains Mono, monospace" fill="#963D34">_credit</text>

      <line x1="421" y1="112" x2="421" y2="20" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2" marker-end="url(#b1)"/>
      <text x="431" y="24" font-size="11" fill="#526259">any check may refuse, and say why</text>

      <rect x="346" y="176" width="328" height="56" rx="16" fill="#E5EBE1"/>
      <text x="362" y="196" font-size="11" font-family="JetBrains Mono, monospace" fill="#963D34">week 2</text>
      <text x="362" y="216" font-size="13" fill="currentColor">The written policy: what may be paid, and by whom</text>
      <line x1="421" y1="172" x2="421" y2="114" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="4 4"/>
      <line x1="599" y1="172" x2="599" y2="114" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2" stroke-dasharray="4 4"/>
      <text x="686" y="206" font-size="11" fill="#526259">these two read their limits from here</text>

      <rect x="702" y="176" width="150" height="40" rx="16" fill="#E5EBE1"/>
      <text x="777" y="201" text-anchor="middle" font-size="12" font-family="JetBrains Mono, monospace" fill="#526259">ledger file</text>
      <line x1="777" y1="172" x2="777" y2="114" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2" marker-end="url(#b1)"/>
      <text x="789" y="146" font-size="11" fill="#526259">reads</text>
    </svg>
    </div>
    <figcaption>What sits in front of the money once week 2 is done. Only the first box — checking the shape of the arguments — is today's work, and even that one only makes the failure visible rather than preventing a payment. Everything marked <span class="mono">week 2</span> is what you design in block 4 and build next week.</figcaption>
  </figure>
`;
