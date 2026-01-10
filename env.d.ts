declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server Configuration
      NODE_ENV: 'development' | 'production' | 'test'

      // Feature Flags
      DEBUG_MODE?: 'true' | 'false'

      // Logging
      LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error'

      OLLAMA_BASE_URL: string
      GEMINI_API_KEY: string
      OPENAI_API_KEY: string
      PERPLEXITY_API_KEY: string
      X_API_KEY: string

      [key: string]: string | undefined
    }
  }
}
