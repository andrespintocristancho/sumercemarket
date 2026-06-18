// ============================================================
// frontend/src/lib/imageCompressor.js
// ------------------------------------------------------------
// Compresor de imagenes en el navegador, SIN dependencias.
// Usa APIs nativas: Image, URL.createObjectURL, canvas, toBlob.
//
// Objetivo: reducir el peso (MB) de las fotos que suben los
// clientes antes de enviarlas a Supabase Storage, manteniendo
// buena calidad visual.
//
// Estrategia segura (no rompe el flujo):
//   - Si el archivo pesa menos del umbral -> se devuelve igual.
//   - Si no es una imagen -> se devuelve igual.
//   - Si ocurre cualquier error -> se devuelve el archivo original.
// ============================================================

/**
 * Comprime/redimensiona una imagen usando canvas nativo.
 *
 * @param {File} file - Archivo original a optimizar.
 * @param {object} [options]
 * @param {number} [options.maxSize=1600]   - Lado mayor maximo en px.
 * @param {number} [options.quality=0.82]   - Calidad de salida (0-1).
 * @param {string} [options.mime="image/webp"] - Formato de salida.
 * @param {number} [options.minBytes=512000] - Umbral (500 KB). Debajo no comprime.
 * @returns {Promise<File>} - Archivo optimizado o el original (fallback).
 */
export async function compressImage(file, options = {}) {
  const {
    maxSize = 1600,
    quality = 0.82,
    mime = "image/webp",
    minBytes = 500 * 1024, // 500 KB
  } = options;

  try {
    // 1) Validaciones de bypass: no imagen o archivo pequeno.
    if (!file || typeof file !== "object") return file;
    if (!file.type || !file.type.startsWith("image/")) return file;
    if (file.size <= minBytes) return file;

    // 2) Cargar la imagen en memoria.
    const bitmap = await loadImage(file);

    // 3) Calcular nuevas dimensiones manteniendo proporcion.
    const { width, height } = scaleDimensions(
      bitmap.width,
      bitmap.height,
      maxSize
    );

    // 4) Dibujar en canvas.
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      cleanup(bitmap);
      return file;
    }
    ctx.drawImage(bitmap.image, 0, 0, width, height);
    cleanup(bitmap);

    // 5) Exportar a Blob comprimido.
    const blob = await canvasToBlob(canvas, mime, quality);
    if (!blob) return file;

    // 6) Si por algun motivo el resultado no es mas liviano, usar original.
    if (blob.size >= file.size) return file;

    // 7) Construir un nuevo File con nombre coherente.
    const newName = replaceExtension(file.name, mimeToExt(mime));
    return new File([blob], newName, {
      type: mime,
      lastModified: Date.now(),
    });
  } catch (err) {
    // Fallback total: nunca romper el flujo de subida.
    console.warn("[imageCompressor] fallback a archivo original:", err);
    return file;
  }
}

// ------------------------------------------------------------
// Helpers internos
// ------------------------------------------------------------

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ image, width: image.naturalWidth, height: image.naturalHeight, url });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo cargar la imagen"));
    };
    image.src = url;
  });
}

function cleanup(bitmap) {
  if (bitmap && bitmap.url) URL.revokeObjectURL(bitmap.url);
}

function scaleDimensions(w, h, maxSize) {
  if (w <= maxSize && h <= maxSize) return { width: w, height: h };
  const ratio = w >= h ? maxSize / w : maxSize / h;
  return {
    width: Math.round(w * ratio),
    height: Math.round(h * ratio),
  };
}

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });
}

function mimeToExt(mime) {
  if (mime === "image/webp") return "webp";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

function replaceExtension(name, ext) {
  if (!name) return `img-${Date.now()}.${ext}`;
  return name.replace(/\.[^.]+$/, "") + "." + ext;
}
