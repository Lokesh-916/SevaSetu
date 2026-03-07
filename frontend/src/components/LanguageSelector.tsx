import CustomSelect from './CustomSelect';

interface Props {
    language: string;
    setLanguage: (lang: string) => void;
}

const LANGUAGE_OPTIONS = [
    { value: 'en', label: '🇬🇧 English' },
    { value: 'hi', label: '🇮🇳 हिंदी' },
    { value: 'te', label: '🌐 తెలుగు' },
    { value: 'ta', label: '🌐 தமிழ்' },
    { value: 'kn', label: '🌐 ಕನ್ನಡ' },
    { value: 'mr', label: '🌐 मराठी' },
    { value: 'bn', label: '🌐 বাংলা' },
    { value: 'gu', label: '🌐 ગુજરાતી' },
];

export default function LanguageSelector({ language, setLanguage }: Props) {
    return (
        <CustomSelect
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={setLanguage}
            title="Select Language"
            maxWidth={150}
        />
    );
}
