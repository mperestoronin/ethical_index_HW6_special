import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Link,
  HStack,
  Badge,
} from "@chakra-ui/react";

const IndexPage = () => (
  <Box maxW="800px" m="auto" p={8}>
    <VStack spacing={5}>
      <HStack spacing={4} justify="center">
        <Badge colorScheme="green" variant="subtle">
          release v1.3.2
        </Badge>
        <Badge colorScheme="gray" variant="subtle">
          14.04.2024
        </Badge>
      </HStack>
      <Heading as="h1" size="xl">
        Добро пожаловать!
      </Heading>
      <Text fontSize="xl">Это инструмент для сбора текстового датасета.</Text>
      <Text fontSize="lg">
        Для начала работы войдите в аккаунт в правом верхнем углу сайта.
      </Text>
      <Text fontSize="lg">Чтобы провести анализ документа:</Text>
      <VStack spacing={3} align="start">
        <Text>
          1. Нажмите на кнопку "Добавить документ" в верхней навигационной
          панели.
        </Text>
        <Text>2. Введите текст документа и его название.</Text>
        <Text>
          3. Выберите нормативно-правовой акт к которому относится документ.
        </Text>
        <Text>
          4. Классифицируйте документ используя ползунки в секции
          "Классификация".
        </Text>
        <Text>
          5. Обоснуйте свой выбор, выделяя слова, повлиявшие на ваше решение.
        </Text>
      </VStack>
      <HStack spacing={4}>
        <Button colorScheme="teal" size="lg">
          <Link href="/document_list">Перейти к документам</Link>
        </Button>
        <Button
          as="a"
          href="https://docs.google.com/document/d/1JyHtI33DQHaz5o6SxVb_TNWgDkvCgnkLJMt4eflMdps/edit?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
          colorScheme="teal"
          size="lg"
        >
          Посмотреть инструкцию
        </Button>
      </HStack>
    </VStack>
  </Box>
);

export default IndexPage;
