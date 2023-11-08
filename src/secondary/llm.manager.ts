import { Injectable } from '@nestjs/common';
import { environment } from '@src/common';
import { ChatOpenAI } from 'langchain/chat_models/openai';

@Injectable()
export class LlmManager {
  private llm = new ChatOpenAI({
    openAIApiKey: environment.openai.api.key,
    modelName: 'gpt-4-1106-preview',
    temperature: 0.1,
  });

  async predict<T extends object>(prompt: string) {
    const res = await this.llm.predict(prompt);
    try {
      return JSON.parse(res) as T;
    } catch (err) {
      if (res.startsWith('###Response')) {
        return JSON.parse(res.split('###Response')[1] ?? '');
      }

      if (res.startsWith('```json')) {
        return JSON.parse(res.split('```json')[1]?.split('```')[0] ?? '');
      }

      console.log(res);

      return JSON.parse(res + '}');
    }
  }
}
