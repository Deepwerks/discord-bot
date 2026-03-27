import { DataTypes, Model, Sequelize } from 'sequelize';

export class PatreonLinks extends Model {
  declare id: number;
  declare discordUserId: string;
  declare guildId: string;
  declare patreonSessionToken: string;
  declare tier: number;
  declare tierName: string | null;
  declare rateLimit: number | null;
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
        discordUserId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        guildId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        patreonSessionToken: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        tier: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },
        tierName: {
          type: DataTypes.TEXT,
        },
        rateLimit: {
          type: DataTypes.INTEGER,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        tableName: 'patreon_links',
        schema: 'app',
        name: {
          singular: 'PatreonLink',
          plural: 'PatreonLinks',
        },
        timestamps: true,
        paranoid: true,
        indexes: [
          {
            unique: true,
            fields: ['discordUserId', 'guildId'],
          },
        ],
      }
    );
  }
}
