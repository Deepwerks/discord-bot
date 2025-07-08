import { DataTypes, Model, Sequelize } from 'sequelize';

class Guilds extends Model {
  declare guildId: string;
  declare ownerDiscordId: string;
  declare preferedLanguage: string;

  declare created_at: Date;
  declare updated_at: Date | null;
  declare deleted_at: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        guildId: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        ownerDiscordId: {
          type: DataTypes.STRING,
        },
        preferedLanguage: {
          type: DataTypes.STRING,
          defaultValue: 'en',
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
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
      }
    );
  }
}

export default Guilds;
