import { TypedException, TypedRoute } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { CommonException } from '@src/common';

@Controller('/_')
export class CommonController {
  /**
   * 공통 exception 모음.(4XX, 5XX 전부 포함)
   *
   * @tag Common
   */
  @TypedException<CommonException>('4XX')
  @TypedRoute.Get('/exceptions')
  async showCommonExceptions(): Promise<string> {
    return '';
  }
}
