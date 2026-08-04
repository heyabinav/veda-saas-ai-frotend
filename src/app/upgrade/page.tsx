"use client";

import { useState, useEffect } from "react";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Pro",
    price: 200,
    amount: 20000,
    features: [
      "Apex 2.2 (Thinking Model)",
      "Unlimited Image Generation",
      "300 Credits/day Video Generation",
      "Unlimited Logo Generation",
      "PPT Generation",
      "Watermark Removal",
      "Image Enhancer",
      "Wedding Card Generator",
      "Excel & Word File Tools",
      "APEXCODE Access",
      "Studies Model"
    ],
  },
  {
    name: "Max",
    price: 500,
    amount: 50000,
    features: [
      "Everything in Pro",
      "Text-to-Animation",
      "Image-to-Animation",
      "Video-to-Animation",
      "Unlimited Video Generation",
      "Thumbnail Generator",
      "Video Downloader",
      "File Converter"
    ],
  },
  {
    name: "Ultra",
    price: 1000,
    amount: 100000,
    features: [
      "Everything in Max",
      "Home Map Generator",
      "Live Screen Share",
      "Home Design Selector",
      "Free APEXCODE CLI",
      "Home Map Generator (Coming Soon)"
    ],
  },
];

export default function UpgradePage() {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const handlePayment = async (plan: { name: string; amount: number }) => {
    console.log("Razorpay Key ID from env:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        alert("Razorpay Key ID is missing. Please add it to your .env.local file.");
        return;
    }

    if (!(window as any).Razorpay) {
        alert("Razorpay SDK not loaded.");
        return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
      amount: plan.amount, 
      currency: "INR",
      name: "VedaApex",
      description: `${plan.name} Plan Subscription`,
      handler: async function (response: any) {
        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token;

            const res = await fetch("https://vedaapex-vedaapex.hf.space/api/v1/payments/verify", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    plan: plan.name
                }),
            });

            if (res.ok) {
                alert(`Success! You are now on the ${plan.name} plan.`);
                window.location.href = "/";
            } else {
                alert("Payment verified, but plan update failed.");
            }
        } catch (error) {
            console.error(error);
            alert("Error confirming payment.");
        }
      },
      prefill: { name: "User", email: "user@example.com" },
      theme: { color: "#3399cc" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 w-fit">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Link>
        <h1 className="text-4xl font-bold text-center mb-12">Choose your plan</h1>
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="border rounded-3xl p-8 flex flex-col hover:border-primary transition-all shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
              <p className="text-4xl font-bold mb-8">₹{plan.price}<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" /> {feature}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handlePayment(plan)}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90"
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
