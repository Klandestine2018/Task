const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class AITaskGenerator {
    constructor() {
        this.models = [
            'llama-3.3-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768'
        ];
    }

    buildLevelPrompt(level) {
        if (level <= 3) {
            // Self-care and grounding
            return `Generate ONE tiny self-care task for someone overwhelmed. Focus on body, breathing, or immediate surroundings.

Examples: "Take 3 deep breaths", "Drink water", "Hold keys for 10 seconds", "Close door gently", "Stretch fingers", "Look at something green"

Keep it: 5 words max. Include time in parentheses.`;
            
        } else if (level <= 6) {
            // Household and environment
            return `Generate ONE tiny household task. Something small in their immediate space.

Examples: "Put 1 dish away", "Move 1 shirt to hamper", "Wipe counter spot", "Straighten 1 pillow", "Put 1 thing in trash", "Move 1 book to shelf"

Keep it: 8 words max. Include time in parentheses.`;
            
        } else if (level <= 9) {
            // Outside world preparation
            return `Generate ONE tiny outside-world task. Building confidence for external responsibilities.

Examples: "Check wallet is in pocket", "Hold phone for 30 seconds", "Look at door handle", "Touch your keys", "Stand by front door", "Check mailbox area"

Keep it: 13 words max. Include time in parentheses.`;
            
        } else {
            // Master level - full responsibilities
            return `Generate ONE substantial but achievable task. Real-world responsibility.

Examples: "Start washing machine", "Make sandwich", "Sweep kitchen floor", "Fill dishwasher", "Make grocery list", "Set out trash"

Keep it: 20 words max. Include time in parentheses.`;
        }
    }

        // Update your generateTask method to set level:
    async generateTask(userContext = {}) {
        const level = userContext.level || 1;
        this.setCurrentLevel(level); // Store level for XP calculation
        
        const prompt = this.buildLevelPrompt(level);
        
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.models[1],
                    messages: [
                        {
                            role: 'system',
                            content: 'You give extremely short, direct answers. No explanations. Just action + time.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.6,
                    max_tokens: 20
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('AI Response level', level + ':', data.choices[0].message.content);
            
            return this.parseTaskResponse(data.choices[0].message.content);
            
        } catch (error) {
            console.error('AI Task Generation Error:', error);
            return this.getLevelFallbackTask(level);
        }
    }

    parseTaskResponse(response) {
        const timeMatch = response.match(/\(([^)]+)\)/);
        const timeEstimate = timeMatch ? timeMatch[1] : '1 min';

        let taskText = response.replace(/\s*\([^)]*\)\s*/g, '').trim();
        taskText = taskText.replace(/^["']|["']$/g, '');
        taskText = taskText.charAt(0).toUpperCase() + taskText.slice(1);
        
        const level = this.currentLevel || 1;

        return {
            text: taskText,
            time: timeEstimate,
            xp: level,
            source: 'ai'
        };
    }

    // Add this method to track current level:
    setCurrentLevel(level) {
        this.currentLevel = level;
    }

    getLevelFallbackTask(level) {
        const baseXp = level; // XP equals level
        
        if (level <= 3) {
            const tasks = [
                { text: "Take 3 deep breaths", time: "30 sec", xp: level, source: 'fallback' },
                { text: "Drink water", time: "30 sec", xp: level, source: 'fallback' },
                { text: "Hold keys 10 seconds", time: "10 sec", xp: level, source: 'fallback' },
                { text: "Close door gently", time: "10 sec", xp: level, source: 'fallback' },
                { text: "Stretch fingers", time: "30 sec", xp: level, source: 'fallback' }
            ];
            return tasks[Math.floor(Math.random() * tasks.length)];
            
        } else if (level <= 6) {
            const tasks = [
                { text: "Put 1 dish away", time: "1 min", xp: level, source: 'fallback' },
                { text: "Move 1 shirt to hamper", time: "1 min", xp: level, source: 'fallback' },
                { text: "Wipe counter spot", time: "1 min", xp: level, source: 'fallback' },
                { text: "Straighten 1 pillow", time: "30 sec", xp: level, source: 'fallback' },
                { text: "Put 1 thing in trash", time: "30 sec", xp: level, source: 'fallback' }
            ];
            return tasks[Math.floor(Math.random() * tasks.length)];
            
        } else if (level <= 9) {
            const tasks = [
                { text: "Check wallet in pocket", time: "30 sec", xp: level, source: 'fallback' },
                { text: "Hold phone 30 seconds", time: "30 sec", xp: level, source: 'fallback' },
                { text: "Look at door handle", time: "10 sec", xp: level, source: 'fallback' },
                { text: "Touch your keys", time: "10 sec", xp: level, source: 'fallback' },
                { text: "Stand by front door", time: "30 sec", xp: level, source: 'fallback' }
            ];
            return tasks[Math.floor(Math.random() * tasks.length)];
            
        } else {
            const tasks = [
                { text: "Start washing machine", time: "2 min", xp: level, source: 'fallback' },
                { text: "Make sandwich", time: "2 min", xp: level, source: 'fallback' },
                { text: "Sweep kitchen floor", time: "2 min", xp: level, source: 'fallback' },
                { text: "Fill dishwasher", time: "2 min", xp: level, source: 'fallback' },
                { text: "Make grocery list", time: "2 min", xp: level, source: 'fallback' }
            ];
            return tasks[Math.floor(Math.random() * tasks.length)];
        }
    }
}

export const aiTaskGenerator = new AITaskGenerator();