import { NextResponse } from 'next/server';
import clientPromise from '../../lib/mongodb';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function sign(data: string) {
    const secret = process.env.QR_SECRET || '';
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqual(a: string, b: string) {
    const ua = new TextEncoder().encode(a); // Uint8Array
    const ub = new TextEncoder().encode(b); // Uint8Array
    if (ua.length !== ub.length) return false;
    return crypto.timingSafeEqual(ua, ub);
}

export async function POST(req: Request) {
    const rid = crypto.randomUUID();

    try {
        const { lineUserId, token } = await req.json();
        console.log('[CHECKIN]', rid, 'lineUserId:', lineUserId);

        if (!lineUserId) {
            return NextResponse.json({ ok: false, message: 'Missing lineUserId' }, { status: 400 });
        }
        if (!token) {
            return NextResponse.json({ ok: false, code: 'NO_QR', message: 'ต้องสแกน QR กลางก่อนจึงจะเช็คอินได้' }, { status: 401 });
        }

        // ✅ 1) verify token (QR กลาง)
        let parsed: any;
        try {
            parsed = typeof token === 'string' ? JSON.parse(token) : token;
        } catch {
            return NextResponse.json({ ok: false, code: 'QR_INVALID', message: 'รูปแบบ QR ไม่ถูกต้อง' }, { status: 401 });
        }

        const { scope, ts, nonce, sig, ttl } = parsed || {};
        if (scope !== 'GLOBAL' || !ts || !nonce || !sig) {
            return NextResponse.json({ ok: false, code: 'QR_INVALID', message: 'QR ไม่ถูกต้อง' }, { status: 401 });
        }

        const ttlMs = Number(process.env.QR_TTL_SECONDS || ttl || 120) * 1000;
        if (Math.abs(Date.now() - Number(ts)) > ttlMs) {
            return NextResponse.json({ ok: false, code: 'QR_EXPIRED', message: 'QR หมดอายุ กรุณาสแกนใหม่' }, { status: 401 });
        }

        const expected = sign(`GLOBAL|${ts}|${nonce}`);
        if (!safeEqual(expected, String(sig))) {
            return NextResponse.json({ ok: false, code: 'QR_INVALID', message: 'QR ไม่ถูกต้อง' }, { status: 401 });
        }

        // ✅ 2) ทำเช็คอินตาม logic เดิมของคุณ
        const client = await clientPromise;
        const db = client.db('line_register');
        const col = db.collection('registrations');

        const existing = await col.findOne({ lineUserId }, { projection: { checkedIn: 1, checkedInAt: 1 } });

        if (!existing) {
            return NextResponse.json({ ok: false, code: 'NOT_REGISTERED', message: 'ยังไม่พบการลงทะเบียน' }, { status: 404 });
        }

        if (existing.checkedIn === true) {
            return NextResponse.json(
                {
                    ok: false,
                    code: 'ALREADY_CHECKED_IN',
                    message: 'คุณเช็คอินไปแล้ว',
                    checkedInAt: existing.checkedInAt ?? null
                },
                { status: 409 }
            );
        }

        const result = await col.findOneAndUpdate({ lineUserId, checkedIn: false }, { $set: { checkedIn: true, checkedInAt: new Date() } }, { returnDocument: 'after' });

        if (result) {
            return NextResponse.json({ ok: true, code: 'CHECKED_IN', message: 'เช็คอินสำเร็จ', checkedInAt: result.checkedInAt });
        }

        return NextResponse.json({ ok: false, message: 'Update failed' }, { status: 500 });
    } catch (e: any) {
        console.log('[CHECKIN]', rid, 'ERROR', e?.message);
        return NextResponse.json({ ok: false, message: e?.message ?? 'Server error' }, { status: 500 });
    }
}