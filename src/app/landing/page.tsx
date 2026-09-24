"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Navigation from "./components/Navigation";
import HeroSection from "./components/HeroSection";
import FlowAnimation from "./components/FlowAnimation";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import GetStarted from "./components/GetStarted";
import Footer from "./components/Footer";

export default function LandingPage() {
  const t = useTranslations("landing");
  const router = useRouter();
  return (
    <div className="relative text-text-main font-sans overflow-x-hidden antialiased selection:bg-contrast selection:text-contrast-fg">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-bg"></div>

      <div className="relative z-10">
        <Navigation />

        <main>
          {/* Hero with Flow Animation */}
          <div className="relative">
            <HeroSection />
            <div className="flex justify-center pb-20">
              <FlowAnimation />
            </div>
          </div>

          <GetStarted />
          <HowItWorks />
          <Features />

          {/* CTA Section */}
          <section className="py-24 sm:py-32 px-4 sm:px-6 relative overflow-hidden border-t border-border">
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4 break-words">
                {t("ctaTitle")}
              </h2>
              <p className="text-lg sm:text-xl text-text-muted mb-8 max-w-2xl mx-auto break-words">
                {t("ctaDescription")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto h-14 px-10 rounded-control bg-contrast text-contrast-fg hover:bg-contrast-hover text-base font-medium transition-colors"
                >
                  {t("startFree")}
                </button>
                <button
                  onClick={() => router.push("/docs")}
                  className="w-full sm:w-auto h-14 px-10 rounded-control border border-border-strong bg-surface hover:bg-bg-subtle text-text-main text-base font-medium transition-colors"
                >
                  {t("readDocumentation")}
                </button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      {/* Global styles for keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
