import OpenAI from "openai";

// Lazy-loaded OpenAI client to avoid build-time initialization
let _openai: OpenAI | null = null;

// Get OpenAI client instance (creates on first call)
export const getOpenAI = (): OpenAI => {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }
  return _openai;
};

// Legacy export for backward compatibility (deprecated - use getOpenAI instead)
export const openai = new Proxy({} as OpenAI, {
  get: (target, prop) => {
    return getOpenAI()[prop as keyof OpenAI];
  },
});
