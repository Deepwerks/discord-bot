import express, { Application, Request, Response, NextFunction } from "express";
import IConfig from "../../base/interfaces/IConfig";
import { logger } from "../..";

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

    app.get("/", (req: Request, res: Response, _next: NextFunction) => {
      res.json({
        service: "Deadlock Assistant",
        type: "Discord BOT",
        invite:
          "https://discord.com/oauth2/authorize?client_id=1361785119374835984&permissions=8&integration_type=0&scope=bot",
      });
    });

    app.use((req: Request, res: Response, _next: NextFunction) => {
      res.status(404).json({ message: "Not Found" });
    });

    app.listen(this.config.port, () => {
      logger.info(`Server is running on port: ${this.config.port}`);
    });
  }
}
