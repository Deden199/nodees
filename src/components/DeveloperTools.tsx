"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

/**
 * Decode a 40-hex-digit currency code back to ASCII (for symbols > 3 chars).
 * - Remove trailing zeros
 * - Convert hex to ASCII
 */
function decodeHexCurrency(hexString: string): string {
  // Pastikan uppercase
  let trimmed = hexString.toUpperCase();

  // Check if 40 hex digit
  if (trimmed.length === 40 && /^[0-9A-F]+$/.test(trimmed)) {
    // Remove trailing "00"
    trimmed = trimmed.replace(/(00)+$/, "");

    // Convert hex to buffer (in Next.js, you may need `import { Buffer } from "buffer";`)
    const buffer = Buffer.from(trimmed, "hex");
    // Convert buffer to ASCII
    return buffer.toString("ascii");
  }

  // If not 40-digit hex or short symbol, return as is (e.g., "XRP", "USD", etc.)
  return hexString;
}

const DeveloperTools: React.FC = () => {
  const [issuerWallet, setIssuerWallet] = useState({ address: "", seed: "" });
  const [receiverWallet, setReceiverWallet] = useState({ address: "", seed: "" });
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");

  const [log, setLog] = useState<string[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sologenic URL only set if mainnet
  const [sologenicUrl, setSologenicUrl] = useState<string | null>(null);

  // Helper: add log to log state
  const addLog = (message: string) => {
    setLog((prev) => [...prev, message]);
  };

  // Helper: toggle log modal
  const toggleLogModal = () => {
    setIsLogOpen(!isLogOpen);
  };

  // Helper: copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    addLog(`Copied: ${text}`);
  };

  /**
   * Generate wallet:
   * - If Testnet, call /api/fund-wallet (faucet).
   * - If Mainnet, generate a wallet without funding.
   */
  const generateWallet = async (
    setWallet: React.Dispatch<React.SetStateAction<{ address: string; seed: string }>>,
    selectedNetwork: "testnet" | "mainnet"
  ) => {
    try {
      addLog(`Generating ${selectedNetwork.toUpperCase()} wallet...`);

      if (selectedNetwork === "testnet") {
        // Call testnet faucet endpoint
        const response = await fetch("/api/fund-wallet", {
          method: "POST",
        });
        if (!response.ok) {
          throw new Error("Failed to fund wallet on Testnet.");
        }
        const data = await response.json();
        setWallet({
          address: data.wallet.address,
          seed: data.wallet.seed,
        });

        addLog("Wallet successfully funded on Testnet.");
        addLog(`Address: ${data.wallet.address}`);
        addLog(`Funding Tx: ${data.wallet.transactionHash}`);
      } else {
        // Mainnet
        const xrpl = require("xrpl");
        const wallet = xrpl.Wallet.generate();
        setWallet({ address: wallet.classicAddress, seed: wallet.seed });
        addLog("Mainnet wallet generated (no funding).");
        addLog(`Address: ${wallet.classicAddress}`);
      }
    } catch (error: any) {
      addLog(`Error generating wallet: ${error.message}`);
      console.error(error);
    }
  };

  /**
   * Create token on XRPL (Testnet or Mainnet)
   */
  const handleTokenCreation = async () => {
    if (!tokenName || !tokenSymbol || !tokenAmount || !issuerWallet.address || !receiverWallet.address) {
      addLog("Please fill in all fields, including issuer and receiver wallets.");
      return;
    }

    setLog([]); // Reset log before starting
    setIsLogOpen(true); // Open log modal
    setIsLoading(true);

    try {
      addLog(`Starting token creation on ${network.toUpperCase()}...`);
      const endpoint = network === "mainnet" ? "/api/create-token-mainnet" : "/api/create-token-testnet";

      addLog("Sending API request...");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenName,
          tokenSymbol,
          tokenAmount,
          issuerSeed: issuerWallet.seed,
          receiverSeed: receiverWallet.seed,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        addLog("Token creation successful!");
        addLog(`Issuer Settings Hash: ${result.txHashes.issuerSettings}`);
        addLog(`Receiver Settings Hash: ${result.txHashes.receiverSettings}`);
        addLog(`Trust Line Hash: ${result.txHashes.trustLine}`);
        addLog(`Token Issue Hash: ${result.txHashes.tokenIssue}`);

        // Decode currency for balances
        const decodedIssuerBalances = (result.balances.issuer || []).map((b: any) => {
          return {
            ...b,
            currency: decodeHexCurrency(b.currency), // decode
          };
        });
        const decodedReceiverBalances = (result.balances.receiver || []).map((b: any) => {
          return {
            ...b,
            currency: decodeHexCurrency(b.currency), // decode
          };
        });

        addLog("Balances:");
        addLog(`Issuer Balances: ${JSON.stringify(decodedIssuerBalances, null, 2)}`);
        addLog(`Receiver Balances: ${JSON.stringify(decodedReceiverBalances, null, 2)}`);

        // Generate Sologenic URL only on mainnet
        if (network === "mainnet") {
          const encodedSymbol = encodeURIComponent(tokenSymbol);
          const encodedIssuer = encodeURIComponent(issuerWallet.address);
          const sologenicLink = `https://sologenic.org/trade?market=${encodedSymbol}%2B${encodedIssuer}%2FXRP`;

          setSologenicUrl(sologenicLink);
          addLog(`Sologenic Trading Pair: ${sologenicLink}`);
        } else {
          setSologenicUrl(null);
        }
      } else {
        addLog(`Error: ${result.message}`);
      }
    } catch (error) {
      addLog("An error occurred during token creation.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 animate-fade" id="developer-tools">
      <div className="max-w-4xl mx-auto">
        {/* Heading & short description */}
        <h3 className="text-4xl font-extrabold text-center text-cyan-400 mb-8">
          Developer Tools
        </h3>
        <p className="text-center text-gray-300 mb-6 max-w-2xl mx-auto">
          Create and manage your own tokens on the XRP Ledger with just a few clicks.
        </p>

        {/* Explanation about Testnet vs Mainnet & min. requirements */}
        <div className="bg-gray-700/60 p-4 rounded-md text-gray-200 text-sm mb-8">
          <h4 className="text-cyan-300 text-lg font-semibold mb-2">
            Testnet vs Mainnet on the XRP Ledger
          </h4>
          <p className="mb-2">
            <strong>Testnet</strong> is a free environment, suitable for 
            experimentation and development. You will receive free XRP 
            via a faucet so you can make transactions without real costs.
          </p>
          <p className="mb-2">
            <strong>Mainnet</strong> is the real XRP Ledger. The 
            <strong> issuer wallet</strong> should be funded with at least 
            <strong> 10 XRP</strong> (for reserve and other fees), and the 
            <strong> receiver wallet</strong> needs at least 
            <strong> 3 XRP</strong>. This ensures both addresses can hold 
            and transfer your newly created token.
          </p>
          <p className="mb-2">
            Before funding your Mainnet wallet, make sure you securely store 
            your address and seed. You can save them in Xaman (formerly Xumm) 
            or any XRPL-compatible wallet of your choice.
          </p>
          <p className="mb-2">
            <strong>How to import a seed into Xaman:</strong> open Xaman &rarr; 
            create or restore an account &rarr; select “Import Existing Account” 
            &rarr; enter your secret seed.
          </p>
          <p className="mb-4">
            In XRPL token creation, the <strong>issuer</strong> is the address 
            minting the token, while the <strong>receiver</strong> is the initial 
            holder. Distribution and trust are handled through 
            <em> Trust Lines</em> and <em>issuer settings</em>.
          </p>

          {/* Example final DEX URL on mainnet */}
          <h4 className="text-cyan-300 text-lg font-semibold mb-2">
            Example of Final DEX URL (Sologenic)
          </h4>
          <p className="mb-2">
            If you successfully create your token on the mainnet (for instance, 
            symbol <em>XQN</em> with issuer address <em>rahuJ7WNoKBATKEDDhx5t3Tj3f2jGhbNjd</em>), 
            you might get a final DEX URL like:
          </p>
          <div className="flex items-center gap-2 mb-1">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-gray-300 text-sm"
              value="https://sologenic.org/trade?market=XQN%2BrahuJ7WNoKBATKEDDhx5t3Tj3f2jGhbNjd%2FXRP"
              readOnly
            />
            <button
              onClick={() =>
                copyToClipboard(
                  "https://sologenic.org/trade?market=XQN%2BrahuJ7WNoKBATKEDDhx5t3Tj3f2jGhbNjd%2FXRP"
                )
              }
              className="bg-cyan-500 text-gray-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-cyan-600 transition btn-glow"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-gray-400">
            This link allows you (or others) to directly trade your token on 
            the built-in DEX.
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition">
          {/* Network Selection */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Select Network
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNetwork("testnet")}
                className={`py-2 px-4 rounded-md text-sm font-semibold transition ${
                  network === "testnet"
                    ? "bg-cyan-500 text-gray-900 btn-glow"
                    : "bg-gray-700 text-gray-300 hover:bg-cyan-600"
                }`}
              >
                Testnet
              </button>
              <button
                onClick={() => setNetwork("mainnet")}
                className={`py-2 px-4 rounded-md text-sm font-semibold transition ${
                  network === "mainnet"
                    ? "bg-cyan-500 text-gray-900 btn-glow"
                    : "bg-gray-700 text-gray-300 hover:bg-cyan-600"
                }`}
              >
                Mainnet
              </button>
            </div>
          </div>

          {/* Issuer & Receiver Wallet */}
          {[
            { label: "Issuer", wallet: issuerWallet, setWallet: setIssuerWallet },
            { label: "Receiver", wallet: receiverWallet, setWallet: setReceiverWallet },
          ].map(({ label, wallet, setWallet }) => (
            <div className="mb-6" key={label}>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {label} Wallet
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 rounded-md bg-gray-700 text-gray-300 text-sm"
                  value={wallet.address}
                  readOnly
                  placeholder={`${label} Address`}
                />
                <button
                  onClick={() => generateWallet(setWallet, network)}
                  className="bg-cyan-500 text-gray-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-cyan-600 transition btn-glow"
                >
                  Generate {label}
                </button>
              </div>

              {wallet.seed && (
                <div className="mt-3 bg-gray-700 p-3 rounded-md">
                  <p className="text-gray-300 text-sm font-medium mb-1">
                    Seed (Keep it safe!):
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded-md bg-gray-800 text-gray-300 font-mono text-sm"
                      value={wallet.seed}
                      readOnly
                    />
                    <button
                      onClick={() => copyToClipboard(wallet.seed)}
                      className="bg-cyan-500 text-gray-900 px-3 py-2 rounded-md text-sm font-semibold hover:bg-cyan-600 transition btn-glow"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Token Details */}
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Token Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-300 text-sm"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="e.g. MyCustomToken"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-300 text-sm"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="e.g. MYT"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Token Amount
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-300 text-sm"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="Total supply"
            />
          </div>

          {/* Create Token Button with Loading Spinner */}
          <button
            onClick={handleTokenCreation}
            className="bg-cyan-500 text-gray-900 w-full py-2 rounded-md text-sm font-semibold hover:bg-cyan-600 transition btn-glow disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                {/* Simple Tailwind-based spinner */}
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-gray-900"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Creating Token...
              </>
            ) : (
              "Create Token"
            )}
          </button>
        </div>
      </div>

      {/* Log Modal */}
      {isLogOpen && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-lg p-5 w-full max-w-lg">
            <h2 className="text-cyan-400 text-xl font-semibold mb-4">
              Transaction Log
            </h2>
            <div className="bg-gray-900 rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {log.map((entry, index) => (
                <p key={index} className="text-gray-300 text-sm">
                  {entry}
                </p>
              ))}

              {/* Show Sologenic link only if mainnet */}
              {sologenicUrl && network === "mainnet" && (
                <div className="mt-4">
                  <label className="text-cyan-400 text-sm font-medium">
                    Sologenic Trading Pair URL:
                  </label>
                  <div className="flex items-center mt-2 gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 rounded-md bg-gray-700 text-gray-300 text-sm"
                      value={sologenicUrl}
                      readOnly
                    />
                    <button
                      onClick={() => copyToClipboard(sologenicUrl)}
                      className="bg-cyan-500 text-gray-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-cyan-600 transition btn-glow"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={toggleLogModal}
              className="mt-4 bg-cyan-500 text-gray-900 px-4 py-2 rounded-md text-sm font-semibold hover:bg-cyan-600 transition btn-glow"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastContainer />
    </section>
  );
};

export default DeveloperTools;
