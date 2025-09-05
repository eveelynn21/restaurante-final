"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { 
  Play, 
  Clock, 
  User, 
  Eye,
  Download,
  Share2,
  BookOpen,
  ShoppingCart,
  Table,
  ChefHat,
  Users,
  CreditCard,
  Settings,
  HelpCircle
} from "lucide-react";

export default function VideosPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const videoCategories = [
    { id: "all", name: "Todos", icon: Play },
    { id: "getting-started", name: "Primeros Pasos", icon: BookOpen },
    { id: "pos", name: "Punto de Venta", icon: ShoppingCart },
    { id: "tables", name: "Gestión de Mesas", icon: Table },
    { id: "kitchen", name: "Cocina", icon: ChefHat },
    { id: "clients", name: "Clientes", icon: Users },
    { id: "payments", name: "Pagos", icon: CreditCard },
    { id: "configuration", name: "Configuración", icon: Settings }
  ];

  const videoTutorials = [
    {
      id: 1,
      title: "Introducción al Sistema POS",
      description: "Aprende los conceptos básicos del sistema y cómo navegar por la interfaz principal.",
      category: "getting-started",
      duration: "5:32",
      instructor: "Equipo de Soporte",
      views: 1247,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["introducción", "navegación", "interfaz"]
    },
    {
      id: 2,
      title: "Configuración Inicial del Negocio",
      description: "Guía paso a paso para configurar los datos básicos de tu restaurante.",
      category: "getting-started",
      duration: "8:15",
      instructor: "Equipo de Soporte",
      views: 892,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["configuración", "negocio", "datos"]
    },
    {
      id: 3,
      title: "Realizar tu Primera Venta",
      description: "Tutorial completo sobre cómo procesar una venta desde el inicio hasta el final.",
      category: "pos",
      duration: "12:45",
      instructor: "María González",
      views: 2156,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["venta", "carrito", "pago"]
    },
    {
      id: 4,
      title: "Gestión Avanzada del Carrito",
      description: "Aprende técnicas avanzadas para manejar productos, descuentos y modificaciones.",
      category: "pos",
      duration: "10:20",
      instructor: "Carlos Rodríguez",
      views: 1432,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Intermedio",
      tags: ["carrito", "descuentos", "modificaciones"]
    },
    {
      id: 5,
      title: "Configurar y Organizar Mesas",
      description: "Cómo configurar las mesas de tu restaurante y organizarlas por áreas.",
      category: "tables",
      duration: "7:38",
      instructor: "Equipo de Soporte",
      views: 987,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["mesas", "configuración", "organización"]
    },
    {
      id: 6,
      title: "Operaciones con Mesas en Servicio",
      description: "Transferir, combinar y gestionar mesas durante el servicio.",
      category: "tables",
      duration: "9:12",
      instructor: "Ana Martínez",
      views: 1654,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Intermedio",
      tags: ["mesas", "transferir", "combinar"]
    },
    {
      id: 7,
      title: "Panel de Cocina Básico",
      description: "Introducción al panel de cocina y cómo ver los pedidos entrantes.",
      category: "kitchen",
      duration: "6:25",
      instructor: "Equipo de Soporte",
      views: 1123,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["cocina", "pedidos", "panel"]
    },
    {
      id: 8,
      title: "Gestión de Estados de Pedidos",
      description: "Cómo actualizar el estado de los pedidos y comunicarse con la sala.",
      category: "kitchen",
      duration: "8:45",
      instructor: "Luis Pérez",
      views: 1345,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Intermedio",
      tags: ["estados", "comunicación", "pedidos"]
    },
    {
      id: 9,
      title: "Gestión de Clientes",
      description: "Crear, buscar y gestionar la base de datos de clientes.",
      category: "clients",
      duration: "11:30",
      instructor: "Sofia López",
      views: 987,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["clientes", "base de datos", "búsqueda"]
    },
    {
      id: 10,
      title: "Programa de Fidelidad",
      description: "Configurar y gestionar el sistema de puntos y recompensas.",
      category: "clients",
      duration: "9:18",
      instructor: "Equipo de Soporte",
      views: 756,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Intermedio",
      tags: ["fidelidad", "puntos", "recompensas"]
    },
    {
      id: 11,
      title: "Configurar Métodos de Pago",
      description: "Habilitar y configurar diferentes formas de pago en el sistema.",
      category: "payments",
      duration: "7:52",
      instructor: "Equipo de Soporte",
      views: 1456,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Principiante",
      tags: ["pagos", "configuración", "métodos"]
    },
    {
      id: 12,
      title: "Procesar Pagos Múltiples",
      description: "Cómo dividir pagos entre diferentes métodos y manejar reembolsos.",
      category: "payments",
      duration: "10:35",
      instructor: "Roberto Silva",
      views: 1234,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Avanzado",
      tags: ["pagos múltiples", "reembolsos", "división"]
    },
    {
      id: 13,
      title: "Configuración de Usuarios y Permisos",
      description: "Crear cuentas de usuario y asignar permisos específicos.",
      category: "configuration",
      duration: "12:15",
      instructor: "Equipo de Soporte",
      views: 678,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Intermedio",
      tags: ["usuarios", "permisos", "seguridad"]
    },
    {
      id: 14,
      title: "Configuración de Impresoras",
      description: "Conectar y configurar impresoras térmicas para tickets.",
      category: "configuration",
      duration: "8:42",
      instructor: "Equipo de Soporte",
      views: 892,
      thumbnail: "/api/placeholder/400/225",
      videoUrl: "#",
      difficulty: "Intermedio",
      tags: ["impresoras", "tickets", "hardware"]
    }
  ];

  const filteredVideos = selectedCategory === "all" 
    ? videoTutorials 
    : videoTutorials.filter(video => video.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Principiante": return "bg-green-100 text-green-800";
      case "Intermedio": return "bg-yellow-100 text-yellow-800";
      case "Avanzado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Videos Tutoriales
        </h1>
        <p className="text-gray-600">
          Aprende a usar el sistema con nuestros videos paso a paso
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {videoCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <div className="aspect-video bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black bg-opacity-50 rounded-full p-4">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-black bg-opacity-75 text-white">
                    {video.duration}
                  </Badge>
                </div>
              </div>
            </div>
            
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
                <Badge className={`text-xs ${getDifficultyColor(video.difficulty)}`}>
                  {video.difficulty}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2">
                {video.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{video.instructor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>{video.views.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {video.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <div className="flex space-x-2">
                <Button className="flex-1" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Ver Video
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredVideos.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron videos
            </h3>
            <p className="text-gray-600 mb-4">
              No hay videos disponibles para esta categoría.
            </p>
            <Button onClick={() => setSelectedCategory("all")}>
              Ver todos los videos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Video Playlist */}
      <Separator className="my-8" />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Play className="h-5 w-5" />
            <span>Lista de Reproducción Recomendada</span>
          </CardTitle>
          <CardDescription>
            Sigue esta secuencia para aprender el sistema paso a paso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {videoTutorials
              .filter(video => ["getting-started", "pos"].includes(video.category))
              .slice(0, 5)
              .map((video, index) => (
                <div key={video.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{video.title}</h4>
                    <p className="text-xs text-gray-600">{video.duration}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Separator className="my-8" />
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda con algo específico?
          </h3>
          <p className="text-gray-600 mb-4">
            Si no encuentras el video que buscas, nuestro equipo puede crear uno personalizado para ti.
          </p>
          <Button className="flex items-center space-x-2 mx-auto">
            <span>Solicitar Video Tutorial</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 