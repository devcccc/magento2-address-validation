<?php
/**
 * Module: CCCC\Addressvalidation\Operation
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 15:33
 *
 *
 */

namespace CCCC\Addressvalidation\Operation;

use CCCC\Addressvalidation\Generator\RefererGenerator;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Locale\Resolver;
use Magento\Framework\App\ProductMetadataInterface;
use Magento\Framework\View\DesignInterface;
use Magento\Framework\Module\ModuleListInterface;

class BaseOperation
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    const MODULE_NAME = 'CCCC_Addressvalidation';

    /** @var ScopeConfigInterface */
    protected $config;

    /** @var string */
    protected $locale;

    protected $referer;

    protected $magentoVersion;

    protected $themeCode;

    public function __construct(ScopeConfigInterface $config, Resolver $localeResolver, RefererGenerator $refererGenerator,
                                ProductMetadataInterface $metaInterface, DesignInterface $design, ModuleListInterface $moduleList)
    {
        $this->referer = $refererGenerator->getReferer();

        $this->config = $config;
        $this->locale = $localeResolver->getLocale() ?? $localeResolver->getDefaultLocale();

        $this->magentoVersion = $metaInterface->getVersion();
        $this->themeCode = $design->getDesignTheme()->getCode();

        $this->moduleVersion = $moduleList->getOne(self::MODULE_NAME)['setup_version'];
    }

    protected function getBaseRequestData(string $methodName, bool $paramsRequired = false) : array {
        $data = [
            'jsonrpc' => '2.0',
            'method' => $methodName,
        ];

        if ($paramsRequired) {
            $data['params'] = [];
        }

        return $data;
    }

    protected function getRequestHeaders() {
        return [
            'Content-Type: application/json',
            'X-Auth-Key: ' . $this->config->getValue($this->configPrefix . '/connection/authkey'),
            'X-Transaction-Referer: ' . $this->referer,
            'X-Transaction-Id: ' . 'not_required',
            'X-Agent: '. 'Magento:'.$this->magentoVersion.', Theme: '.$this->themeCode.', '.self::MODULE_NAME.': '.$this->moduleVersion
        ];
    }

    protected function getLanguage() {
        $parts = explode('_', $this->locale);
        return strtolower($parts[0]);
    }

    protected function doApiRequest(array $requestDataCompiled) {
        $ch = curl_init($this->config->getValue($this->configPrefix . '/connection/baseurl'));

        curl_setopt_array(
            $ch,
            [
                CURLOPT_SSL_VERIFYHOST => 0,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($requestDataCompiled),
                CURLOPT_HTTPHEADER => $this->getRequestHeaders()
            ]
        );

        $result = curl_exec($ch);

        $response = new ResponseObject(curl_errno($ch), curl_getinfo($ch, CURLINFO_HTTP_CODE), json_decode($result, true));
        curl_close($ch);

        return $response;
    }

}