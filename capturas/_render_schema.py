"""Renderiza schema.prisma como una imagen PNG con resaltado de sintaxis tipo VS Code."""
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SCHEMA_PATH = Path(r"c:\Users\SrAndrew\Desktop\TrabajoTFG\ProyectoTFG\backend\prisma\schema.prisma")
OUTPUT_PATH = Path(r"c:\Users\SrAndrew\Desktop\TrabajoTFG\ProyectoTFG\capturas\11_schema_prisma.png")

# Paleta tipo VS Code Dark+
BG          = (30, 30, 30)
GUTTER_BG   = (37, 37, 38)
LINE_NUM    = (133, 133, 133)
DEFAULT_FG  = (212, 212, 212)
KEYWORD     = (86, 156, 214)    # azul (model, enum, datasource...)
TYPE_FG     = (78, 201, 176)    # verde-azulado (Int, String, DateTime...)
STRING_FG   = (206, 145, 120)   # naranja (strings)
COMMENT_FG  = (106, 153, 85)    # verde (comentarios)
ATTR_FG     = (220, 220, 170)   # amarillo (@id, @default...)
NUMBER_FG   = (181, 206, 168)   # verde claro (números)
ENUM_VAL    = (79, 193, 255)    # azul claro (valores enum mayúsculas)
PUNCT_FG    = (212, 212, 212)

KEYWORDS = {"model", "enum", "datasource", "generator", "provider", "url", "env"}
TYPES = {
    "Int", "String", "Boolean", "DateTime", "Decimal", "Float", "Json", "Bytes",
    "Rol", "EstadoCita", "EstadoReserva", "TipoRecurso", "BusinessEstado",
    "Usuario", "Empleado", "Servicio", "ServicioEmpleado", "Disponibilidad",
    "Cita", "Recurso", "ReservaRecurso", "Business", "PasswordResetToken",
    "EmailVerificationToken", "Notification", "CodigoDescuento", "Review",
    "AuditLog", "RefreshToken",
}

TOKEN_RE = re.compile(
    r'(?P<comment>//[^\n]*)'
    r'|(?P<string>"[^"\n]*")'
    r'|(?P<attr>@@?[A-Za-z_][A-Za-z0-9_]*)'
    r'|(?P<ident>[A-Za-z_][A-Za-z0-9_]*)'
    r'|(?P<number>\d+(?:\.\d+)?)'
    r'|(?P<punct>[{}()\[\],?:=.])'
    r'|(?P<ws>\s+)'
    r'|(?P<other>.)'
)

def color_for(kind, text):
    if kind == "comment":  return COMMENT_FG
    if kind == "string":   return STRING_FG
    if kind == "attr":     return ATTR_FG
    if kind == "number":   return NUMBER_FG
    if kind == "ident":
        if text in KEYWORDS:        return KEYWORD
        if text in TYPES:           return TYPE_FG
        if text.isupper() and len(text) > 1: return ENUM_VAL
        return DEFAULT_FG
    if kind == "punct":    return PUNCT_FG
    return DEFAULT_FG


def load_font(size):
    for name in ("consola.ttf", "CascadiaCode.ttf", "CascadiaMono.ttf", "DejaVuSansMono.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def main():
    text = SCHEMA_PATH.read_text(encoding="utf-8")
    lines = text.splitlines() or [""]

    font_size = 16
    font = load_font(font_size)
    # ancho de carácter (asumimos monoespaciado)
    bbox = font.getbbox("M")
    ch_w = bbox[2] - bbox[0]
    line_h = font_size + 6

    max_cols = max((len(l) for l in lines), default=80)
    gutter_w = ch_w * (len(str(len(lines))) + 2) + 10
    padding_x = 16
    padding_y = 16

    img_w = gutter_w + padding_x + ch_w * max_cols + padding_x
    img_h = padding_y * 2 + line_h * len(lines)

    img = Image.new("RGB", (img_w, img_h), BG)
    draw = ImageDraw.Draw(img)

    # gutter
    draw.rectangle([(0, 0), (gutter_w, img_h)], fill=GUTTER_BG)

    for idx, line in enumerate(lines):
        y = padding_y + idx * line_h
        # numero de linea
        num_text = str(idx + 1).rjust(len(str(len(lines))))
        draw.text((gutter_w - ch_w * (len(num_text) + 1), y), num_text,
                  font=font, fill=LINE_NUM)

        x = gutter_w + padding_x
        for m in TOKEN_RE.finditer(line):
            kind = m.lastgroup
            tok = m.group()
            if kind == "ws":
                x += ch_w * len(tok)
                continue
            col = color_for(kind, tok)
            draw.text((x, y), tok, font=font, fill=col)
            x += ch_w * len(tok)

    img.save(OUTPUT_PATH, "PNG", optimize=True)
    print(f"OK -> {OUTPUT_PATH}  ({img_w}x{img_h})")


if __name__ == "__main__":
    main()
