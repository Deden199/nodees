const API_BASE_URL = "https://us-central1-ajudan-tampan.cloudfunctions.net";

export const API_ENDPOINTS = {
  createTokenMainnet: `${API_BASE_URL}/createTokenMainnet`,
  createTokenTestnet: `${API_BASE_URL}/createTokenTestnet`,
  fundWallet: `${API_BASE_URL}/fundWallet`,
  generateMainnetWallet: `${API_BASE_URL}/generateMainnetWallet`,
};
