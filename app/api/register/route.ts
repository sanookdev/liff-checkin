import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { lineUserId, displayName, pictureUrl, phone, department, createdAtClient } = body;

        if (!lineUserId || !phone || !department) {
            return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('line_register'); // ชื่อ database
        const col = db.collection('registrations'); // ชื่อ collection

        // กันซ้ำ
        const existing = await col.findOne({ lineUserId });
        if (existing) {
            return NextResponse.json({ ok: true, already: true });
        }

        await col.insertOne({
            lineUserId,
            displayName,
            pictureUrl,
            phone,
            department,
            createdAtClient: createdAtClient ?? null,
            createdAt: new Date(),

            // ✅ เพิ่มตามที่ต้องการ
            checkedIn: false,
            checkedInAt: null
        });

        return NextResponse.json({ ok: true, already: false });
    } catch (e: any) {
        console.error('REGISTER API ERROR:', e);
        return NextResponse.json({ ok: false, message: e?.message ?? 'Server error' }, { status: 500 });
    }
}