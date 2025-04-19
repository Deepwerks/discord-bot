import axios, { AxiosInstance, AxiosResponse } from "axios";
import { RequestMethod } from "../../base/types/RequestMethod";
import NotFoundError from "../../base/errors/NotFoundError";

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
    data?: object,
    params?: Record<string, any>
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data,
        params,
      });

      return response.data;
    } catch (error) {
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
