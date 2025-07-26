import { DataTypes, Model, Sequelize } from 'sequelize';

export class GuildAMRMConfig extends Model {
  declare guildId: string;
  declare categoryId: string | null;
  declare forumId: string | null;
  declare dashboardId: string | null;
  declare updatedBy: string | null;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        guildId: {
          type: DataTypes.TEXT,
          primaryKey: true,
        },
        categoryId: {
          type: DataTypes.TEXT,
        },
        forumId: {
          type: DataTypes.TEXT,
        },
        dashboardId: {
          type: DataTypes.TEXT,
        },
        updatedBy: {
          type: DataTypes.TEXT,
        },
      },
      {
        sequelize,
        tableName: 'guild_amrm_config',
        schema: 'app',
        name: {
          singular: 'GuildAMRMConfig',
          plural: 'GuildAMRMConfigs',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
