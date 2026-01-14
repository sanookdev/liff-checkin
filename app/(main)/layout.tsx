import { Metadata } from 'next';
import Layout from '../../layout/layout';

interface AppLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'thammasat university',
    description: 'ระบบลงทะเบียนเข้าร่วมกิจกรรมงานการแข่งขันกีฬาภายในมหาวิทยาลัยธรรมศาสตร์',
    robots: { index: false, follow: false },
    viewport: { initialScale: 1, width: 'device-width' },
    openGraph: {
        type: 'website',
        title: 'thammasat university',
        url: 'thammasat university',
        description: 'thammasat university',
        images: ['https://www.primefaces.org/static/social/sakai-react.png'],
        ttl: 604800
    },
    icons: {
        icon: '/favicon.ico'
    }
};

export default function AppLayout({ children }: AppLayoutProps) {
    return <Layout>{children}</Layout>;
}
