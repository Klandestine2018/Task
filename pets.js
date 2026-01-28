export const petEvolutions = {
    dragon: {
        name: "Dragon",
        stages: [
            { emoji: "🥚", name: "Dragon Egg", level: 1, xpNeeded: 10 },
            { emoji: "🥚", name: "Hatchling Dragon", level: 2, xpNeeded: 25 },
            { emoji: "🐲", name: "Baby Dragon", level: 3, xpNeeded: 45 },
            { emoji: "🐲", name: "Young Dragon", level: 4, xpNeeded: 70 },
            { emoji: "🐲", name: "Young Dragon", level: 5, xpNeeded: 100 },
            { emoji: "🐲", name: "Young Dragon", level: 6, xpNeeded: 135 },
            { emoji: "🐉", name: "Mighty Dragon", level: 7, xpNeeded: 175 },
            { emoji: "🐉", name: "Mighty Dragon", level: 8, xpNeeded: 220 },
            { emoji: "🐉", name: "Mighty Dragon", level: 9, xpNeeded: 270 },
            { emoji: "🐉", name: "Elder Dragon", level: 10, xpNeeded: 325 }
            
        ],
        colors: {
            primary: "#ff6b6b",
            secondary: "#ffa502",
            gradient: "linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%)"
        }
    },
    wolf: {
        name: "Wolf",
        stages: [
            { emoji: "🥚", name: "Spirit Egg", level: 1, xpNeeded: 10 },
            { emoji: "🥚", name: "Spirit Wolf Egg", level: 2, xpNeeded: 25 },
            { emoji: "🐕", name: "Wolf Pup", level: 3, xpNeeded: 45 },
            { emoji: "🐕", name: "Wolf Pup", level: 4, xpNeeded: 70 },
            { emoji: "🐕", name: "Wolf Pup", level: 5, xpNeeded: 100 },
            { emoji: "🐕", name: "Wolf Pup", level: 6, xpNeeded: 135 },
            { emoji: "🐺", name: "Young Wolf", level: 7, xpNeeded: 175 },
            { emoji: "🐺", name: "Young Wolf", level: 8, xpNeeded: 220 },
            { emoji: "🐺", name: "Alpha Wolf", level: 9, xpNeeded: 270 },
            { emoji: "🐺", name: "Wolf Spirit", level: 10, xpNeeded: 325 }
            
        ],
        colors: {
            primary: "#74b9ff",
            secondary: "#a29bfe",
            gradient: "linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)"
        }
    },
    eagle: {
        name: "Eagle",
        stages: [
            { emoji: "🥚", name: "Egg", level: 1, xpNeeded: 10 },
            { emoji: "🥚", name: "Egg", level: 2, xpNeeded: 25 },
            { emoji: "🐣", name: "Hatchling", level: 3, xpNeeded: 45 },
            { emoji: "🐣", name: "Hatchling", level: 4, xpNeeded: 70 },
            { emoji: "🐥", name: "Chick", level: 5, xpNeeded: 100 },
            { emoji: "🐥", name: "Chick", level: 6, xpNeeded: 135 },
            { emoji: "🐥", name: "Chick", level: 7, xpNeeded: 175 },
            { emoji: "🐓", name: "Chicken", level: 8, xpNeeded: 220 },
            { emoji: "🐓", name: "Chicken", level: 9, xpNeeded: 270 },
            { emoji: "🦅", name: "Eagle", level: 10, xpNeeded: 325 }

        ],
        colors: {
            primary: "#FFBB00",
            secondary: "#7C0303",
            gradient: "linear-gradient(135deg, #ffBB00 0%, #7C0303 100%)"
        }
    }
};

export function getPetEvolution(petType, level) {
    const petData = petEvolutions[petType];
    if (!petData) return petEvolutions.dragon.stages[0];
    
    const stage = petData.stages[Math.min(level - 1, petData.stages.length - 1)];
    return { ...stage, colors: petData.colors };
}

export function getAllPetTypes() {
    return Object.keys(petEvolutions);
}