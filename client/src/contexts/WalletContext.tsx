import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { ethers } from "ethers";
import MetaMaskSDK from "@metamask/sdk";

interface WalletContextType {
  walletAddress: string | null;
  uid: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  role: string | null;
  status: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshUserData: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

let sdkInstance: MetaMaskSDK | null = null;
let ethereumProvider: any = null;

function getIsMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    const storedUid = localStorage.getItem("uid");
    const storedRole = localStorage.getItem("role");
    const storedStatus = localStorage.getItem("status");
    
    if (storedAddress) {
      setWalletAddress(storedAddress);
      setUid(storedUid);
      setRole(storedRole);
      setStatus(storedStatus);
    }

    const isMobile = getIsMobile();
    if (isMobile && !sdkInstance) {
      sdkInstance = new MetaMaskSDK({
        dappMetadata: {
          name: "HealthGuardX",
          url: window.location.host,
        },
        checkInstallationImmediately: false,
        preferDesktop: false,
      });
      ethereumProvider = sdkInstance.getProvider();
    }
  }, []);

  const connect = async () => {
    console.log("[HealthGuardX] Starting wallet connection...");
    const isMobile = getIsMobile();
    let provider: any;

    if (isMobile) {
      console.log("[HealthGuardX] Mobile device detected, using MetaMask SDK");
      if (!sdkInstance) {
        sdkInstance = new MetaMaskSDK({
          dappMetadata: {
            name: "HealthGuardX",
            url: window.location.host,
          },
          checkInstallationImmediately: false,
          preferDesktop: false,
        });
        ethereumProvider = sdkInstance.getProvider();
      }
      provider = ethereumProvider;
    } else {
      console.log("[HealthGuardX] Desktop device detected, checking for MetaMask extension");
      if (!window.ethereum) {
        console.error("[HealthGuardX] MetaMask not detected");
        const dappUrl = window.location.host;
        const deepLink = `https://metamask.app.link/dapp/${dappUrl}`;
        
        const userChoice = confirm(
          "MetaMask wallet not detected!\n\n" +
          "To use HealthGuardX, you need MetaMask:\n" +
          "1. Install MetaMask browser extension from metamask.io\n" +
          "2. OR open this page in MetaMask mobile app\n\n" +
          "Click OK to open MetaMask installation page"
        );
        
        if (userChoice) {
          window.open("https://metamask.io/download/", '_blank');
        }
        return;
      }
      console.log("[HealthGuardX] MetaMask extension found");
      provider = window.ethereum;
    }

    try {
      setIsConnecting(true);
      console.log("[HealthGuardX] Requesting account access...");
      
      const accounts = await provider.request({ 
        method: "eth_requestAccounts",
        params: []
      });
      const address = accounts[0];
      console.log("[HealthGuardX] Account connected:", address);
      
      console.log("[HealthGuardX] Authenticating with backend...");
      const response = await fetch(`/api/auth/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      if (!response.ok) {
        throw new Error(`Backend authentication failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("[HealthGuardX] Authentication successful:", { uid: data.uid, role: data.role });
      
      setWalletAddress(address);
      setUid(data.uid);
      setRole(data.role);
      setStatus(data.status);
      
      localStorage.setItem("walletAddress", address);
      localStorage.setItem("uid", data.uid);
      localStorage.setItem("role", data.role);
      localStorage.setItem("status", data.status);
      
      console.log("[HealthGuardX] Wallet connection complete!");
    } catch (error: any) {
      console.error("[HealthGuardX] Wallet connection error:", error);
      
      let errorMessage = "Wallet connection failed";
      
      if (error.code === 4001) {
        errorMessage = "You rejected the connection request. Please try again and approve the connection.";
      } else if (error.message?.includes("Backend authentication failed")) {
        errorMessage = "Server authentication failed. Please try again or contact support.";
      } else if (isMobile) {
        errorMessage = "Please open this page in MetaMask mobile app or install MetaMask";
      } else {
        errorMessage = `Connection error: ${error.message || "Unknown error"}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWalletAddress(null);
    setUid(null);
    setRole(null);
    setStatus(null);
    
    localStorage.removeItem("walletAddress");
    localStorage.removeItem("uid");
    localStorage.removeItem("role");
    localStorage.removeItem("status");
  };

  const refreshUserData = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`/api/auth/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (response.ok) {
        const data = await response.json();
        setUid(data.uid);
        setRole(data.role);
        setStatus(data.status);
        
        localStorage.setItem("uid", data.uid);
        localStorage.setItem("role", data.role);
        localStorage.setItem("status", data.status);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    const isMobile = getIsMobile();
    const provider = isMobile && ethereumProvider ? ethereumProvider : window.ethereum;
    
    if (!provider) throw new Error("No wallet connected");
    
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    return await signer.signMessage(message);
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        uid,
        role,
        status,
        isConnected: !!walletAddress,
        isConnecting,
        connect,
        disconnect,
        refreshUserData,
        signMessage,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
