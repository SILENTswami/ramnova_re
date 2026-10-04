import { Baby, Bean, Car, Droplets, Lightbulb, Milk, Wine } from "lucide-react";
import type { SafetyAdvice, SafetyStatus, SafetyTopic } from "@/lib/catalog";

const topics: Record<SafetyTopic, { label: string; Icon: typeof Wine }> = {
  alcohol: { label: "Alcohol", Icon: Wine },
  pregnancy: { label: "Pregnancy", Icon: Baby },
  breastfeeding: { label: "Breastfeeding", Icon: Milk },
  driving: { label: "Driving", Icon: Car },
  kidney: { label: "Kidney", Icon: Bean },
  liver: { label: "Liver", Icon: Droplets },
};

// Every status carries a text label, so colour is never the only signal.
const statuses: Record<SafetyStatus, { label: string; tone: "safe" | "caution" | "unsafe" }> = {
  safe: { label: "Safe", tone: "safe" },
  "safe-if-prescribed": { label: "Safe if prescribed", tone: "safe" },
  caution: { label: "Use with caution", tone: "caution" },
  consult: { label: "Consult your doctor", tone: "caution" },
  unsafe: { label: "Unsafe", tone: "unsafe" },
};

export function SafetyAdvicePanel({ advice, seoName }: { advice: SafetyAdvice[]; seoName: string }) {
  return (
    <section className="info-block" id="safety-advice">
      <h2>Safety advice for {seoName}</h2>
      <ul className="safety-advice-grid">
        {advice.map(({ topic, status, note }) => {
          const { label, Icon } = topics[topic];
          const pill = statuses[status];
          return (
            <li className="safety-advice-card" key={topic}>
              <div className="safety-advice-head">
                <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                <h3>{label}</h3>
              </div>
              <span className={`status-pill status-pill-${pill.tone}`}>{pill.label}</span>
              <p>{note}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function QuickTips({ tips }: { tips: string[] }) {
  return (
    <section className="info-block" id="quick-tips">
      <h2>Quick tips</h2>
      <ul className="quick-tips">
        {tips.map((tip) => (
          <li key={tip}>
            <Lightbulb size={18} strokeWidth={1.75} aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
