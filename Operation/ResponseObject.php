<?php
/**
 * Module: CCCC\Addressvalidation\Operation
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-06-25 12:23
 *
 *
 */

namespace CCCC\Addressvalidation\Operation;

class ResponseObject
{
    /** @var integer */
    protected $curlStatus;

    /** @var integer */
    protected $httpStatus;

    protected $resultData;

    /**
     * ResponseObject constructor.
     * @param int $curlStatus
     * @param int $httpStatus
     * @param $resultData
     */
    public function __construct(int $curlStatus, int $httpStatus, $resultData)
    {
        $this->curlStatus = $curlStatus;
        $this->httpStatus = $httpStatus;
        $this->resultData = $resultData;
    }

    /**
     * @return int
     */
    public function getCurlStatus(): int
    {
        return $this->curlStatus;
    }

    /**
     * @return int
     */
    public function getHttpStatus(): int
    {
        return $this->httpStatus;
    }

    /**
     * @return mixed
     */
    public function getResultData()
    {
        return $this->resultData;
    }

    public function isSuccess() : bool {
        return $this->getCurlStatus() == CURLE_OK && $this->getHttpStatus() >= 200 && $this->getHttpStatus() < 400;
    }

    public function hasData() : bool {
        return !empty($this->resultData) && is_array($this->resultData);
    }

}