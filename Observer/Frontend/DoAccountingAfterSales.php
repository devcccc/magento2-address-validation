<?php
/**
 * Module: CCCC\Addressvalidation\Observer\Frontend
 * Copyright: (c) 2019 cccc.de
 * Date: 12.11.19 15:28
 *
 *
 */

namespace CCCC\Addressvalidation\Observer\Frontend;

use CCCC\Addressvalidation\Operation\DoAccountingOperation;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\Event\Observer;
use Magento\Framework\Event\ObserverInterface;
use Psr\Log\LoggerInterface;

class DoAccountingAfterSales implements ObserverInterface
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var ScopeConfigInterface  */
    protected $scopeConfig;

    /** @var DoAccountingOperation  */
    protected $operation;

    /** @var LoggerInterface  */
    protected $logger;

    /**
     * DoAccountingAfterSales constructor.
     */
    public function __construct(
        ScopeConfigInterface $scopeConfig,
        DoAccountingOperation $operation,
        LoggerInterface $logger
    )
    {
        $this->scopeConfig = $scopeConfig;
        $this->operation = $operation;
        $this->logger = $logger;
    }

    public function execute(Observer $observer) {
        $this->logger->info("DoAccount start");

        $canExecute = $this->scopeConfig->getValue($this->configPrefix . '/connection/enabled', 'store') == 1;
        if ($canExecute) {
            $result = $this->operation->doRequest();
            $this->logger->info("DoAccount status => ".print_r($result, true));
        }

        $this->logger->info("DoAccount end");
    }
}