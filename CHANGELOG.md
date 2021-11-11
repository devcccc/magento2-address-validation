#### 1.3.10

- Changed delivery address was displayed correctly in frontend but not got pushed in the order
- If the email validation was enabled a timing problem resulted in a javascript error
- If the first address entered was fully corrected no address correction popup got displayed if the user changed to address that requires correction

#### 1.3.9 

- Several fixes with address book entries

#### 1.3.4

- Using MutationObserver instead of DOMSubtreeModified
- Fixed firstname/lastname handling for address book entries
- Check also address book entry in checkout

#### 1.3.3

- Fixed initialization for logged in customer

##### 1.3.2

- Fixed eMail selector

##### 1.3.1

- Fixed Typo in settings
- Fixed name conversions for inline address

##### 1.3.0

- Updated JS-SDK
- Address validation works also for addresses selected from address book

##### 1.2.10

- Payment method got hidden if you entered a correct address that did not require any change
- Registered customers were not able to add a new shipping address in checkout
- If the city was entered and the post code were completed automatically the post code got not used in the final shipping address

##### 1.2.9

- Fixed error when switching to payment step


##### 1.2.8

- Fixed display of country name in modal
- Fixed several mapping errors

##### 1.2.7

- Display version in backend configuration

##### 1.2.6

- Performance changes

##### 1.2.5

- Correct doAccounting-Handling
- Fixed a bug when the city was filled out by postal codes auto suggest
- A changed country is now taking into account of the shipping address
- 

##### 1.2.4

- Switched to Endereco JS-SDK for the frontend
- Removed unused controllers
- Reworked doAccounting
- Integrated eMail validation
- Supports now autocomplete functionality
- Cleaned up javascript
- Extended Configuration

##### 1.2.0

- Added support for JavaScript-debugging
- Added support for separate request/response-logging
- Renamed "Base URL" to "API Endpoint" in configuration
- Fixed house number bug. An empty housenumber was taken as string "null" in the selected address
- Fixed city bug - city was not provided to API for address book entries
- Added eMail check - at the moment it will display only warnings, no hard bounces yet

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
