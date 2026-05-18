# Despliegue en AWS (EC2 + RDS)

## Arquitectura Aprovisionada (Real)
- **Servidor Web (EC2TFG):** `t3.medium` (2 vCPUs, 4 GB RAM) — Ubuntu, Nginx + PM2 + backend Node.js + frontend dist.
  - **IP Elástica (Pública Estática):** `100.51.135.95`
  - **ID de Instancia:** `i-01cc65532ff7aa7ad`
  - **Par de Claves:** `vockey`
- **Base de Datos (basedatostfg):** `db.t4g.micro` (Arquitectura ARM / Graviton2) — MySQL Community (versión recomendada), aislada en subredes privadas.
  - **Endpoint RDS:** `basedatostfg.cwkirqmo59cg.us-east-1.rds.amazonaws.com`
  - **Puerto:** `3306`
  - **Usuario Maestro:** `admin` (Contraseña: `TFGcoworking2024!` o `basedatostfg123`)

## Costes estimados (solo cuando está encendido)
| Servicio | Instancia | Coste/hora |
|---|---|---|
| EC2 | t3.medium | ~$0.0416/h |
| RDS | db.t4g.micro | ~$0.016/h |

~$0.057/hora en total. Con los $100/$50 de crédito Academy tienes de sobra para el desarrollo y la defensa.

## Importante: RDS se auto-arranca a los 7 días
- EC2 → Stop instance (queda parada indefinidamente hasta que la inicies tú).
- RDS → Stop temporarily (se auto-arranca solo a los 7 días por política de AWS — recuerda volver a pararla manualmente si no la usas para evitar consumir el saldo del laboratorio).

---

## Configuración de Seguridad en la VPC
1. **Grupo de Seguridad `SeguridadTFG` (EC2):** Abre puertos `22` (SSH), `80` (HTTP) y `443` (HTTPS) desde cualquier origen (`0.0.0.0/0`).
2. **Grupo de Seguridad `BaseDatosTFG-SG` (RDS):** Abre puerto `3306` (MySQL) **únicamente** con origen en el grupo `SeguridadTFG` (aislamiento perimetral de la base de datos).

---

## Variables de entorno de producción (backend .env)

```
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://admin:TFGcoworking2024!@basedatostfg.cwkirqmo59cg.us-east-1.rds.amazonaws.com:3306/basedatostfg
# Nota: Si la contraseña anterior te da error, utiliza:
# DATABASE_URL=mysql://admin:basedatostfg123@basedatostfg.cwkirqmo59cg.us-east-1.rds.amazonaws.com:3306/basedatostfg
JWT_SECRET=<cadena-aleatoria-larga-segura>
FRONTEND_URL=https://<tudominio.com>
CLOUDINARY_CLOUD_NAME=ddw6o6dbj
CLOUDINARY_API_KEY=<igual que dev>
CLOUDINARY_API_SECRET=<igual que dev>
CLOUDINARY_FOLDER=reservas-tfg
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<clave SES>
SMTP_PASSWORD=<clave SES>
SMTP_FROM=noreply@<tudominio.com>
```

> Para emails en producción usar **Amazon SES** (gratis hasta 62k emails/mes desde EC2).
> Mailtrap solo vale para desarrollo local.

---

## Script de despliegue en el EC2

```bash
# 1. Instalar dependencias del sistema
sudo apt update && sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
npm install -g pm2

# 2. Clonar el repo
git clone <tu-repo> /var/www/app
cd /var/www/app

# 3. Backend
cd backend
npm install
cp .env.production .env
npx prisma migrate deploy
npm run seed
pm2 start src/index.js --name reservas-backend
pm2 save
pm2 startup

# 4. Frontend
cd ../frontend
npm install
npm run build
sudo cp -r dist /var/www/dist

# 5. SSL
sudo certbot --nginx -d <tudominio.com>
```

---

## Config nginx (/etc/nginx/sites-available/reservas)

```nginx
server {
    listen 443 ssl;
    server_name <tudominio.com>;

    # Frontend
    location / {
        root /var/www/dist;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name <tudominio.com>;
    return 301 https://$host$request_uri;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/reservas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Checklist final antes de subir

- [ ] `npm run build` en frontend funciona sin errores
- [ ] `.env` de producción con todos los valores reales
- [ ] JWT_SECRET cambiado (no usar el de dev)
- [ ] RDS endpoint anotado y accesible desde EC2
- [ ] `npx prisma migrate deploy` ejecutado (no `db push`)
- [ ] `npm run seed` ejecutado
- [ ] PM2 corriendo y configurado para arrancar con el sistema
- [ ] nginx con SSL activo (certbot)
- [ ] HTTPS funcionando — las cookies `secure: true` lo requieren
