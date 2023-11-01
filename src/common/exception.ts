export abstract class AppException<T extends string> extends Error {
  public readonly statusCode!: number;
  public override readonly name: string;
  public override readonly message!: T;
  /** @hidden */
  public override readonly stack!: string;
  /** @hidden */
  public readonly additional!: Record<string, any> | undefined;

  constructor(statusCode: number, message: T, additional?: Record<string, any>) {
    super();
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    this.message = message;
    this.additional = additional || undefined;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CommonException extends AppException<
  'not authorized.' | 'invalid request data.' | 'internal server error.'
> {}
