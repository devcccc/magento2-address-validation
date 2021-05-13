<?php
/**
 * Module: CCCC\Addressvalidation\Logger\Handler
 * Copyright: (c) 2021 cccc.de
 * Date: 13.05.21 20:28
 *
 *
 */

namespace CCCC\Addressvalidation\Logger\Handler;

use Monolog\Logger;

class RequestResponseHandler extends \Magento\Framework\Logger\Handler\Base
{
    /**
     * Logging level
     * @var int
     */
    protected $loggerType = Logger::DEBUG;

    /**
     * File name
     * @var string
     */
    protected $fileName = '/var/log/cccc_address_validation_requests.log';
}
