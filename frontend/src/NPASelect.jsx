import React from "react";
import { Select } from "chakra-react-select";

const NPASelect = ({
  npaMapping,
  handleNPAChange,
  npaLoading,
  npaError,
  isMulti = true,
}) => {
  const options = npaMapping
    ? npaMapping.map(([value, label]) => ({ value, label }))
    : [];

  return (
    <Select
      options={options}
      onChange={handleNPAChange}
      placeholder="Выберите НПА"
      isMulti={isMulti}
      isDisabled={npaLoading || npaError}
      isSearchable
      selectedOptionStyle="check"
      hideSelectedOptions={false}
    />
  );
};

export default NPASelect;
