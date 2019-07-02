<?php
/**
 * Module: CCCC\Addressvalidation\Model
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-06-26 14:32
 *
 *
 */

namespace CCCC\Addressvalidation\Model;


use Magento\Checkout\Model\ConfigProviderInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\UrlInterface;

class ConfigProvider implements ConfigProviderInterface
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var ScopeConfigInterface  */
    protected $scopeConfig;

    /**
     * Checkout session
     *
     * @var \Magento\Checkout\Model\Session
     */
    protected $checkoutSession;

    /** @var UrlInterface  */
    protected $urlInterface;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        \Magento\Checkout\Model\Session $checkoutSession,
        UrlInterface $urlInterface
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->checkoutSession = $checkoutSession;
        $this->urlInterface = $urlInterface;
    }

    /**
     * Add payone parameters to the config array
     *
     * @return array
     */
    protected function getAddressValidationConfig()
    {
        return [
            'endereco' => [
                'enabled' => $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled') == 1,
                'force_valid_address' => $this->scopeConfig->getValue($this->configPrefix . '/features/force_valid_address') == 1,
                'check' => [
                    'shipping_enabled' => $this->scopeConfig->getValue($this->configPrefix . '/integration/frontend_checkout_shipping') == 1,
                    'billing_enabled' => $this->scopeConfig->getValue($this->configPrefix . '/integration/frontend_checkout_billing') == 1,
                    'customer_addressbook_enabled' => $this->scopeConfig->getValue($this->configPrefix . '/integration/customer_addressbook') == 1
                ],
                'autocomplete' => [
                    'postcode' => $this->scopeConfig->getValue($this->configPrefix . '/features/postcode_autocomplete') == 1,
                    'city' => $this->scopeConfig->getValue($this->configPrefix . '/features/city_autocomplete') == 1,
                ],
                'mapping' => [
                    'country' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/country'),
                    'postCode' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/postCode'),
                    'cityName' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/cityName'),
                    'street' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/street'),
                    'houseNumber' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/houseNumber')
                ],
                'urls' => [
                    'checkaddress' => $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled') == 1 ? $this->urlInterface->getUrl('4cAddress/check/address') : null,
                    'postcodeautocomplete' => $this->scopeConfig->getValue($this->configPrefix . '/features/postcode_autocomplete') == 1 ? $this->urlInterface->getUrl('4cAddress/autocomplete/postcode') : null,
                    'cityautocomplete' => $this->scopeConfig->getValue($this->configPrefix . '/features/city_autocomplete') == 1 ? $this->urlInterface->getUrl('4cAddress/autocomplete/street') : null,
                ]
            ],
        ];
    }

    /**
     * Returns the extended checkout-data array
     *
     * @return array
     */
    public function getConfig()
    {
        $config = [
            'cccc' => [
                'addressvalidation' => $this->getAddressValidationConfig(),
            ],
        ];
        return $config;
    }
}
