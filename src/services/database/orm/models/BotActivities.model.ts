import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IBotActivities {
  type: string;
  message: string;
  status: string;
}

export class BotActivities extends Model {
  declare id: number;

  declare type: string;
  declare message: string;
  declare status: string;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        status: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'bot_activities',
        schema: 'app',
        name: {
          singular: 'BotActivity',
          plural: 'BotActivities',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
