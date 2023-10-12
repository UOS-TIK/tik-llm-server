import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

export class AppException<T extends string> {
  readonly statusCode!: number;
  readonly name: string;
  readonly message!: T;
  private readonly stack!: string;

  constructor(statusCode: number, message: T) {
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    this.message = message;
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
      return res.status(exception.statusCode).json(exception);
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
