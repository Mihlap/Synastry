import { GigaChatProvider } from "../dist/providers/gigachat.provider.js";

const provider = new GigaChatProvider();

try {
  const text = await provider.complete(
    [
      {
        role: "system",
        content: "Ответь строго валидным JSON без markdown.",
      },
      {
        role: "user",
        content: 'Верни JSON: {"ok":true}',
      },
    ],
    { temperature: 0.1 },
  );

  JSON.parse(text.trim().replace(/^```json\s*/i, "").replace(/```$/u, ""));
  console.log(`GigaChat connection OK, response length: ${text.length}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`GigaChat connection failed: ${message}`);
  process.exit(1);
}
