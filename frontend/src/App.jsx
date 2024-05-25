import React from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Link as ChakraLink,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
} from "@chakra-ui/react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ChevronDownIcon, EmailIcon, LockIcon } from "@chakra-ui/icons";
import DocumentListPage from "./DocumentList.jsx";
import IndexPage from "./Index.jsx";
import DocumentDetailPage from "./DocumentDetail/DocumentDetail.jsx";
import ExportMenu from "./DatasetExport.jsx";
import DocumentCreationPage from "./DocumentCreationPage.jsx";
import DocumentEdit from "./DocumentEdit.jsx";
import "./index.css";
import { UserProvider, useUser } from "./UserProvider.jsx";
import PrivateComponent from "./PrivateComponent.jsx";
import { BASE_URL } from "./apiRequest.jsx";
import Statistics from "./Statistics.jsx";
import GenerateClassification from "./GenerateClassification.jsx"

const NavBar = () => {
  const { user, setUser } = useUser();

  const login = async (event) => {
    event.preventDefault();

    const username = event.target.elements.username.value;
    const password = event.target.elements.password.value;

    // send request to Django backend
    const response = await fetch(`${BASE_URL}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      // if login is successful, update the user state
      const data = await response.json();
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      setUser({ username });
    } else {
      const errorData = await response.json();
      console.error(errorData.detail);
    }

    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("userData");
    setUser(null);

    window.location.reload();
  };

  const isAuthenticated = () => {
    return localStorage.getItem("access") && localStorage.getItem("refresh");
  };

  return (
    <Box bg="gray.800" color="white" p={4}>
      <Flex>
        <HStack as="nav" spacing="5">
          <ChakraLink href="/" color="white">
            <Button variant="nav">Главная</Button>
          </ChakraLink>
          <ChakraLink href="/document_list" color="white">
            <Button variant="nav">Все документы</Button>
          </ChakraLink>

          {isAuthenticated() && (
            <>
              <ChakraLink href="/documents/create" color="white">
                <Button variant="nav">Добавить документ</Button>
              </ChakraLink>
              {/* <ChakraLink href="/documents/generate" color="white">
                <Button variant="nav">Сгенерировать</Button>
              </ChakraLink> */}
              <ChakraLink href="/statistics" color="white">
                <Button variant="nav">Статистика</Button>
              </ChakraLink>
              <ChakraLink href="/admin" color="white">
                <Button variant="nav">Администрирование</Button>
              </ChakraLink>
              <ChakraLink href="/documents/generate" color="white">
                <Button variant="nav">Модель Автоклассификации</Button>
              </ChakraLink>
            </>
          )}
        </HStack>
        <Spacer />
        <HStack spacing="5">
          <ExportMenu />
          <Menu>
            {user ? (
              <>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} ml={4}>
                  {user.username}
                </MenuButton>
                <MenuList>
                  <MenuItem color="red" onClick={logout}>
                    Выйти
                  </MenuItem>
                </MenuList>
              </>
            ) : (
              <>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} ml={4}>
                  Войти
                </MenuButton>
                <MenuList minWidth="300px">
                  <Box p={4}>
                    <form onSubmit={login}>
                      <InputGroup>
                        <InputLeftElement
                          pointerEvents="none"
                          children={<EmailIcon color="gray.300" />}
                        />
                        <Input
                          type="text"
                          name="username"
                          placeholder="Username"
                          color="black"
                        />
                      </InputGroup>
                      <InputGroup mt={4}>
                        <InputLeftElement
                          pointerEvents="none"
                          children={<LockIcon color="gray.300" />}
                        />
                        <Input
                          type="password"
                          name="password"
                          placeholder="Password"
                          color="black"
                        />
                      </InputGroup>
                      <Button colorScheme="green" type="submit" mt={4}>
                        Войти
                      </Button>
                    </form>
                  </Box>
                </MenuList>
              </>
            )}
          </Menu>
        </HStack>
      </Flex>
    </Box>
  );
};

const App = () => {
  return (
    <UserProvider>
      <Router>
        <NavBar />
        <Container maxW="container.lg" mt={4} mb={6}>
          <Routes>
            <Route element={<PrivateComponent />}>
              <Route
                path="/documents/create"
                element={<DocumentCreationPage />}
              />
              <Route
                path="/documents/generate"
                element={<GenerateClassification />}
              />
              <Route path="/edit_document/:id" element={<DocumentEdit />} />
            </Route>
            <Route
              path="/document_detail/:id"
              element={<DocumentDetailPage />}
            />
            <Route path="/" element={<IndexPage />} />
            <Route path="/document_list" element={<DocumentListPage />} />
            <Route path="/statistics" element={<Statistics />} />
          </Routes>
        </Container>
      </Router>
    </UserProvider>
  );
};

export default App;
