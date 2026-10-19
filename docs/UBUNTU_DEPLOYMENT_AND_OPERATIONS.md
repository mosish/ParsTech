# ParsTech Phase 1 — Ubuntu Deployment, Security & Operations Guide

## 1. Architecture & Network Topology
- **Framework:** Next.js App Router (TypeScript, standalone output) running as non-root user `nextjs` (`UID 1001`).
- **Database:** PostgreSQL 15 managed via Prisma versioned migrations (`prisma migrate deploy`).
- **Monetary Representation:** All prices (`priceToman`, `basePriceToman`, `compareAtToman`) are stored as 64-bit integers (`BigInt`) representing whole Iranian Tomans (`1 Toman = 10 IRR`).
- **Host Reverse Proxy:** Nginx runs on the Ubuntu host (ports `80` and `443`) and proxies to `127.0.0.1:3000`.
- **Port Binding & Socket Security:**
  - The Next.js container port is bound strictly to `127.0.0.1:3000:3000`.
  - The PostgreSQL container publishes **zero host ports** and communicates only on the internal `parstech_internal` Docker bridge network.
  - The Docker socket (`/var/run/docker.sock`) is **never** mounted into any container.

---

## 2. Docker & Firewall Interaction (Important Warning on UFW)
By default on Ubuntu, Docker manipulates `iptables` directly (`DOCKER` and `DOCKER-USER` chains) in the `nat` and `filter` tables **before** `ufw` rules are evaluated.
- **Do NOT rely on UFW alone** to block container ports: if a container publishes `-p 3000:3000` (which binds `0.0.0.0:3000`), Docker will bypass `ufw deny 3000` and expose port 3000 to the public internet.
- **Mandatory Controls:**
  1. Always bind host ports explicitly to loopback in `docker-compose.yml`: `"127.0.0.1:3000:3000"`.
  2. Never add a `ports:` mapping to the `postgres` service in `docker-compose.yml`.
  3. Optionally add explicit drop rules in the `DOCKER-USER` chain in `/etc/ufw/after.rules` for external interfaces (`eth0` / `ens3`).

---

## 3. SSH & Host Firewall Hardening Checklist
*(Review existing active sessions and console access before applying on a target server—do not run blindly on an unknown host.)*
1. **SSH Hardening (`/etc/ssh/sshd_config.d/hardening.conf`):**
   - Authenticate via Ed25519 SSH keys (`PasswordAuthentication no`, `KbdInteractiveAuthentication no`).
   - Disable root password login (`PermitRootLogin prohibit-password` or `no`).
   - Validate configuration with `sudo sshd -t` before reloading (`sudo systemctl reload ssh`).
2. **Host Firewall (`ufw`):**
   - Allow OpenSSH (`sudo ufw allow OpenSSH`), HTTP (`sudo ufw allow 80/tcp`), and HTTPS (`sudo ufw allow 443/tcp`).
   - Enable default deny incoming (`sudo ufw default deny incoming && sudo ufw default allow outgoing`).

---

## 4. Custom-Domain DNS Configuration (Apex & `www`)
- Configure DNS at your registrar/DNS provider:
  - **Apex (`@` / `parstech.example.com`):** `A` record pointing to the Ubuntu server's public IPv4 address.
  - **`www` (`www.parstech.example.com`):** `A` record pointing to the same IPv4 address (or `CNAME` to `parstech.example.com`).
- **IPv6 (`AAAA`) Policy:** Publish `AAAA` records for `@` and `www` **only** when native IPv6 routing is actually configured and verified on the Ubuntu host (`ip -6 route show default`) and Nginx `listen [::]:80;` / `listen [::]:443 ssl http2;` directives are enabled. Publishing `AAAA` records without working IPv6 causes connection timeouts for dual-stack clients.
- **Trusted Origin:** Set `PRIMARY_ORIGIN="https://parstech.example.com"` in `.env`. All canonical URLs, OpenGraph links, and `sitemap.xml` URLs are generated exclusively from `PRIMARY_ORIGIN`.

---

## 5. Ubuntu Host Setup & Environment Permissions
```bash
# 1. Create application directory owned by deploy user
sudo mkdir -p /opt/parstech /var/backups/parstech/postgres
sudo chown -R "$USER:$USER" /opt/parstech /var/backups/parstech

# 2. Clone repository and create production .env from template
cd /opt/parstech
cp .env.example .env

# 3. Restrict .env permissions so only the owner can read/write secrets
chmod 600 .env
```
Edit `/opt/parstech/.env`:
- Set a strong random `POSTGRES_PASSWORD`.
- Set `DATABASE_URL="postgresql://parstech:<POSTGRES_PASSWORD>@postgres:5432/parstech_prod?schema=public"`.
- Set `PRIMARY_ORIGIN="https://parstech.example.com"`.
- Set `APP_ENV="production"`.
- Set `TRUSTED_PROXY_IPS="127.0.0.1,::1"`.

