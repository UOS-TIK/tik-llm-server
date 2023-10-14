import { PlainFetcher } from '@nestia/fetcher/lib/PlainFetcher';
/**
 * @packageDocumentation
 * @module api.functional.finish
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
//================================================================
import type { IConnection, IPropagation, Primitive } from '@nestia/fetcher';

import type {
  FinishInterviewData,
  FinishInterviewException,
  FinishInterviewView,
} from '../../../primary/finish-interview/finish-interview.data';

/**
 * 면접 결과 확인하기.
 *
 * @tag Interview
 * @security secret
 * @param data req body
 * @return response type
 * @throws 400
 *
 * @controller AppController.finishInterview
 * @path POST /finish
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
export async function finishInterview(
  connection: IConnection,
  data: finishInterview.Input,
): Promise<finishInterview.Output> {
  return PlainFetcher.propagate(
    {
      ...connection,
      headers: {
        ...(connection.headers ?? {}),
        'Content-Type': 'application/json',
      },
    },
    {
      ...finishInterview.METADATA,
      path: finishInterview.path(),
    } as const,
    data,
  );
}
export namespace finishInterview {
  export type Input = Primitive<FinishInterviewData>;
  export type Output = IPropagation<{
    201: FinishInterviewView;
    400: FinishInterviewException;
  }>;

  export const METADATA = {
    method: 'POST',
    path: '/finish',
    request: {
      type: 'application/json',
      encrypted: false,
    },
    response: {
      type: 'application/json',
      encrypted: false,
    },
    status: null,
  } as const;

  export const path = (): string => {
    return `/finish`;
  };
}