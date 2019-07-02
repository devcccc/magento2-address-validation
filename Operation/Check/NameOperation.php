<?php
/**
 * Module: CCCC\Addressvalidation\Operation\Check
 * Copyright: (c) 2019 cccc.de
 * Date: 2019-05-22 16:00
 *
 *
 */

namespace CCCC\Addressvalidation\Operation\Check;


use CCCC\Addressvalidation\Operation\BaseOperation;
use CCCC\Addressvalidation\Operation\ResponseObject;

class NameOperation extends BaseOperation
{
    public function doRequest(array $data) {
        $requestData = $this->getBaseRequestData('nameCheck', true);

        $requestData['params'] = [
            'name' => $data['name']
        ];

        $result =  $this->doApiRequest($requestData);
        return $result;
    }

    protected function doApiRequest(array $requestDataCompiled)
    {
        /** @var ResponseObject $response */
        $response = parent::doApiRequest($requestDataCompiled);

        $result = ['success' => $response->isSuccess(), 'gender' => 'n/a'];
        if ($response->isSuccess() && $response->hasData()) {
            $data = $response->getResultData();
            $result['gender'] = $data['result']['gender'];
        }

        return $result;
    }
}