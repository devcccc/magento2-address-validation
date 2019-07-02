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
use CCCC\Addressvalidation\Generator\TransactionIdGenerator;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Locale\Resolver;

class BaseOperation
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var ScopeConfigInterface */
    protected $config;

    /** @var string */
    protected $locale;

    protected $transactionId;

    protected $referer;


    public function __construct(ScopeConfigInterface $config, Resolver $localeResolver, TransactionIdGenerator $transactionIdGenerator, RefererGenerator $refererGenerator)
    {
        $this->transactionId = $transactionIdGenerator->getNewTransactionId();
        $this->referer = $refererGenerator->getReferer();

        $this->config = $config;
        $this->locale = $localeResolver->getLocale() ?? $localeResolver->getDefaultLocale();
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
            'X-Transaction-Id: ' . $this->transactionId,
            'X-Transaction-Referer: ' . $this->referer
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