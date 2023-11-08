FROM 192.168.0.56:8080/common/nginx:1.23.2

COPY ./packages /usr/share/nginx/html

EXPOSE 80