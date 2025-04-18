import axios, { AxiosInstance, AxiosResponse } from "axios";
import { RequestMethod } from "../../base/types/RequestMethod";

export interface IBaseApiOptions {
  baseURL: string;
  apiKey: string;
}

export default class BaseClient {
  private client: AxiosInstance;
  public apiKey: string;

  constructor({ baseURL, apiKey }: IBaseApiOptions) {
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    this.apiKey = apiKey;
  }

  public async request<T>(
    method: RequestMethod,
    url: string,
    data?: object
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data,
      });

      return response.data;
    } catch (error) {
      throw new Error(`API Request Failed: ${error}`);
    }
  }
}
