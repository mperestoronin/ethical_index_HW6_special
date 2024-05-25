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
  Select,
} from "@chakra-ui/react";
import apiRequest from "./apiRequest";
import { updateClassifier, updateStatus } from "./DocumentDetail/api.jsx";
import { v4 } from "uuid";
import useGetNPA from "./GetNPA.jsx";

const GenerateClassification = () => {
  const navigate = useNavigate();
  const { npaMapping, npaLoading, npaError } = useGetNPA();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [NPA, setNPA] = useState("");

  const addAnnotationToBackend = async (
    documentId,
    normText,
    keyword,
    comment,
    lawType,
    lawJustification
  ) => {
    const start = normText.indexOf(keyword);
    const end = start + keyword.length;
    const annotationId = v4(); // Generate a unique ID for the annotation
    const json_data = {
      id: annotationId,
      body: [
        {
          value: {
            type: lawType,
            justification: lawJustification,
          },
          purpose: "classifying",
        },
      ],
      type: "Annotation",
      target: {
        selector: [
          {
            type: "TextQuoteSelector",
            exact: keyword,
          },
          {
            end: end,
            type: "TextPositionSelector",
            start: start,
          },
        ],
      },
      "@context": "http://www.w3.org/ns/anno.jsonld",
    };

    let body_data = {
      id: annotationId,
      document: documentId,
      start: start,
      end: end,
      orig_text: keyword,
      comment: comment,
      law_type: lawType,
      law_justification: lawJustification,
      json_data: json_data,
    };

    try {
      const data = await apiRequest("annotations/", "POST", body_data);
    } catch (error) {
      console.error("Failed to add annotation:", error);
    }
  };
  // Mock function to simulate fetching data from the model's API

  const mockFetchClassifiedNorms = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            paragraph:
              "Не является преступлением причинение вреда охраняемым уголовным законом интересам при обоснованном риске для достижения общественно полезной цели",
            results: {
              justification: {
                justification_probability: {
                  AUTH: 0.30400206554228143,
                  CARE: 0.12582804209273943,
                  FAIR: 0.04114220564467995,
                  LOYAL: 0.04628954980877369,
                  PUR: 0.4827381369115256,
                },
                justification_keywords: {
                  AUTH: ["законом", "преступлением"],
                  CARE: ["полезной"],
                },
              },
              law_type: {
                law_type_probability: {
                  ALLOW: 0.06896014240651764,
                  BAN: 0.06407789999234863,
                  DEC: 0.06910514234646596,
                  DEF: 0.0674624271605853,
                  DUTY: 0.0666097531475816,
                  GOAL: 0.1741919546898045,
                  OTHER: 0.48959267194464245,
                },
                law_type_keywords: {
                  GOAL: ["цели"],
                },
              },
            },
          },
          {
            paragraph:
              "Риск признается обоснованным если указанная цель не могла быть достигнута не связанными с риском действиями бездействием и лицо допустившее риск предприняло достаточные меры для предотвращения вреда охраняемым уголовным законом интересам",
            results: {
              justification: {
                justification_probability: {
                  AUTH: 0.33569040995307936,
                  CARE: 0.27081991158750485,
                  FAIR: 0.07461182211686727,
                  LOYAL: 0.0480579447550439,
                  PUR: 0.27081991158750485,
                },
                justification_keywords: {
                  AUTH: ["указанная", "законом"],
                },
              },
              law_type: {
                law_type_probability: {
                  ALLOW: 0.14883506319340734,
                  BAN: 0.4878065993530883,
                  DEC: 0.053295765943939095,
                  DEF: 0.0546334877131714,
                  DUTY: 0.05812474363355175,
                  GOAL: 0.143991624450725,
                  OTHER: 0.05331270035693631,
                },
                law_type_keywords: {
                  ALLOW: ["могла"],
                  GOAL: ["цель"],
                },
              },
            },
          },
          // Add more norms as needed for testing
        ]);
      }, 1000); // Simulates a delay of 1000ms (1 second)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let user = JSON.parse(localStorage.getItem("userData")).id;

    // const mlModelUrl = "Tuberculosis gaming"; // Placeholder URL
    //
    // try {
    //     // Step 1: Send the text to the ML model for classification
    //     const response = await fetch(mlModelUrl, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({ text })
    //     });
    //
    //     if (!response.ok) {
    //         throw new Error("Failed to classify document");
    //     }
    //
    //     const norms = await response.json();

    // Iterate through each norm and add them to the system
    const norms = await mockFetchClassifiedNorms();
    for (let i = 0; i < norms.length; i++) {
      const norm = norms[i];
      const { paragraph, results } = norm;
      const normTitle = norms.length > 1 ? `${title} - норма ${i + 1}` : title;
      const normDocument = await apiRequest("documents/", "POST", {
        title: normTitle,
        text: paragraph,
        user: user,
        NPA: NPA,
      });

      const justificationKeywords =
        results.justification.justification_keywords;
      for (const [justificationType, keywords] of Object.entries(
        justificationKeywords
      )) {
        keywords.forEach((keyword) => {
          addAnnotationToBackend(
            normDocument.id,
            paragraph,
            keyword,
            "",
            "UNCHECKED",
            justificationType
          );
        });
      }
      const law_typeKeywords = results.law_type.law_type_keywords;
      for (const [law_type, keywords] of Object.entries(law_typeKeywords)) {
        keywords.forEach((keyword) => {
          addAnnotationToBackend(
            normDocument.id,
            paragraph,
            keyword,
            "",
            law_type,
            "UNCHECKED"
          );
        });
      }

      // Update justifications
      const justificationProbabilities =
        results.justification.justification_probability;
      let totalPoints = 0;

      for (const [key, value] of Object.entries(justificationProbabilities)) {
        const newValue = Math.round(value * 10);
        if (totalPoints + newValue <= 10) {
          try {
            await updateClassifier(normDocument.id, `${key}_points`, newValue);
          } catch (error) {
            console.error("Update failed:", error);
          }
          totalPoints += newValue;
        } else {
          // Adjust the last value to ensure total does not exceed 10
          const adjustedValue = 10 - totalPoints;
          if (adjustedValue > 0) {
            await updateClassifier(
              normDocument.id,
              `${key}_points`,
              adjustedValue
            );
          }
          break; // No further updates if the total reaches 10
        }
      }

      // Update law type
      const lawTypeProbabilities = results.law_type.law_type_probability;
      const lawType = Object.entries(lawTypeProbabilities).reduce((a, b) =>
        a[1] > b[1] ? a : b
      )[0];
      try {
        await updateClassifier(normDocument.id, "law_type", lawType);
      } catch (error) {
        console.error("Update failed:", error);
      }
      try {
        await updateStatus(normDocument.id, "GENERATED");
      } catch (error) {
        console.error("Update failed:", error);
      }
    }

    navigate("/document_list"); // Redirect to a suitable page after completion
    // } catch (error) {
    //     console.error("Failed to process document:", error);
    // }
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
      <Heading>Автоматическая Классификация</Heading>

      {/* NPA Dropdown */}
      <FormControl id="NPA" isRequired>
        <FormLabel fontSize="lg">Выберите НПА:</FormLabel>
        <Select
          value={NPA}
          onChange={(e) => setNPA(e.target.value)}
          required
          size="lg"
          isDisabled={npaLoading || npaError}
        >
          {npaMapping &&
            npaMapping.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </Select>
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
        Сгенерировать классификацию
      </Button>
    </VStack>
  );
};

export default GenerateClassification;