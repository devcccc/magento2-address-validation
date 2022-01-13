<?php
/**
 * Module: CCCC\Addressvalidation\Block\Customer\Address
 * Copyright: (c) 2021 cccc.de
 * Date: 22.12.21 10:16
 *
 *
 */

namespace CCCC\Addressvalidation\Block\Customer\Address;

use CCCC\Addressvalidation\Model\ConfigProvider;
use Magento\Framework\View\Element\Template;

class ConfigData extends \Magento\Framework\View\Element\Template
{

    /** @var ConfigProvider */
    protected $configProvider;

    public function __construct(ConfigProvider $configProvider, Template\Context $context, array $data = [])
    {
        $this->configProvider = $configProvider;
        parent::__construct($context, $data);
    }

    public function getConfig()
    {
        return $this->configProvider->getConfig();
    }
}
