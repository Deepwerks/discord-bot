import axios, { AxiosInstance, AxiosResponse } from "axios";
import { RequestMethod } from "../../base/types/RequestMethod";
import NotFoundError from "../../base/errors/NotFoundError";
import Bottleneck from "bottleneck";

export interface IBaseApiOptions {
  baseURL: string;
  apiKey?: string;
  limiter?: Bottleneck;
}

export default class BaseClient {
  private client: AxiosInstance;
  public apiKey?: string;

  private limiter: Bottleneck;

  constructor({ baseURL, apiKey, limiter }: IBaseApiOptions) {
    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    this.apiKey = apiKey;
    this.limiter = limiter || new Bottleneck();
  }

  public async request<T>(
    method: RequestMethod,
    url: string,
    data?: object,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      return await this.limiter.schedule(async () => {
        const response: AxiosResponse<T> = await this.client.request({
          method,
          url,
          data,
          params,
        });

        return response.data;
      });
    } catch (error) {
      console.error(JSON.stringify(error, null, 2));
      if (axios.isAxiosError(error)) {
        // Handle Axios-specific errors
        if (error.response) {
          // Server responded with a status code outside the 2xx range
          const status = error.response.status;

          if (status === 404) {
            throw new NotFoundError(`Resource not found at ${url}`);
          }

          throw new Error(
            `Request failed with status ${status}: ${error.response.data}`
          );
        } else if (error.request) {
          // Request was made but no response received
          throw new Error("No response received from the server.");
        } else {
          // Something happened in setting up the request
          throw new Error(`Request setup failed: ${error.message}`);
        }
      } else {
        // Handle non-Axios errors
        throw new Error(`Unexpected error: ${error}`);
      }
    }
  }
}
