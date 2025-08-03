import express, { Application, Request, Response, NextFunction } from 'express';
import IConfig from '../../base/interfaces/IConfig';
import { botClient, logger } from '../..';
import cookieParser from 'cookie-parser';
import steamAuthRouter from './routes/v2/SteamAuthRouter';
import metricsRouter from './routes/v2/MetricsRouter';
import redirectsRouter from './routes/v2/RedirectsRouter';
import errorHandler from './middlewares/errorHandler';
import limiter from './middlewares/rateLimit';

export interface IWebService {
  config: IConfig;
  Init(): void;
}

export default class WebService implements IWebService {
  config: IConfig;

  constructor(config: IConfig) {
    this.config = config;
  }

  Init(): void {
    const app: Application = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.get('/', limiter, (_req: Request, res: Response, _next: NextFunction) => {
      res.json({
        service: 'Deadlock Assistant',
        type: 'Discord BOT',
        invite: botClient.GetInviteLink(),
      });
    });

    app.use(steamAuthRouter);
    app.use(metricsRouter);
    app.use(redirectsRouter);

    app.use(errorHandler);

    app.listen(this.config.port, () => {
      logger.info(`Server is running on port: ${this.config.port}`);
    });
  }
}
