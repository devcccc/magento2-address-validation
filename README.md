# magento2-address-validation
Magento 2: Extended address validation against webservices

# About 

Address validation module for Magento 2.1, 2.2 using Endereco as 
Webservice for validation. A separate Endereco Account (https://www.endereco.de/)
is required.

For now only the address validation is used within the Frontend integration, 
but the Endereco autocomplete function will be implemented in a later version.

# Installation

After installation: 
```
php bin/magento module:enable CCCC_Addressvalidation
php bin/magento setup:upgrade
```