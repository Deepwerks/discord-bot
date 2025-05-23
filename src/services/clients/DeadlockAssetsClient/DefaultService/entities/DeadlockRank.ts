export default class DeadlockRank {
  tier: number;
  name: string;
  images: {
    large: string;
    large_webp: string;
    small?: string;
    small_webp?: string;
    large_subrank1?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank1.png';
    large_subrank1_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank1.webp';
    large_subrank2?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank2.png';
    large_subrank2_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank2.webp';
    large_subrank3?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank3.png';
    large_subrank3_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank3.webp';
    large_subrank4?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank4.png';
    large_subrank4_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank4.webp';
    large_subrank5?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank5.png';
    large_subrank5_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank5.webp';
    large_subrank6?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank6.png';
    large_subrank6_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_lg_subrank6.webp';
    small_subrank1?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank1.png';
    small_subrank1_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank1.webp';
    small_subrank2?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank2.png';
    small_subrank2_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank2.webp';
    small_subrank3?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank3.png';
    small_subrank3_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank3.webp';
    small_subrank4?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank4.png';
    small_subrank4_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank4.webp';
    small_subrank5?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank5.png';
    small_subrank5_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank5.webp';
    small_subrank6?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank6.png';
    small_subrank6_webp?: 'https://assets-bucket.deadlock-api.com/assets-api-res/images/ranks/rank1/badge_sm_subrank6.webp';
  };
  color: string;

  constructor(raw: any) {
    this.tier = raw.tier;
    this.name = raw.name;
    this.images = raw.images;
    this.color = raw.color;
  }
}
