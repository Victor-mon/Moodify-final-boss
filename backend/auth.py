import os
import re
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
import jwt as pyjwt
from supabase import create_client, Client
from supabase.client import ClientOptions
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL     = os.getenv("SUPABASE_URL")
SUPABASE_KEY     = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET       = os.getenv("SUPABASE_JWT_SECRET", "")
MINIMO_STATS     = 3

# ── Clientes Supabase ─────────────────────────────────────────────
supabase: Client = create_client(
    SUPABASE_URL, SUPABASE_KEY,
    options=ClientOptions(
        postgrest_client_timeout=60,
        storage_client_timeout=60,
        headers={"ngrok-skip-browser-warning": "true"}
    )
)

db: Client = create_client(
    SUPABASE_URL, SUPABASE_SERVICE,
    options=ClientOptions(
        postgrest_client_timeout=60,
        storage_client_timeout=60,
        headers={"ngrok-skip-browser-warning": "true"}
    )
)


# ── Helper: reintentos con backoff ────────────────────────────────
def _auth_request_with_timeout(fn, *args, max_intentos=3, espera=2.0, **kwargs):
    ultimo_error = None
    for intento in range(max_intentos):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            ultimo_error = e
            msg = str(e).lower()
            es_red = any(k in msg for k in (
                "timed out", "timeout", "connect", "network",
                "connection", "unreachable", "refused",
            ))
            if es_red and intento < max_intentos - 1:
                backoff = espera * (intento + 1)
                print(f"[auth] Intento {intento + 1} falló (timeout). Reintentando en {backoff:.1f}s…")
                time.sleep(backoff)
                continue
            raise
    raise ultimo_error


# ── Validación JWT LOCAL ──────────────────────────────────────────
def _decode_jwt_local(token: str):
    try:
        if JWT_SECRET:
            payload = pyjwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
        else:
            payload = pyjwt.decode(
                token,
                options={"verify_signature": False},
                algorithms=["HS256"],
            )
        return payload
    except pyjwt.ExpiredSignatureError:
        print("[jwt] Token expirado")
        return None
    except Exception as e:
        print(f"[jwt] Error decodificando: {e}")
        return None


class _LocalUser:
    def __init__(self, payload: dict):
        self.id    = payload.get("sub", "")
        self.email = payload.get("email", "")


def get_user_from_token(token: str):
    payload = _decode_jwt_local(token)
    if payload and payload.get("sub"):
        return _LocalUser(payload)

    try:
        res = _auth_request_with_timeout(supabase.auth.get_user, token, max_intentos=2, espera=1.5)
        return res.user if res else None
    except Exception as e:
        print(f"[token] Error en respaldo de red: {e}")
        return None


# ── Auth ─────────────────────────────────────────────────────────

def _validar_username(username: str) -> tuple[bool, str]:
    username = username.strip().lower()
    if len(username) < 3:
        return False, "❌ El username debe tener al menos 3 caracteres."
    if len(username) > 30:
        return False, "❌ El username no puede superar 30 caracteres."
    if not re.match(r'^[a-z0-9_]+$', username):
        return False, "❌ El username solo puede contener letras, números y guion bajo (_)."
    return True, username


def auth_registro(email: str, password: str, username: str) -> tuple:
    try:
        if len(password) < 6:
            return False, "❌ La contraseña debe tener al menos 6 caracteres."

        ok, resultado = _validar_username(username)
        if not ok:
            return False, resultado
        username = resultado
        email    = email.strip().lower()

        try:
            existing = db.table("profiles").select("id").eq("username", username).execute()
            if existing.data:
                return False, "❌ Ese nombre de usuario ya está en uso."
        except Exception as e:
            print(f"[registro] Error verificando username: {e}")
            return False, "❌ Error de conexión con la base de datos."

        try:
            res = _auth_request_with_timeout(
                supabase.auth.sign_up,
                {"email": email, "password": password},
                max_intentos=3, espera=2.0,
            )
        except Exception as e:
            msg = str(e)
            if "already registered" in msg or "User already registered" in msg:
                return False, "❌ Este correo ya está registrado. ¿Olvidaste tu contraseña?"
            if any(k in msg.lower() for k in ("timed out", "timeout", "connect")):
                return False, "❌ No se pudo conectar a Supabase."
            return False, f"❌ {msg}"

        if not res.user:
            return False, "❌ No se pudo crear la cuenta."

        try:
            db.table("profiles").insert({
                "id":       res.user.id,
                "username": username,
                "email":    email,
            }).execute()
        except Exception as e:
            err = str(e).lower()
            if "unique" in err or "duplicate" in err:
                try:
                    db.auth.admin.delete_user(res.user.id)
                except Exception as del_e:
                    print(f"[registro] No se pudo limpiar usuario huérfano: {del_e}")
                return False, "❌ Ese nombre de usuario ya está en uso (intenta con otro)."
            print(f"[registro] Error insertando perfil: {e}")

        return True, "✅ Cuenta creada exitosamente."

    except Exception as e:
        print(f"[registro] Error inesperado: {e}")
        return False, f"❌ {str(e)}"


