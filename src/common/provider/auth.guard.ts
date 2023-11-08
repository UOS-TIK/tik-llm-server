import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { environment } from '../environment';
import { CommonException } from '../exception';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (process.env['NODE_ENV'] === 'local') {
      return true;
    }
    if (request.headers.authorization !== environment.secret) {
      throw new CommonException(401, 'not authorized.');
    }

    return true;
  }
}
