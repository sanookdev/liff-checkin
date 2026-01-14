/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LiffProfile = {
    userId: string;
    displayName: string;
    pictureUrl?: string;
};

declare global {
    interface Window {
        liff: any;
    }
}

export default function RegisterPage() {
    const router = useRouter();

    const [profile, setProfile] = useState<LiffProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // โหลด LIFF + login + getProfile
    useEffect(() => {
        const init = async () => {
            try {
                setError(null);

                // 1) Load LIFF SDK
                await new Promise<void>((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
                    s.onload = () => resolve();
                    s.onerror = () => reject(new Error('Failed to load LIFF SDK'));
                    document.body.appendChild(s);
                });

                // 2) init
                const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
                if (!liffId) throw new Error('Missing NEXT_PUBLIC_LIFF_ID in .env.local');

                await window.liff.init({ liffId });

                // 3) login if not logged in
                if (!window.liff.isLoggedIn()) {
                    window.liff.login();
                    return;
                }

                // 4) profile
                const p = await window.liff.getProfile();
                setProfile({
                    userId: p.userId,
                    displayName: p.displayName,
                    pictureUrl: p.pictureUrl
                });
            } catch (e: any) {
                setError(e?.message || 'LIFF init error');
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    const validate = () => {
        if (!profile) return 'ไม่พบข้อมูลผู้ใช้ (โปรดเปิดผ่าน LIFF และล็อกอิน)';
        if (!phone.trim()) return 'กรุณากรอกเบอร์โทร';
        if (!department.trim()) return 'กรุณากรอกหน่วยงาน/คณะ';
        return null;
    };

    const onSubmit = async () => {
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        if (!profile) return;

        setSaving(true);
        setError(null);

        try {
            // 1) Save to DB
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lineUserId: profile.userId,
                    displayName: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    phone,
                    department,
                    createdAtClient: new Date().toISOString()
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Register failed');

            // 2) Send LIFF Message (ไม่ใช้ push)
            if (!window.liff.isInClient()) {
                // เปิดนอก LINE app -> ส่งข้อความไม่ได้
                throw new Error('ต้องเปิดผ่านแอป LINE เพื่อส่งข้อความอัตโนมัติ (LIFF Message)');
            }

            const msgText = data?.already ? `คุณเคยลงทะเบียนไว้แล้ว ✅\nชื่อ: ${profile.displayName}` : `ลงทะเบียนสำเร็จ ✅\nชื่อ: ${profile.displayName}\nหน่วยงาน: ${department}\nโทร: ${phone}`;

            await window.liff.sendMessages([{ type: 'text', text: msgText }]);

            // 3) ปิดหน้าต่าง LIFF เพื่อให้ user กลับไปแชทและเห็นข้อความทันที
            window.liff.closeWindow();

            // ถ้าคุณอยาก “ไม่ปิด” ให้ใช้บรรทัดนี้แทน:
            // router.push("/success");
        } catch (e: any) {
            setError(e?.message || 'Submit error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div style={{ padding: 16 }}>กำลังโหลด...</div>;
    }

    return (
        <main style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
            <h2 style={{ marginBottom: 6 }}>ลงทะเบียนผ่าน LINE (LIFF)</h2>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>* หลังลงทะเบียน ระบบจะส่งข้อความยืนยันผ่าน LIFF Message และปิดหน้าต่างอัตโนมัติ</div>

            {error && <div style={{ padding: 12, borderRadius: 10, background: '#ffe8e8', color: '#b00020', marginBottom: 12 }}>{error}</div>}

            {profile ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profile.pictureUrl || ''} alt="" width={52} height={52} style={{ borderRadius: 999, background: '#eee' }} />
                    <div>
                        <div style={{ fontWeight: 800 }}>{profile.displayName}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{profile.userId}</div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: 12, borderRadius: 10, background: '#fff3cd', marginBottom: 12 }}>ไม่พบข้อมูลผู้ใช้ (โปรดเปิดผ่าน LIFF และล็อกอิน)</div>
            )}

            <label style={{ fontWeight: 700 }}>เบอร์โทร</label>
            <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 08x-xxx-xxxx"
                style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #ddd',
                    marginTop: 6,
                    marginBottom: 12
                }}
            />

            <label style={{ fontWeight: 700 }}>หน่วยงาน/คณะ</label>
            <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น สทส."
                style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: '1px solid #ddd',
                    marginTop: 6,
                    marginBottom: 16
                }}
            />

            <button
                onClick={onSubmit}
                disabled={saving}
                style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: 'none',
                    background: saving ? '#a7e7bd' : '#06C755',
                    color: 'white',
                    fontWeight: 900,
                    cursor: saving ? 'not-allowed' : 'pointer'
                }}
            >
                {saving ? 'กำลังบันทึก...' : 'ยืนยันลงทะเบียน'}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>ถ้าเปิดจาก browser นอก LINE ระบบจะบันทึก DB ได้ แต่จะส่งข้อความอัตโนมัติไม่ได้</div>
        </main>
    );
}