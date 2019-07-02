<?php
/**
 * Module: CCCC\Addressvalidation\Generator
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 16:05
 *
 *
 */

namespace CCCC\Addressvalidation\Generator;

use CCCC\Addressvalidation\Model\Config\Source\TransactionIdMode;
use Magento\Framework\App\Config\ScopeConfigInterface;

class TransactionIdGenerator
{
    protected $configPrefix = 'cccc_addressvalidation_endereco_section';

    /** @var ScopeConfigInterface  */
    protected $scopeConfig;

    public function __construct(ScopeConfigInterface $scopeConfig)
    {
        $this->scopeConfig = $scopeConfig;
    }

    public function getNewTransactionId() : string {
        switch ($this->scopeConfig->getValue($this->configPrefix . '/connection/transactionid_mode',ScopeConfigInterface::SCOPE_TYPE_DEFAULT, TransactionIdMode::MODE_FULL_RANDOM)) {
            case TransactionIdMode::MODE_SESSION_RANDOM:
                return $this->getSessionPrefixedRandomId();
            default:
                return $this->getFullyRandomId();
        }
    }

    protected function getFullyRandomId() : string {
        return uniqid(rand(), true);
    }

    protected function getSessionPrefixedRandomId() : string {
        return uniqid(session_id() . '_' . rand(), true);
    }
}