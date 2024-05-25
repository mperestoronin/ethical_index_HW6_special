import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  HStack,
  Spacer,
  Tooltip,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import React, { useRef, useState } from "react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import apiRequest from "../apiRequest";

const DocumentButtons = ({ doc, documentId }) => {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const cancelRef = useRef();

  function isAuthenticated() {
    const token = localStorage.getItem("access");
    return !!token;
  }

  const handleDelete = async () => {
    try {
      if (!isAuthenticated()) {
        return;
      }
      const url = `documents/${doc.id}/`;
      const method = "DELETE";

      await apiRequest(url, method);
      navigate("/document_list/");
    } catch (error) {
      console.error(error);
    }
  };

  const onDeleteButtonClick = () => {
    if (isAuthenticated()) {
      setIsOpen(true);
    }
  };
  const handleCopy = async () => {
    if (!isAuthenticated()) {
      return;
    }
    const url = "documents/";
    const method = "POST";
    let user = JSON.parse(localStorage.getItem("userData")).id;
    const body = { title: `${doc.title} (копия)`, text: doc.text, user: user };

    try {
      const document = await apiRequest(url, method, body);
      navigate(`/document_detail/${document.id}`);
    } catch (error) {
      console.error("Failed to copy document:", error);
    }
  };

  const logged_in = localStorage.getItem("access") !== null;
  return (
    <HStack spacing={4}>
      <Tooltip
        label="Сохранение происходит автоматически, поэтому вы можете смело вернуться к списку документов."
        fontSize="md"
      >
        <Button as={Link} to={`/document_list/`} colorScheme="facebook">
          Назад к документам
        </Button>
      </Tooltip>
      {isAuthenticated() ? (
        <Button as={Link} to={`/edit_document/${documentId}`}>
          Редактировать
        </Button>
      ) : (
        <Button isDisabled>Редактировать</Button>
      )}
      <Button onClick={onDeleteButtonClick} isDisabled={!logged_in}>
        Удалить
      </Button>
      <Spacer />
      <Tooltip
        label="Вы можете дублировать уже размеченный документ, чтобы разметить его снова."
        fontSize="md"
      >
        <Button
          onClick={handleCopy}
          rightIcon={<InfoOutlineIcon />}
          isDisabled={!logged_in}
        >
          Дублировать документ
        </Button>
      </Tooltip>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Удалить документ
            </AlertDialogHeader>

            <AlertDialogBody>
              Вы уверены, что хотите удалить документ "{doc.title}"?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Отмена
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Удалить
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </HStack>
  );
};

export default DocumentButtons;
