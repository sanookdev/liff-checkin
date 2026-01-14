1.**สร้าง Foder lib เป็นไฟล์หลักของ lib mongoDB เพื่อเชื่อมกับฐานข้อมูลที่สร้างไว้**
-   ใน Foder (app) -> lib -> mongodb.ts

```javascript
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
if (!uri) throw new Error("Missing MONGODB_URI");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri);
  globalWithMongo._mongoClientPromise = client.connect();
}
clientPromise = globalWithMongo._mongoClientPromise;

export default clientPromise;
```


2.**สร้าง Flie .env.local เป็นไฟล์สำหรับเก็บข้อมูล รหัส หรือ Token ต่างๆ ที่นำไปใช้ใน Project**
-   ใน Foder (LINE-LIFF-USER) -> .env.local

```javascript
#NEXT_PUBLIC
MONGODB_URI=mongodb+srv://Thossaporn_11611:Thossaporn_11611@cluster0.rufgl.mongodb.net/?appName=Cluster0
NEXT_PUBLIC_LIFF_ID=2008604359-qF0HwhGw
NEXT_PUBLIC_LIFF_ID_checkin=2008604359-w40CDmol
QR_SECRET=some-super-secret-long-random-string
QR_TTL_SECONDS=120
```