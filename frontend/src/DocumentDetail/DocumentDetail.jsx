import React, { useEffect, useState } from "react";
import {
  Badge,
  Box,
  Heading,
  HStack,
  Select,
  Spinner,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import DocumentDetailButtons from "./DocumentDetailButtons.jsx";
import TextClassification from "./TextClassification.jsx";
import { useRecogito } from "./useRecogito.jsx";
import {
  fetchClassifiers,
  fetchDocument,
  updateClassifier,
  updateStatus,
} from "./api.jsx";
import useGetNPA from "../GetNPA.jsx";

const DocumentDetailPage = () => {
  const { npaMapping, npaLoading, npaError } = useGetNPA();
  const { id } = useParams();
  const [doc, setDoc] = useState({});
  const [loading, setLoading] = useState(true);
  const [lawType, setLawType] = useState("UNCHECKED");
  const [documentId, setDocumentId] = useState(null);
  const [userPermissions, setUserPermissions] = useState([]);
  const [status, setStatus] = useState("");

  const [justificationPoints, setJustificationPoints] = useState({
    AUTH_points: 0,
    CARE_points: 0,
    LOYAL_points: 0,
    FAIR_points: 0,
    PUR_points: 0,
    NON_points: 0,
  });

  const statusChoices = [
    { value: "UNMARKED", label: "Не размечено" },
    { value: "MARKED", label: "Размечено" },
    { value: "CHECKED", label: "Проверено" },
    // { value: "GENERATED", label: "Сгенерировано" },
  ];

  const statusOptions = statusChoices.map((statusChoice, index) => {
    // A user with 'can_mark_as_marked' can change the status from UNMARKED to MARKED and vice versa, but can't change it if it's CHECKED.
    // A user with 'can_mark_as_checked' can change the status from MARKED to CHECKED and vice versa, and from UNMARKED to CHECKED and vice versa.

    let isDisabled;

    if (status === "CHECKED") {
      isDisabled = !userPermissions.includes("can_mark_as_checked");
    } else if (statusChoice.value === "MARKED") {
      isDisabled = !userPermissions.includes("can_mark_as_marked");
    } else if (statusChoice.value === "GENERATED") {
      isDisabled = !userPermissions.includes("can_mark_as_marked");
    } else if (statusChoice.value === "CHECKED") {
      isDisabled = !userPermissions.includes("can_mark_as_checked");
    } else {
      // when statusChoice.value === "UNMARKED"
      isDisabled = !(
        userPermissions.includes("can_mark_as_marked") ||
        userPermissions.includes("can_mark_as_checked")
      );
    }

    // if superuser, don't disable anything (while checking for null)
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsedUserData = JSON.parse(userData);
      if (parsedUserData.is_superuser) {
        isDisabled = false;
      }
    }

    return (
      <option key={index} value={statusChoice.value} disabled={isDisabled}>
        {statusChoice.label}
      </option>
    );
  });

  useRecogito(loading, documentId, id);

  useEffect(() => {
    // set user permissions
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (userData) {
      setUserPermissions(userData.permissions);
    }
  }, []);

  useEffect(() => {
    const fetchDocumentData = async () => {
      setLoading(true);
      const documentData = await fetchDocument(id);
      setDocumentId(documentData.id);
      setDoc(documentData);
      setLoading(false);
      setDoc(documentData);
      setStatus(documentData.status || "UNMARKED");
    };

    fetchDocumentData();
  }, [id]);

  useEffect(() => {
    const fetchClassifiersData = async () => {
      setLoading(true);
      const classifierData = await fetchClassifiers(id);
      setDoc((prevData) => ({ ...prevData, ...classifierData }));
      setLawType(classifierData.law_type);
      setJustificationPoints({
        AUTH_points: classifierData.AUTH_points || 0,
        CARE_points: classifierData.CARE_points || 0,
        LOYAL_points: classifierData.LOYAL_points || 0,
        FAIR_points: classifierData.FAIR_points || 0,
        PUR_points: classifierData.PUR_points || 0,
        NON_points: classifierData.NON_points || 0,
      });
      setLoading(false);
    };

    fetchClassifiersData();
  }, [id]);

  const updateValue = async (field, value) => {
    console.log(field);
    try {
      await updateClassifier(id, field, value);
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

  const handleJustificationPointsChange = (field, newValue) => {
    const totalPoints =
      Object.values(justificationPoints).reduce((a, b) => a + b, 0) -
      justificationPoints[field] +
      newValue;

    if (totalPoints <= 10) {
      setJustificationPoints((prevPoints) => ({
        ...prevPoints,
        [field]: newValue,
      }));
      updateValue(field, newValue);
    }
  };

  const toast = useToast();
  const statusToastId = "statusToastId";

  const handleStatusChange = async (newStatus) => {
    try {
      await updateStatus(id, newStatus);
      setStatus(newStatus);
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Spinner />
      </Box>
    );
  }
  return (
    <VStack spacing={6} align="stretch">
      <Badge colorScheme="#" mr={2}>
        {npaMapping && npaMapping.find((npa) => npa[0] === doc.NPA)?.[1]}
      </Badge>
      <HStack spacing={4} align="center">
        <Heading>{doc.title}</Heading>
        <Box width="200px">
          <Select
            value={status}
            onChange={(e) => {
              handleStatusChange(e.target.value);
              toast({
                title: "Сохранено",
                // include selected status' html content in toast message
                description: `Статус документа изменен на ${e.target.selectedOptions[0].innerHTML}.`,
                status: "success",
                duration: 3000,
                isClosable: true,
              });
            }}
          >
            {statusOptions}
          </Select>
        </Box>
      </HStack>
      <Box p={6} boxShadow="md" borderWidth="1px" borderRadius="md">
        <div id="doctext" className="render_newline">
          {doc.text}
        </div>
      </Box>
      <Heading size="md">Классификация</Heading>
      <TextClassification
        justificationPoints={justificationPoints}
        handleJustificationPointsChange={handleJustificationPointsChange}
        lawType={lawType}
        setLawType={setLawType}
        updateValue={updateValue}
      />
      <DocumentDetailButtons doc={doc} documentId={documentId} />
    </VStack>
  );
};

export default DocumentDetailPage;
