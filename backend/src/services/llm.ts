import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY as string
let client: GoogleGenerativeAI | null = null

function getClient() {
  if (!client) client = new GoogleGenerativeAI(apiKey)
  return client
}

export async function generateReply(prompt: string) {
  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  if (!prompt || prompt.trim().length < 2) {
    return { text: 'Please provide more details.', promptTokens: 0, completionTokens: 0 }
  }
  const res = await model.generateContent(prompt)
  const text = res.response.text()
  const usage = res.response.usageMetadata
  return {
    text,
    promptTokens: usage?.promptTokenCount ?? 0,
    completionTokens: usage?.candidatesTokenCount ?? 0,
  }
}


