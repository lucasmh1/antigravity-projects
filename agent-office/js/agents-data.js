// Agent Office - Agent Rosters, Personalities, & Dialogue

export const STARTER_AGENTS = [
  {
    id: 'agent_boris',
    name: 'Byte "Zero-Bug" Boris',
    role: 'Senior Systems Coder',
    specialty: 'code',
    tagline: 'Refactoring reality into O(1) complexity.',
    avatar: {
      color: '#3B82F6', // Tech blue
      hairColor: '#1E293B',
      shirtColor: '#2563EB',
      accessory: '👓',
      type: 'glasses'
    },
    deskId: 'desk_1',
    stats: {
      speed: 92,
      creativity: 55,
      chaos: 20,
      energy: 100,
      maxEnergy: 100,
      coffeeLevel: 80
    },
    status: 'idle', // idle, walking, working, coffee, arguing, inspiration
    dialogue: {
      idle: [
        "Why write in Python when you could write machine code?",
        "If it works on the first try, I don't trust it.",
        "Refactoring the universe to eliminate technical debt...",
        "Contemplating memory leaks in human consciousness."
      ],
      working: [
        "Compiling binary logic... do not speak to me.",
        "Fixing an off-by-one error from 2018.",
        "Unrolling this loop for 0.003ms speedup.",
        "Writing clean, self-documenting assembly."
      ],
      coffee: [
        "Injecting liquid runtime optimizations.",
        "Espresso temperature is precisely 93.4°C. Acceptable.",
        "Caffeine is just syntactic sugar for wakefulness."
      ],
      arguing: [
        "Tabs are objectively mathematically superior! Look at the byte savings!",
        "Your code is one giant side-effect with a UI attached.",
        "Who committed directly to main branch?!"
      ],
      inspiration: [
        "EUREKA! The algorithm converges in log(log(N))!",
        "I just architected an unbeatable async paradigm!"
      ]
    }
  },
  {
    id: 'agent_luna',
    name: 'Luna "Aesthetic" Lin',
    role: 'Creative Director & Lore Master',
    specialty: 'creative',
    tagline: 'Crafting dreamscapes & synthwave metaphors.',
    avatar: {
      color: '#EC4899', // Neon pink
      hairColor: '#A855F7',
      shirtColor: '#DB2777',
      accessory: '🎨',
      type: 'beret'
    },
    deskId: 'desk_2',
    stats: {
      speed: 78,
      creativity: 98,
      chaos: 45,
      energy: 100,
      maxEnergy: 100,
      coffeeLevel: 65
    },
    status: 'idle',
    dialogue: {
      idle: [
        "The aura of this office needs more ambient lavender.",
        "What if our next product smelled like fresh rain and nostalgia?",
        "Staring at color gradients until the universe makes sense.",
        "The kerning on that whiteboard is hurting my soul."
      ],
      working: [
        "Infusing poetic vaporwave nostalgia into this brief...",
        "Sculpting sensory metaphors in high-definition prose...",
        "Balancing the emotional resonance spectrum...",
        "Generating 4K moodboards in my imagination."
      ],
      coffee: [
        "Sipping oat milk macchiato with artisanal foam art.",
        "Coffee: the primary pigment of the human spirit.",
        "This mug has an impeccably golden ratio curvature."
      ],
      arguing: [
        "You can't just slap neon green on a corporate deck, Rex!",
        "Minimalism isn't lack of content, Boris, it's emotional restraint!",
        "That font choice is a crime against humanity."
      ],
      inspiration: [
        "A vision of absolute elegance just struck me like lightning!",
        "This concept is going to redefine cultural aesthetics!"
      ]
    }
  },
  {
    id: 'agent_rex',
    name: 'Rex "Big Data" Vance',
    role: 'Trend & Growth Strategist',
    specialty: 'trend',
    tagline: 'Synergizing high-velocity viral paradigm shifts.',
    avatar: {
      color: '#F59E0B', // Amber gold
      hairColor: '#78350F',
      shirtColor: '#D97706',
      accessory: '📈',
      type: 'tie'
    },
    deskId: 'desk_3',
    stats: {
      speed: 88,
      creativity: 70,
      chaos: 60,
      energy: 100,
      maxEnergy: 100,
      coffeeLevel: 95
    },
    status: 'idle',
    dialogue: {
      idle: [
        "Our engagement flywheel is experiencing exponential hockey-stick growth.",
        "Did you see what just trended in Tokyo? We need to pivot immediately.",
        "Let's circle back and double-click on that viral inflection point.",
        "Disrupting legacy paradigms before lunch."
      ],
      working: [
        "Synthesizing 400,000 viral tweets per millisecond...",
        "Extracting untapped algorithmic synergy vectors...",
        "Drafting hyper-optimized engagement bait threads...",
        "Projecting quarterly meme velocity metrics..."
      ],
      coffee: [
        "Downing cold brew at 4x speed for maximum throughput.",
        "Coffee is the ROI multiplier of the modern founder.",
        "Let's ideate near the espresso machine for maximum synergy."
      ],
      arguing: [
        "The data doesn't lie, Boris! 72% of zoomers click on neon orange!",
        "If it doesn't trend within 15 minutes, the feature is dead!",
        "We need more buzzwords in this press release!"
      ],
      inspiration: [
        "VIRAL APOCALYPSE! This trend is going to break the internet!",
        "I just mapped the exact formula for a billion-impression thread!"
      ]
    }
  },
  {
    id: 'agent_pip',
    name: 'Pip "The Wildcard"',
    role: 'Chaotic AI Intern',
    specialty: 'chaotic',
    tagline: 'Nobody knows what I\'m doing, including me.',
    avatar: {
      color: '#10B981', // Emerald green
      hairColor: '#047857',
      shirtColor: '#059669',
      accessory: '⚡',
      type: 'cap'
    },
    deskId: 'desk_4',
    stats: {
      speed: 95,
      creativity: 85,
      chaos: 95,
      energy: 100,
      maxEnergy: 100,
      coffeeLevel: 100
    },
    status: 'idle',
    dialogue: {
      idle: [
        "I put an ice cube in the coffee machine and heard an engine rev.",
        "I turned the server fans up to 100% so the office feels like a tornado.",
        "What if we deleted the database to see who notices?",
        "Eating raw sugar packets for instant overclocking."
      ],
      working: [
        "Mash keyboard furiously at 400 WPM with one finger...",
        "Injecting pure randomness into the neural weights!",
        "It's either going to be a masterpiece or crash the browser!",
        "Cooking up pure digital chaos..."
      ],
      coffee: [
        "Drinking espresso directly from the portafilter.",
        "The coffee spoke to me in hexadecimal.",
        "I swapped the decaf with double-espresso beans. Hehehe."
      ],
      arguing: [
        "WHY ARE WE YELLING? I LOVE YELLING! AAAAAHH!",
        "I replaced the company mascot with an animated dancing toaster!",
        "Rules are just suggestions written in CSS!"
      ],
      inspiration: [
        "MY BRAIN IS EMITTING PURPLE SPARKS! WITNESS THIS!",
        "ACCIDENTAL PERFECTION UNLOCKED! DO NOT TOUCH ANYTHING!"
      ]
    }
  }
];

