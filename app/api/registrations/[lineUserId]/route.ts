import { NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    context: { params: Promise<{ lineUserId: string }> } // ✅ params เป็น Promise
) {
    try {
        const { lineUserId: raw } = await context.params; // ✅ ต้อง await
        const lineUserId = decodeURIComponent(raw || '');

        if (!lineUserId) {
            return NextResponse.json({ ok: false, message: 'Missing lineUserId' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db('checkin_db');
        const col = db.collection('registrants');

        const row = await col.findOne(
            { lineUserId },
            {
                projection: {
                    _id: 0,
                    lineUserId: 1,
                    displayName: 1,
                    department: 1,
                    checkedIn: 1,
                    checkedInAt: 1,
                    createdAt: 1,
                    pictureUrl: 1
                }
            }
        );

        if (!row) {
            return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
        }

        return NextResponse.json({ ok: true, row });
    } catch (e: any) {
        console.error('REG DETAIL ERROR:', e);
        return NextResponse.json({ ok: false, message: e?.message ?? 'Server error' }, { status: 500 });
    }
}
