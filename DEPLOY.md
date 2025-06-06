# Deployment Guide

## Production Deployment

### Prerequisites
- Node.js >= 14.x
- MySQL >= 8.0
- Redis >= 6.0
- Nginx
- PM2

### Server Setup

1. Update system packages
```bash
sudo apt update
sudo apt upgrade
```

2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
```

3. Install MySQL
```bash
sudo apt install mysql-server
sudo mysql_secure_installation
```

4. Install Redis
```bash
sudo apt install redis-server
```

5. Install Nginx
```bash
sudo apt install nginx
```

### Application Deployment

1. Clone repository
```bash
git clone https://github.com/yourusername/microhire-backend.git
cd microhire-backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
nano .env
```

4. Build application
```bash
npm run build
```

5. Set up PM2
```bash
npm install -g pm2
pm2 start dist/server.js --name microhire-api
pm2 save
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.microhire.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/your/uploads;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### SSL Configuration

1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate
```bash
sudo certbot --nginx -d api.microhire.com
```

### Database Backup

1. Create backup script
```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p microhire > $BACKUP_DIR/microhire_$DATE.sql
```

2. Set up cron job
```bash
0 0 * * * /path/to/backup.sh
```

### Monitoring

1. Set up PM2 monitoring
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

2. Set up error monitoring
```bash
pm2 install pm2-server-monit
```

### Security

1. Set up firewall
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. Set up fail2ban
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Maintenance

1. Update application
```bash
git pull
npm install
npm run build
pm2 restart microhire-api
```

2. Monitor logs
```bash
pm2 logs microhire-api
```

3. Monitor resources
```bash
pm2 monit
```
