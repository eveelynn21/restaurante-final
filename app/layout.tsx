import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "../components/theme-provider"
import { AuthCheck } from "./components/auth-check"
import { TableProvider } from "./context/table-context"
import { CartProvider } from "./context/cart-context"
import { ComandasProvider } from "./context/comandas-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Restaurante",
  description: "Sistema de gestión para restaurantes",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <TableProvider>
          <CartProvider>
            <ComandasProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </ComandasProvider>
          </CartProvider>
        </TableProvider>
      </body>
    </html>
  )
}
