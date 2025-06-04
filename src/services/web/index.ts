import express, { Application, Request, Response, NextFunction } from 'express';
import IConfig from '../../base/interfaces/IConfig';
import { logger } from '../..';
import cookieParser from 'cookie-parser';
import steamAuthRouter from './routes/v2/SteamAuthRouter';
import errorHandler from './middlewares/errorHandler';
import { cleanUpTokens } from '../stores/SteamLinkTokenStore';
import limiter from './middlewares/rateLimit';
import { handleMatchRequest } from '../common/handleMatchRequest';
import { t } from 'i18next';
// import metricsRouter from './routes/v2/MetricsRouter';

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

    cleanUpTokens();

    app.get('/', limiter, (_req: Request, res: Response, _next: NextFunction) => {
      res.json({
        service: 'Deadlock Assistant',
        type: 'Discord BOT',
        invite:
          'https://discord.com/oauth2/authorize?client_id=1361785119374835984&permissions=8&integration_type=0&scope=bot',
      });
    });

    app.get('/webhook/match', limiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const matchID = req.query.id as string | undefined;

        if (!matchID) return next('No matchID');

        const match = await handleMatchRequest({
          id: matchID,
          t: t,
          type: 'match_id',
          userId: '',
          useGenericNames: false,
        });

        res.set('Content-Type', 'image/png');
        res.send(Buffer.from(match.imageBuffer));
      } catch (error) {
        logger.error(error);
        next(error);
      }
    });

    app.use(steamAuthRouter);
    // app.use(metricsRouter);

    app.use(errorHandler);

    app.listen(this.config.port, () => {
      logger.info(`Server is running on port: ${this.config.port}`);
    });
  }
}
