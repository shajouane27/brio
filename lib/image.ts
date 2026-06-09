const MAX_DIMENSION = 800 // px — réduit pour passer sous les 4.5 Mo de limite Vercel (8 photos max)

// Extensions image reconnues (iPhone + Android)
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|heic|heif|gif|bmp|tiff?)$/i

/**
 * Détermine si un fichier est (très probablement) une image.
 *
 * Volontairement PERMISSIF — les iPhone renvoient souvent un type MIME vide
 * ou non standard pour les HEIC. On n'écarte un fichier QUE s'il est
 * explicitement d'un autre type (PDF, vidéo, etc.) ET sans extension image.
 */
export function isImageFile(file: File): boolean {
  const type = (file.type || '').toLowerCase()

  // Accepté : MIME image, OU vide, OU heic/heif (quirk iPhone)
  if (type === '' || type === 'image/heic' || type === 'image/heif' || type.startsWith('image/')) {
    return true
  }

  // MIME non-image explicite → on se rabat sur l'extension du nom
  return IMAGE_EXT_RE.test(file.name)
}

/**
 * Normalise N'IMPORTE quelle image (HEIC, PNG, JPG, WEBP) en JPEG via Canvas.
 *
 * Pourquoi : iOS Safari plante sur plusieurs APIs « modernes » (showOpenFilePicker,
 * Workers depuis blob URL via heic2any). Cette approche n'utilise QUE <img> + <canvas>,
 * supportés partout. iOS affiche le HEIC nativement dans <img>, donc le canvas
 * récupère bien les pixels → on obtient un JPEG compatible Anthropic Vision.
 *
 * - Réduit les dimensions à MAX_DIMENSION pour des uploads plus légers/fiables.
 * - Aucune librairie externe, aucun Worker.
 * - Si la conversion échoue, renvoie le fichier original (jamais de rejet).
 */
export function toJpeg(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
          const ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { URL.revokeObjectURL(url); resolve(file); return }
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (!blob) { resolve(file); return }
            const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
            resolve(new File([blob], newName, { type: 'image/jpeg' }))
          },
          'image/jpeg',
          0.70
        )
      } catch {
        URL.revokeObjectURL(url)
        resolve(file)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // navigateur ne sait pas afficher → on garde l'original
    }

    img.src = url
  })
}
