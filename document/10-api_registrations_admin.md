1.**สร้าง Foder registrations เป็นไฟล์หลักของโปรเจกต์ Node.js ที่ทำหน้าที่ดู ข้อมูลของคนที่ลงทะเบียน**

-   ใน Foder (api) -> registrations -> route.ts

```javascript
import { NextResponse } from "next/server";
import clientPromise from '../../lib/mongodb';

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const checked = searchParams.get("checked"); // "all" | "true" | "false"
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limitRaw = Number(searchParams.get("limit") || 20);
    const limit = Math.min(Math.max(limitRaw, 5), 100);
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("line_register");
    const col = db.collection("registrations");

    const filter: any = {};

    // ✅ filter checkedIn
    if (checked === "true") filter.checkedIn = true;
    if (checked === "false") filter.checkedIn = false;

    // ✅ search
    if (q) {
      filter.$or = [
        { displayName: { $regex: q, $options: "i" } },
        { department: { $regex: q, $options: "i" } },
        { lineUserId: { $regex: q, $options: "i" } },
      ];
    }

    const [total, rows] = await Promise.all([
      col.countDocuments(filter),
      col
        .find(filter, {
          projection: {
            _id: 0,
            lineUserId: 1,
            displayName: 1,
            department: 1,
            checkedIn: 1,
            checkedInAt: 1,
            createdAt: 1,
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return NextResponse.json({
      ok: true,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      rows,
    });
  } catch (e: any) {
    console.error("LIST REGISTRATIONS ERROR:", e);
    return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 });
  }
}

```


**ถ้า list ข้อมูลไม่ขึ้นให้ใช้ Powersell**
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
npm run dev -- --no-turbo
