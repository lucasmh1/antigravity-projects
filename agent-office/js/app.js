// Agent Office - Main Application Controller
import { CONFIG } from './config.js';
import { STARTER_AGENTS, HIREABLE_CANDIDATES, getCustomAgents, saveCustomAgent } from './agents-data.js';
import { OfficeCanvas } from './office-canvas.js';
import { TaskSystem } from './task-system.js';
import { EventsSystem } from './events-system.js';
import { sound } from './audio.js';
import { llmService } from './llm-service.js';

class AgentOfficeApp {
  constructor() {
    this.tokens = 600;
    this.agents = [];
    this.upgrades = JSON.parse(JSON.stringify(CONFIG.UPGRADES));
    this.decorShop = JSON.parse(JSON.stringify(CONFIG.DECOR_SHOP));
    this.purchasedDecor = [];
    this.hireableCandidates = JSON.parse(JSON.stringify(HIREABLE_CANDIDATES));
    this.selectedAgent = null;
    this.activeTaskResult = null;

    this.lastFrameTime = performance.now();
  }

  async init() {
    this.loadState();
    this.initAgents();

    const canvasEl = document.getElementById('office-canvas');
    this.canvasEngine = new OfficeCanvas(canvasEl, (agent) => {
      this.selectAgent(agent);
    });
    this.canvasEngine.setAgents(this.agents);
    this.canvasEngine.setPurchasedDecor(this.purchasedDecor);

    // Initial positioning of agents at their respective desks
    this.agents.forEach((agent, idx) => {
      const deskKey = agent.deskId || `desk_${idx + 1}`;
      const desk = CONFIG.STATIONS[deskKey.toUpperCase()] || CONFIG.STATIONS.DESK_1;
      agent.x = desk.x;
      agent.y = desk.y + 15;
    });

    this.taskSystem = new TaskSystem(
      this.canvasEngine,
      (completedTask) => this.onTaskCompleted(completedTask),
      (reward) => this.addTokens(reward)
    );

    this.eventsSystem = new EventsSystem(
      this.canvasEngine,
      this.agents,
      (ev) => this.showNotification(ev.title, ev.description),
      (tokens) => this.addTokens(tokens)
    );

    this.setupUIBindings();
    this.renderAgentRoster();
    this.renderTaskHistory();
    this.updateHUD();

    if (this.agents.length > 0) {
      this.selectAgent(this.agents[0]);
    }

    requestAnimationFrame((t) => this.gameLoop(t));

    setTimeout(() => {
      if (this.agents[0]) {
        this.canvasEngine.showSpeech(this.agents[0].id, "Welcome to Agent Office! Let's ship some code!", 4.5, '🚀');
      }
    }, 1000);
  }

