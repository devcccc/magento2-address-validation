##### 1.2.0

- Added support for JavaScript-debugging
- Added support for separate request/response-logging
- Renamed "Base URL" to "API Endpoint" in configuration
- Fixed house number bug. An empty housenumber was taken as string "null" in the selected address
- Fixed city bug - city was not provided to API for address book entries

##### 1.1.6

- Fixed validator for check request to use only streetFull

##### 1.1.4

- Use new status codes from Endereco-API

##### 1.1.3

- Fixed result handling for address book entries if street and housenumber merged into a single field


##### 1.1.2

- Fixed: If street number and housenumbe are merged into a single field concatenate data into one field also for address book entries

##### 1.1.0

- Support street and housenumber provided in one input field

##### 1.0.14
- Support Amazon Payments usage
- Use validateShippingInformation() as hook instead of setShippingInformation(), as other modules might override the setShippingInformation()
