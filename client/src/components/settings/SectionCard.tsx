import type { PropsWithChildren, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface SectionCardProps extends PropsWithChildren {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
  footer?: ReactNode;
}

const SectionCard = ({
  title,
  description,
  icon: Icon,
  action,
  footer,
  children,
}: SectionCardProps) => {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-civic-teal/10 p-3 text-civic-teal dark:bg-civic-teal/15">
            <Icon size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="px-6 py-6">{children}</div>

      {footer ? (
        <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
          {footer}
        </div>
      ) : null}
    </section>
  );
};

export default SectionCard;
