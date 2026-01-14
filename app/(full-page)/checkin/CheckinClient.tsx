'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

declare global {
    interface Window {
        liff: any;
    }
}

type Profile = { userId: string; displayName: string; pictureUrl?: string };

export default function CheckinClient() {
    const searchParams = useSearchParams();
    const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkedInOnce, setCheckedInOnce] = useState(false);
    const autoFiredRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            try {
                if (!window.liff) {
                    await new Promise<void>((resolve, reject) => {
                        const existing = document.querySelector('script[data-liff-sdk="true"]');
                        if (existing) return resolve();

                        const s = document.createElement('script');
                        s.src = 'https://static.line-scdn.net/liff/edge/2/sdk.js';
                        s.async = true;
                        s.setAttribute('data-liff-sdk', 'true');
                        s.onload = () => resolve();
                        s.onerror = () => reject(new Error('Failed to load LIFF SDK'));
                        document.body.appendChild(s);
                    });
                }

                const liffId = process.env.NEXT_PUBLIC_LIFF_ID_checkin;
                if (!liffId) throw new Error('Missing NEXT_PUBLIC_LIFF_ID_checkin');

                await window.liff.init({ liffId });

                if (!window.liff.isLoggedIn()) {
                    window.liff.login();
                    return;
                }

                const p = await window.liff.getProfile();
                if (!cancelled) {
                    setProfile({ userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl });
                }
            } catch (e: any) {
                console.error('LIFF init error:', e);
                if (!cancelled) {
                    await Swal.fire({ icon: 'error', title: 'LIFF error', text: e?.message || 'LIFF init error' });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        init();
        return () => {
            cancelled = true;
        };
    }, []);

    const doCheckin = async (opts?: { silent?: boolean }) => {
        if (submitting || checkedInOnce) return;

        if (!token) {
            await Swal.fire({
                icon: 'warning',
                title: 'ต้องสแกน QR ก่อน',
                text: 'กรุณาสแกน QR กลางจากแอดมิน แล้วเข้าหน้านี้ใหม่',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        if (!profile) {
            await Swal.fire({
                icon: 'warning',
                title: 'ไม่พบข้อมูลผู้ใช้',
                text: 'กรุณาเปิดหน้านี้ผ่านแอป LINE',
                confirmButtonText: 'ตกลง'
            });
            return;
        }

        setSubmitting(true);
        try {
            if (!opts?.silent) {
                Swal.fire({
                    title: 'กำลังเช็คอิน...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });
            }

            const res = await fetch('/api/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lineUserId: profile.userId, token })
            });

            const text = await res.text();
            const data = text ? JSON.parse(text) : {};
            if (!opts?.silent) Swal.close();

            const checkedAtText = data?.checkedInAt ? new Date(data.checkedInAt).toLocaleString('th-TH') : new Date().toLocaleString('th-TH');

            if (res.ok && data?.code === 'CHECKED_IN') {
                setCheckedInOnce(true);

                await Swal.fire({
                    icon: 'success',
                    title: 'เช็คอินสำเร็จ',
                    html: `<b>${profile.displayName}</b><br/>เวลา: ${checkedAtText}`,
                    confirmButtonText: 'ตกลง'
                });

                if (window.liff?.isInClient?.()) {
                    await window.liff.sendMessages([{ type: 'text', text: `✅ เช็คอินสำเร็จ\nชื่อ: ${profile.displayName}\nเวลา: ${checkedAtText}` }]);
                    setTimeout(() => window.liff.closeWindow(), 1200);
                }
                return;
            }

            if (data?.code === 'ALREADY_CHECKED_IN') {
                setCheckedInOnce(true);

                await Swal.fire({
                    icon: 'info',
                    title: 'คุณเช็คอินแล้ว',
                    html: `เวลา: ${data.checkedInAt ? new Date(data.checkedInAt).toLocaleString('th-TH') : '-'}`,
                    confirmButtonText: 'ตกลง'
                });

                if (window.liff?.isInClient?.()) {
                    await window.liff.sendMessages([
                        {
                            type: 'text',
                            text: `ℹ️ คุณเช็คอินไปแล้ว\nชื่อ: ${profile.displayName}\nเวลา: ` + `${data.checkedInAt ? new Date(data.checkedInAt).toLocaleString('th-TH') : '-'}`
                        }
                    ]);
                    setTimeout(() => window.liff.closeWindow(), 1000);
                }
                return;
            }

            if (data?.code === 'QR_EXPIRED' || data?.code === 'QR_INVALID' || data?.code === 'NO_QR') {
                await Swal.fire({
                    icon: 'warning',
                    title: 'QR ใช้งานไม่ได้',
                    text: data?.message || 'กรุณาสแกน QR ใหม่อีกครั้ง',
                    confirmButtonText: 'ตกลง'
                });
                return;
            }

            if (data?.code === 'NOT_REGISTERED') {
                await Swal.fire({
                    icon: 'warning',
                    title: 'ยังไม่พบการลงทะเบียน',
                    text: 'กรุณาลงทะเบียนก่อนทำการเช็คอิน',
                    confirmButtonText: 'ตกลง'
                });
                return;
            }

            await Swal.fire({
                icon: 'error',
                title: 'เช็คอินไม่สำเร็จ',
                text: data?.message || `เกิดข้อผิดพลาด (HTTP ${res.status})`,
                confirmButtonText: 'ตกลง'
            });
        } catch (e: any) {
            Swal.close();
            await Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: e?.message || 'Server error',
                confirmButtonText: 'ตกลง'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // auto checkin
    useEffect(() => {
        if (loading) return;
        if (!profile) return;
        if (!token) return;
        if (autoFiredRef.current) return;

        autoFiredRef.current = true;
        doCheckin({ silent: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, profile, token]);

    if (loading) return <div style={{ padding: 16 }}>กำลังโหลด...</div>;

    return (
        <main style={{ maxWidth: 520, margin: '0 auto', padding: 16 }}>
            <h2>เช็คอิน</h2>

            {!token && (
                <div style={{ marginBottom: 12, padding: 12, borderRadius: 12, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
                    <div style={{ fontWeight: 900 }}>⚠️ ต้องสแกน QR กลางก่อน</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>กรุณาสแกน QR จากแอดมิน แล้วระบบจะเปิดหน้านี้พร้อม token</div>
                </div>
            )}

            {profile && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                    <img src={profile.pictureUrl || ''} alt="" width={52} height={52} style={{ borderRadius: 999, background: '#eee' }} />
                    <div>
                        <div style={{ fontWeight: 800 }}>{profile.displayName}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{profile.userId}</div>
                    </div>
                </div>
            )}

            <button
                onClick={() => doCheckin()}
                disabled={!profile || submitting || checkedInOnce || !token}
                style={{
                    width: '100%',
                    padding: 12,
                    borderRadius: 10,
                    border: 'none',
                    opacity: !profile || submitting || checkedInOnce || !token ? 0.6 : 1,
                    background: '#2563eb',
                    color: 'white',
                    fontWeight: 800,
                    cursor: !profile || submitting || checkedInOnce || !token ? 'not-allowed' : 'pointer'
                }}
            >
                {submitting ? 'กำลังเช็คอิน...' : checkedInOnce ? 'เช็คอินแล้ว' : token ? 'กดเช็คอิน' : 'ต้องสแกน QR ก่อน'}
            </button>

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>* ถ้าเปิดผ่าน LINE app จะส่งข้อความยืนยันและปิดหน้าต่างอัตโนมัติ</div>
        </main>
    );
}
