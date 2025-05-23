export default class NotFoundError extends Error {
  readonly status: number = 404;

  constructor(message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
