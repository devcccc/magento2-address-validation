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
