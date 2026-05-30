const MAX_DIMENSION = 2000 // px — réduit les très grandes photos avant upload

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
          0.85
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
