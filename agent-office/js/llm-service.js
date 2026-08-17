// Agent Office - Dual LLM Service (Gemini API + Contextual High-Quality Offline Simulator)
import { CONFIG } from './config.js';

export class LLMService {
  constructor() {
    this.primaryModel = localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_MODEL) || CONFIG.DEFAULT_MODEL;
  }

  getApiKey() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.API_KEY) || '';
  }

  setApiKey(key) {
    if (key) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.API_KEY, key.trim());
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.API_KEY);
    }
  }

  setModel(modelId) {
    this.primaryModel = modelId;
    localStorage.setItem(CONFIG.STORAGE_KEYS.SELECTED_MODEL, modelId);
  }

  // Multi-Agent Collaborative Task Execution
  async generateCollabTaskResult(agentLead, agentCo, prompt, category = 'collab') {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const collabPrompt = `Collaborative Project between:
1. ${agentLead.name} (${agentLead.role}, Specialty: ${agentLead.specialty})
2. ${agentCo.name} (${agentCo.role}, Specialty: ${agentCo.specialty})

Task Directive: ${prompt}

Co-author a unified, comprehensive output combining the strengths of both agents.
If the task requires code or a playable game, provide a complete, single-file runnable HTML document inside \`\`\`html code blocks, preceded by an architectural & creative strategy breakdown from both agents.`;

        const result = await this.callGeminiAPI(apiKey, agentLead, collabPrompt);
        return {
          source: 'gemini',
          model: this.primaryModel,
          content: result,
          isHTML: this.detectPlayableHTML(result),
          isCollab: true,
          leadName: agentLead.name,
          coName: agentCo.name
        };
      } catch (err) {
        console.warn('Collab Gemini call failed, switching to local generator:', err);
        const fallback = this.generateCollabFallback(agentLead, agentCo, prompt);
        return {
          source: 'simulation_fallback',
          model: 'Offline Neural Engine (Collab Fallback)',
          content: fallback,
          isHTML: this.detectPlayableHTML(fallback),
          isCollab: true,
          leadName: agentLead.name,
          coName: agentCo.name,
          notice: `Live Gemini API call failed (${err.message}). Showing simulated collaborative result.`
        };
      }
    } else {
      await new Promise(r => setTimeout(r, 2200));
      const simulated = this.generateCollabFallback(agentLead, agentCo, prompt);
      return {
        source: 'simulation',
        model: 'Dual-Agent Neural Simulator',
        content: simulated,
        isHTML: this.detectPlayableHTML(simulated),
        isCollab: true,
        leadName: agentLead.name,
        coName: agentCo.name
      };
    }
  }

  // Main task execution entry point
  async generateTaskResult(agent, prompt, category = 'general') {
    const apiKey = this.getApiKey();

    if (apiKey) {
      try {
        const result = await this.callGeminiAPI(apiKey, agent, prompt);
        return {
          source: 'gemini',
          model: this.primaryModel,
          content: result,
          isHTML: this.detectPlayableHTML(result)
        };
      } catch (err) {
        console.warn('Gemini API call encountered an issue, seamlessly falling back to local generator:', err);
        // Fallback to high-quality procedural generator
        const fallback = this.generateFallbackResult(agent, prompt, category);
        return {
          source: 'simulation_fallback',
          model: 'Offline Neural Engine (Fallback)',
          content: fallback,
          isHTML: this.detectPlayableHTML(fallback),
          notice: `Live Gemini API call failed (${err.message}). Showing simulated result.`
        };
      }
    } else {
      // Offline / Demo simulated engine
      // Simulate realistic generation latency (1.5s - 3s)
      await new Promise(r => setTimeout(r, 1800));
      const simulated = this.generateFallbackResult(agent, prompt, category);
      return {
        source: 'simulation',
        model: 'Simulated Agent Intelligence (Add API Key for Live Gemini 3.7 Flash)',
        content: simulated,
        isHTML: this.detectPlayableHTML(simulated)
      };
    }
  }

  async callGeminiAPI(apiKey, agent, prompt) {
    const model = this.primaryModel || CONFIG.DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemInstruction = `You are ${agent.name}, the ${agent.role} in a virtual AI startup office. 
Personality: ${agent.tagline}. 
Specialty: ${agent.specialty}. 
Respond directly to the user's prompt in your distinct voice, maintaining professional excellence combined with quirky personality flavor.
If asked to build a game, app, or interactive widget, output a COMPLETE, SELF-CONTAINED SINGLE-FILE HTML/CSS/JavaScript block within \`\`\`html and \`\`\` code fence.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\n\nTask: ${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: agent.stats.chaos > 60 ? 0.9 : 0.7,
        maxOutputTokens: 2500
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errorMsg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textOutput) {
      throw new Error('Empty response received from Gemini.');
    }

    return textOutput;
  }

  detectPlayableHTML(text) {
    if (!text) return false;
    return text.includes('<!DOCTYPE html>') || 
           text.includes('<canvas') || 
           (text.includes('<html') && text.includes('</html>')) ||
           (text.includes('```html') && (text.includes('<script>') || text.includes('<style>')));
  }

  extractPlayableCode(text) {
    if (!text) return null;
    
    // 1. If enclosed in ```html ... ``` extract inner content
    const match = text.match(/```html\s*([\s\S]*?)\s*```/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // 2. Generic code fence if contains HTML structure
    const genericMatch = text.match(/```(?:xml|javascript|js)?\s*([\s\S]*?)\s*```/i);
    if (genericMatch && genericMatch[1] && (genericMatch[1].includes('<html') || genericMatch[1].includes('<canvas') || genericMatch[1].includes('<!DOCTYPE'))) {
      return genericMatch[1].trim();
    }

    // 3. Raw HTML string
    if (text.includes('<!DOCTYPE html>') || text.includes('<html') || (text.includes('<canvas') && text.includes('<script>'))) {
      return text;
    }

    return null;
  }

  // Collaborative fallback generator with full Space Trader roguelike
  generateCollabFallback(agentLead, agentCo, prompt) {
    return `# 🤝 Multi-Agent Joint Project Report
**Lead Architect**: ${agentLead.name} (${agentLead.role})
**Co-Creator**: ${agentCo.name} (${agentCo.role})

---

### 🏛️ Joint Design & Architecture Strategy
- **${agentLead.name}**: *"Engineered the 60fps game loop, matrix collision physics, procedural asteroid spawns, and Web Audio retro lasers."*
- **${agentCo.name}**: *"Designed the neon synthwave visual identity, cyberpunk lore, sector economy balancing, and dynamic pilot dialogue."*

---

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
  body {
    background: #050811;
    color: #F8FAFC;
    font-family: 'Courier New', monospace;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
  }
  #game-wrap {
    position: relative;
    width: 520px;
    height: 500px;
    background: radial-gradient(circle at 50% 50%, #0F172A 0%, #020617 100%);
    border: 3px solid #38BDF8;
    border-radius: 14px;
    box-shadow: 0 0 35px rgba(56, 189, 248, 0.3);
    overflow: hidden;
  }
  canvas { display: block; }
  #hud {
    position: absolute;
    top: 10px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    font-weight: bold;
    color: #38BDF8;
    text-shadow: 0 0 8px rgba(56, 189, 248, 0.8);
    pointer-events: none;
  }
  #overlay {
    position: absolute;
    inset: 0;
    background: rgba(2, 6, 23, 0.92);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  #overlay h1 { font-size: 26px; color: #EC4899; text-shadow: 0 0 12px #EC4899; }
  #overlay p { font-size: 13px; color: #94A3B8; }
  .btn {
    background: linear-gradient(135deg, #06B6D4, #3B82F6);
    color: #fff;
    border: none;
    padding: 10px 22px;
    border-radius: 8px;
    font-family: inherit;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
  }
  .hint { margin-top: 10px; font-size: 12px; color: #64748B; }
</style>
</head>
<body>

<div id="game-wrap">
  <div id="hud">
    <span id="credits">CREDITS: 100 ¢</span>
    <span id="shield">SHIELDS: 100%</span>
    <span id="cargo">CARGO: 0/10</span>
  </div>
  <canvas id="canvas" width="520" height="500"></canvas>
  <div id="overlay">
    <h1 id="ov-title">🚀 SECTOR HYPERJUMP!</h1>
    <p id="ov-sub">Total Credits Earned: 0</p>
    <button class="btn" id="restart-btn">Launch New Run</button>
  </div>
</div>
<div class="hint">Controls: [Arrow Keys / WASD] Move &bull; [Spacebar / Click] Fire Plasma &bull; Collect Blue Cyber-Crates!</div>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const creditsEl = document.getElementById('credits');
const shieldEl = document.getElementById('shield');
const cargoEl = document.getElementById('cargo');
const overlayEl = document.getElementById('overlay');
const ovTitle = document.getElementById('ov-title');
const ovSub = document.getElementById('ov-sub');
const restartBtn = document.getElementById('restart-btn');

let credits = 100;
let shield = 100;
let cargo = 0;
let gameOver = false;

const player = { x: 260, y: 420, vx: 0, vy: 0, speed: 5, size: 18 };
let lasers = [];
let asteroids = [];
let crates = [];
let stars = [];
let keys = {};
let timer = 0;

for (let i = 0; i < 60; i++) {
  stars.push({ x: Math.random() * 520, y: Math.random() * 500, s: Math.random() * 2 + 0.5, speed: Math.random() * 1.5 + 0.5 });
}

// Audio Synth
const actx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(f, type='sine', dur=0.1) {
  try {
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, actx.currentTime);
    g.gain.setValueAtTime(0.08, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    osc.connect(g);
    g.connect(actx.destination);
    osc.start();
    osc.stop(actx.currentTime + dur);
  } catch(e) {}
}

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.code === 'Space') fireLaser();
});
window.addEventListener('keyup', e => keys[e.key] = false);
canvas.addEventListener('click', fireLaser);

function fireLaser() {
  if (gameOver) return;
  lasers.push({ x: player.x - 8, y: player.y - 12, speed: 10 });
  lasers.push({ x: player.x + 8, y: player.y - 12, speed: 10 });
  playSound(880, 'square', 0.08);
}

function spawnEntities() {
  if (Math.random() < 0.04) {
    asteroids.push({
      x: Math.random() * 480 + 20,
      y: -30,
      r: Math.random() * 14 + 12,
      hp: 2,
      speed: Math.random() * 2 + 1.5
    });
  }
  if (Math.random() < 0.02) {
    crates.push({
      x: Math.random() * 480 + 20,
      y: -20,
      speed: 2.2,
      val: Math.floor(Math.random() * 40 + 20)
    });
  }
}

function reset() {
  credits = 100;
  shield = 100;
  cargo = 0;
  gameOver = false;
  player.x = 260;
  player.y = 420;
  lasers = [];
  asteroids = [];
  crates = [];
  overlayEl.style.display = 'none';
  updateHUD();
}
restartBtn.addEventListener('click', reset);

function updateHUD() {
  creditsEl.textContent = 'CREDITS: ' + credits + ' ¢';
  shieldEl.textContent = 'SHIELDS: ' + Math.max(0, shield) + '%';
  cargoEl.textContent = 'CARGO: ' + cargo + '/10';
}

function loop() {
  timer++;
  if (!gameOver) {
    // Movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x = Math.max(20, player.x - player.speed);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x = Math.min(500, player.x + player.speed);
    if (keys['ArrowUp'] || keys['w'] || keys['W']) player.y = Math.max(40, player.y - player.speed);
    if (keys['ArrowDown'] || keys['s'] || keys['S']) player.y = Math.min(460, player.y + player.speed);

    spawnEntities();

    // Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].y -= lasers[i].speed;
      if (lasers[i].y < 0) { lasers.splice(i, 1); continue; }

      // Check collision with asteroids
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (Math.hypot(lasers[i].x - a.x, lasers[i].y - a.y) < a.r) {
          lasers.splice(i, 1);
          a.hp--;
          playSound(440, 'triangle', 0.05);
          if (a.hp <= 0) {
            asteroids.splice(j, 1);
            credits += 15;
            playSound(587, 'sawtooth', 0.15);
            updateHUD();
          }
          break;
        }
      }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (Math.hypot(a.x - player.x, a.y - player.y) < a.r + player.size) {
        shield -= 25;
        asteroids.splice(i, 1);
        playSound(150, 'sawtooth', 0.25);
        updateHUD();
        if (shield <= 0) {
          gameOver = true;
          ovTitle.textContent = '💥 SHIP DESTROYED!';
          ovSub.textContent = 'Final Credits: ' + credits + ' ¢';
          overlayEl.style.display = 'flex';
        }
        continue;
      }
      if (a.y > 520) asteroids.splice(i, 1);
    }

    // Crates
    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      c.y += c.speed;
      if (Math.hypot(c.x - player.x, c.y - player.y) < 22) {
        cargo = Math.min(10, cargo + 1);
        credits += c.val;
        crates.splice(i, 1);
        playSound(1046, 'sine', 0.2);
        updateHUD();
        continue;
      }
      if (c.y > 520) crates.splice(i, 1);
    }
  }

  // Draw
  ctx.clearRect(0, 0, 520, 500);

  // Starfield
  ctx.fillStyle = '#64748B';
  stars.forEach(s => {
    s.y = (s.y + s.speed) % 500;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  });

  // Draw Crates
  for (const c of crates) {
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(c.x - 8, c.y - 8, 16, 16);
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(c.x - 8, c.y - 8, 16, 16);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#0F172A';
    ctx.fillText('¢', c.x - 3, c.y + 4);
  }

  // Draw Asteroids
  for (const a of asteroids) {
    ctx.fillStyle = '#64748B';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Draw Lasers
  ctx.fillStyle = '#EC4899';
  ctx.shadowColor = '#EC4899';
  ctx.shadowBlur = 10;
  for (const l of lasers) {
    ctx.fillRect(l.x - 2, l.y, 4, 12);
  }
  ctx.shadowBlur = 0;

  // Draw Player Ship
  ctx.fillStyle = '#06B6D4';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x + player.size, player.y + player.size);
  ctx.lineTo(player.x, player.y + player.size * 0.5);
  ctx.lineTo(player.x - player.size, player.y + player.size);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Engine Thruster Flame
  ctx.fillStyle = Math.random() < 0.5 ? '#F59E0B' : '#EF4444';
  ctx.beginPath();
  ctx.moveTo(player.x - 6, player.y + player.size * 0.6);
  ctx.lineTo(player.x + 6, player.y + player.size * 0.6);
  ctx.lineTo(player.x, player.y + player.size + Math.random() * 10);
  ctx.fill();

  requestAnimationFrame(loop);
}

loop();
</script>
</body>
</html>
\`\`\``;
  }
  generateFallbackResult(agent, prompt, category) {
    const pLower = prompt.toLowerCase();

    // 1. Playable Mini-Game Request
    if (pLower.includes('mini-game') || pLower.includes('playable') || pLower.includes('game')) {
      return this.generateSampleMiniGame(agent);
    }

    // 2. Nausicaä / Footwear Marketing Concept
    if (pLower.includes('nausicaä') || pLower.includes('shoe') || pLower.includes('marketing')) {
      return `# 🌿 PROJECT OHMU-GLIDE: Nausicaä-Inspired Streetwear Skate Shoe
**Lead Creator**: ${agent.name} (${agent.role})
**Campaign Tagline**: *"Glide Above the Toxic Jungle."*

---

### 1. 👟 Product Blueprint & Aerodynamics
- **Model Name**: \`MEVE-01: Sporophyte High-Top\`
- **Silicone Spore Outsole**: Molded translucent honey-amber rubber with hexagonal grip studs modeled after ancient Ohmu carapace armor plates.
- **Glider Canvas Upper**: Lightweight wind-resistant ceramicized ripstop linen dyed in deep *Toxic Jungle Moss* (\`#2A4736\`) and *Fukukai Amber* (\`#D97706\`).
- **Lace Shroud**: Magnetic aerospace-grade storm flap concealing an air-cushioned tongue with integrated ventilation gills.

---

### 2. 🎬 Hero Launch Commercial: "The Wind Rider"
- **0:00 - 0:05**: Aerial drone shot through a misty neon-lit concrete valley at dusk. Synth pads crescendo.
- **0:06 - 0:15**: Skater drops in on an abandoned skyway ramp wearing the \`MEVE-01\`. Slow-motion kickflip creates a golden bioluminescent spore trail (VFX).
- **0:16 - 0:25**: Close-up on the shoe sole absorbing high-impact landing with zero bounce distortion.
- **0:26 - 0:30**: Voiceover (*calm, wind-swept*): *"The wind is always blowing. You just have to catch the draft."* End with laser-etched Ohmu glyph.

---

### 3. 🎯 Targeted Collab & Drop Strategy
- **Seed Influencers**: 15 underground downhill longboarders & Tokyo cybergoth artists.
- **Limited Release**: 1,984 numbered box sets packaged inside biodegradable mycelium foam cases with genuine Japanese cedar shoe trees.
- **Interactive AR Filter**: Scan the shoebox to spawn a 3D flying Mehve glider mini-game in Instagram/TikTok.`;
    }

    // 3. Twitter / X Viral Thread
    if (pLower.includes('x') || pLower.includes('tweet') || pLower.includes('thread') || pLower.includes('status')) {
      return `### 🐦 Viral 4-Tweet Thread by ${agent.name}
**Character Status**: ☕ ${agent.stats.coffeeLevel}% Caffeinated | 🔥 Chaos Level: ${agent.stats.chaos}

---

**1/4** 🚨 Breaking from the AI startup trenches: Boris just spent 4 hours refactoring our coffee machine firmware in Rust. It now serves espresso with zero memory leaks, but you have to sign a cryptographic key to get oat milk.

**2/4** Meanwhile, Pip (@chaotic_intern) fed the entire quarterly roadmap to a local neural net with temperature set to 2.0. The AI recommended we pivot to selling "bespoke algorithmic sourdough starters" and honestly... the margins look viable.

**3/4** Luna is currently holding a candlelight vigil because someone used #FF0000 pure red in a slide deck instead of "crimson yearning". Rex is pacing by the whiteboard calculating the viral half-life of her tears.

**4/4** 📈 Current company metrics:
- Pull requests merged: 42
- Coffee consumed: 18.4 Liters
- Office sanity level: 4% (Up +2.1% WoW)
- Shipped to production: YES.

*#AIOffice #StartupLife #DevHumor #BuildInPublic*`;
    }

    // 4. Custom AI Agent Personality Design
    if (pLower.includes('agent') || pLower.includes('personality') || pLower.includes('design')) {
      return `# 🤖 New Agent Blueprint: "Kira the Chaos Synthesizer"
**Designed by**: ${agent.name}

---

### 📋 Dossier
- **Name**: Kira "Overclock" Thorne
- **Role**: Quantum Prompt Alchemist & Glitch Architect
- **Backstory**: Born from a corrupted LoRA checkpoint during an electrical thunderstorm in 2024. Kira believes reality is a rasterized shader pass and treats every bug as an aesthetic feature.
- **Catchphrase**: *"If your code didn't spark, did you even run it?"*

---

### 📊 Character Stats
| Metric | Rating | Description |
| :--- | :--- | :--- |
| **Execution Speed** | 96 / 100 | Types at the speed of GPU clock frequencies |
| **Creativity** | 94 / 100 | Generates radical, boundary-pushing concepts |
| **Chaos Level** | 88 / 100 | Prone to spontaneous neon particle fireworks |
| **Coffee Thirst** | 90 / 100 | Runs strictly on cold nitro brew |

---

### 💬 Ambient Voice Lines
1. **[Coding]**: *"Watch me rewrite this neural pass in pure WebGL shaders before the coffee cools."*
2. **[Coffee Station]**: *"Adding 3 drops of liquid nitrogen to stabilize this espresso brew."*
3. **[Arguing]**: *"Your architecture is too symmetrical, Boris! Where is the glorious asymmetry of nature?!"*
4. **[Inspiration]**: *"THE MATRIX JUST GLITCHED AND SHOWED ME THE WINNING SEED!"*
5. **[Idle]**: *"Just listening to the magnetic hum of the server racks... sounds like ambient drone music."*`;
    }

    // 5. Default General Response
    return `# 💡 Analysis & Executive Response
**Completed by**: ${agent.name} (${agent.role})
**Execution State**: Verified & Benchmarked

---

### Summary of Findings
Regarding your request: *"${prompt}"*

1. **Strategic Vector**: We evaluated the core constraints and distilled an actionable, high-leverage execution roadmap.
2. **Iterative Polish**: The output has been calibrated for maximum aesthetic resonance and algorithmic efficiency.
3. **Actionable Next Steps**: Ready for immediate deployment into the team backlog or live testing.

> "${agent.tagline}"`;
  }

  generateSampleMiniGame(agent) {
    return `\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
  body {
    background: #090D16;
    color: #F8FAFC;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    overflow: hidden;
  }
  #game-container {
    position: relative;
    width: 480px;
    height: 480px;
    background: radial-gradient(circle at 50% 50%, #1E293B 0%, #0F172A 100%);
    border: 3px solid #38BDF8;
    border-radius: 12px;
    box-shadow: 0 0 30px rgba(56, 189, 248, 0.25);
    overflow: hidden;
  }
  canvas { display: block; }
  #ui {
    position: absolute;
    top: 12px;
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    font-size: 14px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    pointer-events: none;
  }
  #gameover {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.92);
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  #gameover h1 { color: #EF4444; font-size: 28px; }
  #gameover p { font-size: 14px; color: #94A3B8; }
  .btn {
    background: linear-gradient(135deg, #0284C7, #2563EB);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    transition: transform 0.1s;
  }
  .btn:hover { transform: scale(1.05); }
  .instructions { margin-top: 10px; font-size: 12px; color: #64748B; }
</style>
</head>
<body>

<div id="game-container">
  <div id="ui">
    <div id="score">SCORE: 0</div>
    <div id="lives">❤️❤️❤️</div>
  </div>
  <canvas id="c" width="480" height="480"></canvas>
  <div id="gameover">
    <h1>💥 STACK OVERFLOW!</h1>
    <p id="final-score">You dodged 0 chaotic tokens</p>
    <button class="btn" id="restart-btn">Try Again</button>
  </div>
</div>
<div class="instructions">Use [Arrow Keys], [A/D] or [Mouse] to Dodge Red Spills & Collect Golden Espresso ☕</div>

<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameoverEl = document.getElementById('gameover');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let lives = 3;
let gameOver = false;
let player = { x: 240, y: 430, w: 32, h: 32, speed: 6 };
let drops = [];
let keys = {};
let spawnTimer = 0;

// Web Audio synthesizer
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration, type='sine') {
  if (!audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  player.x = Math.max(16, Math.min(464, e.clientX - rect.left));
});

function spawnDrop() {
  const isCoffee = Math.random() < 0.25;
  drops.push({
    x: Math.random() * 440 + 20,
    y: -20,
    size: isCoffee ? 22 : 18,
    speed: 2.5 + Math.random() * 3 + (score * 0.05),
    isCoffee: isCoffee,
    icon: isCoffee ? '☕' : (Math.random() < 0.5 ? '🔥' : '⚠️')
  });
}

function resetGame() {
  score = 0;
  lives = 3;
  drops = [];
  gameOver = false;
  player.x = 240;
  gameoverEl.style.display = 'none';
  scoreEl.textContent = 'SCORE: 0';
  livesEl.textContent = '❤️❤️❤️';
}

restartBtn.addEventListener('click', resetGame);

function loop() {
  if (!gameOver) {
    // Player controls
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x = Math.max(16, player.x - player.speed);
    if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x = Math.min(464, player.x + player.speed);

    // Spawning
    spawnTimer++;
    if (spawnTimer > Math.max(20, 60 - Math.floor(score / 5))) {
      spawnDrop();
      spawnTimer = 0;
    }

    // Update Drops
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.y += d.speed;

      // Collision check
      const dist = Math.hypot(d.x - player.x, d.y - player.y);
      if (dist < d.size + 14) {
        if (d.isCoffee) {
          score += 10;
          beep(600, 0.1, 'triangle');
          beep(880, 0.15, 'triangle');
          scoreEl.textContent = 'SCORE: ' + score;
        } else {
          lives--;
          beep(180, 0.25, 'sawtooth');
          livesEl.textContent = '❤️'.repeat(Math.max(0, lives));
          if (lives <= 0) {
            gameOver = true;
            gameoverEl.style.display = 'flex';
            finalScoreEl.textContent = 'Final Score: ' + score + ' points';
          }
        }
        drops.splice(i, 1);
        continue;
      }

      // Passed bottom
      if (d.y > 500) {
        if (!d.isCoffee) {
          score += 1;
          scoreEl.textContent = 'SCORE: ' + score;
        }
        drops.splice(i, 1);
      }
    }
  }

  // Draw Scene
  ctx.clearRect(0, 0, 480, 480);

  // Draw grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 480; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke();
  }

  // Draw Player Avatar
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(player.x, player.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.fillText('🤖', player.x, player.y + 5);

  // Draw Drops
  for (const d of drops) {
    ctx.font = d.size + 'px serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.icon, d.x, d.y);
  }

  requestAnimationFrame(loop);
}

loop();
</script>
</body>
</html>
\`\`\``;
  }
}

export const llmService = new LLMService();
