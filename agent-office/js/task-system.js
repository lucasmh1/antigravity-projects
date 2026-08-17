// Agent Office - Task Manager & Result Archive System
import { CONFIG } from './config.js';
import { sound } from './audio.js';
import { llmService } from './llm-service.js';

export class TaskSystem {
  constructor(officeCanvas, onTaskCompleted, onTokenReward) {
    this.canvas = officeCanvas;
    this.onTaskCompleted = onTaskCompleted;
    this.onTokenReward = onTokenReward;

    this.activeTasks = [];
    this.completedTasks = this.loadCompletedTasks();
  }

  loadCompletedTasks() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.COMPLETED_TASKS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load completed tasks from storage:', e);
      return [];
    }
  }

  saveCompletedTasks() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.COMPLETED_TASKS, JSON.stringify(this.completedTasks));
    } catch (e) {
      console.error('Failed to save completed tasks to storage:', e);
    }
  }

  getCompletedTasks() {
    return this.completedTasks;
  }

  clearCompletedTasks() {
    this.completedTasks = [];
    this.saveCompletedTasks();
  }

  // Assign task to agent
  async assignTask(agent, taskData) {
    const taskId = 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const task = {
      id: taskId,
      title: taskData.title || 'Custom AI Directive',
      prompt: taskData.prompt,
      category: taskData.category || 'general',
      agentId: agent.id,
      agentName: agent.name,
      agentRole: agent.role,
      assignedAt: Date.now(),
      status: 'in_progress',
      reward: taskData.tokensReward || 100
    };

    this.activeTasks.push(task);

    // 1. Send agent to their assigned work desk
    const deskKey = agent.deskId || 'desk_1';
    const deskConfig = CONFIG.STATIONS[deskKey.toUpperCase()] || CONFIG.STATIONS.DESK_1;
    const approachWp = deskConfig.approach;

    this.canvas.showSpeech(agent.id, "On it! Heading to my battle station...", 3, '🚀');

    this.canvas.sendAgentTo(agent, approachWp, async () => {
      // 2. Agent arrived at desk -> start working
      agent.status = 'working';
      agent.facing = 1;

      // Pick working dialogue line
      const workLines = agent.dialogue.working || ["Executing neural pass..."];
      const line = workLines[Math.floor(Math.random() * workLines.length)];
      this.canvas.showSpeech(agent.id, line, 5, '💻');

      // 3. Trigger LLM generation
      try {
        const result = await llmService.generateTaskResult(agent, task.prompt, task.category);
        
        // 4. Task completed successfully!
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;

        // Archive and persist in localStorage
        this.completedTasks.unshift(task);
        if (this.completedTasks.length > 50) this.completedTasks.pop(); // keep last 50
        this.saveCompletedTasks();

        // Remove from active
        this.activeTasks = this.activeTasks.filter(t => t.id !== taskId);

        // Sound fanfare & dialogue
        sound.playTaskComplete();
        agent.status = 'inspiration';
        this.canvas.showSpeech(agent.id, "Boom! Task completed with flying colors!", 5, '✨');

        // Reward tokens & trigger callback
        if (this.onTokenReward) {
          this.onTokenReward(task.reward);
        }
        if (this.onTaskCompleted) {
          this.onTaskCompleted(task);
        }

        // Return to idle after a few seconds
        setTimeout(() => {
          if (agent.status === 'inspiration') {
            agent.status = 'idle';
          }
        }, 5000);

      } catch (err) {
        console.error('Task execution error:', err);
        task.status = 'failed';
        task.error = err.message;
        agent.status = 'idle';
        this.canvas.showSpeech(agent.id, `Error: ${err.message}`, 4, '⚠️');
      }
    });

    return task;
  }

  // Multi-Agent Collaborative Task Assignment
  async assignCollabTask(agentLead, agentCo, taskData) {
    const taskId = 'collab_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const task = {
      id: taskId,
      title: taskData.title || 'Collaborative AI Hackathon',
      prompt: taskData.prompt,
      category: taskData.category || 'collab',
      isCollab: true,
      agentId: agentLead.id,
      agentName: `${agentLead.name.split(' ')[0]} & ${agentCo.name.split(' ')[0]}`,
      leadName: agentLead.name,
      coName: agentCo.name,
      agentRole: `${agentLead.role} & ${agentCo.role}`,
      assignedAt: Date.now(),
      status: 'in_progress',
      reward: taskData.tokensReward || 300
    };

    this.activeTasks.push(task);
    sound.playCollabChime();

    // 1. Send both agents to the strategy whiteboard
    this.canvas.showSpeech(agentLead.id, `Collab session with ${agentCo.name.split(' ')[0]} starting!`, 3, '🤝');
    this.canvas.showSpeech(agentCo.id, `Syncing neural context models...`, 3, '💡');

    this.canvas.sendAgentTo(agentLead, 'whiteboard_left', () => {
      agentLead.status = 'working';
      agentLead.facing = 1;
    });

    this.canvas.sendAgentTo(agentCo, 'whiteboard_right', async () => {
      agentCo.status = 'working';
      agentCo.facing = -1;

      sound.playMarkerSqueak();
      this.canvas.showSpeech(agentLead.id, "Architecting the core engine loops...", 4, '📊');
      this.canvas.showSpeech(agentCo.id, "Designing the aesthetics & narrative...", 4, '🎨');

      // 2. Generate Collab Task Result
      try {
        const result = await llmService.generateCollabTaskResult(agentLead, agentCo, task.prompt, task.category);
        
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;

        this.completedTasks.unshift(task);
        if (this.completedTasks.length > 50) this.completedTasks.pop();
        this.saveCompletedTasks();

        this.activeTasks = this.activeTasks.filter(t => t.id !== taskId);

        sound.playCollabChime();
        sound.playTaskComplete();

        agentLead.status = 'inspiration';
        agentCo.status = 'inspiration';
        this.canvas.showSpeech(agentLead.id, "Joint hackathon shipped! Flawless synergy!", 5, '🚀');
        this.canvas.showSpeech(agentCo.id, "A true collaborative masterpiece!", 5, '✨');

        if (this.onTokenReward) this.onTokenReward(task.reward);
        if (this.onTaskCompleted) this.onTaskCompleted(task);

        setTimeout(() => {
          if (agentLead.status === 'inspiration') agentLead.status = 'idle';
          if (agentCo.status === 'inspiration') agentCo.status = 'idle';
        }, 5000);

      } catch (err) {
        console.error('Collab error:', err);
        task.status = 'failed';
        agentLead.status = 'idle';
        agentCo.status = 'idle';
      }
    });

    return task;
  }
}
