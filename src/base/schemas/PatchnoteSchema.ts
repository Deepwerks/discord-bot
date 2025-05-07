import { model, Schema } from "mongoose";

export type PatchNote = {
  category: string;
  changes: Record<string, string[]>;
};

export interface IPatchnote {
  guid: string;
  title: string;
  date: Date;
  url: string;
  author?: string;
  changes: PatchNote[];
}

const PatchNoteSchema = new Schema<PatchNote>({
  category: { type: String, required: true },
  changes: {
    type: Map,
    of: [String],
    required: true,
  },
});

export default model<IPatchnote>(
  "Patchnote",
  new Schema<IPatchnote>({
    guid: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true },
    author: { type: String },
    url: { type: String, required: true },
    changes: { type: [PatchNoteSchema], required: true },
  })
);
