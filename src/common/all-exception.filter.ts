import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const statusCode = exception.status || 500;

    res.status(statusCode).json({
      statusCode,
      name: exception.name,
      message: exception.message || 'internal server error',
    });
  }
}
