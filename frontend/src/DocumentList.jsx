import React, { useEffect, useState, useContext } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  Icon,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Radio,
  RadioGroup,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Select } from "chakra-react-select";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { FaCalendar, FaCircleCheck, FaUser, FaRobot } from "react-icons/fa6";
import { BASE_URL } from "./apiRequest.jsx";
import { FaBook } from "react-icons/fa";
import useGetNPA from "./GetNPA.jsx";
import NPASelect from "./NPASelect.jsx";

const lawJustificationMapping = {
  UNCHECKED: "не проверено",
  AUTH: "Авторитет",
  CARE: "Забота",
  LOYAL: "Лояльность",
  FAIR: "Справедливость",
  PUR: "Чистота",
  NON: "Нет этической окраски",
};

const lawTypeMapping = {
  UNCHECKED: "не проверено",
  ALLOW: "Дозволение",
  DUTY: "Обязанность",
  BAN: "Запрет",
  DEF: "Дефиниция",
  DEC: "Декларация",
  GOAL: "Цель",
  OTHER: "Иное",
};

const DocumentCard = ({ doc }) => {
  const localeOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };
  const STATUS_CHOICES = {
    UNMARKED: "Не размечено",
    MARKED: "Размечено",
    CHECKED: "Проверено",
    GENERATED: "Сгенерировано",
  };

  const date = new Date(doc.created_at).toLocaleString("ru-RU", localeOptions);

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" mb={4} w="100%">
      <Box p="6">
        <Flex justifyContent="space-between" alignItems="center" mb={3}>
          <Text fontSize="sm" color="gray.500">
            ID: {doc.id}
          </Text>
          <Box>
            <Badge colorScheme="#" mr={2}>
              <Icon as={FaUser} /> {doc.username}
            </Badge>
            <Badge colorScheme="#">
              <Icon as={FaBook} /> {doc.NPA}
            </Badge>
            <Badge colorScheme="#">
              <Icon as={FaCalendar} /> {date}
            </Badge>
            <Badge colorScheme="#">
              <Icon
                as={
                  STATUS_CHOICES[doc.status] === "Сгенерировано"
                    ? FaRobot
                    : FaCircleCheck
                }
              />{" "}
              {STATUS_CHOICES[doc.status]}
            </Badge>
          </Box>
        </Flex>

        <Box d="flex" alignItems="baseline">
          <Heading size="xl">{doc.title}</Heading>
        </Box>

        <Box mt={2}>
          <div className="render_newline">{doc.text}</div>
        </Box>

        <Flex mt={2} wrap="wrap" fontSize="sm">
          <Badge colorScheme="blue" mr={2}>
            Профиль: {lawJustificationMapping[doc.dominant_justification]}
          </Badge>
          <Badge colorScheme="green" mr={2}>
            Тип: {lawTypeMapping[doc.law_type]}
          </Badge>
        </Flex>

        <Box d="flex" mt={5} justifyContent="flex-end">
          <Button as={Link} to={`/document_detail/${doc.id}`}>
            Просмотреть
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const DocumentListPage = () => {
  const { npaMapping, npaLoading, npaError } = useGetNPA();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("title"); // options can be "title", "text", or "id"
  const [lawTypes, setLawTypes] = useState([]);
  const [dominantJustifications, setDominantJustifications] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [user, setUser] = useState("");
  const [status, setStatus] = useState([]);
  const [selectedNPA, setSelectedNPA] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      const response = await fetch(
        `${BASE_URL}/documents/search?search=${searchQuery}&search_type=${searchType}&law_types=${lawTypes.join(
          ","
        )}&dominant_justifications=${dominantJustifications.join(
          ","
        )}&from_date=${fromDate}&to_date=${toDate}&user=${user}&status=${status.join(
          ","
        )}&npa=${selectedNPA.join(",")}&page=${currentPage}`
      );

      const data = await response.json();
      setDocs(data.results);
      setTotalPages(data.count);
      setTotalDocuments(data.total_documents); // Set the total documents count
      setLoading(false);
    };

    fetchDocs();
  }, [
    searchQuery,
    searchType,
    lawTypes,
    dominantJustifications,
    fromDate,
    toDate,
    user,
    status,
    selectedNPA,
    currentPage,
  ]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchTypeChange = (nextSearchType) => {
    setSearchQuery("");
    setSearchType(nextSearchType);
  };

  const handleLawTypesChange = (value) => {
    if (lawTypes.includes(value)) {
      setLawTypes(lawTypes.filter((item) => item !== value));
    } else {
      setLawTypes([...lawTypes, value]);
    }
  };

  const handleLawJustificationsChange = (value) => {
    if (dominantJustifications.includes(value)) {
      setDominantJustifications(
        dominantJustifications.filter((item) => item !== value)
      );
    } else {
      setDominantJustifications([...dominantJustifications, value]);
    }
  };

  const handleNPAChange = (value) => {
    setSelectedNPA(value.map((item) => item.value));
  };

  const handleUserChange = (e) => {
    setUser(e.target.value);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSearchType("title");
    setLawTypes([]);
    setDominantJustifications([]);
    setFromDate("");
    setToDate("");
    setUser("");
    setStatus([]);
    setSelectedNPA([]);
  };

  const lawTypesData = [
    { value: "UNCHECKED", label: "не проверено" },
    { value: "ALLOW", label: "Дозволение" },
    { value: "DUTY", label: "Обязанность" },
    { value: "BAN", label: "Запрет" },
    { value: "DEF", label: "Дефиниция" },
    { value: "DEC", label: "Декларация" },
    { value: "GOAL", label: "Цель" },
    { value: "OTHER", label: "Иное" },
  ];
  const lawJustificationsData = [
    { value: "UNCHECKED", label: "не проверено" },
    { value: "AUTH", label: "Авторитет" },
    { value: "CARE", label: "Забота" },
    { value: "LOYAL", label: "Лояльность" },
    { value: "FAIR", label: "Справедливость" },
    { value: "PUR", label: "Чистота" },
    { value: "NON", label: "Нет этической окраски" },
  ];

  const handleStatusChange = (value) => {
    if (status.includes(value)) {
      setStatus(status.filter((item) => item !== value));
    } else {
      setStatus([...status, value]);
    }
  };

  const statusMapping = {
    UNMARKED: "Не размечено",
    MARKED: "Размечено",
    CHECKED: "Проверено",
    GENERATED: "Сгенерировано",
  };

  const statusData = [
    { value: "UNMARKED", label: "Не размечено" },
    { value: "MARKED", label: "Размечено" },
    { value: "CHECKED", label: "Проверено" },
    { value: "GENERATED", label: "Сгенерировано" },
  ];

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const MAX_VISIBLE_PAGES = 3; // Maximum number of visible page buttons on each side

    const renderPageButtons = () => {
      const pageButtons = [];
      let startPage = Math.max(currentPage - MAX_VISIBLE_PAGES, 1);
      let endPage = Math.min(currentPage + MAX_VISIBLE_PAGES, totalPages);

      if (currentPage <= MAX_VISIBLE_PAGES) {
        endPage = Math.min(MAX_VISIBLE_PAGES * 2 + 1, totalPages);
      } else if (totalPages - currentPage < MAX_VISIBLE_PAGES) {
        startPage = Math.max(totalPages - MAX_VISIBLE_PAGES * 2, 1);
      }

      for (let page = startPage; page <= endPage; page++) {
        pageButtons.push(
          <Button
            key={page}
            size="sm"
            colorScheme={page === currentPage ? "blue" : "gray"}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      }

      if (startPage > 1) {
        pageButtons.unshift(<Text key="ellipsis-start">...</Text>);
        pageButtons.unshift(
          <Button
            key={1}
            size="sm"
            colorScheme={1 === currentPage ? "blue" : "gray"}
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
        );
      }

      if (endPage < totalPages) {
        pageButtons.push(<Text key="ellipsis-end">...</Text>);
        pageButtons.push(
          <Button
            key={totalPages}
            size="sm"
            colorScheme={totalPages === currentPage ? "blue" : "gray"}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        );
      }

      return pageButtons;
    };

    return (
      <HStack spacing={2} mt={4} justify="center">
        {renderPageButtons()}
      </HStack>
    );
  };

  const PAGE_SIZE = 25;
  return (
    <Box>
      <form onSubmit={(e) => e.preventDefault()}>
        <Input
          placeholder="Искать документы..."
          size="lg"
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <RadioGroup onChange={handleSearchTypeChange} value={searchType}>
          <Stack direction="row">
            <Radio value="title">Искать по названию</Radio>
            <Radio value="text">Искать по тексту</Radio>
            <Radio value="id">Искать по ID</Radio>
          </Stack>
        </RadioGroup>
        <Flex mt={3}>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="580px">
              Профиль нормы
            </MenuButton>
            <MenuList>
              {lawJustificationsData.map(({ value, label }) => (
                <MenuItem
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLawJustificationsChange(value);
                  }}
                >
                  <Checkbox
                    isChecked={dominantJustifications.includes(value)}
                    pointerEvents="none"
                  >
                    {label}
                  </Checkbox>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Box w="5%" />
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="420px">
              Тип нормы
            </MenuButton>
            <MenuList>
              {lawTypesData.map(({ value, label }) => (
                <MenuItem
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLawTypesChange(value);
                  }}
                >
                  <Checkbox
                    isChecked={lawTypes.includes(value)}
                    pointerEvents="none"
                  >
                    {label}
                  </Checkbox>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Box w="5%" />
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} w="310px">
              Статус
            </MenuButton>
            <MenuList>
              {statusData.map(({ value, label }) => (
                <MenuItem
                  key={value}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(value);
                  }}
                >
                  <Checkbox
                    isChecked={status.includes(value)}
                    pointerEvents="none"
                  >
                    {label}
                  </Checkbox>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Box w="5%" />
          <Input
            placeholder="Имя пользователя"
            value={user}
            onChange={handleUserChange}
            w="65%"
          />
        </Flex>
        <Box mt={3}>
          <NPASelect
            npaMapping={npaMapping}
            handleNPAChange={handleNPAChange}
            npaLoading={npaLoading}
            npaError={npaError}
          />
        </Box>
        <Flex mt={3}>
          <Flex align="center" w="50%">
            <Text mr={2}>От:</Text>
            <Input
              type="date"
              placeholder="From Date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              flex="1"
            />
          </Flex>
          <Box w="5%" />
          <Flex align="center" w="50%">
            <Text mr={2}>До:</Text>
            <Input
              type="date"
              placeholder="To Date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              flex="1"
            />
          </Flex>
        </Flex>
        <Flex justify="space-between" align="center" mt={3}>
          <Button onClick={handleResetFilters} mt={3}>
            Сбросить фильтры
          </Button>
          <Text>Найдено документов: {totalDocuments}</Text>
        </Flex>
      </form>

      <VStack spacing={8} mt={7}>
        {loading ? (
          <Spinner />
        ) : (
          docs && docs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)
        )}
      </VStack>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalPages / PAGE_SIZE)} // Calculate the total number of pages
        onPageChange={handlePageChange}
      />
    </Box>
  );
};

export default DocumentListPage;
