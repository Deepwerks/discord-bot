import BaseClient, { IBaseApiOptions } from '../base/classes/BaseClient';
import ChatService from './services/ChatService';

export default class AIAssistantClient extends BaseClient {
  ChatService: ChatService;

  constructor(options: IBaseApiOptions) {
    super(options);

    this.ChatService = new ChatService(this);
  }
}
