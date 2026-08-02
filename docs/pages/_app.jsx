import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="google-site-verification" content="WbiK6VlkvLQnT7HkyZh9D5eZsLb9lyANzTZ_C0Ieup8" />
      </Head>
      <Component {...pageProps} />
    </>
)
}
