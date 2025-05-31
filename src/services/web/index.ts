import express, { Application, Request, Response, NextFunction } from 'express';
import IConfig from '../../base/interfaces/IConfig';
import { logger } from '../..';
import cookieParser from 'cookie-parser';
import steamAuthRouter from './routes/v2/SteamAuthRouter';
import metricsRouter from './routes/v2/MetricsRouter';
import errorHandler from './middlewares/errorHandler';
import { cleanUpTokens } from '../stores/SteamLinkTokenStore';
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
    this.InitPublic();
    this.InitPrivate();
  }

  InitPublic(): void {
    const app: Application = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    cleanUpTokens();

    app.get('/', limiter, (_req: Request, res: Response, _next: NextFunction) => {
      res.json({
        service: 'Deadlock Assistant',
        type: 'Discord BOT',
        invite:
          'https://discord.com/oauth2/authorize?client_id=1361785119374835984&permissions=8&integration_type=0&scope=bot',
      });
    });

    app.use(steamAuthRouter);

    app.use(errorHandler);

    app.listen(this.config.port, () => {
      logger.info(`Server is running on port: ${this.config.port}`);
    });
  }

  InitPrivate(): void {
    const app: Application = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(metricsRouter);

    app.listen(9050, () => {
      logger.info(`Server is running on port: 9050`);
    });
  }
}
