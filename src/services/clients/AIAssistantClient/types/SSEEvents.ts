export interface SSEStartEvent {
  type: 'start';
  conversation_id: string;
}

export interface SSEDeltaEvent {
  type: 'delta';
  content: string;
}

export interface SSEEndEvent {
  type: 'end';
}

export interface SSEToolStartEvent {
  type: 'tool_start';
  tool: string;
}

export interface SSEToolEndEvent {
  type: 'tool_end';
  tool: string;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
  code: string;
}

export type SSEEvent =
  | SSEStartEvent
  | SSEDeltaEvent
  | SSEEndEvent
  | SSEToolStartEvent
  | SSEToolEndEvent
  | SSEErrorEvent;
