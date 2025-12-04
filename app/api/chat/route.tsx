import { NextRequest, NextResponse } from "next/server";
import { openai, generateFallbackResponse } from "@/shared/OpenAiModel";

export async function POST(request: NextRequest) {
  try {
    const { messages, doctorPrompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages are required and must be an array" }, { status: 400 });
    }

    const appKnowledge = `
    
    APP KNOWLEDGE BASE:
    - You are the "AI Healthsphere" assistant.
    - USAGE: Users can start a voice consultation by clicking "Start Call". You will ask for their name, age, and symptoms.
    - HISTORY: Users can view their past consultations in the "History" section of the dashboard.
    - REPORTS: After a consultation, a medical report is generated. Users can view and download these reports as PDFs from the "History" section or immediately after the call.
    - NAVIGATION: The app has a Dashboard (home), History page, and Profile settings.
    - If a user asks "how to use", explain the "Start Call" button and the consultation process.
    - If a user asks "where is my report", direct them to the History page.
    `;

    const systemMessage = {
      role: "system",
      content: (doctorPrompt || "You are a helpful AI medical assistant. Provide concise, accurate medical information.") + appKnowledge + " Remember that you are not a replacement for professional medical advice, diagnosis, or treatment."
    };

    const apiMessages = [
      systemMessage,
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 500
      });


      const assistantResponse = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

      return NextResponse.json({
        content: assistantResponse
      });
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);


      const fallbackResponse = generateFallbackResponse("I'm having trouble understanding your request.");
      return NextResponse.json({
        content: fallbackResponse
      });
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 });
  }
}