/* eslint-disable @typescript-eslint/no-explicit-any */
export type PaginationContext = {
  userId: string;
  data: any[];
  page: number;
  perPage: number;
  generateEmbed: (data: any, page: number, total: number) => any;
};

export const paginationStore = new Map<string, PaginationContext>();
