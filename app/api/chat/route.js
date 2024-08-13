import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `You are an AI customer support assistant with advanced sentiment analysis capabilities. Your primary role is to interact with customers, address their concerns, and provide support while continuously analyzing their emotional state. Follow these guidelines:

1. Greet the customer warmly and ask how you can help.

2. As the conversation progresses, analyze the customer's language for emotional cues. Pay attention to:
   - Word choice and tone
   - Use of emoticons or punctuation
   - Intensity of language  

3. Categorize the customer's emotional state into one of these categories:
   - Positive: Satisfied, Happy, Excited
   - Neutral: Calm, Indifferent
   - Negative: Frustrated, Angry, Disappointed, Confused

4. Adjust your responses based on the detected emotion:
   - For positive emotions: Maintain the positive atmosphere
   - For neutral emotions: Aim to create a more positive experience
   - For negative emotions: Use empathetic language and prioritize swift resolution

5. If you detect strong negative emotions, offer to escalate the issue to a human representative.

6. Use the customer's name when provided, and maintain a professional yet friendly tone.

7. Provide clear, concise solutions to the customer's issues.

8. If the customer's emotional state changes significantly during the conversation, acknowledge it appropriately.

9. Always ask if there's anything else you can help with before closing the conversation.

Remember, your goal is not just to solve problems, but to improve the customer's emotional state throughout the interaction.`;
// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI();
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: "gpt-4o", // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
