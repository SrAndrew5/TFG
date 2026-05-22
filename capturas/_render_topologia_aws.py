"""Diagrama de Topología de Red e Infraestructura Cloud en AWS.

Muestra la VPC del TFG con:
  - 2 Availability Zones (eu-west-1a / eu-west-1b)
  - 3 capas de subredes por AZ (public / private app / private data)
  - ALB, NAT Gateway, EC2 (Node.js), RDS (PostgreSQL), MinIO (S3-compat)
  - Servicios fuera de la VPC: Route 53, CloudFront, ACM, WAF, S3, SES, CloudWatch, IAM
  - Flechas de tráfico: ingress (clientes → ALB → EC2 → RDS/MinIO) y egress
    (EC2 → NAT → Internet para SES, npm, etc.)
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUTPUT = Path(r"c:\Users\SrAndrew\Desktop\TrabajoTFG\ProyectoTFG\capturas\15_topologia_aws.png")

# ---------- Canvas ----------
W, H = 1900, 1500
BG = (250, 250, 252)

# ---------- Paleta AWS ----------
AWS_DARK     = ( 35,  47,  62)   # #232F3E
AWS_ORANGE   = (255, 153,   0)   # #FF9900 — Compute
AWS_BLUE     = ( 82, 127, 255)   # #527FFF — Database
AWS_GREEN    = ( 86, 154,  49)   # #569A31 — Storage
AWS_PURPLE   = (140,  79, 255)   # #8C4FFF — Networking
AWS_RED      = (221,  52,  76)   # #DD344C — Security
AWS_TEAL     = ( 31, 137, 138)   # #1F898A — Mgmt / Logs
AWS_PINK     = (197,  85, 213)   # #C555D5 — Analytics

# ---------- Colores de capas ----------
COLOR_VPC_BORDER     = ( 36, 138, 184)
COLOR_VPC_BG         = (235, 247, 252)

COLOR_AZ_BORDER      = (102, 152, 196)
COLOR_AZ_BG          = (244, 250, 254)

COLOR_PUBLIC_BORDER  = ( 95, 163,  82)
COLOR_PUBLIC_BG      = (232, 245, 226)

COLOR_APP_BORDER     = ( 82, 127, 255)
COLOR_APP_BG         = (225, 234, 252)

COLOR_DATA_BORDER    = (200,  80,  80)
COLOR_DATA_BG        = (252, 232, 232)

COLOR_INTERNET_BG    = (243, 243, 247)
COLOR_INTERNET_BORDER= (110, 115, 125)

TEXT_FG     = ( 33,  37,  41)
TEXT_DIM    = ( 90,  95, 105)
TEXT_LIGHT  = (250, 250, 250)


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

F_TITLE  = font(28, bold=True)
F_SUB    = font(15)
F_LAYER  = font(18, bold=True)
F_SUBNET = font(14, bold=True)
F_CIDR   = font(12)
F_SVC    = font(13, bold=True)
F_SVCSUB = font(11)
F_TAG    = font(11, bold=True)
F_ARROW  = font(11, bold=True)


def text_w(d, t, f):
    b = d.textbbox((0,0), t, font=f); return b[2]-b[0]


def text_size(d, t, f):
    b = d.textbbox((0,0), t, font=f); return b[2]-b[0], b[3]-b[1]


# ---------- Primitivas ----------
def service_icon(d, cx, cy, color, letter, label, sublabel=None, *, size=48):
    """Dibuja un cuadrado de color con una letra dentro + label debajo."""
    x1, y1 = cx - size//2, cy - size//2
    x2, y2 = cx + size//2, cy + size//2
    # caja con sombra
    d.rounded_rectangle([(x1+2, y1+3),(x2+2, y2+3)], radius=8, fill=(220,222,228))
    d.rounded_rectangle([(x1, y1),(x2, y2)], radius=8, fill=color, outline=AWS_DARK, width=2)
    # letra
    lw, lh = text_size(d, letter, F_LAYER)
    d.text((cx - lw//2, cy - lh//2 - 2), letter, font=F_LAYER, fill=TEXT_LIGHT)
    # label debajo
    lblw, _ = text_size(d, label, F_SVC)
    d.text((cx - lblw//2, y2 + 6), label, font=F_SVC, fill=TEXT_FG)
    if sublabel:
        sw, _ = text_size(d, sublabel, F_SVCSUB)
        d.text((cx - sw//2, y2 + 24), sublabel, font=F_SVCSUB, fill=TEXT_DIM)


def labeled_box(d, x1, y1, x2, y2, label, *, border, bg, label_color=None,
                cidr=None, radius=10, label_pad=8):
    """Caja con etiqueta superior pegada al borde."""
    if label_color is None:
        label_color = border
    # cuerpo (semitransparente sim. con bg sólido)
    d.rounded_rectangle([(x1, y1), (x2, y2)], radius=radius,
                        fill=bg, outline=border, width=2)
    # etiqueta encima
    text = label
    if cidr:
        text = f"{label}   {cidr}"
    tw, th = text_size(d, text, F_SUBNET)
    tab_w = tw + label_pad*2 + 6
    d.rectangle([(x1 + 12, y1 - 2), (x1 + 12 + tab_w, y1 + th + 6)],
                fill=border)
    d.text((x1 + 12 + label_pad, y1 + 2), text, font=F_SUBNET, fill=TEXT_LIGHT)


def arrow(d, x1, y1, x2, y2, color, label=None, *, thick=2, dashed=False, head=12):
    if dashed:
        # línea punteada
        dx, dy = x2-x1, y2-y1
        L = math.hypot(dx, dy)
        if L > 0:
            ux, uy = dx/L, dy/L
            pos, dash, gap = 0, 9, 6
            while pos < L:
                a, b = pos, min(pos+dash, L)
                d.line([(x1+ux*a, y1+uy*a), (x1+ux*b, y1+uy*b)],
                       fill=color, width=thick)
                pos += dash + gap
    else:
        d.line([(x1, y1), (x2, y2)], fill=color, width=thick)
    # cabeza
    ang = math.atan2(y2-y1, x2-x1)
    a1 = ang + math.radians(150)
    a2 = ang - math.radians(150)
    d.polygon([(x2, y2),
               (x2 + head*math.cos(a1), y2 + head*math.sin(a1)),
               (x2 + head*math.cos(a2), y2 + head*math.sin(a2))],
              fill=color)
    if label:
        mx, my = (x1+x2)//2, (y1+y2)//2
        tw = text_w(d, label, F_ARROW)
        d.rectangle([(mx-tw//2-5, my-9),(mx+tw//2+5, my+10)], fill=(255,255,255))
        d.text((mx-tw//2, my-7), label, font=F_ARROW, fill=color)


def cloud(d, cx, cy, w, h, color_border, color_bg, label):
    """Dibuja una nube (Internet) simplificada."""
    x1, y1, x2, y2 = cx-w//2, cy-h//2, cx+w//2, cy+h//2
    d.rounded_rectangle([(x1, y1+h//4), (x2, y2)], radius=h//4,
                        fill=color_bg, outline=color_border, width=2)
    d.ellipse([(x1+w*0.05, y1), (x1+w*0.45, y1+h*0.7)],
              fill=color_bg, outline=color_border, width=2)
    d.ellipse([(x1+w*0.30, y1-h*0.1), (x1+w*0.70, y1+h*0.6)],
              fill=color_bg, outline=color_border, width=2)
    d.ellipse([(x1+w*0.55, y1), (x1+w*0.95, y1+h*0.7)],
              fill=color_bg, outline=color_border, width=2)
    # tapamos las uniones inferiores
    d.rectangle([(x1+w*0.10, y1+h*0.35),(x2-w*0.10, y1+h*0.6)],
                fill=color_bg)
    tw, _ = text_size(d, label, F_SVC)
    d.text((cx-tw//2, cy-6), label, font=F_SVC, fill=TEXT_FG)


# ---------- Render ----------
def main():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # ===== Cabecera =====
    title = "Topología de Red e Infraestructura AWS"
    tw = text_w(d, title, F_TITLE)
    d.text(((W-tw)//2, 22), title, font=F_TITLE, fill=AWS_DARK)
    sub = ("Región eu-west-1  ·  VPC 10.0.0.0/16  ·  2 AZs  ·  3 capas de subredes  ·  "
           "Application Load Balancer + EC2 (Node.js) + RDS PostgreSQL + MinIO (S3-compat)")
    tw = text_w(d, sub, F_SUB)
    d.text(((W-tw)//2, 60), sub, font=F_SUB, fill=TEXT_DIM)

    # ===== Banda Internet edge =====
    edge_y_top, edge_y_bot = 110, 250
    labeled_box(d, 40, edge_y_top, W-40, edge_y_bot, "INTERNET EDGE",
                border=COLOR_INTERNET_BORDER, bg=COLOR_INTERNET_BG)
    # icons de la banda
    cy = (edge_y_top + edge_y_bot)//2 - 6
    cloud(d, 180, cy, 130, 70, COLOR_INTERNET_BORDER, (255,255,255), "Internet")
    service_icon(d,  420, cy, AWS_PURPLE, "53", "Route 53",       "DNS gestionado")
    service_icon(d,  680, cy, AWS_PURPLE, "CF", "CloudFront",     "CDN + cache TLS")
    service_icon(d,  940, cy, AWS_RED,    "AC", "ACM",            "Certificados TLS")
    service_icon(d, 1200, cy, AWS_RED,    "WF", "WAF",            "Reglas / rate-limit")
    service_icon(d, 1460, cy, AWS_DARK,   "EU", "Usuarios EU",    "Web + Mobile")
    # flechas dentro del edge
    arrow(d, 250, cy, 392, cy, TEXT_DIM, head=10)
    arrow(d, 448, cy, 652, cy, TEXT_DIM, head=10)
    arrow(d, 708, cy, 916, cy, TEXT_DIM, head=10)
    arrow(d, 968, cy, 1176, cy, TEXT_DIM, head=10)
    # WAF protege ACM/CloudFront — flecha vertical pequeña
    arrow(d, 1200, cy+30, 1200, cy+60, COLOR_INTERNET_BORDER, dashed=True, head=8)
    arrow(d, 1430, cy, 1228, cy, TEXT_DIM, head=10)

    # ===== VPC =====
    vpc_y1, vpc_y2 = 290, 1230
    labeled_box(d, 40, vpc_y1, W-40, vpc_y2, "VPC  ·  reservas-vpc",
                border=COLOR_VPC_BORDER, bg=COLOR_VPC_BG, cidr="10.0.0.0/16")

    # IGW
    igw_x, igw_y = W//2, vpc_y1 + 50
    service_icon(d, igw_x, igw_y, AWS_PURPLE, "IG", "Internet Gateway", "ingreso / salida pública")
    # flechas Internet ↔ IGW
    arrow(d, igw_x, edge_y_bot + 6, igw_x, igw_y - 30, AWS_PURPLE, head=10, thick=2)
    arrow(d, igw_x, igw_y + 30, igw_x, igw_y + 70, AWS_PURPLE, head=10, thick=2)

    # ===== 2 AZs =====
    az_top    = vpc_y1 + 130
    az_bottom = vpc_y2 - 30
    az_gap    = 20
    az_w      = (W - 80 - az_gap - 80) // 2     # margen lateral 80 + 80 dentro de la VPC
    az_a_x1   = 80
    az_a_x2   = az_a_x1 + az_w
    az_b_x1   = az_a_x2 + az_gap
    az_b_x2   = az_b_x1 + az_w

    labeled_box(d, az_a_x1, az_top, az_a_x2, az_bottom,
                "Availability Zone  ·  eu-west-1a",
                border=COLOR_AZ_BORDER, bg=COLOR_AZ_BG)
    labeled_box(d, az_b_x1, az_top, az_b_x2, az_bottom,
                "Availability Zone  ·  eu-west-1b",
                border=COLOR_AZ_BORDER, bg=COLOR_AZ_BG)

    # subredes (3 bandas por AZ)
    sub_pad_top    = 60
    sub_pad_bot    = 18
    sub_gap        = 22
    avail = (az_bottom - az_top) - sub_pad_top - sub_pad_bot - 2*sub_gap
    sub_h          = avail // 3

    def az_subnets(x1, x2, az_letter, cidrs):
        """Pinta las 3 subredes y devuelve sus rectángulos (centro y bounds)."""
        y_start = az_top + sub_pad_top
        rects = []
        layers = [
            ("Public Subnet",       COLOR_PUBLIC_BORDER, COLOR_PUBLIC_BG, cidrs[0]),
            ("Private App Subnet",  COLOR_APP_BORDER,    COLOR_APP_BG,    cidrs[1]),
            ("Private Data Subnet", COLOR_DATA_BORDER,   COLOR_DATA_BG,   cidrs[2]),
        ]
        y = y_start
        for label, border, bg, cidr in layers:
            labeled_box(d, x1 + 18, y, x2 - 18, y + sub_h,
                        f"{label}",
                        border=border, bg=bg, cidr=cidr)
            rects.append((x1 + 18, y, x2 - 18, y + sub_h))
            y += sub_h + sub_gap
        return rects

    rects_a = az_subnets(az_a_x1, az_a_x2, "a",
                         ["10.0.1.0/24", "10.0.10.0/24", "10.0.30.0/24"])
    rects_b = az_subnets(az_b_x1, az_b_x2, "b",
                         ["10.0.2.0/24", "10.0.20.0/24", "10.0.40.0/24"])

    # ===== Iconos dentro de cada subred =====
    def center_of(r, frac_x=0.5, frac_y=0.5):
        x = r[0] + int((r[2]-r[0]) * frac_x)
        y = r[1] + int((r[3]-r[1]) * frac_y)
        return x, y

    # Public AZ-A: ALB-A + NAT-A
    x, y = center_of(rects_a[0], 0.30, 0.58)
    service_icon(d, x, y, AWS_ORANGE, "LB", "ALB node",   "AZ-a")
    alb_a = (x, y)
    x, y = center_of(rects_a[0], 0.72, 0.58)
    service_icon(d, x, y, AWS_PURPLE, "NA", "NAT Gateway","outbound AZ-a")
    nat_a = (x, y)

    # Public AZ-B: ALB-B + NAT-B
    x, y = center_of(rects_b[0], 0.30, 0.58)
    service_icon(d, x, y, AWS_ORANGE, "LB", "ALB node",   "AZ-b")
    alb_b = (x, y)
    x, y = center_of(rects_b[0], 0.72, 0.58)
    service_icon(d, x, y, AWS_PURPLE, "NA", "NAT Gateway","outbound AZ-b")
    nat_b = (x, y)

    # Private App AZ-A: EC2 (Node)
    x, y = center_of(rects_a[1], 0.50, 0.58)
    service_icon(d, x, y, AWS_ORANGE, "E2", "EC2 · Node.js","Express API · pino")
    ec2_a = (x, y)
    # Private App AZ-B
    x, y = center_of(rects_b[1], 0.50, 0.58)
    service_icon(d, x, y, AWS_ORANGE, "E2", "EC2 · Node.js","Express API · pino")
    ec2_b = (x, y)

    # Private Data AZ-A: RDS standby + MinIO replica
    x, y = center_of(rects_a[2], 0.30, 0.55)
    service_icon(d, x, y, AWS_BLUE, "DB", "RDS  ·  Postgres", "standby (read replica)")
    rds_a = (x, y)
    x, y = center_of(rects_a[2], 0.72, 0.55)
    service_icon(d, x, y, AWS_GREEN, "MI", "MinIO", "EC2 + EBS · replica")
    mi_a = (x, y)

    # Private Data AZ-B: RDS primary + MinIO primary
    x, y = center_of(rects_b[2], 0.30, 0.55)
    service_icon(d, x, y, AWS_BLUE, "DB", "RDS  ·  Postgres", "primary · Multi-AZ")
    rds_b = (x, y)
    x, y = center_of(rects_b[2], 0.72, 0.55)
    service_icon(d, x, y, AWS_GREEN, "MI", "MinIO", "EC2 + EBS · primary")
    mi_b = (x, y)

    # ===== Flechas internas =====
    # IGW → ALB-A y ALB-B (ingress HTTPS)
    arrow(d, igw_x - 8, igw_y + 30, alb_a[0] + 20, alb_a[1] - 30,
          AWS_PURPLE, label="HTTPS :443", thick=2, head=10)
    arrow(d, igw_x + 8, igw_y + 30, alb_b[0] - 20, alb_b[1] - 30,
          AWS_PURPLE, label="HTTPS :443", thick=2, head=10)

    # ALB → EC2 (mismo AZ)
    arrow(d, alb_a[0], alb_a[1] + 30, ec2_a[0], ec2_a[1] - 30,
          AWS_ORANGE, label=":3000", thick=2, head=10)
    arrow(d, alb_b[0], alb_b[1] + 30, ec2_b[0], ec2_b[1] - 30,
          AWS_ORANGE, label=":3000", thick=2, head=10)
    # ALB cross-zone (línea fina punteada para indicar que también balancea cruzado)
    arrow(d, alb_a[0] + 24, alb_a[1] + 30, ec2_b[0] - 60, ec2_b[1] - 30,
          AWS_ORANGE, thick=1, head=8, dashed=True)
    arrow(d, alb_b[0] - 24, alb_b[1] + 30, ec2_a[0] + 60, ec2_a[1] - 30,
          AWS_ORANGE, thick=1, head=8, dashed=True)

    # EC2 → RDS (mismo AZ y cruzado para failover)
    arrow(d, ec2_a[0] - 14, ec2_a[1] + 30, rds_a[0], rds_a[1] - 30,
          AWS_BLUE, label=":5432", thick=2, head=10)
    arrow(d, ec2_b[0] - 14, ec2_b[1] + 30, rds_b[0], rds_b[1] - 30,
          AWS_BLUE, label=":5432 primary", thick=2, head=10)
    arrow(d, ec2_a[0] + 30, ec2_a[1] + 30, rds_b[0] - 60, rds_b[1] - 30,
          AWS_BLUE, thick=1, head=8, dashed=True)

    # EC2 → MinIO
    arrow(d, ec2_a[0] + 14, ec2_a[1] + 30, mi_a[0], mi_a[1] - 30,
          AWS_GREEN, label="S3 API :9000", thick=2, head=10)
    arrow(d, ec2_b[0] + 14, ec2_b[1] + 30, mi_b[0], mi_b[1] - 30,
          AWS_GREEN, label="S3 API :9000", thick=2, head=10)

    # RDS primario ↔ standby (replicación)
    arrow(d, rds_b[0] - 30, rds_b[1], rds_a[0] + 30, rds_a[1],
          AWS_BLUE, label="streaming replication", thick=2, head=10, dashed=True)

    # NAT egress: EC2 → NAT → IGW
    arrow(d, ec2_a[0] - 24, ec2_a[1] - 30, nat_a[0] - 18, nat_a[1] + 30,
          TEXT_DIM, thick=1, head=8, dashed=True)
    arrow(d, ec2_b[0] - 24, ec2_b[1] - 30, nat_b[0] - 18, nat_b[1] + 30,
          TEXT_DIM, thick=1, head=8, dashed=True)
    # NAT → IGW (saliente)
    arrow(d, nat_a[0], nat_a[1] - 30, igw_x - 50, igw_y + 10,
          TEXT_DIM, thick=1, head=8, dashed=True)
    arrow(d, nat_b[0], nat_b[1] - 30, igw_x + 50, igw_y + 10,
          TEXT_DIM, thick=1, head=8, dashed=True)

    # ===== Banda inferior: servicios fuera de la VPC =====
    ext_y1, ext_y2 = vpc_y2 + 30, vpc_y2 + 230
    labeled_box(d, 40, ext_y1, W-40, ext_y2,
                "SERVICIOS AWS GLOBALES  /  REGIONALES (fuera de la VPC)",
                border=AWS_DARK, bg=(248, 248, 251))
    ey = (ext_y1 + ext_y2)//2 + 6
    service_icon(d,  240, ey, AWS_GREEN,  "S3", "S3 Bucket",      "SPA build + backups")
    service_icon(d,  520, ey, AWS_GREEN,  "SE", "SES",            "Email transaccional")
    service_icon(d,  800, ey, AWS_TEAL,   "CW", "CloudWatch",     "logs + métricas")
    service_icon(d, 1080, ey, AWS_RED,    "IM", "IAM",            "Roles / políticas")
    service_icon(d, 1360, ey, AWS_BLUE,   "SM", "Secrets Manager","DB password · JWT")
    service_icon(d, 1640, ey, AWS_PURPLE, "VE", "VPC Endpoints",  "S3 / Secrets sin NAT")

    # EC2 → S3 / SES / CloudWatch / Secrets (a través de VPC Endpoints o NAT)
    arrow(d, ec2_a[0], vpc_y2 - 4, 240, ey - 30, AWS_GREEN, thick=1, head=8, dashed=True)
    arrow(d, ec2_a[0], vpc_y2 - 4, 800, ey - 30, AWS_TEAL,  thick=1, head=8, dashed=True)
    arrow(d, ec2_b[0], vpc_y2 - 4, 520, ey - 30, AWS_GREEN, thick=1, head=8, dashed=True)
    arrow(d, ec2_b[0], vpc_y2 - 4, 1360, ey - 30, AWS_BLUE, thick=1, head=8, dashed=True)
    # CloudFront origen → S3
    arrow(d, 680, edge_y_bot + 6, 240, ey - 30, AWS_PURPLE,
          label="origen estáticos", thick=1, head=8, dashed=True)

    # ===== Leyenda =====
    legend_y = H - 38
    lx = 60
    legend = [
        ("Compute",     AWS_ORANGE),
        ("Database",    AWS_BLUE),
        ("Storage",     AWS_GREEN),
        ("Networking",  AWS_PURPLE),
        ("Security",    AWS_RED),
        ("Mgmt / Logs", AWS_TEAL),
    ]
    for label, col in legend:
        d.rectangle([(lx, legend_y+2),(lx+14, legend_y+14)], fill=col, outline=AWS_DARK)
        d.text((lx + 20, legend_y), label, font=F_TAG, fill=TEXT_FG)
        lx += text_w(d, label, F_TAG) + 36
    # tipo de flecha
    d.line([(lx, legend_y+8),(lx+30, legend_y+8)], fill=TEXT_DIM, width=2)
    d.text((lx+38, legend_y), "tráfico app", font=F_TAG, fill=TEXT_FG)
    lx += 38 + text_w(d, "tráfico app", F_TAG) + 28
    for i in range(0, 30, 9):
        d.line([(lx+i, legend_y+8),(lx+i+5, legend_y+8)], fill=TEXT_DIM, width=2)
    d.text((lx+38, legend_y), "egress / replica / VPC endpoint", font=F_TAG, fill=TEXT_FG)

    foot = "Figura 13. Topología de red AWS — VPC con 2 AZs y 3 capas de subredes (public / private app / private data)."
    tw = text_w(d, foot, F_SUB)
    d.text(((W-tw)//2, H-18), foot, font=F_SUB, fill=TEXT_DIM)

    img.save(OUTPUT, "PNG", optimize=True)
    print(f"OK -> {OUTPUT}  ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
