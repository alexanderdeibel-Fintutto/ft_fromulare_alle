import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'default', text = '' }) {
    const sizes = {
        small: 'w-4 h-4',
        default: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <Loader2 className={`${sizes[size]} animate-spin text-blue-600`} />
            {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
    );
}