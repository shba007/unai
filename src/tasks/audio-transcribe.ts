import { openAI } from '../models'
import { DistilledParams, Params } from '../types'

type AudioTranscribeOpenAIModel = '@OpenAI/whisper-v2'

export type AudioTranscribeModel = AudioTranscribeOpenAIModel

export async function audioTranscribe(model: AudioTranscribeModel, params: Params, debugCallback?: (body: object) => void) {
  let result: Promise<{ content: string }> | undefined = undefined
  switch (model) {
    case '@OpenAI/whisper-v2': {
      const modelName = model.split('/').slice(1).join('/').replace(':latest', '').replace(':', '-')
      const modelMap = {
        'whisper-v2': 'whisper-1',
      } as const

      result = openAI.audio(modelMap[modelName as 'whisper-v2'], params as DistilledParams, debugCallback)
      break
    }
    default: {
      throw new Error('Enter a valid model name')
    }
  }

  const finalResult = await result

  return { content: finalResult.content }
}
