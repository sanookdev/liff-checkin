'use client';

import { Suspense } from 'react';
import CheckinClient from './CheckinClient';

export default function Page() {
    return (
        <Suspense fallback={<div style={{ padding: 16 }}>กำลังโหลด...</div>}>
            <CheckinClient />
        </Suspense>
    );
}