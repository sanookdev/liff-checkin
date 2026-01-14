/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <img src={`/layout/images/Thammasat_University.png`} alt="Logo" height="20" className="mr-2" />
            
            <span className="font-medium ml-2">2025 Office of Information and Communication Technology</span>
        </div>
    );
};

export default AppFooter;
