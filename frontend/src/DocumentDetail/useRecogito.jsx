import { useEffect } from "react";
import NormSelector from "../widget/index.jsx";
import { getCookie } from "../Utils.jsx";
import { Recogito } from "@recogito/recogito-js";
import "@recogito/recogito-js/dist/recogito.min.css";
import apiRequest, { BASE_URL } from "../apiRequest.jsx";

function parseAnnotation(annotation) {
  let start, end, originalText, comment, lawType, lawJustification;

  for (const selector of annotation.target.selector) {
    if (selector.type === "TextQuoteSelector") {
      originalText = selector.exact;
    } else if (selector.type === "TextPositionSelector") {
      start = selector.start;
      end = selector.end;
    }
  }

  for (const body of annotation.body) {
    if (body.purpose === "commenting") {
      comment = body.value;
    } else if (body.purpose === "classifying") {
      lawType = body.value.type;
      lawJustification = body.value.justification;
    }
  }

  return {
    start,
    end,
    originalText,
    comment,
    lawType,
    lawJustification,
  };
}

export const useRecogito = (loading, documentId, id) => {
  useEffect(() => {
    if (!loading && documentId) {
      const formatter = function (annotation) {
        if (
          annotation.bodies.find(
            (b) => b.purpose === "classifying" && b.value.type !== "UNCHECKED"
          )
        ) {
          return "law-type";
        } else if (
          annotation.bodies.find(
            (b) =>
              b.purpose === "classifying" &&
              b.value.justification !== "UNCHECKED"
          )
        ) {
          return "law-justification";
        }
        return "comment";
      };
      const r = new Recogito({
        content: document.getElementById("doctext"),
        widgets: ["COMMENT", NormSelector],
        mode: "pre",
        readOnly: localStorage.getItem("access") === null,
        formatter: formatter,
        locale: "ru",
      });
      r.loadAnnotations(`${BASE_URL}/annotations_list/${id}`);
      // Add an event handler
      r.on("createAnnotation", async function (annotation, overrideId) {
        // strip hashtag from the annotation id
        const new_id = annotation.id.replace("#", "");
        // set the annotation id to the stripped id
        annotation.id = new_id;
        let parsedAnnotation = parseAnnotation(annotation);

        let body_data = {
          id: annotation.id,
          document: documentId,
          start: parsedAnnotation.start,
          end: parsedAnnotation.end,
          orig_text: parsedAnnotation.originalText,
          comment: parsedAnnotation.comment,
          law_type: parsedAnnotation.lawType,
          law_justification: parsedAnnotation.lawJustification,
          json_data: annotation,
        };

        try {
          const data = await apiRequest("annotations/", "POST", body_data);
          console.log(data);
          overrideId(new_id);
        } catch (error) {
          console.error(error);
        }
      });

      r.on("updateAnnotation", async function (annotation) {
        let parsedAnnotation = parseAnnotation(annotation);
        let body_data = {
          id: annotation.id,
          document: documentId,
          start: parsedAnnotation.start,
          end: parsedAnnotation.end,
          orig_text: parsedAnnotation.originalText,
          comment: parsedAnnotation.comment,
          law_type: parsedAnnotation.lawType,
          law_justification: parsedAnnotation.lawJustification,
          json_data: annotation,
        };

        try {
          const data = await apiRequest(
            `annotations/${annotation.id}/`,
            "PUT",
            body_data
          );
          console.log(data);
        } catch (error) {
          console.error(error);
        }
      });

      r.on("deleteAnnotation", async function (annotation) {
        try {
          await apiRequest(`annotations/${annotation.id}/`, "DELETE");
          console.log("Annotation deleted successfully.");
        } catch (error) {
          console.error("Failed to delete annotation.", error);
        }
      });
    }
  }, [loading, documentId]);
};
