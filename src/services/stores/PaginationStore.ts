export type PaginationContext = {
  userId: string;
  data: never[];
  page: number;
  perPage: number;
  generateEmbed: (data: never, page: number, total: number) => never;
};

export const paginationStore = new Map<string, PaginationContext>();
