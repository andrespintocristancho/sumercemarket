// ============================================================
// frontend/src/lib/products.js
// ------------------------------------------------------------
// Capa de datos para el "Catalogo del negocio".
// Maneja la tabla public.products, public.product_images y el
// bucket de Storage "product-images" en Supabase.
//
// No incluye UI. Solo funciones reutilizables que cualquier
// pagina o componente puede importar.
//
// Las politicas RLS ya garantizan que cada usuario solo puede
// operar sobre sus propios productos. Igualmente, las funciones
// que reciben userId lo validan/usan en los filtros para evitar
// llamadas ambiguas desde el frontend.
// ============================================================

import { supabase } from "./supabaseClient";

const BUCKET = "product-images";

// ------------------------------------------------------------
// Helpers internos
// ------------------------------------------------------------

/**
 * Limpia un nombre de archivo para usarlo como path seguro en Storage.
 * Mantiene letras, numeros, guiones, puntos y guiones bajos.
 */
function sanitizeFileName(name) {
  if (!name) return `file-${Date.now()}`;
  return String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .toLowerCase();
}

/**
 * Devuelve la extension del archivo (sin el punto), o "" si no tiene.
 */
function getExtension(fileName) {
  if (!fileName) return "";
  const idx = fileName.lastIndexOf(".");
  if (idx === -1) return "";
  return fileName.slice(idx + 1).toLowerCase();
}


// ============================================================
// READ
// ============================================================

/**
 * Lista TODOS los productos de un usuario (cualquier status).
 * Pensado para el panel del vendedor (dueno).
 *
 * @param {string} userId - uuid del vendedor.
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function listProductsByUser(userId) {
  if (!userId) {
    return { data: [], error: new Error("userId es requerido") };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

/**
 * Lista solo los productos ACTIVOS de un usuario.
 * Pensado para mostrar publicamente en /seller/:slug
 * (la RLS publica ya filtra status='active', pero aqui tambien
 * lo aplicamos explicito por claridad).
 *
 * @param {string} userId - uuid del vendedor.
 * @returns {Promise<{data: Array, error: any}>}
 */
export async function listActiveProductsByUser(userId) {
  if (!userId) {
    return { data: [], error: new Error("userId es requerido") };
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}


// ============================================================
// WRITE
// ============================================================

/**
 * Crea un nuevo producto.
 *
 * @param {object} product - Datos del producto.
 *   Debe incluir al menos: user_id, name.
 *   Campos aceptados: user_id, name, description, category,
 *   price, stock, sku, status, image_url.
 * @returns {Promise<{data: object|null, error: any}>}
 */
export async function createProduct(product) {
  if (!product || !product.user_id) {
    return { data: null, error: new Error("product.user_id es requerido") };
  }
  if (!product.name) {
    return { data: null, error: new Error("product.name es requerido") };
  }

  const payload = {
    user_id:     product.user_id,
    name:        product.name,
    description: product.description ?? null,
    category:    product.category ?? null,
    price:       product.price ?? 0,
    stock:       product.stock ?? 0,
    sku:         product.sku ?? null,
    status:      product.status ?? "active",
    image_url:   product.image_url ?? null,
  };

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select()
    .single();

  return { data: data || null, error };
}

/**
 * Actualiza un producto del usuario indicado.
 * Filtra por id + user_id para que un usuario no pueda
 * modificar productos de otros (la RLS tambien lo impide,
 * esto es defensa en profundidad).
 *
 * @param {string} id - uuid del producto.
 * @param {string} userId - uuid del dueno (auth.uid()).
 * @param {object} updates - Campos a actualizar.
 * @returns {Promise<{data: object|null, error: any}>}
 */
export async function updateProduct(id, userId, updates) {
  if (!id)      return { data: null, error: new Error("id es requerido") };
  if (!userId)  return { data: null, error: new Error("userId es requerido") };
  if (!updates) return { data: null, error: new Error("updates es requerido") };

  // Campos permitidos para actualizar (lista blanca).
  const allowed = [
    "name",
    "description",
    "category",
    "price",
    "stock",
    "sku",
    "status",
    "image_url",
  ];

  const payload = {};
  for (const key of allowed) {
    if (key in updates) payload[key] = updates[key];
  }

  if (Object.keys(payload).length === 0) {
    return { data: null, error: new Error("Sin campos validos para actualizar") };
  }

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  return { data: data || null, error };
}

/**
 * Elimina un producto del usuario indicado.
 *
 * @param {string} id - uuid del producto.
 * @param {string} userId - uuid del dueno (auth.uid()).
 * @returns {Promise<{data: object|null, error: any}>}
 */
export async function deleteProduct(id, userId) {
  if (!id)     return { data: null, error: new Error("id es requerido") };
  if (!userId) return { data: null, error: new Error("userId es requerido") };

  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  return { data: data || null, error };
}


// ============================================================
// STORAGE: imagenes de producto
// ============================================================

/**
 * Sube una imagen al bucket "product-images" y la asocia al
 * producto indicado.
 *
 * Estructura del path: {userId}/{productId}/{timestamp}-{filename}
 * Asi cada vendedor tiene su carpeta y se cumple la politica de
 * Storage que restringe escritura a la carpeta auth.uid().
 *
 * Pasos:
 *   1. Sube el archivo al bucket.
 *   2. Obtiene la URL publica.
 *   3. Inserta un registro en product_images.
 *   4. Actualiza products.image_url si aun no tiene imagen
 *      principal (sin pisar una existente).
 *
 * @param {string} userId - uuid del dueno (auth.uid()).
 * @param {string} productId - uuid del producto.
 * @param {File} file - Archivo a subir.
 * @returns {Promise<{data: {path: string, url: string, image: object}|null, error: any}>}
 */
export async function uploadProductImage(userId, productId, file) {
  if (!userId)    return { data: null, error: new Error("userId es requerido") };
  if (!productId) return { data: null, error: new Error("productId es requerido") };
  if (!file)      return { data: null, error: new Error("file es requerido") };

  const ext = getExtension(file.name) || "jpg";
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "img";
  const fileName = `${Date.now()}-${baseName}.${ext}`;
  const path = `${userId}/${productId}/${fileName}`;

  // 1) Subir al bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  // 2) URL publica
  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = publicData?.publicUrl || null;

  if (!publicUrl) {
    return {
      data: null,
      error: new Error("No se pudo obtener la URL publica de la imagen"),
    };
  }

  // 3) Insertar registro en product_images
  const { data: imageRow, error: insertError } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      url: publicUrl,
      path: path,
      position: 0,
    })
    .select()
    .single();

  if (insertError) {
    return { data: null, error: insertError };
  }

  // 4) Si el producto no tiene image_url, ponerla como principal
  const { data: current, error: readError } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", productId)
    .eq("user_id", userId)
    .single();

  if (!readError && current && !current.image_url) {
    await supabase
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", productId)
      .eq("user_id", userId);
  }

  return {
    data: { path, url: publicUrl, image: imageRow },
    error: null,
  };
}
