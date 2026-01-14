1.**เพิ่มเข้าไปใน registrations_admin -> page.tsx เพื่อดูรายละเอียด**

```javascript
<th style={{ padding: 10 }}>ดู</th>

<td style={{ padding: 10 }}>
    <a
        href={`/registrations_admin/${encodeURIComponent(r.lineUserId)}`}
        style={{
            display: 'inline-block',
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid #ddd',
            textDecoration: 'none',
            fontWeight: 800
        }}
    >
        รายละเอียด
    </a>
</td>
```

2.**สร้าง Foder [lineUserId] อยู่ใน registrations_admin**

-   ใน Foder (full-page) -> registrations_admin -> [lineUserId] -> page.tsx

```javascript
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

type Row = {
    lineUserId: string;
    displayName?: string;
    department?: string;
    checkedIn?: boolean;
    checkedInAt?: string | null;
    createdAt?: string | null;

    // ✅ รูปแบบ URL (เช่นจาก LIFF profile.pictureUrl)
    pictureUrl?: string | null;

    // ✅ รูปแบบ base64 (ถ้าคุณเก็บเป็น data:image/...;base64,...)
    photoBase64?: string | null;
};

export default function RegistrationDetailPage() {
    const router = useRouter();
    const params = useParams<{ lineUserId: string }>();
    const lineUserId = decodeURIComponent(params?.lineUserId || '');

    const [loading, setLoading] = useState(true);
    const [row, setRow] = useState<Row | null>(null);

    // ✅ url รูปที่ใช้งานจริง (เลือกจาก pictureUrl ก่อน)
    const photoSrc = useMemo(() => {
        if (!row) return '';
        return (row.pictureUrl || row.photoBase64 || '').trim();
    }, [row]);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/registrations/${encodeURIComponent(lineUserId)}`, {
                cache: 'no-store'
            });
            const data = await res.json();

            if (!res.ok || !data.ok) {
                await Swal.fire({
                    icon: 'error',
                    title: 'โหลดรายละเอียดไม่สำเร็จ',
                    text: data?.message || `HTTP ${res.status}`
                });
                setRow(null);
                return;
            }

            setRow(data.row);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!lineUserId) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lineUserId]);

    return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid #ddd',
                        background: '#000000',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700
                    }}
                >
                    ← กลับ
                </button>
                <h2 style={{ margin: 0 }}>รายละเอียดผู้ลงทะเบียน</h2>
            </div>

            <div style={{ marginTop: 14, border: '1px solid #eee', borderRadius: 14, padding: 14 }}>
                {loading ? (
                    <div>กำลังโหลด...</div>
                ) : !row ? (
                    <div style={{ opacity: 0.7 }}>ไม่พบข้อมูล</div>
                ) : (
                    <>
                        {/* รูปโปรไฟล์ */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                            {photoSrc ? (
                                <img
                                    src={photoSrc}
                                    alt="profile"
                                    referrerPolicy="no-referrer" // ✅ กันบางเคสโหลดรูปภายนอก
                                    onError={(e) => {
                                        // ✅ fallback ถ้าโหลดรูปไม่ได้
                                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        const el = document.getElementById('photo-fallback');
                                        if (el) el.style.display = 'flex';
                                    }}
                                    style={{
                                        width: 140,
                                        height: 140,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '4px solid #e5e7eb',
                                        boxShadow: '0 8px 20px rgba(0,0,0,.15)'
                                    }}
                                />
                            ) : null}

                            <div
                                id="photo-fallback"
                                style={{
                                    width: 140,
                                    height: 140,
                                    borderRadius: '50%',
                                    background: '#e5e7eb',
                                    display: photoSrc ? 'none' : 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 48,
                                    fontWeight: 800,
                                    color: '#9ca3af'
                                }}
                            >
                                ?
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 10 }}>
                            <div style={{ opacity: 0.7 }}>ชื่อ</div>
                            <div style={{ fontWeight: 800 }}>{row.displayName || '-'}</div>

                            <div style={{ opacity: 0.7 }}>หน่วยงาน</div>
                            <div style={{ fontWeight: 700 }}>{row.department || '-'}</div>

                            <div style={{ opacity: 0.7 }}>สถานะเช็คอิน</div>
                            <div style={{ fontWeight: 800 }}>{row.checkedIn ? '✅ เช็คอินแล้ว' : '⏳ ยังไม่เช็คอิน'}</div>

                            <div style={{ opacity: 0.7 }}>เวลาเช็คอิน</div>
                            <div>{row.checkedInAt ? new Date(row.checkedInAt).toLocaleString('th-TH') : '-'}</div>

                            <div style={{ opacity: 0.7 }}>เวลาลงทะเบียน</div>
                            <div>{row.createdAt ? new Date(row.createdAt).toLocaleString('th-TH') : '-'}</div>

                            <div style={{ opacity: 0.7 }}>LineUserId</div>
                            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{row.lineUserId}</div>
                        </div>

                        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                            <button
                                onClick={load}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid #ddd',
                                    background: '#000000',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 800
                                }}
                            >
                                รีเฟรช
                            </button>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
```

3.**สร้าง Foder [lineUserId] อยู่ใน registrations**

-   ใน Foder (api) -> registrations -> [lineUserId] -> route.ts

```javascript
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
        const db = client.db('line_register');
        const col = db.collection('registrations');

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

```
