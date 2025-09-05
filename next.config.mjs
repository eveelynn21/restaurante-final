/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Render
  output: 'standalone',
  experimental: {
    // Habilitar características experimentales de React 19
    reactCompiler: false,
    // Configuración para Render
    serverComponentsExternalPackages: ['mysql2', 'bcryptjs']
  },
  images: {
    domains: ['localhost', 'tu-app.onrender.com'],
    unoptimized: true
  },
  // Optimizaciones para producción
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración de servidor para Render
  serverRuntimeConfig: {
    // Configuración del servidor
  },
  publicRuntimeConfig: {
    // Configuración pública
  }
}

export default nextConfig