  loadState() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.GAME_STATE);
      if (saved) {
        const state = JSON.parse(saved);
        this.tokens = state.tokens ?? 600;
        if (state.upgrades) this.upgrades = state.upgrades;
      }
      const decor = localStorage.getItem(CONFIG.STORAGE_KEYS.PURCHASED_DECOR);
      if (decor) {
        this.purchasedDecor = JSON.parse(decor);
      }
    } catch (e) {
      console.warn('Could not load game state:', e);
    }
  }

  saveState() {
    try {
      const state = {
        tokens: this.tokens,
        upgrades: this.upgrades
      };
      localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
      localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASED_DECOR, JSON.stringify(this.purchasedDecor));
    } catch (e) {
      console.warn('Could not save game state:', e);
    }
  }

  initAgents() {
    const starters = JSON.parse(JSON.stringify(STARTER_AGENTS));
    const customs = getCustomAgents();
    this.agents = [...starters, ...customs];
  }

  gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;

    // Update Simulation Engines
    this.canvasEngine.update(deltaTime);
    this.eventsSystem.update(deltaTime);

    // Live update status badges in sidebar
    this.updateAgentRosterStatus();

    // Render Canvas Frame
    this.canvasEngine.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  updateAgentRosterStatus() {
    for (let i = 0; i < this.agents.length; i++) {
      const agent = this.agents[i];
      const card = document.querySelector(`.agent-card[data-agent-id="${agent.id}"]`);
      if (card) {
        const badge = card.querySelector('.agent-status-badge');
        if (badge) {
          const upperStatus = agent.status.toUpperCase();
          if (badge.textContent !== upperStatus) {
            badge.textContent = upperStatus;
            badge.className = `agent-status-badge status-${agent.status}`;
          }
        }
      }
    }
  }

  addTokens(amount) {
    this.tokens += amount;
    this.updateHUD();
    this.saveState();
  }

  updateHUD() {
    const tokenEl = document.getElementById('hud-tokens');
    if (tokenEl) tokenEl.textContent = this.tokens.toLocaleString();

    const agentCountEl = document.getElementById('hud-agent-count');
    if (agentCountEl) agentCountEl.textContent = `${this.agents.length} Agents Active`;

    const activeTasksCount = this.taskSystem ? this.taskSystem.activeTasks.length : 0;
    const taskCountEl = document.getElementById('hud-active-tasks');
    if (taskCountEl) taskCountEl.textContent = `${activeTasksCount} In Progress`;
  }

  selectAgent(agent) {
    this.selectedAgent = agent;
    if (this.canvasEngine) {
      this.canvasEngine.selectedAgentId = agent ? agent.id : null;
    }

    // Highlight in sidebar
    document.querySelectorAll('.agent-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.agentId === (agent ? agent.id : ''));
    });

    // Update bottom action bar / selected bar
    const selectedNameEl = document.getElementById('selected-agent-name');
    const selectedRoleEl = document.getElementById('selected-agent-role');
    const selectedTagEl = document.getElementById('selected-agent-tagline');
    const selectedAvatarEl = document.getElementById('selected-agent-avatar');
    const assignBtn = document.getElementById('btn-assign-selected');

    if (agent) {
      if (selectedNameEl) selectedNameEl.textContent = agent.name;
      if (selectedRoleEl) selectedRoleEl.textContent = agent.role;
      if (selectedTagEl) selectedTagEl.textContent = `"${agent.tagline}"`;
      if (selectedAvatarEl) {
        selectedAvatarEl.textContent = agent.avatar.accessory || '🤖';
        selectedAvatarEl.style.backgroundColor = agent.avatar.shirtColor || '#3B82F6';
      }
      if (assignBtn) {
        assignBtn.disabled = false;
        assignBtn.textContent = `Assign Task to ${agent.name.split(' ')[0]}`;
      }
    }
  }

  renderAgentRoster() {
    const container = document.getElementById('agent-roster-list');
    if (!container) return;
    container.innerHTML = '';

    this.agents.forEach(agent => {
      const card = document.createElement('div');
      card.className = `agent-card ${this.selectedAgent?.id === agent.id ? 'selected' : ''}`;
      card.dataset.agentId = agent.id;

      card.innerHTML = `
        <div class="agent-avatar-badge" style="background-color: ${agent.avatar.shirtColor}">
          <span>${agent.avatar.accessory || '🤖'}</span>
        </div>
        <div class="agent-info">
          <div class="agent-name">${agent.name}</div>
          <div class="agent-role-pill">${agent.role}</div>
          <div class="agent-stats-bar">
            <span>⚡ ${agent.stats.speed} SPD</span>
            <span>🎨 ${agent.stats.creativity} CRT</span>
            <span>🔥 ${agent.stats.chaos} CHS</span>
          </div>
        </div>
        <div class="agent-status-badge status-${agent.status}">${agent.status.toUpperCase()}</div>
      `;

      card.addEventListener('click', () => {
        sound.playClick();
        this.selectAgent(agent);
      });

      container.appendChild(card);
    });
  }

  renderTaskHistory() {
    const container = document.getElementById('task-history-list');
    if (!container) return;
    const completed = this.taskSystem.getCompletedTasks();

    if (completed.length === 0) {
      container.innerHTML = `<div class="empty-state">No completed tasks yet. Assign a task to an agent to see real results!</div>`;
      return;
    }

    container.innerHTML = '';
    completed.forEach(task => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const timeStr = new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      item.innerHTML = `
        <div class="history-header">
          <span class="history-title">${task.title}</span>
          <span class="history-time">${timeStr}</span>
        </div>
        <div class="history-meta">
          <span>🤖 ${task.agentName}</span>
          <span class="reward-pill">+${task.reward} Tokens</span>
        </div>
        <button class="btn btn-secondary btn-sm history-view-btn">Inspect & Play Result 🚀</button>
      `;

      item.querySelector('.history-view-btn').addEventListener('click', () => {
        sound.playClick();
        this.openResultModal(task);
      });

      container.appendChild(item);
    });
  }

  onTaskCompleted(task) {
    this.renderTaskHistory();
    this.renderAgentRoster();
    this.updateHUD();
    this.showNotification(`Task Finished! (+${task.reward} 🪙)`, `"${task.title}" was completed by ${task.agentName}`);
    
    // Automatically prompt to view result
    this.openResultModal(task);
  }

  showNotification(title, text) {
    const toast = document.getElementById('game-toast');
    if (!toast) return;

    toast.querySelector('.toast-title').textContent = title;
    toast.querySelector('.toast-body').textContent = text;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 5000);
  }

  // --- Modals Management ---

  openTaskModal(prefillPreset = null) {
    const modal = document.getElementById('modal-task-assign');
    if (!modal) return;

    // Agent dropdown
    const select = document.getElementById('task-agent-select');
    select.innerHTML = '';
    this.agents.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.name} (${a.role})`;
      if (this.selectedAgent && this.selectedAgent.id === a.id) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    // Render Preset chips
    const presetsContainer = document.getElementById('task-presets-container');
    presetsContainer.innerHTML = '';
    CONFIG.TASK_PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `<strong>${preset.title}</strong><span>🪙 +${preset.tokensReward} Tokens</span>`;
      chip.addEventListener('click', () => {
        sound.playClick();
        document.getElementById('task-title-input').value = preset.title;
        document.getElementById('task-prompt-input').value = preset.prompt;
        // Suggest matching agent
        const matchAgent = this.agents.find(a => a.specialty === preset.recommendedAgent);
        if (matchAgent) {
          select.value = matchAgent.id;
        }
      });
      presetsContainer.appendChild(chip);
    });

    if (prefillPreset) {
      document.getElementById('task-title-input').value = prefillPreset.title;
      document.getElementById('task-prompt-input').value = prefillPreset.prompt;
    } else if (!document.getElementById('task-prompt-input').value) {
      // Default to first preset
      const p = CONFIG.TASK_PRESETS[0];
      document.getElementById('task-title-input').value = p.title;
      document.getElementById('task-prompt-input').value = p.prompt;
    }

    modal.classList.add('active');
  }

  openResultModal(task) {
    const modal = document.getElementById('modal-result-viewer');
    if (!modal) return;
    this.activeTaskResult = task;

    document.getElementById('result-task-title').textContent = task.title;
    document.getElementById('result-agent-name').textContent = `${task.agentName} (${task.agentRole})`;
    document.getElementById('result-model-badge').textContent = task.result.model || CONFIG.DEFAULT_MODEL;

    const noticeEl = document.getElementById('result-notice-banner');
    if (task.result.notice) {
      noticeEl.textContent = task.result.notice;
      noticeEl.style.display = 'block';
    } else {
      noticeEl.style.display = 'none';
    }

    // Extract HTML code for sandbox iframe
    const rawContent = task.result.content || '';
    const playableCode = llmService.extractPlayableCode(rawContent);

    const tabSandboxBtn = document.getElementById('tab-btn-sandbox');
    const tabMarkdownBtn = document.getElementById('tab-btn-markdown');
    const tabCodeBtn = document.getElementById('tab-btn-code');

    const viewSandbox = document.getElementById('view-sandbox');
    const viewMarkdown = document.getElementById('view-markdown');
    const viewCode = document.getElementById('view-code');

    // Fill markdown & code views
    viewMarkdown.innerHTML = this.renderMarkdown(rawContent);
    document.getElementById('code-output-text').textContent = rawContent;

    // Fill sandboxed iframe
    const sandboxIframe = document.getElementById('sandbox-iframe');
    if (playableCode) {
      tabSandboxBtn.style.display = 'inline-flex';
      sandboxIframe.srcdoc = playableCode;
      this.switchResultTab('sandbox');
    } else {
      tabSandboxBtn.style.display = 'none';
      sandboxIframe.srcdoc = '';
      this.switchResultTab('markdown');
    }

    modal.classList.add('active');
  }

  switchResultTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.result-view-panel').forEach(p => p.classList.remove('active'));

    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    const activePanel = document.getElementById(`view-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');
  }

  renderMarkdown(md) {
    // Clean, lightweight markdown renderer with headers, tables, bold, lists, and code blocks
    let html = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold / Italics
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');

    // Code blocks
    html = html.replace(/```([\w]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    // Paragraphs
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
  }

  openUpgradesModal() {
    const modal = document.getElementById('modal-upgrades');
    if (!modal) return;
    const container = document.getElementById('upgrades-list-container');
    container.innerHTML = '';

    this.upgrades.forEach(up => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      const isMax = up.level >= up.maxLevel;

      card.innerHTML = `
        <div class="upgrade-icon">${up.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-title">${up.name} (Lv. ${up.level}/${up.maxLevel})</div>
          <div class="upgrade-desc">${up.description}</div>
        </div>
        <button class="btn ${isMax ? 'btn-disabled' : 'btn-primary'} btn-buy-upgrade" ${isMax || this.tokens < up.cost ? 'disabled' : ''}>
          ${isMax ? 'MAXED' : `🪙 ${up.cost}`}
        </button>
      `;

      card.querySelector('.btn-buy-upgrade').addEventListener('click', () => {
        if (this.tokens >= up.cost && up.level < up.maxLevel) {
          sound.playTaskComplete();
          this.tokens -= up.cost;
          up.level++;
          up.cost = Math.floor(up.cost * 1.5);
          this.saveState();
          this.updateHUD();
          this.openUpgradesModal();
          this.showNotification('Upgrade Purchased! ⚡', `${up.name} upgraded to Level ${up.level}`);
        }
      });

      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  openHireModal() {
    const modal = document.getElementById('modal-hire');
    if (!modal) return;
    const container = document.getElementById('hire-candidates-container');
    container.innerHTML = '';

    if (this.hireableCandidates.length === 0) {
      container.innerHTML = `<div class="empty-state">All talent pool candidates have been hired! Your office is operating at maximum capacity.</div>`;
      modal.classList.add('active');
      return;
    }

    this.hireableCandidates.forEach((cand, idx) => {
      const card = document.createElement('div');
      card.className = 'candidate-card';
      const canAfford = this.tokens >= cand.cost;

      card.innerHTML = `
        <div class="agent-avatar-badge" style="background-color: ${cand.avatar.shirtColor}">
          <span>${cand.avatar.accessory}</span>
        </div>
        <div class="candidate-info">
          <div class="candidate-name">${cand.name}</div>
          <div class="agent-role-pill">${cand.role}</div>
          <div class="candidate-tagline">"${cand.tagline}"</div>
          <div class="candidate-stats">
            <span>⚡ ${cand.stats.speed} SPD</span>
            <span>🎨 ${cand.stats.creativity} CRT</span>
            <span>🔥 ${cand.stats.chaos} CHS</span>
          </div>
        </div>
        <button class="btn ${canAfford ? 'btn-success' : 'btn-disabled'} btn-hire" ${!canAfford ? 'disabled' : ''}>
          Hire (🪙 ${cand.cost})
        </button>
      `;

      card.querySelector('.btn-hire').addEventListener('click', () => {
        if (this.tokens >= cand.cost) {
          sound.playTaskComplete();
          this.tokens -= cand.cost;
          
          // Assign next open desk
          const deskIdx = this.agents.length + 1;
          cand.deskId = `desk_${deskIdx}`;
          cand.x = CONFIG.WAYPOINTS.hall_center.x;
          cand.y = CONFIG.WAYPOINTS.hall_center.y;

          this.agents.push(cand);
          this.hireableCandidates.splice(idx, 1);

          this.canvasEngine.setAgents(this.agents);
          this.renderAgentRoster();
          this.updateHUD();
          this.saveState();
          modal.classList.remove('active');

          this.showNotification('🎉 New Agent Hired!', `${cand.name} joined the office!`);
          this.canvasEngine.showSpeech(cand.id, "Reporting for duty! Where's the terminal?", 5, '👋');
        }
      });

      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  openSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (!modal) return;

    const apiKeyInput = document.getElementById('gemini-api-key-input');
    const modelSelect = document.getElementById('gemini-model-select');

    apiKeyInput.value = llmService.getApiKey();

    modelSelect.innerHTML = '';
    CONFIG.SUPPORTED_MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      if (m.id === llmService.primaryModel) {
        opt.selected = true;
      }
      modelSelect.appendChild(opt);
    });

    modal.classList.add('active');
  }

  // Decor Shop Modal
  openDecorModal() {
    const modal = document.getElementById('modal-decor');
    if (!modal) return;
    const container = document.getElementById('decor-list-container');
    container.innerHTML = '';

    this.decorShop.forEach(item => {
      const isOwned = this.purchasedDecor.includes(item.id);
      const canAfford = this.tokens >= item.cost;
      const card = document.createElement('div');
      card.className = 'upgrade-card';

      card.innerHTML = `
        <div class="upgrade-icon">${item.icon}</div>
        <div class="upgrade-info">
          <div class="upgrade-title">${item.name}</div>
          <div class="upgrade-desc">${item.description}</div>
        </div>
        <button class="btn ${isOwned ? 'btn-disabled' : canAfford ? 'btn-primary' : 'btn-disabled'} btn-buy-decor" ${isOwned || !canAfford ? 'disabled' : ''}>
          ${isOwned ? 'INSTALLED ✅' : `🪙 ${item.cost}`}
        </button>
      `;

      card.querySelector('.btn-buy-decor').addEventListener('click', () => {
        if (!isOwned && this.tokens >= item.cost) {
          sound.playTaskComplete();
          this.tokens -= item.cost;
          this.purchasedDecor.push(item.id);
          this.canvasEngine.setPurchasedDecor(this.purchasedDecor);
          this.saveState();
          this.updateHUD();
          this.openDecorModal();
          this.showNotification('🎉 Office Upgraded!', `${item.name} is now live on the office floor!`);
        }
      });

      container.appendChild(card);
    });

    modal.classList.add('active');
  }

  // Custom Agent Creator Studio
  openAgentCreatorModal() {
    const modal = document.getElementById('modal-agent-creator');
    if (!modal) return;
    modal.classList.add('active');
  }

  // Collaborative Multi-Agent Task Modal
  openCollabModal() {
    const modal = document.getElementById('modal-collab-task');
    if (!modal) return;

    // Populate Lead and Co-Creator selects
    const leadSelect = document.getElementById('collab-lead-select');
    const coSelect = document.getElementById('collab-co-select');
    leadSelect.innerHTML = '';
    coSelect.innerHTML = '';

    this.agents.forEach((a, i) => {
      const opt1 = document.createElement('option');
      opt1.value = a.id;
      opt1.textContent = `${a.name} (${a.role})`;
      if (i === 0) opt1.selected = true;
      leadSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = a.id;
      opt2.textContent = `${a.name} (${a.role})`;
      if (i === 1) opt2.selected = true;
      coSelect.appendChild(opt2);
    });

    // Populate Collab presets
    const presetContainer = document.getElementById('collab-presets-container');
    presetContainer.innerHTML = '';
    CONFIG.COLLAB_PRESETS.forEach(preset => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'preset-chip';
      chip.innerHTML = `<strong>${preset.title}</strong><span>🪙 +${preset.tokensReward} Tokens</span>`;
      chip.addEventListener('click', () => {
        sound.playClick();
        document.getElementById('collab-title-input').value = preset.title;
        document.getElementById('collab-prompt-input').value = preset.prompt;
      });
      presetContainer.appendChild(chip);
    });

    // Default prefill
    const def = CONFIG.COLLAB_PRESETS[0];
    document.getElementById('collab-title-input').value = def.title;
    document.getElementById('collab-prompt-input').value = def.prompt;

    modal.classList.add('active');
  }

  setupUIBindings() {
    // Audio toggle
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const isMuted = !sound.toggle();
        audioBtn.textContent = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
        audioBtn.classList.toggle('muted', isMuted);
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        sound.playClick();
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    document.querySelectorAll('.modal-card').forEach(card => {
      card.addEventListener('click', e => e.stopPropagation());
    });

    // Navigation Action Buttons
    document.getElementById('btn-assign-task')?.addEventListener('click', () => {
      sound.playClick();
      this.openTaskModal();
    });

    document.getElementById('btn-assign-selected')?.addEventListener('click', () => {
      sound.playClick();
      this.openTaskModal();
    });

    document.getElementById('btn-open-collab')?.addEventListener('click', () => {
      sound.playClick();
      this.openCollabModal();
    });

    document.getElementById('btn-open-creator')?.addEventListener('click', () => {
      sound.playClick();
      this.openAgentCreatorModal();
    });

    document.getElementById('btn-open-decor')?.addEventListener('click', () => {
      sound.playClick();
      this.openDecorModal();
    });

    document.getElementById('btn-open-hire')?.addEventListener('click', () => {
      sound.playClick();
      this.openHireModal();
    });

    document.getElementById('btn-open-upgrades')?.addEventListener('click', () => {
      sound.playClick();
      this.openUpgradesModal();
    });

    document.getElementById('btn-open-settings')?.addEventListener('click', () => {
      sound.playClick();
      this.openSettingsModal();
    });

    // Custom Agent Creator Form Submit
    document.getElementById('agent-creator-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('custom-name-input').value.trim();
      const role = document.getElementById('custom-role-input').value.trim();
      const tagline = document.getElementById('custom-tagline-input').value.trim();
      const accessory = document.getElementById('custom-accessory-select').value || '🤖';
      const shirtColor = document.getElementById('custom-shirt-color').value || '#8B5CF6';
      const hairColor = document.getElementById('custom-hair-color').value || '#1E293B';
      const speed = parseInt(document.getElementById('custom-speed-slider').value) || 85;
      const creativity = parseInt(document.getElementById('custom-creativity-slider').value) || 85;
      const chaos = parseInt(document.getElementById('custom-chaos-slider').value) || 50;

      if (!name || !role) return;

      const newAgent = {
        id: 'agent_custom_' + Date.now(),
        name,
        role,
        specialty: 'custom',
        tagline: tagline || 'Pushing the frontiers of synthetic cognition.',
        avatar: {
          color: shirtColor,
          shirtColor: shirtColor,
          hairColor: hairColor,
          accessory: accessory,
          type: 'custom'
        },
        deskId: `desk_${Math.min(8, this.agents.length + 1)}`,
        stats: {
          speed,
          creativity,
          chaos,
          energy: 100,
          maxEnergy: 100,
          coffeeLevel: 90
        },
        status: 'idle',
        dialogue: {
          idle: [
            `${tagline}`,
            "Running custom high-dimensional tensor matrices...",
            "Checking in on the digital office vibe."
          ],
          working: [
            "Overclocking neural latents at maximum clock speed!",
            "Synthesizing brilliant domain logic...",
            "Writing the future line by line."
          ],
          coffee: ["Optimizing caffeine throughput in real-time."],
          arguing: ["My custom heuristics prove this architecture is superior!"],
          inspiration: ["BREAKTHROUGH! Quantum convergence achieved!"]
        }
      };

      saveCustomAgent(newAgent);
      newAgent.x = CONFIG.WAYPOINTS.hall_center.x;
      newAgent.y = CONFIG.WAYPOINTS.hall_center.y;
      this.agents.push(newAgent);

      this.canvasEngine.setAgents(this.agents);
      this.renderAgentRoster();
      this.updateHUD();
      this.selectAgent(newAgent);

      document.getElementById('modal-agent-creator').classList.remove('active');
      sound.playCreationFanfare();
      this.showNotification('🎉 Agent Created!', `${newAgent.name} has joined the office!`);
      this.canvasEngine.showSpeech(newAgent.id, "Hello world! Ready to create something legendary!", 5, '✨');
    });

    // Collab Task Form Submit
    document.getElementById('collab-assignment-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const leadId = document.getElementById('collab-lead-select').value;
      const coId = document.getElementById('collab-co-select').value;
      const title = document.getElementById('collab-title-input').value.trim() || 'Co-op AI Hackathon';
      const prompt = document.getElementById('collab-prompt-input').value.trim();

      if (!prompt) return;

      const lead = this.agents.find(a => a.id === leadId);
      const co = this.agents.find(a => a.id === coId);
      if (!lead || !co) return;

      document.getElementById('modal-collab-task').classList.remove('active');
      this.taskSystem.assignCollabTask(lead, co, {
        title,
        prompt,
        tokensReward: 300
      });
      this.updateHUD();
      this.renderAgentRoster();
    });

    // Settings save button
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      sound.playClick();
      const apiKey = document.getElementById('gemini-api-key-input').value;
      const model = document.getElementById('gemini-model-select').value;
      llmService.setApiKey(apiKey);
      llmService.setModel(model);
      document.getElementById('modal-settings').classList.remove('active');
      this.showNotification('Settings Saved', apiKey ? 'Gemini 3.7 Flash API key active!' : 'Running in high-quality simulation fallback mode.');
    });

    // Task Assignment Form Submit
    document.getElementById('task-assignment-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      sound.playClick();

      const agentId = document.getElementById('task-agent-select').value;
      const title = document.getElementById('task-title-input').value.trim() || 'AI Directive';
      const prompt = document.getElementById('task-prompt-input').value.trim();

      if (!prompt) return;

      const agent = this.agents.find(a => a.id === agentId);
      if (!agent) return;

      document.getElementById('modal-task-assign').classList.remove('active');
      this.taskSystem.assignTask(agent, {
        title,
        prompt,
        tokensReward: 120
      });
      this.updateHUD();
      this.renderAgentRoster();
    });

    // Result Viewer Tab Switches
    document.getElementById('tab-btn-sandbox')?.addEventListener('click', () => {
      sound.playClick();
      this.switchResultTab('sandbox');
    });
    document.getElementById('tab-btn-markdown')?.addEventListener('click', () => {
      sound.playClick();
      this.switchResultTab('markdown');
    });
    document.getElementById('tab-btn-code')?.addEventListener('click', () => {
      sound.playClick();
      this.switchResultTab('code');
    });

    // Result Viewer Copy & Download Buttons
    document.getElementById('btn-copy-result')?.addEventListener('click', () => {
      sound.playClick();
      if (!this.activeTaskResult) return;
      navigator.clipboard.writeText(this.activeTaskResult.result.content);
      this.showNotification('Copied to Clipboard! 📋', 'Task output copied successfully.');
    });

    document.getElementById('btn-download-result')?.addEventListener('click', () => {
      sound.playClick();
      if (!this.activeTaskResult) return;
      const content = this.activeTaskResult.result.content;
      const isHTML = this.activeTaskResult.result.isHTML;
      const blob = new Blob([content], { type: isHTML ? 'text/html' : 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.activeTaskResult.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${isHTML ? 'html' : 'md'}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

// Instantiate and start app on DOM load
window.addEventListener('DOMContentLoaded', () => {
  const app = new AgentOfficeApp();
  app.init();
  window.agentOfficeApp = app; // For easy debugging
});
