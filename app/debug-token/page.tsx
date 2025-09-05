"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"

export default function DebugTokenPage() {
  const [token, setToken] = useState("")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleTestToken = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/debug-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      setResult({ error: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  const handleGetStoredToken = () => {
    const storedToken = localStorage.getItem("token")
    setToken(storedToken || "")
  }

  const handleClearToken = () => {
    localStorage.removeItem("token")
    setToken("")
    setResult(null)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="token">Token JWT</Label>
              <Input
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Pega tu token aquí..."
                className="font-mono text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleGetStoredToken}>
                Obtener Token del localStorage
              </Button>
              <Button onClick={handleTestToken} disabled={!token || loading}>
                {loading ? "Probando..." : "Probar Token"}
              </Button>
              <Button onClick={handleClearToken} variant="outline">
                Limpiar Token
              </Button>
            </div>

            {result && (
              <div className="mt-6">
                <Label>Resultado:</Label>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 