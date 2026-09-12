'use server'

import { z } from 'zod'

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export type ExtractedItem = {
  itemName: string
  cost: number
  itemType: 'part' | 'service_fee'
}

export type ReceiptExtraction = {
  workshopName: string | null
  serviceDate: string | null
  totalCost: number
  items: ExtractedItem[]
}

export type ReceiptScanResult =
  | { success: true; data: ReceiptExtraction }
  | { success: false; error: string }

const FAILED: ReceiptScanResult = {
  success: false,
  error: 'Failed to parse receipt',
}

const SYSTEM_PROMPT = `You extract structured data from Indonesian vehicle maintenance receipts (nota servis bengkel).
Rules:
- workshopName: the workshop or shop name, or null if not visible.
- serviceDate: the transaction date in YYYY-MM-DD format, or null if not visible.
- totalCost: the final amount paid, as a plain number in IDR (no separators, no "Rp").
- items: one entry per line item. cost is a plain number in IDR. Omit non-item rows like subtotal, tax, or discount.
- itemType: "service_fee" for labor/installation (jasa, ongkos pasang, biaya servis, tune up).
  "part" for physical goods, oils, filters, spark plugs (oli, busi, filter, kampas, sparepart).
- Never invent values. Use null for unreadable single fields and an empty array for unreadable items.`

const responseSchema = {
  type: 'OBJECT',
  properties: {
    workshopName: { type: 'STRING', nullable: true },
    serviceDate: { type: 'STRING', nullable: true },
    totalCost: { type: 'NUMBER' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          itemName: { type: 'STRING' },
          cost: { type: 'NUMBER' },
          itemType: { type: 'STRING', enum: ['part', 'service_fee'] },
        },
        required: ['itemName', 'cost', 'itemType'],
      },
    },
  },
  required: ['workshopName', 'serviceDate', 'totalCost', 'items'],
}

const extractionSchema = z.object({
  workshopName: z.string().trim().min(1).nullable().catch(null),
  serviceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .catch(null),
  totalCost: z.number().min(0).catch(0),
  items: z
    .array(
      z.object({
        itemName: z.string().trim().min(1),
        cost: z.number().min(0),
        itemType: z.enum(['part', 'service_fee']),
      }),
    )
    .catch([]),
})

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[]
}

export async function scanReceipt(
  formData: FormData,
): Promise<ReceiptScanResult> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return FAILED

    const file = formData.get('file')
    if (!(file instanceof File) || file.size === 0) return FAILED
    if (file.size > MAX_RECEIPT_BYTES || !ALLOWED_TYPES.includes(file.type)) {
      return FAILED
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                { inline_data: { mime_type: file.type, data: base64 } },
                { text: 'Extract the receipt data as JSON.' },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0,
          },
        }),
      },
    )

    if (!response.ok) return FAILED

    const json = (await response.json()) as GeminiResponse
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return FAILED

    const parsed = extractionSchema.safeParse(JSON.parse(text))
    if (!parsed.success) return FAILED

    const items: ExtractedItem[] = parsed.data.items
    const itemTotal = items.reduce((sum, item) => sum + item.cost, 0)
    const totalCost = parsed.data.totalCost > 0 ? parsed.data.totalCost : itemTotal

    return {
      success: true,
      data: {
        workshopName: parsed.data.workshopName,
        serviceDate: parsed.data.serviceDate,
        totalCost,
        items,
      },
    }
  } catch {
    return FAILED
  }
}
