import { DataTypes, Model, Sequelize } from 'sequelize';

export class GuildSubscriptions extends Model {
  declare id: number;
  declare guildId: string;
  declare guildName: string | null;
  declare userId: string;
  declare dailyLimit: number;
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        guildId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        guildName: {
          type: DataTypes.TEXT,
        },
        userId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        dailyLimit: {
          type: DataTypes.INTEGER,
          defaultValue: 100,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'guild_subscriptions',
        schema: 'app',
        name: {
          singular: 'GuildSubscription',
          plural: 'GuildSubscriptions',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
