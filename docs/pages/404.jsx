import Head from "next/head";
import Link from "next/link";

export default function NotFound() {
  return (
    <>
      <Head>
        <title>404 – Nothing to see here</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="nf-card">
        <span className="nf-code">404</span>
        <div className="nf-content">
          <p className="nf-text">Nothing to see here&hellip;</p>
          <Link href="/" className="nf-button">
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
        }
        a.nf-button {
          position: relative;
          display: inline-block;
          padding: 13px 44px;
          border-radius: 4px;
          color: #ffffff !important;
          font-size: clamp(16px, 3vw, 22px);
          font-weight: 700;
          letter-spacing: 0.5px;
          text-decoration: none !important;
          background: radial-gradient(
              circle at 50% -40%,
              rgba(255, 255, 255, 0.35),
              transparent 60%
            ),
            linear-gradient(135deg, #e62429 0%, #b3141a 55%, #1a3d8f 100%) !important;
          background-blend-mode: screen, normal;
          box-shadow: 0 6px 22px rgba(230, 36, 41, 0.45),
            inset 0 0 0 1px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        /* Spider-web strands overlay */
        a.nf-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
              0deg,
              transparent 0 9px,
              rgba(0, 0, 0, 0.28) 9px 10px
            ),
            repeating-linear-gradient(
              90deg,
              transparent 0 9px,
              rgba(0, 0, 0, 0.28) 9px 10px
            ),
            repeating-linear-gradient(
              45deg,
              transparent 0 13px,
              rgba(0, 0, 0, 0.18) 13px 14px
            );
          opacity: 0.5;
          pointer-events: none;
        }
        a.nf-button span {
          position: relative;
          z-index: 1;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }
        a.nf-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(230, 36, 41, 0.6),
            inset 0 0 0 1px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      <style jsx>{`
        .nf-card {
          position: relative;
          min-height: 100vh;
          background-image: url("/spider.avif");
          background-size: cover;
          background-position: center;
        }
        .nf-code {
          position: absolute;
          top: 6%;
          left: 6%;
          font-size: clamp(40px, 8vw, 72px);
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 1px;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
        }
        .nf-content {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 12%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 0 24px;
        }
        .nf-text {
          margin: 0;
          font-size: clamp(20px, 4vw, 30px);
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </>
  );
}
