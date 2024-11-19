import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    
    <Html lang="es">
        <Head>
          <meta charSet="UTF-8" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Black+Ops+One&display=swap" rel="stylesheet" />
          {/* <meta name="description" content="SuperPioneros DAO" />
          <link rel="icon" href="/favicon.ico" /> */}
        {/* <title>Super Pioneros DAO</title> */}
        </Head>
      <body>
        <Main />
        <NextScript />
        {/* <script src="./index.js"></script> */}
      </body>
    </Html>
  )
}
