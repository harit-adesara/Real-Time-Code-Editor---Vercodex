import { mongoose, connect } from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB connected");
  } catch (error) {
    console.log("DB not connected");
    process.exit(1);
  }
};

export { connectDB };
