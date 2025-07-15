import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IAMRMSettings {
  enabled: boolean;
  channels: {
    categoryId: string;
    forumId: string;
    dashboardId: string;
  } | null;
}

export class Guilds extends Model {
  declare guildId: string;
  declare ownerDiscordId: string;
  declare preferedLanguage: string;

  declare amrmSettings: IAMRMSettings | null;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        guildId: {
          type: DataTypes.STRING,
          primaryKey: true,
          allowNull: false,
        },
        ownerDiscordId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        preferedLanguage: {
          type: DataTypes.STRING,
          defaultValue: 'en',
          allowNull: false,
        },
        amrmSettings: {
          type: DataTypes.JSONB,
        },
      },
      {
        sequelize,
        tableName: 'guilds',
        schema: 'app',
        name: {
          singular: 'Guild',
          plural: 'Guilds',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
