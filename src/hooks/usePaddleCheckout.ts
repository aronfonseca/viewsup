import { useState } from "react";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";
import { toast } from "@/hooks/use-toast";

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: {
    priceId: string;
    customerEmail?: string;
    userId?: string;
    successUrl?: string;
    locale?: string;       // e.g. "pt-BR", "en-GB", "en"
    countryCode?: string;  // e.g. "BR", "GB", "CA" — drives currency
  }) => {
    setLoading(true);
    try {
      console.log("[checkout] starting", options);
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      if (!window.Paddle?.Checkout?.open) {
        throw new Error("Paddle.js not loaded");
      }

      const customer: any = {};
      if (options.customerEmail) customer.email = options.customerEmail;
      if (options.countryCode) customer.address = { countryCode: options.countryCode };

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: Object.keys(customer).length ? customer : undefined,
        customData: options.userId ? { userId: options.userId } : undefined,
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/dashboard?checkout=success`,
          allowLogout: false,
          variant: "one-page",
          locale: options.locale,
        },
      });
    } catch (err) {
      console.error("[checkout] error", err);
      toast({
        title: "Erro ao abrir checkout",
        description: (err as Error)?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
