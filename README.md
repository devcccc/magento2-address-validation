# magento2-address-validation
For Magento: Extended address validation against webservices

# About 

Address validation module for Magento 2.2, 2.3, 2.4 using Endereco as 
Webservice for validation. A separate Endereco Account (https://www.endereco.de/)
is required.

This supports the address validation on checkout for the shipping address and some 
autocomplete functions - the eMail validation is integrated as beta version as well.

# Installation

After installation: 
```
php bin/magento module:enable CCCC_Addressvalidation
php bin/magento setup:upgrade
```
If your Magento installation is running into production mode you have 
also to deploy the static content files:

```
php bin/magento setup:static-content:deploy
```

For development systems we suggest a cleanup of the generated and pub/static/frontend-folders:

```
rm -Rf generated pub/static/frontend
```

# Direct requests

Important: to use the faster direct requests additional webserver configuration is required.

For nginx you have to add a new location-block within your nginx-Site-Configuration. For
Apache you have to copy the DirectProxy.php-file and add a Rewrite in the .htaccess. 

For further instructions see below.

## Apache Webserver

After installation/update copy the DirectProxy-File to the pub-directory:

```
cd {{YOUR MAGENTO MAIN DIRECTORY}}
cp vendor/endereco/magento2-address-validation/Controller/Proxy/DirectProxy.php pub/
```

Edit the .htaccess in the pub-folder. Add a rewrite for the DirectProxy.php. Its required 
that this rewrite is done before the index.php rewrite. 

Add the following line to pub/.htaccess:

```
RewriteRule cccc_adressvalidation/direct DirectProxy.php [L]
```

To do this before the index.php-rewrite your pub/.htaccess might look like:

```
....
RewriteRule cccc_adressvalidation/direct DirectProxy.php [L]

############################################
## Never rewrite for existing files, directories and links
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-l
....
```

Now enable the direct requests in the settings of the extension within the Magento Admin-Backend.

Menu: Stores => Configuration. Select "CCCC Config" => Address validation with Endereco => "Use direct requests" => Yes

## nginx Webserver

For nginx a new location-Block within your nginx-site-configuration is required. Add this location:

```
location /cccc_adressvalidation/direct {
    root $MAGE_ROOT/app/code/CCCC/Addressvalidation/Controller/Proxy;
    index DirectProxy.php;
    fastcgi_pass   fastcgi_backend;
    fastcgi_index  DirectProxy.php;
    fastcgi_param  SCRIPT_FILENAME  $document_root/DirectProxy.php;
    include        fastcgi_params;
}
```

This location-Block should be placed directly in the server-block for the Magento-shop.

Now enable the direct requests in the settings of the extension within the Magento Admin-Backend.

Menu: Stores => Configuration. Select "CCCC Config" => Address validation with Endereco => "Use direct requests" => Yes
