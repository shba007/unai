import { anthropic, google, groq, ollama, openAI, perplexity, x } from '../models'
import type { DetailedMessage, DistilledDetailedMessage, DistilledParams, Params } from '../types'
import zodToJsonSchema from 'zod-to-json-schema'
import formatJSONSchema from '../utils/format-json-schema'

type TextGenerateOllamaModel =
  | '@Ollama/Meta/llama3.2:1b'
  | '@Ollama/Meta/llama3.2:3b'
  | '@Ollama/Meta/llama3.2-vision'
  | '@Ollama/Meta/llama3.2-vision:90b'
  | '@Ollama/Meta/llama3.3'
  | '@Ollama/Meta/artifish/llama3.2-uncensored:latest'
type TextGenerateGoogleModel =
  | '@Google/gemini-1.5-flash-8b'
  | '@Google/gemini-1.5-flash'
  | '@Google/gemini-1.5-pro'
  | '@Google/gemini-2.0-flash-lite'
  | '@Google/gemini-2.0-flash'
  | '@Google/gemini-2.5-flash-preview-04-17'
  | '@Google/gemini-2.5-pro-exp-03-25'
  | '@Google/gemini-2.5-pro-preview-05-06'
type TextGenerateOpenAIModel =
  | '@OpenAI/gpt-3.5-turbo:instruct'
  | '@OpenAI/gpt-3.5-turbo:1106'
  | '@OpenAI/gpt-3.5-turbo:0125'
  | '@OpenAI/gpt-3.5-turbo:latest'
  | '@OpenAI/gpt-4:0314'
  | '@OpenAI/gpt-4:0613'
  | '@OpenAI/gpt-4:latest'
  | '@OpenAI/gpt-4-turbo:1106-preview'
  | '@OpenAI/gpt-4-turbo:0125-preview'
  | '@OpenAI/gpt-4-turbo:preview'
  | '@OpenAI/gpt-4-turbo:2024-04-09'
  | '@OpenAI/gpt-4-turbo:latest'
  | '@OpenAI/gpt-4.1:latest'
  | '@OpenAI/gpt-4o-mini:2024-07-18'
  | '@OpenAI/gpt-4o-mini:latest'
  | '@OpenAI/gpt-4o:2024-05-13'
  | '@OpenAI/gpt-4o:2024-08-06'
  | '@OpenAI/gpt-4o:2024-11-20'
  | '@OpenAI/gpt-4o:latest'
  | '@OpenAI/o1-mini:2024-09-12'
  | '@OpenAI/o1-mini:latest'
  | '@OpenAI/o1-preview:2024-09-12'
  | '@OpenAI/o1-preview:latest'
  | '@OpenAI/o1:2024-12-17'
  | '@OpenAI/o1:latest'
  | '@OpenAI/o3-mini:2025-01-31'
  | '@OpenAI/o3-mini:latest'
  | '@OpenAI/o3:latest'
  | '@OpenAI/o4-mini:latest'
type TextGeneratePerplexityModel =
  | '@Perplexity/llama-3.1-sonar-small-128k-online'
  | '@Perplexity/llama-3.1-sonar-large-128k-online'
  | '@Perplexity/llama-3.1-sonar-huge-128k-online'
  | '@Perplexity/sonar'
  | '@Perplexity/sonar-pro'
  | '@Perplexity/sonar-reasoning'
  | '@Perplexity/sonar-reasoning-pro'
type TextGenerateAnthropicModel = '@Anthropic/claude-3-haiku:20240307'
type TextGenerateXModel = '@X/grok-2:1212' | '@X/grok-2:latest' | '@X/grok-2-vision:1212' | '@X/grok-2-vision:latest'
type TextGenerateGroqModel = '@Groq/llama3-70b-8192'

export type TextGenerateModel =
  TextGenerateOllamaModel | TextGenerateGoogleModel | TextGenerateOpenAIModel | TextGeneratePerplexityModel | TextGenerateAnthropicModel | TextGenerateXModel | TextGenerateGroqModel

