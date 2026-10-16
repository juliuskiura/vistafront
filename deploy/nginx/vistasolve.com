# ===========================================
# Main Website
# ===========================================
server {
    server_name vistasolve.com;

    location / {
        proxy_pass http://127.0.0.1:8000;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/vistasolve.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/vistasolve.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
server {
    listen 443 ssl;
    server_name www.vistasolve.com;

    ssl_certificate /etc/letsencrypt/live/vistasolve.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vistasolve.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://vistasolve.com$request_uri;
}
# ===========================================
# App
# ===========================================
server {
    server_name app.vistasolve.com;

    location /apis/ {
        proxy_pass http://127.0.0.1:8001;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://127.0.0.1:5173;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
# Django WebSockets
    location /ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
#django admin
location /adminregwakes/ {
        proxy_pass http://127.0.0.1:8001;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/vistasolve.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/vistasolve.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

}

# ===========================================
# Regwakes
# ===========================================
server {
    server_name regwakes.vistasolve.com www.regwakes.vistasolve.com;

    location / {
        proxy_pass http://127.0.0.1:8002;

        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/vistasolve.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/vistasolve.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}

server {
    if ($host = www.vistasolve.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = vistasolve.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name vistasolve.com www.vistasolve.com;
    return 404; # managed by Certbot




}
server {
    if ($host = app.vistasolve.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name app.vistasolve.com;
    return 404; # managed by Certbot


}
server {
    if ($host = www.regwakes.vistasolve.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = regwakes.vistasolve.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    listen 80;
    server_name regwakes.vistasolve.com www.regwakes.vistasolve.com;
    return 404; # managed by Certbot




}
