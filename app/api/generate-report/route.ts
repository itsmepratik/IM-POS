import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { reportType } = await req.json()

  const prompt = `Generate a detailed ${reportType} report for a small business. Include an executive summary, key metrics, trend analysis, and recommendations. The report should be informative and actionable.`

  const result = streamText({
    model: openai("gpt-4-turbo"),
    messages: [{ role: "user", content: prompt }],
  })

  return result.toDataStreamResponse()
}

