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

class PhoneOperation extends BaseOperation
{
    public function doRequest(array $data) {
        $requestData = $this->getBaseRequestData('prephoneCheck', true);

        $requestData['params'] = [
            'prephoneNumber' => $data['phone'],
            'format' => $data['format']
        ];

        $result =  $this->doApiRequest($requestData);
        return $result;
    }

    protected function doApiRequest(array $requestDataCompiled)
    {
        /** @var ResponseObject $response */
        $response = parent::doApiRequest($requestDataCompiled);

        $result = ['success' => $response->isSuccess(), 'valid' => false, 'mobile' => false, 'landline' => false, 'phone' => null];
        if ($response->isSuccess() && $response->hasData()) {
            $data = $response->getResultData();
            $result['mobile'] = in_array('A1200', $data['result']['status']);
            $result['landline'] = in_array('A1100', $data['result']['status']);
            $result['valid'] = $result['mobile'] || $result['landline']
                || in_array('A1000', $data['result']['status']);

            if ($result['valid']) {
                $result['phone'] = $data['result']['prephoneNumber'];
            }
        }

        return $result;
    }
}