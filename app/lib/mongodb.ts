import { MongoClient, MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("Missing MONGODB_URI");

// ✅ TLS options สำหรับ Vercel + MongoDB Atlas
const options: MongoClientOptions = {
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    retryWrites: true,
    w: "majority",
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
};

if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable to preserve the connection across module reloads
    if (!globalWithMongo._mongoClientPromise) {
        client = new MongoClient(uri, options);
        globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
} else {
    // In production mode, create a new connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;