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

    async generateTask(userContext = {}) {
        const prompt = this.buildPrompt(userContext);
        
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.models[0], // Use most reliable model
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a supportive mental health assistant that creates tiny, achievable tasks for people struggling with daily life. Each task should take 30 seconds to 2 minutes maximum. Be gentle, encouraging, and realistic about what someone can do when overwhelmed.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 150
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const taskText = data.choices[0].message.content.trim();
            
            // Parse the response to extract task and time estimate
            return this.parseTaskResponse(taskText);
            
        } catch (error) {
            console.error('AI Task Generation Error:', error);
            // Fallback to simple tasks if AI fails
            return this.getFallbackTask();
        }
    }

    buildPrompt(userContext) {
        const basePrompt = `Generate ONE tiny, achievable task for someone who is struggling with daily life. 
        The task should take 30 seconds to 2 minutes maximum.
        
        Requirements:
        - Extremely simple and specific
        - No complex steps
        - Something that can be done immediately
        - Gentle and non-overwhelming
        - Include time estimate (10 sec, 30 sec, 1 min, 2 min)
        
        Examples of good tasks:
        - "Take one sip of water" (10 sec)
        - "Put one dish in the sink" (30 sec)
        - "Take three deep breaths" (1 min)
        - "Look out the window for 30 seconds" (1 min)
        
        Generate something similar but different.`;
        
        if (userContext.petType) {
            return basePrompt + ` The person has a ${userContext.petType} companion, so make it feel supportive and encouraging.`;
        }
        
        return basePrompt;
    }

    parseTaskResponse(response) {
        // Try to extract time estimate from response
        const timeMatch = response.match(/\((\d+\s*(sec|min|minute|second)s?)\)/i);
        const timeEstimate = timeMatch ? timeMatch[1] : '1 min';
        
        // Remove time estimate from task text
        let taskText = response.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        // Clean up the task text
        taskText = taskText.replace(/^[-•]\s*/, ''); // Remove bullet points
        taskText = taskText.charAt(0).toUpperCase() + taskText.slice(1); // Capitalize first letter
        
        return {
            text: taskText,
            time: timeEstimate,
            xp: 1,
            source: 'ai'
        };
    }

    getFallbackTask() {
        const fallbackTasks = [
            { text: "Take one sip of water", time: "10 sec", xp: 1, source: 'fallback' },
            { text: "Put one item back where it belongs", time: "1 min", xp: 1, source: 'fallback' },
            { text: "Take three deep breaths", time: "1 min", xp: 1, source: 'fallback' },
            { text: "Look at something beautiful", time: "30 sec", xp: 1, source: 'fallback' },
            { text: "Stretch your arms once", time: "30 sec", xp: 1, source: 'fallback' }
        ];
        
        return fallbackTasks[Math.floor(Math.random() * fallbackTasks.length)];
    }
}

export const aiTaskGenerator = new AITaskGenerator();