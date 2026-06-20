import { geminiFlash } from "../lib/gemini/client"

async function main() {
  const result = await geminiFlash.generateContent(
    "Say hello in one short sentence."
  )
  const text = result.response.text()
  console.log("Gemini responded:")
  console.log(text)
}

main().catch((err) => {
  console.error("Gemini test failed:", err)
  process.exit(1)
})
