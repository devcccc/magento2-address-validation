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
use Magento\Framework\Module\ModuleListInterface;
use Magento\Framework\UrlInterface;
use Magento\Framework\View\DesignInterface;

class ConfigProvider implements ConfigProviderInterface
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    const MODULE_NAME = 'CCCC_Addressvalidation';

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

    /** @var \Magento\Directory\Model\ResourceModel\Country\Collection  */
    protected $countryCollection;

    protected $magentoVersion;

    protected $themeCode;

    public function __construct(
        ScopeConfigInterface $scopeConfig,
        \Magento\Checkout\Model\Session $checkoutSession,
        UrlInterface $urlInterface,
        \Magento\Directory\Model\ResourceModel\Country\Collection $countryCollection,
        DesignInterface $design,
        ModuleListInterface $moduleList
    ) {
        $this->scopeConfig = $scopeConfig;
        $this->checkoutSession = $checkoutSession;
        $this->urlInterface = $urlInterface;
        $this->countryCollection = $countryCollection;

        $this->themeCode = $design->getDesignTheme()->getCode();
        $this->moduleVersion = $moduleList->getOne(self::MODULE_NAME)['setup_version'];
    }

    /**
     * Add endereco parameters to the config array
     *
     * @return array
     */
    protected function getAddressValidationConfig()
    {
        $countries = [];
        foreach ($this->countryCollection->getItems() as $item) {
            $countries[$item->getData('iso2_code')] = $item->getName();
        }
        return [
            'endereco' => [
                'enabled' => $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled', 'store') == 1
                    && $this->scopeConfig->getValue($this->configPrefix . '/features/address_check', 'store') == 1,
                'email_check' => $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled', 'store') == 1
                    && $this->scopeConfig->getValue($this->configPrefix . '/features/email_check', 'store') == 1,
                'email_show_warnings' => $this->scopeConfig->getValue($this->configPrefix . '/features/email_show_warnings', 'store') == 1,
                'force_valid_address' => $this->scopeConfig->getValue($this->configPrefix . '/features/force_valid_address', 'store') == 1,
                'use_autocomplete' => $this->scopeConfig->getValue($this->configPrefix . '/development/use_autocomplete', 'store') == 1,
                'check' => [
                    'shipping_enabled' => $this->scopeConfig->getValue($this->configPrefix . '/integration/frontend_checkout_shipping', 'store') == 1,
                    'billing_enabled' => $this->scopeConfig->getValue($this->configPrefix . '/integration/frontend_checkout_billing', 'store') == 1,
                    'customer_addressbook_enabled' => $this->scopeConfig->getValue($this->configPrefix . '/integration/customer_addressbook', 'store') == 1
                ],
                'mapping' => [
                    'country' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/country', 'store'),
                    'postCode' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/postCode', 'store'),
                    'cityName' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/cityName', 'store'),
                    'street' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/street', 'store'),
                    'houseNumber' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/houseNumber', 'store'),
                    'email' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/email', 'store'),
                    'useStreetFull' => $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/street', 'store') ===
                        $this->scopeConfig->getValue($this->configPrefix . '/field_mapping/houseNumber', 'store'),
                    'template' => "[name=\"shippingAddress.##field##\"] [name]"
                ],
                'transformation' => [
                    'convert_firstname' => $this->scopeConfig->getValue($this->configPrefix . '/features/convert_firstname', 'store'),
                    'convert_lastname' => $this->scopeConfig->getValue($this->configPrefix . '/features/convert_lastname', 'store')
                ],
                'development' => [
                    'javascript_debug' => $this->scopeConfig->getValue($this->configPrefix . '/development/javascript_debugging', 'store') == 1
                ],
                'countryId' => $this->scopeConfig->getValue('general/country/default', 'store'),
                'countries' => $countries,
                'apiKey' => $this->scopeConfig->getValue($this->configPrefix . '/connection/authkey', 'store'),
                'directRequests' => $this->scopeConfig->getValue($this->configPrefix . '/connection/directrequests', 'store') == 1,
                'serverApiUrl' => $this->scopeConfig->getValue($this->configPrefix . '/connection/baseurl', 'store'),
                'agentName' => 'Magento:'.$this->magentoVersion.', Theme: '.$this->themeCode.', '.self::MODULE_NAME.': '.$this->moduleVersion,
                'apiUrl' => [
                    'proxy' => $this->urlInterface->getUrl('4cAddress/proxy/proxy'),
                    'direct' => $this->urlInterface->getDirectUrl('cccc_adressvalidation/direct')
                ]
            ],
        ];
    }

    /**
     * All API requests should be logged in the separate file
     *
     * @return bool
     */
    public function shouldLogRequestsInSeparateFile() {
        return $this->scopeConfig->getValue($this->configPrefix . '/development/log_validation_requests', 'store') == 1;
    }

    public function isEnabled() {
        return $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled', 'store') == 1
            && $this->scopeConfig->getValue($this->configPrefix . '/features/address_check', 'store') == 1;
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
