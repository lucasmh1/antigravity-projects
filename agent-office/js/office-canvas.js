// Agent Office - 2D Office Canvas Engine & Agent Renderer
import { CONFIG } from './config.js';
import { sound } from './audio.js';

export class OfficeCanvas {
  constructor(canvasElement, onSelectAgent) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.onSelectAgent = onSelectAgent;

    this.width = CONFIG.CANVAS.WIDTH;
    this.height = CONFIG.CANVAS.HEIGHT;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.agents = [];
    this.particles = [];
    this.selectedAgentId = null;
    this.hoveredAgentId = null;
    this.time = 0;

    this.setupInteractions();
  }

  setAgents(agents) {
    this.agents = agents;
  }

  setPurchasedDecor(decorList) {
    this.purchasedDecor = decorList || [];
  }

  setupInteractions() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const hovered = this.getAgentAt(x, y);
      this.hoveredAgentId = hovered ? hovered.id : null;
      
      const hoveredStation = this.getStationAt(x, y);
      this.canvas.style.cursor = (hovered || hoveredStation) ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const clickedAgent = this.getAgentAt(x, y);
      if (clickedAgent) {
        sound.playClick();
        this.selectedAgentId = clickedAgent.id;
        if (this.onSelectAgent) {
          this.onSelectAgent(clickedAgent);
        }
        return;
      }

      // Check if clicked an interactive station
      const station = this.getStationAt(x, y);
      if (station) {
        this.handleStationClick(station);
        return;
      }

      this.selectedAgentId = null;
    });
  }

  getStationAt(x, y) {
    // Check coffee, arcade, pingpong, disco
    const coffee = CONFIG.STATIONS.COFFEE;
    if (Math.hypot(x - coffee.x, y - coffee.y) < 26) return { id: 'coffee' };

    if (this.hasDecor('arcade_cabinet')) {
      const arc = CONFIG.STATIONS.ARCADE;
      if (Math.hypot(x - arc.x, y - arc.y) < 28) return { id: 'arcade' };
    }

    if (this.hasDecor('pingpong_table')) {
      const pp = CONFIG.STATIONS.PINGPONG;
      if (Math.hypot(x - pp.x, y - pp.y) < 40) return { id: 'pingpong' };
    }

    if (this.hasDecor('disco_ball')) {
      const db = CONFIG.STATIONS.DISCO_BALL;
      if (Math.hypot(x - db.x, y - db.y) < 30) return { id: 'disco' };
    }

    return null;
  }

  handleStationClick(station) {
    if (station.id === 'coffee') {
      sound.playCoffee();
      for (let i = 0; i < 8; i++) {
        this.addParticle(CONFIG.STATIONS.COFFEE.x + Math.random()*10 - 5, CONFIG.STATIONS.COFFEE.y - 10, (Math.random()-0.5)*15, -30, 'rgba(255,255,255,0.7)', 1.0);
      }
    } else if (station.id === 'arcade') {
      sound.playArcade();
      const idleAgent = this.agents.find(a => a.status === 'idle');
      if (idleAgent) {
        this.sendAgentTo(idleAgent, 'arcade_approach', (a) => {
          a.status = 'idle';
          this.showSpeech(a.id, "New High Score on Cyber Strike! 🎮", 4, '🕹️');
        });
      }
    } else if (station.id === 'pingpong') {
      sound.playPingPong();
      const idles = this.agents.filter(a => a.status === 'idle');
      if (idles.length >= 2) {
        this.startPingPongMatch(idles[0], idles[1]);
      }
    } else if (station.id === 'disco') {
      sound.playDiscoParty();
      this.partyMode = !this.partyMode;
      this.partyTimer = 10;
      this.agents.forEach(a => {
        if (a.status === 'idle') {
          this.showSpeech(a.id, "DISCO TIME! 🪩✨", 4, '🪩');
        }
      });
    }
  }

  startPingPongMatch(agentA, agentB) {
    this.sendAgentTo(agentA, 'pingpong_left', (a) => {
      a.status = 'idle';
      a.facing = 1;
      this.showSpeech(a.id, "Your serve, buddy!", 3, '🏓');
    });
    this.sendAgentTo(agentB, 'pingpong_right', (b) => {
      b.status = 'idle';
      b.facing = -1;
      this.showSpeech(b.id, "Spin smash incoming!", 3, '🏓');
    });

    this.pingPongMatchActive = true;
    this.pingPongTimer = 6;
  }

  hasDecor(decorId) {
    return this.purchasedDecor && this.purchasedDecor.includes(decorId);
  }

  getAgentAt(x, y) {
    // Agents are roughly 40x50 bounding box centered at agent.x, agent.y
    for (let i = this.agents.length - 1; i >= 0; i--) {
      const a = this.agents[i];
      if (x >= a.x - 24 && x <= a.x + 24 && y >= a.y - 48 && y <= a.y + 12) {
        return a;
      }
    }
    return null;
  }

  // Predefined waypoint pathfinding resolver
  findWaypointPath(startKey, targetKey) {
    if (startKey === targetKey) return [CONFIG.WAYPOINTS[targetKey]];
    
    // BFS traversal over NAV_GRAPH
    const queue = [[startKey]];
    const visited = new Set([startKey]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current === targetKey) {
        return path.map(k => ({ ...CONFIG.WAYPOINTS[k], key: k }));
      }

      const neighbors = CONFIG.NAV_GRAPH[current] || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }

    // Fallback direct coordinate
    return [CONFIG.WAYPOINTS[targetKey] || { x: 580, y: 380 }];
  }

  findNearestWaypoint(x, y) {
    let bestKey = 'hall_center';
    let bestDist = Infinity;
    for (const [key, wp] of Object.entries(CONFIG.WAYPOINTS)) {
      const d = Math.hypot(wp.x - x, wp.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestKey = key;
      }
    }
    return bestKey;
  }

  // Send an agent on a route to a destination station or desk
  sendAgentTo(agent, destinationWaypointKey, onArrival = null) {
    const startWp = this.findNearestWaypoint(agent.x, agent.y);
    const path = this.findWaypointPath(startWp, destinationWaypointKey);
    
    agent.currentPath = path;
    agent.pathIndex = 0;
    agent.status = 'walking';
    agent.onArrival = onArrival;
    agent.targetWaypointKey = destinationWaypointKey;
  }

  update(deltaTime) {
    this.time += deltaTime;

    // Update particles (steam, sparks, typing code dust)
    this.updateParticles(deltaTime);

    // Update agents movement & animations
    for (const agent of this.agents) {
      this.updateAgent(agent, deltaTime);
    }
  }

  updateAgent(agent, deltaTime) {
    // Movement along path
    if (agent.status === 'walking' && agent.currentPath && agent.currentPath.length > 0) {
      const target = agent.currentPath[agent.pathIndex];
      if (target) {
        const dx = target.x - agent.x;
        const dy = target.y - agent.y;
        const dist = Math.hypot(dx, dy);
        const speed = (agent.stats.speed || 80) * 1.8 * deltaTime;

        // Facing direction
        if (Math.abs(dx) > 2) {
          agent.facing = dx > 0 ? 1 : -1;
        }

        if (dist <= speed) {
          agent.x = target.x;
          agent.y = target.y;
          agent.pathIndex++;

          if (agent.pathIndex >= agent.currentPath.length) {
            agent.currentPath = null;
            if (agent.onArrival) {
              agent.onArrival(agent);
            } else {
              agent.status = 'idle';
            }
          }
        } else {
          agent.x += (dx / dist) * speed;
          agent.y += (dy / dist) * speed;
          // Walk bobbing cycle
          agent.walkCycle = (agent.walkCycle || 0) + deltaTime * 12;
        }
      }
    }

    // Typing particle emissions during WORKING state
    if (agent.status === 'working') {
      if (Math.random() < 0.15) {
        this.addParticle(
          agent.x + (Math.random() * 20 - 10),
          agent.y - 20,
          (Math.random() - 0.5) * 20,
          -30 - Math.random() * 20,
          ['#38BDF8', '#818CF8', '#34D399', '#F472B6'][Math.floor(Math.random() * 4)],
          0.8,
          'text',
          ['1', '0', '{', '}', ';', '/>', '$', '⚡'][Math.floor(Math.random() * 8)]
        );
      }
    }

    // Decay speech bubble timer
    if (agent.speechBubble) {
      agent.speechBubble.timer -= deltaTime;
      if (agent.speechBubble.timer <= 0) {
        agent.speechBubble = null;
      }
    }
  }

  showSpeech(agentId, text, duration = 4.5, emotion = null) {
    const agent = this.agents.find(a => a.id === agentId);
    if (agent) {
      agent.speechBubble = {
        text,
        timer: duration,
        maxDuration: duration,
        emotion: emotion || (agent.status === 'working' ? '💻' : agent.status === 'coffee' ? '☕' : '💬')
      };
    }
  }

  addParticle(x, y, vx, vy, color, life, type = 'circle', char = '') {
    this.particles.push({
      x, y, vx, vy, color, life, maxLife: life, type, char
    });
  }

  updateParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Ambient steam from coffee machine
    if (Math.random() < 0.25) {
      const coffee = CONFIG.STATIONS.COFFEE;
      this.addParticle(
        coffee.x + 2 + (Math.random() * 8 - 4),
        coffee.y - 12,
        (Math.random() - 0.5) * 5,
        -18 - Math.random() * 12,
        'rgba(220, 220, 240, 0.45)',
        1.2,
        'circle'
      );
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Office Floor & Architecture
    this.renderFloorPlan();

    // 2. Draw Office Furniture & Stations
    this.renderStations();

    // 3. Draw Particles (under agents / background steam)
    this.renderParticles();

    // 4. Draw Agents (sorted by Y for proper 2.5D depth ordering)
    const sortedAgents = [...this.agents].sort((a, b) => a.y - b.y);
    for (const agent of sortedAgents) {
      this.renderAgent(agent);
    }

    // 5. Draw Speech Bubbles & Floating UI over all agents
    for (const agent of this.agents) {
      if (agent.speechBubble) {
        this.renderSpeechBubble(agent);
      }
    }
  }

  renderFloorPlan() {
    const ctx = this.ctx;

    // Background base
    ctx.fillStyle = '#0F172A'; // Deep slate
    ctx.fillRect(0, 0, this.width, this.height);

    // Main Office Carpet Area
    ctx.fillStyle = '#1E293B';
    this.roundRect(ctx, 30, 30, this.width - 60, this.height - 60, 16, true, false);

    // Floor grid pattern (subtle modern tech tile grid)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < this.width - 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, this.height - 40);
      ctx.stroke();
    }
    for (let y = 40; y < this.height - 40; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(this.width - 40, y);
      ctx.stroke();
    }

    // Zone 1: West Work Pod Rug (Deep Navy/Indigo)
    ctx.fillStyle = 'rgba(37, 99, 235, 0.09)';
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
    this.roundRect(ctx, 130, 350, 350, 320, 12, true, true);

    // Zone 2: East Work Pod Rug (Deep Purple)
    ctx.fillStyle = 'rgba(147, 51, 234, 0.09)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.2)';
    this.roundRect(ctx, 650, 350, 350, 320, 12, true, true);

    // Zone 3: Break Lounge Area Rug (Warm Gold/Amber)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
    this.roundRect(ctx, 920, 480, 200, 190, 16, true, true);

    // Zone 4: Kitchen / Coffee Tile Area (Warm Teal)
    ctx.fillStyle = 'rgba(20, 184, 166, 0.12)';
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.25)';
    this.roundRect(ctx, 50, 50, 380, 190, 12, true, true);

    // Office Outer Walls with Modern Neon Trim
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 30, 30, this.width - 60, this.height - 60, 16, false, true);

    // Room Label Badges
    this.drawRoomLabel(120, 70, '☕ RECHARGE KITCHEN', '#2DD4BF');
    this.drawRoomLabel(580, 55, '📊 STRATEGY & WHITEBOARD', '#818CF8');
    this.drawRoomLabel(1040, 70, '⚡ CLOUD NODES', '#38BDF8');
    this.drawRoomLabel(300, 370, '💻 DEV & DESIGN POD', '#60A5FA');
    this.drawRoomLabel(820, 370, '🚀 GROWTH & TREND LAB', '#C084FC');
    this.drawRoomLabel(1020, 500, '🛋️ ZEN LOUNGE', '#FBBF24');
  }

  drawRoomLabel(x, y, text, color) {
    const ctx = this.ctx;
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    const width = ctx.measureText(text).width + 16;
    ctx.fillRect(x - width / 2, y - 10, width, 18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - width / 2, y - 10, width, 18);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y + 3);
  }

  renderStations() {
    const ctx = this.ctx;

    // --- 1. Kitchen Station (Coffee Machine & Snacks) ---
    // Countertop
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 60, 100, 350, 45, 6, true, true);

    // Vending machine
    const snacks = CONFIG.STATIONS.SNACKS;
    ctx.fillStyle = '#1E1B4B';
    this.roundRect(ctx, snacks.x - 22, snacks.y - 35, 44, 45, 6, true, true);
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(snacks.x - 16, snacks.y - 28, 32, 20); // glass
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍫', snacks.x, snacks.y - 12);

    // Coffee Machine
    const coffee = CONFIG.STATIONS.COFFEE;
    ctx.fillStyle = '#0F172A';
    this.roundRect(ctx, coffee.x - 18, coffee.y - 24, 36, 32, 4, true, true);
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(coffee.x - 8, coffee.y - 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(coffee.x, coffee.y - 14, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '16px serif';
    ctx.fillText('☕', coffee.x, coffee.y + 2);

    // Watercooler
    const wc = CONFIG.STATIONS.WATERCOOLER;
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(wc.x, wc.y - 18, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(wc.x - 10, wc.y - 8, 20, 20);
    ctx.font = '14px serif';
    ctx.fillText('💧', wc.x, wc.y + 6);

    // --- 2. Whiteboard Area ---
    const wb = CONFIG.STATIONS.WHITEBOARD;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 3;
    this.roundRect(ctx, wb.x - 90, wb.y - 25, 180, 50, 4, true, true);
    // Draw sketch diagrams and notes on whiteboard
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(wb.x - 70, wb.y - 15, 30, 20);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(wb.x - 25, wb.y - 10, 20, 15);
    ctx.strokeStyle = '#10B981';
    ctx.beginPath();
    ctx.moveTo(wb.x - 40, wb.y - 5);
    ctx.lineTo(wb.x - 25, wb.y - 5);
    ctx.stroke();
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(wb.x + 15, wb.y - 18, 24, 24);
    ctx.fillStyle = '#0F172A';
    ctx.font = '8px monospace';
    ctx.fillText('AGENTS->AI', wb.x + 50, wb.y - 2);

    // --- 3. Server Rack ---
    const srv = CONFIG.STATIONS.SERVER_RACK;
    ctx.fillStyle = '#020617';
    ctx.strokeStyle = '#1E293B';
    this.roundRect(ctx, srv.x - 25, srv.y - 45, 50, 60, 6, true, true);
    // Blinking lights
    const t = Math.floor(this.time * 4);
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = (t + row) % 2 === 0 ? '#10B981' : '#3B82F6';
      ctx.fillRect(srv.x - 18, srv.y - 38 + row * 12, 6, 4);
      ctx.fillStyle = '#64748B';
      ctx.fillRect(srv.x - 8, srv.y - 38 + row * 12, 22, 4);
    }

    // --- 4. Break Lounge ---
    const lounge = CONFIG.STATIONS.LOUNGE;
    // Comfy Beanbag / Sofa
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.ellipse(lounge.x, lounge.y + 10, 36, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.ellipse(lounge.x + 4, lounge.y + 12, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Monstera Houseplant
    this.drawPlant(920, 560);
    this.drawPlant(1120, 200);

    // --- 5. Interactive Decor: Arcade Cabinet ---
    if (this.hasDecor('arcade_cabinet')) {
      const arc = CONFIG.STATIONS.ARCADE;
      // Cabinet Body
      ctx.fillStyle = '#1E1B4B';
      this.roundRect(ctx, arc.x - 22, arc.y - 36, 44, 52, 6, true, true);
      // Glowing Animated Screen
      const crtShift = Math.sin(this.time * 12) * 2;
      ctx.fillStyle = '#06B6D4';
      ctx.fillRect(arc.x - 16, arc.y - 28, 32, 24);
      // Joystick & Buttons
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(arc.x - 8, arc.y + 6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(arc.x + 6, arc.y + 6, 2.5, 0, Math.PI * 2);
      ctx.arc(arc.x + 12, arc.y + 6, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Arcade Marquee
      ctx.fillStyle = '#EC4899';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER', arc.x, arc.y - 30);
    }

    // --- 6. Interactive Decor: Ping Pong Table ---
    if (this.hasDecor('pingpong_table')) {
      const pp = CONFIG.STATIONS.PINGPONG;
      // Table Surface
      ctx.fillStyle = '#065F46'; // Forest green felt
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      this.roundRect(ctx, pp.x - 65, pp.y - 30, 130, 60, 4, true, true);
      // Center Net
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pp.x, pp.y - 30);
      ctx.lineTo(pp.x, pp.y + 30);
      ctx.stroke();

      // Bouncing Ping Pong Ball during active match or ambient
      const ballX = pp.x + Math.sin(this.time * 6) * 45;
      const ballY = pp.y + Math.abs(Math.cos(this.time * 6)) * -14;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 3, 0, Math.PI * 2);
      ctx.fill();
      // Ball Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(ballX, pp.y, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- 7. Interactive Decor: Disco Mirror Ball ---
    if (this.hasDecor('disco_ball')) {
      const db = CONFIG.STATIONS.DISCO_BALL;
      // Hanging cord
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(db.x, 0);
      ctx.lineTo(db.x, db.y);
      ctx.stroke();

      // Mirror sphere
      const sphereGrad = ctx.createRadialGradient(db.x - 3, db.y - 3, 1, db.x, db.y, 12);
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(0.5, '#CBD5E1');
      sphereGrad.addColorStop(1, '#64748B');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(db.x, db.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Party Mode Light Rays & Sparkles
      if (this.partyMode) {
        for (let i = 0; i < 8; i++) {
          const angle = this.time * 3 + (i * Math.PI / 4);
          const rx = db.x + Math.cos(angle) * (150 + i * 30);
          const ry = db.y + Math.sin(angle) * (150 + i * 30);
          ctx.strokeStyle = `hsl(${(this.time * 100 + i * 45) % 360}, 90%, 65%)`;
          ctx.globalAlpha = 0.25;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(db.x, db.y);
          ctx.lineTo(rx, ry);
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // --- 8. Work Desks ---
    for (const [key, desk] of Object.entries(CONFIG.STATIONS)) {
      if (desk.type === 'work') {
        this.renderDesk(desk);
      }
    }
  }

  drawPlant(x, y) {
    const ctx = this.ctx;
    // Pot
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x + 8, y + 14);
    ctx.lineTo(x - 8, y + 14);
    ctx.closePath();
    ctx.fill();
    // Leaves
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.ellipse(x - 8, y - 8, 10, 6, -0.6, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y - 8, 10, 6, 0.6, 0, Math.PI * 2);
    ctx.ellipse(x, y - 14, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDesk(desk) {
    const ctx = this.ctx;
    const x = desk.x;
    const y = desk.y;

    // Desk surface
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    this.roundRect(ctx, x - 35, y - 25, 70, 40, 6, true, true);

    // Keyboard & Mousepad
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(x - 18, y - 4, 26, 12);
    ctx.fillStyle = '#64748B';
    ctx.fillRect(x + 12, y - 4, 10, 12);

    // Check if an agent is currently actively working at this desk
    const workingAgentAtDesk = this.agents.find(a => a.deskId === desk.id && a.status === 'working');

    // Dual Monitors
    if (workingAgentAtDesk) {
      // Animated Active Matrix Glow
      const glowPulse = Math.sin(this.time * 8) * 0.3 + 0.7;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 12 * glowPulse;
      ctx.fillStyle = '#0284C7';
      this.roundRect(ctx, x - 28, y - 24, 24, 16, 2, true, false);
      ctx.fillStyle = '#6366F1';
      this.roundRect(ctx, x + 2, y - 24, 24, 16, 2, true, false);
      ctx.shadowBlur = 0;

      // Thinking... banner above monitors
      const dotCount = Math.floor((this.time * 3) % 4);
      const dots = '.'.repeat(dotCount);
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.fillText(`🧠 THINKING${dots}`, x, y - 32);
    } else {
      ctx.fillStyle = '#0284C7';
      this.roundRect(ctx, x - 28, y - 24, 24, 16, 2, true, false);
      ctx.fillStyle = '#6366F1';
      this.roundRect(ctx, x + 2, y - 24, 24, 16, 2, true, false);
    }

    // Screen Stands
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 18, y - 8, 4, 4);
    ctx.fillRect(x + 12, y - 8, 4, 4);

    // Ergonomic Chair (behind desk)
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y + 24, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Desk Owner / ID label
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(desk.name.split(' ')[0], x, y + 42);
  }

  renderAgent(agent) {
    const ctx = this.ctx;
    const isSelected = this.selectedAgentId === agent.id;
    const isHovered = this.hoveredAgentId === agent.id;

    const x = agent.x;
    // Walk bounce
    const bob = agent.status === 'walking' ? Math.sin(agent.walkCycle || 0) * 3 : 0;
    const y = agent.y + bob;

    // Selection / Hover Ring
    if (isSelected || isHovered) {
      ctx.beginPath();
      ctx.arc(x, y + 2, 22, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#38BDF8' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.setLineDash(isSelected ? [4, 2] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, agent.y + 4, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (Shirt)
    ctx.fillStyle = agent.avatar.shirtColor || '#3B82F6';
    this.roundRect(ctx, x - 12, y - 24, 24, 22, 6, true, false);

    // Head
    ctx.fillStyle = '#FED7AA'; // Skin tone
    ctx.beginPath();
    ctx.arc(x, y - 32, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = agent.avatar.hairColor || '#1E293B';
    ctx.beginPath();
    ctx.arc(x, y - 35, 10, Math.PI, Math.PI * 2);
    ctx.fill();

    // Face Details / Eyes
    const faceDir = agent.facing || 1;
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(x + 2 * faceDir, y - 32, 1.5, 0, Math.PI * 2);
    ctx.arc(x + 6 * faceDir, y - 32, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Accessory / Hat / Glasses
    if (agent.avatar.accessory) {
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText(agent.avatar.accessory, x - 1 * faceDir, y - 38);
    }

    // Status Indicator Badge above head
    this.renderAgentStatusBadge(agent, x, y - 48);

    // Name Label
    ctx.font = '600 11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F8FAFC';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(agent.name.split(' ')[0], x, y + 18);
    ctx.shadowBlur = 0;
  }

  renderAgentStatusBadge(agent, x, y) {
    const ctx = this.ctx;
    let icon = '💤';
    let bgColor = 'rgba(71, 85, 105, 0.8)';

    switch (agent.status) {
      case 'working':
        icon = '💻';
        bgColor = 'rgba(59, 130, 246, 0.9)';
        break;
      case 'coffee':
        icon = '☕';
        bgColor = 'rgba(234, 88, 12, 0.9)';
        break;
      case 'arguing':
        icon = '🔥';
        bgColor = 'rgba(239, 68, 68, 0.9)';
        break;
      case 'inspiration':
        icon = '💡';
        bgColor = 'rgba(234, 179, 8, 0.9)';
        break;
      case 'walking':
        icon = '🚶';
        bgColor = 'rgba(16, 185, 129, 0.9)';
        break;
      default:
        icon = '💤';
        bgColor = 'rgba(71, 85, 105, 0.8)';
        break;
    }

    ctx.fillStyle = bgColor;
    this.roundRect(ctx, x - 10, y - 10, 20, 20, 10, true, false);
    ctx.font = '11px serif';
    ctx.textAlign = 'center';
    ctx.fillText(icon, x, y + 4);
  }

  renderSpeechBubble(agent) {
    const ctx = this.ctx;
    const sb = agent.speechBubble;
    const x = agent.x;
    const y = agent.y - 70;

    ctx.font = '500 12px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(sb.text).width;
    const bubbleWidth = Math.min(240, Math.max(80, textWidth + 24));
    const padding = 8;

    // Wrap text into 1-2 lines
    const words = sb.text.split(' ');
    const lines = [];
    let curLine = '';

    for (const w of words) {
      const testLine = curLine ? `${curLine} ${w}` : w;
      if (ctx.measureText(testLine).width < bubbleWidth - 16) {
        curLine = testLine;
      } else {
        lines.push(curLine);
        curLine = w;
      }
    }
    if (curLine) lines.push(curLine);

    const bubbleHeight = lines.length * 16 + padding * 2;
    const bx = x - bubbleWidth / 2;
    const by = y - bubbleHeight;

    // Bubble Background (Glassmorphic white/translucent)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, bx, by, bubbleWidth, bubbleHeight, 8, true, true);

    // Comic pointer tail
    ctx.beginPath();
    ctx.moveTo(x - 5, by + bubbleHeight);
    ctx.lineTo(x, by + bubbleHeight + 6);
    ctx.lineTo(x + 5, by + bubbleHeight);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.fill();
    ctx.stroke();

    // Emotion Tag
    if (sb.emotion) {
      ctx.font = '12px serif';
      ctx.fillText(sb.emotion, bx + 10, by + 16);
    }

    // Text Lines
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'left';
    ctx.font = '500 11px system-ui, -apple-system, sans-serif';
    lines.forEach((line, i) => {
      ctx.fillText(line, bx + (sb.emotion ? 24 : 10), by + padding + 12 + i * 15);
    });
  }

  renderParticles() {
    const ctx = this.ctx;
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'text') {
        ctx.font = 'bold 12px monospace';
        ctx.fillText(p.char, p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }

  roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }
}
