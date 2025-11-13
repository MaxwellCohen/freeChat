import { createFileRoute } from '@tanstack/react-router'
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

import { convertToModelMessages, streamText } from 'ai'


const SYSTEM_PROMPT = `You are a helpful assistant.`



const openRouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
            console.log()
          const { messages, model } = await request.json();
        
        
        const updatedMessages = convertToModelMessages(messages)
        console.log('updatedMessages',  JSON.stringify(updatedMessages, null, 2)    )
        console.log('model', model)
          const result = streamText({
            model: openRouter.chat(model),
            system: 'You are a helpful assistant. return data in markdown format.',
            messages: updatedMessages,
            providerOptions: {
                reasoning: {enabled: false},
            },
            onStepFinish: (usage) => {
                console.log('usage', usage)
            }
          })
          result.usage
          return result.toUIMessageStreamResponse()
        } catch (error) {
          console.error('Chat API error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to process chat request' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
