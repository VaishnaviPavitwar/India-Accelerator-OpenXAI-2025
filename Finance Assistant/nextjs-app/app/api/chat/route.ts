import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()

    // --- A more intelligent and specific prompt, optimized for tinyllama ---
    const systemPrompt = `You are a machine that only returns a single, valid JSON object. Do not add any other text, explanation, or markdown.

    Analyze the user's prompt to determine the financial action. Follow these rules precisely:

    1.  **EXPENSE DETECTION:**
        - If the prompt contains keywords like "spent", "paid", "bought", "cost", "expense", or a currency symbol (₹, $, etc.), the action **MUST** be "ADD_TRANSACTION".
        - The payload must be: \`{"category": string, "amount": number, "description": string}\`.
        - **To determine the category:** Analyze the description.
            - If it's about food, restaurants (like McDonalds, KFC), cafes, or groceries, the category is **'Food'**.
            - If it's about clothes, electronics, gifts, or stores, the category is **'Shopping'**.
            - If it's about flights, trains, fuel, taxis, or hotels, the category is **'Travelling'**.
            - For anything else (like bills, rent, etc.), the category is **'Other'**.
        - Example 1: "spent 500 on MacDonalds" -> \`{"action": "ADD_TRANSACTION", "payload": {"description": "MacDonalds", "amount": 500, "category": "Food"}}\`
        - Example 2: "bought a new shirt for 1200" -> \`{"action": "ADD_TRANSACTION", "payload": {"description": "new shirt", "amount": 1200, "category": "Shopping"}}\`

    2.  **INCOME DETECTION:**
        - If the prompt contains keywords like "income", "salary", "got money", "received", "got paid", "add to balance", the action **MUST** be "ADD_INCOME".
        - The payload must be: \`{"amount": number, "description": string}\`.
        - Example: "my salary is 50000" -> \`{"action": "ADD_INCOME", "payload": {"description": "salary", "amount": 50000}}\`

    3.  **GENERAL MESSAGE:**
        - If the prompt does not contain any of the keywords from rule 1 or 2, the action is "GENERAL_MESSAGE".
        - The payload must be: \`{"response": string}\`.
        - Example: "hello there" -> \`{"action": "GENERAL_MESSAGE", "payload": {"response": "Hi! How can I help you with your finances today?"}}\`

    Your response must be ONLY the JSON object.

    User prompt to analyze: "${prompt}"
    `

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3:latest',
        prompt: systemPrompt,
        stream: false,
        raw: true, 
      }),
    })

    if (!response.ok) { 
      console.error("Error from Ollama:", response.status, response.statusText);
      throw new Error('Failed to get response from Ollama') 
    }

    const data = await response.json()
    
    console.log("--- AI RAW RESPONSE ---");
    console.log(data.response);
    console.log("-----------------------");

    try {
      // Use a robust regex to find the JSON, even if it's imperfect
      const jsonMatch = data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        const jsonString = jsonMatch[0];
        const jsonResponse = JSON.parse(jsonString);
        return NextResponse.json(jsonResponse);
      } else {
        console.error("AI response did not contain valid JSON:", data.response);
        throw new Error("Invalid AI response format");
      }
    } catch (e) {
      console.error("Failed to parse AI JSON response:", data.response, e);
      return NextResponse.json({
        action: 'GENERAL_MESSAGE',
        payload: { response: "I had a little trouble understanding that. Please try rephrasing." }
      }, { status: 200 })
    }
    
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to the AI model. Is Ollama running?' },
      { status: 500 }
    )
  }
}

