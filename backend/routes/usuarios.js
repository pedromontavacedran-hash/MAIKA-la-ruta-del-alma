import { Router } from "express";
import bcrypt from "bcryptjs";
import { PASSWORD_TEMPORAL_TTL_MS, BCRYPT_ROUNDS, idempotenciaPerfilFile } from "../lib/env.js";
import { normalizarTelefono } from "../lib/validacion.js";
import {
  readUsuarios,
  updateUsuarios,
  readCarritos,
  writeCarritos,
  usuarioPublicoPerfil,
  otroUsuarioTieneTelefono,
  otroUsuarioTieneEmail,
  invalidateUsuariosCache,
  withIdempotenciaKeyFlight,
  readIdempotenciaPerfil,
  updateIdempotenciaPerfil,
  responseIdempotencia,
  usuarioIdIdempotencia,
  idempotencyConflictBody
} from "../lib/storage.js";
import { authMiddleware, authMiddlewareCheckoutOk, usuariosAccessMiddleware } from "../lib/auth.js";
import { marcarDesbloqueoReciente } from "../lib/rateLimits.js";
import { pickUsuarioPerfilServidor } from "../utils/pickUsuarioPerfilServidor.js";

export const usuariosRouter = Router();

/** Perfil autenticado: mismo modelo que en local (direcciones[], campos sueltos, nombre, etc.). */
usuariosRouter.patch("/me", authMiddlewareCheckoutOk, async (req, res) => {
  const datos = pickUsuarioPerfilServidor(req.body);
  const userId = String(req.user?.id ?? "").trim();
  if (!userId) {
    res.status(401).json({ error: "Token inválido" });
    return;
  }
  const rawKey = req.get("Idempotency-Key");
  const idemKey =
    rawKey != null && String(rawKey).trim() !== "" ? String(rawKey).trim().slice(0, 255) : "";

  const outcome = await withIdempotenciaKeyFlight(idempotenciaPerfilFile, idemKey, userId, async () => {
    if (idemKey) {
      const idemStore = await readIdempotenciaPerfil();
      const cached = idemStore[idemKey];
      if (cached != null && typeof cached === "object") {
        if (usuarioIdIdempotencia(cached) !== userId) {
          return { status: 409, body: idempotencyConflictBody() };
        }
        return { status: 200, body: responseIdempotencia(cached) };
      }
    }

    const miId = req.user?.id;
    const resultado = await updateUsuarios((usuarios) => {
      const idx = usuarios.findIndex((u) => String(u?.id) === userId);
      if (idx === -1) {
        return { status: 404, body: { error: "No encontrado" } };
      }

      // [UNICIDAD PATCH /me] Validar teléfono y email antes de modificar (misma regla que POST /auth/register).
      if (Object.prototype.hasOwnProperty.call(datos, "telefono")) {
        const telNorm = normalizarTelefono(datos.telefono);
        // [UNICIDAD PATCH /me] No permitir vaciar el teléfono: es identidad del usuario.
        if (!telNorm) {
          return { status: 400, body: { error: "Teléfono obligatorio" } };
        }
        if (otroUsuarioTieneTelefono(usuarios, telNorm, miId)) {
          return { status: 400, body: { error: "Teléfono ya existe" } };
        }
      }
      if (Object.prototype.hasOwnProperty.call(datos, "email")) {
        const emailNorm = String(datos.email || "").trim().toLowerCase();
        if (emailNorm && otroUsuarioTieneEmail(usuarios, emailNorm, miId)) {
          return { status: 400, body: { error: "Email ya existe" } };
        }
      }

      const u = { ...usuarios[idx] };
      for (const [k, v] of Object.entries(datos)) {
        u[k] = v;
      }
      usuarios[idx] = u;
      return { status: 200, body: { ok: true, usuario: usuarioPublicoPerfil(u) } };
    });
    if (resultado.status !== 200) return resultado;
    const response = resultado.body;
    if (idemKey) {
      try {
        await updateIdempotenciaPerfil((idemStore) => {
          idemStore[idemKey] = { usuarioId: userId, response, createdAt: Date.now() };
          return idemStore;
        });
      } catch (e) {
         
        console.error("[perfil] idempotencia no guardada (perfil ya persistido)", e);
      }
    }
    return { status: 200, body: response };
  });
  res.status(outcome.status).json(outcome.body);
});

usuariosRouter.get("/me", authMiddleware, async (req, res) => {
  const user = req.user ?? {};
  const usuarios = await readUsuarios();
  const full = usuarios.find((u) => String(u?.id) === String(user.id));
  res.json(usuarioPublicoPerfil(full || { id: user.id, email: user.email }));
});

/** Listado admin: todos los registros de usuarios.json (sin filtrar por email, verificado ni campos opcionales). */
usuariosRouter.get("/usuarios", usuariosAccessMiddleware, async (_req, res) => {
  invalidateUsuariosCache();
  const usuarios = await readUsuarios();
  res.json(usuarios.map((u) => usuarioPublicoPerfil(u)));
});

