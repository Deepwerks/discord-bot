import { DataTypes, Model, Sequelize } from 'sequelize';

export enum InteractionType {
  Command = 'command',
  Button = 'button',
  SelectMenu = 'selectMenu',
  Modal = 'modal',
}

export interface IUserInteractions {
  id: string;
  type: InteractionType;
  name: string;
  userId: string;
  guildId: string | null;
  options: object | null;
}

export class UserInteractions extends Model {
  declare id: string;

  declare type: InteractionType;
  declare name: string;
  declare userId: string;
  declare guildId: string | null;
  declare options: object | null;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        type: {
          type: DataTypes.ENUM(...Object.values(InteractionType)),
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        guildId: {
          type: DataTypes.STRING,
        },
        options: {
          type: DataTypes.JSON,
        },
      },
      {
        sequelize,
        tableName: 'user_interactions',
        schema: 'app',
        name: {
          singular: 'UserInteraction',
          plural: 'UserInteractions',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
