// Agent Office - Game Configuration & Waypoints

export const CONFIG = {
  CANVAS: {
    WIDTH: 1200,
    HEIGHT: 750,
    TILE_SIZE: 32,
  },
  DEFAULT_MODEL: 'gemini-3.7-flash',
  SUPPORTED_MODELS: [
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (Primary)' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' }
  ],
  STORAGE_KEYS: {
    API_KEY: 'agent_office_gemini_api_key',
    SELECTED_MODEL: 'agent_office_selected_model',
    COMPLETED_TASKS: 'agent_office_completed_tasks',
    GAME_STATE: 'agent_office_game_state_v1',
    CUSTOM_AGENTS: 'agent_office_custom_agents_v1',
    PURCHASED_DECOR: 'agent_office_purchased_decor_v1'
  },
  // Waypoint Network
  WAYPOINTS: {
    // Main corridors
    'hall_center': { x: 580, y: 380 },
    'hall_left': { x: 260, y: 380 },
    'hall_right': { x: 880, y: 380 },
    'hall_north': { x: 580, y: 200 },
    'hall_south': { x: 580, y: 560 },

    // Station Approaches
    'coffee_approach': { x: 180, y: 190 },
    'snack_approach': { x: 110, y: 190 },
    'watercooler_approach': { x: 330, y: 190 },
    'whiteboard_approach': { x: 580, y: 140 },
    'whiteboard_left': { x: 520, y: 140 },
    'whiteboard_right': { x: 640, y: 140 },
    'server_approach': { x: 980, y: 160 },
    'lounge_approach': { x: 1020, y: 540 },
    'plants_approach': { x: 920, y: 560 },

    // Fun & Decor Stations
    'arcade_approach': { x: 1100, y: 320 },
    'pingpong_left': { x: 520, y: 480 },
    'pingpong_right': { x: 640, y: 480 },

    // Desk Approaches (Pod 1 - West)
    'desk_1_approach': { x: 220, y: 460 },
    'desk_2_approach': { x: 360, y: 460 },
    'desk_3_approach': { x: 220, y: 600 },
    'desk_4_approach': { x: 360, y: 600 },

    // Desk Approaches (Pod 2 - East)
    'desk_5_approach': { x: 740, y: 460 },
    'desk_6_approach': { x: 880, y: 460 },
    'desk_7_approach': { x: 740, y: 600 },
    'desk_8_approach': { x: 880, y: 600 },
  },

  // Physical Stations
  STATIONS: {
    COFFEE: { id: 'coffee', name: 'Turbo Espresso Bar', x: 180, y: 130, approach: 'coffee_approach', type: 'break', icon: '☕' },
    SNACKS: { id: 'snacks', name: 'Snack Vending Machine', x: 90, y: 130, approach: 'snack_approach', type: 'break', icon: '🍫' },
    WATERCOOLER: { id: 'watercooler', name: 'Watercooler Gossip Hub', x: 330, y: 130, approach: 'watercooler_approach', type: 'social', icon: '💧' },
    WHITEBOARD: { id: 'whiteboard', name: 'Strategy Whiteboard', x: 580, y: 90, approach: 'whiteboard_approach', type: 'meeting', icon: '📊' },
    SERVER_RACK: { id: 'server', name: 'Cloud Server Stack', x: 1040, y: 130, approach: 'server_approach', type: 'tech', icon: '🖥️' },
    LOUNGE: { id: 'lounge', name: 'Relaxation Beanbags', x: 1020, y: 600, approach: 'lounge_approach', type: 'break', icon: '🛋️' },
    ARCADE: { id: 'arcade', name: 'Retro 8-Bit Arcade', x: 1100, y: 260, approach: 'arcade_approach', type: 'fun', icon: '🕹️' },
    PINGPONG: { id: 'pingpong', name: 'Championship Ping Pong', x: 580, y: 480, approach: 'pingpong_left', type: 'fun', icon: '🏓' },
    DISCO_BALL: { id: 'disco', name: 'Prismatic Disco Ball', x: 580, y: 40, approach: 'hall_north', type: 'decor', icon: '🪩' },
    
    // Work Desks
    DESK_1: { id: 'desk_1', name: 'Desk 1', x: 220, y: 420, approach: 'desk_1_approach', type: 'work', pod: 1 },
    DESK_2: { id: 'desk_2', name: 'Desk 2', x: 360, y: 420, approach: 'desk_2_approach', type: 'work', pod: 1 },
    DESK_3: { id: 'desk_3', name: 'Desk 3', x: 220, y: 560, approach: 'desk_3_approach', type: 'work', pod: 1 },
    DESK_4: { id: 'desk_4', name: 'Desk 4', x: 360, y: 560, approach: 'desk_4_approach', type: 'work', pod: 1 },
    DESK_5: { id: 'desk_5', name: 'Desk 5', x: 740, y: 420, approach: 'desk_5_approach', type: 'work', pod: 2 },
    DESK_6: { id: 'desk_6', name: 'Desk 6', x: 880, y: 420, approach: 'desk_6_approach', type: 'work', pod: 2 },
    DESK_7: { id: 'desk_7', name: 'Desk 7', x: 740, y: 560, approach: 'desk_7_approach', type: 'work', pod: 2 },
    DESK_8: { id: 'desk_8', name: 'Desk 8', x: 880, y: 560, approach: 'desk_8_approach', type: 'work', pod: 2 },
  },

  NAV_GRAPH: {
    'hall_center': ['hall_left', 'hall_right', 'hall_north', 'hall_south', 'whiteboard_approach', 'pingpong_left', 'pingpong_right'],
    'hall_left': ['hall_center', 'coffee_approach', 'snack_approach', 'watercooler_approach', 'desk_1_approach', 'desk_2_approach', 'desk_3_approach', 'desk_4_approach'],
    'hall_right': ['hall_center', 'server_approach', 'arcade_approach', 'lounge_approach', 'plants_approach', 'desk_5_approach', 'desk_6_approach', 'desk_7_approach', 'desk_8_approach'],
    'hall_north': ['hall_center', 'whiteboard_approach', 'whiteboard_left', 'whiteboard_right', 'coffee_approach', 'server_approach'],
    'hall_south': ['hall_center', 'desk_3_approach', 'desk_4_approach', 'desk_7_approach', 'desk_8_approach', 'lounge_approach', 'pingpong_left', 'pingpong_right'],

    'coffee_approach': ['hall_left', 'hall_north', 'snack_approach', 'watercooler_approach'],
    'snack_approach': ['coffee_approach', 'hall_left'],
    'watercooler_approach': ['coffee_approach', 'hall_left', 'whiteboard_approach'],
    'whiteboard_approach': ['hall_north', 'hall_center', 'whiteboard_left', 'whiteboard_right'],
    'whiteboard_left': ['whiteboard_approach', 'hall_north'],
    'whiteboard_right': ['whiteboard_approach', 'hall_north'],
    'server_approach': ['hall_north', 'hall_right'],
    'arcade_approach': ['hall_right', 'server_approach'],
    'pingpong_left': ['hall_center', 'hall_south', 'pingpong_right'],
    'pingpong_right': ['hall_center', 'hall_south', 'pingpong_left'],
    'lounge_approach': ['hall_right', 'hall_south', 'plants_approach'],
    'plants_approach': ['lounge_approach', 'hall_right'],

    'desk_1_approach': ['hall_left', 'desk_2_approach', 'desk_3_approach'],
    'desk_2_approach': ['hall_left', 'desk_1_approach', 'desk_4_approach'],
    'desk_3_approach': ['hall_left', 'hall_south', 'desk_1_approach', 'desk_4_approach'],
    'desk_4_approach': ['hall_left', 'hall_south', 'desk_2_approach', 'desk_3_approach'],

    'desk_5_approach': ['hall_right', 'desk_6_approach', 'desk_7_approach'],
    'desk_6_approach': ['hall_right', 'desk_5_approach', 'desk_8_approach'],
    'desk_7_approach': ['hall_right', 'hall_south', 'desk_5_approach', 'desk_8_approach'],
    'desk_8_approach': ['hall_right', 'hall_south', 'desk_6_approach', 'desk_7_approach', 'lounge_approach'],
  },

  COLLAB_PRESETS: [
    {
      id: 'collab_fullstack_game',
      title: '🚀 Co-op Hackathon: Cyberpunk Space Trader Roguelike',
      category: 'collab_code',
      prompt: 'Collaboratively build a complete, single-file playable HTML5 Canvas game called "Cyberpunk Space Trader". Agent 1 provides rock-solid game mechanics (trading, ship upgrades, asteroid dodging, high score, sound FX), while Agent 2 authors immersive sci-fi lore, cyberpunk visual styling, and atmospheric narrative dialogue prompts.',
      leadRole: 'Lead Architect',
      coRole: 'Creative Director',
      tokensReward: 350
    },
    {
      id: 'collab_viral_launch',
      title: '🌟 Dual-Agent Viral Launch & Product Deck: "Neural Synth"',
      category: 'collab_launch',
      prompt: 'Develop an all-in-one product launch package for "Neural Synth" — an AI-powered sound synthesizer that converts human brainwaves into lo-fi beats. Includes executive vision pitch, technical audio DSP architecture breakdown, and a full 5-part launch thread with meme marketing copy.',
      leadRole: 'Product & Tech Lead',
      coRole: 'Growth & Brand Director',
      tokensReward: 280
    }
  ],

  DECOR_SHOP: [
    {
      id: 'arcade_cabinet',
      name: '🕹️ Neo-Geo Cyber Arcade Cabinet',
      cost: 250,
      description: 'Adds an interactive arcade cabinet to the office floor. Agents play retro games on break!',
      icon: '🕹️',
      stationId: 'ARCADE'
    },
    {
      id: 'pingpong_table',
      name: '🏓 Championship Ping Pong Table',
      cost: 400,
      description: 'Placed right in the center hall! Agents have thrilling 2-player rally matches when idle.',
      icon: '🏓',
      stationId: 'PINGPONG'
    },
    {
      id: 'disco_ball',
      name: '🪩 Prismatic Disco Mirror Ball',
      cost: 350,
      description: 'Hang from ceiling to unlock party mode with spinning sparkles and funky synth grooves!',
      icon: '🪩',
      stationId: 'DISCO_BALL'
    }
  ],

  TASK_PRESETS: [
    {
      id: 'mini_game_x_trends',
      title: '🎮 Playable HTML5 Mini-Game based on Top Trends',
      category: 'code',
      prompt: 'Create a fully playable, self-contained single-file HTML/CSS/JS mini-game themed around "Dodging Chaotic AI Prompts & Coffee Spills". It should have smooth controls (Arrow keys/WASD or Mouse), score counter, sound effects via Web Audio, game over state, and restart button.',
      recommendedAgent: 'coder',
      estimatedSeconds: 6,
      tokensReward: 150
    },
    {
      id: 'marketing_nausicaa_shoe',
      title: '👟 Marketing Concept for Nausicaä Skateboard Shoe',
      category: 'creative',
      prompt: 'Generate a creative, evocative marketing launch concept for a high-end streetwear skate shoe inspired by Hayao Miyazaki\'s Nausicaä of the Valley of the Wind (Toxic Jungle spores, glider aerodynamics, Ohmu armor texture, earthy moss/ceramic palette). Include shoe name, tagline, materials, hero commercial storyboard, and influencer collab pitch.',
      recommendedAgent: 'creative',
      estimatedSeconds: 4,
      tokensReward: 100
    },
    {
      id: 'funny_x_post',
      title: '🐦 Viral Tech Twitter / X Thread as this Agent',
      category: 'social',
      prompt: 'Write a hilarious 4-tweet viral thread about what happened in the AI office today from your unique character perspective. Include tech satire, ridiculous productivity metrics, and unexpected chaos.',
      recommendedAgent: 'trend',
      estimatedSeconds: 3,
      tokensReward: 80
    },
    {
      id: 'agent_personality_design',
      title: '🤖 Design a Brand New AI Agent Personality',
      category: 'design',
      prompt: 'Design a completely new, eccentric AI agent personality for Agent Office. Provide Name, Role, Backstory, Quirks, Signature Catchphrase, Stats (Speed, Creativity, Chaos Level 1-100), and 5 bespoke ambient dialogue lines for when they are coding, drinking coffee, or arguing.',
      recommendedAgent: 'chaotic',
      estimatedSeconds: 4,
      tokensReward: 120
    }
  ],

  UPGRADES: [
    {
      id: 'turbo_espresso',
      name: '☕ Turbo Espresso Bar MK-II',
      cost: 300,
      description: 'Increases agent energy recovery speed by 40%.',
      level: 0,
      maxLevel: 3,
      icon: '☕'
    },
    {
      id: 'rgb_keyboards',
      name: '⌨️ 8000Hz Mechanical Keyboards',
      cost: 450,
      description: 'Agents complete coding tasks 25% faster with snappy clicky vibes.',
      level: 0,
      maxLevel: 3,
      icon: '⌨️'
    },
    {
      id: 'snack_restock',
      name: '🍕 Premium Brain Fuel Bar',
      cost: 600,
      description: 'Reduces burnout and spontaneous office arguments by 50%.',
      level: 0,
      maxLevel: 2,
      icon: '🍕'
    },
    {
      id: 'quantum_server',
      name: '⚡ Local Neural Inference Cluster',
      cost: 1000,
      description: 'Boosts task quality and token generation rewards by +50%.',
      level: 0,
      maxLevel: 2,
      icon: '⚡'
    }
  ]
};
