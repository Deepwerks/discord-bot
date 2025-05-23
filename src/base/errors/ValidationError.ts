export default class ValidationError extends Error {
  readonly status: number = 422;
  misc?: unknown;

  constructor(message: string = 'Validation Error', misc?: object) {
    super(message);
    this.name = 'ValidationError';

    this.misc = misc;
  }
}
