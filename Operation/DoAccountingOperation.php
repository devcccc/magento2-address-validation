<?php
/**
 * Module: CCCC\Addressvalidation\Operation
 * Copyright: (c) 2019 cccc.de
 * Date: 12.11.19 15:29
 *
 *
 */

namespace CCCC\Addressvalidation\Operation;

class DoAccountingOperation extends BaseOperation
{
    public function doRequest() {
        $requestData = $this->getBaseRequestData('doAccounting', false);

        $result =  $this->doApiRequest($requestData);
        return $result;
    }

    protected function doApiRequest(array $requestDataCompiled)
    {
        /** @var ResponseObject $response */
        $response = parent::doApiRequest($requestDataCompiled);

        $result = ['success' => $response->isSuccess()];

        return $result;
    }
}