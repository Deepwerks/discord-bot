import { DataTypes, Model, Sequelize } from 'sequelize';

export class GuildAiUsage extends Model {
  declare guildId: string;
  declare date: Date;
  declare count: number;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        guildId: {
          type: DataTypes.TEXT,
          primaryKey: true,
        },
        date: {
          type: DataTypes.DATEONLY,
          primaryKey: true,
        },
        count: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: 'guild_ai_usage',
        schema: 'app',
        name: {
          singular: 'GuildAiUsage',
          plural: 'GuildAiUsages',
        },
        timestamps: false,
        paranoid: false,
      }
    );
  }
}
