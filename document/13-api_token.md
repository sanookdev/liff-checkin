1.**สร้าง Foder token เป็นไฟล์หลักของโปรเจกต์ Node.js ที่ทำหน้าที่สร้าง qr code สำหรับ checkin**

-   ใน Foder (api) -> checkin -> token -> route.ts

```javascript
import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function sign(data: string) {
  const secret = process.env.QR_SECRET || "";
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

// token จะเป็น JSON string เพื่อเอาไปทำ QR ได้ง่าย
export async function GET() {
  try {
    const ttl = Number(process.env.QR_TTL_SECONDS || 120);
    const ts = Date.now();
    const nonce = crypto.randomUUID(); // กันเดาง่าย + ทำให้ token เปลี่ยนทุกครั้ง
    const data = `GLOBAL|${ts}|${nonce}`;
    const sig = sign(data);

    return NextResponse.json({
      ok: true,
      token: JSON.stringify({ scope: "GLOBAL", ts, nonce, sig, ttl }),
      ts,
      ttl,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? "Server error" }, { status: 500 });
  }
}

```
