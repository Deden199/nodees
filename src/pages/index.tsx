// pages/index.tsx
import '@/styles/globals.css';
import React from "react";
import Head from "next/head";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Komponen DeveloperTools
import DeveloperTools from "@/components/DeveloperTools";

export default function HomePage() {
  return (
    <>
      {/* SEO TAGS */}
      <Head>
        {/* Google Site Verification */}
        <meta
          name="google-site-verification"
          content="1UIYNjsnw0nZxvpxJryHB5xLSPWtYtS0FU4fvSTCFs0"
        />

        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Title halaman utamanya */}
        <title>Create Token on XRP Ledger - XRPLQuantum.com</title>

        {/* Meta Description (penting untuk SEO) */}
        <meta
          name="description"
          content="Create your own token on the XRP Ledger with XRPLQuantum.com's Developer Tools. Experience low fees, high speed, built-in DEX, and streamlined tokenization."
        />

        {/* Meta Keywords (tidak terlalu berpengaruh untuk SEO modern) */}
        <meta
          name="keywords"
          content="XRP Token Creator, Create Token on XRP Ledger, XRPL Token, XRPLQuantum, XRPL Quantum Node, Low Fees, High Speed, DEX, tokenization, DeFi, bridging, dApps, ledger, blockchain"
        />

        {/* Canonical URL */}
        <link rel="canonical" href="https://xrplquantum.com" />

        {/* Open Graph Tags */}
        <meta property="og:title" content="Create Token on XRP Ledger - XRPLQuantum.com" />
        <meta
          property="og:description"
          content="Empower your blockchain projects with XRPLQuantum's Developer Tools. Easily create tokens on the XRP Ledger, harness low fees, fast transactions, and advanced tokenization features."
        />
        <meta property="og:url" content="https://xrplquantum.com" />
        <meta property="og:type" content="website" />
        {/* Tambahkan gambar jika ada */}
        <meta property="og:image" content="https://xrplquantum.com/images/og-image.png" />

        {/* Twitter Card Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Create Token on XRP Ledger - XRPLQuantum.com" />
        <meta
          name="twitter:description"
          content="Empower your blockchain projects with XRPLQuantum's Developer Tools. Easily create tokens on the XRP Ledger, harness low fees, fast transactions, and advanced tokenization features."
        />
        <meta name="twitter:image" content="https://xrplquantum.com/images/twitter-card.png" />

        {/* Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://xrplquantum.com",
              "name": "XRPL Quantum Node",
              "description":
                "Explore the future of blockchain with XRPL Quantum Node. Built on the XRP Ledger, we deliver efficiency, scalability, and advanced tokenization solutions globally.",
              "publisher": {
                "@type": "Organization",
                "name": "XRPL Quantum Node",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://xrplquantum.com/images/logo.png",
                },
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://xrplquantum.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </Head>

      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 bg-gray-800 shadow-md sticky top-0 z-50 animate-fade">
        <h1 className="text-2xl font-bold text-cyan-400">XQNode</h1>
        <a
          href="https://t.me/XRPLNode_Bot/XRPLNode"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-lg font-semibold rounded-full shadow-md btn-glow hover:shadow-lg hover:from-cyan-400 hover:to-blue-500 transition"
        >
          Launch App
        </a>
      </header>

      {/* Section Hero */}
      <section className="text-center py-16 bg-gradient-to-b from-gray-900 to-gray-800 animate-fade">
        <h2 className="text-5xl font-extrabold mb-6">XRPL Quantum Node</h2>
        <p className="max-w-3xl mx-auto text-lg leading-relaxed mb-8 text-gray-300">
          Explore the future of blockchain with XRPL Quantum Node. Built on the
          XRP Ledger, we deliver efficiency, scalability, and advanced
          tokenization solutions globally.
        </p>
        <a
          href="#whitepaper"
          className="px-6 py-3 bg-cyan-500 text-lg font-semibold text-white rounded-md shadow-md btn-glow hover:bg-cyan-600 transition"
        >
          Learn More
        </a>
      </section>

      {/* Komponen DeveloperTools */}
      <DeveloperTools />

      {/* Key Features */}
      <section className="py-16 animate-fade key-features-section">
        <h3 className="text-4xl font-extrabold text-center text-cyan-400 mb-12">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6">
          <div className="feature-item">
            <h4 className="text-2xl font-semibold text-cyan-400 mb-3">
              Low Fees
            </h4>
            <p className="text-gray-300">
              Benefit from XRPL&apos;s minimal transaction costs.
            </p>
          </div>
          <div className="feature-item">
            <h4 className="text-2xl font-semibold text-cyan-400 mb-3">
              High Speed
            </h4>
            <p className="text-gray-300">Process transactions in just 3-5 seconds.</p>
          </div>
          <div className="feature-item">
            <h4 className="text-2xl font-semibold text-cyan-400 mb-3">
              Decentralized Exchange
            </h4>
            <p className="text-gray-300">
              Trade tokens seamlessly on XRPL&apos;s built-in DEX.
            </p>
          </div>
          <div className="feature-item">
            <h4 className="text-2xl font-semibold text-cyan-400 mb-3">
              Scalability
            </h4>
            <p className="text-gray-300">
              Support thousands of transactions per second.
            </p>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section
        id="roadmap"
        className="py-16 bg-gradient-to-b from-gray-800 to-gray-900 animate-fade"
      >
        <h3 className="text-4xl font-extrabold text-center text-cyan-400 mb-12">
          Roadmap
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 px-6">
          <div className="roadmap-item">
            <h4 className="text-2xl font-bold text-cyan-400">
              Phase 1: Foundation (Q1-Q2 2025)
            </h4>
            <p className="text-gray-300 mt-2">
              Launch XQNode website, deploy XQNODE tokens, and conduct public
              token sale and airdrop.
            </p>
          </div>
          <div className="roadmap-item">
            <h4 className="text-2xl font-bold text-cyan-400">
              Phase 2: Ecosystem Development (Q3-Q4 2025)
            </h4>
            <p className="text-gray-300 mt-2">
              Introduce staking, governance features, and tokenization tools for
              XRPL developers.
            </p>
          </div>
          <div className="roadmap-item">
            <h4 className="text-2xl font-bold text-cyan-400">
              Phase 3: Expansion (2026)
            </h4>
            <p className="text-gray-300 mt-2">
              Develop modular dApps for finance, gaming, and supply chain.
              Establish cross-chain bridges to Ethereum.
            </p>
          </div>
          <div className="roadmap-item">
            <h4 className="text-2xl font-bold text-cyan-400">
              Phase 4: Adoption and Innovation (2027 and Beyond)
            </h4>
            <p className="text-gray-300 mt-2">
              Partner with businesses, expand scalability, and foster
              community-driven innovations.
            </p>
          </div>
        </div>
      </section>

      {/* Whitepaper */}
      <section
        id="whitepaper"
        className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 animate-fade"
      >
        <h3 className="text-4xl font-extrabold text-center text-cyan-400 mb-12">
          Whitepaper
        </h3>
        <p className="max-w-4xl mx-auto text-lg text-center text-gray-300 mb-8">
          Explore our comprehensive whitepaper to understand the vision,
          roadmap, and technological innovations driving XRPL Quantum Node.
        </p>
        <div className="flex justify-center">
          <a
            href="https://drive.google.com/file/d/1Z1FP3pv0GxbMmw3fd3a4Quj0IqTxzc-q/view?usp=sharing"
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-lg font-semibold text-white rounded-full shadow-md btn-glow hover:shadow-lg hover:from-cyan-400 hover:to-blue-500 transition"
          >
            Download Whitepaper
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-center animate-fade">
        <div className="flex justify-center space-x-6 mb-6">
          <a
            href="https://twitter.com/xrplquantum"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:text-cyan-600 transition"
            aria-label="Twitter"
          >
            Twitter
          </a>
          <a
            href="https://t.me/xrplnode"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:text-cyan-600 transition"
            aria-label="Telegram"
          >
            Telegram
          </a>
          <a
            href="https://xrplquantum.com"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:text-cyan-600 transition"
            aria-label="Website"
          >
            Website
          </a>
        </div>
        <p className="text-sm text-gray-400">
          © 2025 XRPL Quantum Node. All rights reserved.
        </p>
      </footer>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}
