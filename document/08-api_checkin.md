1.**สร้าง Foder checkin เป็นไฟล์หลักของโปรเจกต์ Node.js ที่ทำหน้าที่ Update ข้อมูลของคนที่ Checkin**
 - ใน Foder (api) -> checkin -> route.ts

```javascript
import { NextResponse } from 'next/server'; 
import clientPromise from '../../lib/mongodb'; 

export const dynamic = 'force-dynamic'; 

export async function POST(req: Request) {
    const rid = crypto.randomUUID();
    try {
        const { lineUserId } = await req.json();
        console.log('[CHECKIN]', rid, 'lineUserId:', lineUserId);
        if (!lineUserId) {
            return NextResponse.json({ ok: false, message: 'Missing lineUserId' }, { status: 400 });
        }
        const client = await clientPromise;
        const db = client.db('line_register');
        const col = db.collection('registrations');

        // 1) ต้องมีการลงทะเบียนก่อน
        const existing = await col.findOne({ lineUserId }, { projection: { checkedIn: 1, checkedInAt: 1 } });

        if (!existing) {
            return NextResponse.json({ ok: false, code: 'NOT_REGISTERED', message: 'ยังไม่พบการลงทะเบียน' }, { status: 404 });
        }

        // 2) ถ้าเช็คอินแล้ว -> 409
        if (existing.checkedIn === true) {
            return NextResponse.json({ ok: false, code: 'ALREADY_CHECKED_IN', message: 'คุณเช็คอินไปแล้ว', checkedInAt: existing.checkedInAt ?? null }, { status: 409 });
        }

        // 3) ถ้ายังไม่เช็คอิน -> อัปเดตเป็น true (กันยิงซ้ำด้วย)
        const result = await col.findOneAndUpdate({ lineUserId, checkedIn: false }, { $set: { checkedIn: true, checkedInAt: new Date() } }, { returnDocument: 'after' });
        if (result) {
            return NextResponse.json({ ok: true, code: 'CHECKED_IN', message: 'เช็คอินสำเร็จ' });
        }
    } catch (e: any) {
        console.log('[CHECKIN]', rid, 'ERROR', e?.message);
        return NextResponse.json({ ok: false, message: e?.message ?? 'Server error' }, { status: 500 });
    }
}
```