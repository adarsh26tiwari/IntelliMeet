import mongoose from "mongoose";


const connectDb = async() => {
    try {
         const conn = await mongoose.connect(process.env.MONGO_URI);
         console.log('Mongodb connection established', conn.connection.host);
    } catch (error) {
        console.error('error connecting to database',error.message);
        process.exit(1)
    }
}

export default connectDb;