import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const prompt = `You are an AI traffic management system analyzing real-time traffic data. 
    
Current traffic conditions:
- Congestion Score: ${data.congestion_score} (HIGH - above 80)
- North Queue: ${data.north_queue} vehicles
- South Queue: ${data.south_queue} vehicles  
- East Queue: ${data.east_queue} vehicles
- West Queue: ${data.west_queue} vehicles
- Current Phase: ${data.current_phase}

Generate a concise, actionable insight (1-2 sentences) that suggests specific traffic management actions to reduce congestion. Focus on practical recommendations like signal timing adjustments, phase extensions, or priority routing.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 100,
    })

    return NextResponse.json({ insight: text })
  } catch (error) {
    console.error("Error generating AI insight:", error)
    return NextResponse.json({ error: "Failed to generate insight" }, { status: 500 })
  }
}