def auth_login(email: str, password: str) -> tuple:
    try:
        res = _auth_request_with_timeout(
            supabase.auth.sign_in_with_password,
            {"email": email.strip().lower(), "password": password},
            max_intentos=3, espera=2.0,
        )

        try:
            profile  = db.table("profiles").select("username").eq("id", res.user.id).execute()
            username = profile.data[0]["username"] if profile.data else res.user.email.split("@")[0]
        except Exception:
            username = res.user.email.split("@")[0]

        token = res.session.access_token
        return True, "✅ Bienvenido", token, username

    except Exception as e:
        msg = str(e)
        print(f"[login] Error: {msg}")
        if "Invalid login credentials" in msg:
            return False, "❌ Correo o contraseña incorrectos.", "", ""
        if any(k in msg.lower() for k in ("timed out", "timeout", "connect", "network")):
            return False, "❌ No se pudo conectar a Supabase. Verifica tu conexión.", "", ""
        return False, f"❌ {msg}", "", ""


# ── Historial ─────────────────────────────────────────────────────

def guardar_historial(user_id: str, mensaje, dipl, ejec, casu, tipo, tono, intensidad):
    try:
        db.table("historiales").insert({
            "user_id":             user_id,
            "mensaje_original":    mensaje[:500],
            "version_diplomatica": dipl[:500],
            "version_ejecutiva":   ejec[:500],
            "version_casual":      casu[:500],
            "tipo_mensaje":        tipo,
            "tono_emocional":      tono,
            "intensidad":          intensidad,
            "es_favorito":         False,
        }).execute()
    except Exception as e:
        print(f"[historial] Error guardando: {e}")


def obtener_historial(user_id: str, limite=30):
    try:
        res = db.table("historiales").select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True).limit(limite).execute()
        return res.data or []
    except Exception as e:
        print(f"[historial] Error obteniendo: {e}")
        return []


def obtener_favoritos(user_id: str):
    try:
        res = db.table("historiales").select("*") \
            .eq("user_id", user_id).eq("es_favorito", True) \
            .order("created_at", desc=True).execute()
        return res.data or []
    except Exception as e:
        print(f"[favoritos] Error: {e}")
        return []


def togglear_favorito(record_id: str, estado: bool, user_id: str) -> bool:
    try:
        db.table("historiales") \
            .update({"es_favorito": not estado}) \
            .eq("id", record_id).eq("user_id", user_id).execute()
        return not estado
    except Exception as e:
        print(f"[favorito] Error: {e}")
        return estado


# ── Estadísticas mejoradas ────────────────────────────────────────

