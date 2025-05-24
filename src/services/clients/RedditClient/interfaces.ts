export interface RedditPostData {
  title: string;
  url: string;
  permalink: string;
  author: string;
  over_18: boolean;
  post_hint: string;
  link_flair_text?: string;
}

export interface RedditPost {
  kind: string;
  data: RedditPostData;
}

export interface RedditApiData {
  children: RedditPost[];
}

export interface RedditApiResponse {
  kind: string;
  data: RedditApiData;
}

export interface RedditTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}
