1.**สร้าง Foder registrations_admin เป็นไฟล์หลักของโปรเจกต์ Node.js ที่ทำหน้าที่ดูรายชื่อคนลงทะเบียน**

-   ใน Foder (full-page) -> registrations_admin -> page.tsx

```javascript
'use client';

import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';

type Row = {
    lineUserId: string;
    displayName?: string;
    department?: string;
    checkedIn?: boolean;
    checkedInAt?: string | null;
    createdAt?: string | null;
};

export default function RegistrationsPage() {
    const [q, setQ] = useState('');
    const [checked, setChecked] = useState<'all' | 'true' | 'false'>('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);
    const [total, setTotal] = useState(0);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

    const load = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set('q', q.trim());
            if (checked !== 'all') params.set('checked', checked);
            params.set('page', String(page));
            params.set('limit', String(limit));

            const res = await fetch(`/api/registrations?${params.toString()}`);
            const data = await res.json();

            if (!res.ok || !data.ok) {
                await Swal.fire({
                    icon: 'error',
                    title: 'โหลดรายการไม่สำเร็จ',
                    text: data?.message || `HTTP ${res.status}`
                });
                return;
            }

            setRows(data.rows || []);
            setTotal(data.total || 0);
        } finally {
            setLoading(false);
        }
    };

    // โหลดเมื่อ filter/page เปลี่ยน
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, limit, checked]);

    // search แบบกดปุ่ม
    const onSearch = async () => {
        setPage(1);
        await load();
    };

    return (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
            <h2>รายชื่อผู้ลงทะเบียน</h2>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 180px 140px 120px',
                    gap: 10,
                    marginTop: 12,
                    alignItems: 'center'
                }}
            >
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหา ชื่อ / หน่วยงาน / LineUserId" style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }} />

                <select
                    value={checked}
                    onChange={(e) => {
                        setChecked(e.target.value as any);
                        setPage(1);
                    }}
                    style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
                >
                    <option value="all">ทั้งหมด</option>
                    <option value="true">เช็คอินแล้ว</option>
                    <option value="false">ยังไม่เช็คอิน</option>
                </select>

                <select
                    value={limit}
                    onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                    }}
                    style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
                >
                    <option value={10}>10 / หน้า</option>
                    <option value={20}>20 / หน้า</option>
                    <option value={50}>50 / หน้า</option>
                    <option value={100}>100 / หน้า</option>
                </select>

                <button
                    onClick={onSearch}
                    disabled={loading}
                    style={{
                        padding: 12,
                        borderRadius: 10,
                        border: 'none',
                        background: '#2563eb',
                        color: 'white',
                        fontWeight: 800,
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    ค้นหา
                </button>
            </div>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>ทั้งหมด: {total.toLocaleString()} รายการ</div>

            <div style={{ marginTop: 12, border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#000000', textAlign: 'left' }}>
                                <th style={{ padding: 10 }}>ชื่อ</th>
                                <th style={{ padding: 10 }}>หน่วยงาน</th>
                                <th style={{ padding: 10 }}>สถานะเช็คอิน</th>
                                <th style={{ padding: 10 }}>เวลาเช็คอิน</th>
                                <th style={{ padding: 10 }}>เวลาลงทะเบียน</th>
                                <th style={{ padding: 10 }}>LineUserId</th>
                                <th style={{ padding: 10 }}>ดู</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 14 }}>
                                        กำลังโหลด...
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 14, opacity: 0.7 }}>
                                        ไม่พบข้อมูล
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.lineUserId} style={{ borderTop: '1px solid #000000' }}>
                                        <td style={{ padding: 10, fontWeight: 700 }}>{r.displayName || '-'}</td>
                                        <td style={{ padding: 10 }}>{r.department || '-'}</td>
                                        <td style={{ padding: 10 }}>{r.checkedIn ? '✅ เช็คอินแล้ว' : '⏳ ยังไม่เช็คอิน'}</td>
                                        <td style={{ padding: 10 }}>{r.checkedInAt ? new Date(r.checkedInAt).toLocaleString('th-TH') : '-'}</td>
                                        <td style={{ padding: 10 }}>{r.createdAt ? new Date(r.createdAt).toLocaleString('th-TH') : '-'}</td>
                                        <td style={{ padding: 10, fontSize: 12, opacity: 0.8 }}>{r.lineUserId}</td>
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTop: '1px solid #eee' }}>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}>
                        ก่อนหน้า
                    </button>

                    <div style={{ fontSize: 13 }}>
                        หน้า {page} / {totalPages}
                    </div>

                    <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #ddd', background: '#fff' }}>
                        ถัดไป
                    </button>
                </div>
            </div>
        </main>
    );
}
```
