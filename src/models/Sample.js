import mongoose from "mongoose";

const sampleSchema = new mongoose.Schema(
  {
    sample_field: {
      type: String,
      required: true
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    },
    toObject: {
      virtuals: true,
      retainKeyOrder: true
    },
    toJSON: {
      virtuals: true
    }
  }
);


export const Sample = mongoose.model("Sample", sampleSchema);
export default Sample;