---

## 6. TLS Issuance, Renewal & Nginx Reverse Proxy
1. Install Nginx and Certbot on the Ubuntu host:
   ```bash
   sudo apt-get update && sudo apt-get install -y nginx certbot python3-certbot-nginx
   sudo mkdir -p /var/www/certbot
   ```
2. Issue the Let's Encrypt certificate for both apex and `www`:
   ```bash
   sudo certbot certonly --webroot -w /var/www/certbot \
     -d parstech.example.com -d www.parstech.example.com
   ```
3. Install the Nginx config (`deploy/nginx/parstech.conf` -> `/etc/nginx/sites-available/parstech.conf`), replace `parstech.example.com` with your domain, test, and reload:
   ```bash
   sudo cp deploy/nginx/parstech.conf /etc/nginx/sites-available/parstech.conf
   sudo ln -sf /etc/nginx/sites-available/parstech.conf /etc/nginx/sites-enabled/parstech.conf
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. **Redirect Loop Prevention & Path Preservation:**
   - HTTP (`:80`) and `https://www.` redirect with `301` to `https://parstech.example.com$request_uri`, preserving the full path and query string.
   - The primary `https://parstech.example.com` server block forwards `X-Forwarded-Proto $scheme` and `Host $host` to `http://127.0.0.1:3000` without triggering application-level domain redirects.
5. Verify automatic renewal timer:
   ```bash
   sudo systemctl status certbot.timer
   sudo certbot renew --dry-run
   ```

---

## 7. Database Migrations, Initial Owner Provisioning & Catalog Import
Never use `prisma db push` in production. Always apply versioned migrations:
```bash
# 1. Start PostgreSQL and App containers
docker compose up -d --build

# 2. Apply versioned SQL migrations
docker compose exec app npx prisma migrate deploy

# 3. Provision the initial OWNER account interactively (never seeded or exposed publicly)
docker compose exec -it app npx tsx scripts/create-owner.ts

# 4. (Optional) Provision a STAFF account (inventory-only permissions)
docker compose exec -it app npx tsx scripts/create-owner.ts --role=STAFF

# 5. Run repeatable idempotent catalog import
docker compose exec app npx tsx scripts/import-catalog.ts
```

---

## 8. Database Backup & Restore
- **Run Backup:**
  ```bash
  chmod +x scripts/db-backup.sh scripts/db-restore.sh
  BACKUP_RETENTION_DAYS=14 OFFSITE_BACKUP_TARGET="user@backup-host:/backups/parstech" ./scripts/db-backup.sh
  ```
- **Restore Backup:**
  ```bash
  ./scripts/db-restore.sh /var/backups/parstech/postgres/parstech_parstech_prod_<TIMESTAMP>.dump
  ```

---

## 9. Deployment & Rollback Procedure
### Standard Deployment
```bash
cd /opt/parstech
git fetch origin
git checkout <release-tag-or-commit>
./scripts/db-backup.sh
docker compose build app
docker compose run --rm app npx prisma migrate deploy
docker compose up -d app
```

### Application Rollback & Database Migration Caveat
- **Critical Caveat:** Rolling back the application container image or Git commit **does NOT automatically reverse PostgreSQL schema migrations** (`prisma migrate deploy` is forward-only).
- If a release included only backward-compatible schema additions (or no schema changes), roll back the application container directly:
  ```bash
  git checkout <previous-known-good-commit>
  docker compose up -d --build app
  ```
- If a release applied a breaking schema migration that is incompatible with the previous code version, you must either apply a forward corrective migration or restore the pre-deployment PostgreSQL snapshot created by `./scripts/db-backup.sh` using `./scripts/db-restore.sh`.

---

## 10. Phase 2 Handoff Summary
The following items are intentionally deferred to Phase 2:
- **Catalog & Media:** Verified production product catalog, licensed photography per color/angle, and full admin CRUD for categories/products/variants.
- **Dedicated Routes & Technical SEO:** Dedicated indexable `/products/[slug]` and `/categories/[slug]` routes, faceted-navigation crawl controls, and performance budgets.
- **Commerce Structured Data:** Complete `Product`, `Offer`, variant-level availability, and verified `AggregateRating` / `Review` JSON-LD with explicit IRR/IRT currency handling.
- **Customer Operations & Payments:** Customer SMS OTP authentication, persistent orders, Shaparak payment gateway integration, and accounting/ERP webhooks.
