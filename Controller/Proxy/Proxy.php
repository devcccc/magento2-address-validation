<?php
/**
 * Module: CCCC\Addressvalidation\Controller
 * Copyright: (c) 2021 cccc.de
 * Date: 17.06.21 12:40
 *
 *
 */

namespace CCCC\Addressvalidation\Controller\Proxy;

use CCCC\Addressvalidation\Operation\ProxyOperation;
use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\RequestInterface;
use Magento\Framework\App\ResponseInterface;

class Proxy implements HttpPostActionInterface
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var ScopeConfigInterface  */
    protected $scopeConfig;

    /** @var \Magento\Framework\Controller\Result\JsonFactory */
    protected $jsonResultFactory;

    /** @var RequestInterface */
    protected $request;

    /** @var ProxyOperation  */
    protected $proxyOperation;

    /**
     * @param ScopeConfigInterface $scopeConfig
     * @param \Magento\Framework\Controller\Result\JsonFactory $jsonResultFactory
     * @param RequestInterface $request
     * @param ProxyOperation $proxyOperation
     */
    public function __construct(
        ScopeConfigInterface $scopeConfig,
        \Magento\Framework\Controller\Result\JsonFactory $jsonResultFactory,
        RequestInterface $request,
        ProxyOperation $proxyOperation
    )
    {
        $this->scopeConfig = $scopeConfig;
        $this->jsonResultFactory = $jsonResultFactory;
        $this->request = $request;
        $this->proxyOperation = $proxyOperation;
    }


    public function execute()
    {
        $result = $this->jsonResultFactory->create();

        $postData = $this->request->getContent();
        $data = $this->proxyOperation->doRequest(json_decode($postData, true));

        $result->setStatusHeader($data->getHttpStatus());
        $result->setData($data->getResultData());

        return $result;
    }

}
