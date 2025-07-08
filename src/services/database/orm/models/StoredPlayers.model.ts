import { DataTypes, Model, Sequelize } from 'sequelize';

export class StoredPlayers extends Model {
  declare discordId: string;
  declare steamId: string;
  declare name: string | null;
  declare authenticated: boolean;
  declare authCount: number;
  declare reauthAfter: Date | null;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        discordId: {
          type: DataTypes.STRING,
          primaryKey: true,
        },
        steamId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
        },
        authenticated: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },
        authCount: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        reauthAfter: {
          type: 'timestamp without time zone',
        },
      },
      {
        sequelize,
        tableName: 'stored_players',
        schema: 'app',
        name: {
          singular: 'StoredPlayer',
          plural: 'StoredPlayers',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
