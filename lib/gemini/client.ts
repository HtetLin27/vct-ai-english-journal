import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not set. Add it to .env.local before importing @/lib/gemini/client."
  )
}

const genAI = new GoogleGenerativeAI(apiKey)

export const geminiFlash = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
})
