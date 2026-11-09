# docker/php/Dockerfile
# PHP-FPM image for the MVC backend.

FROM php:8.5-fpm-alpine

# pdo_mysql ships with the PHP sources: no system library needed
RUN docker-php-ext-install pdo_mysql

WORKDIR /var/www/backend
