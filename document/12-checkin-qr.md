1.**สร้าง Foder checkin-qr เป็นไฟล์หลักของโปรเจกต์ Node.js ที่ทำหน้าที่สร้าง qr code สำหรับ checkin**

-   ใน Foder (Full-page) -> checkin-qr -> page.tsx

```javascript
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import Swal from 'sweetalert2';

type TokenRes = {
    ok: boolean;
    token?: string;
    ts?: number;
    ttl?: number; // seconds
    message?: string;
};

export default function AdminCheckinQRPage() {
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string>('');
    const [issuedAt, setIssuedAt] = useState<number>(0);
    const [ttl, setTtl] = useState<number>(120);
    const [now, setNow] = useState<number>(Date.now());

    // ✅ เก็บ origin ของเว็บ (ใช้บน client เท่านั้น)
    const [origin, setOrigin] = useState<string>('');

    const refreshIntervalRef = useRef<any>(null);
    const tickIntervalRef = useRef<any>(null);

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const expiresAt = useMemo(() => (issuedAt ? issuedAt + ttl * 1000 : 0), [issuedAt, ttl]);
    const remainMs = useMemo(() => Math.max(0, expiresAt - now), [expiresAt, now]);
    const remainSec = Math.ceil(remainMs / 1000);

    const fetchToken = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/checkin/token', { cache: 'no-store' });
            const data: TokenRes = await res.json();

            if (!res.ok || !data.ok || !data.token) {
                await Swal.fire({
                    icon: 'error',
                    title: 'สร้าง QR ไม่สำเร็จ',
                    text: data?.message || `HTTP ${res.status}`
                });
                return;
            }

            setToken(data.token);
            setIssuedAt(data.ts || Date.now());
            setTtl(data.ttl || 120);
            setNow(Date.now());
        } finally {
            setLoading(false);
        }
    };

    // init + auto refresh token ทุก 120 วินาที
    useEffect(() => {
        fetchToken();

        refreshIntervalRef.current = setInterval(() => {
            fetchToken();
        }, 120000);

        tickIntervalRef.current = setInterval(() => {
            setNow(Date.now());
        }, 500);

        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
            if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ QR value = URL ไปหน้า checkin พร้อม token
    const qrValue = useMemo(() => {
        if (!origin || !token) return '';
        return `${origin}/checkin?token=${encodeURIComponent(token)}`;
    }, [origin, token]);

    const copyText = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            await Swal.fire({ icon: 'success', title: `คัดลอก ${label} แล้ว`, timer: 900, showConfirmButton: false });
        } catch {
            await Swal.fire({ icon: 'error', title: 'คัดลอกไม่สำเร็จ', text: 'Browser ไม่อนุญาตให้คัดลอก' });
        }
    };

    return (
        <main style={{ maxWidth: 980, margin: '0 auto', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Admin: QR กลางสำหรับเช็คอิน</h2>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
                        QR จะหมุนอัตโนมัติทุก <b>120 วินาที</b> และ token มีอายุประมาณ <b>{ttl}</b> วินาที
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>
                        ✅ ผู้ใช้สแกนแล้วจะเปิดหน้า: <b>/checkin?token=...</b>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        onClick={fetchToken}
                        disabled={loading}
                        style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: '1px solid #ddd',
                            background: '#111827',
                            color: '#fff',
                            fontWeight: 800,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'กำลังสร้าง...' : 'สร้างใหม่ทันที'}
                    </button>

                    <button
                        onClick={() => copyText(qrValue, 'ลิงก์ QR')}
                        disabled={!qrValue}
                        style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: '1px solid #ddd',
                            background: '#000000',
                            fontWeight: 800,
                            cursor: !qrValue ? 'not-allowed' : 'pointer'
                        }}
                    >
                        คัดลอกลิงก์ QR
                    </button>

                    <button
                        onClick={() => copyText(token, 'token')}
                        disabled={!token}
                        style={{
                            padding: '10px 12px',
                            borderRadius: 12,
                            border: '1px solid #ddd',
                            background: '#030000',
                            fontWeight: 800,
                            cursor: !token ? 'not-allowed' : 'pointer'
                        }}
                    >
                        คัดลอก token
                    </button>
                </div>
            </div>

            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {/* QR Card */}
                <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 900 }}>QR กลาง</div>
                        <div
                            style={{
                                padding: '6px 10px',
                                borderRadius: 999,
                                border: '1px solid #ddd',
                                fontSize: 12,
                                fontWeight: 800,
                                background: remainSec <= 10 ? '#000000' : '#000000'
                            }}
                        >
                            เหลือเวลา: {remainSec}s
                        </div>
                    </div>

                    <div
                        style={{
                            marginTop: 14,
                            display: 'flex',
                            justifyContent: 'center',
                            padding: 14,
                            borderRadius: 16,
                            background: '#fff',
                            border: '1px dashed #e5e7eb'
                        }}
                    >
                        {qrValue ? <QRCode value={qrValue} size={280} /> : <div style={{ padding: 24, opacity: 0.7 }}>{loading ? 'กำลังสร้าง QR...' : 'ยังไม่มี token'}</div>}
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.5 }}>
                        ✅ วิธีใช้งาน: ให้ผู้เข้าร่วมสแกน QR นี้ → LINE/Browser จะเปิดหน้า <b>/checkin</b> พร้อม token → ระบบเช็คอินด้วย lineUserId อัตโนมัติ
                    </div>
                </div>

                {/* Info Card */}
                <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
                    <div style={{ fontWeight: 900 }}>ข้อมูล (สำหรับ debug)</div>

                    <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10 }}>
                        <div style={{ opacity: 0.7 }}>Issued At</div>
                        <div>{issuedAt ? new Date(issuedAt).toLocaleString('th-TH') : '-'}</div>

                        <div style={{ opacity: 0.7 }}>Expires At</div>
                        <div>{expiresAt ? new Date(expiresAt).toLocaleString('th-TH') : '-'}</div>

                        <div style={{ opacity: 0.7 }}>TTL</div>
                        <div>{ttl} seconds</div>

                        <div style={{ opacity: 0.7 }}>QR URL</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{qrValue || '-'}</div>
                    </div>

                    <div style={{ marginTop: 12 }}>
                        <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 6 }}>Token string</div>
                        <textarea
                            value={token}
                            readOnly
                            style={{
                                width: '100%',
                                height: 220,
                                borderRadius: 12,
                                border: '1px solid #e5e7eb',
                                padding: 10,
                                fontSize: 12,
                                fontFamily: 'monospace',
                                resize: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>* หน้างานจริงแนะนำให้ใช้ “QR URL” เพื่อให้สแกนแล้วเข้าเช็คอินอัตโนมัติ</div>
                </div>
            </div>
        </main>
    );
}
```