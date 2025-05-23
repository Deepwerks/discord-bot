export default class RateLimitError extends Error {
  status: number = 429;

  constructor(message: string = 'Too many attempts. Please wait a bit and try again.') {
    super(message);
  }
}