/** Actualizar perfil de un usuario por id (misma regla de acceso que GET /usuarios). Útil para gestión admin. */
usuariosRouter.patch("/usuarios/:id", usuariosAccessMiddleware, async (req, res) => {
  const rawId = String(req.params.id ?? "").trim();
  const datos = pickUsuarioPerfilServidor(req.body ?? {});
  const passwordAdmin = typeof req.body?.password === "string" ? req.body.password.trim() : "";
  const passwordTemporalAdmin = passwordAdmin && req.body?.passwordTemporal === true;
  if (Object.keys(datos).length === 0) {
    if (!passwordAdmin) {
      res.status(400).json({ error: "Sin datos válidos" });
      return;
    }
  }
  const resultado = await updateUsuarios(async (usuarios) => {
    const idx = usuarios.findIndex((u) => String(u?.id) === rawId);
    if (idx === -1) {
      return { status: 404, body: { error: "No encontrado" } };
    }

    // [UNICIDAD PATCH /usuarios/:id] Validar teléfono y email antes de modificar.
    if (Object.prototype.hasOwnProperty.call(datos, "telefono")) {
      const telNorm = normalizarTelefono(datos.telefono);
      // [UNICIDAD PATCH /usuarios/:id] No permitir vaciar el teléfono.
      if (!telNorm) {
        return { status: 400, body: { error: "Teléfono obligatorio" } };
      }
      if (otroUsuarioTieneTelefono(usuarios, telNorm, rawId)) {
        return { status: 400, body: { error: "Teléfono ya existe" } };
      }
    }
    if (Object.prototype.hasOwnProperty.call(datos, "email")) {
      const emailNorm = String(datos.email || "").trim().toLowerCase();
      if (emailNorm && otroUsuarioTieneEmail(usuarios, emailNorm, rawId)) {
        return { status: 400, body: { error: "Email ya existe" } };
      }
    }

    const u = { ...usuarios[idx] };
    for (const [k, v] of Object.entries(datos)) {
      u[k] = v;
    }
    if (passwordAdmin) {
      if (passwordAdmin.length < 8) {
        return { status: 400, body: { error: "Password inválido" } };
      }
      u.password = await bcrypt.hash(passwordAdmin, BCRYPT_ROUNDS);
      u.mustChangePassword = !!passwordTemporalAdmin;
      u.passwordTemporal = !!passwordTemporalAdmin;
      u.passwordTemporalExpiresAt = passwordTemporalAdmin ? Date.now() + PASSWORD_TEMPORAL_TTL_MS : null;
      u.tokenVersion = (Number(u.tokenVersion) || 0) + 1;
    }
    usuarios[idx] = u;
    return { status: 200, body: { ok: true, usuario: usuarioPublicoPerfil(u) } };
  });
  res.status(resultado.status).json(resultado.body);
});

/** Misma protección que GET /usuarios: alinear con borrado desde gestión en el cliente. */
usuariosRouter.delete("/usuarios/:id", usuariosAccessMiddleware, async (req, res) => {
  const rawId = String(req.params.id ?? "").trim();
  if (!rawId) {
    res.status(400).json({ error: "Id requerido" });
    return;
  }
  const borrado = await updateUsuarios((usuarios) => {
    const idx = usuarios.findIndex((u) => String(u?.id) === rawId);
    if (idx === -1) return false;
    usuarios.splice(idx, 1);
    return true;
  });
  if (!borrado) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  const usuarioIdCarrito = `user_${rawId}`;
  const carritos = await readCarritos();
  const carritosFiltrados = carritos.filter((c) => String(c?.usuarioId) !== usuarioIdCarrito);
  if (carritosFiltrados.length !== carritos.length) {
    await writeCarritos(carritosFiltrados);
  }
  res.json({ ok: true });
});

/** Bloquear/desbloquear un usuario (no se borra; no puede hacer login mientras esté bloqueado). */
usuariosRouter.patch("/usuarios/:id/bloqueo", usuariosAccessMiddleware, async (req, res) => {
  const rawId = String(req.params.id ?? "").trim();
  if (!rawId) {
    res.status(400).json({ error: "Id requerido" });
    return;
  }
  const bloquear = req.body?.bloquear === true;
  const motivo = String(req.body?.motivo ?? "").trim().slice(0, 200);
  let desbloqueadoIdentificadores = null;
  const actualizado = await updateUsuarios((usuarios) => {
    const u = usuarios.find((x) => String(x?.id) === rawId);
    if (!u) return false;
    if (bloquear) {
      u.bloqueado = true;
      u.bloqueadoMotivo = motivo;
      u.bloqueadoEn = new Date().toISOString();
    } else {
      delete u.bloqueado;
      delete u.bloqueadoMotivo;
      delete u.bloqueadoEn;
      desbloqueadoIdentificadores = [u.email, u.telefono];
    }
    return true;
  });
  if (!actualizado) {
    res.status(404).json({ error: "No encontrado" });
    return;
  }
  if (desbloqueadoIdentificadores) {
    marcarDesbloqueoReciente(...desbloqueadoIdentificadores);
  }
  res.json({ ok: true, bloqueado: bloquear });
});
