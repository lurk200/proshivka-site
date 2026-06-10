import React from "react";
import PageTransition from "../components/layout/PageTransition";

export default function Home() {
  return (
    <PageTransition>
      <section
        style={{
          minHeight: "100vh",
          background: "#0A0A0C",
          color: "#F5F5F5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "60px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#84CC16",
                  marginBottom: "20px",
                  fontSize: "14px",
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                }}
              >
                ПРОФЕССИОНАЛЬНОЕ ВОССТАНОВЛЕНИЕ
              </div>

              <h1
                style={{
                  fontSize: "72px",
                  lineHeight: "1",
                  marginBottom: "24px",
                  fontWeight: "700",
                }}
              >
                ПРОШИВКА
              </h1>

              <p
                style={{
                  fontSize: "20px",
                  lineHeight: "1.7",
                  color: "#9CA3AF",
                  marginBottom: "40px",
                  maxWidth: "600px",
                }}
              >
                Восстановление смартфонов после сбоев,
                bootloop, FRP, повреждения системы
                и сложных программных ошибок.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "20px",
                }}
              >
                <button
                  style={{
                    background: "#84CC16",
                    color: "#0A0A0C",
                    border: "none",
                    padding: "16px 32px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Диагностика
                </button>

                <button
                  style={{
                    background: "transparent",
                    color: "#F5F5F5",
                    border: "1px solid #2A2D35",
                    padding: "16px 32px",
                    borderRadius: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Telegram
                </button>
              </div>
            </div>

            <div
              style={{
                height: "600px",
                borderRadius: "32px",
                background:
                  "linear-gradient(145deg, #121417 0%, #0A0A0C 100%)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "120px",
              }}
            >
              📱
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}