
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        {/* Removed meta viewport and title to adhere to Next.js rules */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
