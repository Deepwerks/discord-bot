import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import DeadlockAIAssistantService from './services/DeadlockAiAssistantService';

export default class AIAssistantClient extends BaseClient {
  AiAssistantService: DeadlockAIAssistantService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.AiAssistantService = new DeadlockAIAssistantService(this);
  }
}
