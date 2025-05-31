import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';
import axiosRetry from 'axios-retry';
import { ZodSchema } from 'zod';
import NotFoundError from '../../../../base/errors/NotFoundError';
import { RequestMethod } from '../../../../base/types/RequestMethod';
import IConfig from '../../../../base/interfaces/IConfig';
import ValidationError from '../../../../base/errors/ValidationError';
import promClient from 'prom-client';

export interface IBaseApiOptions {
  baseURL?: string;
  apiKey?: string;
  limiter?: Bottleneck;
  config: IConfig;
  enableRetry?: boolean;
  retryAttempts?: number;
}

const apiRequestCounter = new promClient.Counter({
  name: 'api_requests_total',
  help: 'Total number of outbound API requests',
  labelNames: ['endpoint', 'status'] as const,
});

const apiRequestLatency = new promClient.Histogram({
  name: 'api_request_duration_seconds',
  help: 'Outbound API request latency in seconds',
  labelNames: ['endpoint', 'status'] as const,
  // Például: [0.1s, 0.5s, 1s, 2s, 5s]
  buckets: [0.1, 0.5, 1, 2, 5],
});

export default class BaseClient {
  protected client: AxiosInstance;
  config: IConfig;
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

    const endpoint = `${this.client.defaults.baseURL}${url}`;
    const endTimer = apiRequestLatency.startTimer({ endpoint, status: 'unknown' });
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

        apiRequestCounter.inc({ endpoint, status: response.status });
        return parsed.data;
      }

      apiRequestCounter.inc({ endpoint, status: response.status });
      endTimer({ status: response.status });
      return response.data;
    } catch (err) {
      apiRequestCounter.inc({ endpoint, status: 'error' });
      endTimer({ status: 'error' });

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

    if (error instanceof ValidationError) {
      return error;
    }

    return new Error(`Unexpected error: ${String(error)}`);
  }
}
