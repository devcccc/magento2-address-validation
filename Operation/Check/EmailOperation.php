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

class EmailOperation extends BaseOperation
{
    public function doRequest(array $data) {
        $requestData = $this->getBaseRequestData('emailCheck', true);

        $requestData['params'] = [
            'email' => $data['email']
        ];

        $result =  $this->doApiRequest($requestData);
        return $result;
    }

    protected function doApiRequest(array $requestDataCompiled)
    {
        /** @var ResponseObject $response */
        $response = parent::doApiRequest($requestDataCompiled);

        $result = ['success' => $response->isSuccess(), 'disposable' => false, 'valid' => false, 'statuscodes' => []];
        if ($response->isSuccess() && $response->hasData()) {
            $data = $response->getResultData();
            $result['statuscodes'] = $data['result']['status'];
            $result['disposable'] = in_array('A1400', $data['result']['status']);
            $result['valid'] = $result['disposable']
                || in_array('A1000', $data['result']['status'])
                || in_array('A1100', $data['result']['status'])
                || in_array('A1110', $data['result']['status']);
        }

        return $result;
    }
}