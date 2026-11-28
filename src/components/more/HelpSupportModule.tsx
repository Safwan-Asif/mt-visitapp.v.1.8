import React, { useState } from 'react';
import { Check, ChevronDown, Copy, Mail, Phone, ShieldCheck } from 'lucide-react';
import { MoreSubViewHeader } from './MoreSharedUI';

interface HelpSupportModuleProps {
  onBack: () => void;
}

const QUICK_FAQS = [
  {
    q: 'How are Planogram Compliance bands scored?',
    a: 'Compliant requires 85% or higher, Partial spans 70%–84%, and Non-Compliant is below 70%. Both Brand-wise and Company-wise scores contribute to overall category compliance.'
  },
  {
    q: 'When should I submit a Request instead of editing locally?',
    a: 'Use Requests whenever a store requires a permanent PJP route change, approved planogram revision, POSM replenishment, or SAP outlet metadata correction.'
  },
  {
    q: 'What happens if shelf photos are taken with weak connectivity?',
    a: 'Completed audits and requests are safely cached on-device and automatically synced to the Google Sheets backend once connectivity stabilizes.'
  }
];

export const HelpSupportModule: React.FC<HelpSupportModuleProps> = ({ onBack }) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const supervisorPhone = '+974 4400 2026';
  const supervisorEmail = 'mt.supervisor@qfi.qa';

  const handleCopy = (label: string, val: string) => {
    try {
      navigator.clipboard.writeText(val);
      setCopiedKey(label);
      window.setTimeout(() => setCopiedKey(null), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="PREFERENCES & SUPPORT / ASSISTANCE"
        title="HELP & SUPPORT"
        subtitle="Supervisor contact & Modern Trade field quick guide"
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Basic Supervisor Contact Card */}
          <section className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-4 border-[#008DFF]/35">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] dark:text-[#00C8FF]">
                  SUPERVISOR CONTACT CARD
                </p>
                <h2 className="font-heading text-2xl font-extrabold uppercase text-[var(--text-primary)] mt-0.5">
                  Modern Trade Field Desk
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Qatar Food Industries · Sun–Thu · 07:30 – 17:00 AST
                </p>
              </div>
              <div className="w-11 h-11 rounded-[14px] bg-[#0066FF]/15 border border-[#008DFF]/40 flex items-center justify-center text-[#0066FF] dark:text-[#00C8FF] shrink-0">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="cockpit-surface-elevated rounded-[14px] p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Direct Phone
                  </p>
                  <a
                    href={`tel:${supervisorPhone.replace(/\s+/g, '')}`}
                    className="text-xs font-mono font-bold text-[var(--text-primary)] hover:text-[#00C8FF] ov-tabular"
                  >
                    {supervisorPhone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${supervisorPhone.replace(/\s+/g, '')}`}
                    className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C8FF] flex items-center justify-center"
                    aria-label="Call Supervisor"
                  >
                    <Phone size={15} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('phone', supervisorPhone)}
                    className="min-h-[38px] min-w-[38px] rounded-[10px] cockpit-panel flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    aria-label="Copy Phone"
                  >
                    {copiedKey === 'phone' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="cockpit-surface-elevated rounded-[14px] p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Support Email
                  </p>
                  <a
                    href={`mailto:${supervisorEmail}`}
                    className="text-xs font-semibold text-[var(--text-primary)] hover:text-[#00C8FF] truncate block"
                  >
                    {supervisorEmail}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`mailto:${supervisorEmail}`}
                    className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C8FF] flex items-center justify-center"
                    aria-label="Email Supervisor"
                  >
                    <Mail size={15} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('email', supervisorEmail)}
                    className="min-h-[38px] min-w-[38px] rounded-[10px] cockpit-panel flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
                    aria-label="Copy Email"
                  >
                    {copiedKey === 'email' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Quick SOP Reference */}
          <section className="cockpit-panel rounded-[16px] overflow-hidden divide-y divide-[#D5E2F2] dark:divide-[#104878]/80">
            <div className="px-4 py-3">
              <h3 className="font-heading text-base font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Quick Field Reference
              </h3>
            </div>
            {QUICK_FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer hover:bg-[#0066FF]/[0.04]"
                  >
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[var(--text-muted)] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180 text-[#00C8FF]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </div>
    </div>
  );
};
