FROM nginx:alpine

# Borrar config por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Configuración SPA
COPY nginx.conf /etc/nginx/conf.d/

# Copiamos SOLO el browser
COPY dist/qr-manager-front/browser/ /usr/share/nginx/html/

# Renombrar index.csr.html a index.html
RUN mv /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
