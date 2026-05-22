"""Diagrama de Secuencia UML — Flujo de Reserva con Bloqueo Pesimista (versión compacta).

Dos clientes A y B intentan reservar el mismo hueco. Postgres serializa la
sección crítica con SELECT … FOR UPDATE sobre la fila del empleado.
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(r"c:\Users\SrAndrew\Desktop\TrabajoTFG\ProyectoTFG\capturas\13_secuencia_reserva_lock.png")

# ---------- Canvas y paleta ----------
W = 1900
BG = (250, 250, 252)
TITLE_FG    = (33, 37, 41)
SUBTITLE_FG = (90, 95, 105)

COLOR_A     = ( 33, 102, 196)
COLOR_B     = (200,  47,  47)
COLOR_SRV   = ( 90,  95, 105)
COLOR_DB    = (124,  58, 168)
LIFELINE    = (170, 174, 184)

NOTE_BG     = (255, 248, 220);  NOTE_BORDER = (224, 191,  85);  NOTE_FG = (70, 55, 20)
LOCK_NOTE_BG     = (252, 232, 232);  LOCK_NOTE_BORDER = (200,  47,  47)
OK_NOTE_BG       = (228, 245, 230);  OK_NOTE_BORDER   = ( 76, 175,  80)

# ---------- Fuentes (compactas) ----------
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

# ---------- Geometría compacta ----------
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


def text_w(draw, txt, fnt):
    bbox = draw.textbbox((0, 0), txt, font=fnt)
    return bbox[2] - bbox[0]


def text_size(draw, txt, fnt):
    bbox = draw.textbbox((0, 0), txt, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


# ---------- Participantes ----------
PARTS = [
    ("A",  165,  "Cliente A",            "Browser · React SPA",        COLOR_A),
    ("B",  420,  "Cliente B",            "Browser · React SPA",        COLOR_B),
    ("EX", 720,  "Express + Middlewares","Joi · JWT · rate-limit",     COLOR_SRV),
    ("CT", 1020, "CitasController",      "appointments.controller.js", COLOR_SRV),
    ("PR", 1340, "Prisma · PostgreSQL",  "Transacciones + locks",      COLOR_DB),
    ("EM", 1680, "Email / Audit",        "SMTP · AuditLog (async)",    (255,152,0)),
]
PART_BY_ID = {p[0]: i for i, p in enumerate(PARTS)}
def px(pid): return PARTS[PART_BY_ID[pid]][1]


# ---------- Primitivas ----------
def dashed_line(draw, x1, y1, x2, y2, fill, width=1, dash=7, gap=5):
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy)
    if L == 0:
        return
    ux, uy = dx / L, dy / L
    pos = 0.0
    while pos < L:
        a, b = pos, min(pos + dash, L)
        draw.line([(x1 + ux*a, y1 + uy*a), (x1 + ux*b, y1 + uy*b)],
                  fill=fill, width=width)
        pos += dash + gap


def arrow_head(draw, x, y, going_right, color, filled=True, size=ARROW_SZ):
    direction = 0 if going_right else math.pi
    a1 = direction + math.radians(150)
    a2 = direction - math.radians(150)
    pts = [(x, y),
           (x + size*math.cos(a1), y + size*math.sin(a1)),
           (x + size*math.cos(a2), y + size*math.sin(a2))]
    if filled:
        draw.polygon(pts, fill=color)
    else:
        draw.line([pts[0], pts[1]], fill=color, width=2)
        draw.line([pts[0], pts[2]], fill=color, width=2)


def msg(draw, y, src_id, dst_id, label, *, kind="sync", color=COLOR_SRV,
        sub=None, thick=2):
    x1, x2 = px(src_id), px(dst_id)
    going_right = x2 > x1
    arrow_x = x2 - (ARROW_SZ if going_right else -ARROW_SZ)
    if kind == "sync":
        draw.line([(x1, y), (arrow_x, y)], fill=color, width=thick)
        arrow_head(draw, x2, y, going_right, color, filled=True)
    else:
        dashed_line(draw, x1, y, arrow_x, y, fill=color, width=thick, dash=7, gap=4)
        arrow_head(draw, x2, y, going_right, color, filled=False)

    mid = (x1 + x2) // 2
    w1, _ = text_size(draw, label, F_MSG)
    draw.text((mid - w1//2, y - 24), label, font=F_MSG, fill=color)
    if sub:
        w2, _ = text_size(draw, sub, F_MSGS)
        draw.text((mid - w2//2, y - 10), sub, font=F_MSGS, fill=(110,115,125))


def self_msg(draw, y, pid, label, *, color=COLOR_SRV, sub=None, height=34):
    x = px(pid)
    r = 22
    top = y - height
    draw.line([(x, top), (x+r, top)], fill=color, width=2)
    draw.line([(x+r, top), (x+r, y)], fill=color, width=2)
    draw.line([(x+r, y), (x+6, y)], fill=color, width=2)
    arrow_head(draw, x, y, going_right=False, color=color, filled=True)
    draw.text((x + r + 8, top - 2), label, font=F_MSG, fill=color)
    if sub:
        draw.text((x + r + 8, top + 12), sub, font=F_MSGS, fill=(110,115,125))


def activation_bar(draw, x, y1, y2, color):
    draw.rectangle([(x - ACT_BAR_W//2, y1), (x + ACT_BAR_W//2, y2)],
                   fill=(255,255,255), outline=color, width=2)


def note(draw, x, y_center, w, lines, *, bg=NOTE_BG, border=NOTE_BORDER,
         fg=NOTE_FG, bold_first=False):
    h = NOTE_PAD*2 + NOTE_LINE_H*len(lines)
    y1 = y_center - h//2
    draw.rounded_rectangle([(x, y1), (x+w, y1+h)], radius=5,
                           fill=bg, outline=border, width=2)
    draw.polygon([(x+w-12, y1+2), (x+w-2, y1+2), (x+w-2, y1+12)], fill=border)
    ly = y1 + NOTE_PAD
    for i, line in enumerate(lines):
        fnt = F_NOTEB if (bold_first and i == 0) else F_NOTE
        draw.text((x + NOTE_PAD + 2, ly), line, font=fnt, fill=fg)
        ly += NOTE_LINE_H
    return h


# ---------- Pasos del diagrama ----------
# Cada msg/self ocupa Y_STEP. Las notas no consumen un slot propio: se anclan
# al último mensaje y crecen hacia abajo, empujando solo si su altura supera Y_STEP.
STEPS = [
    ("msg", "A", "EX",
        "1. POST /api/appointments",
        "{empleado_id:7, servicio_id:3, fecha, hora_inicio}",
        "sync", COLOR_A),
    ("msg", "EX", "CT",
        "2. validar + auth → create()",
        "Joi schema + verifyAccessToken (JWT)",
        "sync", COLOR_SRV),
    ("msg", "CT", "PR",
        "3. prisma.servicio.findUnique",
        "obtiene duracion_min y precio base",
        "sync", COLOR_SRV),
    ("msg", "PR", "CT",
        "4. servicio { duracion_min: 45 }",
        None, "reply", COLOR_SRV),
    ("msg", "CT", "PR",
        "5. prisma.servicioEmpleado.findFirst",
        "¿el empleado ofrece el servicio?",
        "sync", COLOR_SRV),
    ("msg", "PR", "CT",
        "6. asignación OK",
        None, "reply", COLOR_SRV),

    # transacción A
    ("note_anchor", "left", 60, 280,
        ["A · Inicio de TRANSACCIÓN",
         "prisma.$transaction(async tx => { … })"],
        "plain"),
    ("msg", "CT", "PR",
        "7. BEGIN TRANSACTION",
        None, "sync", COLOR_A),
    ("msg", "CT", "PR",
        "8. SELECT * FROM empleados WHERE id = 7 FOR UPDATE",
        "bloqueo pesimista sobre la fila del empleado",
        "sync", COLOR_A),
    ("note_anchor", "right", "PR", 320,
        ["LOCK · adquirido por A",
         "fila empleados(id=7) bloqueada",
         "cualquier tx que pida esta fila espera"],
        "lock"),

    # llega B
    ("msg", "B", "EX",
        "9. POST /api/appointments  (mismo hueco)",
        "request casi simultánea",
        "sync", COLOR_B),
    ("msg", "EX", "CT",
        "10. validar + auth → create()",
        None, "sync", COLOR_B),
    ("msg", "CT", "PR",
        "11. BEGIN + SELECT … FOR UPDATE  (id = 7)",
        None, "sync", COLOR_B),
    ("note_anchor", "right", "PR", 340,
        ["WAIT · B BLOQUEADA",
         "Postgres pausa la 2ª SELECT FOR UPDATE",
         "hasta el COMMIT/ROLLBACK de A"],
        "lock"),

    # A continúa
    ("msg", "CT", "PR",
        "12. prisma.cita.findFirst  (conflicto?)",
        "WHERE empleado_id=7 AND fecha=F AND solapado",
        "sync", COLOR_A),
    ("msg", "PR", "CT",
        "13. sin conflicto → null",
        None, "reply", COLOR_A),
    ("self", "CT",
        "14. priceForAppointment(tx, servicio_id, codigo_descuento)",
        "calcula precio final dentro de la tx; valida cupón si existe",
        COLOR_A),
    ("msg", "CT", "PR",
        "15. INSERT INTO citas (...)",
        "estado=PENDIENTE · precio_pagado · business_id",
        "sync", COLOR_A),
    ("msg", "PR", "CT",
        "16. cita { id: 482 }",
        None, "reply", COLOR_A),
    ("msg", "CT", "PR",
        "17. COMMIT",
        None, "sync", COLOR_A),
    ("note_anchor", "right", "PR", 300,
        ["UNLOCK · Lock liberado",
         "tras COMMIT de A, B puede continuar"],
        "ok"),

    # B se reanuda
    ("msg", "PR", "CT",
        "18. (B reanuda) SELECT FOR UPDATE OK",
        None, "reply", COLOR_B),
    ("msg", "CT", "PR",
        "19. prisma.cita.findFirst (B)",
        "ahora SÍ existe la cita creada por A",
        "sync", COLOR_B),
    ("msg", "PR", "CT",
        "20. conflicto: cita 482",
        None, "reply", COLOR_B),
    ("msg", "CT", "PR",
        "21. ROLLBACK",
        "throw err con statusCode = 409",
        "sync", COLOR_B),
    ("note_anchor", "right", "PR", 320,
        ["B · transacción abortada",
         "ningún registro queda en BD"],
        "lock"),

    # respuestas finales
    ("msg", "CT", "EM",
        "22. audit() + sendAppointmentConfirmation()  (A)",
        "fire-and-forget, no bloquea la respuesta",
        "sync", COLOR_A),
    ("msg", "CT", "EX",
        "23. cita creada",
        None, "reply", COLOR_A),
    ("msg", "EX", "A",
        "24. HTTP 201 Created  +  { cita }",
        None, "reply", COLOR_A),
    ("msg", "CT", "EX",
        "25. throw 409",
        None, "reply", COLOR_B),
    ("msg", "EX", "B",
        "26. HTTP 409 Conflict",
        "“El horario seleccionado ya no está disponible”",
        "reply", COLOR_B),
]


def main():
    # ---- Layout: asignamos y a cada paso; notas comparten y con el msg previo ----
    y = FIRST_MSG_Y
    positions = []      # y de cada paso
    last_msg_y = y      # y del último msg/self (las notas se anclan aquí)

    for s in STEPS:
        kind = s[0]
        if kind in ("msg", "self"):
            positions.append(y)
            last_msg_y = y
            y += Y_STEP
        elif kind == "note_anchor":
            # se ancla a la altura del último msg
            lines = s[4]
            note_h = NOTE_PAD*2 + NOTE_LINE_H*len(lines)
            # centro de la nota un poco por debajo de la flecha
            note_center = last_msg_y + 14
            positions.append(note_center)
            # si la nota se extiende más allá del próximo mensaje, empujamos
            note_bottom = note_center + note_h//2
            next_msg_top = y - 22   # margen para labels del siguiente
            if note_bottom > next_msg_top:
                y += (note_bottom - next_msg_top) + 6

    canvas_h = y + 70

    img = Image.new("RGB", (W, canvas_h), BG)
    draw = ImageDraw.Draw(img)

    # ---------- Cabecera ----------
    title = "Diagrama de Secuencia · Reserva con Bloqueo Pesimista"
    tw = text_w(draw, title, F_TITLE)
    draw.text(((W - tw)//2, HEADER_TOP), title, font=F_TITLE, fill=TITLE_FG)
    sub = ("POST /api/appointments — dos clientes compiten por el mismo hueco; "
           "Postgres serializa con SELECT … FOR UPDATE.")
    tw = text_w(draw, sub, F_SUB)
    draw.text(((W - tw)//2, HEADER_TOP + 34), sub, font=F_SUB, fill=SUBTITLE_FG)

    # ---------- Cajas de participantes ----------
    for pid, x, name, subname, color in PARTS:
        bw = 220
        x1, x2 = x - bw//2, x + bw//2
        draw.rounded_rectangle([(x1, PARTBOX_Y), (x2, PARTBOX_Y + PARTBOX_H)],
                               radius=10, fill=(255,255,255), outline=color, width=2)
        draw.rectangle([(x1, PARTBOX_Y), (x2, PARTBOX_Y + 8)], fill=color)
        tw = text_w(draw, name, F_HEAD)
        draw.text((x - tw//2, PARTBOX_Y + 12), name, font=F_HEAD, fill=color)
        tw = text_w(draw, subname, F_HEADS)
        draw.text((x - tw//2, PARTBOX_Y + 30), subname, font=F_HEADS, fill=(110,115,125))

    # ---------- Lifelines ----------
    lifeline_bottom = canvas_h - 36
    for pid, x, *_ in PARTS:
        dashed_line(draw, x, LIFELINE_TOP, x, lifeline_bottom,
                    fill=LIFELINE, width=2, dash=8, gap=5)

    # ---------- Barras de activación (sobre CT y PR) ----------
    # índices conocidos por construcción de STEPS (no usar magic numbers oscuros)
    def idx_of(label_prefix):
        for i, s in enumerate(STEPS):
            if s[0] in ("msg","self") and s[3].startswith(label_prefix):
                return i
        return None

    a_begin = idx_of("7. ")
    a_commit = idx_of("17. ")
    b_begin = idx_of("11. ")
    b_roll  = idx_of("21. ")
    if None not in (a_begin, a_commit, b_begin, b_roll):
        y_a1 = positions[a_begin] - 14
        y_a2 = positions[a_commit] + 10
        activation_bar(draw, px("CT"), y_a1, y_a2, COLOR_A)
        activation_bar(draw, px("PR"), y_a1, y_a2, COLOR_A)
        y_b1 = positions[b_begin] - 14
        y_b2 = positions[b_roll] + 10
        activation_bar(draw, px("CT") + 12, y_b1, y_b2, COLOR_B)
        activation_bar(draw, px("PR") + 12, y_b1, y_b2, COLOR_B)

    # ---------- Pintar pasos ----------
    for s, y in zip(STEPS, positions):
        kind = s[0]
        if kind == "msg":
            _, src, dst, label, sub, mtype, color = s
            msg(draw, y, src, dst, label, kind=mtype, color=color, sub=sub)
        elif kind == "self":
            _, pid, label, sub, color = s
            self_msg(draw, y, pid, label, color=color, sub=sub)
        elif kind == "note_anchor":
            side = s[1]
            if side == "left":
                _, _, nx, w, lines, ntype = s
            else:
                _, _, anchor_pid, w, lines, ntype = s
                nx = px(anchor_pid) + 26
                if nx + w > W - 30:
                    nx = px(anchor_pid) - w - 26
            if ntype == "lock":
                bg, br = LOCK_NOTE_BG, LOCK_NOTE_BORDER
            elif ntype == "ok":
                bg, br = OK_NOTE_BG, OK_NOTE_BORDER
            else:
                bg, br = NOTE_BG, NOTE_BORDER
            note(draw, nx, y, w, lines, bg=bg, border=br, bold_first=True)

    # ---------- Leyenda ----------
    legend_y = canvas_h - 28
    lx = 60
    # Cliente A
    draw.rectangle([(lx, legend_y+2), (lx+14, legend_y+14)], fill=COLOR_A)
    draw.text((lx+20, legend_y), "Flujo Cliente A", font=F_TAG, fill=(50,55,65))
    lx += text_w(draw, "Flujo Cliente A", F_TAG) + 50
    # Cliente B
    draw.rectangle([(lx, legend_y+2), (lx+14, legend_y+14)], fill=COLOR_B)
    draw.text((lx+20, legend_y), "Flujo Cliente B", font=F_TAG, fill=(50,55,65))
    lx += text_w(draw, "Flujo Cliente B", F_TAG) + 50
    # Sync (flecha continua)
    draw.line([(lx, legend_y+8), (lx+34, legend_y+8)], fill=COLOR_SRV, width=2)
    arrow_head(draw, lx+34, legend_y+8, True, COLOR_SRV, filled=True, size=8)
    draw.text((lx+44, legend_y), "Sync (llamada)", font=F_TAG, fill=(50,55,65))
    lx += 44 + text_w(draw, "Sync (llamada)", F_TAG) + 40
    # Reply (flecha discontinua)
    dashed_line(draw, lx, legend_y+8, lx+34, legend_y+8, fill=COLOR_SRV, width=2, dash=5, gap=3)
    arrow_head(draw, lx+34, legend_y+8, True, COLOR_SRV, filled=False, size=8)
    draw.text((lx+44, legend_y), "Reply (retorno)", font=F_TAG, fill=(50,55,65))
    lx += 44 + text_w(draw, "Reply (retorno)", F_TAG) + 40
    # Lock
    draw.rectangle([(lx, legend_y+2), (lx+14, legend_y+14)], fill=LOCK_NOTE_BORDER)
    draw.text((lx+20, legend_y), "Lock activo en BD", font=F_TAG, fill=(50,55,65))

    foot = "Figura 11. Reserva de cita con SELECT FOR UPDATE — dos clientes concurrentes."
    tw = text_w(draw, foot, F_SUB)
    draw.text(((W - tw)//2, canvas_h - 14), foot, font=F_SUB, fill=SUBTITLE_FG)

    img.save(OUTPUT, "PNG", optimize=True)
    print(f"OK -> {OUTPUT}  ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
