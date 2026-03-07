/**
 * Utility — maps icon name strings to themed SVG icon components.
 * Kept separate from Icons.tsx so Vite Fast Refresh stays happy
 * (mixing React components and non-component exports in one file
 * causes the "incompatible export" HMR warning).
 */
import {
    IconReceipt,
    IconIdCard,
    IconHome,
    IconUsers,
    IconBaby,
    IconDocument,
    IconMap,
    IconKey,
    IconTransfer,
    IconShield,
} from '../components/Icons';

export function getFormIcon(iconName: string, size = 24, color = 'currentColor') {
    const props = { size, color };
    switch (iconName) {
        case 'receipt': return <IconReceipt  {...props} />;
        case 'id-card': return <IconIdCard   {...props} />;
        case 'home': return <IconHome     {...props} />;
        case 'users': return <IconUsers    {...props} />;
        case 'baby': return <IconBaby     {...props} />;
        case 'document': return <IconDocument {...props} />;
        case 'map': return <IconMap      {...props} />;
        case 'key': return <IconKey      {...props} />;
        case 'transfer': return <IconTransfer {...props} />;
        case 'shield': return <IconShield   {...props} />;
        default: return <IconDocument {...props} />;
    }
}
