export default class CommandError extends Error {
  constructor(message: string = 'Command error') {
    super(message);
    this.name = 'CommandError';
  }
}
