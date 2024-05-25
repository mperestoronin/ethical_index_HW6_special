import "./index.css";

function NormSelector(props) {
  const currentClassifiers = props.annotation
    ? props.annotation.bodies.find((b) => b.purpose === "classifying")
    : null;

  const lawJustificationMapping = {
    UNCHECKED: "нет",
    AUTH: "Авторитет",
    CARE: "Забота",
    LOYAL: "Лояльность",
    FAIR: "Справедливость",
    PUR: "Чистота",
    NON: "Нет этической окраски",
  };

  const lawTypeMapping = {
    UNCHECKED: "нет",
    ALLOW: "Дозволение",
    DUTY: "Обязанность",
    BAN: "Запрет",
    DEF: "Дефиниция",
    DEC: "Декларация",
    GOAL: "Цель",
    OTHER: "Иное",
  };

  function setClassifiers(value) {
    props.onUpsertBody({
      ...currentClassifiers,
      purpose: "classifying",
      value,
    });
    lawJustificationSelect.value = currentClassifiers.value.justification;
    lawTypeSelect.value = currentClassifiers.value.type;
  }

  // Check if the user is logged in
  let loggedIn = localStorage.getItem("access") !== null;

  const widget = document.createElement("div");
  widget.className = "helloworld-widget";

  // Create lawJustification select element
  const lawJustificationContainer = document.createElement("div");
  lawJustificationContainer.className = "select-container";
  const lawJustificationLabel = document.createElement("label");
  lawJustificationLabel.innerText = "Профиль нормы";
  lawJustificationContainer.appendChild(lawJustificationLabel);

  const lawJustificationSelect = document.createElement("select");
  lawJustificationSelect.disabled = !loggedIn; // Disable if not logged in
  lawJustificationSelect.addEventListener("change", () => {
    setClassifiers({
      justification: lawJustificationSelect.value,
      type: lawTypeSelect.value,
    });
  });
  lawJustificationSelect.className = "law-justification-select";
  Object.entries(lawJustificationMapping).map(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.text = value;
    lawJustificationSelect.appendChild(option);
  });
  lawJustificationContainer.appendChild(lawJustificationSelect);

  // Create lawType select element
  const lawTypeContainer = document.createElement("div");
  lawTypeContainer.className = "select-container";
  const lawTypeLabel = document.createElement("label");
  lawTypeLabel.innerText = "Тип нормы";
  lawTypeContainer.appendChild(lawTypeLabel);

  const lawTypeSelect = document.createElement("select");
  lawTypeSelect.disabled = !loggedIn; // Disable if not logged in
  lawTypeSelect.addEventListener("change", () => {
    setClassifiers({
      justification: lawJustificationSelect.value,
      type: lawTypeSelect.value,
    });
  });
  lawTypeSelect.className = "law-type-select";
  Object.entries(lawTypeMapping).map(([key, value]) => {
    const option = document.createElement("option");
    option.value = key;
    option.text = value;
    lawTypeSelect.appendChild(option);
  });
  lawTypeContainer.appendChild(lawTypeSelect);

  // Add select elements to the widget
  widget.appendChild(lawJustificationContainer);
  widget.appendChild(lawTypeContainer);

  // load current values
  if (currentClassifiers) {
    lawJustificationSelect.value = currentClassifiers.value.justification;
    lawTypeSelect.value = currentClassifiers.value.type;
  }

  return widget;
}

export default NormSelector;
