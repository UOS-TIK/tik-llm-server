export abstract class AppException<T extends string> {
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

  getLoggingMessage() {
    return `${this.message} params=${JSON.stringify(this.additional)} stack=${this.stack}`;
  }
}

export class CommonException extends AppException<
  'not authorized.' | 'invalid request data.' | 'internal server error.'
> {}
