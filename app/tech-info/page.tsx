"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Code, Globe, Smartphone, Server, Zap } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"

export default function TechInfoPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/tables")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Mesas
            </Button>
            <h1 className="text-2xl font-bold">Stack Tecnológico</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Frontend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Frontend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">React</span>
                  <Badge variant="secondary">v19.1.0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next.js</span>
                  <Badge variant="secondary">v15.1.0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">TypeScript</span>
                  <Badge variant="secondary">v5.7.2</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tailwind CSS</span>
                  <Badge variant="secondary">v3.4.17</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Radix UI</span>
                  <Badge variant="secondary">v1.1.x</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Lucide React</span>
                  <Badge variant="secondary">v0.460.0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backend & Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                Backend & Runtime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Node.js</span>
                  <Badge className="bg-green-600 text-white">v23+ (Current)</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next.js API Routes</span>
                  <Badge variant="secondary">Server-side</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">React Server Components</span>
                  <Badge variant="secondary">RSC</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">LocalStorage</span>
                  <Badge variant="secondary">Client Storage</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Context API</span>
                  <Badge variant="secondary">State Management</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Server Actions</span>
                  <Badge variant="secondary">Form Handling</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-purple-600" />
                Herramientas de Desarrollo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">ESLint</span>
                  <Badge variant="secondary">v9.17.0</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">PostCSS</span>
                  <Badge variant="secondary">v8.5.1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Autoprefixer</span>
                  <Badge variant="secondary">v10.4.20</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">SWC</span>
                  <Badge variant="secondary">Compiler</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">NPM</span>
                  <Badge variant="secondary">v10+</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-orange-600" />
                Métodos de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Tarjetas Débito/Crédito</span>
                  <Badge variant="outline">Tradicional</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Efectivo</span>
                  <Badge variant="outline">Cash</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nequi</span>
                  <Badge className="bg-purple-100 text-purple-800">Digital</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Bancolombia</span>
                  <Badge className="bg-yellow-100 text-yellow-800">Bancario</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Daviplata</span>
                  <Badge className="bg-orange-100 text-orange-800">Digital</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Transferencia</span>
                  <Badge className="bg-blue-100 text-blue-800">Bancario</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Addi</span>
                  <Badge className="bg-pink-100 text-pink-800">Crédito</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Sistecredito</span>
                  <Badge className="bg-red-100 text-red-800">Crédito</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Node.js Version Info */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-5 h-5 bg-green-600 rounded"></div>
                Node.js Runtime Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Versión Actual</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>
                      • <strong>Node.js 23+</strong> (Current)
                    </li>
                    <li>• Última versión estable</li>
                    <li>• Nuevas características ES2024</li>
                    <li>• Mejor rendimiento V8</li>
                    <li>• Soporte nativo para TypeScript</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Características</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Fetch API nativo</li>
                    <li>• Web Streams API</li>
                    <li>• Import maps support</li>
                    <li>• Better ESM support</li>
                    <li>• Performance improvements</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Compatibilidad</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Next.js 15+ compatible</li>
                    <li>• React 19 optimizado</li>
                    <li>• Vercel deployment ready</li>
                    <li>• Docker compatible</li>
                    <li>• Cloud platforms ready</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-green-800 mb-2">🚀 Ventajas de Node.js 23+</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      ⚡
                    </Badge>
                    <span className="text-sm">Mejor rendimiento general</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      🔒
                    </Badge>
                    <span className="text-sm">Seguridad mejorada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      📦
                    </Badge>
                    <span className="text-sm">Mejor gestión de módulos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                      🌐
                    </Badge>
                    <span className="text-sm">APIs web modernas</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Architecture */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                Arquitectura del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Frontend (Client)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• React 19 con Concurrent Features</li>
                    <li>• Next.js App Router</li>
                    <li>• TypeScript para type safety</li>
                    <li>• Tailwind para styling</li>
                    <li>• Context API para estado global</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Backend (Server)</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Node.js 23+ runtime</li>
                    <li>• Next.js API Routes</li>
                    <li>• Server Components</li>
                    <li>• Server Actions</li>
                    <li>• Edge Runtime compatible</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Data & Storage</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• LocalStorage para persistencia</li>
                    <li>• Context para estado en memoria</li>
                    <li>• JSON para estructura de datos</li>
                    <li>• Real-time updates</li>
                    <li>• Offline-first approach</li>
                  </ul>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Características Principales</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ✓
                    </Badge>
                    <span className="text-sm">Sistema POS completo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ✓
                    </Badge>
                    <span className="text-sm">Gestión de mesas drag & drop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ✓
                    </Badge>
                    <span className="text-sm">División de cuentas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ✓
                    </Badge>
                    <span className="text-sm">Sistema de comandas por área</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ✓
                    </Badge>
                    <span className="text-sm">Múltiples métodos de pago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      ✓
                    </Badge>
                    <span className="text-sm">Responsive design</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
