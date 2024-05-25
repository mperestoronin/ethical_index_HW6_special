import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import apiRequest from "./apiRequest";
import useGetNPA from "./GetNPA";
import NPASelect from "./NPASelect";

const DocumentCreationPage = () => {
  const navigate = useNavigate();
  const { npaMapping, npaLoading, npaError } = useGetNPA();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedNPA, setNPA] = useState(""); // Default to the first key

  const handleSubmit = async (e) => {
    e.preventDefault();

    let user = JSON.parse(localStorage.getItem("userData")).id;

    const url = "documents/";
    const method = "POST";
    const body = { title, text, user: user, NPA: selectedNPA }; // added NPA

    try {
      const document = await apiRequest(url, method, body);
      navigate(`/document_detail/${document.id}`);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  return (
    <VStack
      as="form"
      onSubmit={handleSubmit}
      spacing={6}
      padding={8}
      shadow="md"
      bg="white"
      maxW="5xl"
      mx="auto"
      rounded="md"
    >
      <Heading>Добавление документа</Heading>

      {/* NPA Dropdown */}
      <FormControl id="NPA" isRequired>
        <FormLabel fontSize="lg">Выберите НПА:</FormLabel>
        <NPASelect
          npaMapping={npaMapping}
          handleNPAChange={(selectedNPA) => setNPA(selectedNPA.value)}
          npaLoading={npaLoading}
          npaError={npaError}
          isMulti={false}
        />
      </FormControl>

      {/* Title */}
      <FormControl id="title" isRequired>
        <FormLabel fontSize="lg">Структурный элемент НПА:</FormLabel>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          size="lg"
        />
      </FormControl>

      {/* Text */}
      <FormControl id="text" isRequired>
        <FormLabel fontSize="lg">Текст нормы:</FormLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          size="lg"
          resize="vertical"
          minH="400px"
          width="100%"
        />
      </FormControl>

      <Button type="submit" colorScheme="blue" size="lg">
        Добавить документ
      </Button>
    </VStack>
  );
};

export default DocumentCreationPage;
