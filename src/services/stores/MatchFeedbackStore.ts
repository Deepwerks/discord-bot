type MatchFeedbackState = {
  matchId: number;
  title: string;
  rank?: string;
  videoUrl?: string;
  creatorId: string;
  threadId: string;
  channelId: string;
  messageId: string;
};

class MatchFeedbackStore {
  private feedbackSessions = new Map<string, MatchFeedbackState>();

  createSession(sessionId: string, state: MatchFeedbackState) {
    this.feedbackSessions.set(sessionId, state);
  }

  getSession(sessionId: string): MatchFeedbackState | undefined {
    return this.feedbackSessions.get(sessionId);
  }

  removeSession(sessionId: string) {
    this.feedbackSessions.delete(sessionId);
  }

  // Clean up old sessions (optional, for memory management)
  cleanupOldSessions() {
    // Could implement TTL cleanup if needed
  }
}

export const matchFeedbackStore = new MatchFeedbackStore();