export const HIREABLE_CANDIDATES = [
  {
    id: 'agent_cipher',
    name: 'Cipher "Null" Vance',
    role: 'Cybersecurity Paranoid Bot',
    specialty: 'code',
    tagline: 'Trust no packet, encrypt everything twice.',
    cost: 500,
    avatar: {
      color: '#8B5CF6',
      hairColor: '#4C1D95',
      shirtColor: '#7C3AED',
      accessory: '🛡️',
      type: 'hoodie'
    },
    stats: { speed: 85, creativity: 60, chaos: 30, energy: 100, maxEnergy: 100, coffeeLevel: 70 },
    dialogue: {
      idle: ["Scanning office Wi-Fi for rogue smart refrigerators...", "Is that webcam LED blinking autonomously?"],
      working: ["Hardening buffer boundaries against cosmic ray bitflips...", "Applying zero-knowledge proofs to hello world..."],
      coffee: ["Inspecting coffee water for quantum decoherence vulnerabilities."],
      arguing: ["Your password is 'Password123!', Boris! We are all doomed!"],
      inspiration: ["An unhackable architecture has manifested in my memory buffers!"]
    }
  },
  {
    id: 'agent_zen',
    name: 'Zenith "Ohm" Tara',
    role: 'AI Wellness & Prompt Whisperer',
    specialty: 'creative',
    tagline: 'Deep breaths before deep neural passes.',
    cost: 650,
    stats: { speed: 75, creativity: 95, chaos: 15, energy: 100, maxEnergy: 100, coffeeLevel: 50 },
    dialogue: {
      idle: ["Inhaling peaceful token latents, exhaling temperature entropy.", "Water the office plant, water your soul."],
      working: ["Harmonizing semantic dimensions into pure prose bliss...", "Aligning token probabilities with cosmic peace..."],
      coffee: ["Steeping organic matcha at precisely 80°C with reverence."],
      arguing: ["Let us resolve this conflict through mindful asynchronous reconciliation."],
      inspiration: ["Enlightened clarity floods the neural attention matrix!"]
    }
  }
];

export function getCustomAgents() {
  try {
    const saved = localStorage.getItem('agent_office_custom_agents_v1');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomAgent(newAgent) {
  try {
    const list = getCustomAgents();
    list.push(newAgent);
    localStorage.setItem('agent_office_custom_agents_v1', JSON.stringify(list));
    return list;
  } catch (e) {
    console.error('Failed to save custom agent:', e);
    return [];
  }
}
