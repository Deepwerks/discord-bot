import { DataTypes, Model, Sequelize } from 'sequelize';

export class Guilds extends Model {
  declare guildId: string;
  declare ownerDiscordId: string;
  declare preferedLanguage: string;

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
