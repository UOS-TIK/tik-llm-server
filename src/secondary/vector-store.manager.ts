import { Injectable, OnModuleInit } from '@nestjs/common';
import { PineconeClient } from '@pinecone-database/pinecone';
import { environment } from '@src/environment';
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
}
