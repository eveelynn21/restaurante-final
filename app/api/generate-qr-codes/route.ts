import { NextRequest, NextResponse } from 'next/server'
import { executePosQuery } from '../../../lib/database'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API generate-qr-codes iniciada')
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      console.log('❌ No hay token')
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    console.log('🔑 Token recibido:', token.substring(0, 20) + '...')

    // Decodificar el token para obtener el business_id
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'
    
    let businessId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
      businessId = decoded.business_id
      console.log('🏢 Business ID:', businessId)
    } catch (jwtError) {
      console.error('❌ Error decodificando JWT:', jwtError)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    console.log('🔍 Obteniendo mesas sin QR...')
    
    // Obtener todas las mesas que no tienen QR generado para este business_id
    const tables = await executePosQuery(
      `SELECT id, name FROM res_tables WHERE business_id = ? AND qr_code IS NULL AND deleted_at IS NULL`,
      [businessId]
    ) as any[]

    if (!tables || tables.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todas las mesas ya tienen QR generados',
        generated: 0
      })
    }

    console.log(`📋 Encontradas ${tables.length} mesas sin QR`)

    let generatedCount = 0
    
    // Obtener la URL base desde variable de entorno o automáticamente
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.NODE_ENV === 'production' 
        ? `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`
        : 'http://localhost:3000')

    for (const table of tables) {
      try {
        // Generar URL única para cada mesa (ultra corta)
        const qrUrl = `${baseUrl}/p/${table.id}`
        
        // Generar código QR como base64 ultra compacto
        const qrCodeDataURL = await QRCode.toDataURL(qrUrl, {
          width: 100,
          margin: 0,
          scale: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'L',
          type: 'image/png'
        })

        console.log(`📏 Tamaño del QR para mesa ${table.name}: ${qrCodeDataURL.length} caracteres`)
        console.log(`🔗 URL generada: ${qrUrl}`)

        // Guardar en la base de datos
        await executePosQuery(
          `UPDATE res_tables SET qr_code = ? WHERE id = ?`,
          [qrCodeDataURL, table.id]
        )

        console.log(`✅ QR generado para mesa ${table.name} (ID: ${table.id})`)
        generatedCount++
      } catch (error) {
        console.error(`❌ Error generando QR para mesa ${table.name}:`, error)
      }
    }

    console.log('🎉 Proceso completado exitosamente')

    return NextResponse.json({
      success: true,
      message: `QR generados exitosamente para ${generatedCount} mesas`,
      generated: generatedCount,
      total: tables.length
    })

  } catch (error) {
    console.error('❌ Error generando QR:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ API delete-qr-codes iniciada')
    
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      console.log('❌ No hay token')
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
    }

    console.log('🔑 Token recibido:', token.substring(0, 20) + '...')

    // Decodificar el token para obtener el business_id
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey'
    
    let businessId: number
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { business_id: number }
      businessId = decoded.business_id
      console.log('🏢 Business ID:', businessId)
    } catch (jwtError) {
      console.error('❌ Error decodificando JWT:', jwtError)
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('table_id')

    if (tableId) {
      // Eliminar QR de una mesa específica
      console.log(`🗑️ Eliminando QR de mesa ID: ${tableId}`)
      
      const result = await executePosQuery(
        `UPDATE res_tables SET qr_code = NULL WHERE id = ? AND business_id = ?`,
        [tableId, businessId]
      ) as any

      if (result.affectedRows === 0) {
        return NextResponse.json({
          success: false,
          message: 'Mesa no encontrada o sin QR'
        }, { status: 404 })
      }

      console.log(`✅ QR eliminado de mesa ID: ${tableId}`)
      
      return NextResponse.json({
        success: true,
        message: 'QR eliminado exitosamente'
      })
    } else {
      // Eliminar todos los QR del negocio
      console.log('🗑️ Eliminando todos los QR del negocio')
      
      const result = await executePosQuery(
        `UPDATE res_tables SET qr_code = NULL WHERE business_id = ?`,
        [businessId]
      ) as any

      console.log(`✅ ${result.affectedRows} QR codes eliminados`)
      
      return NextResponse.json({
        success: true,
        message: `${result.affectedRows} QR codes eliminados exitosamente`
      })
    }

  } catch (error) {
    console.error('❌ Error eliminando QR:', error)
    return NextResponse.json({
      success: false,
      message: 'Error interno del servidor: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 })
  }
}
