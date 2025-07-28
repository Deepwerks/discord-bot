import {
  BelongsToGetAssociationMixin,
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyHasAssociationMixin,
  HasManyRemoveAssociationMixin,
  Model,
  Sequelize,
} from 'sequelize';
import { GuildAMRMConfig } from './GuildAMRMConfig.model';
import { MatchReviews } from './MatchReviews.model';

export class MatchReviewRequests extends Model {
  declare id: number;
  declare userId: string;
  declare guildId: string;
  declare matchId: string;
  declare channelId: string;
  declare postMessageId: string | null;
  declare description: string | null;
  declare draftMessageId: string | null;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  declare getAmrmConfig: BelongsToGetAssociationMixin<GuildAMRMConfig>;

  declare getReviews: HasManyGetAssociationsMixin<MatchReviews>;
  declare addReview: HasManyAddAssociationMixin<MatchReviews, number>;
  declare hasReview: HasManyHasAssociationMixin<MatchReviews, number>;
  declare countReviews: HasManyCountAssociationsMixin;
  declare removeReview: HasManyRemoveAssociationMixin<MatchReviews, number>;
  declare createReview: HasManyCreateAssociationMixin<MatchReviews>;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
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
        channelId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        postMessageId: {
          type: DataTypes.TEXT,
        },
        draftMessageId: {
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
