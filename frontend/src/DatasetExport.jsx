import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { BASE_URL } from "./apiRequest.jsx";

function useAsyncClickHandler(url, fileName) {
  const [isLoading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch(url);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return [handleClick, isLoading];
}

function ExportMenu() {
  const [handleDownloadDocumentsClick, isDownloadDocumentsLoading] =
    useAsyncClickHandler(
      `${BASE_URL}/documents/`,
      `documents_${new Date(Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })}.json`
    );
  const [handleDownloadAnnotationsClick, isDownloadAnnotationsLoading] =
    useAsyncClickHandler(
      `${BASE_URL}/export_annotations/`,
      `annotations_${new Date(Date.now()).toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      })}.json`
    );
  const [handleDownloadAllClick, isDownloadAllLoading] = useAsyncClickHandler(
    `${BASE_URL}/export_all/`,
    `documents_with_annotations_${new Date(Date.now()).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }
    )}.json`
  );

  function isAuthenticated() {
    return localStorage.getItem("access") && localStorage.getItem("refresh");
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Menu>
      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
        Скачать датасет
      </MenuButton>
      <MenuList>
        <MenuItem
          onClick={handleDownloadDocumentsClick}
          id="download-documents"
          color="black"
        >
          {isDownloadDocumentsLoading ? <Spinner /> : "Документы"}
        </MenuItem>
        <MenuItem
          onClick={handleDownloadAnnotationsClick}
          id="download-annotations"
          color="black"
        >
          {isDownloadAnnotationsLoading ? <Spinner /> : "Аннотации"}
        </MenuItem>
        <MenuItem
          onClick={handleDownloadAllClick}
          id="download-all"
          color="black"
        >
          {isDownloadAllLoading ? <Spinner /> : "Все данные"}
        </MenuItem>
      </MenuList>
    </Menu>
  );
}

export default ExportMenu;
