import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import apiRequest from "./apiRequest";
import useGetNPA from "./GetNPA";
import NPASelect from "./NPASelect";

const DocumentEdit = () => {
  const navigate = useNavigate();
  const { npaMapping, npaLoading, npaError } = useGetNPA();
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [npa, setNpa] = useState(""); // New state for NPA

  useEffect(() => {
    const fetchDocument = async () => {
      const doc = await apiRequest(`documents/${id}/`, "GET");
      setTitle(doc.title);
      setText(doc.text);
      setNpa(doc.NPA); // Set the fetched NPA value to state
    };

    fetchDocument();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let user = JSON.parse(localStorage.getItem("userData")).id;
    const url = `documents/${id}/`;
    const method = "PUT";
    const body = { title, text, NPA: npa, user: user }; // Include the NPA in the body

    try {
      await apiRequest(url, method, body);
      navigate(`/document_detail/${id}`);
    } catch (error) {
      console.error("Failed to update document:", error);
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
      <Heading>Редактирование</Heading>
      <FormControl id="npa" isRequired>
        <FormLabel fontSize="lg">НПА:</FormLabel>
        <NPASelect
          npaMapping={npaMapping}
          handleNPAChange={(selectedNPA) => setNpa(selectedNPA.value)}
          npaLoading={npaLoading}
          npaError={npaError}
          isMulti={false}
        />
      </FormControl>

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

      <FormControl id="text" isRequired>
        <FormLabel fontSize="lg">Текст нормы:</FormLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          size="lg"
          resize="vertical" // Allow vertical resizing
          minH="400px" // Set a minimum height
          width="100%" // Set the width to 100% of the container
        />
      </FormControl>

      <Button type="submit" colorScheme="blue" size="lg">
        Сохранить изменения
      </Button>
    </VStack>
  );
};

export default DocumentEdit;
