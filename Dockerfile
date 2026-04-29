FROM php:8.2-apache

# Enable Apache rewrite module
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy API files
COPY api/ /var/www/html/api/
COPY vaults/ /var/www/vaults/

# Set permissions
RUN chown -R www-data:www-data /var/www/vaults \
    && chmod -R 775 /var/www/vaults

# Apache configuration for PHP routing
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    <Directory /var/www/html/api>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    RewriteEngine On\n\
    RewriteRule ^api/(.*)$ /api/index.php [QSA,L]\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]
