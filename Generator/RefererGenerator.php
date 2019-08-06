<?php
/**
 * Module: CCCC\Addressvalidation\Generator
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 16:05
 *
 *
 */

namespace CCCC\Addressvalidation\Generator;

use CCCC\Addressvalidation\Model\Config\Source\RefererMode;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\UrlInterface;

class RefererGenerator
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var ScopeConfigInterface  */
    protected $scopeConfig;

    /** @var string */
    protected $baseUrl;

    public function __construct(ScopeConfigInterface $scopeConfig, UrlInterface $url)
    {
        $this->baseUrl = $url->getBaseUrl();
        $this->scopeConfig = $scopeConfig;
    }

    public function getReferer() : string {
        switch ($this->scopeConfig->getValue($this->configPrefix . '/connection/referer_mode',ScopeConfigInterface::SCOPE_TYPE_DEFAULT, RefererMode::MODE_BASEURL)) {
            case RefererMode::MODE_CURRENT_PAGE:
                return $_SERVER['SCRIPT_NAME'];
            default:
                return $this->baseUrl;
        }
    }
}