import CustomCache from '../../cache';
import { MatchReviewRequests } from '../../database/orm/init';

export interface MatchReviewRequestOptions {
  userId: string;
  guildId: string;
  matchId: string;
  description: string | null;
}

export class MatchReviewRequestStore {
  private cache: CustomCache<MatchReviewRequests>;

  constructor() {
    this.cache = new CustomCache<MatchReviewRequests>('MatchReviewRequestCache', 60 * 60);
  }

  async get(requestId: string) {
    const cached = this.cache.get(requestId);
    if (cached) return cached;

    const matchReviewRequest = await MatchReviewRequests.findByPk(Number(requestId));
    if (matchReviewRequest) this.set(matchReviewRequest);

    return matchReviewRequest;
  }

  set(matchReviewRequest: MatchReviewRequests) {
    this.cache.set(matchReviewRequest.id.toString(), matchReviewRequest);
  }

  async create(options: MatchReviewRequestOptions) {
    const newRequest = await MatchReviewRequests.create({ ...options });

    this.set(newRequest);

    return newRequest;
  }
}

export const useMatchReviewRequestStore = new MatchReviewRequestStore();
