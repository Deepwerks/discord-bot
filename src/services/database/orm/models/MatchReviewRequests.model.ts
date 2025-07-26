import { BelongsToGetAssociationMixin, DataTypes, Model, Sequelize } from 'sequelize';
import { GuildAMRMConfig } from './GuildAMRMConfig.model';

export class MatchReviewRequests extends Model {
  declare id: number;
  declare userId: string;
  declare guildId: string;
  declare matchId: string;
  declare description: string | null;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  declare getAmrmConfig: BelongsToGetAssociationMixin<GuildAMRMConfig>;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrementIdentity: true,
        },
        userId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        guildId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        matchId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
        },
      },
      {
        sequelize,
        tableName: 'match_review_requests',
        schema: 'app',
        name: {
          singular: 'MatchReviewRequest',
          plural: 'MatchReviewRequests',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
