"""Diagrama de Secuencia UML — Suspensión de Negocio con Cascada.

El admin suspende un negocio (PATCH /api/admin/businesses/:id/suspend).
La API responde 200 inmediatamente. La cascada (cancelar reservas, desactivar
empleados, notificar) se ejecuta en setImmediate(...) para no bloquear.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(r"c:\Users\SrAndrew\Desktop\TrabajoTFG\ProyectoTFG\capturas\14_secuencia_suspension_cascada.png")

# ---------- Paleta ----------
W = 1900
BG = (250, 250, 252)
TITLE_FG    = (33, 37, 41)
SUBTITLE_FG = (90, 95, 105)

COLOR_ADMIN  = (170,  55, 175)   # morado
COLOR_SYNC   = ( 33, 102, 196)   # azul (parte síncrona)
COLOR_CASC   = (200,  80,  20)   # naranja (cascada async)
COLOR_SRV    = ( 90,  95, 105)
COLOR_DB     = (124,  58, 168)
LIFELINE     = (170, 174, 184)

NOTE_BG      = (255, 248, 220);  NOTE_BORDER = (224, 191,  85);  NOTE_FG = (70, 55, 20)
WARN_BG      = (255, 235, 220);  WARN_BORDER = (200,  80,  20)
OK_BG        = (228, 245, 230);  OK_BORDER   = ( 76, 175,  80)

# ---------- Fuentes compactas ----------
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

F_TITLE  = font(26, bold=True)
F_SUB    = font(14)
F_HEAD   = font(14, bold=True)
F_HEADS  = font(11)
F_MSG    = font(13, bold=True)
F_MSGS   = font(11)
F_NOTE   = font(12)
F_NOTEB  = font(12, bold=True)
F_TAG    = font(11, bold=True)
F_FRAME  = font(13, bold=True)

HEADER_TOP   = 18
PARTBOX_Y    = 80
PARTBOX_H    = 50
LIFELINE_TOP = PARTBOX_Y + PARTBOX_H + 4
FIRST_MSG_Y  = LIFELINE_TOP + 30
Y_STEP       = 40
NOTE_PAD     = 6
NOTE_LINE_H  = 16
ARROW_SZ     = 11
ACT_BAR_W    = 10


def text_w(d, t, f):
    b = d.textbbox((0,0), t, font=f); return b[2]-b[0]


def text_size(d, t, f):
    b = d.textbbox((0,0), t, font=f); return b[2]-b[0], b[3]-b[1]


# ---------- Participantes ----------
PARTS = [
    ("AD", 160,  "Admin",                "Browser · React SPA",        COLOR_ADMIN),
    ("EX", 420,  "Express + Auth",       "verifyToken + requireAdmin", COLOR_SRV),
    ("AC", 700,  "AdminController",      "business.auth.controller.js",COLOR_SRV),
    ("PR", 1010, "Prisma · PostgreSQL",  "businesses · citas · etc.",  COLOR_DB),
    ("NO", 1330, "Notificadores",        "SMTP · Socket.IO",           (255,152,0)),
    ("US", 1680, "Stakeholders",         "Owner · Empleados · Clientes",(70,140,80)),
]
PART_BY_ID = {p[0]: i for i, p in enumerate(PARTS)}
def px(pid): return PARTS[PART_BY_ID[pid]][1]


# ---------- Primitivas ----------
def dashed_line(d, x1, y1, x2, y2, fill, width=1, dash=7, gap=5):
    dx, dy = x2-x1, y2-y1
    L = math.hypot(dx, dy)
    if L == 0: return
    ux, uy = dx/L, dy/L
    pos = 0.0
    while pos < L:
        a, b = pos, min(pos+dash, L)
        d.line([(x1+ux*a, y1+uy*a), (x1+ux*b, y1+uy*b)], fill=fill, width=width)
        pos += dash + gap


def arrow_head(d, x, y, going_right, color, filled=True, size=ARROW_SZ):
    direction = 0 if going_right else math.pi
    a1 = direction + math.radians(150)
    a2 = direction - math.radians(150)
    pts = [(x, y),
           (x + size*math.cos(a1), y + size*math.sin(a1)),
           (x + size*math.cos(a2), y + size*math.sin(a2))]
    if filled:
        d.polygon(pts, fill=color)
    else:
        d.line([pts[0], pts[1]], fill=color, width=2)
        d.line([pts[0], pts[2]], fill=color, width=2)


def msg(d, y, src, dst, label, *, kind="sync", color=COLOR_SRV, sub=None, thick=2):
    x1, x2 = px(src), px(dst)
    going_right = x2 > x1
    arrow_x = x2 - (ARROW_SZ if going_right else -ARROW_SZ)
    if kind == "sync":
        d.line([(x1,y),(arrow_x,y)], fill=color, width=thick)
        arrow_head(d, x2, y, going_right, color, filled=True)
    else:
        dashed_line(d, x1, y, arrow_x, y, fill=color, width=thick, dash=7, gap=4)
        arrow_head(d, x2, y, going_right, color, filled=False)
    mid = (x1+x2)//2
    w1, _ = text_size(d, label, F_MSG)
    d.text((mid-w1//2, y-24), label, font=F_MSG, fill=color)
    if sub:
        w2, _ = text_size(d, sub, F_MSGS)
        d.text((mid-w2//2, y-10), sub, font=F_MSGS, fill=(110,115,125))


def self_msg(d, y, pid, label, *, color=COLOR_SRV, sub=None, height=32):
    x = px(pid); r = 22; top = y-height
    d.line([(x,top),(x+r,top)], fill=color, width=2)
    d.line([(x+r,top),(x+r,y)], fill=color, width=2)
    d.line([(x+r,y),(x+6,y)],   fill=color, width=2)
    arrow_head(d, x, y, going_right=False, color=color, filled=True)
    d.text((x+r+8, top-2), label, font=F_MSG, fill=color)
    if sub:
        d.text((x+r+8, top+12), sub, font=F_MSGS, fill=(110,115,125))


def activation_bar(d, x, y1, y2, color):
    d.rectangle([(x-ACT_BAR_W//2,y1),(x+ACT_BAR_W//2,y2)],
                fill=(255,255,255), outline=color, width=2)


def note(d, x, yc, w, lines, *, bg=NOTE_BG, border=NOTE_BORDER, fg=NOTE_FG, bold_first=False):
    h = NOTE_PAD*2 + NOTE_LINE_H*len(lines)
    y1 = yc - h//2
    d.rounded_rectangle([(x,y1),(x+w,y1+h)], radius=5, fill=bg, outline=border, width=2)
    d.polygon([(x+w-12,y1+2),(x+w-2,y1+2),(x+w-2,y1+12)], fill=border)
    ly = y1 + NOTE_PAD
    for i, line in enumerate(lines):
        f = F_NOTEB if (bold_first and i==0) else F_NOTE
        d.text((x+NOTE_PAD+2, ly), line, font=f, fill=fg)
        ly += NOTE_LINE_H
    return h


# ---------- Pasos ----------
# Para el "par" fragment usaremos rectángulos de marco alrededor de un rango.
STEPS = [
    # ===== Síncrono =====
    ("msg", "AD", "EX",
        "1. PATCH /api/admin/businesses/42/suspend",
        "{ motivo: 'incumplimiento de TOS' }",
        "sync", COLOR_SYNC),
    ("msg", "EX", "AC",
        "2. verifyToken + requireAdmin + Joi → suspendBusiness()",
        None, "sync", COLOR_SRV),
    ("msg", "AC", "PR",
        "3. prisma.business.findUnique  (include owner)",
        None, "sync", COLOR_SYNC),
    ("msg", "PR", "AC",
        "4. business + owner",
        None, "reply", COLOR_SYNC),
    ("msg", "AC", "PR",
        "5. prisma.business.update",
        "estado = 'SUSPENDIDO' · motivo_rechazo = motivo",
        "sync", COLOR_SYNC),
    ("msg", "PR", "AC",
        "6. updated",
        None, "reply", COLOR_SYNC),
    ("self", "AC",
        "7. audit('SUSPENDER_NEGOCIO', business, 42)",
        "registro síncrono en audit_logs",
        COLOR_SYNC),
    ("msg", "AC", "NO",
        "8. sendBusinessSuspendedEmail(owner)",
        "fire-and-forget, no awaited",
        "sync", COLOR_SYNC),
    ("msg", "AC", "EX",
        "9. respuesta { success: true, ... }",
        None, "reply", COLOR_SYNC),
    ("msg", "EX", "AD",
        "10. HTTP 200 OK",
        "respuesta inmediata; la cascada queda en cola",
        "reply", COLOR_SYNC),

    # ===== marca: comienzo del frame "par / async" =====
    ("frame_start", "PAR · setImmediate(async () => { … })  ·  no bloquea la API"),

    # ===== Cascada 1: cancelar reservas futuras =====
    ("msg", "AC", "PR",
        "11. reservaRecurso.findMany",
        "WHERE recurso.business_id=42 · fecha >= hoy · estado IN (PEND, CONF)",
        "sync", COLOR_CASC),
    ("msg", "PR", "AC",
        "12. futuras[N]",
        None, "reply", COLOR_CASC),
    ("msg", "AC", "PR",
        "13. reservaRecurso.updateMany → estado = 'CANCELADA'",
        None, "sync", COLOR_CASC),
    ("msg", "PR", "AC",
        "14. { count: N }",
        None, "reply", COLOR_CASC),

    ("frame_loop_start", "loop  ·  para cada reserva cancelada"),
    ("msg", "AC", "NO",
        "15. sendBookingCancelledDueSuspensionEmail(user)",
        None, "sync", COLOR_CASC),
    ("msg", "AC", "PR",
        "16. notification.create  (type='warning')",
        "“Tu reserva ha sido cancelada porque el negocio fue suspendido”",
        "sync", COLOR_CASC),
    ("msg", "AC", "NO",
        "17. emitToUser(usuario_id, 'notification', notif)",
        None, "sync", COLOR_CASC),
    ("msg", "NO", "US",
        "18. socket.emit + email a cliente afectado",
        None, "sync", COLOR_CASC),
    ("frame_loop_end",),

    # ===== Cascada 2: desactivar empleados =====
    ("msg", "AC", "PR",
        "19. empleado.findMany  (business_id=42 · activo=true)",
        None, "sync", COLOR_CASC),
    ("msg", "PR", "AC",
        "20. empleados[M]",
        None, "reply", COLOR_CASC),
    ("msg", "AC", "PR",
        "21. empleado.updateMany → activo = false",
        None, "sync", COLOR_CASC),
    ("msg", "AC", "NO",
        "22. sendEmployeeBusinessSuspendedEmail(emp) ×M",
        None, "sync", COLOR_CASC),
    ("msg", "NO", "US",
        "23. email a cada empleado",
        None, "sync", COLOR_CASC),

    # ===== Cascada 3: notificar al owner =====
    ("msg", "AC", "PR",
        "24. notification.create  (owner, type='suspended')",
        "title='Tu negocio ha sido suspendido' · body=motivo",
        "sync", COLOR_CASC),
    ("msg", "AC", "NO",
        "25. emitToUser(owner_id, 'notification', notif)",
        None, "sync", COLOR_CASC),
    ("msg", "NO", "US",
        "26. socket.emit al owner (in-app banner)",
        None, "sync", COLOR_CASC),

    ("self", "AC",
        "27. logger.info({ businessId, canceladas:N, desactivados:M })",
        "cascada completada · errores se loggean sin escalar",
        COLOR_CASC),
    ("note_anchor", "right", "AC", 360,
        ["Cascada completada",
         "ningún error escala a la API (try/catch)"],
        "ok"),

    ("frame_end",),
]


def main():
    # ---- Calcular alturas ----
    y = FIRST_MSG_Y
    positions = []
    last_msg_y = y
    frame_stack = []   # pila de (kind, y_start, label)
    frames = []        # lista de (kind, y_start, y_end, label)

    for s in STEPS:
        kind = s[0]
        if kind in ("msg", "self"):
            positions.append(y); last_msg_y = y
            y += Y_STEP
        elif kind == "note_anchor":
            lines = s[4]
            note_h = NOTE_PAD*2 + NOTE_LINE_H*len(lines)
            yc = last_msg_y + 14
            positions.append(yc)
            note_bottom = yc + note_h//2
            next_top = y - 22
            if note_bottom > next_top:
                y += (note_bottom - next_top) + 6
        elif kind == "frame_start":
            positions.append(None)
            y += 16   # espacio para la cabecera del frame
            frame_stack.append(("par", y - 8, s[1]))
        elif kind == "frame_end":
            positions.append(None)
            top_kind, top_y, top_label = frame_stack.pop()
            frames.append((top_kind, top_y, y + 4, top_label))
            y += 12
        elif kind == "frame_loop_start":
            positions.append(None)
            y += 12
            frame_stack.append(("loop", y - 6, s[1]))
        elif kind == "frame_loop_end":
            positions.append(None)
            top_kind, top_y, top_label = frame_stack.pop()
            frames.append((top_kind, top_y, y + 4, top_label))
            y += 10

    canvas_h = y + 70
    img = Image.new("RGB", (W, canvas_h), BG)
    d = ImageDraw.Draw(img)

    # ---------- Cabecera ----------
    title = "Diagrama de Secuencia · Suspensión de Negocio con Cascada"
    tw = text_w(d, title, F_TITLE)
    d.text(((W-tw)//2, HEADER_TOP), title, font=F_TITLE, fill=TITLE_FG)
    sub = ("PATCH /api/admin/businesses/:id/suspend — la API responde 200 al instante; "
           "la cascada corre en setImmediate(...) sin bloquear la respuesta.")
    tw = text_w(d, sub, F_SUB)
    d.text(((W-tw)//2, HEADER_TOP + 34), sub, font=F_SUB, fill=SUBTITLE_FG)

    # ---------- Cajas de participantes ----------
    for pid, x, name, subname, color in PARTS:
        bw = 230
        x1, x2 = x-bw//2, x+bw//2
        d.rounded_rectangle([(x1,PARTBOX_Y),(x2,PARTBOX_Y+PARTBOX_H)],
                            radius=10, fill=(255,255,255), outline=color, width=2)
        d.rectangle([(x1,PARTBOX_Y),(x2,PARTBOX_Y+8)], fill=color)
        tw = text_w(d, name, F_HEAD)
        d.text((x-tw//2, PARTBOX_Y+12), name, font=F_HEAD, fill=color)
        tw = text_w(d, subname, F_HEADS)
        d.text((x-tw//2, PARTBOX_Y+30), subname, font=F_HEADS, fill=(110,115,125))

    # ---------- Lifelines ----------
    lifeline_bottom = canvas_h - 36
    for pid, x, *_ in PARTS:
        dashed_line(d, x, LIFELINE_TOP, x, lifeline_bottom, fill=LIFELINE,
                    width=2, dash=8, gap=5)

    # ---------- Frames (par / loop) ----------
    for kind, y1, y2, label in frames:
        x1, x2 = 60, W-60
        if kind == "loop":
            x1, x2 = px("AC")-50, px("US")+150   # más estrecho
            border_col = (180, 130, 60)
            bg = (255, 250, 235, 60)
        else:
            border_col = COLOR_CASC
            bg = (255, 244, 230, 60)
        # rectángulo
        d.rounded_rectangle([(x1, y1), (x2, y2)], radius=6,
                            outline=border_col, width=2)
        # pestaña de la etiqueta
        tw = text_w(d, label, F_FRAME)
        tab_w = tw + 22
        tab_h = 22
        d.rectangle([(x1, y1), (x1+tab_w, y1+tab_h)], fill=border_col)
        # esquina recortada
        d.polygon([(x1+tab_w, y1), (x1+tab_w+10, y1), (x1+tab_w, y1+tab_h)],
                  fill=border_col)
        d.text((x1+8, y1+3), label, font=F_FRAME, fill=(255,255,255))

    # ---------- Activación de AC durante toda la operación ----------
    if positions[0] is not None:
        # AC se activa desde el mensaje 2 hasta el final del último frame
        first_y = next(p for p in positions if p is not None) + 4
        last_y = canvas_h - 60
        activation_bar(d, px("AC"), first_y, last_y, COLOR_SRV)

    # ---------- Pintar pasos ----------
    for s, y in zip(STEPS, positions):
        if y is None:
            continue
        kind = s[0]
        if kind == "msg":
            _, src, dst, label, sub, mtype, color = s
            msg(d, y, src, dst, label, kind=mtype, color=color, sub=sub)
        elif kind == "self":
            _, pid, label, sub, color = s
            self_msg(d, y, pid, label, color=color, sub=sub)
        elif kind == "note_anchor":
            side = s[1]
            if side == "left":
                _, _, nx, w, lines, ntype = s
            else:
                _, _, anchor_pid, w, lines, ntype = s
                nx = px(anchor_pid) + 26
                if nx + w > W - 30:
                    nx = px(anchor_pid) - w - 26
            if ntype == "lock":   bg, br = WARN_BG, WARN_BORDER
            elif ntype == "ok":   bg, br = OK_BG, OK_BORDER
            else:                 bg, br = NOTE_BG, NOTE_BORDER
            note(d, nx, y, w, lines, bg=bg, border=br, bold_first=True)

    # ---------- Leyenda ----------
    legend_y = canvas_h - 28
    lx = 60
    items = [
        ("Parte síncrona (1-10)", COLOR_SYNC),
        ("Cascada async (11-27)", COLOR_CASC),
        ("Admin trigger", COLOR_ADMIN),
    ]
    for label, col in items:
        d.rectangle([(lx, legend_y+2), (lx+14, legend_y+14)], fill=col)
        d.text((lx+20, legend_y), label, font=F_TAG, fill=(50,55,65))
        lx += text_w(d, label, F_TAG) + 50
    # arrow samples
    d.line([(lx, legend_y+8), (lx+34, legend_y+8)], fill=COLOR_SRV, width=2)
    arrow_head(d, lx+34, legend_y+8, True, COLOR_SRV, filled=True, size=8)
    d.text((lx+44, legend_y), "Sync", font=F_TAG, fill=(50,55,65))
    lx += 44 + text_w(d, "Sync", F_TAG) + 28
    dashed_line(d, lx, legend_y+8, lx+34, legend_y+8, fill=COLOR_SRV, width=2, dash=5, gap=3)
    arrow_head(d, lx+34, legend_y+8, True, COLOR_SRV, filled=False, size=8)
    d.text((lx+44, legend_y), "Reply", font=F_TAG, fill=(50,55,65))

    foot = "Figura 12. Suspensión administrativa de negocio — cascada async en setImmediate(...)."
    tw = text_w(d, foot, F_SUB)
    d.text(((W-tw)//2, canvas_h-14), foot, font=F_SUB, fill=SUBTITLE_FG)

    img.save(OUTPUT, "PNG", optimize=True)
    print(f"OK -> {OUTPUT}  ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
