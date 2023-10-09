import { Injectable, OnModuleInit } from '@nestjs/common';
import { PineconeClient } from '@pinecone-database/pinecone';
import { data, environment, util } from '@src/common';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

@Injectable()
export class VectorStoreManager implements OnModuleInit {
  private pineconeStore!: PineconeStore;

  async onModuleInit() {
    // TODO: langchain docs 바뀌면 deprecated 대응
    const client = new PineconeClient();

    await client.init({
      apiKey: environment.pinecone.api.key,
      environment: environment.pinecone.environment.region,
    });

    this.pineconeStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
      pineconeIndex: client.Index(environment.pinecone.index.name),
    });
  }

  async similaritySearch(query: string) {
    return this.pineconeStore.similaritySearch(query);
  }

  async findCsTopicByKeywords<T extends keyof typeof data.csTopic>(
    keywords: T[],
  ): Promise<Record<T, string>> {
    const keywordMap = util.reduce(
      (acc, each) => {
        acc[each] = true;
        return acc;
      },
      {} as Record<keyof typeof data.csTopic, true>,
      keywords,
    );

    return util.pipe(
      util.entries(data.csTopic),
      util.filter((entry) => keywordMap[entry[0]]),
      util.fromEntries,
    );
  }
}
