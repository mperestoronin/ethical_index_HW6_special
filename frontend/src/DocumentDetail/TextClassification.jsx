import React from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Radio,
  RadioGroup,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";

const TextClassification = ({
  justificationPoints,
  handleJustificationPointsChange,
  lawType,
  setLawType,
  updateValue,
}) => {
  const toast = useToast();
  const justToastId = "justToastId";
  const typeToastId = "typeToastId";

  const checkPointValidity = (field, newValue) => {
    const totalPoints =
      Object.values(justificationPoints).reduce((a, b) => a + b, 0) -
      justificationPoints[field] +
      newValue;

    return totalPoints <= 10;
  };
  const labelMapping = {
    AUTH_points: "Авторитет",
    CARE_points: "Забота",
    LOYAL_points: "Лояльность",
    FAIR_points: "Справедливость",
    PUR_points: "Чистота",
    NON_points: "Нет этической окраски",
  };
  const lawTypes = [
    { value: "UNCHECKED", label: "не проверено" },
    { value: "ALLOW", label: "Дозволение" },
    { value: "DUTY", label: "Обязанность" },
    { value: "BAN", label: "Запрет" },
    { value: "DEF", label: "Дефиниция" },
    { value: "DEC", label: "Декларация" },
    { value: "GOAL", label: "Цель" },
    { value: "OTHER", label: "Иное" },
  ];

  const readOnly = !isAuthenticated();

  function isAuthenticated() {
    const token = localStorage.getItem("access");
    return token ? true : false;
  }

  return (
    <Box p={4} border="2px" borderRadius="md" borderColor="gray.200">
      <Flex direction="row" justifyContent="space-between" alignItems="start">
        <VStack spacing={4} flex={2} alignItems="start">
          <Heading size="md" textAlign="left">
            Профиль нормы:
          </Heading>
          <Alert status="info" textAlign="left" bg="white">
            <AlertIcon />
            Осталось{" "}
            {10 -
              Object.values(justificationPoints).reduce(
                (a, b) => a + b,
                0
              )}{" "}
            баллов
          </Alert>
          {Object.entries(justificationPoints).map(([key, value]) => (
            <FormControl key={key} as="fieldset">
              <FormLabel htmlFor={key} fontSize={"lg"}>
                {labelMapping[key]}
              </FormLabel>
              <HStack spacing={5}>
                <Box width="60%">
                  <Slider
                    isDisabled={readOnly}
                    id={key}
                    name={key}
                    value={value}
                    min={0}
                    max={10}
                    onChange={(val) => {
                      handleJustificationPointsChange(key, val);
                      if (!toast.isActive(justToastId)) {
                        toast({
                          id: justToastId,
                          title: "Сохранено",
                          description: "Профиль нормы обновлен.",
                          status: "success",
                          duration: 3000,
                          isClosable: true,
                        });
                      }
                    }}
                    aria-label={key}
                    colorScheme="teal"
                  >
                    <SliderTrack bg="teal.100">
                      <SliderFilledTrack bg="teal.400" />
                    </SliderTrack>
                    <SliderThumb
                      boxSize={4}
                      border="2px"
                      borderColor="teal.400"
                    />
                  </Slider>
                  <HStack justifyContent="space-between" width="100%">
                    {[...Array(11)].map((_, i) => (
                      <Text
                        key={i}
                        fontSize="lg"
                        onClick={() =>
                          checkPointValidity(key, i) &&
                          !readOnly &&
                          handleJustificationPointsChange(key, i)
                        }
                        color={
                          checkPointValidity(key, i) && !readOnly
                            ? "black"
                            : "gray.400"
                        }
                        _hover={{
                          color: checkPointValidity(key, i)
                            ? "teal.500"
                            : "gray.400",
                          cursor: readOnly ? "default" : "pointer",
                        }}
                        mr={-3}
                      >
                        {i}
                      </Text>
                    ))}
                  </HStack>
                </Box>
              </HStack>
            </FormControl>
          ))}
        </VStack>

        <VStack spacing={4} flex={1} alignItems="start">
          <Heading size="md">Тип нормы:</Heading>
          <FormControl as="fieldset">
            <RadioGroup
              id="law_type"
              name="law_type"
              value={lawType}
              onChange={(val) => {
                setLawType(val);
                updateValue("law_type", val);
                if (!toast.isActive(typeToastId)) {
                  toast({
                    id: typeToastId,
                    title: "Сохранено",
                    description: "Тип нормы обновлен.",
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                  });
                }
              }}
              colorScheme="teal"
            >
              <VStack alignItems="flex-start" spacing={3}>
                {lawTypes.map((type) => (
                  <Radio
                    key={type.value}
                    value={type.value}
                    size="lg"
                    colorScheme="teal"
                    isReadOnly={readOnly}
                  >
                    <Text fontSize="lg">{type.label}</Text>
                  </Radio>
                ))}
              </VStack>
            </RadioGroup>
          </FormControl>
        </VStack>
      </Flex>
    </Box>
  );
};

export default TextClassification;
