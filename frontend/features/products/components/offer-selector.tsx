"use client";

import type { ProductOffer } from "@/types/product";
import { cn } from "@/lib/utils";

type OfferSelectorProps = {
  offers: ProductOffer[];
  selectedOffer: ProductOffer;
  onSelect: (offer: ProductOffer) => void;
};

export function OfferSelector({ offers, selectedOffer, onSelect }: OfferSelectorProps) {
  return (
    <div className="grid gap-3">
      {offers.map((offer) => {
        const selected = offer.quantity === selectedOffer.quantity;

        return (
          <button
            key={offer.quantity}
            type="button"
            onClick={() => onSelect(offer)}
            className={cn("rounded-card border-2 p-4 text-right transition", selected ? "border-brand-red bg-red-50 shadow-sm" : "border-gray-200 bg-white hover:border-brand-red")}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{offer.label}</p>
                {offer.savings_text ? <p className="mt-1 text-xs text-gray-500">{offer.savings_text}</p> : null}
              </div>
              <div className="text-left">
                {offer.badge ? (
                  <span className="rounded-full bg-brand-red px-2 py-1 text-xs font-semibold text-white">{offer.badge}</span>
                ) : null}
                <p className="mt-2 font-bold">{offer.price} درهم</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
