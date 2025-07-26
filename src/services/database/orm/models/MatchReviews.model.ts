import { DataTypes, Model, Sequelize } from 'sequelize';

export type MatchReviewType = 'overall' | 'positioning' | 'macro' | 'mechanics';

export class MatchReviews extends Model {
  declare id: number;
  declare requestId: number;
  declare userId: string;
  declare type: MatchReviewType;
  declare rating: number;
  declare description: string;

  declare createdAt: Date;
  declare updatedAt: Date | null;
  declare deletedAt: Date | null;

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        requestId: {
          type: DataTypes.BIGINT,
          allowNull: false,
        },
        userId: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        type: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        rating: {
          type: DataTypes.NUMBER,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'match_reviews',
        schema: 'app',
        name: {
          singular: 'MatchReview',
          plural: 'MatchReviews',
        },
        timestamps: true,
        paranoid: true,
      }
    );
  }
}
