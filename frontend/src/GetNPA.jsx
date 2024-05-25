import { useState, useEffect } from "react";
import apiRequest from "./apiRequest";

const TTL = 24 * 60 * 60 * 1000; // One day in milliseconds

const useGetNPA = () => {
  const [npaMapping, setNpaMapping] = useState(null);
  const [npaLoading, setNpaLoading] = useState(true);
  const [npaError, setNpaError] = useState(null);

  useEffect(() => {
    const fetchNpaList = async () => {
      const cachedData = localStorage.getItem("npaMapping");
      const cacheExpireTime = localStorage.getItem("npaMappingExpire");
      const now = Date.now();

      if (cachedData && cacheExpireTime && now < cacheExpireTime) {
        setNpaMapping(JSON.parse(cachedData));
        setNpaLoading(false);
        return;
      }

      try {
        const response = await apiRequest("npa_list/", "GET");
        const data = response["npa"];
        localStorage.setItem("npaMapping", JSON.stringify(data));
        localStorage.setItem("npaMappingExpire", now + TTL);
        setNpaMapping(data);
      } catch (error) {
        setNpaError(error);
      } finally {
        setNpaLoading(false);
      }
    };

    fetchNpaList();
  }, []);

  return { npaMapping, npaLoading, npaError };
};

export default useGetNPA;
