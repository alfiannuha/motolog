const MAX_DIMENSION = 1600
const QUALITY = 0.8

export async function compressImage(
  file: File,
  maxDimension = MAX_DIMENSION,
  quality = QUALITY,
): Promise<File> {
  if (typeof createImageBitmap === 'undefined') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return file

    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality),
    )
    if (!blob) return file

    const type = blob.type || 'image/jpeg'
    const extension = type === 'image/webp' ? 'webp' : 'jpg'
    const name = `${file.name.replace(/\.[^.]+$/, '')}.${extension}`
    return new File([blob], name, { type })
  } catch {
    return file
  }
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
}

export function nameSimilarity(a: string, b: string): number {
  const left = new Set(tokenize(a))
  const right = new Set(tokenize(b))
  if (left.size === 0 || right.size === 0) return 0

  let shared = 0
  for (const token of left) if (right.has(token)) shared++
  return shared / Math.max(left.size, right.size)
}

export function matchRuleId(
  itemName: string,
  parts: { ruleId: string; partName: string }[],
  threshold = 0.5,
): string {
  let bestId = ''
  let bestScore = 0

  for (const part of parts) {
    const score = nameSimilarity(itemName, part.partName)
    if (score > bestScore) {
      bestScore = score
      bestId = part.ruleId
    }
  }

  return bestScore >= threshold ? bestId : ''
}

function runSelfCheck() {
  const assert = (condition: boolean, label: string) => {
    if (!condition) throw new Error(`receipt self-check failed: ${label}`)
  }

  assert(nameSimilarity('Oli Mesin SPX', 'Oli Mesin') >= 0.5, 'partial match')
  assert(nameSimilarity('Jasa Pasang', 'Oli Gardan') < 0.5, 'unrelated names')

  const parts = [
    { ruleId: 'r1', partName: 'Oli Mesin' },
    { ruleId: 'r2', partName: 'Oli Gardan' },
    { ruleId: 'r3', partName: 'Busi' },
  ]
  assert(matchRuleId('Oli Mesin SPX2', parts) === 'r1', 'match oli mesin')
  assert(matchRuleId('Ganti Oli Gardan', parts) === 'r2', 'match oli gardan')
  assert(matchRuleId('Jasa Pasang', parts) === '', 'no false match')

  console.log('receipt self-check passed')
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv?.[1] != null &&
  /receipt\.[cm]?ts$/.test(process.argv[1])

if (isDirectRun) runSelfCheck()
