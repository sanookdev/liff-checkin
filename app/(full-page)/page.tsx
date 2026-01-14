export default function HomePage() {
    return (
        <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
            <h1 style={{ marginBottom: 8 }}>ระบบลงทะเบียนผ่าน LINE LIFF</h1>
            <p style={{ marginTop: 0, opacity: 0.8 }}>
                เปิดหน้านี้ผ่าน LIFF ในแอป LINE เพื่อให้ส่งข้อความยืนยันอัตโนมัติได้
            </p>

            <a
                href="/register"
                style={{
                    display: "inline-block",
                    padding: "12px 16px",
                    background: "#06C755",
                    color: "white",
                    borderRadius: 10,
                    textDecoration: "none",
                    fontWeight: 700,
                }}
            >
                ไปหน้าลงทะเบียน
            </a>
            <a
                href="/checkin"
                style={{
                    display: "inline-block",
                    padding: "12px 16px",
                    background: "#06C755",
                    color: "white",
                    borderRadius: 10,
                    textDecoration: "none",
                    fontWeight: 700,
                }}
            >
                ไปหน้าเช็คอิน
            </a>
        </main>
    );
}