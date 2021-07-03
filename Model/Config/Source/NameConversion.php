<?php
namespace CCCC\Addressvalidation\Model\Config\Source;

use Magento\Framework\Data\OptionSourceInterface;

class NameConversion implements OptionSourceInterface
{
    const CONVERT_KEEP_IT = 'keep_it';
    const CONVERT_UPPERCASE = 'uppercase';
    const CONVERT_LOWERCASE = 'lowercase';
    const CONVERT_UCFIRST = 'ucfirst';

    /**
     * Options getter
     *
     * @return array
     */
    public function toOptionArray()
    {
        return [
            ['value' => self::CONVERT_KEEP_IT, 'label' => __('Keep entered spelling')],
            ['value' => self::CONVERT_UPPERCASE, 'label' => __('Upper case')],
            ['value' => self::CONVERT_LOWERCASE, 'label' => __('Lower case')],
            ['value' => self::CONVERT_UCFIRST, 'label' => __('First character in upper case')],

        ];
    }

    /**
     * Get options in "key-value" format
     *
     * @return array
     */
    public function toArray()
    {
        $data = $this->toOptionArray();

        $result = [];
        foreach ($data as $entry) {
            $result[$entry['value']] = $entry['label'];
        }

        return $result;
    }
}
