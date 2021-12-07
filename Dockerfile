FROM nginx:alpine

WORKDIR /app
COPY . .

COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN nginx -t -c /etc/nginx/nginx.conf