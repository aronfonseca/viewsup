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
  }) => {
    setLoading(true);
    try {
      console.log("[checkout] starting", options);
      await initializePaddle();
      console.log("[checkout] paddle initialized");
      const paddlePriceId = await getPaddlePriceId(options.priceId);
      console.log("[checkout] resolved paddle price", paddlePriceId);

      if (!window.Paddle?.Checkout?.open) {
        throw new Error("Paddle.js not loaded");
      }

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: options.userId ? { userId: options.userId } : undefined,
        settings: {
          displayMode: "overlay",
          successUrl: options.successUrl || `${window.location.origin}/dashboard?checkout=success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
      console.log("[checkout] Paddle.Checkout.open called");
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
