import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { environment } from './environment';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.headers.authorization === environment.secret) {
      return true;
    }
    if (request.url.startsWith('/_')) {
      return true;
    }

    return false;
  }
}
