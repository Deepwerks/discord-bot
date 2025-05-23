import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import axiosRetry from 'axios-retry';
import { ZodSchema } from 'zod';
import NotFoundError from '../../../../base/errors/NotFoundError';
import { RequestMethod } from '../../../../base/types/RequestMethod';
import IConfig from '../../../../base/interfaces/IConfig';
import ValidationError from '../../../../base/errors/ValidationError';

export interface IBaseApiOptions {
  baseURL?: string;
  apiKey?: string;
  limiter?: Bottleneck;
  config: IConfig;
  enableRetry?: boolean;
  retryAttempts?: number;
}

export default class BaseClient {
  protected client: AxiosInstance;
  protected config: IConfig;
  protected apiKey?: string;
  private limiter: Bottleneck;

  constructor({
    baseURL,
    apiKey,
    limiter,
    config,
    enableRetry = true,
    retryAttempts = 3,
  }: IBaseApiOptions) {
    this.apiKey = apiKey;
    this.limiter = limiter ?? new Bottleneck();
    this.config = config;

    this.client = axios.create({
      baseURL,
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });

    if (enableRetry) {
      axiosRetry(this.client, {
        retries: retryAttempts,
        retryDelay: axiosRetry.exponentialDelay,
        retryCondition: (error) =>
          axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error),
      });
    }
  }

  public async request<T>(
    method: RequestMethod,
    url: string,
    options: {
      data?: object;
      params?: Record<string, unknown>;
      headers?: Record<string, string>;
      schema?: ZodSchema<T>;
    } = {}
  ): Promise<T> {
    const { data, params, headers, schema } = options;

    try {
      const response = await this.limiter.schedule(() =>
        this.client.request<T>({
          method,
          url,
          data,
          params,
          headers,
        })
      );

      if (schema) {
        const parsed = schema.safeParse(response.data);
        if (!parsed.success) {
          throw new ValidationError(`Response validation failed for ${url}`, parsed.error.format());
        }

        return parsed.data;
      }

      return response.data;
    } catch (err) {
      throw this.handleError(err, url);
    }
  }

  protected handleError(error: unknown, url: string): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          return new NotFoundError(`Resource not found at ${url}`);
        }
        return new Error(`Request failed (${status}): ${JSON.stringify(error.response.data)}`);
      }

      if (error.request) {
        return new Error('No response received from the server.');
      }

      return new Error(`Request setup failed: ${error.message}`);
    }

    return new Error(`Unexpected error: ${String(error)}`);
  }
}
