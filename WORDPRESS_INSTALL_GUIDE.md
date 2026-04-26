# Guía rápida para instalar WordPress

## Opción recomendada (Docker)

### 1) Crea una carpeta y entra
```bash
mkdir wordpress-local && cd wordpress-local
```

### 2) Crea `docker-compose.yml`
```yaml
services:
  db:
    image: mariadb:11
    restart: always
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wp_user
      MYSQL_PASSWORD: wp_pass_123
      MYSQL_ROOT_PASSWORD: root_pass_123
    volumes:
      - db_data:/var/lib/mysql

  wordpress:
    image: wordpress:latest
    depends_on:
      - db
    ports:
      - "8080:80"
    restart: always
    environment:
      WORDPRESS_DB_HOST: db:3306
      WORDPRESS_DB_USER: wp_user
      WORDPRESS_DB_PASSWORD: wp_pass_123
      WORDPRESS_DB_NAME: wordpress
    volumes:
      - wp_data:/var/www/html

volumes:
  db_data:
  wp_data:
```

### 3) Levanta WordPress
```bash
docker compose up -d
```

### 4) Abre en tu navegador
- `http://localhost:8080`

## Opción servidor tradicional (LAMP)

1. Instala Apache/Nginx, PHP 8.1+ y MySQL/MariaDB.
2. Crea base de datos y usuario.
3. Descarga WordPress: `https://wordpress.org/download/`.
4. Extrae archivos en tu `DocumentRoot`.
5. Configura `wp-config.php` con credenciales DB.
6. Da permisos correctos a `wp-content`.
7. Termina instalación desde navegador.

## Seguridad mínima recomendada
- Cambia contraseñas por valores fuertes.
- Activa HTTPS (Let's Encrypt).
- Actualiza WordPress, temas y plugins.
- Usa un plugin de backup y otro de seguridad.
