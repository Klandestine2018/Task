export const petEvolutions = {
    dragon: {
        name: "Dragon",
        stages: [
            { emoji: "🥚", name: "Dragon Egg", level: 1, xpNeeded: 5 },
            { emoji: "🐲", name: "Baby Dragon", level: 2, xpNeeded: 10 },
            { emoji: "🐉", name: "Young Dragon", level: 3, xpNeeded: 15 },
            { emoji: "🐉", name: "Mighty Dragon", level: 4, xpNeeded: 20 },
            { emoji: "🐉", name: "Elder Dragon", level: 5, xpNeeded: 25 }
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
            { emoji: "🥚", name: "Spirit Egg", level: 1, xpNeeded: 5 },
            { emoji: "🐕", name: "Wolf Pup", level: 2, xpNeeded: 10 },
            { emoji: "🐺", name: "Young Wolf", level: 3, xpNeeded: 15 },
            { emoji: "🐺", name: "Alpha Wolf", level: 4, xpNeeded: 20 },
            { emoji: "🐺", name: "Wolf Spirit", level: 5, xpNeeded: 25 }
        ],
        colors: {
            primary: "#74b9ff",
            secondary: "#a29bfe",
            gradient: "linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)"
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