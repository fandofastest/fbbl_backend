import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    imageUrl: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export type Category = InferSchemaType<typeof CategorySchema>;

export const CategoryModel: Model<Category> =
  (mongoose.models.Category as Model<Category>) ||
  mongoose.model<Category>("Category", CategorySchema);
