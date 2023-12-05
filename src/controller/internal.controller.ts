import { TypedParam, TypedRoute } from '@nestia/core';
import { Controller, Res } from '@nestjs/common';
import { Response } from 'express';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { MemoryStoreManager } from '../secondary';

@Controller('/_')
export class InternalController {
  constructor(private readonly memoryStoreManager: MemoryStoreManager) {}

  /**
   * @internal
   */
  @TypedRoute.Get('/demo')
  async renderHtml(@Res() res: Response): Promise<void> {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(await readFile(join(__dirname, '../../index.html')));
  }

  /**
   * @internal
   */
  @TypedRoute.Get('/interview-paper/:id')
  async getInterviewPaper(@TypedParam('id') id: number): Promise<Record<string, any>> {
    // await this.memoryStoreManager.set({ id, type: 'interviewHistory', value: [] });
    // await this.memoryStoreManager.set({
    //   id,
    //   type: 'interviewPaper',
    //   value: {
    //     items: [
    //       {
    //         question:
    //           'Next.js를 사용하여 서버 사이드 렌더링을 구현할 때, 클라이언트 사이드 렌더링과 비교했을 때의 성능상 이점과 주의해야 할 점에 대해 설명해주실 수 있나요?',
    //         answer:
    //           '서버 사이드 렌더링은 클라이언트 사이드 렌더링에 비해 초기 로딩 속도가 빠르며, SEO에 유리하다는 이점이 있습니다. 하지만 서버의 부하가 증가한다는 점과 보안 측면에서 더욱 주의해야 합니다.',
    //         tailQuestions: [
    //           {
    //             question: '서버 사이드 렌더링을 사용할 때 SEO 최적화에 어떤 영향을 미치나요?',
    //             answer:
    //               'SSR은 모든 페이지 내용이 서버에서 렌더링되므로 검색 엔진이 페이지의 내용을 더 잘 이해하고 인덱싱할 수 있습니다. 따라서 SEO에 더 유리합니다.',
    //           },
    //           {
    //             question: 'Next.js의 getServerSideProps 함수의 역할에 대해 설명해주실 수 있나요?',
    //             answer:
    //               'getServerSideProps 함수는 Next.js에서 제공하는 서버 측 렌더링을 지원하는 함수로, 각 요청마다 서버 측에서 데이터를 가져와 페이지에 주입하는 역할을 합니다. 이 함수를 사용하면 매 요청 시 서버에서 데이터를 동적으로 가져와 페이지를 렌더링할 수 있으며, 페이지의 초기 데이터 로딩 및 SEO에 유용합니다.',
    //           },
    //           {
    //             question:
    //               '클라이언트 사이드 렌더링에서 발생할 수 있는 보안 문제와 그에 대한 서버 사이드 렌더링의 장점을 말씀해주세요.',
    //             answer:
    //               '클라이언트 사이드 렌더링에서는 초기 로딩 시 클라이언트에게 모든 데이터가 노출되어 보안 문제가 발생할 수 있습니다. 반면, 서버 사이드 렌더링은 필요한 데이터만을 렌더링 시에 서버에서 가져오기 때문에 민감한 정보의 노출을 최소화하고 보안을 강화할 수 있습니다.',
    //           },
    //           {
    //             question:
    //               '서버 사이드 렌더링을 사용할 때 발생할 수 있는 성능상의 문제점은 무엇이며, 이를 어떻게 해결할 수 있나요?',
    //             answer:
    //               '서버 사이드 렌더링은 서버에 추가 부하를 유발할 수 있고, 많은 동시 요청이 들어올 경우 성능 저하가 발생할 수 있습니다. 이를 해결하기 위해 캐싱 전략을 사용하여 중복된 요청에 대한 결과를 캐시하고, 로드 밸런싱을 통해 부하를 분산시키는 것이 일반적인 방법입니다.',
    //           },
    //         ],
    //         isCompleted: true,
    //       },
    //     ],
    //     finalOneLineReview: '',
    //     finalScore: 0,
    //   },
    // });
    return {
      interviewHistory: await this.memoryStoreManager.get({ type: 'interviewHistory', id }),
      interviewPaper: await this.memoryStoreManager.get({ type: 'interviewPaper', id }),
    };
  }
}
