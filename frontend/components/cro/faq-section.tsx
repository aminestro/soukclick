import type { ProductFaq } from "@/types/product";

type FaqSectionProps = {
  faqs: ProductFaq[];
  title?: string;
};

export function FaqSection({ faqs, title = "أسئلة كتجينا بزاف" }: FaqSectionProps) {
  return (
    <section className="rounded-card border bg-white p-4 shadow-sm md:p-6">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-5 divide-y">
        {faqs.map((faq) => (
          <details key={faq.question} className="group py-4">
            <summary className="cursor-pointer list-none font-bold leading-7 marker:hidden">
              <span>{faq.question}</span>
              <span className="float-left text-brand-red group-open:hidden">+</span>
              <span className="float-left hidden text-brand-red group-open:inline">-</span>
            </summary>
            <p className="mt-3 text-sm leading-7 text-gray-600">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
