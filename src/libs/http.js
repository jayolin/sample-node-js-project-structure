import axios from "axios";
export const API_BASE_URL = "https://api.staging.youverify.co/v1";
export const ACCESS_TOKEN_KEY = process.env.YOUVERIFY_TOKEN;
const _http = (
  config = {
    bearer: true,
    tokenHeader: false,
    baseURL: API_BASE_URL,
    token: ACCESS_TOKEN_KEY
  }
) => {
  let http = axios.create({
    baseURL: `${config.baseURL}`,
    timeout: 300000 // 5 mins
  });
  // add bearer access_token
  if (config.bearer) {
    http.defaults.headers.common["Authorization"] = `Bearer ${config.token || "unsecure"}`;
  }

  // add token
  if (config.tokenHeader) {
    http.defaults.headers.common["token"] = `${config.token || "unsecure"}`;
  }
  // Add a request interceptor
  http.interceptors.request.use(
    function(config) {
      return config;
    },
    function(error) {
      return Promise.reject(error.response);
    }
  );
  // Add a response interceptor
  http.interceptors.response.use(
    function(response) {
      return response.data;
    },
    function(error) {
      return Promise.reject(error.response);
    }
  );

  return http;
};

export default _http;