def obtener_estadisticas(user_id: str):
    """
    Devuelve estadísticas ricas y precisas basadas en el historial real del usuario.

    Campos:
      total, favoritos
      emociones      — dict {tono: count} ordenado desc
      tipos          — dict {tipo: count} ordenado desc
      dia_top        — fecha YYYY-MM-DD con más mensajes
      msgs_dia_top   — cantidad de mensajes ese día
      intensidades   — dict {baja/media/alta: count}
      racha_actual   — días consecutivos con al menos 1 mensaje (hasta hoy)
      racha_max      — racha más larga registrada
      hora_pico      — hora del día (0-23) con más transformaciones
      msgs_hora_pico — mensajes en esa hora
      tendencia_7d   — lista de 7 dicts [{fecha, total}] de los últimos 7 días
      tono_semana    — tono dominante de los últimos 7 días
      tipo_semana    — tipo más frecuente de los últimos 7 días
      promedio_diario — promedio de mensajes por día activo
      pct_favoritos  — porcentaje del total que son favoritos (0-100)
      evolucion_tono — si el tono mejoró/empeoró comparando primera vs segunda mitad
    """
    try:
        res = db.table("historiales") \
            .select("tipo_mensaje,tono_emocional,intensidad,es_favorito,created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=False) \
            .execute()
        items = res.data or []
        total = len(items)

        if total == 0:
            return {"total": 0}

        # ── Contadores base ──────────────────────────────────────────────────
        emociones:     dict[str, int] = defaultdict(int)
        tipos:         dict[str, int] = defaultdict(int)
        intensidades:  dict[str, int] = defaultdict(int)
        dias:          dict[str, int] = defaultdict(int)  # YYYY-MM-DD → count
        horas:         dict[int, int] = defaultdict(int)  # 0-23 → count
        favoritos = 0

        # Para tendencia 7d y tono de semana
        hoy = datetime.now(timezone.utc).date()
        ultimos7 = {str(hoy - timedelta(days=i)): 0 for i in range(6, -1, -1)}
        tono_7d:  dict[str, int] = defaultdict(int)
        tipo_7d:  dict[str, int] = defaultdict(int)

        # Para evolución de tono (primera mitad vs segunda mitad)
        POSITIVOS = {"positivo"}
        NEGATIVOS = {"frustracion", "urgencia"}
        mitad = total // 2
        tono_primera  = defaultdict(int)
        tono_segunda  = defaultdict(int)

        for idx, it in enumerate(items):
            t      = it.get("tono_emocional", "neutro") or "neutro"
            tp     = it.get("tipo_mensaje",   "general") or "general"
            intens = it.get("intensidad",     "baja")    or "baja"
            fav    = bool(it.get("es_favorito"))
            ts_raw = it.get("created_at", "") or ""

            emociones[t]    += 1
            tipos[tp]       += 1
            intensidades[intens] += 1
            if fav:
                favoritos += 1

            # Fecha y hora
            fecha_str = ts_raw[:10]  # YYYY-MM-DD
            if fecha_str:
                dias[fecha_str] += 1

                # Tendencia 7d
                if fecha_str in ultimos7:
                    ultimos7[fecha_str] += 1
                    tono_7d[t]  += 1
                    tipo_7d[tp] += 1

            # Hora (puede venir como "2024-01-15T14:32:00" o con zona horaria)
            hora_match = re.search(r'T(\d{2}):', ts_raw)
            if hora_match:
                hora = int(hora_match.group(1))
                horas[hora] += 1

            # Evolución de tono
            if idx < mitad:
                tono_primera[t] += 1
            else:
                tono_segunda[t] += 1

        # ── Día más activo ────────────────────────────────────────────────────
        dia_top = max(dias, key=dias.get) if dias else "—"
        msgs_dia_top = dias.get(dia_top, 0)

        # ── Hora pico ─────────────────────────────────────────────────────────
        if horas:
            hora_pico      = max(horas, key=horas.get)
            msgs_hora_pico = horas[hora_pico]
        else:
            hora_pico      = None
            msgs_hora_pico = 0

        # ── Rachas ────────────────────────────────────────────────────────────
        fechas_ordenadas = sorted(dias.keys())
        racha_actual = 0
        racha_max    = 0
        racha_tmp    = 0
        prev_date    = None

        for fd in fechas_ordenadas:
            d = datetime.strptime(fd, "%Y-%m-%d").date()
            if prev_date is None or (d - prev_date).days == 1:
                racha_tmp += 1
            else:
                racha_max = max(racha_max, racha_tmp)
                racha_tmp = 1
            prev_date = d
        racha_max = max(racha_max, racha_tmp)

        # Racha actual: contar hacia atrás desde hoy
        racha_actual = 0
        check = hoy
        while str(check) in dias:
            racha_actual += 1
            check -= timedelta(days=1)

        # ── Tendencia 7 días ──────────────────────────────────────────────────
        tendencia_7d = [{"fecha": f, "total": c} for f, c in ultimos7.items()]

        # ── Tono y tipo de la semana ──────────────────────────────────────────
        tono_semana = max(tono_7d, key=tono_7d.get) if tono_7d else (max(emociones, key=emociones.get) if emociones else "neutro")
        tipo_semana = max(tipo_7d, key=tipo_7d.get) if tipo_7d else (max(tipos, key=tipos.get) if tipos else "general")

        # ── Promedio diario ────────────────────────────────────────────────────
        dias_activos = len(dias)
        promedio_diario = round(total / dias_activos, 1) if dias_activos > 0 else total

        # ── % favoritos ───────────────────────────────────────────────────────
        pct_favoritos = round(favoritos / total * 100) if total > 0 else 0

        # ── Evolución de tono ─────────────────────────────────────────────────
        def _score_tono(d):
            pos = sum(d.get(k, 0) for k in POSITIVOS)
            neg = sum(d.get(k, 0) for k in NEGATIVOS)
            tot = sum(d.values()) or 1
            return (pos - neg) / tot  # -1 a 1

        if total >= 4:
            s1 = _score_tono(tono_primera)
            s2 = _score_tono(tono_segunda)
            diff = s2 - s1
            if diff > 0.12:
                evolucion_tono = "mejora"
            elif diff < -0.12:
                evolucion_tono = "declive"
            else:
                evolucion_tono = "estable"
        else:
            evolucion_tono = "insuficiente"

        return {
            "total":           total,
            "favoritos":       favoritos,
            "emociones":       dict(sorted(emociones.items(), key=lambda x: -x[1])),
            "tipos":           dict(sorted(tipos.items(),     key=lambda x: -x[1])),
            "intensidades":    dict(sorted(intensidades.items(), key=lambda x: -x[1])),
            "dia_top":         dia_top,
            "msgs_dia_top":    msgs_dia_top,
            "hora_pico":       hora_pico,
            "msgs_hora_pico":  msgs_hora_pico,
            "racha_actual":    racha_actual,
            "racha_max":       racha_max,
            "tendencia_7d":    tendencia_7d,
            "tono_semana":     tono_semana,
            "tipo_semana":     tipo_semana,
            "promedio_diario": promedio_diario,
            "pct_favoritos":   pct_favoritos,
            "evolucion_tono":  evolucion_tono,
        }

    except Exception as e:
        print(f"[stats] Error: {e}")
        return {}