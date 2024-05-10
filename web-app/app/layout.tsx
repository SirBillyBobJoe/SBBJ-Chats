import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Head from 'next/head'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SBBJ Chats',
  description:
    'A site for you to chat, make friends and just enjoy yourself. Create by Hosea Tong-Ho',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const titleAsString = String(metadata.title ?? 'Default Title')
  return (
    <html lang="en">
      <Head>
        <title>{titleAsString}</title>
        <meta name="description" content={metadata.description ?? ''} />
      </Head>
      <head>
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.2/socket.io.min.js"
          integrity="sha512-Xm9qbB6Pu06k3PUwPj785dyTl6oHxgsv9nHp7ej7nCpAqGZT3OZpsELuCYX05DdonFpTlBpXMOxjavIAIUwr0w=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        ></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
