/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import AppMenuitem from './AppMenuitem';
import { LayoutContext } from './context/layoutcontext';
import { MenuProvider } from './context/menucontext';
import Link from 'next/link';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { layoutConfig } = useContext(LayoutContext);

    const model: AppMenuItem[] = [
        {
            label: 'MENU',
            items: [
                { label: 'หน้าแรก', icon: 'pi pi-fw pi-home', to: '/Home' },
                { label: 'แก้ไขรหัสผ่านผู้ใช้', icon: 'pi pi-fw pi-key', to: '/ChangePassword' },
                { label: 'ออกจากระบบ', icon: 'pi pi-fw pi-sign-out', to: '/' }
            ],
        }
    ];

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? <AppMenuitem item={item} root={true} index={i} key={item.label} /> : <li className="menu-separator"></li>;
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;
