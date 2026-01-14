1.**สร้าง Folder checkin เป็น Folder หลักของโปรเจกต์ที่ทำหน้าที่เป็นการเรียกใช้หน้าสำหรับให้ User Checkin**

-   ใน Foder (Full-page) -> checkin -> page.tsx

```javascript
"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    liff: any;
  }
}

type Profile = { userId: string; displayName: string; pictureUrl?: string };

export default function CheckinPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "already" | "not_registered" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      try {
        // Load LIFF SDK
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://static.line-scdn.net/liff/edge/2/sdk.js";
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load LIFF SDK"));
          document.body.appendChild(s);
        });

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) throw new Error("Missing NEXT_PUBLIC_LIFF_ID");

        await window.liff.init({ liffId });

        if (!window.liff.isLoggedIn()) {
          window.liff.login();
          return;
        }

        const p = await window.liff.getProfile();
        setProfile({ userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl });
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "LIFF init error");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const doCheckin = async () => {
  if (!profile) {
    await Swal.fire({
      icon: "warning",
      title: "ไม่พบข้อมูลผู้ใช้",
      text: "กรุณาเปิดหน้านี้ผ่านแอป LINE",
      confirmButtonText: "ตกลง",
    });
    return;
  }

  try {
    Swal.fire({
      title: "กำลังเช็คอิน...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lineUserId: profile.userId }),
    });

    const data = await res.json();
    Swal.close();

    /* ✅ เช็คอินสำเร็จ */
    if (res.ok && data.ok) {
      await Swal.fire({
        icon: "success",
        title: "เช็คอินสำเร็จ",
        html: `
          <b>${profile.displayName}</b><br/>
          เวลา: ${new Date(data.checkedInAt).toLocaleString()}
        `,
        timer: 1500,
        showConfirmButton: false,
      });

      if (window.liff?.isInClient?.()) {
        await window.liff.sendMessages([
          { type: "text", text: "เช็คอินสำเร็จ ✅" },
        ]);
        setTimeout(() => window.liff.closeWindow(), 1800);
      }

      return;
    }

    /* ❌ เช็คอินซ้ำ */
    if (data?.code === "ALREADY_CHECKED_IN") {
      await Swal.fire({
        icon: "error",
        title: "เช็คอินซ้ำไม่ได้",
        html: `
          คุณเช็คอินไปแล้ว<br/>
          เวลา: ${data.checkedInAt ? new Date(data.checkedInAt).toLocaleString() : "-"}
        `,
        confirmButtonText: "ตกลง",
      });
      return;
    }

    /* ❌ ยังไม่ลงทะเบียน */
    if (data?.code === "NOT_REGISTERED") {
      await Swal.fire({
        icon: "warning",
        title: "ยังไม่พบการลงทะเบียน",
        text: "กรุณาลงทะเบียนก่อนทำการเช็คอิน",
        confirmButtonText: "ตกลง",
      });
      return;
    }

    /* ❌ กรณีอื่น ๆ */
    await Swal.fire({
      icon: "error",
      title: "เช็คอินไม่สำเร็จ",
      text: data?.message || "เกิดข้อผิดพลาด",
      confirmButtonText: "ตกลง",
    });

  } catch (e: any) {
    Swal.close();
    await Swal.fire({
      icon: "error",
      title: "เกิดข้อผิดพลาด",
      text: e?.message || "Server error",
      confirmButtonText: "ตกลง",
    });
  }
};


  if (loading) return <div style={{ padding: 16 }}>กำลังโหลด...</div>;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
      <h2>เช็คอิน</h2>

      {profile && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.pictureUrl || ""}
            alt=""
            width={52}
            height={52}
            style={{ borderRadius: 999, background: "#eee" }}
          />
          <div>
            <div style={{ fontWeight: 800 }}>{profile.displayName}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{profile.userId}</div>
          </div>
        </div>
      )}

      {message && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            background:
              status === "success"
                ? "#e8fff0"
                : status === "already"
                ? "#fff0f0"
                : status === "not_registered"
                ? "#fff8e5"
                : "#f3f4f6",
            marginBottom: 12,
          }}
        >
          {message}
        </div>
      )}

      <button
        onClick={doCheckin}
        disabled={!profile || status === "success"}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "none",
          background: "#2563eb",
          color: "white",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        กดเช็คอิน
      </button>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        * ถ้าเปิดผ่าน LINE app จะส่งข้อความยืนยันและปิดหน้าต่างอัตโนมัติ
      </div>
    </main>
  );
}
```
