import { useI18n, type Lang } from "@/lib/i18n";

const flags: Record<Lang, string> = {
  "pt-BR": "🇧🇷",
  "en-GB": "🇬🇧",
};

const LanguageSelector = () => {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
      {(Object.keys(flags) as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`text-lg px-2 py-1 rounded-md transition-all ${
            lang === l ? "bg-primary/20 scale-110" : "opacity-50 hover:opacity-80"
          }`}
          aria-label={l}
        >
          {flags[l]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
