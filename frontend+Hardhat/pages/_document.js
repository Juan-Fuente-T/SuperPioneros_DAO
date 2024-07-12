import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    
    <Html lang="es">
        <Head>
          {/* <title>Super Pioneros DAO</title> */}
          <meta charSet="UTF-8" />
          {/* <meta name="description" content="SuperPioneros DAO" />
          <link rel="icon" href="/favicon.ico" /> */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Black+Ops+One&display=swap" rel="stylesheet" />
        </Head>
      <body>
        <Main />
        <NextScript />
        {/* <script src="./index.js"></script> */}
      </body>
    </Html>
  )
}
