export interface VariableRequestParams {
  account_id: string;
  hero_name?: string;
  region?: string;
  variables: string[];
}

export interface VariableResponse {
  [key: string]: string | number | null;
}
