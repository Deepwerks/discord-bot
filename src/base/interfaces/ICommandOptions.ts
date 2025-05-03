import Category from "../enums/Category";

export default interface ICommandOptions {
  name: string;
  description: string;
  category: Category;
  options: Array<object>;
  default_member_permissions: bigint;
  dm_permission: boolean;
  cooldown: number;
  dev: boolean;
}
