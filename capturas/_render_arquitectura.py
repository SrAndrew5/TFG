"""Renderiza el Diagrama de Componentes / Arquitectura (Figura 10) del TFG.

Capas: Clientes -> AWS Edge -> Frontend -> Backend (Node/Express + Prisma) ->
Datos (PostgreSQL + MinIO) + servicios externos (SMTP). Todo desplegado en AWS.

Layout dinámico: cada tarjeta calcula su altura a partir del wrap real del
texto; cada capa toma la altura del cuadro más alto que contiene; las capas se
apilan con un gap fijo. Imposible que el texto se salga o quede recortado.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(r"c:\Users\SrAndrew\Desktop\TrabajoTFG\ProyectoTFG\capturas\12_arquitectura_componentes.png")

# ---------- Paleta ----------
BG          = (250, 250, 252)
TITLE_FG    = (33, 37, 41)
SUBTITLE_FG = (90, 95, 105)

LAYER_COLORS = {
    "clientes":  ((232, 240, 254), (66, 103, 178)),
    "edge":      ((255, 243, 224), (255, 152,   0)),
    "frontend":  ((227, 242, 253), ( 33, 150, 243)),
    "backend":   ((232, 245, 233), ( 76, 175,  80)),
    "datos":     ((243, 229, 245), (156,  39, 176)),
    "externos":  ((255, 235, 238), (244,  67,  54)),
}

AWS_WRAP_BORDER = (255, 153, 0)
AWS_WRAP_BG     = (255, 250, 240)

CARD_FG       = (33, 37, 41)
CARD_SUB_FG   = (90, 95, 105)
CARD_FILL     = (255, 255, 255)

ARROW_COLOR   = (90, 95, 105)
ARROW_W       = 2

# ---------- Geometría de tarjeta ----------
CARD_PAD_X       = 14
CARD_TITLE_Y     = 16   # baseline-ish offset del título
CARD_BODY_Y      = 50   # primer renglón del cuerpo
CARD_LINE_H      = 22
CARD_BOTTOM_PAD  = 14

# ---------- Geometría de capa ----------
LAYER_LABEL_H    = 38   # banda donde va el título de la capa
LAYER_BOTTOM_PAD = 18
LAYER_GAP        = 28

# ---------- Canvas ----------
W = 1700
H = 1620   # se ajustará si hace falta

# ---------- Fuentes ----------
def font(size, bold=False):
    candidates = (
        ("seguisb.ttf" if bold else "segoeui.ttf"),
        ("segoeuib.ttf" if bold else "segoeui.ttf"),
        "arial.ttf",
        "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf",
    )
    for c in candidates:
        try:
            return ImageFont.truetype(c, size)
        except OSError:
            continue
    return ImageFont.load_default()

F_TITLE   = font(34, bold=True)
F_SUB     = font(18)
F_LAYER   = font(20, bold=True)
F_CARD    = font(20, bold=True)
F_CARD_SM = font(15)
F_TAG     = font(13, bold=True)


# ---------- Helpers ----------
def text_w(draw, txt, fnt):
    bbox = draw.textbbox((0, 0), txt, font=fnt)
    return bbox[2] - bbox[0]


def wrap_line(draw, text, fnt, max_w):
    if text_w(draw, text, fnt) <= max_w:
        return [text]
    words = text.split(" ")
    out, cur = [], ""
    for w in words:
        candidate = (cur + " " + w).strip()
        if text_w(draw, candidate, fnt) <= max_w:
            cur = candidate
        else:
            if cur:
                out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


def wrap_lines(draw, lines, fnt, max_w):
    """Devuelve la lista plana de renglones tras aplicar wrap a cada elemento."""
    out = []
    for line in lines:
        out.extend(wrap_line(draw, line, fnt, max_w))
    return out


def card_height(draw, w, lines):
    """Altura mínima que necesita una tarjeta tras el wrap."""
    text_max = w - CARD_PAD_X * 2
    wrapped = wrap_lines(draw, lines, F_CARD_SM, text_max)
    return CARD_BODY_Y + max(1, len(wrapped)) * CARD_LINE_H + CARD_BOTTOM_PAD


def draw_card(draw, x, y, w, h, title, lines, border, accent_tag=None):
    # sombra
    draw.rounded_rectangle([(x+3, y+4), (x+w+3, y+h+4)], radius=12, fill=(220,222,228))
    # cuerpo
    draw.rounded_rectangle([(x, y), (x+w, y+h)], radius=12, fill=CARD_FILL,
                           outline=border, width=2)
    # barra superior de color
    draw.rounded_rectangle([(x, y), (x+w, y+9)], radius=12, fill=border)
    draw.rectangle([(x, y+5), (x+w, y+9)], fill=border)

    text_max = w - CARD_PAD_X * 2

    # tag (a la derecha, en la cabecera)
    tag_w_total = 0
    if accent_tag:
        tw = text_w(draw, accent_tag, F_TAG)
        tag_w_total = tw + 12 + 14
        tx = x + w - tw - 18
        draw.rounded_rectangle([(tx-6, y+20), (tx+tw+6, y+40)], radius=8, fill=border)
        draw.text((tx, y+22), accent_tag, font=F_TAG, fill=(255,255,255))

    # título (acortado con "…" si choca con el tag)
    title_max = w - CARD_PAD_X * 2 - tag_w_total
    t = title
    if text_w(draw, t, F_CARD) > title_max:
        while t and text_w(draw, t + "…", F_CARD) > title_max:
            t = t[:-1]
        t = t + "…"
    draw.text((x + CARD_PAD_X, y + CARD_TITLE_Y), t, font=F_CARD, fill=CARD_FG)

    # cuerpo (con wrap)
    ly = y + CARD_BODY_Y
    for sub in wrap_lines(draw, lines, F_CARD_SM, text_max):
        draw.text((x + CARD_PAD_X, ly), sub, font=F_CARD_SM, fill=CARD_SUB_FG)
        ly += CARD_LINE_H


def draw_layer_band(draw, y, h, label, key):
    bg, br = LAYER_COLORS[key]
    draw.rounded_rectangle([(40, y), (W-40, y+h)], radius=18, fill=bg, outline=br, width=2)
    draw.text((58, y+10), label, font=F_LAYER, fill=br)


def arrow(draw, x1, y1, x2, y2, label=None):
    draw.line([(x1, y1), (x2, y2)], fill=ARROW_COLOR, width=ARROW_W)
    ang = math.atan2(y2-y1, x2-x1)
    L = 12
    a1 = ang + math.radians(150)
    a2 = ang - math.radians(150)
    draw.polygon([
        (x2, y2),
        (x2 + L*math.cos(a1), y2 + L*math.sin(a1)),
        (x2 + L*math.cos(a2), y2 + L*math.sin(a2)),
    ], fill=ARROW_COLOR)
    if label:
        mx, my = (x1+x2)//2, (y1+y2)//2
        tw = text_w(draw, label, F_TAG)
        draw.rectangle([(mx-tw//2-6, my-12), (mx+tw//2+6, my+10)], fill=(255,255,255))
        draw.text((mx-tw//2, my-9), label, font=F_TAG, fill=SUBTITLE_FG)


# ---------- Contenido (tarjetas por capa) ----------
LAYERS = [
    ("1. CLIENTES", "clientes", [
        dict(x=380,  w=380, title="Cliente Web (Browser)", tag="HTTPS",
             lines=["React 18 SPA · Vite · React Router",
                    "TanStack Query · Axios · Tailwind"]),
        dict(x=940,  w=380, title="Cliente Móvil", tag="HTTPS",
             lines=["React Native (iOS / Android)",
                    "Mismo backend REST + JWT"]),
    ]),
    ("2. CAPA DE EDGE  /  AWS", "edge", [
        dict(x=220,  w=380, title="AWS CloudFront", tag="CDN",
             lines=["CDN global · cache estática",
                    "TLS / certificados ACM"]),
        dict(x=660,  w=380, title="AWS Application LB", tag="ALB",
             lines=["Reparto de tráfico HTTPS",
                    "Health checks · WAF opcional"]),
        dict(x=1100, w=380, title="AWS Route 53", tag="DNS",
             lines=["DNS gestionado",
                    "Alias a CloudFront / ALB"]),
    ]),
    ("3. CAPA DE PRESENTACIÓN", "frontend", [
        dict(x=240,  w=500, title="React SPA", tag="WEB",
             lines=["Login · Reservas · Perfil · Admin · Panel Business",
                    "Context API + TanStack Query",
                    "Auth: JWT en memoria + refresh cookie"]),
        dict(x=960,  w=500, title="React Native App", tag="MOBILE",
             lines=["Navegación con React Navigation",
                    "Notificaciones push (Expo)",
                    "Comparte capa de API con el SPA"]),
    ]),
    ("4. CAPA DE APLICACIÓN  (AWS EC2 / ECS - Node.js)", "backend", [
        dict(x=90,   w=380, title="Middlewares y Seguridad", tag="EXPRESS",
             lines=["helmet · cors · rate-limit",
                    "Validación Joi por endpoint",
                    "JWT (access + refresh)",
                    "bcrypt (cost 12)",
                    "AuditLog en BD",
                    "Logger pino (JSON)"]),
        dict(x=500,  w=400, title="Controllers y Services", tag="REST API",
             lines=["auth · users · businesses",
                    "appointments · resources",
                    "bookings · reviews",
                    "notifications · audit",
                    "pricing · storage",
                    "Cron de reviews post-servicio"]),
        dict(x=930,  w=380, title="Prisma ORM", tag="ORM",
             lines=["schema.prisma (20+ modelos)",
                    "Migrations versionadas",
                    "Tipado y queries seguras",
                    "Pool de conexiones",
                    "Soft-deletes vía campo 'activo'"]),
        dict(x=1340, w=290, title="Jobs", tag="WORKERS",
             lines=["node-cron",
                    "Recordatorios de cita",
                    "Reviews post-servicio",
                    "Limpieza de tokens",
                    "Métricas periódicas"]),
    ]),
    ("5. CAPA DE DATOS  /  PERSISTENCIA", "datos", [
        dict(x=220,  w=480, title="PostgreSQL (RDS)", tag="DB",
             lines=["Datos relacionales del dominio",
                    "Usuarios · Citas · Reservas · Reviews",
                    "Índices por fecha, empleado, recurso",
                    "Backups y snapshots automáticos"]),
        dict(x=760,  w=480, title="MinIO (S3 compatible)", tag="OBJECT STORE",
             lines=["Logos, fotos de negocios, avatares",
                    "Subida desde backend (Buffer)",
                    "URLs públicas firmadas",
                    "Bucket: reservas-tfg"]),
        dict(x=1300, w=320, title="Redis (opcional)", tag="CACHE",
             lines=["Cache de catálogos",
                    "Rate-limit distribuido",
                    "Sesiones efímeras"]),
    ]),
    ("6. SERVICIOS EXTERNOS", "externos", [
        dict(x=90,   w=360, title="SMTP / Email", tag="EMAIL",
             lines=["Verificación de email",
                    "Reset de contraseña",
                    "Recordatorios de cita",
                    "Avisos de negocio",
                    "Proveedor: SES o Mailtrap"]),
        dict(x=480,  w=360, title="Pasarela de pago", tag="PAY",
             lines=["Cobro de reservas",
                    "Cupones de descuento",
                    "Webhooks de confirmación",
                    "Stub local, listo para Stripe"]),
        dict(x=870,  w=360, title="Tiles de mapa (OSM)", tag="MAPS",
             lines=["Mapa interactivo de negocios",
                    "Búsqueda por lat / lng",
                    "Leaflet · React-Leaflet"]),
        dict(x=1260, w=360, title="Push notifications", tag="PUSH",
             lines=["Recordatorios al móvil",
                    "Cambios de estado de cita",
                    "Expo · Firebase"]),
    ]),
]


def main():
    # Calculamos tamaños y posiciones reales con un canvas temporal
    tmp = Image.new("RGB", (W, H), BG)
    tdraw = ImageDraw.Draw(tmp)

    # Para cada capa, calcula altura de cada tarjeta y altura de la capa
    layout = []  # lista de dicts con y, h, label, key, cards [(x,y,w,h,...)]
    cursor_y = 130   # debajo de título + subtítulo

    for label, key, cards in LAYERS:
        # altura de cada tarjeta según su contenido
        card_heights = [card_height(tdraw, c["w"], c["lines"]) for c in cards]
        max_card_h = max(card_heights)
        layer_h = LAYER_LABEL_H + max_card_h + LAYER_BOTTOM_PAD

        card_y = cursor_y + LAYER_LABEL_H

        positioned_cards = []
        for c, ch in zip(cards, card_heights):
            positioned_cards.append(dict(
                x=c["x"], y=card_y, w=c["w"], h=ch,
                title=c["title"], lines=c["lines"], tag=c["tag"],
            ))

        layout.append(dict(
            y=cursor_y, h=layer_h, label=label, key=key, cards=positioned_cards,
            max_card_h=max_card_h, card_y=card_y,
        ))
        cursor_y += layer_h + LAYER_GAP

    # Altura total necesaria
    final_h = cursor_y + 50   # margen para el footer
    canvas_h = max(H, final_h)

    img = Image.new("RGB", (W, canvas_h), BG)
    draw = ImageDraw.Draw(img)

    # ---------- Cabecera ----------
    title = "Diagrama de Componentes / Arquitectura del Sistema"
    tw = text_w(draw, title, F_TITLE)
    draw.text(((W-tw)//2, 28), title, font=F_TITLE, fill=TITLE_FG)
    sub = ("TFG · Plataforma SaaS de reservas  |  React + React Native  |  "
           "Node.js/Express  |  PostgreSQL (Prisma)  |  MinIO  |  AWS")
    tw = text_w(draw, sub, F_SUB)
    draw.text(((W-tw)//2, 72), sub, font=F_SUB, fill=SUBTITLE_FG)

    # ---------- Envoltorio AWS (capas 2..5) ----------
    aws_top = layout[1]["y"] - 20
    aws_bottom = layout[4]["y"] + layout[4]["h"] + 14
    draw.rounded_rectangle([(30, aws_top), (W-30, aws_bottom)], radius=24,
                           fill=AWS_WRAP_BG, outline=AWS_WRAP_BORDER, width=2)
    draw.rounded_rectangle([(60, aws_top-18), (270, aws_top+18)], radius=12,
                           fill=AWS_WRAP_BORDER)
    draw.text((78, aws_top-12), "AWS (Producción)", font=F_LAYER, fill=(255,255,255))

    # ---------- Capas y tarjetas ----------
    for L in layout:
        draw_layer_band(draw, L["y"], L["h"], L["label"], L["key"])
        border = LAYER_COLORS[L["key"]][1]
        for c in L["cards"]:
            draw_card(draw, c["x"], c["y"], c["w"], c["h"],
                      c["title"], c["lines"], border=border, accent_tag=c["tag"])

    # ---------- Flechas entre capas (centros entre tarjetas) ----------
    # Helpers para puntos representativos por capa
    def layer_bottom(i):     return layout[i]["y"] + layout[i]["h"]
    def layer_top(i):        return layout[i]["y"] + LAYER_LABEL_H - 4

    # Centro horizontal de cada tarjeta de una capa
    def card_x_center(i, j):
        c = layout[i]["cards"][j]
        return c["x"] + c["w"] // 2

    # 1 -> 2 (clientes -> edge): ambos clientes apuntan al ALB (capa 2, idx 1)
    arrow(draw, card_x_center(0, 0), layer_bottom(0), card_x_center(1, 1), layer_top(1), "HTTPS")
    arrow(draw, card_x_center(0, 1), layer_bottom(0), card_x_center(1, 1), layer_top(1), "HTTPS")
    # 2 -> 3 (edge -> frontend): CloudFront -> SPA, ALB -> SPA/RN (uno por flecha)
    arrow(draw, card_x_center(1, 0), layer_bottom(1), card_x_center(2, 0), layer_top(2), "estáticos")
    arrow(draw, card_x_center(1, 1), layer_bottom(1), card_x_center(2, 1), layer_top(2), "API REST")
    # 3 -> 4 (frontend -> backend): SPA y RN al Express
    arrow(draw, card_x_center(2, 0), layer_bottom(2), card_x_center(3, 0), layer_top(3), "JSON")
    arrow(draw, card_x_center(2, 1), layer_bottom(2), card_x_center(3, 2), layer_top(3), "JSON")
    # 4 -> 5 (backend -> datos): Prisma->Postgres, Controllers->MinIO, Jobs->Redis
    arrow(draw, card_x_center(3, 2), layer_bottom(3), card_x_center(4, 0), layer_top(4), "SQL")
    arrow(draw, card_x_center(3, 1), layer_bottom(3), card_x_center(4, 1), layer_top(4), "S3 API")
    arrow(draw, card_x_center(3, 3), layer_bottom(3), card_x_center(4, 2), layer_top(4), "TCP")
    # 4 -> 6 (backend -> externos): Controllers/Jobs a SMTP, Pago, Push
    arrow(draw, card_x_center(3, 1), layer_bottom(3) + 4, card_x_center(5, 0), layer_top(5), "SMTP")
    arrow(draw, card_x_center(3, 1), layer_bottom(3) + 4, card_x_center(5, 1), layer_top(5), "HTTPS")
    arrow(draw, card_x_center(3, 3), layer_bottom(3) + 4, card_x_center(5, 3), layer_top(5), "PUSH")

    # ---------- Footer ----------
    foot = "Figura 10. Componentes del sistema y flujos principales de comunicación."
    tw = text_w(draw, foot, F_SUB)
    draw.text(((W-tw)//2, canvas_h - 36), foot, font=F_SUB, fill=SUBTITLE_FG)

    img.save(OUTPUT, "PNG", optimize=True)
    print(f"OK -> {OUTPUT}  ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
