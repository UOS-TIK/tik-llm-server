import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { AppException, CommonException } from '../exception';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    // operational exception
    if (exception instanceof AppException) {
      return res.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        name: exception.name,
        message: exception.message,
      });
    }

    // nestjs exception
    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        name: exception.name,
        message: exception.message,
      });
    }

    // input validation exception
    if ((exception as any)?.response?.path) {
      return res.status(400).json(new CommonException(400, 'invalid request data.'));
    }

    // TODO: log unhandled exception.
    console.log(JSON.stringify(exception));

    return res.status(500).json(new CommonException(500, 'internal server error.'));
  }
}
