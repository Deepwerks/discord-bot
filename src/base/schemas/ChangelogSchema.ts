import { model, Schema } from "mongoose";

interface IChangelogRecordSchema {
  name: string;
  description: string | undefined;

  changes: string[];
  fixes: string[];
  features: string[];
  improvements: string[];
  notes: string[];
}

interface IChangelogSchema {
  version: string;
  date: Date;

  name: string | undefined;
  description: string | undefined;
  records: IChangelogRecordSchema[];
}

const ChangelogRecordSchema = new Schema<IChangelogRecordSchema>(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },

    changes: { type: [String], required: true },
    fixes: { type: [String], required: true },
    features: { type: [String], required: true },
    improvements: { type: [String], required: true },
    notes: { type: [String], required: true },
  },
  {
    _id: false,
  }
);

export default model<IChangelogSchema>(
  "Changelog",
  new Schema<IChangelogSchema>(
    {
      version: { type: String, required: true },
      date: { type: Date, required: true },

      name: { type: String, required: false },
      description: { type: String, required: false },
      records: { type: [ChangelogRecordSchema], required: true },
    },
    {
      timestamps: true,
    }
  )
);
