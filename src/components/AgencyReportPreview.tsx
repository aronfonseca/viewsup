import { Sparkles, TrendingUp, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  agencyName: string;
  agencyLogoUrl: string | null;
  primaryColor: string;
  website?: string;
}

/**
 * Visual preview that mirrors the white-labeled report header / accent styling
 * applied at PDF export time on the Results page.
 */
const AgencyReportPreview = ({ agencyName, agencyLogoUrl, primaryColor, website }: Props) => {
  const { t } = useI18n();
  const accent = primaryColor || "#7c3aed";

  return (
    <div
      className="rounded-xl overflow-hidden border border-border"
      style={{ background: "#0a0f1e" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b"
        style={{ borderColor: `${accent}33`, background: `linear-gradient(90deg, ${accent}22, transparent)` }}
      >
        <div className="flex items-center gap-2.5">
          {agencyLogoUrl ? (
            <img src={agencyLogoUrl} alt={agencyName} className="h-7 w-7 object-contain" />
          ) : (
            <Sparkles className="h-6 w-6" style={{ color: accent }} />
          )}
          <span className="text-base font-bold text-white">{agencyName}</span>
        </div>
        {website && <span className="text-xs text-white/60 truncate max-w-[140px]">{website.replace(/^https?:\/\//, "")}</span>}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-white/50 mb-1">Análise para</p>
          <h3 className="text-xl font-bold text-white">@cliente_demo</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg p-3 border" style={{ borderColor: `${accent}55`, background: `${accent}15` }}>
            <Trophy className="h-4 w-4 mb-1" style={{ color: accent }} />
            <p className="text-[10px] text-white/60">Score Geral</p>
            <p className="text-lg font-bold text-white">82</p>
          </div>
          <div className="rounded-lg p-3 bg-white/5 border border-white/10">
            <TrendingUp className="h-4 w-4 mb-1 text-white/70" />
            <p className="text-[10px] text-white/60">Hook</p>
            <p className="text-lg font-bold text-white">76</p>
          </div>
          <div className="rounded-lg p-3 bg-white/5 border border-white/10">
            <Sparkles className="h-4 w-4 mb-1 text-white/70" />
            <p className="text-[10px] text-white/60">Retenção</p>
            <p className="text-lg font-bold text-white">88</p>
          </div>
        </div>

        <div className="rounded-lg p-3 border" style={{ borderColor: `${accent}40`, background: `${accent}10` }}>
          <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: accent }}>Insight estratégico</p>
          <p className="text-xs text-white/80 leading-relaxed">
            O perfil tem um hook visual forte mas perde audiência nos primeiros 3s — recomendamos cortes mais agressivos e CTAs visuais.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-[10px] text-white/40">Relatório gerado por {agencyName}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: `${accent}22`, color: accent }}
          >
            Powered by IA
          </span>
        </div>
      </div>
    </div>
  );
};

export default AgencyReportPreview;
