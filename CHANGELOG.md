### 2.0.15

- Changed integration in nginx - use DirectProxy.php in pub-folder

#### 2.0.14

- Keep checkInProgress flag longer as 1000 ms - required if other shipping-mixins are involved 

#### 2.0.13

- Fixed infinite loop with shipping address validation

#### 2.0.12

- Fixed issue in handling eMail-check

#### 2.0.11

- Do not split street if full street should be used

#### 2.0.10

- Fixed "new address" button issue
- When you click "edit address" in the modal for the billing address you won't be redirected to the shipping address any longer

#### 2.0.9

- Billing address: User was not able to safe a confirmed address if the address was not valid.
- Billing address: Update billing address if shipping address was changed and both addresses are equal.

#### 2.0.8

- An new address book could not be edited after a address correction was made within checkout (the "Edit"-button doesn't work)

#### 2.0.7 

- Firstname and lastname got removed on guest checkout after validation

#### 2.0.6 

- Several smaller bug fixes

#### 2.0.0

- Implemented direct requests to bypass Magento Routing for requests to the Endereco backend, this speeds up the requests. To use direct requests you must enable the "Direct requests" in the settings AND further webserver configuration is required - see README.md

#### 1.3.24

- Fixed issue when saving quote and validation is not enabled for current store view

#### 1.3.23 

- Fixed issue when using shipping address as billing address: Billing address got empty sometimes due to an format error on street data

#### 1.3.22

- Fixed accounting issue on switch to payment

#### 1.3.20 && 1.3.21

- Fixed type in jQuery selector template

#### 1.3.17 & 1.3.18

- Fixed issue with address book entries created in checkout

#### 1.3.16

- Fixed issue when using address book entry that got changed by address validation - only the address book entry but not the address within the quote/order got changed

#### 1.3.15

- Several fixes
- Suggest: Fixed position of auto suggestion layer in address book popup

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
