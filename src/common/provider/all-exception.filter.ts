import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

export abstract class AppException<T extends string> {
  readonly statusCode!: number;
  readonly name: string;
  readonly message!: T;
  readonly additional!: Record<string, any> | undefined;
  private readonly stack!: string;

  constructor(statusCode: number, message: T, additional?: Record<string, any>) {
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    this.message = message;
    this.additional = additional || undefined;
    Error.captureStackTrace(this, this.constructor);
  }

  getStack() {
    return this.stack;
  }
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof AppException) {
      return res.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        name: exception.name,
        message: exception.message,
      });
    }

    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json({
        statusCode: exception.getStatus(),
        name: exception.name,
        message: exception.message,
      });
    }

    // TODO: log unhandled exception.
    console.log(JSON.stringify(exception));

    return res.status(500).json({
      statusCode: 500,
      name: 'InternalServerError',
      message: 'internal server error',
    });
  }
}
