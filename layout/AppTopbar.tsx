/* eslint-disable @next/next/no-img-element */

import Link from 'next/link';
import { classNames } from 'primereact/utils';
import React, { forwardRef, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { AppTopbarRef } from '@/types';
import { LayoutContext } from './context/layoutcontext';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Button } from 'primereact/button';

const AppTopbar = forwardRef<AppTopbarRef>((props, ref) => {
    const { layoutConfig, layoutState, onMenuToggle, showProfileSidebar } = useContext(LayoutContext);
    const menubuttonRef = useRef(null);
    const topbarmenuRef = useRef(null);
    const topbarmenubuttonRef = useRef(null);
    const router = useRouter();
    const [displaynameTh, setDisplaynameTh] = useState<any | null>(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current,
        topbarmenu: topbarmenuRef.current,
        topbarmenubutton: topbarmenubuttonRef.current
    }));
    //////////////////////////useEffect//////////////////////////
    useEffect(() => {
        const userData = localStorage.getItem('userData');
        const verify = localStorage.getItem('verify');
        if (userData && verify) {
            const parsedUserData = JSON.parse(userData);
            setDisplaynameTh(parsedUserData.displayname_th || '');
        } else if (!verify) {
            Swal.fire({
                position: 'center',
                icon: 'error',
                title: 'กรุณายืนยันตัวตน',
                text: 'ท่านไม่ได้กรุณายืนยันตัวตน กรุณากรุณายืนยันตัวตน',
                showConfirmButton: false,
                timer: 1000
            });
            router.push('/')
        } else {
            Swal.fire({
                position: 'center',
                icon: 'error',
                title: 'ท่านไม่ได้เข้าสู่ระบบ',
                text: 'ท่านไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบ',
                showConfirmButton: false,
                timer: 1000
            });
            router.push('/')
        }
    }, []);
    const handleLogout = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        Swal.fire({
            icon: 'warning',
            title: 'คุณต้องการออกจากระบบใช่หรือไม่',
            text: 'หากคุณออกจากระบบ คุณจะต้องเข้าสู่ระบบอีกครั้ง',
            showCancelButton: true,
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
            cancelButtonColor: '#d33',
            confirmButtonColor: '#3B82F6'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/';
            }
        });
    };
    return (
        <div className="layout-topbar">
            <Link href="/Home" className="layout-topbar-logo flex align-items-center gap-3">
                <img src={`/layout/images/Thammasat_University.png`} width="40" height="40" alt="logo" />
                <div className="text-container">
                    <p className="marquee-text">ระบบบริหารจัดการทะเบียนผู้ใช้งานอินเตอร์เน็ต</p>
                </div>
            </Link>


            <button ref={topbarmenubuttonRef} type="button" className="p-link layout-topbar-menu-button layout-topbar-button" onClick={showProfileSidebar}>
                <i className="pi pi-ellipsis-v" />
            </button>
            <div ref={topbarmenuRef} className={classNames('layout-topbar-menu', { 'layout-topbar-menu-mobile-active': layoutState.profileSidebarVisible })}>
                <Button label={displaynameTh} className="p-button-text p-button-secondary" disabled />
                <Link href="/">
                    <button type="button" className="p-link layout-topbar-button" onClick={handleLogout}>
                        <i className="pi pi-sign-out"></i>
                        <span>logout</span>
                    </button>
                </Link>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';

export default AppTopbar;