export async function textGenerate<T = string>(model: TextGenerateModel, params: Params, debugCallback?: (body: object) => void) {
  let result:
    | Promise<{
        content:
          | string
          | ReadableStream<{
              delta: string
              total: string
            }>
      }>
    | undefined = undefined

  params.messages =
    'prompt' in params
      ? ([{ role: 'user', content: { text: params.prompt, images: [], audios: [] } }] as DetailedMessage[])
      : params.messages.map<DetailedMessage>(({ role, content }) =>
          typeof content === 'string'
            ? {
                role,
                content: { text: content, images: [], audios: [] },
              }
            : { role, content }
        )

  const distilledParams: DistilledParams = {
    stream: params.stream ?? false,
    messages: params.messages as DistilledDetailedMessage[],
    format: params.format ? zodToJsonSchema(params.format as Zod.AnyZodObject) : undefined,
    tools: params.tools ?? [],
  }

  // consola({ distilledParams: distilledParams.messages[0].content })

  if (distilledParams.messages.length <= 0) throw new Error('Messages should at least be one')

  switch (model) {
    case '@Ollama/Meta/llama3.2:1b':
    case '@Ollama/Meta/llama3.2:3b':
    case '@Ollama/Meta/llama3.2-vision':
    case '@Ollama/Meta/llama3.2-vision:90b':
    case '@Ollama/Meta/llama3.3':
    case '@Ollama/Meta/artifish/llama3.2-uncensored:latest': {
      distilledParams.format = formatJSONSchema('Ollama', distilledParams.format)
      result = ollama.ollama(model.split('/').slice(2).join('/'), distilledParams, debugCallback)
      break
    }
    case '@Google/gemini-1.5-flash-8b':
    case '@Google/gemini-1.5-flash':
    case '@Google/gemini-1.5-pro':
    case '@Google/gemini-2.0-flash-lite':
    case '@Google/gemini-2.0-flash':
    case '@Google/gemini-2.5-flash-preview-04-17':
    case '@Google/gemini-2.5-pro-exp-03-25':
    case '@Google/gemini-2.5-pro-preview-05-06': {
      distilledParams.format = formatJSONSchema('Google', distilledParams.format)
      result = google.google(model.split('/').slice(-1).join('/'), distilledParams, debugCallback)
      break
    }
    case '@OpenAI/gpt-3.5-turbo:instruct':
    case '@OpenAI/gpt-3.5-turbo:1106':
    case '@OpenAI/gpt-3.5-turbo:0125':
    case '@OpenAI/gpt-3.5-turbo:latest':
    case '@OpenAI/gpt-4:0314':
    case '@OpenAI/gpt-4:0613':
    case '@OpenAI/gpt-4:latest':
    case '@OpenAI/gpt-4-turbo:1106-preview':
    case '@OpenAI/gpt-4-turbo:0125-preview':
    case '@OpenAI/gpt-4-turbo:preview':
    case '@OpenAI/gpt-4-turbo:2024-04-09':
    case '@OpenAI/gpt-4-turbo:latest':
    case '@OpenAI/gpt-4.1:latest':
    case '@OpenAI/gpt-4o-mini:2024-07-18':
    case '@OpenAI/gpt-4o-mini:latest':
    case '@OpenAI/gpt-4o:2024-05-13':
    case '@OpenAI/gpt-4o:2024-08-06':
    case '@OpenAI/gpt-4o:2024-11-20':
    case '@OpenAI/gpt-4o:latest':
    case '@OpenAI/o1-mini:2024-09-12':
    case '@OpenAI/o1-mini:latest':
    case '@OpenAI/o1-preview:2024-09-12':
    case '@OpenAI/o1-preview:latest':
    case '@OpenAI/o1:2024-12-17':
    case '@OpenAI/o1:latest':
    case '@OpenAI/o3-mini:2025-01-31':
    case '@OpenAI/o3-mini:latest':
    case '@OpenAI/o3:latest':
    case '@OpenAI/o4-mini:latest': {
      distilledParams.format = formatJSONSchema('OpenAI', distilledParams.format)
      const modelName = model.split('/').slice(1).join('/').replace(':latest', '').replace(':', '-')
      result = openAI.text(modelName, distilledParams, debugCallback)
      break
    }
    case '@Perplexity/llama-3.1-sonar-small-128k-online':
    case '@Perplexity/llama-3.1-sonar-large-128k-online':
    case '@Perplexity/llama-3.1-sonar-huge-128k-online':
    case '@Perplexity/sonar':
    case '@Perplexity/sonar-pro':
    case '@Perplexity/sonar-reasoning':
    case '@Perplexity/sonar-reasoning-pro': {
      // distilledParams.format = formatJSONSchema('OpenAI', distilledParams.format)
      result = perplexity.perplexity(model.split('/').slice(1).join('/'), distilledParams, debugCallback)
      break
    }
    case '@Anthropic/claude-3-haiku:20240307': {
      distilledParams.format = formatJSONSchema('OpenAI', distilledParams.format)
      const modelName = model.split('/').slice(1).join('/').replace(':latest', '').replace(':', '-')
      result = anthropic.anthropic(modelName, distilledParams, debugCallback)
      break
    }
    case '@X/grok-2:1212':
    case '@X/grok-2:latest':
    case '@X/grok-2-vision:1212':
    case '@X/grok-2-vision:latest': {
      distilledParams.format = formatJSONSchema('OpenAI', distilledParams.format)
      const modelName = model.split('/').slice(1).join('/').replace(':latest', '').replace(':', '-')
      result = x.text(modelName, distilledParams, debugCallback)
      break
    }
    case '@Groq/llama3-70b-8192': {
      distilledParams.format = formatJSONSchema('OpenAI', distilledParams.format)
      const modelName = model.split('/').slice(1).join('/').replace(':latest', '').replace(':', '-')
      result = groq.text(modelName, distilledParams, debugCallback)
      break
    }
    default: {
      throw new Error('Enter a valid model name')
    }
  }

  if (!result) throw new Error('result is undefined')

  const finalResult = await result
  const content = (params.format && !(finalResult.content instanceof ReadableStream) ? JSON.parse(finalResult.content) : finalResult.content) as T

  return finalResult.content instanceof ReadableStream
    ? ({
        content,
      } as {
        content: ReadableStream<{
          delta: string
          total: string
        }>
      })
    : ({
        content,
      } as { content: T })
}
