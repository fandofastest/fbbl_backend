import mongoose, { Schema, type InferSchemaType, type Model, Types } from "mongoose";

const TransaksiItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const TransaksiSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [TransaksiItemSchema], required: true, default: [] },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      required: true,
      enum: ["pending", "paid", "shipped", "done", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export type TransaksiItem = {
  productId: Types.ObjectId;
  qty: number;
  price: number;
};

export type Transaksi = InferSchemaType<typeof TransaksiSchema>;

export const TransaksiModel: Model<Transaksi> =
  (mongoose.models.Transaksi as Model<Transaksi>) ||
  mongoose.model<Transaksi>("Transaksi", TransaksiSchema);
