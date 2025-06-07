# Dockerfile para servir el build de producción con nginx
FROM nginx:alpine

# Copiar el contenido del build al directorio de nginx
COPY dist/ /usr/share/nginx/html/

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]