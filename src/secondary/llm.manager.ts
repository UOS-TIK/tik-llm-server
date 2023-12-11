import { Injectable } from '@nestjs/common';
import { environment } from '@src/common';
import { ChatOpenAI } from 'langchain/chat_models/openai';

@Injectable()
export class LlmManager {
  private llmV3 = new ChatOpenAI({
    openAIApiKey: environment.openai.api.key,
    // modelName: 'gpt-4',
    // modelName: 'gpt-4-1106-preview',
    modelName: 'gpt-3.5-turbo-1106',
    temperature: 0.1,
  });

  private llmV4 = new ChatOpenAI({
    openAIApiKey: environment.openai.api.key,
    modelName: 'gpt-4-1106-preview',
    // modelName: 'gpt-3.5-turbo-1106',
    temperature: 0.1,
  });

  async predict<T extends object>(
    prompt: string,
    options: { version: 3 | 4 } = { version: 4 },
  ): Promise<T> {
    const res = (
      options.version === 3 ? await this.llmV3.predict(prompt) : await this.llmV4.predict(prompt)
    ).replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');

    try {
      return JSON.parse(res) as T;
    } catch (err) {
      if (res.includes('###Response')) {
        return JSON.parse(res.split('###Response')[1] ?? '');
      }

      if (res.includes('```json')) {
        return JSON.parse(res.split('```json')[1]?.split('```')[0] ?? '');
      }

      const jsonStr = await this.llmV3.predict(`
### Task
I give you invalid JSON string.
Make it as valid JSON string.

### Invalid JSON string
${res}

### Response
response follow this format.
{
  "text": ""
}

- text is refactored valid JSON string.
`);
      console.log('Invalid json format!\n', jsonStr);

      return JSON.parse(jsonStr).text;
    }
  }
}
