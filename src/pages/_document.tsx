// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        {/* <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        /> */}
        {/* <title>XRPL Quantum Node | Empowering Blockchain Innovation</title> */}

        {/* Tailwind CDN (jika Anda belum setup tailwind.config.js) */}
        <script src="https://cdn.tailwindcss.com" />

        {/* Anda juga bisa meletakkan style global di sini */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

          body {
            font-family: 'Inter', sans-serif;
          }

          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }

          .animate-fade {
            animation: fadeIn 1s ease-in-out;
          }

          .btn-glow {
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.8);
          }

          .roadmap-item {
            background: linear-gradient(to right, #1e293b, #334155);
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }

          .roadmap-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
          }

          @media (max-width: 768px) {
              h1, h2, h3 {
                  font-size: 1.8rem;
              }
              p, a {
                  font-size: 1rem;
              }
          }
        `}</style>
      </Head>
      <body className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Inilah tempat Next.js me-render halaman (pages) */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
