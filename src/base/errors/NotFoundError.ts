export default class NotFoundError extends Error {
  status: number = 404;

  constructor(message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
