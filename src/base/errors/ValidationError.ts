export default class ValidationError extends Error {
  status: number = 422;
  misc?: object;

  constructor(message: string = 'Validation Error', misc?: object) {
    super(message);

    this.misc = misc;
  }
}
