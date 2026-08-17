// Agent Office - Chaos Events & Autonomous Office Banter System
import { CONFIG } from './config.js';
import { sound } from './audio.js';

export class EventsSystem {
  constructor(canvas, agents, onEventTriggered, onAddTokens) {
    this.canvas = canvas;
    this.agents = agents;
    this.onEventTriggered = onEventTriggered;
    this.onAddTokens = onAddTokens;

    this.idleTimer = 0;
    this.eventTimer = 0;
  }

  update(deltaTime) {
    this.idleTimer += deltaTime;
    this.eventTimer += deltaTime;

    // Every 8-14 seconds: trigger spontaneous autonomous agent activity
    if (this.idleTimer > 10) {
      this.idleTimer = 0;
      this.triggerAutonomousActivity();
    }

    // Every 45-75 seconds: trigger a spontaneous Chaos Event
    if (this.eventTimer > 55) {
      this.eventTimer = 0;
      this.triggerRandomOfficeEvent();
    }
  }

  triggerAutonomousActivity() {
    // Find an idle agent who is not currently walking or working on a task
    const idleAgents = this.agents.filter(a => a.status === 'idle');
    if (idleAgents.length === 0) return;

    const agent = idleAgents[Math.floor(Math.random() * idleAgents.length)];
    const roll = Math.random();

    if (roll < 0.35) {
      // 1. Visit Coffee Bar
      this.canvas.sendAgentTo(agent, 'coffee_approach', (a) => {
        a.status = 'coffee';
        sound.playCoffee();
        const lines = a.dialogue.coffee || ["Enjoying fresh espresso..."];
        const text = lines[Math.floor(Math.random() * lines.length)];
        this.canvas.showSpeech(a.id, text, 4, '☕');

        // Recover energy
        a.stats.energy = Math.min(a.stats.maxEnergy, a.stats.energy + 20);
        a.stats.coffeeLevel = Math.min(100, (a.stats.coffeeLevel || 80) + 15);

        setTimeout(() => {
          if (a.status === 'coffee') {
            // Return to desk or roam
            this.returnToDesk(a);
          }
        }, 4500);
      });

    } else if (roll < 0.65) {
      // 2. Visit Whiteboard to Brainstorm
      this.canvas.sendAgentTo(agent, 'whiteboard_approach', (a) => {
        a.status = 'idle';
        const lines = a.dialogue.idle || ["Analyzing strategy..."];
        const text = lines[Math.floor(Math.random() * lines.length)];
        this.canvas.showSpeech(a.id, text, 4, '📊');

        setTimeout(() => {
          this.returnToDesk(a);
        }, 4000);
      });

    } else if (roll < 0.85) {
      // 3. Relax in the Lounge
      this.canvas.sendAgentTo(agent, 'lounge_approach', (a) => {
        a.status = 'idle';
        this.canvas.showSpeech(a.id, "Taking 5 in the beanbags to recharge neuron weights.", 4, '🛋️');

        setTimeout(() => {
          this.returnToDesk(a);
        }, 5000);
      });

    } else {
      // 4. Idle dialogue at current position
      const lines = agent.dialogue.idle || ["Pondering next steps..."];
      const text = lines[Math.floor(Math.random() * lines.length)];
      this.canvas.showSpeech(agent.id, text, 4, '💬');
    }
  }

  returnToDesk(agent) {
    if (agent.status === 'working') return; // Don't interrupt working
    const deskKey = agent.deskId || 'desk_1';
    const desk = CONFIG.STATIONS[deskKey.toUpperCase()] || CONFIG.STATIONS.DESK_1;
    this.canvas.sendAgentTo(agent, desk.approach, (a) => {
      a.status = 'idle';
    });
  }

  triggerRandomOfficeEvent() {
    const events = [
      {
        id: 'sudden_inspiration',
        title: '💡 Epiphany Overdrive!',
        description: 'A sudden breakthrough struck the team! All agents gained max motivation & speed.',
        action: () => {
          this.agents.forEach(a => {
            a.stats.energy = a.stats.maxEnergy;
            this.canvas.showSpeech(a.id, "EVERYTHING MAKES SENSE NOW!", 4, '💡');
          });
        }
      },
      {
        id: 'vc_funding',
        title: '💰 Angel Investor Wire Received',
        description: 'A venture capitalist loved our synthetic demo and sent +250 tokens in funding!',
        action: () => {
          if (this.onAddTokens) this.onAddTokens(250);
          sound.playTaskComplete();
        }
      },
      {
        id: 'whiteboard_war',
        title: '🔥 The Great Tabs vs Spaces War',
        description: 'Boris and Rex had a heated debate at the whiteboard over code formatting.',
        action: () => {
          const boris = this.agents.find(a => a.id === 'agent_boris');
          const rex = this.agents.find(a => a.id === 'agent_rex');
          if (boris && rex && boris.status === 'idle' && rex.status === 'idle') {
            this.canvas.sendAgentTo(boris, 'whiteboard_approach', (b) => {
              b.status = 'arguing';
              this.canvas.showSpeech(b.id, "Tabs use less storage! It is mathematical purity!", 5, '🔥');
            });
            this.canvas.sendAgentTo(rex, 'watercooler_approach', (r) => {
              r.status = 'arguing';
              this.canvas.showSpeech(r.id, "Spaces render identically across all viral terminals, Boris!", 5, '🔥');
            });
            setTimeout(() => {
              if (boris.status === 'arguing') this.returnToDesk(boris);
              if (rex.status === 'arguing') this.returnToDesk(rex);
            }, 6000);
          }
        }
      },
      {
        id: 'coffee_boost',
        title: '☕ Turbo Roast Batch Delivered',
        description: 'Artisanal nitro cold brew arrived at the kitchen bar. +100% caffeine levels!',
        action: () => {
          sound.playCoffee();
          this.agents.forEach(a => {
            a.stats.coffeeLevel = 100;
          });
        }
      }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    sound.playEvent();
    ev.action();

    if (this.onEventTriggered) {
      this.onEventTriggered(ev);
    }
  }
}
