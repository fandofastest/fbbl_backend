import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import "./Category";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    sku: { type: String, required: false, trim: true, index: true },
    description: { type: String, required: false, default: "" },
    imageUrl: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

export type Product = InferSchemaType<typeof ProductSchema>;

export const ProductModel: Model<Product> =
  (mongoose.models.Product as Model<Product>) || mongoose.model<Product>("Product", ProductSchema);
