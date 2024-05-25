import React, { useState, useEffect } from "react";
import {
  Box,
  Center,
  Image,
  Flex,
  Badge,
  Text,
  VStack,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  Container,
  SimpleGrid,
  StatHelpText,
  StatArrow,
  StatGroup,
  Tbody,
  Thead,
  Table,
  Tr,
  Th,
  Td,
  Button,
  Stack,
  Checkbox,
  CheckboxGroup,
  ModalOverlay,
  Modal,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Input,
  TableContainer,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import { MdStar } from "react-icons/md";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BASE_URL } from "./apiRequest.jsx";
import { FaChartBar, FaTable } from "react-icons/fa";
import { SettingsIcon, TimeIcon, DownloadIcon } from "@chakra-ui/icons";
import useGetNPA from "./GetNPA.jsx";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const StatisticsPage = () => {
  const { npaMapping, npaLoading, npaError } = useGetNPA();
  const [data, setData] = useState(null);
  const [showGraph, setShowGraph] = useState(false);
  const [selectedNPAs, setSelectedNPAs] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [viewMode, setViewMode] = useState("graph");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRangeData, setDateRangeData] = useState(null);
  const [viewModeAnnotators, setViewModeAnnotators] = useState("graph"); // 'graph' or 'table'

  useEffect(() => {
    fetch(`${BASE_URL}/statistics`)
      .then((response) => response.json())
      .then((data) => {
        setData(data);

        // Determine the top 5 NPAs
        const topNPAs = data.npa_counts
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
          .map((npa) => npa.NPA);
        setSelectedNPAs(topNPAs);
      })
      .catch((error) => console.error("Error fetching data: ", error));
    const currentDate = new Date();
    const oneMonthAgo = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      currentDate.getDate()
    );

    const formatDate = (date) => date.toISOString().split("T")[0];

    setFromDate(formatDate(oneMonthAgo));
    setToDate(formatDate(currentDate));

    // Fetch initial data for the last month
    fetchDateRangeStatistics(formatDate(oneMonthAgo), formatDate(currentDate));
  }, []);

  const fetchDateRangeStatistics = async (start, end) => {
    const formattedStart =
      start instanceof Date ? start.toISOString().split("T")[0] : start;
    const formattedEnd =
      end instanceof Date ? end.toISOString().split("T")[0] : end;

    const url = `${BASE_URL}/date_range_statistics?start_date=${formattedStart}&end_date=${formattedEnd}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const jsonData = await response.json();
      setDateRangeData(jsonData);
    } catch (error) {
      console.error("Error fetching date range statistics:", error);
    }
  };

  if (!data) {
    return <Text>Loading...</Text>;
  }
  const statusCounts = data.status_counts.reduce((acc, item) => {
    acc[item.status] = item.total;
    return acc;
  }, {});
  const totalDocuments = data.user_document_counts.reduce(
    (acc, item) => acc + item.total,
    0
  );
  const totalMarkedTexts = statusCounts["MARKED"] || 0;
  const totalCheckedTexts = statusCounts["CHECKED"] || 0;
  const totalUnmarkedTexts = statusCounts["UNMARKED"] || 0;

  const lawTypesData = {
    UNCHECKED: "не проверено",
    ALLOW: "Дозволение",
    DUTY: "Обязанность",
    BAN: "Запрет",
    DEF: "Дефиниция",
    DEC: "Декларация",
    GOAL: "Цель",
    OTHER: "Иное",
  };
  const lawJustificationsData = {
    UNCHECKED: "не проверено",
    AUTH: "Авторитет",
    CARE: "Забота",
    LOYAL: "Лояльность",
    FAIR: "Справедливость",
    PUR: "Чистота",
    NON: "Нет этической окраски",
  };
  const transformedLawTypeData = data.law_type_counts.map((item) => ({
    ...item,
    law_type: lawTypesData[item.law_type] || "Неизвестно",
  }));

  const transformedLawJustificationData = data.justification_counts.map(
    (item) => ({
      ...item,
      dominant_justification:
        lawJustificationsData[item.dominant_justification] || "Неизвестно",
    })
  );
  const toggleDisplay = () => {
    setShowGraph(!showGraph);
  };

  const handleNPAChange = (values) => {
    setSelectedNPAs(values); // 'values' is the new array of selected NPAs
  };

  // Filter out NPAs with zero documents
  const npaOptions =
    data && data.npa_counts
      ? data.npa_counts.filter((npa) => npa.total > 0).map((npa) => npa.NPA)
      : [];

  const filteredData =
    npaOptions.length > 0
      ? data.npa_counts.filter((npa) => selectedNPAs.includes(npa.NPA))
      : [];

  const convertNpaArrayToObject = (npaArray) => {
    const npaObject = {};
    npaArray.forEach(([key, value]) => {
      npaObject[key] = value;
    });
    return npaObject;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (npaLoading || npaError) {
      return (
        <Box p="3" bg="white" border="1px solid gray">
          <p>Loading...</p>
        </Box>
      );
    }
    if (active && payload && payload.length) {
      const npaAbbreviation = payload[0].payload.NPA; // Get the NPA abbreviation from payload
      const fullName =
        npaMapping.find(([key, value]) => key === npaAbbreviation)[1] ||
        npaAbbreviation;
      return (
        <Box p="3" bg="white" border="1px solid gray">
          <p>
            {fullName}: {payload[0].value}
          </p>
        </Box>
      );
    }

    return null;
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        value: PropTypes.number,
      })
    ),
  };

  const CustomTooltipMonths = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const formattedLabel = formatDateMonths(label); // Use the same formatDate function as before
      return (
        <Box p="3" bg="white" border="1px solid gray">
          <p className="label">{`${formattedLabel} : ${payload[0].value}`}</p>
        </Box>
      );
    }

    return null;
  };

  // Function to render tables
  const renderTables = () => (
    <SimpleGrid columns={2} spacing={10} p={5}>
      {/* Law Justification Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Профиль нормы</Th>
            <Th isNumeric>Количество документов</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.justification_counts.map((item, index) => (
            <Tr key={index}>
              <Td>
                {lawJustificationsData[item.dominant_justification] ||
                  "Неизвестно"}
              </Td>
              <Td isNumeric>{item.total}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Law Type Table */}
      <Table>
        <Thead>
          <Tr>
            <Th>Тип нормы</Th>
            <Th isNumeric>Количество документов</Th>
          </Tr>
        </Thead>
        <Tbody>
          {data.law_type_counts.map((item, index) => (
            <Tr key={index}>
              <Td>{lawTypesData[item.law_type] || "Неизвестно"}</Td>
              <Td isNumeric>{item.total}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </SimpleGrid>
  );
  const renderBarCharts = () => (
    <SimpleGrid columns={2} spacing={10} p={5}>
      {/* Bar Chart for Law Justifications */}
      <BarChart width={500} height={300} data={transformedLawJustificationData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="dominant_justification"
          angle={-35}
          textAnchor="end"
          height={70}
        />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#8884d8" />
      </BarChart>
      {/* Bar Chart for Law Types */}
      <BarChart width={500} height={300} data={transformedLawTypeData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="law_type" angle={-35} textAnchor="end" height={70} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#82ca9d" />
      </BarChart>
    </SimpleGrid>
  );

  const DataTable = ({ data }) => (
    <Table variant="simple">
      <Thead>
        <Tr>
          <Th>НПА</Th>
          <Th isNumeric>Количество документов</Th>
        </Tr>
      </Thead>
      <Tbody>
        {data.map((item, index) => (
          <Tr key={index}>
            <Td>
              {npaMapping.find(([key, value]) => key === item.NPA)[1] ||
                item.NPA}
            </Td>
            <Td isNumeric>{item.total}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );

  const renderStatisticsTable = () => {
    if (!dateRangeData) return null;

    return (
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Пользователь</Th>
              <Th isNumeric>количество норм</Th>
            </Tr>
          </Thead>
          <Tbody>
            {dateRangeData.user_document_counts.map((item, index) => (
              <Tr key={index}>
                <Td>{item.user__username}</Td>
                <Td isNumeric>{item.total}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  const renderJustificationLawTypeTable = () => {
    const justificationLawData = data.justification_law_type_counts;

    const tableRows = Object.entries(justificationLawData).map(
      ([justificationKey, typeCounts]) => {
        const row = {
          justification: lawJustificationsData[justificationKey],
        };

        Object.entries(typeCounts).forEach(([typeKey, count]) => {
          row[lawTypesData[typeKey]] = count;
        });

        return row;
      }
    );

    const firstItem =
      justificationLawData[Object.keys(justificationLawData)[0]];
    const typeHeaders = Object.keys(firstItem).map(
      (typeKey) => lawTypesData[typeKey]
    );

    return (
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Моральное основание</Th>
              {typeHeaders.map((type) => (
                <Th key={type} isNumeric>
                  {type}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {tableRows.map((row) => (
              <Tr key={row.justification}>
                <Td>{row.justification}</Td>
                {typeHeaders.map((type) => (
                  <Td key={type}>{row[type]}</Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    );
  };

  const toggleViewMode = () => {
    setViewModeAnnotators(viewModeAnnotators === "graph" ? "table" : "graph");
  };

  const renderStatisticsGraph = () => {
    // Ensure that dateRangeData is available
    if (!dateRangeData) return null;

    return (
      <Box width="100%">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dateRangeData.user_document_counts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="user__username" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const MONTHS = [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ];

  const formatDateMonths = (dateString) => {
    const date = new Date(dateString);
    const month = MONTHS[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  const handleDownloadPdf = () => {
    // Assuming your Django endpoint for PDF generation is '/generate_statistics_pdf/'
    const options = {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
    };
    fetch(`${BASE_URL}/generate_statistics_pdf/`, options)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a link to download the PDF
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Statistics_Report.pdf`);

        // Append to the document and trigger download
        document.body.appendChild(link);
        link.click();

        // Clean up and remove the link
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => console.error("Error downloading PDF: ", error));
  };

  return (
    <Box>
      <Heading as="h1" size="xl" mb={7} textAlign="center">
        Статистика по документам
      </Heading>

      <Flex
        direction="row"
        justifyContent="space-around"
        p={6}
        boxShadow="lg"
        borderRadius="lg"
        bg="white.100"
        w="90%"
        mx="auto"
      >
        {" "}
        {/* Enlarged and centered Flex container */}
        {/* Total Texts */}
        <Stat textAlign="center">
          <StatLabel>Всего текстов</StatLabel>
          <StatNumber>{totalDocuments}</StatNumber>
        </Stat>
        {/* Total Marked Texts */}
        <Stat textAlign="center">
          <StatLabel>Размечено, не проверено</StatLabel>
          <StatNumber>{totalMarkedTexts}</StatNumber>
        </Stat>
        {/* Total Checked Texts */}
        <Stat textAlign="center">
          <StatLabel>Проверено</StatLabel>
          <StatNumber>{totalCheckedTexts}</StatNumber>
        </Stat>
        {/* Total Unmarked Texts */}
        <Stat textAlign="center">
          <StatLabel>Не размечено</StatLabel>
          <StatNumber>{totalUnmarkedTexts}</StatNumber>
        </Stat>
      </Flex>

      <Flex direction="column" align="center" justify="center" mt={5}>
        {/* Toggle Button */}
        <Stack direction="row" justify="flex-end" width="100%" mb={4}>
          <Button
            onClick={toggleDisplay}
            rightIcon={showGraph ? <FaTable /> : <FaChartBar />}
            mt={4}
          >
            {showGraph ? "Показать таблицу" : "Показать график"}
          </Button>
        </Stack>

        {/* Conditional Rendering of Tables or Graphs */}
        {showGraph ? renderBarCharts() : renderTables()}
      </Flex>

      <Box mt={5}>
        {/* Button to Open Modal */}
        <Flex justifyContent="flex-end" mb={3}>
          {viewMode === "graph" && (
            <Button onClick={onOpen} rightIcon={<SettingsIcon />} mr={4}>
              Настроить график
            </Button>
          )}
          <Button
            onClick={() =>
              setViewMode(viewMode === "graph" ? "table" : "graph")
            }
            rightIcon={viewMode === "graph" ? <FaTable /> : <FaChartBar />}
          >
            Показать {viewMode === "graph" ? "таблицу" : "график"}
          </Button>
        </Flex>
        {viewMode === "graph" ? (
          <ResponsiveContainer width="100%" height={300}>
            {data && (
              <BarChart width={900} height={300} data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="NPA" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#8884d8" name="NPA" />
              </BarChart>
            )}
            <Text align="center">
              По умолчанию график показывает 5 самых часто встречающихся НПА
            </Text>
          </ResponsiveContainer>
        ) : (
          <DataTable data={data.npa_counts} />
        )}
        {/* NPA Selection Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="5xl">
          <ModalOverlay />
          <ModalContent minWidth="600px">
            <ModalHeader>Выберите НПА:</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <CheckboxGroup onChange={handleNPAChange} value={selectedNPAs}>
                <SimpleGrid columns={[6, null, 2]} spacing="10px">
                  {npaOptions.map((npa, index) => (
                    <Checkbox key={index} value={npa}>
                      {npaMapping.find(([key, value]) => key === npa)[1] || npa}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>

      <Box width="100%" mt={14}>
        <Heading as="h3" size="md" textAlign="center" mb={4}>
          Загрузка документов по месяцам
        </Heading>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly_counts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={formatDateMonths} />
            <YAxis />
            <Tooltip content={<CustomTooltipMonths />} />
            <Bar dataKey="total" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box mt={14}>
        <Heading as="h3" size="md" textAlign="center" mb={4}>
          Загрузка документов по разметчикам
        </Heading>
        <Flex align="center">
          <Text mr={2}>От:</Text>
          <Input
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            flex="1"
            mr={3}
          />

          <Text mr={2}>До:</Text>
          <Input
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            flex="1"
            mr={3}
          />
          <Button
            ml={3}
            rightIcon={<TimeIcon />}
            onClick={() => fetchDateRangeStatistics(fromDate, toDate)}
          >
            Задать промежуток
          </Button>
          <Button
            ml={3}
            onClick={toggleViewMode}
            rightIcon={showGraph ? <FaTable /> : <FaChartBar />}
          >
            {viewModeAnnotators === "graph"
              ? "Показать таблицу"
              : "Показать график"}
          </Button>
        </Flex>
      </Box>
      {dateRangeData && (
        <Box mt={4}>
          <Text fontSize="xl" textAlign="center">
            За это время загрузили {dateRangeData.total_documents} новых норм
          </Text>
          {viewModeAnnotators === "graph"
            ? renderStatisticsGraph()
            : renderStatisticsTable()}
        </Box>
      )}

      {/* Таблица renderJustificationLawTypeTable */}
      <Box mt={14}>
        <Heading as="h3" size="md" textAlign="center" mb={4}>
          Таблица сопоставления типов норм и обоснований
        </Heading>
        {renderJustificationLawTypeTable()}
      </Box>

      <Box mt={4} align="right">
        <Button onClick={handleDownloadPdf} rightIcon={<DownloadIcon />}>
          Скачать отчет в PDF
        </Button>
      </Box>
    </Box>
  );
};

export default StatisticsPage;
