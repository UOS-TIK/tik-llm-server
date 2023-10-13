import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

export class AppException<T extends string> {
  public readonly statusCode!: number;
  public readonly name: string;
  public readonly message!: T;
  private readonly additional!: Record<string, any> | undefined;
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

  getLoggingMessage() {
    return `${this.message} params=${JSON.stringify(this.additional)}`;
  }
}

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

    // input validation exception
    if ((exception as any)?.response?.path) {
      return res.status(400).json({
        statusCode: 400,
        name: 'BadRequestException',
        message: 'invalid request data.',
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

    // TODO: log unhandled exception.
    console.log(JSON.stringify(exception));

    return res.status(500).json({
      statusCode: 500,
      name: 'InternalServerError',
      message: 'internal server error.',
    });
  }
}
